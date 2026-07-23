import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "../lib/utils";
import { Tooltip, type TooltipPlacement } from "./tooltip";

/* ── FavoriteButton ──
   Extracted out of CreateNew's contact rows (and now also used by
   AgentProfile's status-favoriting) into its own atom so any list row can
   drop in the same favorite toggle instead of re-deriving it. A
   bidirectional toggle — "Add to Favorites" when not favorited, "Remove
   from Favorites" once it is — the consumer owns the actual favorited-ids
   state and just flips it in `onClick`. The tooltip text itself stays
   generic (no name) since `label` can be arbitrarily long; the name goes
   into `aria-label` instead, so screen readers still get a per-row
   distinct accessible name.

   Visibility: hidden until the row it lives in is hovered/focused, except
   once favorited it stays visible so the favorited state itself is always
   legible without hovering.

   Two things the consumer must line up, both driven by *where* this sits:

   1. `hoverGroup` — which named Tailwind group the hover-reveal keys off
      of. Default "row" matches `group/row` (see ContactRow in
      create-new.tsx). Pass "item" when embedding this as a Menu item's
      `rightElement`, since Menu's own item root carries `group/item` (see
      menu.tsx) — see AgentProfile's status menu for the reference usage.

   2. `as` — "button" (default) renders a real `<button>`. Pass "span" when
      this sits inside another interactive control that's already a real
      `<button>` — e.g. a Menu item, whose root element is itself a
      `<button>` (see menu.tsx). Nesting a `<button>` inside a `<button>` is
      invalid HTML with unreliable click bubbling across browsers; "span"
      renders `role="button"` with the same click/keyboard behavior instead.
      This is the same class of fix as ContactRow's `<div role="button">`
      root in create-new.tsx — see CONTRIBUTING.md §3/§17. */

export interface FavoriteButtonProps {
  /** Whether this item is currently favorited. */
  favorited: boolean;
  /** Toggle handler — fired on every click regardless of current state;
   *  the consumer decides whether that means add or remove. */
  onClick: () => void;
  /** Name of the thing being favorited, e.g. a contact's name or a status
   *  label — used to build a distinct aria-label ("Add {label} to
   *  Favorites"). Not shown in the visible tooltip (see above). */
  label: string;
  /** Tooltip placement (default: "left" — this button is typically the
   *  trailing icon in a list row sitting inside a popover panel, so
   *  opening back toward the row's own content reads better than opening
   *  further right off the edge of a narrow panel; see CONTRIBUTING.md
   *  §16/§17). Passed through with `avoidCollisions={false}`, so this is
   *  a hard placement rather than a preference — Radix's viewport-edge
   *  flip is meant for tooltips near a real screen edge, but this atom
   *  always renders inside a row that itself sits inside a panel with
   *  margin, so letting Radix flip it (which it will do aggressively in
   *  tight containers, e.g. a narrow Storybook canvas) produces an
   *  inconsistent, confusing result instead of a better one. */
  placement?: TooltipPlacement;
  className?: string;
  /** Root element to render — see class-doc comment above. Default "button". */
  as?: "button" | "span";
  /** Named hover group this keys off of — see class-doc comment above. Default "row". */
  hoverGroup?: "row" | "item";
  /** Extra className for the tooltip content itself (not the button/span
   *  root — use `className` for that). Mainly for bumping the tooltip's
   *  z-index above whatever panel this sits inside — Tooltip defaults to
   *  z-[10000], which can render behind a higher-stacked host panel (e.g.
   *  AgentProfile's status menu, itself z-[10001]); see CONTRIBUTING.md §5. */
  tooltipClassName?: string;
}

const FavoriteButton = React.forwardRef<HTMLButtonElement | HTMLSpanElement, FavoriteButtonProps>(
  ({ favorited, onClick, label, placement = "left", className, as = "button", hoverGroup = "row", tooltipClassName }, ref) => {
    const tooltipText = favorited ? "Remove from Favorites" : "Add to Favorites";
    const ariaLabel = favorited ? `Remove ${label} from Favorites` : `Add ${label} to Favorites`;

    const rootClassName = cn(
      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lyra-sm transition-colors",
      "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
      favorited
        ? "opacity-100"
        : hoverGroup === "item"
          ? "opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100"
          : "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100",
      className
    );

    const icon = (
      <Star
        className={cn(
          "h-4 w-4",
          favorited ? "fill-lyra-fg-default text-lyra-fg-default" : "text-lyra-fg-secondary"
        )}
        strokeWidth={1.5}
        aria-hidden="true"
      />
    );

    // Rows/menu items this button sits inside typically have their own
    // onClick (e.g. "open this contact", "select this status") — the star
    // is a distinct action nested inside that clickable area, not a step
    // in that flow.
    const handleClick = (e: React.SyntheticEvent) => {
      e.stopPropagation();
      onClick();
    };

    return (
      <Tooltip content={tooltipText} placement={placement} avoidCollisions={false} className={tooltipClassName}>
        {as === "span" ? (
          <span
            ref={ref as React.Ref<HTMLSpanElement>}
            role="button"
            tabIndex={0}
            aria-pressed={favorited}
            aria-label={ariaLabel}
            onClick={handleClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onClick();
              }
            }}
            className={rootClassName}
          >
            {icon}
          </span>
        ) : (
          <button
            ref={ref as React.Ref<HTMLButtonElement>}
            type="button"
            aria-pressed={favorited}
            aria-label={ariaLabel}
            onClick={handleClick}
            className={rootClassName}
          >
            {icon}
          </button>
        )}
      </Tooltip>
    );
  }
);
FavoriteButton.displayName = "FavoriteButton";

export { FavoriteButton };
