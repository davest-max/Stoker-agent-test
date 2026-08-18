import { useEffect, useRef, useState } from "react";
import { ActionIconButton, CHANNEL_ACCENT, Popover, Menu, type MenuEntry } from "@nicecxone/lyra-ui";
import { Headset, Mic, MicOff, Pause, AudioLines, CircleDot, Grip, PhoneOff, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** AudioLines with a diagonal slash — Lucide has no ready "off" variant for
 *  it, so composite one: the base icon plus an overlaid line, drawn
 *  corner-to-corner the same way Lucide's own `-Off` icons (e.g. MicOff)
 *  draw their slash. Same icon InteractionActionsBar's old inline "Mute
 *  Speaker" button used before that whole control set moved here — recreated
 *  locally rather than exported/imported since it's a small, self-contained
 *  composite (same reasoning as `getInitials`'s own doc comment below). */
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
 *  happening" states); Mute/Mute Speaker share a separate dark slate (a
 *  quieter, non-alarming color — muting audio isn't a critical state the way
 *  holding or recording a call is). `hover:`/`active:` are repeated at the
 *  same color so the fill doesn't wash out lighter on hover — this class
 *  wins over `ActionIconButton`'s own `hover:bg-lyra-state-hover` via
 *  `cn`'s tailwind-merge. */
const SELECTED_RED = "bg-lyra-status-critical-strong hover:bg-lyra-status-critical-strong active:bg-lyra-status-critical-strong";
const SELECTED_SLATE = "bg-lyra-accent-slate-strong hover:bg-lyra-accent-slate-strong active:bg-lyra-accent-slate-strong";

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
  /** `Date.now()` at the moment this call became the live call — drives the
   *  bar's own live-ticking duration display. */
  startedAt: number;
  onHangUp: () => void;
  /** Every other switchable voice call (never includes the one this bar is
   *  currently showing) — populates the "switch call" picker below the
   *  name/timer. Empty when there's nothing else to switch to, which just
   *  hides the picker entirely rather than showing a dead affordance. */
  otherVoiceCalls: { assignmentId: string; customerName?: string; isInternalAgentCall?: boolean }[];
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
 *  Anchored bottom-left, near the assignment rail, per an explicit request
 *  — reads as tied to "whichever tile has the live-call badge" (see
 *  lyra-ui's `InteractionNavItem` `liveCall` prop) rather than floating
 *  ambiguously somewhere else on screen.
 *  Full control set (hold, mute, mute speaker, record, keypad, hang up —
 *  same order/icons the old inline InteractionActionsBar row used) — no
 *  click-to-reopen (the agent
 *  finds the call's own tile in the rail like any other interaction, same
 *  as always); this is just enough to keep the call under control while
 *  looking at something else. Only one of these can exist at a time (an
 *  explicit product decision — a second call simply supersedes this one
 *  rather than stacking), so there's no queueing/stacking UI to build here.
 *  Render this with `key={assignmentId}` at the call site — that's what
 *  resets `isMuted`/`isOnHold`/the timer cleanly whenever a *different* call
 *  becomes the live one, without this component needing to watch for that
 *  itself. Draggable anywhere on screen (grab anywhere on the bar except its
 *  own buttons) — see `position`/`onPositionChange` above for why that's
 *  lifted to the parent instead of local state. The name/timer block
 *  doubles as a "switch call" picker whenever `otherVoiceCalls` isn't
 *  empty — lets the agent pick up a different voice call without leaving
 *  whatever they're looking at to go find its tile in the rail. */
export function LiveVoiceCallBar({
  customerName,
  isInternalAgentCall,
  startedAt,
  onHangUp,
  otherVoiceCalls,
  onSwitchCall,
  position,
  onPositionChange,
}: LiveVoiceCallBarProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      style={{ touchAction: "none", ...(position ? { position: "fixed", top: position.top, left: position.left } : undefined) }}
      className={cn(
        // Sized up ~20% overall per an explicit follow-up (container
        // padding/gap, the avatar, both text lines, the divider, and every
        // button/icon below) — the icon buttons themselves switch from
        // ActionIconButton's "default" (36px) to its "xl" (44px) variant,
        // the closest built-in size step to +20% (+22%), rather than a
        // one-off arbitrary size on a shared lyra-ui component.
        "z-[9998] flex select-none items-center gap-3 rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base px-3.5 py-2.5 shadow-md",
        !position && "fixed bottom-4 left-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      role="region"
      aria-label={`Live call with ${displayName}, ${formatElapsed(elapsedSeconds)} elapsed`}
    >
      <span
        className={cn("flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full lyra-body-md-emphasis", accent.bg, accent.text)}
        aria-hidden="true"
      >
        {isInternalAgentCall ? <Headset className="h-[19px] w-[19px]" strokeWidth={1.5} /> : getInitials(customerName)}
      </span>
      {otherVoiceCalls.length > 0 ? (
        <Popover
          open={switcherOpen}
          onOpenChange={setSwitcherOpen}
          placement="top"
          align="start"
          content={
            <Menu
              aria-label="Switch voice call"
              className="min-w-[200px]"
              items={otherVoiceCalls.map(
                (call): MenuEntry => ({
                  id: call.assignmentId,
                  label: call.isInternalAgentCall ? `${call.customerName ?? "Colleague"} (internal)` : call.customerName || "Customer",
                  onClick: () => {
                    onSwitchCall(call.assignmentId);
                    setSwitcherOpen(false);
                  },
                })
              )}
            />
          }
        >
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={switcherOpen}
            className="flex min-w-0 max-w-[168px] items-center gap-1 rounded-lyra-sm text-left hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
          >
            <span className="min-w-0 flex-1">
              <p className="truncate lyra-body-md-emphasis text-lyra-fg-default">{displayName}</p>
              <p className="lyra-body-sm text-lyra-fg-secondary">{formatElapsed(elapsedSeconds)}</p>
            </span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 text-lyra-fg-secondary transition-transform", switcherOpen && "rotate-180")}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </Popover>
      ) : (
        <div className="min-w-0 max-w-[168px]">
          <p className="truncate lyra-body-md-emphasis text-lyra-fg-default">{displayName}</p>
          <p className="lyra-body-sm text-lyra-fg-secondary">{formatElapsed(elapsedSeconds)}</p>
        </div>
      )}
      <div className="mx-0.5 h-7 w-px bg-lyra-border-subtle" />
      <ActionIconButton
        size="xl"
        title={isOnHold ? "Resume" : "Hold"}
        aria-pressed={isOnHold}
        onClick={() => setIsOnHold((v) => !v)}
        className={cn(isOnHold && SELECTED_RED)}
      >
        <Pause className={cn("h-6 w-6", isOnHold && "text-lyra-fg-on-primary")} strokeWidth={2} />
      </ActionIconButton>
      <ActionIconButton
        size="xl"
        title={isMuted ? "Unmute" : "Mute"}
        aria-pressed={isMuted}
        onClick={() => setIsMuted((v) => !v)}
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
        title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
        aria-pressed={isSpeakerMuted}
        onClick={() => setIsSpeakerMuted((v) => !v)}
        className={cn(isSpeakerMuted && SELECTED_SLATE)}
      >
        {isSpeakerMuted ? (
          <MutedAudioLinesIcon strokeWidth={2} className="text-lyra-fg-on-primary" />
        ) : (
          <AudioLines className="h-6 w-6" strokeWidth={2} />
        )}
      </ActionIconButton>
      <ActionIconButton
        size="xl"
        title={isRecording ? "Stop Recording" : "Record"}
        aria-pressed={isRecording}
        onClick={() => setIsRecording((v) => !v)}
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
