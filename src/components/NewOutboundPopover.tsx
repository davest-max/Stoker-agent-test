import { useMemo, useState } from "react";
import {
  Popover,
  Select,
  Input,
  Button,
  ListItem,
  FavoriteButton,
  Label,
  CHANNEL_ACCENT,
  type ChannelType,
  type CreateNewOutboundContact,
  type CreateNewOutboundGroup,
  type CreateNewChannelOption,
} from "@nicecxone/lyra-ui";
import { Plus, ChevronLeft, X, User, Headset, Route, UsersRound, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContactActionButtons } from "@/components/DirectoryPage";

/* ── NewOutboundPopover ──
 * Local replacement for lyra-ui's `CreateNew` (outbound flow), built to the
 * "New Outbound" Figma reference (Stoker file, node 4326:1090 — see
 * PROJECT_SUMMARY-adjacent notes in this repo's CLAUDE.md for why this
 * isn't just a `CreateNew` config): a group dropdown that includes a
 * synthetic "All" option (categorized results across every real group), a
 * unified "channel select" screen shared by both the matched-contact flow
 * and the unmatched phone/email flow, and individual per-channel icon
 * buttons (not a channel dropdown) with selected/unselected states.
 * `lyra-ui/create-new.tsx` itself is untouched — see this repo's CLAUDE.md
 * ("never modify a lyra-ui core component from here"). */

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

const ALL_GROUP_ID = "__all__";

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
  /** Row-level shortcut — clicking one of the hover-revealed channel icons
   *  below skips the "pick a channel" step on the detail screen entirely,
   *  landing there with that channel (and its address) already selected.
   *  Reuses DirectoryPage's own `ContactActionButtons` (same per-channel
   *  icon set, colored via CHANNEL_ACCENT) rather than a second copy —
   *  works unchanged across every contact kind shown here (customer/
   *  agent/skill/team/external), since `channels` is on the shared
   *  `CreateNewOutboundContact` shape all of them synthesize into.
   *  `event` carries the click position — needed for the Agents "chat"
   *  icon, which opens Internal Chat floating near wherever the agent
   *  clicked rather than at a fixed anchor. */
  onSelectChannel: (channel: ChannelType, event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <ListItem
      className="group/row"
      onClick={onClick}
      leading={<ContactAvatar contact={contact} />}
      title={contact.name}
      subtitle={contact.subtitle}
      trailing={
        <div className="flex items-center gap-1">
          <div className="opacity-0 transition-opacity group-hover/row:opacity-100">
            <ContactActionButtons channels={contact.channels} onAction={onSelectChannel} />
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton favorited={favorited} onClick={onToggleFavorite} label={contact.name} placement="left" />
          </div>
        </div>
      }
    />
  );
}

/* ── Channel icon button — always tinted in its own accent color (per
 *  CHANNEL_ACCENT); selected adds an active-style ring, unselected drops to
 *  ~70% opacity (see chat with the user: closest match to the Figma
 *  reference, which renders every channel button in full accent color at
 *  once with no separate "off" mock to copy). Disabled (channel not
 *  offered for this contact/value) drops further and blocks interaction.
 *  The `label` prop used to only reach the button as `aria-label`/`title` —
 *  color alone (before an agent hovers or reads a tooltip) wasn't enough to
 *  tell channels apart at a glance, so it's now also rendered as a small
 *  caption underneath, per an explicit follow-up request. ── */

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
          accent.bg,
          accent.border,
          accent.text,
          selected
            ? "opacity-100 ring-2 ring-lyra-border-active ring-offset-1"
            : "opacity-70 hover:opacity-100",
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
  onStart: (channel: ChannelType, addressValue: string, skillId: string) => void;
}) {
  const enabledChannels = contact
    ? contact.channels
    : eligibleChannelsForQuery(query, channelOptions.map((c) => c.id));

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

  const canStart = !!selectedChannel && !!addressValue && !!skillId;

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

/* ── Root ── */

export function NewOutboundPopover({ title = "New Outbound", expanded = false, outbound }: NewOutboundPopoverProps) {
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState<string>(ALL_GROUP_ID);
  const [search, setSearch] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [screen, setScreen] = useState<Screen>({ kind: "browse" });
  // Last 3 outbound skills the agent has started an interaction with,
  // most-recent-first — surfaced as a "Recent" shortcut section in the
  // "Select outbound skill" dropdown.
  const [recentSkillIds, setRecentSkillIds] = useState<string[]>([]);

  const recordRecentSkill = (skillId: string) => {
    if (!skillId) return;
    setRecentSkillIds((prev) => [skillId, ...prev.filter((id) => id !== skillId)].slice(0, 3));
  };

  const activeGroup = groupId === ALL_GROUP_ID ? null : outbound.groups.find((g) => g.id === groupId) ?? null;

  const allContacts = useMemo(
    () => outbound.groups.filter((g) => (g.kind ?? "contacts") === "contacts").flatMap((g) => g.contacts ?? []),
    [outbound.groups]
  );

  const query = search.trim().toLowerCase();

  /** Categorized sections for the synthetic "All" option — one per real
   *  contact group that has at least one match, in `groups` order.
   *  Favorites is excluded — it duplicates contacts already reachable via
   *  their origin group. */
  const allSections = useMemo(() => {
    if (groupId !== ALL_GROUP_ID || !query) return [];
    return outbound.groups
      .filter((g) => (g.kind ?? "contacts") === "contacts")
      .map((g) => ({ group: g, contacts: (g.contacts ?? []).filter((c) => c.name.toLowerCase().includes(query)) }))
      .filter((section) => section.contacts.length > 0);
  }, [groupId, query, outbound.groups]);

  const singleGroupContacts = useMemo(() => {
    if (!activeGroup) return [];
    const base = activeGroup.kind === "favorites" ? allContacts.filter((c) => favoriteIds.has(c.id)) : activeGroup.contacts ?? [];
    return query ? base.filter((c) => c.name.toLowerCase().includes(query)) : base;
  }, [activeGroup, query, allContacts, favoriteIds]);

  const noMatches =
    groupId === ALL_GROUP_ID ? query.length > 0 && allSections.length === 0 : query.length > 0 && singleGroupContacts.length === 0;

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
      onSelectChannel={(channel, event) => {
        if (channel === "chat" && contact.kind === "agent" && outbound.onOpenInternalChat) {
          outbound.onOpenInternalChat(contact.id, { x: event.clientX, y: event.clientY });
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
  } else if (groupId === ALL_GROUP_ID) {
    content = query ? (
      <div className="flex flex-col pb-2">
        {allSections.map(({ group, contacts }, i) => (
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
    ) : (
      <p className="px-4 py-8 text-center lyra-body-sm text-lyra-fg-secondary">
        Start typing to search across every category.
      </p>
    );
  } else if (singleGroupContacts.length === 0) {
    content = (
      <p className="px-4 py-8 text-center lyra-body-sm text-lyra-fg-secondary">
        {activeGroup?.emptyMessage ?? "Nothing here yet."}
      </p>
    );
  } else {
    content = <div className="flex flex-col pb-2">{singleGroupContacts.map(renderContactRow)}</div>;
  }

  const groupOptions = [
    { value: ALL_GROUP_ID, label: "All" },
    ...outbound.groups.map((g) => ({ value: g.id, label: g.label })),
  ];

  const showSearchInput = screen.kind === "browse";

  /* ── Header — back/title/close row on every screen; group dropdown +
   *  search only on the browse screen. ── */
  const header = (
    <div className="border-b border-lyra-border-subtle">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex min-w-0 items-center gap-2">
          {screen.kind === "detail" && (
            <button
              type="button"
              onClick={() => setScreen({ kind: "browse" })}
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
              {screen.kind === "detail" ? "Outbound Call" : title}
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
      {screen.kind === "browse" && (
        <div className="flex flex-col gap-3 px-4 pb-4">
          {/* Phone/email/search-term entry leads — it's the primary action
           *  (type a number/address, or a name to filter the group below),
           *  so it sits above the group picker rather than under it. */}
          {showSearchInput && (
            <Input
              type="text"
              placeholder={activeGroup?.searchPlaceholder ?? "Enter phone, email or search term"}
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
          )}
          <Select
            label="Search"
            value={groupId}
            onValueChange={(v) => {
              setGroupId(v);
              setSearch("");
            }}
            options={groupOptions}
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
