import * as React from "react";
import { Pin } from "lucide-react";
import { Tooltip } from "./tooltip";
import { cn } from "../lib/utils";

/* ── PanelPinButton ──
   Pin/unpin trigger, extracted out of `panel.tsx` (where it was first built,
   for the side variant's own header) into its own atom so any other spot
   that needs to drive the exact same pinned/open state — same button size,
   Tooltip, focus ring — can reuse it instead of hand-rolling a parallel
   `<button>` with its own click/keyboard/aria wiring. Same extraction
   rationale as `KebabMenuButton`.

   `icon` defaults to the `Pin` glyph, which rotates 45° when pinned (as if
   being stuck in) — that animation is specific to the pin metaphor, so it's
   only applied to the default glyph. Pass a different icon entirely (e.g.
   agent-next-gen-v1's Designer-panel trigger uses `User`, since it sits on
   the interaction record header rather than inside the panel itself) and
   the button shows a selected/pressed background instead — tilting an
   arbitrary glyph 45° doesn't read as "pinned" the way it does for an
   actual pin, so a plain selected-state treatment (same idiom as `LeftNav`'s
   active item) communicates "currently open" without the visual mismatch. */

export interface PanelPinButtonProps {
  /** Whether the target panel is currently pinned open */
  pinned: boolean;
  /** Called when the button is clicked */
  onToggle: () => void;
  /** Icon glyph — defaults to lucide's `Pin` */
  icon?: React.ReactNode;
  /** Tooltip/aria-label text when pinned (default: "Unpin panel") */
  pinnedLabel?: string;
  /** Tooltip/aria-label text when unpinned (default: "Pin panel") */
  unpinnedLabel?: string;
  className?: string;
}

const PanelPinButton = React.forwardRef<HTMLButtonElement, PanelPinButtonProps>(
  ({ pinned, onToggle, icon, pinnedLabel = "Unpin panel", unpinnedLabel = "Pin panel", className }, ref) => {
    const label = pinned ? pinnedLabel : unpinnedLabel;
    return (
      <Tooltip content={label} placement="bottom" asLabel>
        <button
          ref={ref}
          type="button"
          onClick={onToggle}
          aria-label={label}
          aria-pressed={pinned}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lyra-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
            icon && pinned
              ? "bg-lyra-bg-active-moderate text-lyra-fg-active-strong hover:bg-lyra-bg-active-moderate"
              : "text-lyra-fg-secondary hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
            className
          )}
        >
          {icon ?? <Pin className={cn("h-4 w-4", pinned && "rotate-45")} strokeWidth={1.5} aria-hidden="true" />}
        </button>
      </Tooltip>
    );
  }
);
PanelPinButton.displayName = "PanelPinButton";

export { PanelPinButton };
