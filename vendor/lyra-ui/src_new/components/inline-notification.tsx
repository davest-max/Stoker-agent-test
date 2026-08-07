import * as React from "react";
import { X } from "lucide-react";
import { Tooltip } from "./tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { WarningIcon } from "./icons/warning-icon";
import { ErrorIcon } from "./icons/error-icon";
import { InfoIcon } from "./icons/info-icon";
import { SuccessIcon } from "./icons/success-icon";

/* ── Variants ── */

const notificationVariants = cva(
  "flex min-h-[48px] items-start gap-3 rounded-lyra-md px-4 py-3",
  {
    variants: {
      variant: {
        warning: "bg-lyra-status-warning-subtle",
        error: "bg-lyra-status-critical-subtle",
        info: "bg-lyra-status-info-subtle",
        success: "bg-lyra-status-success-subtle",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const iconMap = {
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
  success: SuccessIcon,
} as const;

/* ── Component ── */

interface InlineNotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  /** Called when the dismiss button is clicked */
  onDismiss?: () => void;
}

const InlineNotification = React.forwardRef<
  HTMLDivElement,
  InlineNotificationProps
>(({ className, variant = "info", onDismiss, children, ...props }, ref) => {
  const Icon = iconMap[variant!];

  return (
    <div
      ref={ref}
      className={cn(notificationVariants({ variant }), className)}
      role="alert"
      {...props}
    >
      <span className="flex-shrink-0 pt-0.5" aria-hidden="true">
        <Icon className="h-5 w-5" />
      </span>
      <p className="flex-1 lyra-body-md text-lyra-fg-default">{children}</p>
      {onDismiss && (
        <Tooltip content="Dismiss alert" placement="left" asLabel>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-lyra-xs text-lyra-fg-secondary transition-colors hover:text-lyra-fg-default"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </Tooltip>
      )}
    </div>
  );
});
InlineNotification.displayName = "InlineNotification";

export { InlineNotification, notificationVariants };
export type { InlineNotificationProps };
