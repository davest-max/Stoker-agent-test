import { useMemo, useRef, useState } from "react";
import {
  Popover,
  Menu,
  Select,
  Input,
  Button,
  ListItem,
  FavoriteButton,
  Label,
  Tooltip,
  CHANNEL_ACCENT,
  PhoneInput,
  PHONE_COUNTRIES,
  isPhoneNumberComplete,
  type ChannelType,
  type CreateNewOutboundContact,
  type CreateNewOutboundGroup,
  type CreateNewChannelOption,
  type PhoneValue,
  type MenuEntry,
} from "@nicecxone/lyra-ui";
import { Plus, ChevronLeft, ChevronRight, X, User, Headset, Route, UsersRound, Building2, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT_CHANNEL_ORDER, CONTACT_CHANNEL_ICON, CONTACT_CHANNEL_LABEL } from "@/components/DirectoryPage";
import { contactMatchesQuery } from "@/data/directory";

/* ── NewOutboundPopover ──
 * Local replacement for lyra-ui's `CreateNew` (outbound flow), built to the
 * "New Outbound" Figma reference (Stoker file, node 4326:1090 — see
 * PROJECT_SUMMARY-adjacent notes in this repo's CLAUDE.md for why this
 * isn't just a `CreateNew` config): a multi-select category dropdown (zero
 * selected reads as "search every category", categorized results grouped by
 * origin whenever more than one group is in scope), a unified "channel
 * select" screen shared by both the matched-contact flow
 * and the unmatched phone/email flow, and individual per-channel icon
 * buttons (not a channel dropdown) with selected/unselected states.
 * `lyra-ui/create-new.tsx` itself is untouched — see this repo's CLAUDE.md
 * ("never modify a lyra-ui core component from here"). */

/* Hidden for user testing only — re-enable by flipping this back to true.
 * Skill selection stays fully wired underneath (state, onStart signature,
 * recent-skills tracking) so this is a pure visibility toggle, not a removal. */
const SHOW_SKILL_SELECTION = false;

/* ── Types ── */

export interface NewOutboundConfig {
  groups: CreateNewOutboundGroup[];
  channelOptions: CreateNewChannelOption[];
  phoneOptions: { value: string; label: string }[];
  skillOptions: { value: string; label: string }[];
  onStartCall: (selection: {
    contact: CreateNewOutboundContact;
    channel: ChannelType;
    phone: string;
    skillId: string;
  }) => void;
  /** Fired from the unified detail screen when no contact was matched —
   *  since there's no real contact to attach, just whatever phone/email
   *  text was typed. */
  onStartUnmatchedOutbound?: (input: { channel: ChannelType; value: string; skillId: string }) => void;
  /** Fired instead of the normal outbound flow when the agent clicks the
   *  "chat" hover-icon on an Agents-group row — agent-to-agent chat is
   *  internal chat (same window/thread as the header's Internal Chat
   *  icon), not an outbound customer channel, so it skips the detail
   *  screen entirely. `agentId` is the row's `CreateNewOutboundContact.id`,
   *  which for the Agents group is the same id as its `DirectoryAgent`
   *  record. `clickPosition` is the icon click's viewport coordinates —
   *  used to open Internal Chat floating near the agent's mouse when it
   *  isn't already open somewhere. Omitted (or the row's contact isn't
   *  `kind: "agent"`) falls back to the normal outbound detail screen. */
  onOpenInternalChat?: (agentId: string, clickPosition: { x: number; y: number }) => void;
}

export interface NewOutboundPopoverProps {
  title?: string;
  expanded?: boolean;
  outbound: NewOutboundConfig;
}

/** `contact: null` is the unmatched flow — `query` carries the typed
 *  phone/email value through to the detail screen in place of a contact.
 *  `initialChannel` — set when the agent clicked one of a row's own hover-
 *  revealed channel icons (see `ContactRow`) instead of the row itself, so
 *  the detail screen opens with that channel (and its address) already
 *  selected rather than landing on "pick a channel first". */
type Screen =
  | { kind: "browse" }
  | { kind: "detail"; contact: CreateNewOutboundContact | null; query: string; initialChannel?: ChannelType };

/** Digits typed before the dial pad bothers checking for a directory match
 *  — below this, almost every number would substring-match something and
 *  the suggestion would just be noise. Not real validation, just a
 *  reasonable "enough to be meaningful" threshold. */
const DIAL_PAD_MATCH_MIN_DIGITS = 6;

/* ── Helpers ── */

/** Single synthesized email/WhatsApp address per contact — mirrors
 *  lyra-ui's own `defaultDetailValueFor` (email/WhatsApp are a single
 *  derived value, not a list; only voice/SMS pick from `phoneOptions`). */
function defaultAddressFor(contact: CreateNewOutboundContact, channel: ChannelType): string {
  if (channel === "email") return `${contact.name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
  if (channel === "whatsapp") return `@${contact.name}`;
  return "";
}

const CHANNEL_ACTION_LABEL: Record<ChannelType, string> = {
  voice: "Start Call",
  sms: "Start SMS",
  whatsapp: "Start WhatsApp",
  email: "Start Email",
  chat: "Start Chat",
};

const ADDRESS_FIELD_LABEL: Record<ChannelType, string> = {
  voice: "Phone Number",
  sms: "Phone Number",
  whatsapp: "WhatsApp Number",
  email: "Email Address",
  chat: "Chat Handle",
};

/** Very loose heuristics, only used to decide which channel buttons are
 *  enabled for an unmatched phone/email — not real validation. */
function looksLikeEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value);
}
function looksLikePhone(value: string): boolean {
  return /\d{3,}/.test(value);
}

/** Channels worth offering for a typed value with no directory match.
 *  Falls back to every configured channel if the value doesn't clearly
 *  look like either a phone number or an email, so the agent is never
 *  stuck with zero enabled buttons. */
function eligibleChannelsForQuery(query: string, allChannels: ChannelType[]): ChannelType[] {
  const email = looksLikeEmail(query);
  const phone = looksLikePhone(query);
  if (!email && !phone) return allChannels;
  return allChannels.filter((c) => {
    if (c === "email") return email;
    if (c === "voice" || c === "sms" || c === "whatsapp") return phone;
    return false;
  });
}

/* ── Contact avatar + row ──
 * `kind` icon — same icon-per-kind convention DirectoryPage already
 * established (User/Headset/Route/UsersRound for customer/agent/skill/
 * team), plus Building2 for "external" (partner/vendor directory
 * contacts). DirectoryPage can rely on its own tabs to make "everything in
 * this list is a Skill" obvious; this popover mixes kinds in the same list
 * (Favorites spans every kind, and the "All" search groups them but still
 * scrolls together), so each row needs its own cue.
 * Rendered as its own small glyph just left of the initials circle —
 * NOT overlaid/clipped into the circle itself (an earlier corner-badge
 * version sat right where a presence/status dot conventionally goes, and
 * read as one even moved to the opposite corner — sitting fully outside
 * the circle avoids that read entirely, at the cost of a couple extra
 * pixels of row width). */

const CONTACT_KIND_ICON: Record<NonNullable<CreateNewOutboundContact["kind"]>, typeof User> = {
  customer: User,
  agent: Headset,
  skill: Route,
  team: UsersRound,
  external: Building2,
};

function ContactAvatar({ contact }: { contact: CreateNewOutboundContact }) {
  const KindIcon = contact.kind ? CONTACT_KIND_ICON[contact.kind] : null;
  return (
    <div className="flex shrink-0 items-center gap-1">
      {KindIcon && (
        <KindIcon
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 text-lyra-fg-secondary"
          strokeWidth={1.5}
        />
      )}
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full lyra-body-sm-emphasis", contact.avatarClassName)}>
        {contact.initials}
      </div>
    </div>
  );
}

function ContactRow({
  contact,
  favorited,
  onToggleFavorite,
  onClick,
  onSelectChannel,
}: {
  contact: CreateNewOutboundContact;
  favorited: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
  /** Row-level shortcut — picking a channel from the row's own flyout menu
   *  (see the chevron trigger below) skips the "pick a channel" step on the
   *  detail screen entirely, landing there with that channel (and its
   *  address) already selected. Works unchanged across every contact kind
   *  shown here (customer/agent/skill/team/external), since `channels` is
   *  on the shared `CreateNewOutboundContact` shape all of them synthesize
   *  into. `position` stands in for a click coordinate (a `Menu` item's
   *  `onClick` carries no event) — needed for the Agents "chat" entry,
   *  which opens Internal Chat floating near this row's own trigger rather
   *  than at a fixed anchor. */
  onSelectChannel: (channel: ChannelType, position: { x: number; y: number }) => void;
}) {
  // Was previously six-ish icon buttons revealed inline in the row's own
  // trailing slot on hover — at this row's width that regularly clipped
  // longer contact names before the icons even finished animating in (see
  // the reference PNG this was rebuilt from). Now just a chevron trigger;
  // the channel choices themselves live in a `Popover`+`Menu` flyout to the
  // row's right (composition over reimplementation — CLAUDE.md/
  // CONTRIBUTING.md §1), opened on hover of either the row or the trigger
  // itself, same reveal trigger as before, just relocated outside the row's
  // own layout so it can no longer compete with the name/subtitle for
  // width.
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const visibleChannels = CONTACT_CHANNEL_ORDER.filter((type) => contact.channels.includes(type));

  const channelMenuItems: MenuEntry[] = visibleChannels.map((type) => {
    const Icon = CONTACT_CHANNEL_ICON[type];
    return {
      id: type,
      label: CONTACT_CHANNEL_LABEL[type],
      icon: <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />,
      onClick: () => {
        setChannelMenuOpen(false);
        const rect = triggerRef.current?.getBoundingClientRect();
        onSelectChannel(type, rect ? { x: rect.left, y: rect.top } : { x: 0, y: 0 });
      },
    };
  });

  return (
    <ListItem
      className="group/row"
      onClick={onClick}
      onMouseEnter={() => setChannelMenuOpen(true)}
      onMouseLeave={() => setChannelMenuOpen(false)}
      leading={<ContactAvatar contact={contact} />}
      title={contact.name}
      subtitle={contact.subtitle}
      trailing={
        <div className="flex items-center gap-1">
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton favorited={favorited} onClick={onToggleFavorite} label={contact.name} placement="left" />
          </div>
          {visibleChannels.length > 0 && (
            <div onClick={(e) => e.stopPropagation()}>
              <Popover
                open={channelMenuOpen}
                onOpenChange={setChannelMenuOpen}
                placement="right"
                align="start"
                sideOffset={4}
                showArrow={false}
                className="w-auto"
                content={
                  // Own hover handlers — the flyout is portaled outside this
                  // row's DOM subtree, so without these, moving the cursor
                  // off the row and onto the menu (crossing the small gap
                  // between them) would read as "left the row" and close it
                  // before the click ever lands.
                  <div onMouseEnter={() => setChannelMenuOpen(true)} onMouseLeave={() => setChannelMenuOpen(false)}>
                    <Menu aria-label={`Channels for ${contact.name}`} items={channelMenuItems} />
                  </div>
                }
              >
                <button
                  ref={triggerRef}
                  type="button"
                  aria-label={`Channels for ${contact.name}`}
                  aria-haspopup="menu"
                  aria-expanded={channelMenuOpen}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </Popover>
            </div>
          )}
        </div>
      }
    />
  );
}

/* ── Channel icon button — unselected stays in its own soft accent tint
 *  (per CHANNEL_ACCENT) at ~70% opacity. Selected used to only add a ring on
 *  top of that same soft tint — user testing found agents weren't reliably
 *  noticing which channel was picked, so selected now flips to a solid,
 *  "strong" fill in that channel's own accent color with a white icon (same
 *  solid-fill treatment as LiveVoiceCallBar's Hold/Record selected states —
 *  see that file), plus the ring on top as reinforcement, not the whole
 *  signal. Disabled (channel not offered for this contact/value) drops
 *  further and blocks interaction. The `label` prop is also rendered as a
 *  small caption underneath — color alone still isn't enough to tell
 *  channels apart at a glance, per an earlier follow-up request. ── */

// No "strong" background token exists on `CHANNEL_ACCENT` itself (only
// text/border) — this is the one place that needs solid fills, so it's its
// own small map rather than adding a rarely-used field to that shared type.
const CHANNEL_SELECTED_BG: Record<ChannelType, string> = {
  voice: "bg-lyra-accent-purple-strong",
  sms: "bg-lyra-accent-lime-strong",
  whatsapp: "bg-lyra-accent-green-strong",
  email: "bg-lyra-accent-pink-strong",
  chat: "bg-lyra-accent-teal-strong",
};

function ChannelIconButton({
  channel,
  icon,
  label,
  selected,
  disabled,
  onClick,
}: {
  channel: ChannelType;
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const accent = CHANNEL_ACCENT[channel];
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        aria-label={label}
        aria-pressed={selected}
        disabled={disabled}
        onClick={onClick}
        title={label}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lyra-md border transition-all",
          selected
            ? cn(CHANNEL_SELECTED_BG[channel], "border-transparent text-lyra-fg-on-primary opacity-100 ring-2 ring-lyra-border-active ring-offset-2")
            : cn(accent.bg, accent.border, accent.text, "opacity-70 hover:opacity-100"),
          disabled && "opacity-30 pointer-events-none"
        )}
      >
        {icon}
      </button>
      <span
        aria-hidden="true"
        className={cn(
          selected ? "lyra-body-xs-emphasis text-lyra-fg-default" : "lyra-body-xs text-lyra-fg-secondary",
          disabled && "text-lyra-fg-disabled"
        )}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Unified detail screen — shared by the matched-contact flow
 *  (`contact` set) and the unmatched phone/email flow (`contact: null`,
 *  `query` carries the typed value). Same layout either way per the Figma
 *  reference: channel icon buttons → address field → outbound skill →
 *  dynamic "Start {Channel}" button. ── */

function OutboundDetailScreen({
  contact,
  query,
  preselectedChannel,
  channelOptions,
  phoneOptions,
  skillOptions,
  recentSkillOptions,
  disabledChannels,
  onStart,
}: {
  contact: CreateNewOutboundContact | null;
  query: string;
  /** Set when the agent clicked a channel icon directly on the contact's
   *  row (see `ContactRow`/`onSelectChannel`) instead of the row itself —
   *  skips straight past "pick a channel first" below. Matched-contact
   *  flow only; the unmatched flow derives its own initial channel from
   *  `query` regardless of this prop (see `initialChannel` below). */
  preselectedChannel?: ChannelType;
  channelOptions: CreateNewChannelOption[];
  phoneOptions: { value: string; label: string }[];
  skillOptions: { value: string; label: string }[];
  /** Last 3 outbound skills the agent picked, most-recent-first — surfaced
   *  as a "Recent" section at the top of the skill dropdown. Empty until
   *  the agent has started at least one outbound interaction with a skill
   *  selected. */
  recentSkillOptions: { value: string; label: string }[];
  /** Channel types to disable regardless of what the contact/query would
   *  otherwise allow — used by `AddOutboundButton` below to block starting
   *  a duplicate of a channel that's already live on this same interaction
   *  (e.g. a second simultaneous Call), separate from whether the contact
   *  supports that channel at all. */
  disabledChannels?: ChannelType[];
  onStart: (channel: ChannelType, addressValue: string, skillId: string) => void;
}) {
  const enabledChannels = (contact
    ? contact.channels
    : eligibleChannelsForQuery(query, channelOptions.map((c) => c.id))
  ).filter((c) => !disabledChannels?.includes(c));

  // A matched contact's own labeled numbers/addresses (Mobile/Home/Work,
  // Work/Personal — see `CreateNewOutboundContact.phoneNumbers`/
  // `emailAddresses`'s own doc comments) take priority over the outbound
  // config's shared fallbacks: `phoneOptions` (one global list every
  // contact used to pick from) for voice/SMS, and the single synthesized
  // `defaultAddressFor` value for email. A contact with just one number/
  // address on file can still omit these and use the fallback — nothing
  // requires every contact to carry a full labeled list. Declared before
  // the `useState` calls below since their lazy initializers close over
  // these (via `addressForChannel`) on first render.
  const contactPhoneOptions = contact?.phoneNumbers?.length ? contact.phoneNumbers : phoneOptions;
  const contactEmailOptions = contact?.emailAddresses?.length ? contact.emailAddresses : undefined;

  /* Matched flow: `preselectedChannel` from a row's own channel icon.
   * Unmatched flow: a typed value that's clearly a phone number or email
   * address skips the "pick a channel" step the same way — preselect
   * voice/email so the address field is already populated and the agent
   * just needs an outbound skill to start. Ambiguous free text (no match,
   * but also not phone/email-shaped) still lands with nothing selected. */
  const initialChannel: ChannelType | null = contact
    ? preselectedChannel ?? null
    : looksLikeEmail(query)
      ? "email"
      : looksLikePhone(query)
        ? "voice"
        : null;

  /** Same address-for-channel logic on both the initial (pre-selected) and
   *  every subsequent manual pick — one definition instead of two copies
   *  that could drift. */
  const addressForChannel = (channel: ChannelType): string => {
    if (!contact) return query;
    if (channel === "voice" || channel === "sms") return contactPhoneOptions[0]?.value ?? "";
    if (channel === "email" && contactEmailOptions) return contactEmailOptions[0].value;
    return defaultAddressFor(contact, channel);
  };

  const [selectedChannel, setSelectedChannel] = useState<ChannelType | null>(initialChannel);
  const [addressValue, setAddressValue] = useState(initialChannel ? addressForChannel(initialChannel) : "");
  const [skillId, setSkillId] = useState("");

  const handlePickChannel = (channel: ChannelType) => {
    setSelectedChannel(channel);
    setAddressValue(addressForChannel(channel));
  };

  const isPhoneSelect = contact && (selectedChannel === "voice" || selectedChannel === "sms");
  const isEmailSelect = contact && selectedChannel === "email" && !!contactEmailOptions;
  const addressOptions = isPhoneSelect
    ? contactPhoneOptions
    : isEmailSelect
      ? contactEmailOptions!
      : addressValue
        ? [{ value: addressValue, label: addressValue }]
        : [];

  const canStart = !!selectedChannel && !!addressValue && (!SHOW_SKILL_SELECTION || !!skillId);

  // "Recent" section up top (last 3 skills used, most-recent-first) plus
  // everything else beneath — recent skills stay in the full list too, so
  // the section is purely a shortcut, not a filter. Omitted entirely until
  // the agent has a usage history.
  const recentSkillIdSet = new Set(recentSkillOptions.map((o) => o.value));
  const skillOptionGroups = recentSkillOptions.length
    ? [
        { label: "Recent", options: recentSkillOptions },
        { label: "All Skills", options: skillOptions.filter((o) => !recentSkillIdSet.has(o.value)) },
      ]
    : undefined;

  return (
    <div className="flex flex-col gap-5 p-4">
      {!contact && (
        <p className="lyra-body-sm text-lyra-fg-secondary text-center">No match found in directory</p>
      )}

      <div className="flex flex-col gap-2">
        <Label label="Select Channel" />
        <div className="flex items-center justify-center gap-6 px-6">
          {channelOptions.map((option) => (
            <ChannelIconButton
              key={option.id}
              channel={option.id}
              icon={option.icon}
              label={option.label}
              selected={selectedChannel === option.id}
              disabled={!enabledChannels.includes(option.id)}
              onClick={() => handlePickChannel(option.id)}
            />
          ))}
        </div>
      </div>

      {contact ? (
        <Select
          label={
            selectedChannel === "email"
              ? "Select Email Address"
              : selectedChannel === "whatsapp"
                ? "Select WhatsApp Handle"
                : "Select Phone"
          }
          value={addressValue}
          onValueChange={setAddressValue}
          options={addressOptions}
          disabled={!selectedChannel}
          placeholder={selectedChannel ? undefined : "Select a channel first"}
          portalDropdown
        />
      ) : (
        <Input
          label={selectedChannel ? ADDRESS_FIELD_LABEL[selectedChannel] : "Value"}
          value={addressValue}
          onChange={(e) => setAddressValue(e.target.value)}
          disabled={!selectedChannel}
          placeholder={selectedChannel ? undefined : "Select a channel first"}
        />
      )}

      {SHOW_SKILL_SELECTION && (
        <Select
          label="Select outbound skill"
          placeholder="Select outbound skill"
          value={skillId}
          onValueChange={setSkillId}
          options={skillOptions}
          optionGroups={skillOptionGroups}
          searchable
          portalDropdown
        />
      )}

      <Button
        variant="default"
        className="w-full"
        disabled={!canStart}
        onClick={() => selectedChannel && onStart(selectedChannel, addressValue, skillId)}
      >
        {selectedChannel ? CHANNEL_ACTION_LABEL[selectedChannel] : "Start Interaction"}
      </Button>
    </div>
  );
}

/* ── AddOutboundButton ──
 * The interaction header's "+" (next to the Chat tab, see
 * CustomerInteractionPanel.tsx's InteractionHeader) — starts another
 * channel with the customer already open on this interaction, without
 * leaving the card the way the left-nav's own `NewOutboundPopover` above
 * would (that one always starts from a blank contact search). Skips
 * straight to `OutboundDetailScreen` for the known `contact` — no browse
 * screen behind it, so there's no back arrow, and no "No match found"
 * branch either (the contact is always on hand here, never `null`).
 * Anchored to its own trigger (not the left-nav's), same as any other
 * `Popover`-based control in this file. */

export interface AddOutboundButtonProps {
  contact: CreateNewOutboundContact;
  channelOptions: CreateNewChannelOption[];
  phoneOptions: { value: string; label: string }[];
  skillOptions: { value: string; label: string }[];
  /** Channel types already open on this interaction (e.g. the customer's
   *  live Chat) — disabled in the picker so the agent can't start a
   *  redundant second one of the same type. See `OutboundDetailScreen`'s
   *  own `disabledChannels` doc comment. */
  openChannelTypes?: ChannelType[];
  onStart: (channel: ChannelType, addressValue: string, skillId: string) => void;
  className?: string;
}

export function AddOutboundButton({
  contact,
  channelOptions,
  phoneOptions,
  skillOptions,
  openChannelTypes,
  onStart,
  className,
}: AddOutboundButtonProps) {
  const [open, setOpen] = useState(false);

  const header = (
    <div className="flex items-center justify-between border-b border-lyra-border-subtle px-4 py-4">
      <div className="flex min-w-0 items-center gap-2">
        <ContactAvatar contact={contact} />
        <p className="lyra-heading-sm text-lyra-fg-default truncate">
          New Outbound · {contact.name}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
      >
        <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <Tooltip content="Add Outbound" placement="bottom" asLabel>
      <span className="inline-flex">
        <Popover
          open={open}
          onOpenChange={setOpen}
          placement="bottom"
          align="start"
          sideOffset={4}
          maxWidth="320px"
          maxHeight="520px"
          // `z-[10003]`, not the baseline `z-[9999]` — matches the tier
          // lyra-ui's own `OutboundAddButton` uses (see its own doc comment
          // in create-new.tsx) for a "+" that can end up nested inside
          // another `z-[9999]` popover. Not currently nested anywhere in
          // this app, just cheap insurance if a future caller (e.g.
          // `InteractionNavItem.headerAction`) renders this inside one —
          // higher than strictly needed here, never lower.
          // it strictly needs to be there.
          className="z-[10003] w-[320px]"
          header={header}
          content={
            <OutboundDetailScreen
              contact={contact}
              query=""
              channelOptions={channelOptions}
              phoneOptions={phoneOptions}
              skillOptions={skillOptions}
              recentSkillOptions={[]}
              disabledChannels={openChannelTypes}
              onStart={(channel, addressValue, skillId) => {
                onStart(channel, addressValue, skillId);
                setOpen(false);
              }}
            />
          }
        >
          <button
            type="button"
            aria-label="Add Outbound"
            aria-haspopup="true"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
              className
            )}
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </Popover>
      </span>
    </Tooltip>
  );
}

/* ── Root ── */

// Seeded so the popover never opens to an empty, unconvincing "Favorites"
// screen during a demo — a handful of agents an outbound skill and a
// customer, favorited from the start. Real favoriting is still fully
// agent-driven from here on (see `toggleFavorite` below); this is just the
// starting state, not a pinned/can't-remove list. IDs match `directory.ts`
// seed data (`DIRECTORY_AGENTS`/`DIRECTORY_SKILLS`/`DIRECTORY_CUSTOMERS`).
const DEFAULT_FAVORITE_IDS = ["john-smith", "amara", "diego", "lena", "tomas", "vip-support", "sofia"];

export function NewOutboundPopover({ title = "New Outbound", expanded = false, outbound }: NewOutboundPopoverProps) {
  const [open, setOpen] = useState(false);
  // Multi-select category filter — purely explicit now: a category is
  // searched only while it's checked, full stop (no more "0 selected reads
  // as search everything" sentinel behavior). A "Select All" row in the
  // dropdown itself (see `showSelectAll` below) covers the "search
  // everything" case instead of an implicit empty-selection meaning.
  // Defaults to Favorites alone so the popover always opens on a populated,
  // relevant view instead of an empty "select a category" prompt. Not reset
  // on close after that, same "leave it as the agent left it" convention as
  // `search` below.
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(["favorites"]);
  // Dial Pad is a mode switch (swaps the whole body for a phone field), not a
  // filterable category, so it's its own flag rather than a synthetic value
  // hiding inside the category selection — see its own doc comment further
  // down at the `content` branch that reads this.
  const [dialPadActive, setDialPadActive] = useState(false);
  const [search, setSearch] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(DEFAULT_FAVORITE_IDS));
  const [screen, setScreen] = useState<Screen>({ kind: "browse" });
  // Last 3 outbound skills the agent has started an interaction with,
  // most-recent-first — surfaced as a "Recent" shortcut section in the
  // "Select outbound skill" dropdown.
  const [recentSkillIds, setRecentSkillIds] = useState<string[]>([]);
  // Dial Pad group's own field — same PhoneValue shape PhoneInput already
  // uses everywhere else, kept lifted here (not local to a sub-component)
  // so it isn't lost if this popover re-renders. Not reset when the popover
  // closes/reopens — same "leave it as the agent left it" behavior the
  // browse screen's own `search` field doesn't get reset for either, except
  // `resetAndClose` below explicitly clears both.
  const [dialpadPhone, setDialpadPhone] = useState<PhoneValue>({
    countryCode: PHONE_COUNTRIES[0].code,
    number: "",
  });

  const recordRecentSkill = (skillId: string) => {
    if (!skillId) return;
    setRecentSkillIds((prev) => [skillId, ...prev.filter((id) => id !== skillId)].slice(0, 3));
  };

  // The single group to treat specially when exactly one category is
  // explicitly checked — preserves the old single-select behavior exactly
  // (flat contact list, no section header, that group's own
  // `searchPlaceholder`/`emptyMessage`) for what's still the common case.
  const singleSelectedGroup =
    selectedCategoryIds.length === 1 ? outbound.groups.find((g) => g.id === selectedCategoryIds[0]) ?? null : null;

  const allContacts = useMemo(
    () => outbound.groups.filter((g) => (g.kind ?? "contacts") === "contacts").flatMap((g) => g.contacts ?? []),
    [outbound.groups]
  );

  // Dial Pad — same `isPhoneNumberComplete` per-country digit-count check
  // PhoneInput uses internally for its own validation error, reused here to
  // gate the "Dial Number" button (matches lyra-ui's own CreateNew dialpad
  // group). `dialpadMatch` is the one new thing beyond that: once enough
  // digits are in, check the raw number against every contact's phone
  // numbers the same way the main search box already does (see
  // `contactMatchesQuery`'s own "matches by phone number too" note) — a hit
  // surfaces as a tappable suggestion below the field (see `content` below).
  const dialpadCountry = PHONE_COUNTRIES.find((c) => c.code === dialpadPhone.countryCode) ?? PHONE_COUNTRIES[0];
  const isDialpadNumberValid = isPhoneNumberComplete(dialpadPhone.number, dialpadCountry);
  const dialpadMatch =
    dialpadPhone.number.length >= DIAL_PAD_MATCH_MIN_DIGITS
      ? allContacts.find((c) => contactMatchesQuery(c, dialpadPhone.number))
      : undefined;

  const handleQuickDial = () => {
    if (!isDialpadNumberValid) return;
    const fullNumber = `${dialpadCountry.dial}${dialpadPhone.number}`;
    // Same match `dialpadMatch`'s own suggestion row would route to
    // deliberately — pressing "Dial Number" directly while a match is
    // showing shouldn't quietly downgrade to an anonymous call just
    // because the agent didn't tap the suggestion. Still dials the exact
    // digits typed (not the contact's own on-file number, in case they
    // differ in some edge case); the only thing the match changes is which
    // callback fires, so the resulting interaction is attributed to that
    // real customer/agent instead of showing up as a bare phone number.
    if (dialpadMatch) {
      outbound.onStartCall({ contact: dialpadMatch, channel: "voice", phone: fullNumber, skillId: "" });
    } else {
      outbound.onStartUnmatchedOutbound?.({ channel: "voice", value: fullNumber, skillId: "" });
    }
    resetAndClose();
  };

  const query = search.trim().toLowerCase();

  // Which groups are in scope: only whatever's explicitly checked — no more
  // implicit "nothing checked means search everything" fallback. Check
  // "Select All" in the dropdown to search every category at once instead.
  const scopedGroups = outbound.groups.filter((g) => selectedCategoryIds.includes(g.id));

  // Nothing selected AND nothing typed is the one state that still needs an
  // explicit prompt. A typed query still falls through to the unmatched-flow
  // ("No match found" + Continue) even with zero categories checked, same as
  // a query that matches nothing within whatever categories are checked —
  // see `noMatches` below. Any explicit category selection shows its full
  // contents right away (no query required), matching the old single-group
  // behavior.
  const showStartTypingPrompt = selectedCategoryIds.length === 0 && !query;

  /** Categorized sections across whatever's in scope — one per group with at
   *  least one match, in `groups` order. Skipped entirely while
   *  `showStartTypingPrompt` is true (nothing to compute yet). Plain
   *  computation, not memoized — `scopedGroups` is a fresh array every
   *  render anyway, and this list is small enough that it doesn't matter. */
  const sections = showStartTypingPrompt
    ? []
    : scopedGroups
        .map((g) => ({
          group: g,
          // Matches by phone number too (see contactMatchesQuery) — the
          // search box's own placeholder already promises "Enter phone,
          // email or search term", so this closes a real gap rather than
          // adding new UI. Favorites derives its list from
          // `allContacts`/`favoriteIds` rather than its own (empty)
          // `contacts` array.
          contacts: (g.kind === "favorites" ? allContacts.filter((c) => favoriteIds.has(c.id)) : g.contacts ?? []).filter((c) =>
            contactMatchesQuery(c, search)
          ),
        }))
        .filter((section) => section.contacts.length > 0);

  // Only a real header cue when results span more than one group — a single
  // explicitly-selected category still reads as a flat list, same as before.
  const showSectionLabels = selectedCategoryIds.length !== 1;

  const noMatches = query.length > 0 && sections.length === 0;

  /* Moving from the search box to the unified detail screen is always an
   * explicit agent action — never automatic on keystroke — so a phone
   * number or email that's still mid-typing never gets yanked into the next
   * screen out from under the agent. Pressing Return in the search box (see
   * `handleSearchKeyDown` below) is the keyboard equivalent of clicking the
   * "Continue with ..." button in the `noMatches` branch of `content`
   * further down — both land on the same unmatched detail screen, which
   * always shows "No match found in directory" there (see
   * `OutboundDetailScreen`'s own `!contact` check) since by definition
   * nothing in the directory matched what was typed. */
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const trimmed = search.trim();
    if (!trimmed || !noMatches) return;
    setScreen({ kind: "detail", contact: null, query: trimmed });
  };

  const resetAndClose = () => {
    setOpen(false);
    setScreen({ kind: "browse" });
    setSearch("");
    setDialPadActive(false);
    // Clears the dialed digits but keeps the last-picked country — same
    // "clear the transient text, keep the preference" split `search`
    // above gets, just for the Dial Pad group's own field.
    setDialpadPhone((prev) => ({ ...prev, number: "" }));
  };

  const toggleFavorite = (contactId: string) =>
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });

  const renderContactRow = (contact: CreateNewOutboundContact) => (
    <ContactRow
      key={contact.id}
      contact={contact}
      favorited={favoriteIds.has(contact.id)}
      onToggleFavorite={() => toggleFavorite(contact.id)}
      onClick={() => setScreen({ kind: "detail", contact, query: "" })}
      onSelectChannel={(channel, position) => {
        if (channel === "chat" && contact.kind === "agent" && outbound.onOpenInternalChat) {
          outbound.onOpenInternalChat(contact.id, position);
          resetAndClose();
          return;
        }
        setScreen({ kind: "detail", contact, query: "", initialChannel: channel });
      }}
    />
  );

  const trigger = (
    <button
      type="button"
      aria-label={title}
      aria-expanded={open}
      aria-haspopup="true"
      onClick={() => setOpen((v) => !v)}
      className={cn(
        "flex h-9 items-center justify-center rounded-lyra-sm overflow-hidden mb-2",
        "bg-lyra-bg-primary text-lyra-fg-on-primary transition-all duration-200",
        "hover:bg-lyra-state-hover-primary active:bg-lyra-state-pressed-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
        expanded ? "w-full px-4" : "w-9 px-0"
      )}
    >
      <Plus className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span
        aria-hidden={!expanded}
        className={cn(
          "lyra-body-md overflow-hidden whitespace-nowrap transition-all duration-200",
          expanded ? "max-w-[200px] ml-2 opacity-100" : "max-w-0 ml-0 opacity-0"
        )}
      >
        {title}
      </span>
    </button>
  );

  /* ── Body content ── */
  let content: React.ReactNode;
  if (screen.kind === "detail") {
    content = (
      <OutboundDetailScreen
        contact={screen.contact}
        query={screen.query}
        preselectedChannel={screen.initialChannel}
        channelOptions={outbound.channelOptions}
        phoneOptions={outbound.phoneOptions}
        skillOptions={outbound.skillOptions}
        recentSkillOptions={recentSkillIds
          .map((id) => outbound.skillOptions.find((o) => o.value === id))
          .filter((o): o is { value: string; label: string } => !!o)}
        onStart={(channel, addressValue, skillId) => {
          if (screen.contact) {
            outbound.onStartCall({ contact: screen.contact, channel, phone: addressValue, skillId });
          } else {
            outbound.onStartUnmatchedOutbound?.({ channel, value: addressValue, skillId });
          }
          recordRecentSkill(skillId);
          resetAndClose();
        }}
      />
    );
  } else if (noMatches) {
    // A search with zero matches — including a raw phone number or email
    // that will never match a contact record — offers a manual "Continue"
    // into the unified detail screen (contact: null) instead of yanking the
    // screen out from under the agent on every keystroke that happens to
    // have zero matches mid-typing.
    content = (
      <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
        <p className="lyra-body-sm text-lyra-fg-secondary">No match found in directory.</p>
        <Button variant="outline" size="sm" onClick={() => setScreen({ kind: "detail", contact: null, query: search.trim() })}>
          Continue with &quot;{search.trim()}&quot;
        </Button>
      </div>
    );
  } else if (dialPadActive) {
    content = (
      <div
        className="flex flex-col gap-3 p-4"
        onKeyDown={(e) => {
          // PhoneInput has no onKeyDown/onSubmit prop of its own — caught
          // here via ordinary DOM bubbling from its underlying <input>,
          // same as lyra-ui's own CreateNew dialpad group does it.
          if (e.key === "Enter") {
            e.preventDefault();
            handleQuickDial();
          }
        }}
      >
        {/* No `placeholder` override — PhoneInput's own per-country example
         *  ("(555) 555-5555" for the US) is more useful than fixed generic
         *  text, and updates automatically as the country changes.
         *  `dropdownClassName="z-[10003]"`: the country dropdown is a
         *  Popover nested inside this popover's own stack — same tier
         *  `AddOutboundButton`'s popover above uses for the same reason. */}
        <PhoneInput value={dialpadPhone} onChange={setDialpadPhone} dropdownClassName="z-[10003]" />
        {dialpadMatch && (
          <div>
            <p className="pb-1 lyra-body-xs text-lyra-fg-secondary uppercase tracking-wide">Possible match</p>
            <ListItem
              className="rounded-lyra-sm border border-lyra-border-subtle"
              leading={<ContactAvatar contact={dialpadMatch} />}
              title={dialpadMatch.name}
              subtitle={dialpadMatch.subtitle}
              onClick={() => setScreen({ kind: "detail", contact: dialpadMatch, query: "", initialChannel: "voice" })}
            />
          </div>
        )}
        <Button variant="default" className="w-full" disabled={!isDialpadNumberValid} onClick={handleQuickDial}>
          Dial Number
        </Button>
      </div>
    );
  } else if (showStartTypingPrompt) {
    content = (
      <p className="px-4 py-8 text-center lyra-body-sm text-lyra-fg-secondary">
        Select a category above, or type a phone number or email.
      </p>
    );
  } else if (sections.length === 0) {
    // Reached only when a category is explicitly selected (otherwise
    // `showStartTypingPrompt`/`noMatches` above would already have caught
    // it) and it's genuinely empty — e.g. Favorites with nothing favorited
    // yet. A single selection keeps that group's own `emptyMessage`; 2+
    // empty selections fall back to a generic message since there's no
    // single group left to attribute it to.
    content = (
      <p className="px-4 py-8 text-center lyra-body-sm text-lyra-fg-secondary">
        {singleSelectedGroup?.emptyMessage ?? "Nothing here yet."}
      </p>
    );
  } else {
    content = (
      <div className="flex flex-col pb-2">
        {sections.map(({ group, contacts }, i) => (
          <div key={group.id}>
            {showSectionLabels && (
              <p
                className={cn(
                  "px-4 pt-3 pb-1 lyra-body-xs text-lyra-fg-secondary uppercase tracking-wide",
                  i > 0 && "border-t border-lyra-border-subtle mt-1"
                )}
              >
                {group.label}
              </p>
            )}
            {contacts.map(renderContactRow)}
          </div>
        ))}
      </div>
    );
  }

  const categoryOptions = outbound.groups.map((g) => ({ value: g.id, label: g.label }));

  // Search doesn't apply while the Dial Pad is active (nothing to search —
  // it's a single phone field, not a contact list), same as lyra-ui's own
  // CreateNew hides its search field for a "dialpad"-kind group.
  const showSearchInput = screen.kind === "browse" && !dialPadActive;

  /* ── Header — back/title/close row on every screen; group dropdown +
   *  search only on the browse screen. ── */
  const header = (
    <div className="border-b border-lyra-border-subtle">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex min-w-0 items-center gap-2">
          {/* Detail screen backs out to browse; Dial Pad (still technically
           *  the browse screen, just with `dialPadActive` on — see that
           *  state's own doc comment) backs out to whatever category
           *  selection/search was already in place, not a reset. */}
          {(screen.kind === "detail" || dialPadActive) && (
            <button
              type="button"
              onClick={() => (screen.kind === "detail" ? setScreen({ kind: "browse" }) : setDialPadActive(false))}
              aria-label="Back"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
          {screen.kind === "detail" && screen.contact ? (
            <>
              <ContactAvatar contact={screen.contact} />
              <p className="lyra-heading-sm text-lyra-fg-default truncate">{screen.contact.name}</p>
            </>
          ) : (
            <p className="lyra-heading-sm text-lyra-fg-default truncate">
              {screen.kind === "detail" ? "Outbound Call" : dialPadActive ? "Dial Pad" : title}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={resetAndClose}
          aria-label="Close"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
        >
          <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      {screen.kind === "browse" && !dialPadActive && (
        <div className="flex flex-col gap-3 px-4 pb-4">
          {/* Phone/email/search-term entry leads — it's the primary action
           *  (type a number/address, or a name to filter the group below),
           *  so it sits above the group picker rather than under it. */}
          {showSearchInput && (
            <>
              <Input
                type="text"
                placeholder="Enter"
                helperText={`${singleSelectedGroup?.searchPlaceholder ?? "Enter phone, email or search term"}.`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                endIcon={
                  search ? (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                      className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-lyra-xs text-lyra-fg-secondary hover:text-lyra-fg-default hover:bg-lyra-state-hover transition-colors"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  ) : undefined
                }
              />
              {/* Quick-access shortcut into the Dial Pad screen — one click
               *  instead of a Select interaction, for what's meant to be a
               *  fast "just dial a number" path. */}
              <button
                type="button"
                onClick={() => setDialPadActive(true)}
                className="flex items-center gap-1.5 self-start lyra-body-sm text-lyra-fg-link underline underline-offset-2 hover:text-lyra-fg-link"
              >
                <Grid3x3 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                Dial Pad
              </button>
            </>
          )}
          <Select
            multiple
            showSelectAll
            label="Search"
            values={selectedCategoryIds}
            onValuesChange={setSelectedCategoryIds}
            options={categoryOptions}
            placeholder="Select a category to search"
            portalDropdown
          />
        </div>
      )}
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : resetAndClose())}
      placement="bottom"
      align="start"
      sideOffset={4}
      maxWidth="320px"
      maxHeight="520px"
      className="w-[320px]"
      header={header}
      content={content}
    >
      {trigger}
    </Popover>
  );
}
