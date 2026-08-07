import * as React from "react";
import { useState, useEffect } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../lib/utils";

/* ── Types ── */

type TooltipPlacement = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: React.ReactNode;
  placement?: TooltipPlacement;
  delayMs?: number;
  className?: string;
  children: React.ReactElement;
  asLabel?: boolean;
  /** Let Radix flip `placement` to whichever side actually has room
   *  (default: true). Set to `false` when the caller needs a deterministic
   *  side regardless of viewport/container edges — e.g. a short tooltip
   *  that's always meant to open toward a specific side of its trigger. */
  avoidCollisions?: boolean;
  /** Force the tooltip permanently closed (default: false) without
   *  conditionally removing the `<Tooltip>` wrapper from the tree. Useful
   *  when a trigger sometimes doesn't need a tooltip (e.g. it already shows
   *  its own visible label) but must keep the exact same wrapper structure
   *  across that state change — conditionally wrapping vs. not wrapping a
   *  child in `<Tooltip>` changes the JSX tree shape, which forces React to
   *  unmount and remount everything inside it (including a `Popover` and
   *  its own open state), breaking any CSS transition on the trigger and
   *  losing in-progress interaction state. Keep the wrapper, toggle
   *  `disabled` instead. */
  disabled?: boolean;
}

/* ── Arrow — CSS rotated square, seamless with the tooltip container ── */
const TooltipArrow = () => (
  <span
    aria-hidden="true"
    className={cn(
      "absolute w-[10px] h-[10px] rotate-45",
      "bg-lyra-bg-surface-overlay",
      "border-lyra-border-subtle",
      // side=bottom → content below trigger → arrow points UP → top edge of content
      "group-data-[side=bottom]:-top-[5px]",
      "group-data-[side=bottom]:left-1/2",
      "group-data-[side=bottom]:-translate-x-1/2",
      "group-data-[side=bottom]:border-t",
      "group-data-[side=bottom]:border-l",
      // side=top → content above trigger → arrow points DOWN → bottom edge
      "group-data-[side=top]:-bottom-[5px]",
      "group-data-[side=top]:left-1/2",
      "group-data-[side=top]:-translate-x-1/2",
      "group-data-[side=top]:border-b",
      "group-data-[side=top]:border-r",
      // side=right → content right of trigger → arrow points LEFT → left edge
      "group-data-[side=right]:-left-[5px]",
      "group-data-[side=right]:top-1/2",
      "group-data-[side=right]:-translate-y-1/2",
      "group-data-[side=right]:border-l",
      "group-data-[side=right]:border-b",
      // side=left → content left of trigger → arrow points RIGHT → right edge
      "group-data-[side=left]:-right-[5px]",
      "group-data-[side=left]:top-1/2",
      "group-data-[side=left]:-translate-y-1/2",
      "group-data-[side=left]:border-r",
      "group-data-[side=left]:border-t",
    )}
  />
);

/* ── Tooltip ── */

const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = "top",
  delayMs = 200,
  className,
  children,
  asLabel = false,
  avoidCollisions = true,
  disabled = false,
}) => {
  const contentString = typeof content === "string" ? content : undefined;
  const triggerAriaProps: Record<string, unknown> = {};
  if (asLabel && contentString) {
    triggerAriaProps["aria-label"] = contentString;
  }

  // Guard against tooltip firing on mount (e.g. when a modal opens under the cursor —
  // browsers synthesize a pointer event for whatever now sits under a stationary
  // cursor when new DOM appears, which would otherwise pop the tooltip open with no
  // real hover intent). That phantom event fires in the same tick the content mounts,
  // so a short guard is enough to catch it. Keep this short: any Tooltip that lives
  // inside a Popover/Menu remounts (and restarts this guard) every time that content
  // reopens, since Radix unmounts it on close. A long guard here previously raced
  // against completely normal, fast hovering right after opening a menu — e.g. the
  // favorite-star tooltip in AgentProfile's status menu, which only becomes reachable
  // after hovering its row, an interaction that easily happens within a couple hundred
  // ms of the menu opening.
  const [allowOpen, setAllowOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAllowOpen(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <TooltipPrimitive.Provider delayDuration={delayMs} skipDelayDuration={0}>
      <TooltipPrimitive.Root open={disabled || !allowOpen ? false : undefined}>
        <TooltipPrimitive.Trigger asChild {...triggerAriaProps}>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={placement}
            sideOffset={8}
            avoidCollisions={avoidCollisions}
            collisionPadding={8}
            className={cn(
              "relative group z-[10000]",
              "rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-overlay px-3 py-2 shadow-md",
              "lyra-body-md text-lyra-fg-default",
              "animate-in fade-in-0 duration-100",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-75",
              className
            )}
          >
            {content}
            <TooltipArrow />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

Tooltip.displayName = "Tooltip";

export { Tooltip };
export type { TooltipProps, TooltipPlacement };
