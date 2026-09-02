import { useMemo, useRef, useState } from "react";
import {
  Popover,
  Menu,
  Select,
  Input,
  SearchInput,
  Button,
  ListItem,
  FavoriteButton,
  Label,
  Tooltip,
  RadioGroup,
  RadioGroupItem,
  StatusIcon,
  PhoneInput,
  PHONE_COUNTRIES,
  isPhoneNumberComplete,
  type ChannelType,
  type CreateNewOutboundContact,
  type CreateNewOutboundGroup,
  type CreateNewChannelOption,
  type PhoneValue,
  type MenuEntry,
  type AgentStatus,
} from "@nicecxone/lyra-ui";
import { Plus, ChevronLeft, ChevronRight, X, User, Headset, Route, UsersRound, Building2, Grid3x3, Search } from "lucide-react";
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

/* Re-enabled per an explicit follow-up: an outbound skill is now required
 * before starting any interaction — this flag was only ever a visibility
 * toggle (see `canStart` below, which already gates on `skillId` whenever
 * this is true), so flipping it back on both shows the field again AND
 * enforces the requirement, with no other logic changes needed. */
const SHOW_SKILL_SELECTION = true;

/* ── Types ── */

export interface NewOutboundConfig {
  groups: CreateNewOutboundGroup[];
  /** Skill id → the real agents staffing it — backs the "view agents in
   *  this skill" screen (see `Screen`'s own `skillAgents` variant above).
   *  Omitted/missing entries just show an empty roster rather than erroring. */
  skillMembers?: Record<string, CreateNewOutboundContact[]>;
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
  // Tapping a category's own title row on the browse screen (see the
  // `content` branch that renders those rows when nothing's typed) opens
  // this — the full, unfiltered list for just that one category (Favorites,
  // Agents, Skills, My Team, or any external directory), with its own
  // within-category search field. Replaces the old multi-select category
  // dropdown's "exactly one category checked" case, per an explicit
  // follow-up dropping multi-select entirely — browsing is now either "type
  // to search every category at once" (still on `browse`) or "tap one
  // category to see just its own full list" (here).
  | { kind: "category"; groupId: string }
  | { kind: "detail"; contact: CreateNewOutboundContact | null; query: string; initialChannel?: ChannelType }
  // Clicking a skill row's own body (see `renderContactRow`'s onClick)
  // opens this — a roster of the real agents staffing that skill, each
  // callable/chattable exactly like an Agents-group row (see `outbound.
  // skillMembers` and this screen's own render branch below). Reachable
  // from a skill row wherever one appears now — inline in a browse-screen
  // search result, or inside the "category" screen above when that
  // category is Skills — same as before, just from more places.
  | { kind: "skillAgents"; skillId: string; skillName: string };

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

function ContactAvatar({ contact }: { contact: CreateNewOutboundContact & { availability?: AgentStatus } }) {
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
      <div className="relative shrink-0">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-full lyra-body-sm-emphasis", contact.avatarClassName)}>
          {contact.initials}
        </div>
        {/* Same component, same corner placement, lyra-ui's own
         *  `AgentProfile` avatar uses for the exact same idea (see that
         *  component's own `Avatar`) — a small check/minus/neutral glyph in
         *  a colored circle, not just a color-only dot (ADA: color alone
         *  isn't an accessible signal), reused here per an explicit
         *  follow-up rather than hand-rolled locally. `px-0` matches
         *  `AgentProfile`'s own override, keeping the circle centered on
         *  the glyph instead of `StatusBadge`'s default horizontal padding.
         *  Per an explicit follow-up: agents AND skills both get this now
         *  (see `DirectoryAgent.availability`/`DirectorySkill.availability`
         *  in directory.ts), so it lives on the shared `ContactAvatar` both
         *  kinds render through. */}
        {contact.availability && (
          <StatusIcon
            status={contact.availability}
            className="absolute bottom-[-2px] right-[-2px] px-0 border border-lyra-bg-surface-base"
          />
        )}
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
  // Typed as the union since the trigger renders as a plain `<span>` for
  // skill rows (see `chevronIsDecorative` below) and a real `<button>` for
  // every other kind.
  const triggerRef = useRef<HTMLButtonElement | HTMLSpanElement>(null);
  // Skills only ever offer a phone call from this hover flyout — same
  // Popover+Menu shape the Agents rows use (per an explicit follow-up,
  // "like the Agents dropdown"), just narrowed to a single "Call" entry
  // rather than every channel the underlying skill contact happens to
  // support (every skill's own `channels` still lists its native routing
  // channel too, for the detail screen this "Call" entry lands on — this
  // filter only affects what shows in THIS quick-action flyout). Clicking
  // a skill's ROW ITSELF (not this flyout) does something different — see
  // `renderContactRow`'s own `onClick` for why.
  const visibleChannels =
    contact.kind === "skill"
      ? contact.channels.includes("voice")
        ? (["voice"] as ChannelType[])
        : []
      : CONTACT_CHANNEL_ORDER.filter((type) => contact.channels.includes(type));

  // Skill rows only: per an explicit follow-up, the chevron here is purely
  // a visual "there's more behind this row" affordance (the agent roster),
  // not its own separate clickable control — clicking anywhere in that
  // area, chevron included, should do exactly what clicking the rest of
  // the row does (open the agent list). Every other kind keeps the chevron
  // as its own real trigger (see the button branch below) since its flyout
  // offers several distinct channels worth a dedicated click, not just a
  // single duplicate of what the row itself already does.
  const chevronIsDecorative = contact.kind === "skill";

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
            <div
              onClick={(e) => {
                // For every kind except skills, this stops a click on the
                // real chevron button from also reaching the row's own
                // onClick (see that button's own comment). Skipped entirely
                // for skill rows — there the chevron is decorative and a
                // click here should reach the row exactly like clicking
                // anywhere else on it (see `chevronIsDecorative` above).
                if (!chevronIsDecorative) e.stopPropagation();
              }}
            >
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
                {chevronIsDecorative ? (
                  <span
                    ref={triggerRef}
                    onClick={(e) => {
                      // Purely visual now — no separate click behavior of its
                      // own, so a click here does exactly what clicking
                      // anywhere else on the row does (open the agent list).
                      // Radix's own `Popover.Trigger` (this is one, via
                      // `asChild`) still attaches a click-to-toggle handler to
                      // whatever child it wraps regardless of what's rendered;
                      // `preventDefault` suppresses that (checked via
                      // `event.defaultPrevented`) without `stopPropagation`,
                      // so the click still bubbles up to `ListItem`'s own
                      // `onClick`. The flyout still opens on hover of either
                      // the row or this icon (unchanged) — this only changes
                      // what a raw click on the icon itself does.
                      e.preventDefault();
                    }}
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                ) : (
                  <button
                    ref={triggerRef as React.RefObject<HTMLButtonElement>}
                    type="button"
                    onClick={(e) => {
                      // Radix's own `Popover.Trigger` (which this button is,
                      // via `asChild`) attaches its own click handler that
                      // TOGGLES the controlled `open` state — harmless for a
                      // click-to-open trigger, but this one is already opened
                      // by hover (see the row's own `onMouseEnter` above), so
                      // clicking the chevron while it's already open from
                      // hovering would immediately toggle it CLOSED again
                      // before the click could ever land on a menu item
                      // inside — reading as "nothing happens" when clicking a
                      // row's chevron. `preventDefault` here stops Radix's own
                      // handler from firing at all (it checks
                      // `defaultPrevented` before toggling); forcing `true`
                      // instead of leaving it alone makes a direct click also
                      // reliably open the menu even without a hover first
                      // (e.g. keyboard/touch). `stopPropagation` keeps this
                      // click from also reaching the row's own `onClick`.
                      e.preventDefault();
                      e.stopPropagation();
                      setChannelMenuOpen(true);
                    }}
                    aria-label={`Channels for ${contact.name}`}
                    aria-haspopup="menu"
                    aria-expanded={channelMenuOpen}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                )}
              </Popover>
            </div>
          )}
        </div>
      }
    />
  );
}

/** Skill-agents screen's own top row (see `renderCallSkillRow` at this
 *  file's root component) — deliberately NOT `ContactRow` above: per an
 *  explicit follow-up, this row has exactly one action (call the skill),
 *  so it skips that component's whole hover-to-reveal channel flyout
 *  entirely rather than cramming a single-item version of it in. A plain,
 *  static phone icon replaces the chevron — nothing to reveal on hover,
 *  nothing hidden behind a click on the icon itself; the row's own
 *  `onClick` (call skill) fires no matter where on the row it's clicked,
 *  icon included.
 *
 *  Per a further explicit follow-up: this row isn't really "a contact" the
 *  way every other row is — it's a one-off action ("call the skill you just
 *  opened"), so the usual avatar/name/subtitle/favorite treatment is more
 *  than it needs. Shows just the skill's own icon tile (same
 *  `avatarClassName` accent every skill contact already carries, reused
 *  as-is rather than re-deriving a color), the literal instruction "Call
 *  this skill", and the phone icon — no initials, no name, no
 *  description, no star. Availability still shows on the icon tile's
 *  corner, same as everywhere else this skill's status appears. */
function CallSkillRow({ contact, onCall }: { contact: CreateNewOutboundContact & { availability?: AgentStatus }; onCall: () => void }) {
  const PhoneIcon = CONTACT_CHANNEL_ICON.voice;
  return (
    <ListItem
      onClick={onCall}
      leading={
        <div className="relative shrink-0">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lyra-sm", contact.avatarClassName)}>
            <Route className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </div>
          {contact.availability && (
            <StatusIcon
              status={contact.availability}
              className="absolute bottom-[-2px] right-[-2px] px-0 border border-lyra-bg-surface-base"
            />
          )}
        </div>
      }
      title="Call this skill"
      // Per an explicit follow-up: a bare 16px glyph read as small, off-
      // center, and hugging the row's right edge next to the leading tile's
      // full 36px square — wrapping it in a same-height slot fixes the
      // apparent vertical centering issue for free, since both slots now
      // occupy the same height instead of one being a tall square and the
      // other a tiny bare icon. `mr-1` gives it a bit more breathing room
      // from the row's own edge on top of that. Sized to lyra-ui's own
      // 40px touch-target step (`ActionIconButton`'s "lg") — comfortably
      // finger-sized on mobile — while staying presentational (no nested
      // button/tab-stop): the row's own `onClick` above already fires
      // wherever it's tapped, icon included, same as before.
      // Per a further follow-up, the tinted circle (matching the leading
      // tile's `avatarClassName` accent) read as an unrelated colored badge
      // rather than a call affordance — dropped in favor of the same plain
      // gray `text-lyra-fg-secondary` this app already uses for its other
      // call/chat icon buttons (see the agent/skill "call" icon in
      // `ConsultTransferPopover`), no fill, so it reads as an icon rather
      // than a status chip.
      trailing={
        <div className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center text-lyra-fg-secondary">
          <PhoneIcon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </div>
      }
    />
  );
}

/* ── Channel radio list — per an explicit follow-up, replaces the previous
 *  row of colored icon buttons with a plain radio-button list (composed
 *  from lyra-ui's own `RadioGroup`/`RadioGroupItem` primitives rather than
 *  hand-rolled selectable buttons — composition over reimplementation).
 *  Each option still shows its `channelOptions` icon next to the label
 *  (Voice/SMS/WhatsApp/Email) for quick identification, just neutrally
 *  colored now rather than each channel's own accent tint — a plain radio
 *  list reads as one unified control, not a row of separately-styled
 *  buttons. `RadioGroupItem` only renders the circle when given no `label`
 *  prop; the icon+text alongside it is a second, sibling `<label>` pointing
 *  at the same input id (valid HTML — two labels can share one `htmlFor`),
 *  which is what lets an icon sit inside the label instead of the plain
 *  string `RadioGroupItem.label` supports. ── */
function ChannelRadioOption({
  id,
  icon,
  label,
  disabled,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
}) {
  const inputId = `channel-radio-${id}`;
  return (
    <div className="flex items-center gap-2.5">
      <RadioGroupItem value={id} id={inputId} disabled={disabled} />
      <label
        htmlFor={inputId}
        className={cn(
          "flex items-center gap-1.5 lyra-body-md",
          disabled ? "cursor-not-allowed text-lyra-fg-disabled" : "cursor-pointer text-lyra-fg-default"
        )}
      >
        <span className="flex items-center text-lyra-fg-secondary" aria-hidden="true">
          {icon}
        </span>
        {label}
      </label>
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

      <RadioGroup
        label="Select Channel"
        value={selectedChannel ?? undefined}
        onValueChange={(value) => handlePickChannel(value as ChannelType)}
      >
        {channelOptions.map((option) => (
          <ChannelRadioOption
            key={option.id}
            id={option.id}
            icon={option.icon}
            label={option.label}
            disabled={!enabledChannels.includes(option.id)}
          />
        ))}
      </RadioGroup>

      {/* Once a channel is picked, a contact with only one number/address on
       *  file gets a plain read-only field instead of the `Select` below —
       *  per an explicit follow-up, a dropdown chevron implies there's a
       *  choice to make, and showing one for a single value is misleading.
       *  `disabled={!selectedChannel}`'s own "Select a channel first"
       *  placeholder state is untouched (that dropdown isn't claiming
       *  multiple addresses exist, just that none are known yet). */}
      {contact && selectedChannel && addressOptions.length <= 1 ? (
        <Input
          label={
            selectedChannel === "email"
              ? "Email Address"
              : selectedChannel === "whatsapp"
                ? "WhatsApp Handle"
                : "Phone"
          }
          value={addressOptions[0]?.value ?? addressValue}
          readonly
        />
      ) : contact ? (
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
 * `Popover`-based control in this file.
 * Reused as-is (not re-approximated locally) for Directory's own per-channel
 * customer icons — see `preselectedChannel`/`renderTrigger` below, added
 * specifically for that second caller. */

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
  /** Pre-selects a channel in `OutboundDetailScreen`'s radio group — same
   *  "clicked a specific channel icon, not a generic add button" pattern
   *  `ContactRow`'s own hover icons use inside the browse screen (see
   *  `Screen`'s `initialChannel`). The agent can still switch channels from
   *  the same screen; this just saves the extra click when the entry point
   *  already told us which one they meant. */
  preselectedChannel?: ChannelType;
  /** Renders this button's own trigger instead of the default "+" icon
   *  button — added for Directory's customer rows, which already show one
   *  distinct icon per channel (`Phone`/`Mail`/etc., see `DirectoryPage`'s
   *  `CONTACT_CHANNEL_ICON`) rather than a single generic "add" affordance.
   *  Receives `onClick` to wire into whatever element the caller renders
   *  (a lyra-ui `ActionIconButton`, typically); `open` is exposed too in
   *  case the caller wants to reflect it (e.g. `aria-expanded`). Omitted
   *  keeps today's default "+" button + "Add Outbound" tooltip, unchanged
   *  for `CustomerInteractionPanel`'s existing usage. */
  renderTrigger?: (props: { onClick: () => void; open: boolean }) => React.ReactNode;
}

export function AddOutboundButton({
  contact,
  channelOptions,
  phoneOptions,
  skillOptions,
  openChannelTypes,
  onStart,
  className,
  preselectedChannel,
  renderTrigger,
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

  const toggleOpen = () => setOpen((v) => !v);

  const trigger = renderTrigger ? (
    renderTrigger({ onClick: toggleOpen, open })
  ) : (
    <button
      type="button"
      aria-label="Add Outbound"
      aria-haspopup="true"
      aria-expanded={open}
      onClick={toggleOpen}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
        className
      )}
    >
      <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );

  const popover = (
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
          preselectedChannel={preselectedChannel}
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
      {trigger}
    </Popover>
  );

  // A caller-supplied trigger already carries its own accessible name/
  // tooltip (e.g. Directory's per-channel `ActionIconButton title="Call
  // {name}"`) — wrapping it in this component's own "Add Outbound" Tooltip
  // too would just double up on that. Only the default "+" button gets it.
  return renderTrigger ? (
    popover
  ) : (
    <Tooltip content="Add Outbound" placement="bottom" asLabel>
      <span className="inline-flex">{popover}</span>
    </Tooltip>
  );
}

/* ── Root ── */

// Seeded so the popover never opens to an empty, unconvincing "Favorites"
// screen during a demo — a couple of agents and an outbound skill, favorited
// from the start. Real favoriting is still fully agent-driven from here on
// (see `toggleFavorite` below); this is just the starting state, not a
// pinned/can't-remove list. IDs match `directory.ts` seed data
// (`DIRECTORY_AGENTS`/`DIRECTORY_SKILLS`). No customers here anymore — per
// an explicit follow-up, Customers were removed from New Outbound entirely
// (not just hidden from the category list), so "sofia"/"jordan" no longer
// belong in this list either.
const DEFAULT_FAVORITE_IDS = ["john-smith", "amara", "vip-support"];

export function NewOutboundPopover({ title = "New Outbound", expanded = false, outbound }: NewOutboundPopoverProps) {
  const [open, setOpen] = useState(false);
  // Dial Pad is a mode switch (swaps the whole body for a phone field), not
  // a category to browse or search, so it's its own flag rather than a
  // screen/category value — see its own doc comment further down at the
  // `content` branch that reads this.
  const [dialPadActive, setDialPadActive] = useState(false);
  const [search, setSearch] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(DEFAULT_FAVORITE_IDS));
  const [screen, setScreen] = useState<Screen>({ kind: "browse" });
  // The "category" screen's own within-category filter (see that `Screen`
  // variant's doc comment) — separate from the browse root's own `search`
  // above, same "each drill-down gets its own scoped field" convention
  // `skillAgentSearch` below already established for the Skills roster
  // screen. Reset on entry (see `renderCategoryRow`), not on close, same
  // "leave it as the agent left it until the next visit" idea `search`
  // itself follows.
  const [categorySearch, setCategorySearch] = useState("");
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
  // Dial Pad's own outbound skill — same requirement as the unified detail
  // screen's "Select outbound skill" field (see `SHOW_SKILL_SELECTION`),
  // just kept as its own piece of state since the Dial Pad flow never
  // touches `OutboundDetailScreen` at all (see `handleQuickDial` below).
  const [dialpadSkillId, setDialpadSkillId] = useState("");
  // Filter text for the skill-agents drill-in screen's own roster — reset
  // whenever a new skill is opened so leftover text from a previously
  // viewed skill doesn't leak in (see `renderContactRow`'s onClick below).
  const [skillAgentSearch, setSkillAgentSearch] = useState("");

  const recordRecentSkill = (skillId: string) => {
    if (!skillId) return;
    setRecentSkillIds((prev) => [skillId, ...prev.filter((id) => id !== skillId)].slice(0, 3));
  };

  // A group's own raw contact list, before any query/search filtering —
  // Favorites is the one group that doesn't carry its own `contacts` array
  // (it derives its members from `favoriteIds` against `allContacts`
  // instead, see that memo below); every other group just uses whatever's
  // on `group.contacts`. Shared by the root browse screen's own
  // query-driven sections below and the "category" drill-down screen, so
  // both agree on exactly what belongs to a given category.
  const contactsForGroup = (group: CreateNewOutboundGroup): CreateNewOutboundContact[] =>
    group.kind === "favorites" ? allContacts.filter((c) => favoriteIds.has(c.id)) : group.contacts ?? [];

  // Deduped by id — "My Team" now lists real `DIRECTORY_AGENTS` records that
  // also appear in the "Agents" group (see directory.ts's own
  // `OUTBOUND_MY_TEAM_CONTACTS`), so the same person can legitimately show
  // up in more than one group's `contacts` array. Without deduping here, a
  // favorited teammate (e.g. Amara, favorited by default) would render
  // TWICE in the Favorites list — once per group that happens to include
  // them. A `Map` keyed by id keeps whichever occurrence is encountered
  // first, which is fine since every occurrence of the same id is the exact
  // same contact object.
  const allContacts = useMemo(() => {
    const byId = new Map<string, CreateNewOutboundContact>();
    for (const group of outbound.groups) {
      if ((group.kind ?? "contacts") !== "contacts") continue;
      for (const contact of group.contacts ?? []) {
        if (!byId.has(contact.id)) byId.set(contact.id, contact);
      }
    }
    return Array.from(byId.values());
  }, [outbound.groups]);

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
  // Same requirement as the unified detail screen's own `canStart` — a
  // skill is required before dialing too, once `SHOW_SKILL_SELECTION` is on.
  const canQuickDial = isDialpadNumberValid && (!SHOW_SKILL_SELECTION || !!dialpadSkillId);
  const dialpadMatch =
    dialpadPhone.number.length >= DIAL_PAD_MATCH_MIN_DIGITS
      ? allContacts.find((c) => contactMatchesQuery(c, dialpadPhone.number))
      : undefined;

  const handleQuickDial = () => {
    if (!canQuickDial) return;
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
      outbound.onStartCall({ contact: dialpadMatch, channel: "voice", phone: fullNumber, skillId: dialpadSkillId });
    } else {
      outbound.onStartUnmatchedOutbound?.({ channel: "voice", value: fullNumber, skillId: dialpadSkillId });
    }
    recordRecentSkill(dialpadSkillId);
    resetAndClose();
  };

  const query = search.trim().toLowerCase();

  /** Categorized sections across EVERY category at once — per an explicit
   *  follow-up dropping the old multi-select category dropdown entirely,
   *  typing in the root search field now always searches every group
   *  (there's no way to scope it to a subset anymore; that's what the
   *  "category" drill-down screen is for instead). One entry per group with
   *  at least one match, in `outbound.groups` order. Only meaningful while
   *  there's a query — see the `content` branch below, which shows the
   *  plain category title-row list instead whenever `query` is empty.
   *  Plain computation, not memoized — `outbound.groups` is small enough
   *  that it doesn't matter. */
  const sections = query
    ? outbound.groups
        .map((g) => ({
          group: g,
          // Matches by phone number too (see contactMatchesQuery) — the
          // search box's own placeholder already promises "Enter phone,
          // email or search term", so this closes a real gap rather than
          // adding new UI.
          contacts: contactsForGroup(g).filter((c) => contactMatchesQuery(c, search)),
        }))
        .filter((section) => section.contacts.length > 0)
    : [];

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
    setDialpadSkillId("");
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
      // Per an explicit follow-up: opening a Skill (clicking its row body,
      // not the hover flyout above) now shows the roster of agents staffing
      // it instead of the channel/Start Call detail screen — calling the
      // skill directly lives in the hover flyout's single "Call" entry now
      // (see `visibleChannels` above), reached via `onSelectChannel` below
      // exactly like every other kind's quick action.
      onClick={() => {
        if (contact.kind === "skill") {
          setSkillAgentSearch("");
          setScreen({ kind: "skillAgents", skillId: contact.id, skillName: contact.name });
        } else {
          setScreen({ kind: "detail", contact, query: "" });
        }
      }}
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

  // Skill-agents screen's own top row — per an explicit follow-up, opening
  // a skill's roster still needs its own one-tap way to call the skill
  // directly, for whenever the browse screen's hover-to-call flyout either
  // wasn't used (the agent clicked the row instead) or can't be (no hover
  // on touch/mobile). Deliberately NOT `renderContactRow` above — that
  // function's own onClick sends a skill BACK to this same screen (a no-op
  // here, since we're already on it); this row instead goes straight to the
  // same channel/Start Call destination the flyout's "Call" entry uses.
  const renderCallSkillRow = (skillContact: CreateNewOutboundContact) => (
    <CallSkillRow
      key={skillContact.id}
      contact={skillContact}
      onCall={() => setScreen({ kind: "detail", contact: skillContact, query: "", initialChannel: "voice" })}
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

  // Last 3 outbound skills, resolved to full {value, label} options —
  // shared by the unified detail screen's own "Select outbound skill"
  // field AND the Dial Pad flow's identical field below, so "Recent" means
  // the same thing (and shows the same skills) in both places.
  const recentSkillOptions = recentSkillIds
    .map((id) => outbound.skillOptions.find((o) => o.value === id))
    .filter((o): o is { value: string; label: string } => !!o);
  // Same "Recent up top, everything else beneath" shape `OutboundDetailScreen`
  // builds internally for its own skill dropdown — duplicated here (rather
  // than exported/shared) since it's a small, one-line-per-field
  // computation and this is the only other place that needs it (the Dial
  // Pad flow's own skill dropdown, which never touches that component).
  const recentSkillIdSet = new Set(recentSkillOptions.map((o) => o.value));
  const dialpadSkillOptionGroups = recentSkillOptions.length
    ? [
        { label: "Recent", options: recentSkillOptions },
        { label: "All Skills", options: outbound.skillOptions.filter((o) => !recentSkillIdSet.has(o.value)) },
      ]
    : undefined;

  /* ── Body content ── */
  let content: React.ReactNode;
  if (screen.kind === "skillAgents") {
    // Real agent rows, reused as-is via `renderContactRow` — each one
    // already supports a direct call (row click → detail screen) and
    // internal chat (the channel flyout's "Chat" entry already routes
    // `kind === "agent"` through `onOpenInternalChat`, same as the Agents
    // group), so nothing skill-specific is needed here beyond the roster
    // itself.
    const members = outbound.skillMembers?.[screen.skillId] ?? [];
    const filteredMembers = skillAgentSearch
      ? members.filter((member) => contactMatchesQuery(member, skillAgentSearch))
      : members;
    // The skill contact itself, for the "call this skill directly" row
    // above the search field — per an explicit follow-up, opening the
    // roster shouldn't be the only way to reach it once here; the browse
    // screen's own hover-to-call flyout doesn't help an agent who clicked
    // the row instead, or on a touch device with no hover at all.
    const skillContact = allContacts.find((c) => c.id === screen.skillId);
    content = (
      <div className="flex flex-col pb-2">
        {skillContact && (
          <div className="border-b border-lyra-border-subtle pb-1">{renderCallSkillRow(skillContact)}</div>
        )}
        {members.length > 0 && (
          <div className="px-4 pb-2 pt-1">
            <SearchInput
              value={skillAgentSearch}
              onValueChange={setSkillAgentSearch}
              placeholder="Search agents"
              aria-label="Search agents in this skill"
            />
          </div>
        )}
        {members.length === 0 ? (
          <p className="px-4 py-8 text-center lyra-body-sm text-lyra-fg-secondary">No agents staff this skill yet.</p>
        ) : filteredMembers.length === 0 ? (
          <p className="px-4 py-8 text-center lyra-body-sm text-lyra-fg-secondary">No agents match your search.</p>
        ) : (
          filteredMembers.map(renderContactRow)
        )}
      </div>
    );
  } else if (screen.kind === "detail") {
    content = (
      <OutboundDetailScreen
        contact={screen.contact}
        query={screen.query}
        preselectedChannel={screen.initialChannel}
        channelOptions={outbound.channelOptions}
        phoneOptions={outbound.phoneOptions}
        skillOptions={outbound.skillOptions}
        recentSkillOptions={recentSkillOptions}
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
  } else if (screen.kind === "category") {
    // Full, unfiltered list for one category — reached by tapping its title
    // row on the browse screen (see the final `else` branch below). Own
    // within-category `categorySearch` field, same "own scoped SearchInput
    // inside `content`, not the shared header" placement the Skills roster
    // screen above already uses — kept consistent rather than inventing a
    // second pattern for the same idea. `renderContactRow` is reused as-is,
    // so a Skill row here still opens that skill's own agent roster exactly
    // like it does everywhere else (see that function's own doc comment) —
    // nothing category-specific needed for that to keep working.
    const group = outbound.groups.find((g) => g.id === screen.groupId);
    const groupContacts = group ? contactsForGroup(group) : [];
    const filteredContacts = categorySearch
      ? groupContacts.filter((c) => contactMatchesQuery(c, categorySearch))
      : groupContacts;
    content = (
      <div className="flex flex-col pb-2">
        {groupContacts.length > 0 && (
          <div className="px-4 pb-2 pt-1">
            <SearchInput
              value={categorySearch}
              onValueChange={setCategorySearch}
              placeholder={group?.searchPlaceholder ?? `Search ${group?.label ?? "this category"}`}
              aria-label={`Search ${group?.label ?? "this category"}`}
            />
          </div>
        )}
        {groupContacts.length === 0 ? (
          <p className="px-4 py-8 text-center lyra-body-sm text-lyra-fg-secondary">
            {group?.emptyMessage ?? "Nothing here yet."}
          </p>
        ) : filteredContacts.length === 0 ? (
          <p className="px-4 py-8 text-center lyra-body-sm text-lyra-fg-secondary">No matches.</p>
        ) : (
          filteredContacts.map(renderContactRow)
        )}
      </div>
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
        {SHOW_SKILL_SELECTION && (
          <Select
            label="Select outbound skill"
            placeholder="Select outbound skill"
            value={dialpadSkillId}
            onValueChange={setDialpadSkillId}
            options={outbound.skillOptions}
            optionGroups={dialpadSkillOptionGroups}
            searchable
            portalDropdown
          />
        )}
        <Button variant="default" className="w-full" disabled={!canQuickDial} onClick={handleQuickDial}>
          Dial Number
        </Button>
      </div>
    );
  } else if (query) {
    // A query on the root browse screen always searches every category at
    // once now (see `sections`'s own doc comment) — `noMatches` above
    // already caught the zero-result case, so `sections` is guaranteed
    // non-empty here. Always labeled: unlike the old single-category-
    // selected case, a query result is never "obviously" just one category,
    // so the label stays even when only one happens to have a match.
    content = (
      <div className="flex flex-col pb-2">
        {sections.map(({ group, contacts }, i) => (
          <div key={group.id}>
            <p
              className={cn(
                "px-4 pt-3 pb-1 lyra-body-xs text-lyra-fg-secondary uppercase tracking-wide",
                i > 0 && "border-t border-lyra-border-subtle mt-1"
              )}
            >
              {group.label}
            </p>
            {contacts.map(renderContactRow)}
          </div>
        ))}
      </div>
    );
  } else {
    // Nothing typed yet — per an explicit follow-up replacing the old
    // multi-select category dropdown, the browse root now just lists every
    // category as its own title + chevron row, with no preview of contacts
    // underneath (that's what tapping through to the "category" screen
    // above is for). Doubles as this screen's "start" prompt — there's no
    // separate empty-state message anymore, the row list itself is it.
    content = (
      <div className="flex flex-col pb-2">
        {outbound.groups.map((group) => (
          <ListItem
            key={group.id}
            className="group/row"
            onClick={() => {
              setCategorySearch("");
              setScreen({ kind: "category", groupId: group.id });
            }}
            // Matches the same uppercase/tracked/secondary-gray treatment
            // this file already uses for group labels above a set of search
            // results (see the `query` branch above) — per an explicit
            // follow-up, sized one step up (`lyra-body-sm`'s 12px, not
            // `lyra-body-xs`'s 10px) since these rows are the primary,
            // stand-alone content here rather than a small label sitting
            // above other rows. `ListItem`'s own `title` renders through a
            // `lyra-body-md-emphasis` wrapper by default; passing a styled
            // span here overrides that for just this usage, same
            // "compose via the prop's own ReactNode support" approach as
            // everywhere else in this file, not a `ListItem` core change.
            title={<span className="lyra-body-sm uppercase tracking-wide text-lyra-fg-secondary">{group.label}</span>}
            trailing={<ChevronRight className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />}
          />
        ))}
      </div>
    );
  }

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
          {/* Detail/category/skill-agents screens back out to browse; Dial
           *  Pad (still technically the browse screen, just with
           *  `dialPadActive` on — see that state's own doc comment) backs
           *  out to whatever search text was already in place, not a reset. */}
          {(screen.kind === "detail" || screen.kind === "category" || screen.kind === "skillAgents" || dialPadActive) && (
            <button
              type="button"
              onClick={() => (screen.kind === "browse" ? setDialPadActive(false) : setScreen({ kind: "browse" }))}
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
              {screen.kind === "detail"
                ? "Outbound Call"
                : screen.kind === "category"
                  ? outbound.groups.find((g) => g.id === screen.groupId)?.label ?? title
                  : screen.kind === "skillAgents"
                    ? `${screen.skillName} Agents`
                    : dialPadActive
                      ? "Dial Pad"
                      : title}
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
           *  (type a number/address, or a name to filter every category at
           *  once below), so it sits above everything else here. Per the
           *  reference design, the help text is now a plain label ABOVE the
           *  field (was a `helperText` caption underneath it). No more
           *  `singleSelectedGroup`-driven placeholder swap — per an explicit
           *  follow-up dropping the category dropdown entirely, this field
           *  always searches every category at once now, so its label stays
           *  generic; a group's own `searchPlaceholder` still gets used, just
           *  on the "category" screen's own within-category field instead
           *  (see that screen's own `content` branch). */}
          {showSearchInput && (
            <div className="flex flex-col gap-1.5">
              <Label label="Enter phone, email or search term" labelFor="new-outbound-search" />
              <Input
                id="new-outbound-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                startIcon={<Search className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />}
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
            </div>
          )}
          {/* Quick-access shortcut into the Dial Pad screen — per an explicit
           *  follow-up, moved up to sit directly under the search field now
           *  that the category dropdown it used to sit below is gone
           *  (category browsing moved into the scrollable list itself, see
           *  the browse-root `content` branch). Still one click instead of a
           *  Select interaction, for what's meant to be a fast "just dial a
           *  number" path. */}
          {showSearchInput && (
            <button
              type="button"
              onClick={() => setDialPadActive(true)}
              className="flex items-center gap-2 self-start lyra-body-md text-lyra-fg-secondary hover:text-lyra-fg-default transition-colors"
            >
              <Grid3x3 className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              Dial Pad
            </button>
          )}
        </div>
      )}
    </div>
  );

  // Simple "opening a deeper screen" vs. "returning to the list" animation —
  // per an explicit follow-up asking for some sense of motion between
  // screens. `isBrowseRoot` is the shallow, top-level view (the plain
  // contact list/category picker); everything else (Dial Pad, the detail
  // screen, a skill's agent roster) counts as "deeper," so a transition
  // between the two directions is really just a two-level stack, not a
  // full navigation history — enough to read as forward/back without
  // needing to track every possible screen-to-screen hop. `screenKey`
  // identifies which VIEW is showing (not full screen state) so typing in
  // the search box or picking categories — which re-renders `content`
  // constantly while still on the browse screen — never re-keys/re-
  // triggers the animation; only an actual navigation does.
  const isBrowseRoot = screen.kind === "browse" && !dialPadActive;
  const screenKey = screen.kind === "browse" ? (dialPadActive ? "dialpad" : "browse") : screen.kind;
  // Comparing against (then updating) a ref during render — not in an
  // effect — is the documented React pattern for "remember the previous
  // render's value to detect a change happening THIS render" (see react.dev
  // on refs), which is exactly what deciding a direction needs: by the time
  // an effect would run, the animation classes below would already have
  // missed this render entirely.
  const wasBrowseRootRef = useRef(isBrowseRoot);
  const direction: "forward" | "backward" | null =
    isBrowseRoot === wasBrowseRootRef.current ? null : isBrowseRoot ? "backward" : "forward";
  wasBrowseRootRef.current = isBrowseRoot;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : resetAndClose())}
      placement="bottom"
      align="start"
      sideOffset={4}
      maxWidth="320px"
      // +2 rows' worth of height per an explicit follow-up (was 520px) —
      // each contact row runs ~56-60px, so +120px comfortably covers two
      // more without the popover starting to crowd the viewport.
      maxHeight="640px"
      className="w-[320px]"
      header={header}
      content={
        <div
          key={screenKey}
          className={cn(
            "animate-in fade-in-0 duration-200",
            direction === "forward" && "slide-in-from-right-4",
            direction === "backward" && "slide-in-from-left-4"
          )}
        >
          {content}
        </div>
      }
    >
      {trigger}
    </Popover>
  );
}
