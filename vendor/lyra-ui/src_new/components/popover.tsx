import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../lib/utils";
import { PanelHeader } from "./panel-header";

/* ── Types ── */

export type PopoverPlacement = "top" | "bottom" | "left" | "right";

/** Radix's own Content prop types, reused below so the passthrough handlers
 *  can't drift out of sync with the primitive they forward to. */
type PopoverContentProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;

export interface PopoverProps {
  children: React.ReactElement;
  content: React.ReactNode;
  /** Fixed header rendered outside the scroll area, above `content` — e.g. a
   *  custom title bar with a back/close button, or a group picker + search
   *  field that should stay pinned while only the list below it scrolls.
   *  For a plain string title without custom controls, use `title` instead;
   *  this prop is for anything with its own markup/behavior. */
  header?: React.ReactNode;
  /** Fixed footer rendered outside the scroll area */
  footer?: React.ReactNode;
  title?: string;
  placement?: PopoverPlacement;
  /** Alignment relative to the trigger along the placement axis (default: "center") */
  align?: "start" | "center" | "end";
  /** Gap between the trigger and the content, in pixels (default: 10) */
  sideOffset?: number;
  /**
   * Whether Radix may flip `placement` to the opposite side (or nudge
   * `align`) when the content doesn't fit — Radix's own default is `true`.
   * Set to `false` when `placement` is a hard requirement rather than a
   * preference (e.g. a fixed "opens upward" spot next to a toolbar button)
   * — otherwise the same popover can flip sides between renders purely
   * because one tab's content is taller than another's fits differently
   * above/below the trigger, which reads as the popover jumping around
   * rather than a deliberate placement. Same reasoning as
   * `FavoriteButton`'s own `avoidCollisions={false}` on its tooltip — see
   * that component's doc comment. */
  avoidCollisions?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showArrow?: boolean;
  maxHeight?: string;
  maxWidth?: string;
  className?: string;
  /** Passthrough Radix Content event hooks for cases that need more control
   *  than the default behavior — e.g. focusing a specific field on open
   *  instead of the first focusable element, or ignoring outside-clicks on
   *  a portaled submenu rendered outside this popover's own DOM subtree.
   *  Left undefined, Radix's defaults apply exactly as before. */
  onOpenAutoFocus?: PopoverContentProps["onOpenAutoFocus"];
  onCloseAutoFocus?: PopoverContentProps["onCloseAutoFocus"];
  onEscapeKeyDown?: PopoverContentProps["onEscapeKeyDown"];
  onInteractOutside?: PopoverContentProps["onInteractOutside"];
}

/* ── Arrow — CSS rotated square inside Content so it never moves independently ── */
const PopoverArrow = () => (
  <span
    aria-hidden="true"
    className={cn(
      "absolute w-[10px] h-[10px] rotate-45",
      "bg-lyra-bg-surface-overlay",
      "border-lyra-border-subtle",
      // side=bottom → arrow points UP → top edge
      "group-data-[side=bottom]:-top-[5px]",
      "group-data-[side=bottom]:left-1/2",
      "group-data-[side=bottom]:-translate-x-1/2",
      "group-data-[side=bottom]:border-t",
      "group-data-[side=bottom]:border-l",
      // side=top → arrow points DOWN → bottom edge
      "group-data-[side=top]:-bottom-[5px]",
      "group-data-[side=top]:left-1/2",
      "group-data-[side=top]:-translate-x-1/2",
      "group-data-[side=top]:border-b",
      "group-data-[side=top]:border-r",
      // side=right → arrow points LEFT → left edge
      "group-data-[side=right]:-left-[5px]",
      "group-data-[side=right]:top-1/2",
      "group-data-[side=right]:-translate-y-1/2",
      "group-data-[side=right]:border-l",
      "group-data-[side=right]:border-b",
      // side=left → arrow points RIGHT → right edge
      "group-data-[side=left]:-right-[5px]",
      "group-data-[side=left]:top-1/2",
      "group-data-[side=left]:-translate-y-1/2",
      "group-data-[side=left]:border-r",
      "group-data-[side=left]:border-t",
    )}
  />
);

/* ── Component ── */

// React re-dispatches synthetic events up the *React* fiber tree, not the
// DOM tree — a Portal's content still bubbles to its logical React
// ancestors even though it's mounted elsewhere in the DOM (React docs:
// "an event fired from inside a portal will propagate to ancestors in the
// containing React tree"). Popover.Content is rendered through exactly
// such a Portal, so when a Popover is wrapped by a Tooltip from the
// *outside* (the only way Tooltip+Popover can compose — see the
// "Tooltip must wrap Popover from the outside" comments in create-new.tsx
// and agent-profile.tsx), hovering or focusing anything inside the
// popover panel bubbles a pointermove/focus event all the way up to that
// outer Tooltip's trigger. Radix Tooltip's own Trigger opens on
// onPointerMove/onPointerDown/onFocus and closes on onPointerLeave/onBlur
// (see @radix-ui/react-tooltip's Trigger), so without this guard, hovering
// e.g. a menu item inside the popover re-opens (or re-closes) a completely
// unrelated tooltip sitting on the icon button that opened the popover.
// Stopping these at the Content root contains them to this popover's own
// subtree — Radix's own outside-click/focus-trap handling lives on native
// document-level listeners, not React bubbling, so it's unaffected.
// See CONTRIBUTING.md §17.
const stopSyntheticBubble = (e: React.SyntheticEvent) => e.stopPropagation();

const Popover = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Content>, PopoverProps>(({
  children,
  content,
  header,
  footer,
  title,
  placement = "bottom",
  align = "center",
  sideOffset = 10,
  avoidCollisions = true,
  open,
  onOpenChange,
  showArrow = true,
  maxHeight,
  maxWidth,
  className,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onInteractOutside,
}, ref) => (
  <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <PopoverPrimitive.Trigger asChild>{children}</PopoverPrimitive.Trigger>
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        side={placement}
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAutoFocus}
        onEscapeKeyDown={onEscapeKeyDown}
        onInteractOutside={onInteractOutside}
        onPointerMove={stopSyntheticBubble}
        onPointerDown={stopSyntheticBubble}
        onPointerLeave={stopSyntheticBubble}
        onFocus={stopSyntheticBubble}
        onBlur={stopSyntheticBubble}
        style={{
          maxWidth,
          /* overflow:hidden + maxHeight constrains the flex algorithm so children can distribute space */
          ...((header || footer) && maxHeight
            ? { maxHeight, display: "flex", flexDirection: "column", overflow: "hidden" }
            : {}),
        }}
        className={cn(
          "relative group z-50",
          "rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg",
          "animate-in fade-in-0 duration-150",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-100",
          "data-[state=closed]:data-[side=bottom]:slide-out-to-top-1 data-[state=closed]:data-[side=top]:slide-out-to-bottom-1",
          "data-[state=closed]:data-[side=left]:slide-out-to-right-1 data-[state=closed]:data-[side=right]:slide-out-to-left-1",
          className
        )}
      >
        {title && <PanelHeader title={title} bordered={false} />}
        {header && <div style={{ flexShrink: 0 }}>{header}</div>}
        {/* Content scrolls; header/footer are flex-shrink-0 so they stay
            visible. overflow-auto is only applied when maxHeight actually
            constrains the height — otherwise it's dead weight that can
            backfire: a CSS-transform entrance animation on something inside
            (e.g. a slide-in) can register as scrollable overflow and paint a
            horizontal scrollbar even though nothing is meant to scroll here. */}
        <div
          className={maxHeight ? "overflow-auto" : undefined}
          style={
            (header || footer) && maxHeight
              ? { flex: "1 1 auto", minHeight: 0, overflowY: "auto" }
              : maxHeight
              ? { maxHeight }
              : undefined
          }
        >
          {content}
        </div>
        {footer && <div style={{ flexShrink: 0 }}>{footer}</div>}
        {showArrow && <PopoverArrow />}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  </PopoverPrimitive.Root>
));

Popover.displayName = "Popover";

const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = PopoverPrimitive.Content;
const PopoverClose = PopoverPrimitive.Close;

export { Popover, PopoverTrigger, PopoverContent, PopoverClose };
