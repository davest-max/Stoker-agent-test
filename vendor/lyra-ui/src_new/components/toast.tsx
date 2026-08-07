import * as React from "react";
import { useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import { X } from "lucide-react";
import { Tooltip } from "./tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { WarningIcon } from "./icons/warning-icon";
import { ErrorIcon } from "./icons/error-icon";
import { InfoIcon } from "./icons/info-icon";
import { SuccessIcon } from "./icons/success-icon";

/* ── Variants ── */

const toastVariants = cva(
  "flex min-h-[48px] w-[380px] items-start gap-3 rounded-lyra-lg border bg-lyra-bg-surface-overlay px-4 py-3 shadow-lg",
  {
    variants: {
      variant: {
        warning:
          "border-lyra-status-warning-strong bg-lyra-status-warning-subtle",
        error:
          "border-lyra-status-critical-strong bg-lyra-status-critical-subtle",
        info: "border-lyra-status-info-strong bg-lyra-status-info-subtle",
        success:
          "border-lyra-status-success-strong bg-lyra-status-success-subtle",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const titleColorMap = {
  warning: "text-lyra-status-warning-strong",
  error: "text-lyra-status-critical-strong",
  info: "text-lyra-status-info-strong",
  success: "text-lyra-status-success-strong",
} as const;

const iconMap = {
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
  success: SuccessIcon,
} as const;

/* ── Animation duration ── */

const ANIMATION_MS = 200;

/* ── Toast Item ── */

type ToastVariant = "warning" | "error" | "info" | "success";

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariant;
  /** Bold title text */
  title?: string;
  /** Called when the dismiss button is clicked */
  onDismiss?: () => void;
  /** Auto-dismiss after this many ms (0 = no auto-dismiss) */
  duration?: number;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      className,
      variant = "info",
      title,
      onDismiss,
      duration = 0,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const Icon = iconMap[variant];
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);

    // Slide in after mount
    useLayoutEffect(() => {
      // Force a frame so the initial transform is painted first
      const raf = requestAnimationFrame(() => {
        setVisible(true);
      });
      return () => cancelAnimationFrame(raf);
    }, []);

    // Auto-dismiss timer
    useEffect(() => {
      if (duration > 0 && onDismiss) {
        timerRef.current = setTimeout(() => handleDismiss(), duration);
        return () => clearTimeout(timerRef.current);
      }
    }, [duration, onDismiss]);

    const handleDismiss = useCallback(() => {
      setExiting(true);
      setTimeout(() => {
        onDismiss?.();
      }, ANIMATION_MS);
    }, [onDismiss]);

    const animationStyle: React.CSSProperties = {
      transition: `transform ${ANIMATION_MS}ms ease-out, opacity ${ANIMATION_MS}ms ease-out`,
      transform: visible && !exiting ? "translateX(0)" : "translateX(calc(100% + 16px))",
      opacity: visible && !exiting ? 1 : 0,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        role="alert"
        style={animationStyle}
        {...props}
      >
        <span className="flex-shrink-0 pt-0.5" aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          {title && (
            <p
              className={cn(
                "lyra-body-md-emphasis",
                titleColorMap[variant]
              )}
            >
              {title}
            </p>
          )}
          {children && (
            <p className="lyra-body-md text-lyra-fg-default mt-0.5">
              {children}
            </p>
          )}
        </div>
        {onDismiss && (
          <Tooltip content="Dismiss notification" placement="left" asLabel>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-lyra-xs text-lyra-fg-secondary transition-colors hover:text-lyra-fg-default"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </Tooltip>
        )}
      </div>
    );
  }
);
Toast.displayName = "Toast";

/* ── Toast Container (bottom-right positioning) ── */

interface ToastContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

const ToastContainer = React.forwardRef<HTMLDivElement, ToastContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      aria-live="polite"
      aria-relevant="additions removals"
      className={cn(
        "fixed bottom-4 right-4 z-50 flex flex-col gap-3 overflow-hidden",
        className
      )}
      style={{ pointerEvents: "none" }}
      {...props}
    >
      <div style={{ pointerEvents: "auto" }} className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  )
);
ToastContainer.displayName = "ToastContainer";

/* ── useToast hook ── */

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message?: string;
  duration?: number;
}

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      return id;
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}

export { Toast, ToastContainer, useToast, toastVariants };
export type { ToastProps, ToastVariant, ToastItem };
