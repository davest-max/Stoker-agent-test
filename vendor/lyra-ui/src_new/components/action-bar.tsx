import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { InfoIcon } from "./icons/info-icon";
import { WarningIcon } from "./icons/warning-icon";
import { ErrorIcon } from "./icons/error-icon";

/* ── Variants ── */

const barVariants = cva(
  "flex w-full items-center gap-4 px-4 py-3 border-b",
  {
    variants: {
      variant: {
        info:    "bg-lyra-bg-active-subtle border-lyra-bg-active-moderate",
        warning: "bg-lyra-status-warning-subtle border-lyra-status-warning-strong/40",
        error:   "bg-lyra-status-critical-subtle border-lyra-status-critical-strong/40",
      },
    },
    defaultVariants: { variant: "info" },
  }
);

const iconVariants = cva("h-5 w-5 shrink-0", {
  variants: {
    variant: {
      info:    "text-lyra-bg-primary",
      warning: "text-lyra-status-warning-strong",
      error:   "text-lyra-status-critical-strong",
    },
  },
  defaultVariants: { variant: "info" },
});

const titleVariants = cva("lyra-body-md-emphasis", {
  variants: {
    variant: {
      info:    "text-lyra-fg-default",
      warning: "text-lyra-status-warning-strong",
      error:   "text-lyra-status-critical-strong",
    },
  },
  defaultVariants: { variant: "info" },
});

/* ── Types ── */

export interface ActionBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof barVariants> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/* ── Icon map ── */

const IconMap: Record<string, React.FC<{ className?: string }>> = {
  info:    (p) => <InfoIcon  {...p} />,
  warning: (p) => <WarningIcon {...p} />,
  error:   (p) => <ErrorIcon {...p} />,
};

/* ── Component ── */

const ActionBar = React.forwardRef<HTMLDivElement, ActionBarProps>(
  ({ className, variant = "info", title, description, actions, ...props }, ref) => {
    const Icon = IconMap[variant ?? "info"];
    return (
      <div
        ref={ref}
        className={cn(barVariants({ variant }), className)}
        role="status"
        aria-live="polite"
        {...props}
      >
        {/* Icon */}
        <Icon className={iconVariants({ variant })} />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={titleVariants({ variant })}>{title}</p>
          {description && (
            <p className="lyra-body-sm text-lyra-fg-secondary mt-0.5">{description}</p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    );
  }
);
ActionBar.displayName = "ActionBar";

export { ActionBar };
