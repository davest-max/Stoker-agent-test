import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const overlayVariants = cva(
  // Base: fixed inset, z-index, fade-in animation
  "fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  {
    variants: {
      variant: {
        dark:  "bg-lyra-bg-surface-backdrop",
        light: "bg-white/70 backdrop-blur-sm",
      },
    },
    defaultVariants: { variant: "dark" },
  }
);

/* ─────────────────────────────────────────────
   Standalone overlay (no Dialog context needed)
   Renders into a portal via DialogPrimitive.Portal
───────────────────────────────────────────── */

export interface OverlayProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>,
    VariantProps<typeof overlayVariants> {
  open?: boolean;
  onClose?: () => void;
  /**
   * Close the modal when the backdrop is clicked.
   * Default: false — clicking the backdrop does nothing (modal stays open).
   */
  closeOnBackdropClick?: boolean;
  /** Portal container — defaults to document.body */
  container?: HTMLElement | null;
}

/**
 * Overlay — a full-screen backdrop for modals, drawers, or any layered UI.
 *
 * Wraps Radix Dialog.Overlay so you get accessible open/close state,
 * keyboard dismiss (Escape), and portal rendering out of the box.
 *
 * Variants:
 *   dark  — semi-transparent black (default)
 *   light — frosted white with backdrop blur
 *
 * Props:
 *   closeOnBackdropClick — when true, clicking the backdrop dismisses the modal.
 */
const Overlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  OverlayProps
>(({ className, variant, open = false, onClose, closeOnBackdropClick = false, container, children, ...props }, ref) => (
  <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose?.(); }}>
    {/* Hidden trigger required by Radix internals — visually absent */}
    <DialogPrimitive.Trigger asChild>
      <span aria-hidden="true" className="sr-only" />
    </DialogPrimitive.Trigger>

    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay
        ref={ref}
        className={cn(overlayVariants({ variant }), className)}
        {...props}
      />
      {children && (
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          aria-describedby={undefined}
          // Prevent Radix from closing on outside interaction — we handle it manually below
          onInteractOutside={(e) => e.preventDefault()}
          // Allow Escape to always dismiss
          onEscapeKeyDown={(e) => { if (!closeOnBackdropClick) e.preventDefault(); }}
          onClick={(e) => {
            // Close only when clicking the backdrop area (the Content wrapper itself),
            // not when clicking inside the modal content
            if (closeOnBackdropClick && e.target === e.currentTarget) onClose?.();
          }}
        >
          <DialogPrimitive.Title className="sr-only">Overlay</DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      )}
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
));
Overlay.displayName = "Overlay";

/* ─────────────────────────────────────────────
   Bare overlay div (no portal / no Radix state)
   Useful when you manage open state yourself and
   already have a stacking context.
───────────────────────────────────────────── */

export interface OverlayBackdropProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof overlayVariants> {}

const OverlayBackdrop = React.forwardRef<HTMLDivElement, OverlayBackdropProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-40",
        variant === "light" ? "bg-white/70 backdrop-blur-sm" : "bg-lyra-bg-surface-backdrop",
        className
      )}
      {...props}
    />
  )
);
OverlayBackdrop.displayName = "OverlayBackdrop";

export { Overlay, OverlayBackdrop, overlayVariants };
