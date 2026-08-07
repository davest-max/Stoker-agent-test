import * as React from "react";
import {
  Clock,
  MessageSquare,
  Mail,
  Phone,
  TriangleAlert,
  User,
  ArrowUpRight,
  CircleCheck,
  Send,
  FileDown,
  Languages,
  PlayCircle,
} from "lucide-react";
import { cn } from "../lib/utils";
import { tagVariants } from "./tag";
import { type MenuEntry } from "./menu";
import { KebabMenuButton } from "./kebab-menu-button";
import { Tab } from "./tabs";
import { Tooltip } from "./tooltip";

/* ── WhatsApp icon (not in Lucide) ──
 * Accepts `className` (default `h-3 w-3`, the chip-sized icon `ChannelRow`
 * itself uses) so a larger context — e.g. `ChannelTab`'s tab-sized icon slot
 * below — can size it up without a second hand-copied `<svg>`. */
const WhatsAppIcon = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/** Person + redirect-arrow composite — no single Lucide icon covers "transfer". */
const ConsultTransferIcon = () => (
  <span className="relative inline-flex h-4 w-4 items-center justify-center" aria-hidden="true">
    <User className="h-4 w-4" strokeWidth={1.5} />
    <ArrowUpRight className="absolute -right-1 -top-1 h-2.5 w-2.5" strokeWidth={2.5} />
  </span>
);

/* ── Channel types ── */

export type ChannelType = "chat" | "email" | "sms" | "whatsapp" | "voice";

/** Per-channel-type accent — the channel's identity color, used on its chip
 *  (`ChannelRow` below) and, via `InteractionNavItem`'s own use of this same
 *  map, on an active card's outer left border and (in compact icon-rail
 *  mode) its avatar tile. Matches the "New Outbound" Figma reference
 *  (voice=purple, sms=lime/yellow-green, email=pink, whatsapp=green — node
 *  4326:1117 in the Stoker Figma file) mapped to the nearest existing
 *  lyra-ui accent tokens rather than exact hex values, per this repo's
 *  "check for an established token first" rule. `chat` has no equivalent in
 *  that reference (only 4 channel buttons are shown, not 5) — kept on the
 *  one remaining unused accent hue (teal) so all 5 channel types still read
 *  as visually distinct.
 *
 *  This is channel *identity* color only — it doesn't carry any
 *  awaiting-response/urgency meaning. That signal lives elsewhere (the
 *  elapsed-time text below turning critical-red, and — on a compact
 *  icon-rail tile — the pulsing dot in `InteractionNavItem`), specifically
 *  so it isn't lost now that the chip, card border, and compact tile are
 *  always channel-colored instead of switching to red when awaiting.
 *
 *  `borderMuted` is a ~30%-opacity version of `border` (same color-mix()
 *  technique `tagVariants` uses, since these tokens are CSS custom
 *  properties holding full hex strings — a Tailwind slash-opacity modifier
 *  silently no-ops on those) — used for an *inactive* compact tile's border,
 *  so the active/inactive distinction that used to come from a
 *  strong-vs-faded color still reads, just recolored per channel instead of
 *  always blue/red. */
export const CHANNEL_ACCENT: Record<ChannelType, { bg: string; text: string; border: string; borderMuted: string }> = {
  voice: {
    bg: "bg-lyra-accent-purple-soft",
    text: "text-lyra-accent-purple-strong",
    border: "border-lyra-accent-purple-strong",
    borderMuted: "border-[color-mix(in_srgb,var(--lyra-color-accent-purple-strong)_30%,transparent)]",
  },
  sms: {
    bg: "bg-lyra-accent-lime-soft",
    text: "text-lyra-accent-lime-strong",
    border: "border-lyra-accent-lime-strong",
    borderMuted: "border-[color-mix(in_srgb,var(--lyra-color-accent-lime-strong)_30%,transparent)]",
  },
  email: {
    bg: "bg-lyra-accent-pink-soft",
    text: "text-lyra-accent-pink-strong",
    border: "border-lyra-accent-pink-strong",
    borderMuted: "border-[color-mix(in_srgb,var(--lyra-color-accent-pink-strong)_30%,transparent)]",
  },
  whatsapp: {
    bg: "bg-lyra-accent-green-soft",
    text: "text-lyra-accent-green-strong",
    border: "border-lyra-accent-green-strong",
    borderMuted: "border-[color-mix(in_srgb,var(--lyra-color-accent-green-strong)_30%,transparent)]",
  },
  chat: {
    bg: "bg-lyra-accent-teal-soft",
    text: "text-lyra-accent-teal-strong",
    border: "border-lyra-accent-teal-strong",
    borderMuted: "border-[color-mix(in_srgb,var(--lyra-color-accent-teal-strong)_30%,transparent)]",
  },
};

export interface InteractionChannel {
  /** Unique identifier for this specific channel instance. Required to
   *  distinguish between two simultaneously open channels of the same
   *  `type` on one interaction — e.g. two SMS threads with the same
   *  customer on different phone numbers — since `InteractionNavItem` uses
   *  this (falling back to `type` when omitted) to decide which row is
   *  "current", which row a click/kebab-dismiss actually targets, and what
   *  React key each row renders with. Safe to omit when an interaction
   *  never opens more than one channel of the same `type` at once — `type`
   *  alone is a fine identifier in that case. */
  id?: string;
  /** Which channel this row represents — determines its icon, label, and
   *  default kebab menu items (see `ChatChannelRow` / `EmailChannelRow` /
   *  `SmsChannelRow` / `WhatsAppChannelRow` / `VoiceChannelRow` below).
   *  Override the menu for one specific row via `menuItems`. */
  type: ChannelType;
  /** Elapsed time for this channel's last message, as 4-digit MM:SS, or "Now". */
  elapsed: string;
  /** Message preview for this channel. */
  preview?: string;
  /**
   * Whether this is the channel currently open/being viewed for this
   * interaction. Only highlighted (blue background) when the parent
   * `InteractionNavItem` itself is `active` — on an inactive card, no
   * channel row is highlighted even if one is marked `current`.
   */
  current?: boolean;
  /** Whether this specific channel is the one awaiting a response —
   *  renders its chip and elapsed-time in critical (red) instead of
   *  success (green) / secondary gray. */
  awaitingResponse?: boolean;
  /** Show the trailing kebab (⋮) menu for this channel row. Default: true. */
  removable?: boolean;
  /** Override this row's default (per-`type`) kebab menu items. */
  menuItems?: MenuEntry[];
}

/* ── Default menu items, per channel type ──
 * Kept here (not on InteractionNavItem) so each channel type owns its own
 * kebab behavior at the component level — e.g. Voice gets recording actions
 * instead of transcript/translate actions. Override per-row via
 * `InteractionChannel.menuItems`.
 *
 * Built as functions (not flat consts) so "Unassign & Dismiss" — the one
 * action every channel type shares — can carry a real `onClick` wired to
 * `InteractionNavItem`'s own `onDismiss` prop. That action ends the whole
 * interaction, not just this one channel, so it's threaded down from the
 * card level rather than something a channel row decides on its own. A
 * `menuItems` override on `InteractionChannel` still replaces this whole
 * list, same as before — the override is the consumer's responsibility to
 * wire up, `onDismiss` only ever applies to the *default* menu. */

export function buildDigitalMenuItems(onDismiss?: () => void): MenuEntry[] {
  return [
    { id: "unassign-dismiss", label: "Unassign & Dismiss", icon: <TriangleAlert className="h-4 w-4" strokeWidth={1.5} />, onClick: onDismiss },
    { id: "consult-transfer", label: "Consult / Transfer", icon: <ConsultTransferIcon /> },
    { id: "outcome", label: "Outcome", icon: <CircleCheck className="h-4 w-4 text-lyra-status-info-strong" strokeWidth={1.5} /> },
    { id: "send-transcript", label: "Send Transcript", icon: <Send className="h-4 w-4" strokeWidth={1.5} /> },
    { id: "download-transcript", label: "Download Transcript", icon: <FileDown className="h-4 w-4" strokeWidth={1.5} /> },
    { id: "translate-messages", label: "Translate Messages", icon: <Languages className="h-4 w-4" strokeWidth={1.5} /> },
  ];
}

export function buildVoiceMenuItems(onDismiss?: () => void): MenuEntry[] {
  return [
    { id: "unassign-dismiss", label: "Unassign & Dismiss", icon: <TriangleAlert className="h-4 w-4" strokeWidth={1.5} />, onClick: onDismiss },
    { id: "consult-transfer", label: "Consult / Transfer", icon: <ConsultTransferIcon /> },
    { id: "outcome", label: "Outcome", icon: <CircleCheck className="h-4 w-4 text-lyra-status-info-strong" strokeWidth={1.5} /> },
    { id: "listen-recording", label: "Listen to Recording", icon: <PlayCircle className="h-4 w-4" strokeWidth={1.5} /> },
    { id: "download-recording", label: "Download Recording", icon: <FileDown className="h-4 w-4" strokeWidth={1.5} /> },
  ];
}

/* ── Base row (shared rendering) ── */

interface ChannelRowProps {
  /** Which channel this row is — drives the chip's color via `CHANNEL_ACCENT`
   *  (identity color, not urgency; see that map's own doc comment). */
  channel: ChannelType;
  icon: React.ReactNode;
  label: string;
  elapsed: string;
  preview?: string;
  /** Blue-highlighted row background — set by the parent when this row is
   *  both `current` and the card is `active`. */
  highlighted?: boolean;
  /** Skip the top divider — set by the parent for the first row in the list. */
  isFirst?: boolean;
  awaitingResponse?: boolean;
  menuItems: MenuEntry[];
  showMenu?: boolean;
  /** Marks this channel "current" (see `InteractionNavItem`'s own doc
   *  comment on its internal current-channel state) — lets an agent toggle
   *  which open channel is highlighted within a multi-channel card. Doesn't
   *  stop the click from also bubbling up to the card's own `onClick`
   *  (selecting the whole card), only the kebab button does that. */
  onSelect?: () => void;
}

const ChannelRow: React.FC<ChannelRowProps> = ({
  channel,
  icon,
  label,
  elapsed,
  preview,
  highlighted,
  isFirst,
  awaitingResponse,
  menuItems,
  showMenu = true,
  onSelect,
}) => {
  const accent = CHANNEL_ACCENT[channel];
  return (
  <div
    onClick={onSelect}
    className={cn(
      "flex flex-col gap-1 px-4 py-2.5 transition-colors",
      onSelect && "cursor-pointer",
      !isFirst && "border-t border-lyra-border-subtle",
      highlighted ? "bg-lyra-status-info-subtle" : "hover:bg-lyra-state-hover"
    )}
  >
    <div className="flex items-center gap-2">
      <span className={cn(tagVariants({ shape: "pill" }), accent.bg, accent.text, accent.border)}>
        <span aria-hidden="true">{icon}</span>
        {label}
      </span>
      <span
        className={cn(
          "flex items-center gap-1 lyra-body-xs",
          awaitingResponse ? "text-lyra-status-critical-strong" : "text-lyra-fg-secondary"
        )}
      >
        <Clock className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
        {elapsed}
      </span>
      <span className="flex-1" />
      {showMenu && <KebabMenuButton items={menuItems} ariaLabel={`More options for ${label}`} />}
    </div>
    {preview && <p className="lyra-body-sm text-lyra-fg-secondary truncate">{preview}</p>}
  </div>
  );
};

/* ── Per-type channel rows ──
 * Thin wrappers around `ChannelRow` — each owns its own icon, label, and
 * default kebab menu, so channel-specific behavior lives here instead of
 * being passed down generically from `InteractionNavItem` or a story. */

export interface ChannelRowInstanceProps {
  elapsed: string;
  preview?: string;
  highlighted?: boolean;
  isFirst?: boolean;
  awaitingResponse?: boolean;
  removable?: boolean;
  menuItems?: MenuEntry[];
  /** Wired onto the default menu's "Unassign & Dismiss" item — see the
   *  `buildDigitalMenuItems`/`buildVoiceMenuItems` doc comment above.
   *  Ignored when `menuItems` overrides the default list. */
  onDismiss?: () => void;
  /** Passed straight through to `ChannelRow` — see its own doc comment. */
  onSelect?: () => void;
}

const ChatChannelRow: React.FC<ChannelRowInstanceProps> = ({ menuItems, removable, onDismiss, ...rest }) => (
  <ChannelRow
    {...rest}
    channel="chat"
    icon={<MessageSquare className="h-3 w-3" strokeWidth={1.5} />}
    label="Chat"
    menuItems={menuItems ?? buildDigitalMenuItems(onDismiss)}
    showMenu={removable !== false}
  />
);

const EmailChannelRow: React.FC<ChannelRowInstanceProps> = ({ menuItems, removable, onDismiss, ...rest }) => (
  <ChannelRow
    {...rest}
    channel="email"
    icon={<Mail className="h-3 w-3" strokeWidth={1.5} />}
    label="Email"
    menuItems={menuItems ?? buildDigitalMenuItems(onDismiss)}
    showMenu={removable !== false}
  />
);

const SmsChannelRow: React.FC<ChannelRowInstanceProps> = ({ menuItems, removable, onDismiss, ...rest }) => (
  <ChannelRow
    {...rest}
    channel="sms"
    icon={<MessageSquare className="h-3 w-3" strokeWidth={1.5} />}
    label="SMS"
    menuItems={menuItems ?? buildDigitalMenuItems(onDismiss)}
    showMenu={removable !== false}
  />
);

const WhatsAppChannelRow: React.FC<ChannelRowInstanceProps> = ({ menuItems, removable, onDismiss, ...rest }) => (
  <ChannelRow
    {...rest}
    channel="whatsapp"
    icon={<WhatsAppIcon />}
    label="WhatsApp"
    menuItems={menuItems ?? buildDigitalMenuItems(onDismiss)}
    showMenu={removable !== false}
  />
);

const VoiceChannelRow: React.FC<ChannelRowInstanceProps> = ({ menuItems, removable, onDismiss, ...rest }) => (
  <ChannelRow
    {...rest}
    channel="voice"
    icon={<Phone className="h-3 w-3" strokeWidth={1.5} />}
    label="Voice"
    menuItems={menuItems ?? buildVoiceMenuItems(onDismiss)}
    showMenu={removable !== false}
  />
);

/** Maps `InteractionChannel.type` to its row component — used by
 *  `InteractionNavItem` to dispatch each channel to the right one. */
const CHANNEL_ROW_COMPONENTS: Record<ChannelType, React.FC<ChannelRowInstanceProps>> = {
  chat: ChatChannelRow,
  email: EmailChannelRow,
  sms: SmsChannelRow,
  whatsapp: WhatsAppChannelRow,
  voice: VoiceChannelRow,
};

/** Per-type icon + label — the same choices each `*ChannelRow` wrapper above
 *  already bakes in, exposed here so `ChannelTab` (and any other component
 *  that needs to represent a channel by its type) doesn't have to re-decide
 *  them. Sized `h-4 w-4` (a `Tab`'s icon slot) rather than the `h-3 w-3` chip
 *  size the rows above use. */
const CHANNEL_TYPE_META: Record<ChannelType, { icon: React.ReactNode; label: string }> = {
  chat:     { icon: <MessageSquare className="h-4 w-4" strokeWidth={1.5} />, label: "Chat" },
  email:    { icon: <Mail className="h-4 w-4" strokeWidth={1.5} />, label: "Email" },
  sms:      { icon: <MessageSquare className="h-4 w-4" strokeWidth={1.5} />, label: "SMS" },
  whatsapp: { icon: <WhatsAppIcon className="h-4 w-4" />, label: "WhatsApp" },
  voice:    { icon: <Phone className="h-4 w-4" strokeWidth={1.5} />, label: "Voice" },
};

/* ── ChannelTab ──
 * One open channel rendered as a `Tab` — e.g. the "active conversation area"
 * tab bar under a record-header `PageHeader` (see `AgentNextGenTemplate
 * .stories.tsx`'s `activeInteraction` block), one tab per
 * `TrackedChannel`/`InteractionChannel`, kept in sync with which row is
 * "current" on the matching `InteractionNavItem` card via that component's
 * `currentChannelKey`/`onCurrentChannelChange` props — both should be driven
 * by the same piece of parent state (e.g. `ActiveInteraction.currentChannelId`)
 * so clicking a tab here and clicking a row on the card either update the
 * same thing. Not a full "tab list" wrapper — the consumer still renders its
 * own `<TabList>` around one `ChannelTab` per channel, same as it would for
 * any other set of `Tab`s — but that `<TabList>` should carry the
 * `lyra-channel-tab-list-wrap` class (see `lyra-tokens.css`'s "Channel tab
 * bar" section) so each tab can shed its own address/label text once the
 * bar's own available width gets tight, rather than wrapping/scrolling. A
 * `Tooltip` on every tab (icon-only or not) surfaces the full "Label
 * address" text (no divider between the two — see `address`'s own doc
 * comment) regardless of which stage the bar has collapsed to, plus a
 * second, smaller line with this channel's message count and conversation
 * id (`messageCount`/`interactionId`) when either is on hand — info that
 * never appears on the tab face itself, only in the tooltip. */
export interface ChannelTabProps {
  /** Determines this tab's icon, label, and default kebab menu items — same
   *  per-type choices as the matching `*ChannelRow`. */
  type: ChannelType;
  /** The phone number/email address/WhatsApp handle this channel is on, if
   *  any (e.g. `TrackedChannel.addressLabel`) — rendered directly after the
   *  type label with no divider between them (e.g. "WhatsApp
   *  @Jamie Torres") so two tabs of the same `type` stay distinguishable,
   *  and repeated the same way in this tab's `Tooltip` so that stays true
   *  even once the bar has collapsed down to hiding it (see the
   *  container-query note above). Omit when this channel has no address on
   *  hand (e.g. a redialed voice call with no stored number) — the tab just
   *  shows icon + type label, and its tooltip just the type label. */
  address?: string;
  /** Total message count for this channel's conversation, if on hand — shown
   *  on a second, smaller (`lyra-body-sm`) `Tooltip` line below the label
   *  (+ address) line (e.g. "16 Messages | #707535188548"), never on the
   *  tab face itself (there's no room once the bar starts collapsing, see
   *  the container-query note above — the tooltip is the one place this is
   *  always reachable regardless of stage). Omit for channel types with no
   *  real message concept (voice) and for a channel that hasn't exchanged
   *  any messages yet — `0` renders "0 Messages", which is exactly right
   *  for a just-started outbound conversation; `undefined` renders no
   *  message segment on this line at all. */
  messageCount?: number;
  /** This channel's own conversation/session id, if on hand — distinct from
   *  the customer-record id (`ActiveInteraction.recordId`, e.g. "AGT-2000")
   *  shown in the page header above: one customer record can have several
   *  channels open, each its own conversation with its own id. Rendered as
   *  "#{interactionId}" on the same second `Tooltip` line as `messageCount`.
   *  Omit when unknown. */
  interactionId?: string;
  active?: boolean;
  onClick?: () => void;
  /** Wired to the default kebab menu's "Unassign & Dismiss" entry — the
   *  consumer decides (same as `InteractionNavItem`'s own `onDismiss` vs.
   *  `onDismissChannel` split) whether that should end just this channel or
   *  the whole interaction, based on how many channels are open. */
  onDismiss?: () => void;
  /** Override this tab's default (per-`type`) kebab menu items. */
  menuItems?: MenuEntry[];
  /** Hide the trailing kebab entirely. Default: true (kebab shown). */
  showMenu?: boolean;
  className?: string;
}

const ChannelTab: React.FC<ChannelTabProps> = ({
  type,
  address,
  messageCount,
  interactionId,
  active,
  onClick,
  onDismiss,
  menuItems,
  showMenu = true,
  className,
}) => {
  const meta = CHANNEL_TYPE_META[type];
  const defaultMenuItems = type === "voice" ? buildVoiceMenuItems(onDismiss) : buildDigitalMenuItems(onDismiss);
  // Second tooltip line — "16 Messages | #707535188548" — omitted entirely
  // when neither value is on hand rather than rendering an empty/half-blank
  // line under the "Label | address" one.
  // Second tooltip line, e.g. "16 Messages | #707535188548" — the "|"
  // between these two is kept (they're two distinct facts, not a label and
  // its own value like the line above), just rendered smaller
  // (`lyra-body-sm`, one step below the tooltip's own default `lyra-body-md`)
  // since it's secondary/reference info, not the tab's primary identity.
  const metaLine = [
    messageCount !== undefined ? `${messageCount} Message${messageCount === 1 ? "" : "s"}` : undefined,
    interactionId ? `#${interactionId}` : undefined,
  ]
    .filter(Boolean)
    .join(" | ");
  const tooltipContent = (
    <div className="flex flex-col gap-0.5">
      <span>{address ? `${meta.label} ${address}` : meta.label}</span>
      {metaLine && <span className="lyra-body-sm text-lyra-fg-secondary">{metaLine}</span>}
    </div>
  );
  return (
    <Tooltip content={tooltipContent} placement="bottom">
      <Tab
        active={active}
        onClick={onClick}
        icon={meta.icon}
        menuItems={showMenu ? (menuItems ?? defaultMenuItems) : undefined}
        menuAriaLabel={`More options for ${meta.label}`}
        className={className}
      >
        {/* Hidden first (icon-only) at the bar's narrowest container-query
            stage — see the "Channel tab bar" section in `lyra-tokens.css`.
            The `Tooltip` above still surfaces this text regardless. */}
        <span className="lyra-channel-tab-label">{meta.label}</span>
        {address && (
          <span className="ml-1 font-normal text-lyra-fg-disabled lyra-channel-tab-address">{address}</span>
        )}
      </Tab>
    </Tooltip>
  );
};

export {
  ChannelRow,
  ChatChannelRow,
  EmailChannelRow,
  SmsChannelRow,
  WhatsAppChannelRow,
  VoiceChannelRow,
  CHANNEL_ROW_COMPONENTS,
  CHANNEL_TYPE_META,
  ChannelTab,
};
