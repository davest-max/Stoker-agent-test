import * as React from "react";
import { cn } from "../lib/utils";

/* ── Types ── */

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Leading icon or avatar */
  leading?: React.ReactNode;
  /** Primary/title text */
  title: React.ReactNode;
  /** Secondary/subtitle text */
  subtitle?: React.ReactNode;
  /** Tertiary/meta text (e.g. timestamp) */
  meta?: React.ReactNode;
  /** Trailing element (e.g. badge, button, chevron) */
  trailing?: React.ReactNode;
  /** Show a bottom divider */
  divider?: boolean;
  /** Disable hover state */
  static?: boolean;
}

/* ── Component ── */

const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  ({
    leading,
    title,
    subtitle,
    meta,
    trailing,
    divider = true,
    static: isStatic = false,
    className,
    ...props
  }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-start gap-3 px-4 py-3",
        !isStatic && "cursor-pointer transition-colors hover:bg-lyra-state-hover",
        divider && "border-b border-lyra-border-subtle last:border-0",
        className
      )}
      {...props}
    >
      {/* Leading */}
      {leading && (
        <div className="shrink-0 mt-0.5">{leading}</div>
      )}

      {/* Text stack */}
      <div className="flex-1 min-w-0">
        <p className="lyra-body-md-emphasis text-lyra-fg-default truncate">{title}</p>
        {subtitle && (
          <p className="lyra-body-md text-lyra-fg-default truncate mt-0.5">{subtitle}</p>
        )}
        {meta && (
          <p className="lyra-body-sm text-lyra-fg-secondary mt-0.5">{meta}</p>
        )}
      </div>

      {/* Trailing */}
      {trailing && (
        <div className="shrink-0 ml-2 mt-0.5">{trailing}</div>
      )}
    </div>
  )
);
ListItem.displayName = "ListItem";

export { ListItem };
