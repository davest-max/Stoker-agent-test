import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "../lib/utils";
import { Menu } from "./menu";
import { Input } from "./input";
import { Popover, PopoverClose } from "./popover";
import { Tooltip } from "./tooltip";
import { Select, type SelectOption } from "./select";
import { Button } from "./button";
import { TableFooter } from "./table";
import { FavoriteButton } from "./favorite-button";
import { PhoneInput, PHONE_COUNTRIES, isPhoneNumberComplete, type PhoneValue } from "./phone-input";
import { Tag, type TagVariant } from "./tag";
import type { ChannelType } from "./channel-row";

/* ── Types ── */

export interface CreateNewItem {
  /** Channel label */
  label: string;
  /** Channel icon */
  icon: React.ReactNode;
  /** Called when the channel item is clicked */
  onClick?: () => void;
}

/** An agent's current availability, shown as a status chip next to their
 *  name in the Outbound picker's "Select Agent" list (see
 *  `AgentPresenceChip`/`ContactRow` below). Distinct from `AgentProfile`'s
 *  own `AgentStatus` (available/busy/away/offline) — that type is the
 *  *current, logged-in* agent's own status control; this is read-only
 *  presence for *other* agents being considered as an outbound recipient,
 *  which also needs an "in a call" state `AgentProfile` has no use for
 *  (an agent never sets their own status to "in a call" — that's an
 *  automatic, observed state, not a status code they pick). */
export type AgentPresenceStatus = "available" | "busy" | "away" | "offline" | "in-call";

const AGENT_PRESENCE_CONFIG: Record<AgentPresenceStatus, { label: string; variant: TagVariant }> = {
  available: { label: "Available", variant: "success" },
  busy:      { label: "Busy",      variant: "critical" },
  away:      { label: "Away",      variant: "warning" },
  offline:   { label: "Offline",   variant: "neutral" },
  "in-call": { label: "In a Call", variant: "info" },
};

function AgentPresenceChip({ status }: { status: AgentPresenceStatus }) {
  const { label, variant } = AGENT_PRESENCE_CONFIG[status];
  return <Tag label={label} variant={variant} shape="pill" className="flex-shrink-0" />;
}

export interface CreateNewContact {
  /** Unique id */
  id: string;
  /** Display name */
  name: string;
  /** Short avatar label — e.g. two initials */
  initials: string;
  /** Secondary line below the name — e.g. a customer/agent ID. Ignored when
   *  `queueCount`/`waitTimeSeconds` are set (skill records), since those
   *  render a queue/wait summary in this same spot instead. */
  subtitle?: string;
  /** Tailwind classes for the avatar circle's background + text color */
  avatarClassName?: string;
  /** Renders a status chip below the name, to the left of `subtitle` (see
   *  `AgentPresenceChip`) — set on agent and skill records; left unset for
   *  customers/teams, which have no individual presence concept. */
  status?: AgentPresenceStatus;
  /** Skill records only: number of contacts currently waiting in this
   *  skill's queue. Paired with `waitTimeSeconds` to render "Queue: {N}
   *  Wait Time: {M}m {S}s" in place of `subtitle`. */
  queueCount?: number;
  /** Skill records only: current estimated wait time, in seconds — see
   *  `queueCount`. */
  waitTimeSeconds?: number;
}

/** "Queue: {N}   Wait Time: {M}m {S}s" — the skill-row secondary text. */
function formatQueueText(queueCount: number, waitTimeSeconds: number): string {
  const minutes = Math.floor(waitTimeSeconds / 60);
  const seconds = waitTimeSeconds % 60;
  return `Queue: ${queueCount}   Wait Time: ${minutes}m ${seconds}s`;
}

export interface CreateNewCategory {
  /** Unique id */
  id: string;
  /** Display label — e.g. "Customers" */
  label: string;
  /** Leading icon shown on the category list */
  icon: React.ReactNode;
  /** Contacts/agents/teams/skills shown after picking this category */
  contacts: CreateNewContact[];
  /** Placeholder for the search field on this category's screen
   *  (defaults to "Search {label.toLowerCase()}") */
  searchPlaceholder?: string;
}

export interface CreateNewChannel {
  /** Unique id */
  id: string;
  /** Display label — e.g. "Call" */
  label: string;
  /** Leading icon */
  icon: React.ReactNode;
}

export interface CreateNewSelection {
  category: CreateNewCategory;
  contact: CreateNewContact;
  channel: CreateNewChannel;
}

/* ── Outbound flow types (screen 1: Outbound picker → screen 2: call
   setup). Fully independent of `items` and `categories`/`channels` above —
   see the `outbound` prop below. ── */

export interface CreateNewOutboundContact extends CreateNewContact {
  /** Which channels this contact can be reached on — filters both the
   *  per-row hover flyout and the detail screen's "Select Channel" options
   *  down to what's actually supported. */
  channels: ChannelType[];
  /** The addresses/numbers/handles currently in use across every live
   *  interaction this contact has open on each channel, if any (e.g. `{
   *  sms: ["+14565559981", "+14565550147"] }` for two simultaneous SMS
   *  threads on different numbers). The channel itself stays selectable in
   *  "Select Channel" (the agent can still review/switch to one) — only the
   *  matching option(s) in the detail screen's second field ("Select
   *  Phone" / "Select Email Address" / "Select WhatsApp Handle") are
   *  disabled, since starting another interaction on one of those exact
   *  addresses would just duplicate the one already running. Other
   *  addresses/numbers for the same channel (e.g. a third, unused outbound
   *  phone line) stay selectable. */
  openChannelAddresses?: Partial<Record<ChannelType, string[]>>;
  /** This contact's own labeled phone numbers (e.g. Mobile/Home/Work) for
   *  the detail screen's "Select Phone" dropdown on voice/SMS — same
   *  `{value, label}` shape as the outbound config's global `phoneOptions`,
   *  but specific to this one contact instead of one shared list every
   *  contact picks from. `value` is the dialable number, `label` the
   *  display text (recommended: "{Type} · {formatted number}", e.g.
   *  "Mobile · (555) 201-8842", so the agent sees both which line it is and
   *  the actual number before calling/texting). Falls back to the
   *  consumer's global `phoneOptions` when omitted — a contact doesn't need
   *  this unless it actually has more than one number worth distinguishing. */
  phoneNumbers?: { value: string; label: string }[];
  /** This contact's own labeled email addresses (e.g. Work/Personal) for
   *  the detail screen's "Select Email Address" dropdown — same shape and
   *  `label` convention as `phoneNumbers` above (e.g. "Work ·
   *  sofia@example.com"). Falls back to a single synthesized address when
   *  omitted. */
  emailAddresses?: { value: string; label: string }[];
  /** What kind of thing this contact actually is — a real customer/agent,
   *  or a routing concept (skill/team) or outside organization (external)
   *  synthesized into contact shape so it can sit in the same picker list.
   *  Purely descriptive — this component doesn't change behavior based on
   *  it (e.g. it doesn't affect which channels are offered; `channels`
   *  already covers that). A consumer showing contacts from more than one
   *  kind in the same list (e.g. a "Favorites" group mixing customers,
   *  agents, skills, and teams, or an "All" search across every group at
   *  once) can use this to render a per-row identifying icon so it's clear
   *  at a glance who — or what — a given row actually is, the same way a
   *  tab or section header already makes obvious when everything in view
   *  is one kind. Optional — omit for a picker that only ever shows one
   *  kind at a time, where that's redundant. */
  kind?: "customer" | "agent" | "skill" | "team" | "external";
}

export interface CreateNewOutboundGroup {
  /** Unique id — also the value used by the group Select. */
  id: string;
  /** Select option label, e.g. "Agents". */
  label: string;
  searchPlaceholder?: string;
  /** "contacts" (default when `contacts` is set) shows search + a paginated
   *  contact list. "dialpad" shows the phone quick-dial field instead of a
   *  list. "empty" always shows `emptyMessage`, with no favoriting concept.
   *  "favorites" shows whichever contacts (from *any* group) the user has
   *  starred via the per-row favorite button — `contacts` is ignored for
   *  this kind; `emptyMessage` still applies until at least one is starred. */
  kind?: "contacts" | "dialpad" | "empty" | "favorites";
  contacts?: CreateNewOutboundContact[];
  emptyMessage?: string;
}

export interface CreateNewChannelOption {
  /** Must line up with the values used in CreateNewOutboundContact.channels */
  id: ChannelType;
  /** Label in the per-row hover flyout, e.g. "Call" */
  label: string;
  /** Label in the detail screen's "Select Channel" dropdown, e.g. "Voice"
   *  (defaults to `label` when omitted). */
  selectLabel?: string;
  icon: React.ReactNode;
}

export interface CreateNewOutboundConfig {
  /** Screen 1 header (default: "New Outbound") */
  outboundTitle?: string;
  /** Dropdown options replacing the old category icon-menu — e.g.
   *  Favorites / Agents / Teams / Skills / Customers / Dial Pad. */
  groups: CreateNewOutboundGroup[];
  /** Which group is selected when screen 1 is first reached (defaults to
   *  the first entry in `groups`). */
  defaultGroupId?: string;
  /** Call/Email/SMS/WhatsApp definitions — drives both the per-row hover
   *  flyout and the detail screen's "Select Channel" dropdown. */
  channelOptions: CreateNewChannelOption[];
  /** Options for the detail screen's "Select Phone" dropdown */
  phoneOptions: { value: string; label: string }[];
  /** Options for the detail screen's "Outbound Skill" dropdown */
  skillOptions: { value: string; label: string }[];
  /** Fired when a number is submitted from a "dialpad"-kind group (Enter key) */
  onQuickDial?: (phoneNumber: string) => void;
  /** Fired when "Start Interaction" is pressed on the detail screen */
  onStartCall?: (selection: {
    contact: CreateNewOutboundContact;
    channel: ChannelType;
    phone: string;
    skillId: string;
  }) => void;
  /** Contacts per page in the paginated list (default: 10) */
  pageSize?: number;
  /** Imperatively opens the popover directly to the call-setup ("detail")
   *  screen for a specific contact+channel, bypassing this component's own
   *  group/contact list — e.g. `InteractionNavItem`'s own "Add Outbound"
   *  button (`OutboundAddButton` below) already knows which contact and
   *  channel to start, since the contact already has a live interaction
   *  card; re-picking the same contact from this popover's own list would
   *  be redundant. The contact is looked up across every group's
   *  `contacts` (same lookup "Favorites" uses), so the caller doesn't need
   *  to know which group it lives in. Compared by reference each render —
   *  set a new `{ contactId, channel }` object each time you want this to
   *  fire, and clear it back to `null` (see `onLaunchRequestHandled` below)
   *  once handled, so a later unrelated re-render doesn't replay it. */
  launchRequest?: { contactId: string; channel: ChannelType } | null;
  /** Fired immediately after `launchRequest` has been acted on. This
   *  component can't clear its own prop, so the consumer should use this to
   *  reset whatever state produced it back to `null`. */
  onLaunchRequestHandled?: () => void;
}

export interface CreateNewProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Flat list of channels shown directly under the header (default mode).
   *  Ignored when `categories` is provided. */
  items?: CreateNewItem[];
  /** Enables the drill-down flow: a phone-number field + category list
   *  (screen 1) → search + contact list for the chosen category (screen 2)
   *  → channel picker for the chosen contact (screen 3). Content is swapped
   *  in place with a back button, rather than opening a submenu flyout —
   *  see CONTRIBUTING.md; Radix has no dedicated primitive for this, it's
   *  just local view-stack state inside the one Popover.Content. */
  categories?: CreateNewCategory[];
  /** Channel options shown on the final screen once a contact is picked.
   *  Required for the drill-down flow (`categories`); has no effect
   *  otherwise. */
  channels?: CreateNewChannel[];
  /** Fired when a channel is picked for a contact on the final drill-down screen */
  onOutbound?: (selection: CreateNewSelection) => void;
  /** Enables the outbound flow: an Outbound picker (group dropdown + search
   *  + paginated contact list, with a per-row hover flyout for channel
   *  choice) → a call-setup screen. Fully independent of `items` and
   *  `categories`/`channels` above — when set, this takes over as screen 1
   *  instead of the plain phone-field + category root. */
  outbound?: CreateNewOutboundConfig;
  /** Fired when a number is submitted from the screen-1 phone field (Enter key) */
  onQuickDial?: (phoneNumber: string) => void;
  /** Placeholder for the screen-1 phone number field. Leave unset to use
   *  PhoneInput's own per-country example (e.g. "(555) 555-5555" for the
   *  US, "76 123 45 67" for Switzerland) — only set this to replace that
   *  with fixed text across every country. */
  phoneFieldPlaceholder?: string;
  /** Popover header title (default: "New Outbound") */
  title?: string;
  /**
   * Expanded mode: show a full-width secondary button with the title text
   * instead of the compact icon-only trigger. Used when the nav rail is open.
   */
  expanded?: boolean;
}

/* ── Drill-down view stack ── */

type Screen =
  | { kind: "root" }
  | { kind: "category"; categoryId: string }
  | { kind: "channels"; categoryId: string; contactId: string }
  | { kind: "group"; groupId: string }
  | { kind: "detail"; groupId: string; contactId: string; channel: ChannelType };

/* ── Contact row (internal) ──
   Purpose-built rather than routed through Menu: Menu's icon slot is sized
   for small (h-4/h-5) glyphs (see CONTRIBUTING.md "Icons" + existing
   icon+description usage in Menu.stories), not avatar-sized circles with a
   two-line name/subtitle — the same reason ConnectedAppsPanel's AppRow
   doesn't route through Menu either. Kept visually consistent with Menu's
   row states (hover/active/focus, rounded-lyra-sm, trailing chevron). */
function ContactRow({
  contact,
  onClick,
  highlighted,
  favorited,
  onToggleFavorite,
}: {
  contact: CreateNewContact;
  onClick: () => void;
  /** Forces the hover background on even when the cursor isn't actually
   *  over this row — used by OutboundContactRow so the row stays visibly
   *  "selected" while its channel flyout (which sits to the right, off the
   *  row itself) is open. Same convention as Menu's own submenu items:
   *  `(item.active || (hasSubmenu && submenuOpen)) && "bg-lyra-state-hover"`. */
  highlighted?: boolean;
  /** Outbound-flow only. Omit both this and `onToggleFavorite` to hide the
   *  favorite button entirely (e.g. the generic drill-down flow, which has
   *  no Favorites concept). */
  favorited?: boolean;
  onToggleFavorite?: () => void;
}) {
  return (
    // A <div role="button"> rather than a real <button>: FavoriteButton
    // below renders a native <button>, and nesting <button> inside <button>
    // is invalid HTML with unreliable click-bubbling across browsers. This
    // keeps the same click/keyboard/focus-visible behavior as a real button
    // while allowing that legitimate nested control. `group/row` is what
    // FavoriteButton hooks into to reveal itself only on hover/focus of
    // this row (see favorite-button.tsx).
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group/row flex w-full cursor-pointer items-center gap-3 rounded-lyra-sm px-3 py-2.5 text-left transition-colors",
        "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
        "focus:outline-none focus-visible:bg-lyra-state-hover",
        highlighted && "bg-lyra-state-hover"
      )}
    >
      {(() => {
        const hasQueueText = contact.queueCount != null && contact.waitTimeSeconds != null;
        const secondaryText = hasQueueText
          ? formatQueueText(contact.queueCount!, contact.waitTimeSeconds!)
          : contact.subtitle;
        return (
          <span className="min-w-0 flex-1">
            <span className="block truncate lyra-body-md text-lyra-fg-default">{contact.name}</span>
            {hasQueueText ? (
              // Skill rows: the queue/wait summary runs long ("Queue: 4
              // Wait Time: 3m 20s"), so it goes on its own line below the
              // status chip rather than squeezed onto the chip's row where
              // it'd truncate.
              <span className="flex min-w-0 flex-col items-start gap-1">
                {contact.status && <AgentPresenceChip status={contact.status} />}
                {secondaryText && (
                  <span className="block max-w-full truncate lyra-body-sm text-lyra-fg-secondary">{secondaryText}</span>
                )}
              </span>
            ) : (
              (contact.status || secondaryText) && (
                <span className="flex min-w-0 items-center gap-1.5">
                  {contact.status && <AgentPresenceChip status={contact.status} />}
                  {secondaryText && (
                    <span className="min-w-0 truncate lyra-body-sm text-lyra-fg-secondary">{secondaryText}</span>
                  )}
                </span>
              )
            )}
          </span>
        );
      })()}
      {onToggleFavorite && (
        <FavoriteButton favorited={!!favorited} onClick={onToggleFavorite} label={contact.name} placement="left" />
      )}
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />
    </div>
  );
}

/* ── Outbound contact row (internal) ──
   Wraps ContactRow with a hover-triggered channel flyout (Call/Email/SMS/
   WhatsApp), filtered to whichever channels this contact actually
   supports. Composes the shared Popover for the flyout's chrome/position/
   collision-avoidance rather than hand-rolling another portal+positioning
   implementation (Menu already has one for its own submenus; this is a
   different trigger shape — a rich avatar row, not a MenuItemDef — so it
   can't route through that mechanism directly, see ContactRow's own
   comment above). Hover timing (immediate open, 150ms close delay) matches
   Menu's own submenu hover exactly, for a consistent feel. */
function OutboundContactRow({
  contact,
  channelOptions,
  onSelect,
  favorited,
  onToggleFavorite,
}: {
  contact: CreateNewOutboundContact;
  channelOptions: CreateNewChannelOption[];
  onSelect: (channel: ChannelType) => void;
  favorited?: boolean;
  onToggleFavorite?: () => void;
}) {
  const [flyoutOpen, setFlyoutOpen] = React.useState(false);
  const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const openFlyout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setFlyoutOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setFlyoutOpen(false), 150);
  };
  React.useEffect(
    () => () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    },
    []
  );

  const availableChannels = channelOptions.filter((c) => contact.channels.includes(c.id));
  const defaultChannel = availableChannels.find((c) => c.id === "voice")?.id ?? availableChannels[0]?.id;

  return (
    <Popover
      open={flyoutOpen}
      onOpenChange={setFlyoutOpen}
      placement="right"
      align="center"
      sideOffset={4}
      showArrow={false}
      onOpenAutoFocus={(e) => e.preventDefault()}
      // This flyout is nested *inside* this component's own z-[9999]
      // popover panel, so it needs to clear its own parent — same lesson
      // as the AgentProfile star tooltip incident. See CONTRIBUTING.md §5
      // ("Popovers nested inside another popover").
      className="z-[10003] w-48 p-1"
      content={
        <div onMouseEnter={openFlyout} onMouseLeave={scheduleClose}>
          {availableChannels.length > 0 ? (
            <Menu
              items={availableChannels.map((c) => ({
                id: c.id,
                label: c.label,
                icon: c.icon,
                onClick: () => {
                  setFlyoutOpen(false);
                  onSelect(c.id);
                },
              }))}
              className="min-w-0 rounded-none border-0 bg-transparent p-0 shadow-none"
            />
          ) : (
            <p className="px-3 py-2 lyra-body-sm text-lyra-fg-secondary">No channels available</p>
          )}
        </div>
      }
    >
      <div onMouseEnter={openFlyout} onMouseLeave={scheduleClose}>
        <ContactRow
          contact={contact}
          highlighted={flyoutOpen}
          favorited={favorited}
          onToggleFavorite={onToggleFavorite}
          onClick={() => {
            if (defaultChannel) onSelect(defaultChannel);
          }}
        />
      </div>
    </Popover>
  );
}

/* ── Outbound "add" button (internal to the flyout, exported) ──
   Small standalone "+" trigger + click-to-open flyout listing the given
   channels — the same Menu-based flyout `OutboundContactRow` above uses for
   its own per-row hover trigger, factored out so other surfaces can offer
   the same channel choice without re-implementing it (composition over
   reimplementation, CONTRIBUTING.md §3). Built for `InteractionNavItem`'s
   own "Add Outbound" button (see its `headerAction` prop): an agent who
   already has a live interaction with a contact can start another channel
   with them directly from that card, without re-picking the same contact
   from this component's own Outbound picker list — see
   `CreateNewOutboundConfig.launchRequest`, which is how a channel picked
   here actually reaches this component's own call-setup screen.
   Unlike `OutboundContactRow`'s hover-triggered flyout (hover makes sense
   for a big clickable row), this opens on click, matching a plain icon
   button's normal interaction model. Uses the `z-[10003]` "popover nested
   inside another popover" tier (CONTRIBUTING.md §5), same as
   `OutboundContactRow`'s own flyout — not because this button's usual home
   (an `InteractionNavItem` card sitting directly in the nav rail) is nested
   in anything, but because `InteractionNavItem`'s compact-mode hover
   popover (see its own `headerAction` doc comment) also renders this exact
   button, and does so *nested inside* that popover. A fixed z-index can't
   tell which context it's in, and there's nothing else in this codebase
   that needs to sit between this tier and the nested tier above it, so
   using the higher, nesting-safe tier unconditionally is correct (if
   slightly conservative) in both places. */
export interface OutboundAddButtonProps {
  /** Channel definitions (icon + label) to offer — already filtered down to
   *  whichever channels the underlying contact/agent actually supports,
   *  e.g. `outbound.channelOptions.filter((c) =>
   *  contact.channels.includes(c.id))`. */
  channelOptions: CreateNewChannelOption[];
  /** Called with the chosen channel; the flyout closes itself first. */
  onSelect: (channel: ChannelType) => void;
  /** Tooltip text and button `aria-label` (default: "Add Outbound"). */
  label?: string;
  className?: string;
}

const OutboundAddButton = React.forwardRef<HTMLButtonElement, OutboundAddButtonProps>(
  ({ channelOptions, onSelect, label = "Add Outbound", className }, ref) => {
    const [open, setOpen] = useState(false);
    return (
      <Tooltip content={label} placement="top" disabled={open}>
        {/* Wrap the whole Popover (not just its trigger) in a plain span —
            same Tooltip+Popover composition as this component's own
            collapsed trigger below and AgentProfile's own trigger: Tooltip's
            Trigger clones hover/focus props onto its immediate child via
            Radix Slot, which Popover doesn't forward through to its
            internals. */}
        <span className="inline-flex">
          <Popover
            open={open}
            onOpenChange={setOpen}
            placement="bottom"
            align="end"
            sideOffset={4}
            showArrow={false}
            onOpenAutoFocus={(e) => e.preventDefault()}
            // Radix's FocusScope schedules a delayed (exit-animation +
            // setTimeout(0)) refocus of whatever had focus before this
            // popover opened — i.e. this trigger button — when its Content
            // unmounts. That refocus fires as a real document `focusin`
            // event *after* selecting a channel has already opened
            // CreateNew's own Popover via `launchRequest`, and lands on an
            // element outside CreateNew's Content. CreateNew's own
            // DismissableLayer sees that as an outside-focus and immediately
            // dismisses itself — the reported "flashes open then closes"
            // bug. This button's flow always hands off to a different
            // surface (CreateNew) on selection, so returning focus here
            // serves no purpose; suppress it.
            onCloseAutoFocus={(e) => e.preventDefault()}
            // z-[10003], not the top-level z-[9999] — see this component's
            // own doc comment above for why.
            className="z-[10003] w-48 p-1"
            content={
              channelOptions.length > 0 ? (
                <Menu
                  items={channelOptions.map((c) => ({
                    id: c.id,
                    label: c.label,
                    icon: c.icon,
                    onClick: () => {
                      setOpen(false);
                      onSelect(c.id);
                    },
                  }))}
                  className="min-w-0 rounded-none border-0 bg-transparent p-0 shadow-none"
                />
              ) : (
                <p className="px-3 py-2 lyra-body-sm text-lyra-fg-secondary">No channels available</p>
              )
            }
          >
            <button
              ref={ref}
              type="button"
              aria-label={label}
              // Card rows that host this button (e.g. InteractionNavItem)
              // are themselves clickable — stop the click from also
              // bubbling up and selecting the whole card, same pattern
              // FavoriteButton/KebabMenuButton use for the same reason.
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lyra-sm",
                "text-lyra-fg-secondary transition-colors",
                "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
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
);
OutboundAddButton.displayName = "OutboundAddButton";

/* ── useOutboundAddButton ──
   Every "Agent Next Gen" consumer (agent-next-gen-v1/AgentNextGenPage.tsx,
   AgentNextGenTemplate.stories.tsx, LeftNav.stories.tsx's "Agent Next Gen
   Left Nav" story) renders a live list of `InteractionNavItem` cards and
   wants the exact same "+" behavior on each one: look up that interaction's
   underlying outbound contact, build an `OutboundAddButton` scoped to
   whatever channels that contact actually supports (falling back to the
   full unfiltered list when there's no matching contact — e.g. a
   quick-dialed number or a fixed demo card), and route a picked channel
   into `CreateNew`'s `launchRequest` deep link. Before this hook existed,
   each of those three files had its own hand-copied version of this exact
   logic — three independent copies of the same ~15 lines meant to stay
   identical forever, which is exactly the kind of thing that quietly drifts
   (one file's copy fell out of date describing behavior the others no
   longer had). Extracting it here means there's only one implementation to
   get right, and every consumer calling it is structurally guaranteed to
   match the others — nothing to keep "in sync" by hand anymore. */
export interface UseOutboundAddButtonResult {
  /** Pass straight through to `CreateNewOutboundConfig.launchRequest`. */
  launchRequest: { contactId: string; channel: ChannelType } | null;
  /** Pass straight through to `CreateNewOutboundConfig.onLaunchRequestHandled`. */
  onLaunchRequestHandled: () => void;
  /** Build the `headerAction` for one `InteractionNavItem` card, keyed by
   *  that interaction's id. Looks up the id in `outboundConfig.groups`;
   *  when found, scopes the flyout to that contact's own `channels`, and
   *  when not (quick-dialed numbers, fixed demo cards with no backing
   *  contact record), offers the full unfiltered `channelOptions` instead
   *  of omitting the button — every card gets a "+", per design. */
  getHeaderAction: (interactionId: string) => React.ReactNode;
}

export function useOutboundAddButton(
  outboundConfig: Pick<CreateNewOutboundConfig, "groups" | "channelOptions">
): UseOutboundAddButtonResult {
  const [launchRequest, setLaunchRequest] = useState<{ contactId: string; channel: ChannelType } | null>(null);

  const contactsById = useMemo(
    () => new Map(outboundConfig.groups.flatMap((g) => g.contacts ?? []).map((c) => [c.id, c])),
    [outboundConfig]
  );

  const getHeaderAction = useCallback(
    (interactionId: string) => {
      const contact = contactsById.get(interactionId);
      const channelOptions = contact
        ? outboundConfig.channelOptions.filter((c) => contact.channels.includes(c.id))
        : outboundConfig.channelOptions;
      return (
        <OutboundAddButton
          channelOptions={channelOptions}
          onSelect={(channel) => setLaunchRequest({ contactId: interactionId, channel })}
        />
      );
    },
    [contactsById, outboundConfig.channelOptions]
  );

  return {
    launchRequest,
    onLaunchRequestHandled: useCallback(() => setLaunchRequest(null), []),
    getHeaderAction,
  };
}

/* ── CreateNew ── */

const CreateNew = React.forwardRef<HTMLButtonElement, CreateNewProps>(
  (
    {
      className,
      items,
      categories,
      channels,
      onOutbound,
      onQuickDial,
      phoneFieldPlaceholder,
      title = "New Outbound",
      expanded = false,
      outbound,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const isOutboundFlow = !!outbound;
    // The Outbound picker is screen 1 of this flow (there's no separate
    // top-level action list to land on first) — same fallback used by the
    // group Select's own default.
    const initialOutboundGroupId = outbound?.defaultGroupId ?? outbound?.groups[0]?.id;
    const [stack, setStack] = useState<Screen[]>(
      isOutboundFlow ? [{ kind: "group", groupId: initialOutboundGroupId ?? "" }] : [{ kind: "root" }]
    );
    const [search, setSearch] = useState("");
    // Shared by the drill-down flow's screen-1 quick-dial field and the
    // outbound flow's "dialpad"-kind group — the two are mutually exclusive
    // per component instance (isDrillDown / isOutboundFlow never both true),
    // so one PhoneValue suffices for whichever is actually rendered.
    const [phone, setPhone] = useState<PhoneValue>({ countryCode: "us", number: "" });
    const [page, setPage] = useState(1);
    const pageSize = outbound?.pageSize ?? 10;
    // Detail-screen selections — editable on screen 2 (Select Channel can be
    // changed from whatever the flyout/row click seeded it with), so these
    // live in their own state rather than being read straight off the
    // Screen object. Reset whenever a "detail" screen is pushed (see
    // goToDetail below), same pattern as `search` being reset in
    // pushScreen/popScreen.
    const [detailChannel, setDetailChannel] = useState<ChannelType | "">("");
    const [detailPhone, setDetailPhone] = useState("");
    const [detailSkill, setDetailSkill] = useState("");
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    // Set right before the `launchRequest` effect below opens this popover
    // programmatically, and read (then cleared) inside `onOpenAutoFocus` on
    // the `Popover` call further down. A normal open (the agent clicking
    // this component's own trigger button) intentionally cancels Radix's
    // auto-focus so focus stays on that trigger; a `launchRequest`-driven
    // open has no such trigger click to preserve — the click that caused it
    // happened on a completely unrelated element elsewhere on the page
    // (e.g. `InteractionNavItem`'s own "Add Outbound" button) — so letting
    // Radix's default auto-focus land on the first focusable field inside
    // this popover's content is exactly what's needed, and doing so is what
    // fixes the "opens, then instantly closes again" flash a bug report
    // described: without it, focus stayed on that unrelated trigger,
    // Radix's dismissable layer saw focus sitting *outside* the newly
    // mounted popover, and treated that as an outside interaction.
    const openedViaLaunchRequestRef = React.useRef(false);
    // Favorited contact ids, toggled by FavoriteButton (add or remove — see
    // favorite-button.tsx). Persists across popover open/close, unlike the
    // transient search/page state reset in the effect below, since a
    // favorites list that forgot itself every time you closed the popover
    // wouldn't be much of a favorites list.
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    const isDrillDown = !isOutboundFlow && !!categories && categories.length > 0;
    const screen = stack[stack.length - 1];

    // Reset the drill-down view whenever the popover closes, so it always
    // reopens at screen 1 instead of wherever the user last left it.
    //
    // Delayed, not immediate: Popover's own content stays mounted and
    // visible for its `data-[state=closed]` exit animation (100ms, see
    // popover.tsx) after `open` flips to false — Radix doesn't remove it
    // from the DOM until that animation finishes. Resetting synchronously
    // here used to swap the still-fading-out content back to the default
    // screen (e.g. the Agents list) mid-close, so users saw a jarring
    // flash of the initial state instead of the popover simply fading away
    // showing whatever screen they'd actually left it on. Waiting past the
    // animation means the reset only ever happens once the content is
    // already fully hidden, so it's invisible.
    React.useEffect(() => {
      if (!open) {
        const t = setTimeout(() => {
          setStack(isOutboundFlow ? [{ kind: "group", groupId: initialOutboundGroupId ?? "" }] : [{ kind: "root" }]);
          setSearch("");
          setPhone({ countryCode: "us", number: "" });
          setPage(1);
        }, 200);
        return () => clearTimeout(t);
      }
      // isOutboundFlow/initialOutboundGroupId are derived from a prop that
      // isn't expected to change after mount; omitting them keeps this
      // effect scoped to open/close only.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Focus the search field when landing on a category's (or, in the
    // outbound flow, a "contacts"-kind group's) screen, matching the
    // auto-focus-the-search-field pattern used elsewhere (e.g. AgentProfile).
    React.useEffect(() => {
      const groupKind = screen.kind === "group" ? outbound?.groups.find((g) => g.id === screen.groupId)?.kind ?? "contacts" : undefined;
      const isSearchableGroup = groupKind === "contacts" || groupKind === "favorites";
      if (screen.kind === "category" || isSearchableGroup) {
        searchInputRef.current?.focus();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    // Reset to page 1 whenever the search term or the active group changes,
    // so switching groups/searching never leaves you stranded on a page
    // that no longer exists for the new result set.
    React.useEffect(() => {
      setPage(1);
    }, [search, screen.kind === "group" ? screen.groupId : null]);

    const pushScreen = (s: Screen) => {
      setSearch("");
      setStack((prev) => [...prev, s]);
    };
    const popScreen = () => {
      setSearch("");
      setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    };
    // Switching the group dropdown swaps screen 1's content in place rather
    // than growing the back-stack — the Select is the control for "which
    // group", not a navigation action in its own right.
    const setActiveGroup = (groupId: string) => {
      setSearch("");
      setStack((prev) => [...prev.slice(0, -1), { kind: "group", groupId }]);
    };
    // Screen 2's second field means something different per channel: an
    // actual phone number for Call/SMS (from `outbound.phoneOptions`), or a
    // synthesized address/handle for Email/WhatsApp — there's no per-contact
    // email or handle in CreateNewOutboundContact, so these are derived from
    // the contact's name for demo purposes rather than looked up. Never
    // defaults to an address already open for this contact/channel (see
    // CreateNewOutboundContact.openChannelAddresses) — those addresses are
    // filtered out of the field entirely (not just disabled, see
    // `detailFieldMeta` below), so defaulting to one would silently
    // pre-select a value that isn't even in the list. Falls back to "" when
    // every option for this channel is already in use (email/WhatsApp only
    // ever have the one derived option, so that's the only way they can run
    // out; phone falls back to "" only once every one of
    // `outbound.phoneOptions` is open).
    const defaultDetailValueFor = (contact: CreateNewOutboundContact, channel: ChannelType): string => {
      const openAddresses = contact.openChannelAddresses?.[channel] ?? [];
      if (channel === "email") {
        const value = `${contact.name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
        return openAddresses.includes(value) ? "" : value;
      }
      if (channel === "whatsapp") {
        const value = `@${contact.name}`;
        return openAddresses.includes(value) ? "" : value;
      }
      return (outbound?.phoneOptions ?? []).find((o) => !openAddresses.includes(o.value))?.value ?? "";
    };

    const goToDetail = (groupId: string, contact: CreateNewOutboundContact, channel: ChannelType) => {
      setDetailChannel(channel);
      setDetailPhone(defaultDetailValueFor(contact, channel));
      setDetailSkill("");
      pushScreen({ kind: "detail", groupId, contactId: contact.id, channel });
    };

    const activeCategory =
      screen.kind === "category" || screen.kind === "channels"
        ? categories?.find((c) => c.id === screen.categoryId)
        : undefined;
    const activeContact =
      screen.kind === "channels" ? activeCategory?.contacts.find((c) => c.id === screen.contactId) : undefined;

    const filteredContacts = activeCategory
      ? search.trim()
        ? activeCategory.contacts.filter(
            (c) =>
              c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
              c.subtitle?.toLowerCase().includes(search.trim().toLowerCase())
          )
        : activeCategory.contacts
      : [];

    // ── Outbound flow derived state ──
    const activeGroup =
      screen.kind === "group" || screen.kind === "detail"
        ? outbound?.groups.find((g) => g.id === screen.groupId)
        : undefined;
    // Every contact across every group, so a "favorites" group can show
    // starred contacts regardless of which group they actually live in —
    // its own `contacts` (if any) is ignored for this kind (see the
    // CreateNewOutboundGroup.kind doc comment).
    const allOutboundContacts = React.useMemo(
      () => (outbound?.groups ?? []).flatMap((g) => g.contacts ?? []),
      [outbound]
    );
    const activeGroupContacts =
      activeGroup?.kind === "favorites"
        ? allOutboundContacts.filter((c) => favoriteIds.has(c.id))
        : activeGroup?.contacts ?? [];
    const filteredGroupContacts = search.trim()
      ? activeGroupContacts.filter(
          (c) =>
            c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
            c.subtitle?.toLowerCase().includes(search.trim().toLowerCase())
        )
      : activeGroupContacts;
    const totalGroupPages = Math.max(1, Math.ceil(filteredGroupContacts.length / pageSize));
    const safePage = Math.min(page, totalGroupPages);
    const pagedGroupContacts = filteredGroupContacts.slice(
      (safePage - 1) * pageSize,
      safePage * pageSize
    );

    const activeOutboundContact =
      screen.kind === "detail" ? activeGroupContacts.find((c) => c.id === screen.contactId) : undefined;
    const availableChannelsForContact = (outbound?.channelOptions ?? []).filter((c) =>
      activeOutboundContact ? activeOutboundContact.channels.includes(c.id) : true
    );
    // The address(es) already in use for the currently selected channel, if
    // any — drives which option(s) get disabled in the detail screen's
    // second field below (see CreateNewOutboundContact.openChannelAddresses'
    // own doc comment for why only those specific options are disabled
    // rather than the whole field or the channel itself).
    const activeAddressesForChannel: string[] =
      (detailChannel && activeOutboundContact?.openChannelAddresses?.[detailChannel]) || [];

    // goToDetail seeds the right default the moment screen 2 is entered, but
    // "Select Channel" stays editable once there (see its own comment) — if
    // the user switches channel on-screen, the second field needs to swap
    // from a phone number to a synthesized email/handle (or back) too.
    React.useEffect(() => {
      if (screen.kind !== "detail" || !activeOutboundContact || !detailChannel) return;
      setDetailPhone(defaultDetailValueFor(activeOutboundContact, detailChannel));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailChannel]);

    // External deep-link (see `CreateNewOutboundConfig.launchRequest`'s own
    // doc comment) — e.g. `InteractionNavItem`'s "Add Outbound" button
    // already knows which contact+channel to start, so this jumps straight
    // to the call-setup screen for it instead of making the agent re-pick
    // the same contact from this popover's own list. Resets the stack to
    // exactly [group, detail] rather than pushing onto whatever was already
    // there, so the back button returns to that contact's own group list
    // regardless of what screen this popover happened to be showing (or was
    // left showing) beforehand.
    React.useEffect(() => {
      const req = outbound?.launchRequest;
      if (!req) return;
      const contact = allOutboundContacts.find((c) => c.id === req.contactId);
      if (!contact) {
        outbound?.onLaunchRequestHandled?.();
        return;
      }
      const group = (outbound?.groups ?? []).find((g) => (g.contacts ?? []).some((c) => c.id === req.contactId));
      const groupId = group?.id ?? initialOutboundGroupId ?? "";
      // Deferred one tick: this is very often triggered by *closing* a
      // different, unrelated Radix Popover elsewhere on the page first (e.g.
      // InteractionNavItem's own "Add Outbound" flyout, see
      // OutboundAddButton) — its onSelect fires (setting launchRequest) in
      // the very same click that closes it. Opening this popover
      // synchronously in that same tick raced with the other one's own
      // close/unmount and focus teardown: this popover's Radix dismissable
      // layer would see focus land outside itself (since focus was still
      // settling from the just-closed flyout, not this popover's own
      // trigger) and immediately treat that as an outside interaction,
      // closing it right back — a visible open-then-instantly-close flash.
      // Letting the other popover's close finish first (one macrotask) before
      // this one opens avoids the race entirely.
      const t = setTimeout(() => {
        setDetailChannel(req.channel);
        setDetailPhone(defaultDetailValueFor(contact, req.channel));
        setDetailSkill("");
        setSearch("");
        setStack([{ kind: "group", groupId }, { kind: "detail", groupId, contactId: contact.id, channel: req.channel }]);
        openedViaLaunchRequestRef.current = true;
        setOpen(true);
        outbound?.onLaunchRequestHandled?.();
      }, 0);
      return () => clearTimeout(t);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [outbound?.launchRequest]);

    // Label + options for screen 2's second field, matching whichever
    // channel is currently selected — see defaultDetailValueFor above for
    // why email/whatsapp are single synthesized options rather than a list.
    // Any option whose value appears in `activeAddressesForChannel` — an
    // address already in use for an open interaction with this contact
    // (there can be more than one, e.g. two open SMS threads on different
    // numbers) — is dropped from the list entirely rather than shown
    // disabled: an address that can't be picked shouldn't appear as a
    // choice (or, worse, sit there pre-selected — see
    // `defaultDetailValueFor` above) in the first place. When that leaves
    // no options at all (e.g. email/WhatsApp's one derived address is
    // already open), the field just renders empty — no value, no
    // placeholder — rather than falling back to the unavailable address.
    const detailFieldMeta = (() => {
      const withoutActive = (options: SelectOption[]): SelectOption[] =>
        activeAddressesForChannel.length > 0
          ? options.filter((o) => !activeAddressesForChannel.includes(o.value))
          : options;
      if (detailChannel === "email") {
        const value = activeOutboundContact ? defaultDetailValueFor(activeOutboundContact, "email") : "";
        return { label: "Select Email Address", options: withoutActive(value ? [{ value, label: value }] : []) };
      }
      if (detailChannel === "whatsapp") {
        const value = activeOutboundContact ? defaultDetailValueFor(activeOutboundContact, "whatsapp") : "";
        return { label: "Select WhatsApp Handle", options: withoutActive(value ? [{ value, label: value }] : []) };
      }
      return { label: "Select Phone", options: withoutActive(outbound?.phoneOptions ?? []) };
    })();

    const handleStartCall = () => {
      if (!outbound || !activeOutboundContact || !detailChannel || !detailSkill) return;
      outbound.onStartCall?.({
        contact: activeOutboundContact,
        channel: detailChannel,
        phone: detailPhone,
        skillId: detailSkill,
      });
      setOpen(false);
    };

    // Shared by the dialpad group's "Dial Number" button and its Enter-to-dial
    // keyboard shortcut, so both agree on exactly what counts as dialable —
    // isPhoneNumberComplete is the same per-country digit-count check
    // PhoneInput uses internally for its own validation error, reused here
    // instead of re-deriving it (CONTRIBUTING.md §1).
    const selectedPhoneCountry = PHONE_COUNTRIES.find((c) => c.code === phone.countryCode) ?? PHONE_COUNTRIES[0];
    const isDialpadNumberValid = isPhoneNumberComplete(phone.number, selectedPhoneCountry);
    const handleDialNumber = () => {
      if (!isDialpadNumberValid) return;
      outbound?.onQuickDial?.(`${selectedPhoneCountry.dial}${phone.number}`);
      setOpen(false);
    };

    const headerTitle =
      screen.kind === "root"
        ? title
        : screen.kind === "category"
        ? activeCategory?.label ?? title
        : screen.kind === "channels"
        ? activeContact?.name ?? title
        : screen.kind === "group"
        ? outbound?.outboundTitle ?? "New Outbound"
        : /* screen.kind === "detail" */ activeOutboundContact?.name ?? outbound?.outboundTitle ?? "New Outbound";

    // Back button shows on any drill-down sub-screen, and on the outbound
    // flow's "detail" sub-screen — lets the user return to the contact list
    // to pick a different channel/contact without closing and reopening the
    // whole popover. The outbound flow's "group" screen is itself screen 1
    // now (no action list above it to go back to), so it gets no back button.
    const showBackButton =
      (isDrillDown && screen.kind !== "root") ||
      (isOutboundFlow && screen.kind === "detail");

    // A single persistent button, not two JSX branches swapped by
    // `expanded` — its width/colors/padding and the label's reveal are all
    // driven by conditional classes on the *same* element so the
    // open↔collapse transition is one continuous CSS animation instead of
    // an instant unmount/remount. `duration-200` matches LeftNav's own nav
    // width transition (`transition-all duration-200` in left-nav.tsx) so
    // the button and the rail it sits in move in step. This was previously
    // two separate `<button>`s (compact vs. full-width secondary) picked by
    // a ternary — every toggle destroyed and recreated the DOM node (and,
    // via the Tooltip-wrapping branch below, the whole Popover along with
    // it), which is why the open animation looked "elegant" (the label
    // simply appeared once the new node existed) but closing looked
    // "clunky" (the full label was still on-screen the instant the node
    // was swapped out, with no transition possible on a node that no
    // longer exists).
    const trigger = (
      <button
        ref={ref}
        aria-label={title}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          // Same tokens as Button's "default" (primary) variant — see
          // button.tsx's buttonVariants — reused directly rather than
          // guessed, per CONTRIBUTING.md §1. No border: a primary button is
          // a solid fill, unlike the previous outline/secondary treatment.
          "flex h-9 items-center justify-center rounded-lyra-sm overflow-hidden",
          "bg-lyra-bg-primary text-lyra-fg-on-primary transition-all duration-200",
          "hover:bg-lyra-state-hover-primary active:bg-lyra-state-pressed-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
          expanded ? "w-full px-4" : "w-9 px-0",
          className
        )}
        {...props}
      >
        <Plus className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
        {/* Spacing between icon and label lives on the label itself
            (`ml-2`/`ml-0`), not a `gap-*` on the button — a flex `gap`
            reserves space between items even when one has zero width,
            which pushed the icon a few pixels off-center in the collapsed
            state (visible in devtools: the "0 × 20" label span still ate
            into the layout via the gap). Zeroing the label's own margin
            alongside its width/opacity means it contributes nothing at all
            when collapsed, so the icon centers exactly — while still
            keeping every property transition-able for a smooth reveal
            (unlike `display: none`, which can't be animated and would
            reintroduce the abrupt open/close swap this component was just
            fixed to avoid). */}
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

    // Header — swaps between the static title and a back-button + dynamic
    // title as the drill-down stack grows/shrinks. For the outbound flow's
    // "group" screen, the group picker + search field ride along here too,
    // so both stay pinned above the scrollable contact list rather than
    // scrolling away with it (Popover's `header` prop renders outside the
    // scroll area, same as `footer`).
    const popoverHeader = (
      <>
        <div className="flex items-center gap-1.5 border-b border-lyra-border-subtle px-4 py-3">
          {showBackButton && (
            <button
              type="button"
              aria-label="Back"
              onClick={popScreen}
              className={cn(
                "-ml-1.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lyra-sm",
                "text-lyra-fg-secondary transition-colors",
                "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
              )}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
          <span className="min-w-0 flex-1 truncate lyra-body-lg-emphasis text-lyra-fg-default">
            {headerTitle}
          </span>
          <PopoverClose asChild>
            <button
              aria-label="Close"
              className={cn(
                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lyra-sm",
                "text-lyra-fg-secondary transition-colors",
                "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
              )}
            >
              <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </PopoverClose>
        </div>

        {isOutboundFlow && screen.kind === "group" && activeGroup && (
          <div className="border-b border-lyra-border-subtle px-4 py-3 space-y-3">
            <Select
              aria-label="Choose group"
              value={activeGroup.id}
              onValueChange={setActiveGroup}
              options={(outbound?.groups ?? []).map((g) => ({ value: g.id, label: g.label }))}
              portalDropdown
            />
            {((activeGroup.kind ?? "contacts") === "contacts" || activeGroup.kind === "favorites") && (
              <div className="relative">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={activeGroup.searchPlaceholder ?? `Search ${activeGroup.label.toLowerCase()}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  startIcon={<Search className="h-4 w-4 text-lyra-fg-disabled" strokeWidth={1.4} aria-hidden="true" />}
                  endIcon={search ? <X className="h-4 w-4 text-lyra-fg-disabled" strokeWidth={1.5} aria-hidden="true" /> : undefined}
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Drill-down flow's category screen: same "search pinned outside
            the scroll area" treatment as the outbound flow's group/contacts
            search above, moved here (out of `content`) for the same reason —
            see the maxHeight/overflow note on the Popover call below. */}
        {isDrillDown && screen.kind === "category" && activeCategory && (
          <div className="border-b border-lyra-border-subtle px-4 py-3">
            <div className="relative">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={activeCategory.searchPlaceholder ?? `Search ${activeCategory.label.toLowerCase()}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                startIcon={<Search className="h-4 w-4 text-lyra-fg-disabled" strokeWidth={1.4} aria-hidden="true" />}
                endIcon={search ? <X className="h-4 w-4 text-lyra-fg-disabled" strokeWidth={1.5} aria-hidden="true" /> : undefined}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                />
              )}
            </div>
          </div>
        )}
      </>
    );

    const popover = (
      <Popover
        open={open}
        onOpenChange={setOpen}
        placement="bottom"
        align="start"
        sideOffset={6}
        showArrow={false}
        onOpenAutoFocus={(e) => {
          // See `openedViaLaunchRequestRef`'s own doc comment above — only
          // cancel Radix's auto-focus for a normal user-click open (the
          // default keeps focus on this component's own trigger button,
          // which the agent just clicked); a launchRequest-driven open has
          // no such trigger click to preserve focus on, and needs Radix's
          // real auto-focus to land inside this content instead.
          if (openedViaLaunchRequestRef.current) {
            openedViaLaunchRequestRef.current = false;
            return;
          }
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // On any sub-screen with a back button (see showBackButton above),
          // Escape steps back one level instead of closing the whole
          // popover outright. Only screens with no back step (screen 1,
          // drill-down's root category list) fall through to the default
          // close-the-popover behavior.
          if (showBackButton) {
            e.preventDefault();
            popScreen();
          }
        }}
        // Always clamped to whatever room Radix Popper actually measured
        // between the trigger and the viewport edge (falling back to 480px
        // before that's known) — every screen, not just the ones with long
        // lists. Previously this was only set for "detail"/contacts-group
        // screens; every other screen (root, category, channels, dialpad,
        // favorites/empty groups) had no height ceiling at all, so a long
        // enough list could grow the popover taller than the viewport had
        // room for — Radix would still try to keep it on-screen, but the
        // content itself could briefly render past the edge (or force the
        // page to scroll) before that settled, which read as a flash of
        // stray overflow-x/overflow-y on open. Unconditionally capping the
        // height means the popover can never exceed available space in the
        // first place — its own internal list scrolls instead (see the
        // scroll-wrapper `div` inside popover.tsx that this activates).
        maxHeight="var(--radix-popper-available-height, 480px)"
        header={popoverHeader}
        footer={
          screen.kind === "detail" ? (
            <div className="border-t border-lyra-border-subtle p-4">
              <Button
                variant="default"
                size="lg"
                className="w-full"
                disabled={!detailSkill}
                onClick={handleStartCall}
              >
                Start Interaction
              </Button>
            </div>
          ) : screen.kind === "group" && (activeGroup?.kind ?? "contacts") === "contacts" ? (
            <TableFooter
              currentPage={safePage}
              totalPages={totalGroupPages}
              onPageChange={setPage}
              rowsPerPage={pageSize}
              totalRecords={filteredGroupContacts.length}
              displayStart={filteredGroupContacts.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
              displayEnd={Math.min(safePage * pageSize, filteredGroupContacts.length)}
              showRowsPerPage={false}
              showJumpButtons={false}
              className="px-4"
            />
          ) : screen.kind === "group" && activeGroup?.kind === "dialpad" ? (
            <div className="border-t border-lyra-border-subtle p-4">
              <Button
                variant="default"
                size="lg"
                className="w-full"
                disabled={!isDialpadNumberValid}
                onClick={handleDialNumber}
              >
                Dial Number
              </Button>
            </div>
          ) : undefined
        }
        className={cn(
          /* "lg" on the Menu/Popover width scale (CONTRIBUTING.md) —
             header + close button + icon items warrants the largest step. */
          "z-[9999] w-[320px] overflow-hidden"
        )}
        content={
          <>
            {isOutboundFlow ? (
              /* key={} forces a remount on every screen change so the
                 animate-in transition replays each time content is swapped —
                 same technique as the generic drill-down branch below. */
              <div
                key={
                  screen.kind === "group"
                    ? `group:${screen.groupId}`
                    : screen.kind === "detail"
                    ? `detail:${screen.groupId}:${screen.contactId}`
                    : "outbound"
                }
                className="animate-in fade-in-0 slide-in-from-right-1 duration-150"
              >
                {screen.kind === "group" && activeGroup && (
                  (activeGroup.kind ?? "contacts") === "dialpad" ? (
                    // PhoneInput (country selector + digit mask + validation)
                    // rather than a hand-rolled `<Input type="tel">` — see
                    // CONTRIBUTING.md §3 "Composition over reimplementation".
                    // PhoneInput has no onKeyDown/onSubmit prop of its own,
                    // so Enter-to-dial is caught here via ordinary DOM
                    // bubbling from its underlying <input> instead.
                    <div
                      className="p-4"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleDialNumber();
                        }
                      }}
                    >
                      {/* No `placeholder` override here — PhoneInput's own
                          per-country example (e.g. "(555) 555-5555" for the
                          US) is more useful than a fixed generic string, and
                          it updates automatically as the country changes.
                          `dropdownClassName="z-[10003]"`: the country
                          dropdown is a Popover nested inside this
                          component's own z-[9999] popover panel — same
                          nested-popover case as the per-row channel flyout,
                          see CONTRIBUTING.md §5. */}
                      <PhoneInput value={phone} onChange={setPhone} dropdownClassName="z-[10003]" />
                    </div>
                  ) : activeGroup.kind === "empty" ? (
                    <p className="px-4 py-8 text-center lyra-body-sm text-lyra-fg-secondary">
                      {activeGroup.emptyMessage ?? `No ${activeGroup.label.toLowerCase()} yet`}
                    </p>
                  ) : (
                    <div className="p-2">
                      {pagedGroupContacts.length > 0 ? (
                        pagedGroupContacts.map((contact) => (
                          <OutboundContactRow
                            key={contact.id}
                            contact={contact}
                            channelOptions={outbound?.channelOptions ?? []}
                            onSelect={(ch) => goToDetail(activeGroup.id, contact, ch)}
                            favorited={favoriteIds.has(contact.id)}
                            onToggleFavorite={() =>
                              setFavoriteIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(contact.id)) next.delete(contact.id);
                                else next.add(contact.id);
                                return next;
                              })
                            }
                          />
                        ))
                      ) : (
                        <p className="px-3 py-6 text-center lyra-body-sm text-lyra-fg-secondary">
                          {activeGroupContacts.length === 0
                            ? activeGroup.kind === "favorites"
                              ? activeGroup.emptyMessage ?? "No favorites yet"
                              : `No ${activeGroup.label.toLowerCase()} available`
                            : `No matching ${activeGroup.label.toLowerCase()}`}
                        </p>
                      )}
                    </div>
                  )
                )}

                {screen.kind === "detail" && activeOutboundContact && (
                  <div className="p-4 space-y-4">
                    <Select
                      label="Select Channel"
                      value={detailChannel || undefined}
                      onValueChange={(v) => setDetailChannel(v as ChannelType)}
                      options={availableChannelsForContact.map((c) => ({
                        value: c.id,
                        label: c.selectLabel ?? c.label,
                      }))}
                    />
                    <Select
                      label={detailFieldMeta.label}
                      value={detailPhone || undefined}
                      onValueChange={setDetailPhone}
                      options={detailFieldMeta.options}
                    />
                    <Select
                      label="Outbound Skill"
                      placeholder="Select Outbound Skill"
                      value={detailSkill || undefined}
                      onValueChange={setDetailSkill}
                      options={outbound?.skillOptions ?? []}
                    />
                  </div>
                )}
              </div>
            ) : isDrillDown ? (
              /* key={} forces a remount on every screen change so the
                 animate-in transition replays each time content is swapped. */
              <div
                key={
                  screen.kind === "root"
                    ? "root"
                    : screen.kind === "category"
                    ? `category:${screen.categoryId}`
                    : screen.kind === "channels"
                    ? `channels:${screen.categoryId}:${screen.contactId}`
                    : "drilldown"
                }
                className="animate-in fade-in-0 slide-in-from-right-1 duration-150"
              >
                {screen.kind === "root" && (
                  <>
                    <div
                      className="border-b border-lyra-border-subtle px-4 py-3"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && phone.number.trim()) {
                          e.preventDefault();
                          const country = PHONE_COUNTRIES.find((c) => c.code === phone.countryCode) ?? PHONE_COUNTRIES[0];
                          onQuickDial?.(`${country.dial}${phone.number}`);
                          setOpen(false);
                        }
                      }}
                    >
                      {/* `phoneFieldPlaceholder` is undefined unless a
                          consumer explicitly opts in — leaving it unset
                          lets PhoneInput fall back to its own per-country
                          example instead of a fixed generic string. See
                          CONTRIBUTING.md §5 for why the dropdown needs
                          `dropdownClassName="z-[10003]"` here too (same
                          nested-popover case as the dialpad group's
                          PhoneInput above). */}
                      <PhoneInput value={phone} onChange={setPhone} placeholder={phoneFieldPlaceholder} dropdownClassName="z-[10003]" />
                    </div>
                    <Menu
                      items={(categories ?? []).map((category) => ({
                        id: category.id,
                        label: category.label,
                        icon: category.icon,
                        onClick: () => pushScreen({ kind: "category", categoryId: category.id }),
                      }))}
                      className="min-w-0 rounded-none border-0 bg-transparent p-2 shadow-none"
                    />
                  </>
                )}

                {/* Search field lives in `popoverHeader` now (pinned above
                    this scroll area), same pattern as the outbound flow's
                    group/contacts search — see the maxHeight note on the
                    Popover call below for why. */}
                {screen.kind === "category" && activeCategory && (
                  <div className="p-2">
                    {filteredContacts.length > 0 ? (
                      filteredContacts.map((contact) => (
                        <ContactRow
                          key={contact.id}
                          contact={contact}
                          onClick={() => pushScreen({ kind: "channels", categoryId: activeCategory.id, contactId: contact.id })}
                        />
                      ))
                    ) : (
                      <p className="px-3 py-6 text-center lyra-body-sm text-lyra-fg-secondary">
                        {activeCategory.contacts.length === 0
                          ? `No ${activeCategory.label.toLowerCase()} available`
                          : `No matching ${activeCategory.label.toLowerCase()}`}
                      </p>
                    )}
                  </div>
                )}

                {screen.kind === "channels" && activeCategory && activeContact && (
                  <Menu
                    items={(channels ?? []).map((channel) => ({
                      id: channel.id,
                      label: channel.label,
                      icon: channel.icon,
                      onClick: () => {
                        onOutbound?.({ category: activeCategory, contact: activeContact, channel });
                        setOpen(false);
                      },
                    }))}
                    className="min-w-0 rounded-none border-0 bg-transparent p-2 shadow-none"
                  />
                )}
              </div>
            ) : (
              /* Flat mode (default) — composes the real Menu component
                 rather than re-implementing its item markup, so any future
                 change to Menu's styling/behavior applies here automatically
                 instead of needing to be hand-copied. */
              <Menu
                aria-label={title}
                items={(items ?? []).map((item, i) => ({
                  id: String(i),
                  label: item.label,
                  icon: item.icon,
                  onClick: () => {
                    item.onClick?.();
                    setOpen(false);
                  },
                }))}
                className="min-w-0 rounded-none border-0 bg-transparent p-2 shadow-none"
              />
            )}
          </>
        }
      >
        {trigger}
      </Popover>
    );

    // Only the collapsed, icon-only trigger needs a tooltip — the expanded
    // button already has a visible "New Outbound" label, so a tooltip on
    // top of it would be redundant. Tooltip has to wrap Popover from the
    // outside, not the other way around: Popover's trigger clones its
    // click/ref/aria props onto its immediate child via Radix's
    // asChild/Slot mechanism, and Tooltip doesn't forward arbitrary props
    // through to a DOM node, so it can't sit as that immediate child. The
    // wrapping span is the same Tooltip+opaque-component wrapper pattern
    // used for AgentProfile's avatar trigger.
    //
    // This wrapper is now unconditional (previously `if (expanded) return
    // popover;` returned early, only wrapping in the collapsed case) —
    // `Tooltip`'s own `disabled` prop suppresses it while expanded instead.
    // Conditionally wrapping vs. not wrapping `popover` in a `<Tooltip>`
    // changes the JSX tree shape every time `expanded` toggles, which
    // forces React to unmount and remount the entire `Popover` (and its own
    // open/animation state) along with it — exactly the mechanism behind
    // the open/close animation asymmetry this was fixed alongside (see the
    // `trigger` button's own comment above). Keeping the wrapper constant
    // and toggling `disabled` preserves the `Popover` instance across
    // `expanded` changes so the trigger button's CSS transition can
    // actually play out instead of being interrupted by a remount.
    // `className="flex w-full justify-center"` (not `inline-flex`) so the
    // wrapper always stretches to the true outer layout (e.g. LeftNav's
    // footer slot) — needed for the expanded button's own `w-full` to
    // resolve against the right containing block. `justify-center` keeps
    // the collapsed (fixed `w-9`) button centered in that now-full-width
    // wrapper instead of left-aligning — previously LeftNav's own footer
    // div supplied that centering, which only worked because the wrapper
    // itself used to shrink-wrap (`inline-flex`) to the button's size.
    //
    // z-index needs no override here (unlike a tooltip nested *inside*
    // a popover's content, see CONTRIBUTING.md §5/§15) — this trigger
    // sits outside the popover panel entirely, so the Tooltip's default
    // z-[10000] already clears everything around it. placement="right",
    // not the default "top": this trigger lives in a collapsed left
    // rail (see left-nav.tsx's `footer` slot / CreateNew.stories), so
    // the tooltip needs to open into the page rather than toward the
    // rail's own edge — see CONTRIBUTING.md §16.
    return (
      <Tooltip content={title} placement="right" disabled={expanded}>
        <span className="flex w-full justify-center">{popover}</span>
      </Tooltip>
    );
  }
);
CreateNew.displayName = "CreateNew";

export { CreateNew, OutboundAddButton };
