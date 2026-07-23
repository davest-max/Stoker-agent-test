import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/* ── Track ── */
const trackVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-lyra-border-subtle",
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: { size: "md" },
  }
);

/* ── Indicator ── */
const indicatorVariants = cva(
  "h-full w-full flex-1 rounded-full transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default:  "bg-lyra-bg-active-strong",
        success:  "bg-lyra-status-success-strong",
        warning:  "bg-lyra-status-warning-strong",
        critical: "bg-lyra-status-critical-strong",
        neutral:  "bg-lyra-fg-secondary",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof trackVariants>,
    VariantProps<typeof indicatorVariants> {
  /** 0–100 */
  value?: number;
  /** Show percentage label to the right of the track */
  showLabel?: boolean;
  /** Override the label text (defaults to "{value}%") */
  label?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, size, variant, showLabel, label, ...props }, ref) => (
  <div className="flex flex-col gap-1 w-full">
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      max={100}
      className={cn(trackVariants({ size }), "w-full", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={indicatorVariants({ variant })}
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
      />
    </ProgressPrimitive.Root>

    {showLabel && (
      <span className="lyra-body-sm text-lyra-fg-secondary tabular-nums">
        {label ?? `${Math.round(value)}%`}
      </span>
    )}
  </div>
));
Progress.displayName = "Progress";

export { Progress };
