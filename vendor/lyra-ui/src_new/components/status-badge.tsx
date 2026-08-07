import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/* ─────────────────────────────────────────────
   Variants
───────────────────────────────────────────── */

const badgeVariants = cva(
  // Base: inline-flex, centered content, font
  "inline-flex items-center justify-center font-medium leading-none select-none shrink-0",
  {
    variants: {
      /** Color */
      variant: {
        default:  "bg-lyra-bg-primary text-lyra-fg-on-primary",
        info:     "bg-lyra-bg-active-strong text-lyra-fg-on-primary",
        success:  "bg-lyra-status-success-strong text-white",
        warning:  "bg-lyra-status-warning-strong text-white",
        critical: "bg-lyra-status-critical-strong text-white",
        neutral:  "bg-lyra-fg-secondary text-white",
      },
      /** Size — controls diameter and text size */
      size: {
        sm: "text-[10px] min-w-[16px] h-[16px] px-1 rounded-full",
        md: "text-[11px] min-w-[20px] h-[20px] px-1.5 rounded-full",
        lg: "text-[12px] min-w-[24px] h-[24px] px-2 rounded-full",
      },
      /** Dot — no text, fixed circle */
      dot: {
        true:  "",
        false: "",
      },
    },
    compoundVariants: [
      // Dot overrides: fixed square → circle, no padding
      { dot: true, size: "sm", className: "w-2 h-2 min-w-0 p-0 rounded-full" },
      { dot: true, size: "md", className: "w-3 h-3 min-w-0 p-0 rounded-full" },
      { dot: true, size: "lg", className: "w-4 h-4 min-w-0 p-0 rounded-full" },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      dot: false,
    },
  }
);

/* ─────────────────────────────────────────────
   Props
───────────────────────────────────────────── */

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Numeric value to display. Numbers > `max` show as "{max}+".
   * Omit (or combine with `dot`) to render a plain badge / dot.
   */
  count?: number;
  /** Cap value before showing "+". Default 99. */
  max?: number;
  /**
   * Render as a plain dot with no text.
   * If both `dot` and `count` are provided, `dot` wins.
   */
  dot?: boolean;
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, size, dot = false, count, max = 99, children, ...props }, ref) => {
    let label: React.ReactNode = children;

    if (!dot) {
      if (count !== undefined) {
        label = count > max ? `${max}+` : String(count);
      }
    }

    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, dot }), className)}
        aria-label={dot ? undefined : (count !== undefined ? `${count > max ? `${max}+` : count} notifications` : undefined)}
        {...props}
      >
        {!dot && label}
      </span>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge, badgeVariants };
