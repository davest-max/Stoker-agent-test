import { useEffect, useRef, useState } from "react";
import { ActionIconButton, CHANNEL_ACCENT, Popover, Menu, type MenuEntry } from "@nicecxone/lyra-ui";
import { Headset, Mic, MicOff, Pause, AudioLines, CircleDot, Grip, PhoneOff, ChevronDown } from "lucide-react";
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
const SELECTED_RED = "bg-lyra-status-critical-strong hover:bg-lyra-status-critical-strong active:bg-lyra-status-critical-strong";
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
  onHangUp,
  otherVoiceCalls,
  onSwitchCall,
  position,
  onPositionChange,
  defaultAnchor,
}: LiveVoiceCallBarProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => Math.floor((Date.now() - startedAt) / 1000));
  const [isDragging, setIsDragging] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      style={{
        touchAction: "none",
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
        "z-[9998] flex select-none items-center gap-3 rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base px-3.5 py-2.5 shadow-md",
        // Only falls back to the plain viewport corner when there's truly
        // nothing better to anchor to (no composer on screen to align
        // with) — see `defaultAnchor`'s own doc comment.
        !position && !defaultAnchor && "fixed bottom-4 left-4",
        !position && "animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      role="region"
      aria-label={`Live call with ${displayName}, ${formatElapsed(elapsedSeconds)} elapsed`}
    >
      {otherVoiceCalls.length > 0 ? (
        <Popover
          open={switcherOpen}
          onOpenChange={setSwitcherOpen}
          placement="top"
          align="start"
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
      <div className="mx-0.5 h-7 w-px bg-lyra-border-subtle" />
      <ActionIconButton
        size="xl"
        title={isOnHold ? "Resume" : "Hold"}
        aria-pressed={isOnHold}
        onClick={onToggleHold}
        className={cn(isOnHold && SELECTED_RED)}
      >
        <Pause className={cn("h-6 w-6", isOnHold && "text-lyra-fg-on-primary")} strokeWidth={2} />
      </ActionIconButton>
      <ActionIconButton
        size="xl"
        title={isMuted ? "Unmute" : "Mute"}
        aria-pressed={isMuted}
        onClick={onToggleMute}
        className={cn(isMuted && SELECTED_SLATE)}
      >
        {isMuted ? (
          <MicOff className="h-6 w-6 text-lyra-fg-on-primary" strokeWidth={2} />
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
         *  icon reflects on/off, it's a fixed "masking" glyph; the filled
         *  slate background (via SELECTED_SLATE above) is what shows the
         *  toggle is engaged. See `isMasked`'s own doc comment. */}
        <MutedAudioLinesIcon strokeWidth={2} className={isMasked ? "text-lyra-fg-on-primary" : undefined} />
      </ActionIconButton>
      <ActionIconButton
        size="xl"
        title={isRecording ? "Stop Recording" : "Record"}
        aria-pressed={isRecording}
        onClick={onToggleRecording}
        className={cn(isRecording && SELECTED_RED)}
      >
        <CircleDot className={cn("h-6 w-6", isRecording && "text-lyra-fg-on-primary")} strokeWidth={2} />
      </ActionIconButton>
      <ActionIconButton size="xl" title="Keypad">
        <Grip className="h-6 w-6" strokeWidth={2} />
      </ActionIconButton>
      <ActionIconButton size="xl" title="Hang Up" onClick={onHangUp}>
        <PhoneOff className="h-6 w-6 text-lyra-status-critical-strong" strokeWidth={2} />
      </ActionIconButton>
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
  onHangUp: () => void;
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
  onHangUp,
}: DockedVoiceControlBarProps) {
  const accent = CHANNEL_ACCENT.voice;
  const displayName = isInternalAgentCall ? customerName ?? "Colleague" : customerName || "Customer";
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
  return (
    <div className="flex justify-center border-t border-lyra-border-subtle bg-lyra-bg-surface-base py-3">
      {/* Same rounded-lyra-lg/border/background as the floating bar's own
       *  outer container (see its className above) — per an explicit
       *  follow-up, the two should read as the same bar in two locations,
       *  not two different designs. The one difference: no `shadow-md`
       *  (in-flow at the bottom of the panel, not floating on top of other
       *  content, so a drop shadow would look out of place until it
       *  actually pops out). */}
      <div className="flex items-center gap-5 rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base px-6 py-3">
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
        <div className="mx-0.5 h-7 w-px bg-lyra-border-subtle" />
        <DockedControlButton title={isOnHold ? "Resume" : "Hold"} selected={isOnHold} tone="red" onClick={onToggleHold}>
          <Pause className={cn("h-6 w-6", isOnHold && "text-lyra-fg-on-primary")} strokeWidth={2} />
        </DockedControlButton>
        <DockedControlButton title={isMuted ? "Unmute" : "Mute"} selected={isMuted} tone="slate" onClick={onToggleMute}>
          {isMuted ? (
            <MicOff className="h-6 w-6 text-lyra-fg-on-primary" strokeWidth={2} />
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
          {/* Slash stays on regardless of state — see the floating bar's
           *  identical button for why. */}
          <MutedAudioLinesIcon strokeWidth={2} className={isMasked ? "text-lyra-fg-on-primary" : undefined} />
        </DockedControlButton>
        <DockedControlButton title={isRecording ? "Stop Recording" : "Record"} selected={isRecording} tone="red" onClick={onToggleRecording}>
          <CircleDot className={cn("h-6 w-6", isRecording && "text-lyra-fg-on-primary")} strokeWidth={2} />
        </DockedControlButton>
        <DockedControlButton title="Keypad">
          <Grip className="h-6 w-6" strokeWidth={2} />
        </DockedControlButton>
        <DockedControlButton title="Hang Up" onClick={onHangUp}>
          <PhoneOff className="h-6 w-6 text-lyra-status-critical-strong" strokeWidth={2} />
        </DockedControlButton>
      </div>
    </div>
  );
}
