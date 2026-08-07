import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";

/* ── Types ── */

export type IconSize = "sm" | "md" | "lg";
export type IconColor =
  | "default"
  | "secondary"
  | "action"
  | "disabled"
  | "inverse"
  | "on-primary"
  | "active-strong"
  | "active-subtle"
  | "status-success"
  | "status-warning"
  | "status-critical"
  | "status-info"
  | "inherit";

export type IconBackground =
  | "none"
  | "primary"
  | "active"
  | "success"
  | "warning"
  | "critical"
  | "info"
  | "neutral"
  | "surface";

export type IconShape = "none" | "rounded" | "circle";

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  color?: IconColor;
  /** Background fill behind the icon */
  background?: IconBackground;
  /** Container shape when a background is set */
  shape?: IconShape;
  className?: string;
  decorative?: boolean;
  label?: string;
  tooltip?: boolean;
}

/* ── CVA definitions ── */

const iconVariants = cva("", {
  variants: {
    size: {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    },
    color: {
      default:          "text-lyra-fg-default",
      secondary:        "text-lyra-fg-secondary",
      action:           "text-lyra-fg-action",
      disabled:         "text-lyra-fg-disabled",
      inverse:          "text-lyra-fg-inverse",
      "on-primary":     "text-lyra-fg-on-primary",
      "active-strong":  "text-lyra-fg-active-strong",
      "active-subtle":  "text-lyra-fg-active-subtle",
      "status-success": "text-lyra-status-success-strong",
      "status-warning": "text-lyra-status-warning-strong",
      "status-critical":"text-lyra-status-critical-strong",
      "status-info":    "text-lyra-status-info-strong",
      inherit:          "text-current",
    },
  },
  defaultVariants: {
    size: "md",
    color: "inherit",
  },
});

const iconContainerVariants = cva(
  "inline-flex items-center justify-center shrink-0",
  {
    variants: {
      size: {
        sm: "h-7 w-7",
        md: "h-9 w-9",
        lg: "h-11 w-11",
      },
      background: {
        none:     "",
        primary:  "bg-lyra-bg-primary text-lyra-fg-on-primary",
        active:   "bg-lyra-bg-active-subtle text-lyra-fg-active-strong",
        success:  "bg-lyra-status-success-subtle text-lyra-status-success-strong",
        warning:  "bg-lyra-status-warning-subtle text-lyra-status-warning-strong",
        critical: "bg-lyra-status-critical-subtle text-lyra-status-critical-strong",
        info:     "bg-lyra-accent-purple-soft text-lyra-accent-purple-strong",
        neutral:  "bg-lyra-bg-surface-container-subtle text-lyra-fg-secondary",
        surface:  "bg-lyra-bg-surface-base border border-lyra-border-subtle text-lyra-fg-default",
      },
      shape: {
        none:    "",
        rounded: "rounded-lyra-md",
        circle:  "rounded-full",
      },
    },
    defaultVariants: {
      size: "md",
      background: "none",
      shape: "rounded",
    },
  }
);

/* ── Component ── */

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  (
    {
      icon: LucideIconComponent,
      size = "md",
      color = "inherit",
      background = "none",
      shape = "rounded",
      className,
      decorative = false,
      label,
      tooltip = false,
    },
    ref
  ) => {
    const svgProps = decorative
      ? { "aria-hidden": true as const, focusable: false }
      : label
      ? { role: "img" as const, "aria-label": label }
      : { "aria-hidden": true as const, focusable: false };

    // When a background is set, the container handles color via backgroundClasses
    // so we omit the color variant on the icon itself
    const resolvedColor: IconColor = background !== "none" ? "inherit" : color;

    const iconEl = (
      <LucideIconComponent
        ref={ref}
        strokeWidth={1.5}
        className={cn(
          iconVariants({ size, color: resolvedColor }),
          background === "none" && className
        )}
        {...svgProps}
      />
    );

    // Wrap in a container div when background is requested
    if (background !== "none") {
      const wrapped = (
        <div
          className={cn(
            iconContainerVariants({ size, background, shape }),
            className
          )}
        >
          <LucideIconComponent
            strokeWidth={1.5}
            className={iconVariants({ size })}
            {...svgProps}
          />
        </div>
      );

      if (tooltip && label) {
        return <Tooltip content={label}>{wrapped}</Tooltip>;
      }
      return wrapped;
    }

    if (tooltip && label) {
      return <Tooltip content={label}>{iconEl}</Tooltip>;
    }

    return iconEl;
  }
);

Icon.displayName = "Icon";

export { Icon, iconVariants, iconContainerVariants };
