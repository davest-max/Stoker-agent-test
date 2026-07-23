import * as React from "react";
import { cn } from "../lib/utils";

/* ── Types ── */

export type DividerOrientation = "horizontal" | "vertical";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Layout direction of the divider line.
   * "horizontal" spans the full width of its parent (use inside a block/flex-column layout).
   * "vertical" spans the full height of its parent (use inside a flex-row layout with a defined height).
   */
  orientation?: DividerOrientation;
}

/* ── Component ── */

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cn(
        orientation === "horizontal"
          ? "w-full shrink-0 border-t border-lyra-border-subtle"
          : "h-full shrink-0 border-l border-lyra-border-subtle",
        className
      )}
      {...props}
    />
  )
);
Divider.displayName = "Divider";

export { Divider };
