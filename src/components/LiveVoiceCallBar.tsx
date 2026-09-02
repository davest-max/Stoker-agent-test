import { useEffect, useRef, useState } from "react";
import { ActionIconButton, Button, CHANNEL_ACCENT, Popover, Menu, type MenuEntry } from "@nicecxone/lyra-ui";
import { Headset, Mic, MicOff, Pause, Play, AudioLines, Circle, CircleDot, Grip, PhoneOff, ChevronDown, Video, VideoOff, Move, PanelRight, Users, ArrowRightLeft, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** AudioLines with a diagonal slash — Lucide has no ready icon for "mask
 *  sensitive audio", so composite one: the base icon plus an overlaid line,
 *  drawn corner-to-corner the same way Lucide's own `-Off` icons (e.g.
 *  MicOff) draw their slash. Used by the "Mask" control below — unlike
 *  Mute's `Mic`/`MicOff` pair, this renders with the slash in BOTH states
 *  (see that button's own comment for why), so it's really just a fixed
 *  glyph rather than an on/off icon pair; kept as its own small component
 *  anyway since compositing the slash-overlay SVG inline at both call sites
 *  would duplicate it. Recreated locally rather than exported/imported
 *  since it's a small, self-contained composite (same reasoning as
 *  `getInitials`'s own doc comment below). */
function MutedAudioLinesIcon({ strokeWidth = 2, className }: { strokeWidth?: number; className?: string }) {
  return (
    <span className={cn("relative inline-flex h-6 w-6 items-center justify-center", className)} aria-hidden="true">
      <AudioLines className="h-6 w-6" strokeWidth={strokeWidth} />
      <svg className="absolute inset-0 h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
        <line x1="2" x2="22" y1="2" y2="22" />
      </svg>
    </span>
  );
}

/** Selected/engaged fill treatment for the toggle buttons below — a solid
 *  colored background with a white icon, per the reference screenshot,
 *  rather than the subtle default hover-only look `ActionIconButton` uses at
 *  rest. Hold/Record share the same red (they're both "something is actively
 *  happening" states); Mute/Mask share a separate dark slate (a quieter,
 *  non-alarming color — muting audio or masking sensitive info isn't a
 *  critical state the way holding or recording a call is). `hover:`/
 *  `active:` are repeated at the same color so the fill doesn't wash out
 *  lighter on hover — this class
 *  wins over `ActionIconButton`'s own `hover:bg-lyra-state-hover` via
 *  `cn`'s tailwind-merge. */
// `bg-destructive` (not `bg-status-critical-strong`) — per the accessibility
// follow-up flagged in this file's own audit: `status-critical-strong` is a
// STATUS-indicator token, deliberately inverted per theme for legibility as
// small text/badges (dark red on light chrome, a light pastel red on dark
// chrome) — exactly wrong for a large button fill meant to hold a permanent
// white icon, since that pastel-on-dark-chrome case drops to ~2.5:1 contrast.
// `bg-destructive` is the stable, theme-independent dark red actually meant
// to pair with a white icon (see `fg-on-destructive`, used below) — same
// color as `status-critical-strong` in light theme (so no visible change
// there), just no longer collapsing in dark theme.
const SELECTED_RED = "bg-lyra-bg-destructive hover:bg-lyra-bg-destructive active:bg-lyra-bg-destructive";
const SELECTED_SLATE = "bg-lyra-accent-slate-strong hover:bg-lyra-accent-slate-strong active:bg-lyra-accent-slate-strong";
// Reverted per an explicit follow-up: no per-button shape override
// (`ActionIconButton`'s own default rounded-square/no-border look is used
// as-is for Hold/Mute/Mask/Record/Keypad/Hang Up, in both the floating bar
// and the docked `DockedControlButton`) and no per-button border — a
// circular-with-border treatment was tried and then explicitly rolled back.
// The bar's own containing border comes from its outer wrapper instead (see
// that div's className in each presentation below), not from the buttons.

/** Same first+last-initial derivation CustomerInteractionPanel's own
 *  `getInitials` and lyra-ui's `InteractionNavItem` already use — small
 *  enough that duplicating it here (rather than exporting/importing across
 *  files) matches how this exact logic is already copied in a couple of
 *  other places in this codebase. */
function getInitials(name?: string): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function formatElapsed(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** A colleague added to this call via consult-then-merge (see
 *  `VoiceCallConsult` below) — always an agent, never the customer, hence no
 *  `isInternalAgentCall`-style flag: every colleague renders with the same
 *  headset glyph the primary party already uses for that case. Lifted to
 *  `AgentNextGenPage`'s own `voiceCallColleagues` (keyed by assignment id)
 *  for the same "survive moving between the floating and docked
 *  presentations" reason every other per-call control here is. `isOnHold`/
 *  `heldSince` are this colleague's OWN hold state — independent of the
 *  primary party's `isOnHold` above, per an explicit follow-up ("each
 *  participant gets row-level hold") — see `onToggleColleagueHold`. */
export interface CallColleague {
  id: string;
  name: string;
  isOnHold: boolean;
  heldSince?: number;
  /** Set only when this colleague came from a skill consult rather than a
   *  directly-picked agent (see `ConsultTransferPopover`'s own skill-call
   *  flow) — nobody explicitly chose this person, a skill routed the call
   *  to whoever was available, so it's worth keeping visible context on
   *  where they came from. Purely cosmetic (see `formatParticipantLabel`
   *  below); absent for a normal direct-agent consult. */
  sourceSkillName?: string;
}

/** A private, pre-merge consult in progress — the primary party is
 *  automatically held the moment this starts (same as picking up a
 *  different line) until the agent either cancels (primary resumes, back to
 *  a plain call) or merges (this colleague joins as a full `CallColleague`
 *  and the primary resumes into a three-way conference). `undefined`/absent
 *  on both bar components below means "not consulting right now." */
export interface VoiceCallConsult {
  id: string;
  name: string;
  /** See `CallColleague.sourceSkillName`'s own doc comment — carried over
   *  onto the `CallColleague` this consult becomes on merge, so the
   *  attribution survives past the consult banner into the Participants
   *  menu/strip. */
  sourceSkillName?: string;
}

/** Shared by `ConsultBanner`, `ParticipantChip`, and the Participants menu
 *  below — appends "(Skill Name)" only when `sourceSkillName` is actually
 *  set, so a directly-picked colleague's label is untouched. Kept separate
 *  from the plain `name` field itself (rather than baking the skill name
 *  into `name` at the source) so anything that still needs the bare name —
 *  `getInitials`, tooltips elsewhere — doesn't have to parse it back out. */
function formatParticipantLabel(name: string, sourceSkillName?: string): string {
  return sourceSkillName ? `${name} (${sourceSkillName})` : name;
}

/** Small avatar+name pill used by the participant strip shown under the
 *  name/timer once `colleagues.length > 0` — one per person on the call
 *  (self, the primary party, and every added colleague), so the agent can
 *  see who's actually here at a glance without opening the Participants
 *  menu. Per an explicit follow-up, the label runs a size bigger than it
 *  used to (`lyra-body-sm`, not `lyra-body-xs`) — permanently, not just
 *  while expanded below — since a 10px name is hard to read once there are
 *  3+ people in the strip. Per a second follow-up (name + icons still hard
 *  to read/hit), the label stepped up again to `lyra-body-md` (14px), the
 *  avatar bubble grew to match, and every icon button in this pill's
 *  expanded state — Hold, Transfer, Hang Up, and the Check/X confirm step —
 *  now uses `h-8 w-8`, matching `ActionIconButton`'s own smallest real
 *  touch-target step (`size="sm"`, 32px) rather than an arbitrary value.
 *  `onToggleHold`/`onTransfer`/`onHangUp` are each optional and
 *  independently gate whether this pill can expand at all: "You" gets none
 *  (an agent can't hold, transfer, or hang up on themselves), the primary
 *  party gets hold only (ending their leg is the bar's own main Hang Up
 *  button's job, transferring it is the switcher's, not a per-pill action),
 *  and a colleague gets all three. Kept as a second affordance alongside
 *  the Participants menu (which already has the same Hold/Transfer pair)
 *  rather than replacing it — quicker access is worth the duplication; the
 *  two now stay in sync since both call the same `onTransferToColleague`.
 *  Per an accessibility follow-up: the Hold icon swaps `Pause`↔`Play`
 *  (rather than only recoloring the same glyph) so the on/off state doesn't
 *  rely on color alone — see `WCAG 1.4.1`; every interactive element here
 *  also carries this app's standard focus ring (`focus-visible:ring-2
 *  ring-inset ring-lyra-border-focus`), which this pill was missing
 *  entirely before. */
function ParticipantChip({
  label,
  isSelf,
  isInternalAgent,
  isOnHold,
  onToggleHold,
  onTransfer,
  onHangUp,
}: {
  label: string;
  isSelf?: boolean;
  isInternalAgent?: boolean;
  isOnHold?: boolean;
  /** Presence alone gates the Hold/Resume icon in this pill's expanded
   *  state — omitted for "You". */
  onToggleHold?: () => void;
  /** Presence alone gates the Transfer icon in this pill's expanded state —
   *  only ever passed for a colleague (same restriction as `onHangUp`
   *  below), and routed straight to the same `onTransferToColleague` the
   *  Participants menu already calls — no separate confirm step, matching
   *  that menu's own existing (unconfirmed) transfer action. */
  onTransfer?: () => void;
  /** Presence alone gates the Hang Up icon in this pill's expanded state —
   *  per an explicit follow-up, only ever passed for a colleague. Routed
   *  through an inline "Drop {name}?" confirm (see `confirming` below)
   *  before it actually fires, since — unlike hold or transfer — this isn't
   *  reversible. */
  onHangUp?: () => void;
}) {
  const accent = CHANNEL_ACCENT.voice;
  const canExpand = !!onToggleHold || !!onTransfer || !!onHangUp;
  // Shared focus-ring treatment for every interactive element in this pill
  // — `ring-inset` (rather than this app's usual offset ring) so it never
  // gets clipped by the participant strip's own `overflow-x-auto`.
  const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lyra-border-focus";
  // Hover shows it transiently; a click "pins" it open so Hold/Hang Up can
  // actually be reached without the pointer having to stay put over a
  // pill this small. Pinning is cleared the moment an action completes (or
  // is cancelled) rather than needing a separate click-outside listener —
  // see `closeAndReset` below.
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const expanded = canExpand && (hovering || pinned);

  const closeAndReset = () => {
    setPinned(false);
    setHovering(false);
    setConfirming(false);
  };

  return (
    <span
      // Fixed `h-8` (not padding-driven) so this pill is exactly as tall
      // collapsed as it is expanded — per an explicit follow-up, the
      // expanded state's `h-8` Hold/Hang Up buttons used to be taller than
      // the collapsed content (avatar + label), so the pill's own
      // content-driven height grew a few px on hover, shifting the whole
      // participant strip (and everything below it in the bar) with it.
      // A fixed height means hover only ever changes this pill's *width*
      // (the icons sliding in), never the row's height.
      className={cn("flex h-8 shrink-0 items-center gap-2 rounded-full bg-lyra-bg-surface-container-subtle pl-1 pr-2.5", focusRing)}
      onMouseEnter={() => canExpand && setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        setConfirming(false);
      }}
      onClick={() => {
        if (!canExpand) return;
        setPinned((prev) => !prev);
        setConfirming(false);
      }}
      onKeyDown={(e) => {
        if (!canExpand) return;
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        setPinned((prev) => !prev);
        setConfirming(false);
      }}
      role={canExpand ? "button" : undefined}
      aria-expanded={canExpand ? expanded : undefined}
      // Only set here for "You" — see the note on the label span below for
      // why: with that label removed for this one case, the avatar bubble's
      // own "You" (otherwise `aria-hidden`, same as every other pill's
      // decorative initials) becomes this pill's only accessible name.
      aria-label={isSelf ? "You" : undefined}
      tabIndex={canExpand ? 0 : undefined}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full lyra-body-xs-emphasis",
          isSelf ? cn(accent.bg, accent.text) : "bg-lyra-bg-surface-base text-lyra-fg-secondary"
        )}
        aria-hidden="true"
      >
        {isSelf ? "You" : isInternalAgent ? <Headset className="h-3 w-3" strokeWidth={1.5} /> : getInitials(label)}
      </span>
      {/* Every other pill's avatar is a genuine abbreviation (initials) of
       *  a longer label, so showing both isn't redundant — the self pill's
       *  avatar already spells out the whole word "You", so a second "You"
       *  right next to it was pure duplication (flagged directly). Skipped
       *  only for `isSelf`; every other pill keeps its label as before. */}
      {!isSelf && <span className="lyra-body-md text-lyra-fg-secondary max-w-[130px] truncate">{label}</span>}
      {isOnHold && !expanded && <span className="lyra-body-sm-emphasis text-lyra-status-critical-strong">Hold</span>}
      {expanded &&
        (confirming ? (
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="lyra-body-sm text-lyra-fg-secondary whitespace-nowrap">Drop {label}?</span>
            <button
              type="button"
              aria-label={`Confirm drop ${label}`}
              onClick={(e) => {
                e.stopPropagation();
                onHangUp?.();
                closeAndReset();
              }}
              className={cn("flex h-8 w-8 items-center justify-center rounded-full text-lyra-status-critical-strong hover:bg-lyra-bg-surface-base", focusRing)}
            >
              <Check className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Cancel"
              onClick={(e) => {
                e.stopPropagation();
                setConfirming(false);
              }}
              className={cn("flex h-8 w-8 items-center justify-center rounded-full text-lyra-fg-secondary hover:bg-lyra-bg-surface-base", focusRing)}
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-1.5">
            {onToggleHold && (
              <button
                type="button"
                title={isOnHold ? `Resume ${label}` : `Hold ${label}`}
                aria-label={isOnHold ? `Resume ${label}` : `Hold ${label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHold();
                  closeAndReset();
                }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full hover:bg-lyra-bg-surface-base",
                  isOnHold ? "text-lyra-status-critical-strong" : "text-lyra-fg-secondary",
                  focusRing
                )}
              >
                {/* Swaps shape (not just color) when on hold — Play reads as
                 *  "tap to resume", matching this button's own `aria-label`/
                 *  `title` in that state — see this component's own doc
                 *  comment on why color alone isn't used here. */}
                {isOnHold ? <Play className="h-4 w-4" strokeWidth={2} /> : <Pause className="h-4 w-4" strokeWidth={2} />}
              </button>
            )}
            {onTransfer && (
              <button
                type="button"
                title={`Transfer call to ${label}`}
                aria-label={`Transfer call to ${label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTransfer();
                  closeAndReset();
                }}
                className={cn("flex h-8 w-8 items-center justify-center rounded-full text-lyra-fg-secondary hover:bg-lyra-bg-surface-base", focusRing)}
              >
                <ArrowRightLeft className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
            {onHangUp && (
              <button
                type="button"
                title={`Hang up on ${label}`}
                aria-label={`Hang up on ${label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirming(true);
                }}
                className={cn("flex h-8 w-8 items-center justify-center rounded-full text-lyra-status-critical-strong hover:bg-lyra-bg-surface-base", focusRing)}
              >
                <PhoneOff className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
          </span>
        ))}
    </span>
  );
}

/** Shown in place of the normal name/timer content while a consult is in
 *  progress (see `VoiceCallConsult`) — the primary party's own "On hold"
 *  line already communicates their side of it (see `nameAndTimer`), so this
 *  banner is purely about the private side-conversation and its two
 *  resolutions. Identical in both presentations, same as everything else in
 *  this file. */
function ConsultBanner({
  consultName,
  onCancel,
  onMerge,
}: {
  consultName: string;
  onCancel?: () => void;
  onMerge?: () => void;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2 rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-3 py-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lyra-bg-surface-base lyra-body-xs-emphasis text-lyra-fg-secondary" aria-hidden="true">
        {getInitials(consultName)}
      </span>
      <span className="lyra-body-sm text-lyra-fg-secondary truncate">Consulting with {consultName}…</span>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel consult</Button>
        <Button variant="default" size="sm" onClick={onMerge}>Merge call</Button>
      </div>
    </div>
  );
}

/** Shared by both presentations' Participants menu (see each component's own
 *  Popover+Menu) — the primary party's row reuses the exact same
 *  `isOnHold`/`onToggleHold` this bar already threads everywhere else (its
 *  hold state is one and the same fact whether toggled from the main Hold
 *  button, this menu, or the bulk "hold all" it doubles as once colleagues
 *  exist — see `AgentNextGenPage`'s own `toggleVoiceCallHold`). No entry for
 *  "self" — an agent can't hold or transfer to themselves. Each colleague
 *  gets two rows (hold/resume, then transfer) rather than one row with two
 *  actions, since `Menu`'s own `MenuEntry` shape is a single icon+label+
 *  description+onClick per row — matches this file's existing menu (the
 *  call switcher) rather than reaching for a custom row layout. */
function buildParticipantMenuItems({
  primaryName,
  primaryIsInternalAgent,
  primaryIsOnHold,
  primaryHeldSeconds,
  onTogglePrimaryHold,
  colleagues,
  onToggleColleagueHold,
  onTransferToColleague,
}: {
  primaryName: string;
  primaryIsInternalAgent?: boolean;
  primaryIsOnHold: boolean;
  primaryHeldSeconds?: number;
  onTogglePrimaryHold: () => void;
  colleagues: CallColleague[];
  onToggleColleagueHold: (id: string) => void;
  onTransferToColleague: (id: string) => void;
}): MenuEntry[] {
  const rowIcon = (isInternalAgent?: boolean, name?: string) => (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lyra-bg-surface-container-subtle lyra-body-xs-emphasis text-lyra-fg-secondary" aria-hidden="true">
      {isInternalAgent ? <Headset className="h-3 w-3" strokeWidth={1.5} /> : getInitials(name)}
    </span>
  );
  const items: MenuEntry[] = [
    {
      id: "primary-hold",
      icon: rowIcon(primaryIsInternalAgent, primaryName),
      label: `${primaryIsOnHold ? "Resume" : "Hold"} ${primaryName}`,
      description: primaryIsOnHold ? `On hold ${formatElapsed(primaryHeldSeconds ?? 0)}` : "Connected",
      descriptionCritical: primaryIsOnHold,
      onClick: onTogglePrimaryHold,
    },
  ];
  for (const colleague of colleagues) {
    const colleagueLabel = formatParticipantLabel(colleague.name, colleague.sourceSkillName);
    items.push({
      id: `${colleague.id}-hold`,
      icon: rowIcon(true, colleague.name),
      label: `${colleague.isOnHold ? "Resume" : "Hold"} ${colleagueLabel}`,
      description: colleague.isOnHold
        ? `On hold ${formatElapsed(Math.floor((Date.now() - (colleague.heldSince ?? Date.now())) / 1000))}`
        : "Connected",
      descriptionCritical: colleague.isOnHold,
      onClick: () => onToggleColleagueHold(colleague.id),
    });
    items.push({
      id: `${colleague.id}-transfer`,
      icon: <ArrowRightLeft className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />,
      label: `Transfer call to ${colleagueLabel}`,
      onClick: () => onTransferToColleague(colleague.id),
    });
  }
  return items;
}

/** Shown above the control row in both presentations once video is on (see
 *  `isVideoOn` on both prop interfaces below): the equal-weight agent/
 *  customer video tiles, extended to one additional tile per merged
 *  colleague. This app has no real camera feed to render, so tiles are
 *  placeholders using the same accent-tinted circle treatment the bar's own
 *  leading avatar already uses. Identical in both the floating bar and the
 *  docked bar — per the same "read as the same bar" convention already
 *  governing the rest of this file's controls — except the resize handle,
 *  which only renders when `resizable` (see below).
 *
 *  Resizing (per an explicit follow-up, after two earlier attempts):
 *  dragging only ever GROWS the panel, never shrinks it below whatever size
 *  it's already safely showing at (so it can never regress into the bug
 *  where a manually-shrunk media area left the button row's own required
 *  width sticking out past the bar's border) — see `handleResizePointerMove`
 *  below, which floors both axes at the size captured when the drag began
 *  rather than an arbitrary hardcoded minimum. Height is this component's
 *  own to control; width is applied one level up, on the whole bar's outer
 *  container (`containerRef`, passed in by the consumer) instead of on this
 *  div — that's what keeps the media area and the button row growing
 *  together as one aligned unit instead of drifting apart. */
function CallMediaArea({
  customerName,
  isInternalAgentCall,
  colleagues = [],
  isSelfCameraOff = false,
  onToggleSelfCamera,
  size,
  onSizeChange,
  resizable = false,
  containerRef,
}: {
  customerName?: string;
  isInternalAgentCall?: boolean;
  /** Colleagues merged into this call via consult (see `CallColleague`) —
   *  each renders as its own additional tile, same size/shape as the
   *  existing two (`flex-1` in the same row), matching the "flex-1 tiles,
   *  extended to N" approach picked over a fixed grid. Always shown as
   *  camera-on: this app has no session for the colleague's own client to
   *  toggle their real camera from, and per an explicit product decision
   *  only the participant themselves can turn their own camera off — there
   *  is deliberately no control anywhere in this UI that could do it on
   *  their behalf. */
  colleagues?: CallColleague[];
  /** Self's own camera, independent of `isInternalAgentCall`'s tile below —
   *  only ever toggleable once `colleagues.length > 0` (see the in-tile
   *  button rendered below): for a plain two-party call, the existing
   *  `isVideoOn` control on the button row already covers "my camera," and
   *  turning it off there hides this whole component same as always.
   *  Once merged into a conference, the agent needs to hide just their own
   *  tile without taking the other participants' tiles down with it — this
   *  is that. */
  isSelfCameraOff?: boolean;
  onToggleSelfCamera?: () => void;
  /** Explicit width/height once the agent drags the resize handle below —
   *  `null`/omitted uses the natural intrinsic size (132px tall, full bar
   *  width via the `w-full` fallback below). Lifted to `AgentNextGenPage` —
   *  the floating bar's own `videoPanelSize` and the docked bar's own
   *  `dockedVideoPanelSize` are two separate pieces of state (not shared,
   *  since each remounts independently on its own lifecycle), but both
   *  resize the same way and exist for the same reason `position` does:
   *  this component remounts via `key={assignmentId}` on every hold-swap,
   *  and a resize should survive that the same way a drag does. */
  size?: { width: number; height: number } | null;
  onSizeChange?: (size: { width: number; height: number }) => void;
  resizable?: boolean;
  /** The bar's own outer container — read at the moment a resize starts to
   *  find its CURRENT (already-safe, non-overflowing) width, which becomes
   *  the floor for the drag. Required whenever `resizable` is true. */
  containerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const accent = CHANNEL_ACCENT.voice;
  const customerDisplayName = isInternalAgentCall ? customerName ?? "Colleague" : customerName || "Customer";

  const areaRef = useRef<HTMLDivElement>(null);
  const resizeOrigin = useRef<{ pointerX: number; pointerY: number; width: number; height: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Same PointerEvent drag technique the bar itself uses for dragging (see
  // `handlePointerDown`/`handlePointerMove` below) — matching the visual
  // language (and even the handle glyph) of lyra-ui's own `Draggable`
  // corner resize, without actually wrapping this bar in `Draggable`: that
  // primitive's "docked" variant pins to the viewport's right edge like a
  // sidebar, which doesn't match either of this bar's own two positioning
  // models (composer-anchored float, inline bottom-of-panel dock) — see
  // this file's own top-level doc comments for the rest of that reasoning.
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    // Width's origin comes from the OUTER bar (`containerRef`), not this
    // div — see this component's own top doc comment for why. Height still
    // comes from this div itself, since only the media area (not the
    // button row) grows taller.
    const containerRect = containerRef?.current?.getBoundingClientRect();
    const ownRect = areaRef.current?.getBoundingClientRect();
    if (!containerRect || !ownRect) return;
    resizeOrigin.current = { pointerX: e.clientX, pointerY: e.clientY, width: containerRect.width, height: ownRect.height };
    setIsResizing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeOrigin.current || !onSizeChange) return;
    // Grow-only: the delta is floored at 0 on both axes, so dragging up/left
    // never shrinks below the size already showing when the drag started
    // (itself always a safe, non-overflowing size) — see this component's
    // own top doc comment. Capped well above anything the button row could
    // ever need, purely to stop runaway drags off toward the edge of the
    // screen.
    const nextWidth = clamp(resizeOrigin.current.width + Math.max(0, e.clientX - resizeOrigin.current.pointerX), resizeOrigin.current.width, 900);
    const nextHeight = clamp(resizeOrigin.current.height + Math.max(0, e.clientY - resizeOrigin.current.pointerY), resizeOrigin.current.height, 480);
    onSizeChange({ width: nextWidth, height: nextHeight });
  };
  const stopResizing = () => {
    resizeOrigin.current = null;
    setIsResizing(false);
  };

  return (
    <div
      ref={areaRef}
      style={size ? { height: size.height } : undefined}
      className={cn("relative mb-2.5 w-full", !size && "h-[132px]")}
    >
      <div className="flex h-full w-full gap-2">
        <div className={cn("relative flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lyra-md", !isSelfCameraOff ? accent.bg : "border border-lyra-border-subtle bg-lyra-bg-surface-container-subtle")}>
          {!isSelfCameraOff ? (
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-lyra-bg-surface-base lyra-body-md-emphasis", accent.text)}>
              You
            </span>
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lyra-bg-surface-base lyra-body-md-emphasis text-lyra-fg-secondary">
              You
            </span>
          )}
          <span className={cn("lyra-body-xs-emphasis", !isSelfCameraOff ? accent.text : "text-lyra-fg-secondary")}>Agent</span>
          {/* Only once this is an actual conference — see this prop's own
           *  doc comment above for why a plain two-party call still just
           *  uses the button row's own Video toggle. */}
          {colleagues.length > 0 && onToggleSelfCamera && (
            <button
              type="button"
              onClick={onToggleSelfCamera}
              title={isSelfCameraOff ? "Turn on my camera" : "Turn off my camera"}
              aria-pressed={isSelfCameraOff}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-lyra-bg-surface-base text-lyra-fg-secondary hover:text-lyra-fg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
            >
              {isSelfCameraOff ? <VideoOff className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Video className="h-3.5 w-3.5" strokeWidth={1.5} />}
            </button>
          )}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-container-subtle">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lyra-bg-surface-base lyra-body-md-emphasis text-lyra-fg-secondary">
            {isInternalAgentCall ? <Headset className="h-5 w-5" strokeWidth={1.5} /> : getInitials(customerName)}
          </span>
          <span className="lyra-body-xs-emphasis text-lyra-fg-secondary truncate max-w-[90%]">{customerDisplayName}</span>
        </div>
        {colleagues.map((colleague) => (
          <div key={colleague.id} className={cn("flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lyra-md", accent.bg)}>
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-lyra-bg-surface-base lyra-body-md-emphasis", accent.text)}>
              <Headset className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <span className={cn("lyra-body-xs-emphasis truncate max-w-[90%]", accent.text)}>{colleague.name}</span>
          </div>
        ))}
      </div>
      {resizable && onSizeChange && (
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={stopResizing}
          onPointerCancel={stopResizing}
          className={cn(
            "absolute bottom-0 right-0 flex h-4 w-4 touch-none items-end justify-end pb-0.5 pr-0.5 text-lyra-fg-secondary",
            isResizing ? "text-lyra-fg-default cursor-se-resize" : "cursor-se-resize hover:text-lyra-fg-default"
          )}
          role="presentation"
          aria-hidden="true"
        >
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 1L1 9M9 5L5 9" />
          </svg>
        </div>
      )}
    </div>
  );
}

export interface VoiceBarPosition {
  top: number;
  left: number;
}

export interface LiveVoiceCallBarProps {
  customerName?: string;
  /** Same flag as `Assignment.isInternalAgentCall` — swaps the initials
   *  avatar for a headset glyph, matching `InteractionNavItem`'s own
   *  `avatarIcon` treatment for the same case. */
  isInternalAgentCall?: boolean;
  /** The call's real, original "went live" timestamp — lifted to
   *  `AgentNextGenPage`'s own `voiceCallStartedAt` map and set once per
   *  assignment, not reset on every hold-swap, so the timer keeps counting
   *  continuously across being backgrounded and resumed (a real phone call's
   *  duration doesn't reset just because you switched lines and came back). */
  startedAt: number;
  /** Whether this call is currently on hold — lifted to `AgentNextGenPage`
   *  (see its own `heldVoiceCallAssignmentIds`) instead of local state, so
   *  it's a persistent fact about the call rather than something that resets
   *  to "off" every time this component remounts for a different live call.
   *  An agent must explicitly hit Resume to clear it — see `onToggleHold`. */
  isOnHold: boolean;
  /** When the current hold stretch began — `undefined` while not on hold.
   *  Lifted to `AgentNextGenPage`'s own `voiceCallHeldSince` for the same
   *  reason `isOnHold` is: it has to survive this component remounting.
   *  Drives the second "On hold MM:SS" line shown alongside the normal call
   *  timer while `isOnHold` is true — per an explicit follow-up, this shows
   *  in addition to the total call time, not instead of it. */
  heldSince?: number;
  onToggleHold: () => void;
  /** Mute/Mask/Record — lifted to `AgentNextGenPage` for the same reason
   *  `isOnHold` is: this bar needs to render in two different places (this
   *  floating presentation, and the docked `DockedVoiceControlBar` below)
   *  for the *same* ongoing call without losing state when the agent
   *  switches between them. Reset by the parent only when a genuinely
   *  different call goes live — see `goLiveWithVoiceCall` in
   *  AgentNextGenPage.tsx. */
  isMuted: boolean;
  onToggleMute: () => void;
  /** "Mask" — masks the customer's own sensitive info (card numbers, SSNs,
   *  etc. spoken mid-call) for PCI/PII compliance, not the agent's outgoing
   *  audio, hence the distinct name/icon/label from `isMuted`. */
  isMasked: boolean;
  onToggleMask: () => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  /** Adds video to this same call — same lifted-to-`AgentNextGenPage`
   *  reasoning as `isMuted`/`isMasked`/`isRecording` above (survives moving
   *  between this floating presentation and the docked bar). When true, both
   *  presentations render `VideoTiles` above their control row — there's no
   *  separate "video call" bar/panel, this IS the voice call's bar, just
   *  taller. */
  isVideoOn: boolean;
  onToggleVideo: () => void;
  /** The floating media area's explicit size once dragged via its resize
   *  handle — lifted to `AgentNextGenPage`'s own `videoPanelSize` for the
   *  same "survive this component remounting on a hold-swap" reason
   *  `position` is. `null` uses the default intrinsic size. */
  videoPanelSize?: { width: number; height: number } | null;
  onVideoPanelSizeChange?: (size: { width: number; height: number }) => void;
  /** Colleagues currently merged into this call (see `CallColleague`) —
   *  `[]` for a plain two-party call, which keeps every new affordance below
   *  (participant strip, Participants menu, self-camera tile toggle) hidden
   *  and this bar behaving exactly as it always has. */
  colleagues: CallColleague[];
  /** A private, pre-merge consult in progress — see `VoiceCallConsult`.
   *  `undefined` (not just falsy) hides the consult banner entirely. */
  consult?: VoiceCallConsult;
  /** Backs out of `consult` without merging — resumes the primary party the
   *  same way a manual Resume would (see `AgentNextGenPage`'s own
   *  `cancelVoiceCallConsult`). Only meaningful (and only rendered) while
   *  `consult` is set. */
  onCancelConsult?: () => void;
  /** Brings `consult`'s colleague into `colleagues` as a full participant
   *  and resumes the primary party — the conference actually begins here. */
  onMergeConsult?: () => void;
  /** Row-level hold for one specific colleague, independent of the primary
   *  party's own `isOnHold`/`onToggleHold` and of `onToggleHold`'s own
   *  "hold everyone at once" behavior once colleagues exist — see
   *  `AgentNextGenPage`'s own `toggleVoiceCallHold`. */
  onToggleColleagueHold: (colleagueId: string) => void;
  /** Drops just this one colleague from the conference — call continues for
   *  everyone else. Only ever offered from a colleague's own participant
   *  pill (see `ParticipantChip`'s own `onHangUp`), never the primary
   *  party or "You" — ending the whole call is what `onHangUp` below
   *  already does. */
  onDropColleague: (colleagueId: string) => void;
  /** Original agent leaves the call, handing it fully to this colleague —
   *  same end effect as `onHangUp` (this interaction leaves the rail the
   *  same way a hang-up does), just reached from a specific colleague's row
   *  in the Participants menu instead of the Hang Up button. */
  onTransferToColleague: (colleagueId: string) => void;
  /** Self's own camera within the video tiles, independent of `isVideoOn`
   *  once `colleagues.length > 0` — see `CallMediaArea`'s own doc comment
   *  for why a plain two-party call doesn't need this at all. */
  isSelfCameraOff: boolean;
  onToggleSelfCamera: () => void;
  /** Only passed while this bar is floating for a reason the agent could
   *  actually undo right now — they're still looking at this call's own
   *  interaction, but it's floating anyway because they hit Undock, because
   *  they just switched focus here from a different live/held call (docking
   *  is user-selected, not automatic — see `AgentNextGenPage`'s own
   *  `voiceCallManuallyUndocked`), or because the squeeze check kicked in.
   *  Omitted (not just falsy) hides the Dock button entirely otherwise, e.g.
   *  while floating because the agent is genuinely looking at something
   *  else, where there's nothing sensible to "dock back" to on screen right
   *  now. */
  onDock?: () => void;
  onHangUp: () => void;
  /** Every other switchable voice call (never includes the one this bar is
   *  currently showing) — populates the "switch call" picker below the
   *  name/timer. Empty when there's nothing else to switch to, which just
   *  hides the picker entirely rather than showing a dead affordance.
   *  `startedAt` is each call's own real start time (same continuous-timer
   *  reasoning as this bar's own `startedAt` above) — lets the picker show a
   *  live-ticking duration per row instead of just a name. `heldSince` is
   *  set when that other call is currently on hold (almost always true in
   *  practice — see the call site's own doc comment) — shows a red "On
   *  hold MM:SS" row instead of the plain elapsed time, per an explicit
   *  follow-up that hold state should read as red everywhere. */
  otherVoiceCalls: {
    assignmentId: string;
    customerName?: string;
    isInternalAgentCall?: boolean;
    startedAt: number;
    heldSince?: number;
  }[];
  /** Picking a call from the switcher — reuses `AgentNextGenPage`'s own
   *  `handleSelectAssignment` verbatim (same function a tile click calls),
   *  so switching from here is indistinguishable from switching by finding
   *  the tile in the rail: same hold-swap, same `activeAssignmentId`
   *  update, same tile highlight. */
  onSwitchCall: (assignmentId: string) => void;
  /** Current on-screen position in px (`top`/`left`), lifted to
   *  `AgentNextGenPage` rather than kept as local state — this component
   *  remounts via `key={assignmentId}` every time a *different* call
   *  becomes the live one (see this component's own doc comment), so
   *  anything it owned locally would snap back to the default corner on
   *  every hold-swap. `null`/undefined means "hasn't been dragged yet, use
   *  the default bottom-left anchor." */
  position: VoiceBarPosition | null;
  onPositionChange: (position: VoiceBarPosition) => void;
  /** Where to sit BEFORE the agent has ever dragged the bar themselves —
   *  computed by `AgentNextGenPage` from the current digital channel's own
   *  message composer position (see its own `composerRect`/
   *  `voiceBarDefaultAnchor`), so popping out over a digital channel never
   *  covers that channel's input area. Expressed as `left`/`bottom` (not
   *  `top`) specifically so this doesn't need to know the bar's own
   *  rendered height to sit flush just above the composer — anchoring the
   *  bar's bottom edge a fixed distance up from the viewport bottom does
   *  that regardless of how tall the bar itself is. `null` when there's no
   *  composer to align to right now (a voice call is active, or there's no
   *  active assignment at all), in which case this falls back to the
   *  bar's own generic bottom-left corner anchor below. Ignored entirely
   *  once `position` is set — dragging always wins. */
  defaultAnchor: { left: number; bottom: number } | null;
  /** Forces this bar's own chrome to the opposite of the app's real theme —
   *  per an explicit follow-up, the point is contrast with whatever's
   *  around it, not a fixed "always dark" look: dark chrome on a light app,
   *  light chrome on a dark app. `AgentNextGenPage` computes this from its
   *  own `darkMode` state (`darkMode ? "light" : "dark"`) rather than this
   *  component reading `document.documentElement` itself, keeping it a
   *  plain controlled prop like everything else here. See this component's
   *  own `data-theme` usage below for how one attribute re-scopes every
   *  lyra token used in its render for free. */
  theme: "light" | "dark";
}

/** Persistent, global "there's a live voice call somewhere" strip — survives
 *  switching `activeAssignmentId` to a completely different interaction
 *  (email, webchat, another card), unlike the per-interaction call controls
 *  that used to live inline in `InteractionActionsBar` (see that
 *  component's own doc comment in CustomerInteractionPanel.tsx). Mounted
 *  directly in `AgentNextGenPage`'s own render, outside the
 *  `activeAssignment`-gated content column, so it has no dependency on
 *  which interaction is currently on screen — only on whether a call is
 *  live at all (`AgentNextGenPage`'s own `liveVoiceCall` state).
 *  Defaults to sitting just above and left-aligned with whatever digital
 *  channel's message composer the agent is currently looking at (see
 *  `defaultAnchor` below) — per an explicit follow-up, popping this out
 *  over a digital channel must never cover that channel's own input area.
 *  Falls back to the plain bottom-left viewport corner, near the
 *  assignment rail, only when there's no composer to align to right now
 *  (e.g. the agent is looking at another voice call, or nothing at all) —
 *  reads as tied to "whichever tile has the live-call badge" (see lyra-ui's
 *  `InteractionNavItem` `liveCall` prop) rather than floating ambiguously
 *  somewhere else on screen.
 *  Full control set (hold, mute, mute speaker, record, keypad, hang up —
 *  same order/icons the old inline InteractionActionsBar row used) — no
 *  click-to-reopen (the agent
 *  finds the call's own tile in the rail like any other interaction, same
 *  as always); this is just enough to keep the call under control while
 *  looking at something else. Only one of these can exist at a time (an
 *  explicit product decision — a second call simply supersedes this one
 *  rather than stacking), so there's no queueing/stacking UI to build here.
 *  Render this with `key={assignmentId}` at the call site — that resets any
 *  remaining purely-local state (the drag-in-progress flag, the switcher's
 *  open/closed state) whenever a *different* call becomes the live one.
 *  Hold, mute, mute speaker, record, and the call timer are NOT among those
 *  — they're all controlled props now, sourced from state lifted to
 *  `AgentNextGenPage`, so they survive both a hold-swap AND moving between
 *  this floating presentation and the docked `DockedVoiceControlBar` below,
 *  instead of quietly resetting either way. Draggable anywhere
 *  on screen (grab anywhere on the bar except its
 *  own buttons) — see `position`/`onPositionChange` above for why that's
 *  lifted to the parent instead of local state. The name/timer block
 *  doubles as a "switch call" picker whenever `otherVoiceCalls` isn't
 *  empty — lets the agent pick up a different voice call without leaving
 *  whatever they're looking at to go find its tile in the rail. */
export function LiveVoiceCallBar({
  customerName,
  isInternalAgentCall,
  startedAt,
  isOnHold,
  heldSince,
  onToggleHold,
  isMuted,
  onToggleMute,
  isMasked,
  onToggleMask,
  isRecording,
  onToggleRecording,
  isVideoOn,
  onToggleVideo,
  videoPanelSize,
  onVideoPanelSizeChange,
  colleagues,
  consult,
  onCancelConsult,
  onMergeConsult,
  onToggleColleagueHold,
  onDropColleague,
  onTransferToColleague,
  isSelfCameraOff,
  onToggleSelfCamera,
  onDock,
  onHangUp,
  otherVoiceCalls,
  onSwitchCall,
  position,
  onPositionChange,
  defaultAnchor,
  theme,
}: LiveVoiceCallBarProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => Math.floor((Date.now() - startedAt) / 1000));
  const [isDragging, setIsDragging] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{ pointerX: number; pointerY: number; top: number; left: number } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  // Dragging is grabbed from anywhere on the bar EXCEPT its own buttons
  // (checked via `.closest("button")`, since the pointerdown target is often
  // the icon glyph inside one) — otherwise clicking Mute/Hold/etc. would
  // also start a drag. Pointer Events (not mouse-specific handlers) so this
  // works the same for touch. Position is reported in viewport px and
  // clamped to stay fully on-screen; `touch-action: none` on the container
  // (set inline below) stops the browser's own touch-scroll from fighting
  // the drag on touch devices.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOrigin.current = { pointerX: e.clientX, pointerY: e.clientY, top: rect.top, left: rect.left };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOrigin.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 0;
    const height = rect?.height ?? 0;
    const nextLeft = clamp(dragOrigin.current.left + (e.clientX - dragOrigin.current.pointerX), 8, window.innerWidth - width - 8);
    const nextTop = clamp(dragOrigin.current.top + (e.clientY - dragOrigin.current.pointerY), 8, window.innerHeight - height - 8);
    onPositionChange({ top: nextTop, left: nextLeft });
  };

  const stopDragging = () => {
    dragOrigin.current = null;
    setIsDragging(false);
  };

  const accent = CHANNEL_ACCENT.voice;
  const displayName = isInternalAgentCall ? customerName ?? "Colleague" : customerName || "Customer";
  // Ticks off the same 1s interval as `elapsedSeconds` above (no separate
  // timer needed) — `undefined` while not on hold.
  const heldSeconds = isOnHold && heldSince ? Math.floor((Date.now() - heldSince) / 1000) : undefined;

  const avatar = (
    <span
      className={cn("flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full lyra-body-md-emphasis", accent.bg, accent.text)}
      aria-hidden="true"
    >
      {isInternalAgentCall ? <Headset className="h-[19px] w-[19px]" strokeWidth={1.5} /> : getInitials(customerName)}
    </span>
  );

  // Shared name/timer text stack — used both inside the switcher's trigger
  // button and, when there's nothing to switch to, on its own. Shows a
  // second "On hold MM:SS" line under the normal call timer while held —
  // per an explicit follow-up, in addition to the total time, not swapped
  // in for it.
  const nameAndTimer = (
    <span className="min-w-0 flex-1">
      <p className="truncate lyra-body-md-emphasis text-lyra-fg-default">{displayName}</p>
      <p className="lyra-body-sm text-lyra-fg-secondary">{formatElapsed(elapsedSeconds)}</p>
      {heldSeconds !== undefined && (
        <p className="lyra-body-sm-emphasis text-lyra-status-critical-strong">On hold {formatElapsed(heldSeconds)}</p>
      )}
    </span>
  );

  return (
    <div
      ref={containerRef}
      // Forced reverse chrome — per an explicit follow-up, this bar should
      // read as visually distinct from whatever's around it, in either app
      // theme: dark chrome on a light app, light chrome on a dark one (see
      // `theme`'s own doc comment for how that's computed). `data-theme`
      // re-scopes every lyra token used below (surface, text, border,
      // hover/pressed state layers, and the SELECTED_RED/SELECTED_SLATE
      // fills) to that theme's values for free, with no per-class overrides
      // — see lyra-tokens.css's own `[data-theme="dark"]` block. Popovers/
      // menus opened from here (the call switcher, Participants menu) are
      // portaled and so still follow the app's real theme, same as any
      // dropdown spawned from a toolbar.
      data-theme={theme}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      style={{
        touchAction: "none",
        // Dragging the media area's own resize handle sets `width` here
        // (not on `CallMediaArea` itself) so the whole bar — media area and
        // button row together — grows as one aligned unit. Safe against the
        // earlier overflow bug since the resize is grow-only, floored at
        // this container's own current width — see `CallMediaArea`'s own
        // top doc comment.
        ...(videoPanelSize ? { width: videoPanelSize.width } : {}),
        ...(position
          ? { position: "fixed", top: position.top, left: position.left }
          : defaultAnchor
            ? { position: "fixed", bottom: defaultAnchor.bottom, left: defaultAnchor.left }
            : undefined),
      }}
      className={cn(
        // Sized up ~20% overall per an explicit follow-up (container
        // padding/gap, the avatar, both text lines, the divider, and every
        // button/icon below) — the icon buttons themselves switch from
        // ActionIconButton's "default" (36px) to its "xl" (44px) variant,
        // the closest built-in size step to +20% (+22%), rather than a
        // one-off arbitrary size on a shared lyra-ui component.
        // `flex-col` unconditionally (not just while `isVideoOn`) — the row
        // of switcher/avatar/buttons below is its own nested flex row, so
        // this outer column layout is a no-op on alignment while video is
        // off and simply makes room for `VideoTiles` above that row once
        // it's on.
        "z-[9998] flex select-none flex-col rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base px-3.5 py-2.5 shadow-md",
        // Only falls back to the plain viewport corner when there's truly
        // nothing better to anchor to (no composer on screen to align
        // with) — see `defaultAnchor`'s own doc comment.
        !position && !defaultAnchor && "fixed bottom-4 left-4",
        !position && "animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      role="region"
      aria-label={`Live call with ${displayName}, ${formatElapsed(elapsedSeconds)} elapsed${isVideoOn ? ", video on" : ""}`}
    >
      {consult && (
        <ConsultBanner consultName={formatParticipantLabel(consult.name, consult.sourceSkillName)} onCancel={onCancelConsult} onMerge={onMergeConsult} />
      )}
      {colleagues.length > 0 && !consult && (
        <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto">
          <ParticipantChip label="You" isSelf isOnHold={false} />
          <ParticipantChip label={displayName} isInternalAgent={isInternalAgentCall} isOnHold={isOnHold} onToggleHold={onToggleHold} />
          {colleagues.map((colleague) => (
            <ParticipantChip
              key={colleague.id}
              label={formatParticipantLabel(colleague.name, colleague.sourceSkillName)}
              isInternalAgent
              isOnHold={colleague.isOnHold}
              onToggleHold={() => onToggleColleagueHold(colleague.id)}
              onTransfer={() => onTransferToColleague(colleague.id)}
              onHangUp={() => onDropColleague(colleague.id)}
            />
          ))}
        </div>
      )}
      {isVideoOn && (
        <CallMediaArea
          customerName={customerName}
          isInternalAgentCall={isInternalAgentCall}
          colleagues={colleagues}
          isSelfCameraOff={isSelfCameraOff}
          onToggleSelfCamera={onToggleSelfCamera}
          size={videoPanelSize}
          onSizeChange={onVideoPanelSizeChange}
          resizable
          containerRef={containerRef}
        />
      )}
      <div className="flex items-center gap-3">
      {otherVoiceCalls.length > 0 ? (
        <Popover
          open={switcherOpen}
          onOpenChange={setSwitcherOpen}
          placement="top"
          align="start"
          // This bar's own outer container sits at `z-[9998]` (see its own
          // doc comment on why) so it always floats above ordinary app
          // chrome — but `Popover`'s own portaled content defaults to only
          // `z-50`. While conferencing, the participant strip makes this
          // bar noticeably taller (it grows upward — the container is
          // anchored by `bottom`), which extends the bar's own painted
          // area up into the same screen region this "top"-placed popover
          // renders in; since 9998 > 50, the bar then paints over the
          // popover instead of the other way around, hiding it. Bumping
          // this one popover above the bar's own z-index (not touching
          // popover.tsx) fixes it without affecting any other Popover in
          // the app.
          className="z-[9999]"
          // No `alignOffset` on this wrapper (see popover.tsx), so instead
          // of anchoring to just the name/timer button — which sits to the
          // right of the avatar, offsetting the flyout's left edge from the
          // bar's own outer edge — the avatar is now INSIDE the trigger
          // button below. `align="start"` then lines the flyout up with the
          // whole bar's outer left edge, per an explicit follow-up, with no
          // lyra-ui changes needed.
          content={
            <Menu
              aria-label="Switch voice call"
              className="min-w-[220px]"
              items={otherVoiceCalls.map((call): MenuEntry => {
                const otherName = call.isInternalAgentCall ? call.customerName ?? "Colleague" : call.customerName || "Customer";
                const isOtherHeld = call.heldSince !== undefined;
                // Held (almost always true — see this prop's own doc
                // comment) shows "On hold MM:SS" in red instead of the
                // plain total elapsed, matching the bar's/tile's own
                // treatment of the exact same state.
                const otherDescription = isOtherHeld
                  ? `On hold ${formatElapsed(Math.floor((Date.now() - call.heldSince!) / 1000))}`
                  : formatElapsed(Math.floor((Date.now() - call.startedAt) / 1000));
                return {
                  id: call.assignmentId,
                  // Same avatar + name-over-timer shape as the bar's own
                  // leading content (see the avatar `span` and name/timer
                  // block above) — reused here via `icon`/`description`
                  // rather than a plain text label, so a row in the picker
                  // reads as "the same call" whether it's in the bar or the
                  // dropdown, not two different representations of it.
                  icon: (
                    <span
                      className={cn("flex h-5 w-5 items-center justify-center rounded-full lyra-body-xs-emphasis", accent.bg, accent.text)}
                      aria-hidden="true"
                    >
                      {call.isInternalAgentCall ? <Headset className="h-3 w-3" strokeWidth={1.5} /> : getInitials(call.customerName)}
                    </span>
                  ),
                  label: call.isInternalAgentCall ? `${otherName} (internal)` : otherName,
                  description: otherDescription,
                  descriptionCritical: isOtherHeld,
                  onClick: () => {
                    onSwitchCall(call.assignmentId);
                    setSwitcherOpen(false);
                  },
                };
              })}
            />
          }
        >
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={switcherOpen}
            className="flex min-w-0 max-w-[220px] items-center gap-2 rounded-lyra-sm text-left hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
          >
            {avatar}
            {nameAndTimer}
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 text-lyra-fg-secondary transition-transform", switcherOpen && "rotate-180")}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </Popover>
      ) : (
        <>
          {avatar}
          {nameAndTimer}
        </>
      )}
      {colleagues.length > 0 && (
        // Deliberately its own Popover/Menu, not merged into the switcher
        // above — per an explicit follow-up, "who's on this call" and
        // "which other call could I switch to" read as two different
        // questions once conferencing exists, so they get two separate
        // menus rather than one combined list.
        <Popover
          open={participantsOpen}
          onOpenChange={setParticipantsOpen}
          placement="top"
          align="start"
          // Same z-index fix as the call switcher's `Popover` above, same
          // reason — see that one's own doc comment.
          className="z-[9999]"
          content={
            <Menu
              aria-label="Call participants"
              className="min-w-[220px]"
              items={buildParticipantMenuItems({
                primaryName: displayName,
                primaryIsInternalAgent: isInternalAgentCall,
                primaryIsOnHold: isOnHold,
                primaryHeldSeconds: heldSeconds,
                onTogglePrimaryHold: () => { onToggleHold(); setParticipantsOpen(false); },
                colleagues,
                onToggleColleagueHold: (id) => { onToggleColleagueHold(id); setParticipantsOpen(false); },
                onTransferToColleague: (id) => { onTransferToColleague(id); setParticipantsOpen(false); },
              })}
            />
          }
        >
          <ActionIconButton
            size="xl"
            title={`Participants (${colleagues.length + 2})`}
            aria-expanded={participantsOpen}
            className={cn(participantsOpen && "bg-lyra-state-hover")}
          >
            <Users className="h-6 w-6" strokeWidth={2} />
          </ActionIconButton>
        </Popover>
      )}
      <div className="mx-0.5 h-7 w-px bg-lyra-border-subtle" />
      <ActionIconButton
        size="xl"
        title={isOnHold ? "Resume" : "Hold"}
        aria-pressed={isOnHold}
        onClick={onToggleHold}
        className={cn(isOnHold && SELECTED_RED)}
      >
        {/* Swaps shape (Pause↔Play), not just color, once on hold — per an
         *  accessibility follow-up (WCAG 1.4.1, color can't be the only
         *  state cue). Play reads as "tap to resume", matching this
         *  button's own title/aria-label in that state. */}
        {isOnHold ? (
          <Play className="h-6 w-6 text-lyra-fg-on-destructive" strokeWidth={2} />
        ) : (
          <Pause className="h-6 w-6" strokeWidth={2} />
        )}
      </ActionIconButton>
      <ActionIconButton
        size="xl"
        title={isMuted ? "Unmute" : "Mute"}
        aria-pressed={isMuted}
        onClick={onToggleMute}
        className={cn(isMuted && SELECTED_SLATE)}
      >
        {isMuted ? (
          <MicOff className="h-6 w-6 text-lyra-fg-inverse" strokeWidth={2} />
        ) : (
          <Mic className="h-6 w-6" strokeWidth={2} />
        )}
      </ActionIconButton>
      <ActionIconButton
        size="xl"
        title="Mask"
        aria-pressed={isMasked}
        onClick={onToggleMask}
        className={cn(isMasked && SELECTED_SLATE)}
      >
        {/* Slash stays on in both states — this isn't a mute toggle whose
         *  icon reflects on/off, it's a fixed "masking" glyph (see
         *  `isMasked`'s own doc comment) — so unlike Hold/Record, changing
         *  its shape isn't an option here. Per the same accessibility
         *  follow-up, a small always-visible dot takes over as the non-color
         *  "engaged" cue instead, using `bg-lyra-bg-surface-base` — always
         *  the theme's own extreme (white in light, near-black in dark),
         *  so it stays legible against `accent-slate-strong`'s mid-tone
         *  fill in either theme. The icon itself now uses `fg-inverse`
         *  (not `fg-on-primary`) for the same reason — see this file's
         *  `SELECTED_RED` constant above for the full explanation. */}
        <span className="relative inline-flex">
          <MutedAudioLinesIcon strokeWidth={2} className={isMasked ? "text-lyra-fg-inverse" : undefined} />
          {isMasked && (
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-lyra-bg-surface-base"
              aria-hidden="true"
            />
          )}
        </span>
      </ActionIconButton>
      <ActionIconButton
        size="xl"
        title={isRecording ? "Stop Recording" : "Record"}
        aria-pressed={isRecording}
        onClick={onToggleRecording}
        className={cn(isRecording && SELECTED_RED)}
      >
        {/* Hollow ring off, filled dot on — same "shape change, not just
         *  color" fix as Hold above, and a common record-button convention. */}
        {isRecording ? (
          <CircleDot className="h-6 w-6 text-lyra-fg-on-destructive" strokeWidth={2} />
        ) : (
          <Circle className="h-6 w-6" strokeWidth={2} />
        )}
      </ActionIconButton>
      <ActionIconButton size="xl" title="Keypad">
        <Grip className="h-6 w-6" strokeWidth={2} />
      </ActionIconButton>
      {/* Video/Dock form their own group, separated from the call controls
       *  above by this divider — per an explicit follow-up, these read as
       *  "how this call is being presented" (audio-only vs. video, floating
       *  vs. docked) rather than "in-call actions" like Hold/Mute/Mask/
       *  Record, so they're visually set apart instead of interleaved among
       *  them. */}
      <div className="mx-0.5 h-7 w-px bg-lyra-border-subtle" />
      <ActionIconButton
        size="xl"
        title={isVideoOn ? "Turn off video" : "Add video"}
        aria-pressed={isVideoOn}
        onClick={onToggleVideo}
        className={cn(isVideoOn && SELECTED_SLATE)}
      >
        {isVideoOn ? (
          <Video className="h-6 w-6 text-lyra-fg-inverse" strokeWidth={2} />
        ) : (
          <VideoOff className="h-6 w-6" strokeWidth={2} />
        )}
      </ActionIconButton>
      {onDock && (
        <ActionIconButton size="xl" title="Dock" onClick={onDock}>
          <PanelRight className="h-6 w-6" strokeWidth={2} />
        </ActionIconButton>
      )}
      <ActionIconButton size="xl" title="Hang Up" onClick={onHangUp}>
        <PhoneOff className="h-6 w-6 text-lyra-status-critical-strong" strokeWidth={2} />
      </ActionIconButton>
      </div>
    </div>
  );
}

/* ── Docked presentation ──
 * See `DockedVoiceControlBarProps`'s own doc comment for the full "why" —
 * this is the same underlying call's controls, just rendered inline in
 * `CustomerInteractionPanel` instead of floating, whenever the agent is
 * looking at that call's own interaction. Captioned per an explicit
 * follow-up ("Option B" — a centered pill with each button labeled
 * underneath) — meant to be more immediately noticeable than the floating
 * bar's smaller icons-only row, which relies on a tooltip alone. Per a
 * later follow-up, the buttons themselves share the exact same shape as
 * the floating bar's (no `rounded-full` override) — only the caption and
 * the lack of a name/timer/switcher distinguish this from that presentation
 * now, so the two read as the same control set rather than two different
 * designs. */

function DockedControlButton({
  title,
  selected,
  tone,
  onClick,
  children,
}: {
  title: string;
  selected?: boolean;
  /** Which `SELECTED_*` fill to use once `selected` — see that constant's
   *  own doc comment (red = "actively happening", slate = "quieter, not
   *  critical"). Omitted for buttons with no selected state (Keypad, Hang
   *  Up). */
  tone?: "red" | "slate";
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <ActionIconButton
        size="xl"
        title={title}
        aria-pressed={selected}
        onClick={onClick}
        className={cn(selected && (tone === "red" ? SELECTED_RED : SELECTED_SLATE))}
      >
        {children}
      </ActionIconButton>
      <span className="lyra-body-xs text-lyra-fg-secondary">{title}</span>
    </div>
  );
}

export interface DockedVoiceControlBarProps {
  /** Shown next to a small avatar at the pill's leading edge — per an
   *  explicit follow-up, the docked controls can sit far from the panel
   *  header's own name (top-left) once the message thread scrolls, so this
   *  re-affirms exactly who the agent is about to put on hold/mute/etc.
   *  right at the point of action. Same fallback as the floating bar's own
   *  `customerName` — "Customer" (or "Colleague" for an internal call) when
   *  absent. */
  customerName?: string;
  isInternalAgentCall?: boolean;
  /** This call's real start time — same continuous-timer value
   *  `LiveVoiceCallBar` itself is given, so the elapsed time reads
   *  identically in both presentations rather than resetting when the call
   *  moves between them. Restored here per an explicit follow-up ("restore
   *  timers to the bottom phone control area also, under the customer
   *  name") after the original "Option B" pick had left it out. */
  startedAt: number;
  /** When this call most recently went on hold — same value/semantics as
   *  `LiveVoiceCallBar`'s own `heldSince`. `undefined` while not on hold.
   *  Drives the red "On hold MM:SS" line under the timer, matching that
   *  bar's identical treatment. */
  heldSince?: number;
  isOnHold: boolean;
  onToggleHold: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isMasked: boolean;
  onToggleMask: () => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  /** Same call, same state as `LiveVoiceCallBarProps.isVideoOn` — see that
   *  prop's own doc comment. */
  isVideoOn: boolean;
  onToggleVideo: () => void;
  /** Explicit width/height once the agent drags the docked media area's
   *  own resize handle — a separate piece of state from the floating bar's
   *  `videoPanelSize` since the two remount independently, but the same
   *  shape/both-axes behavior. `null`/omitted uses the default 132px-tall,
   *  panel-width size. */
  videoPanelSize?: { width: number; height: number } | null;
  onVideoPanelSizeChange?: (size: { width: number; height: number }) => void;
  /** Same conference state/actions as `LiveVoiceCallBarProps` — see those
   *  doc comments, identical meaning in both presentations. */
  colleagues: CallColleague[];
  consult?: VoiceCallConsult;
  onCancelConsult?: () => void;
  onMergeConsult?: () => void;
  onToggleColleagueHold: (colleagueId: string) => void;
  onDropColleague: (colleagueId: string) => void;
  onTransferToColleague: (colleagueId: string) => void;
  isSelfCameraOff: boolean;
  onToggleSelfCamera: () => void;
  /** Pops this call's controls out to the floating `LiveVoiceCallBar`
   *  without leaving this interaction — always available now that docking
   *  is a deliberate, user-selected state rather than something that just
   *  happens whenever the agent glances away (see `AgentNextGenPage`'s own
   *  `voiceCallManuallyUndocked` and `handleSelectAssignment`'s hold-swap
   *  branch for the other half of that: switching straight to a different
   *  live/held voice call no longer auto-docks it either). Kept optional
   *  for type-compat with existing callers, but every current call site
   *  always passes it. */
  onUndock?: () => void;
  /** Reports this bar's own current rendered width (in px) every time it
   *  changes — `AgentNextGenPage` caches the latest value (see its own
   *  `dockedBarNeededWidth`) and compares it against how much room the
   *  center column actually has (accounting for the Customer Profile side
   *  panel, if open) to decide whether this bar even fits. Caching the
   *  value, rather than only measuring while docked, is what lets that
   *  auto-undock decision keep working once this component has already
   *  unmounted (undocked) — there'd otherwise be nothing left to measure to
   *  notice the panel has closed and there's room to redock. */
  onNeededWidthChange?: (width: number) => void;
  onHangUp: () => void;
  /** Same "opposite of the app's real theme" contract as
   *  `LiveVoiceCallBarProps.theme` — see that prop's own doc comment.
   *  `AgentNextGenPage` passes the identical `darkMode ? "light" : "dark"`
   *  value to both bars so a call reads the same whichever presentation
   *  it's currently in. */
  theme: "light" | "dark";
}

/** Docked presentation of the exact same live call's controls
 *  `LiveVoiceCallBar` shows floating — rendered through
 *  `CustomerInteractionPanel`'s own `voiceControls` slot at the bottom of
 *  the center panel, only while the agent is actively viewing this call's
 *  own interaction (see `AgentNextGenPage`'s derived `isVoiceCallDocked`).
 *  Shows a small avatar + `customerName` + elapsed timer at the leading
 *  edge, same shape as the floating bar's own name/timer stack — no
 *  switcher though (per the original "Option B" pick, since picking a
 *  *different* call to switch to is only meaningful when the agent isn't
 *  already looking at the one they'd be switching away from). The moment
 *  the agent selects a *different* interaction, this bar disappears and
 *  `LiveVoiceCallBar` takes over instead — reappearing with the switcher on
 *  top of the same name/timer, per an explicit follow-up ("when popped
 *  out, add the customer name, timer etc. until redocked"). Not
 *  draggable — it's laid out in-flow at the bottom of the panel, not
 *  floating on top of anything.
 *  `isMuted`/`isMasked`/`isRecording`/`isOnHold` are all controlled from
 *  `AgentNextGenPage`, the same state `LiveVoiceCallBar` reads — so muting
 *  here and then looking away (popping this out) still shows the call as
 *  muted; neither presentation owns this state itself. */
export function DockedVoiceControlBar({
  customerName,
  isInternalAgentCall,
  startedAt,
  heldSince,
  isOnHold,
  onToggleHold,
  isMuted,
  onToggleMute,
  isMasked,
  onToggleMask,
  isRecording,
  onToggleRecording,
  isVideoOn,
  onToggleVideo,
  videoPanelSize,
  onVideoPanelSizeChange,
  colleagues,
  consult,
  onCancelConsult,
  onMergeConsult,
  onToggleColleagueHold,
  onDropColleague,
  onTransferToColleague,
  isSelfCameraOff,
  onToggleSelfCamera,
  onUndock,
  onNeededWidthChange,
  onHangUp,
  theme,
}: DockedVoiceControlBarProps) {
  const accent = CHANNEL_ACCENT.voice;
  const displayName = isInternalAgentCall ? customerName ?? "Colleague" : customerName || "Customer";
  const [participantsOpen, setParticipantsOpen] = useState(false);
  // Same continuous 1s tick `LiveVoiceCallBar` runs off its own `startedAt`
  // — kept local to whichever presentation is actually mounted rather than
  // lifted, since `startedAt`/`heldSince` (the only real state) already
  // live in `AgentNextGenPage` and are all this needs to derive from.
  const [elapsedSeconds, setElapsedSeconds] = useState(() => Math.floor((Date.now() - startedAt) / 1000));
  useEffect(() => {
    const id = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const heldSeconds = isOnHold && heldSince ? Math.floor((Date.now() - heldSince) / 1000) : undefined;
  const pillRef = useRef<HTMLDivElement>(null);
  // Reports this bar's own width any time it changes — video/share turning
  // on or off, a manual resize, even the customer name changing length —
  // so `AgentNextGenPage` always has a fresh answer for "how wide does this
  // bar want to be" without having to re-derive it. See `onNeededWidthChange`'s
  // own doc comment for why this is cached by the parent rather than only
  // read while docked.
  useEffect(() => {
    if (!onNeededWidthChange || !pillRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width !== undefined) onNeededWidthChange(Math.ceil(width));
    });
    observer.observe(pillRef.current);
    return () => observer.disconnect();
  }, [onNeededWidthChange]);
  return (
    <div className="flex justify-center border-t border-lyra-border-subtle bg-lyra-bg-surface-base py-3">
      {/* Same rounded-lyra-lg/border/background as the floating bar's own
       *  outer container (see its className above) — per an explicit
       *  follow-up, the two should read as the same bar in two locations,
       *  not two different designs. The one difference: no `shadow-md`
       *  (in-flow at the bottom of the panel, not floating on top of other
       *  content, so a drop shadow would look out of place until it
       *  actually pops out).
       *  Forced reverse chrome, same as the floating `LiveVoiceCallBar` — see
       *  that component's own `data-theme` doc comment for why. Scoped to
       *  just this inner rounded card (not the full-width strip around it),
       *  so the reverse treatment reads as a contained, elevated pill rather
       *  than a band spanning the whole panel width; the Participants menu
       *  below is portaled and still follows the app's real theme instead. */}
      <div
        ref={pillRef}
        data-theme={theme}
        className="flex flex-col rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base px-6 py-3"
        // Same "resize sets width on the outer bar" as the floating bar —
        // see `CallMediaArea`'s own top doc comment for why.
        style={videoPanelSize ? { width: videoPanelSize.width } : undefined}
      >
        {consult && (
          <ConsultBanner consultName={formatParticipantLabel(consult.name, consult.sourceSkillName)} onCancel={onCancelConsult} onMerge={onMergeConsult} />
        )}
        {colleagues.length > 0 && !consult && (
          <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto">
            <ParticipantChip label="You" isSelf isOnHold={false} />
            {/* `onToggleHold`/`onToggleColleagueHold`/`onDropColleague` were
             *  missing from this docked presentation's own `ParticipantChip`
             *  calls (bug: the floating bar passed them, this one never did)
             *  — `canExpand` inside `ParticipantChip` is only true once at
             *  least one of `onToggleHold`/`onHangUp` is actually passed, so
             *  hover-to-expand silently never engaged here. Mirrors the
             *  floating bar's own calls above exactly. */}
            <ParticipantChip label={displayName} isInternalAgent={isInternalAgentCall} isOnHold={isOnHold} onToggleHold={onToggleHold} />
            {colleagues.map((colleague) => (
              <ParticipantChip
                key={colleague.id}
                label={formatParticipantLabel(colleague.name, colleague.sourceSkillName)}
                isInternalAgent
                isOnHold={colleague.isOnHold}
                onToggleHold={() => onToggleColleagueHold(colleague.id)}
                onTransfer={() => onTransferToColleague(colleague.id)}
                onHangUp={() => onDropColleague(colleague.id)}
              />
            ))}
          </div>
        )}
        {isVideoOn && (
          <CallMediaArea
            customerName={customerName}
            isInternalAgentCall={isInternalAgentCall}
            colleagues={colleagues}
            isSelfCameraOff={isSelfCameraOff}
            onToggleSelfCamera={onToggleSelfCamera}
            size={videoPanelSize}
            onSizeChange={onVideoPanelSizeChange}
            resizable={!!onVideoPanelSizeChange}
            containerRef={pillRef}
          />
        )}
        <div className="flex items-center gap-5">
        <span className="flex items-center gap-2">
          <span
            className={cn("flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full lyra-body-md-emphasis", accent.bg, accent.text)}
            aria-hidden="true"
          >
            {isInternalAgentCall ? <Headset className="h-[19px] w-[19px]" strokeWidth={1.5} /> : getInitials(customerName)}
          </span>
          <span className="min-w-0 max-w-[160px]">
            <p className="truncate lyra-body-md-emphasis text-lyra-fg-default">{displayName}</p>
            <p className="lyra-body-sm text-lyra-fg-secondary">{formatElapsed(elapsedSeconds)}</p>
            {heldSeconds !== undefined && (
              <p className="lyra-body-sm-emphasis text-lyra-status-critical-strong">On hold {formatElapsed(heldSeconds)}</p>
            )}
          </span>
        </span>
        {colleagues.length > 0 && (
          // Same "separate from the switcher" reasoning as the floating
          // bar's identical button — see that one's own comment. Wraps a
          // bare `ActionIconButton` (not `DockedControlButton`) as the
          // Popover trigger, matching `ConsultTransferButton`'s own
          // Popover+ActionIconButton pairing: `DockedControlButton` is a
          // plain, non-forwardRef component, and Radix's `Trigger asChild`
          // needs its child to actually forward a ref/extra props down to a
          // real DOM node — the caption span is added manually alongside
          // instead, to keep this reading as one of the row's icon+caption
          // buttons like every other one here.
          <div className="flex flex-col items-center gap-0.5">
            <Popover
              open={participantsOpen}
              onOpenChange={setParticipantsOpen}
              placement="top"
              align="start"
              content={
                <Menu
                  aria-label="Call participants"
                  className="min-w-[220px]"
                  items={buildParticipantMenuItems({
                    primaryName: displayName,
                    primaryIsInternalAgent: isInternalAgentCall,
                    primaryIsOnHold: isOnHold,
                    primaryHeldSeconds: heldSeconds,
                    onTogglePrimaryHold: () => { onToggleHold(); setParticipantsOpen(false); },
                    colleagues,
                    onToggleColleagueHold: (id) => { onToggleColleagueHold(id); setParticipantsOpen(false); },
                    onTransferToColleague: (id) => { onTransferToColleague(id); setParticipantsOpen(false); },
                  })}
                />
              }
            >
              <ActionIconButton
                size="xl"
                title="Participants"
                aria-expanded={participantsOpen}
                className={cn(participantsOpen && SELECTED_SLATE)}
              >
                <Users className={cn("h-6 w-6", participantsOpen && "text-lyra-fg-inverse")} strokeWidth={2} />
              </ActionIconButton>
            </Popover>
            <span className="lyra-body-xs text-lyra-fg-secondary">Participants</span>
          </div>
        )}
        <div className="mx-0.5 h-7 w-px bg-lyra-border-subtle" />
        <DockedControlButton title={isOnHold ? "Resume" : "Hold"} selected={isOnHold} tone="red" onClick={onToggleHold}>
          {/* Shape swap, not just color — see the floating bar's identical
           *  button for why (WCAG 1.4.1). */}
          {isOnHold ? (
            <Play className="h-6 w-6 text-lyra-fg-on-destructive" strokeWidth={2} />
          ) : (
            <Pause className="h-6 w-6" strokeWidth={2} />
          )}
        </DockedControlButton>
        <DockedControlButton title={isMuted ? "Unmute" : "Mute"} selected={isMuted} tone="slate" onClick={onToggleMute}>
          {isMuted ? (
            <MicOff className="h-6 w-6 text-lyra-fg-inverse" strokeWidth={2} />
          ) : (
            <Mic className="h-6 w-6" strokeWidth={2} />
          )}
        </DockedControlButton>
        <DockedControlButton
          title="Mask"
          selected={isMasked}
          tone="slate"
          onClick={onToggleMask}
        >
          {/* Slash stays on regardless of state; a small always-visible dot
           *  is the non-color "engaged" cue instead — see the floating
           *  bar's identical button for the full reasoning (WCAG 1.4.1). */}
          <span className="relative inline-flex">
            <MutedAudioLinesIcon strokeWidth={2} className={isMasked ? "text-lyra-fg-inverse" : undefined} />
            {isMasked && (
              <span
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-lyra-bg-surface-base"
                aria-hidden="true"
              />
            )}
          </span>
        </DockedControlButton>
        <DockedControlButton title={isRecording ? "Stop Recording" : "Record"} selected={isRecording} tone="red" onClick={onToggleRecording}>
          {/* Hollow ring off, filled dot on — see the floating bar's
           *  identical button for why (WCAG 1.4.1). */}
          {isRecording ? (
            <CircleDot className="h-6 w-6 text-lyra-fg-on-destructive" strokeWidth={2} />
          ) : (
            <Circle className="h-6 w-6" strokeWidth={2} />
          )}
        </DockedControlButton>
        <DockedControlButton title="Keypad">
          <Grip className="h-6 w-6" strokeWidth={2} />
        </DockedControlButton>
        {/* Video/Undock form their own group, separated from the call
         *  controls above — see the floating bar's identical divider for
         *  why (same "how this call is presented" vs. "in-call action"
         *  distinction). */}
        <div className="mx-0.5 h-7 w-px bg-lyra-border-subtle" />
        <DockedControlButton title={isVideoOn ? "Turn off video" : "Add video"} selected={isVideoOn} tone="slate" onClick={onToggleVideo}>
          {isVideoOn ? (
            <Video className="h-6 w-6 text-lyra-fg-inverse" strokeWidth={2} />
          ) : (
            <VideoOff className="h-6 w-6" strokeWidth={2} />
          )}
        </DockedControlButton>
        {onUndock && (
          <DockedControlButton title="Undock" onClick={onUndock}>
            <Move className="h-6 w-6" strokeWidth={2} />
          </DockedControlButton>
        )}
        <DockedControlButton title="Hang Up" onClick={onHangUp}>
          <PhoneOff className="h-6 w-6 text-lyra-status-critical-strong" strokeWidth={2} />
        </DockedControlButton>
        </div>
      </div>
    </div>
  );
}
