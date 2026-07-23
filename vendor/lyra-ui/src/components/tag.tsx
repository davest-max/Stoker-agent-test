import * as React from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";

/* ── Types ── */

export type TagVariant = "default" | "success" | "warning" | "critical" | "info" | "neutral";
export type TagSize = "sm";

export type TagShape = "default" | "pill";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Tag label */
  label: string;
  /** Visual variant */
  variant?: TagVariant;
  /** Shape — "default" uses rounded-xs corners, "pill" uses 50px border-radius */
  shape?: TagShape;
  /** Show a remove button — calls onRemove when clicked */
  onRemove?: () => void;
  /** Accessible label for the remove button (default: "Remove {label}") */
  removeLabel?: string;
  /** Disable the tag and remove button */
  disabled?: boolean;
}

/* ── CVA definitions ── */

const tagVariants = cva(
  "inline-flex items-center border transition-colors px-1.5 py-0.5 lyra-body-sm gap-0.5",
  {
    variants: {
      /* Note: border colors use a CSS color-mix() Tailwind arbitrary value
         rather than Tailwind's built-in slash opacity-modifier syntax (e.g.
         border-lyra-border-active at 30 percent). Tailwind can only generate
         opacity-modified utilities for theme colors defined as raw RGB/HSL
         channel triples; our design tokens are CSS custom properties holding
         full hex/rgba strings (see lyra-tokens.css), so a slash-opacity
         modifier on them silently produces no matching CSS rule at all and
         the border falls back to Tailwind's Preflight default (#e5e7eb gray)
         — which is why Tags previously rendered with a washed-out gray border
         instead of a tinted one. color-mix() works with any color value and
         has broad modern browser support. */
      variant: {
        default:  "bg-lyra-bg-active-subtle text-lyra-fg-active-strong border-[color-mix(in_srgb,var(--lyra-color-border-active)_30%,transparent)]",
        success:  "bg-lyra-status-success-subtle text-lyra-status-success-strong border-[color-mix(in_srgb,var(--lyra-color-status-success-strong)_30%,transparent)]",
        warning:  "bg-lyra-status-warning-subtle text-lyra-status-warning-strong border-[color-mix(in_srgb,var(--lyra-color-status-warning-strong)_30%,transparent)]",
        critical: "bg-lyra-status-critical-subtle text-lyra-status-critical-strong border-[color-mix(in_srgb,var(--lyra-color-status-critical-strong)_30%,transparent)]",
        info:     "bg-lyra-status-info-subtle text-lyra-status-info-strong border-[color-mix(in_srgb,var(--lyra-color-status-info-strong)_30%,transparent)]",
        neutral:  "bg-lyra-bg-surface-canvas text-lyra-fg-secondary border-lyra-border-subtle",
      },
      shape: {
        default: "rounded-lyra-xs",
        pill:    "rounded-[50px]",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "default",
    },
  }
);

const tagRemoveHoverVariants = cva("", {
  variants: {
    variant: {
      default:  "hover:bg-lyra-state-hover-active-subtle",
      success:  "hover:bg-lyra-status-success-subtle",
      warning:  "hover:bg-lyra-status-warning-subtle",
      critical: "hover:bg-lyra-state-hover-critical-subtle",
      info:     "hover:bg-lyra-status-info-subtle",
      neutral:  "hover:bg-lyra-state-hover",
    },
  },
  defaultVariants: { variant: "default" },
});

/* ── Component ── */

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      label,
      variant = "default",
      shape = "default",
      onRemove,
      removeLabel,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
      return (
      <span
        ref={ref}
        className={cn(
          tagVariants({ variant, shape, className }),
          disabled && "bg-lyra-bg-disabled text-lyra-fg-disabled border-lyra-border-disabled opacity-60"
        )}
        {...props}
      >
        <span className="truncate max-w-[200px]">{label}</span>

        {onRemove && !disabled && (
          <Tooltip content={removeLabel ?? `Remove ${label}`} placement="top" delayMs={400}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              aria-label={removeLabel ?? `Remove ${label}`}
              className={cn(
                "rounded-full flex-shrink-0 transition-colors",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lyra-border-focus",
                tagRemoveHoverVariants({ variant })
              )}
            >
              <X className={cn("h-3 w-3", "block")} strokeWidth={2} aria-hidden="true" />
            </button>
          </Tooltip>
        )}
      </span>
    );
  }
);

Tag.displayName = "Tag";

export { Tag, tagVariants };
