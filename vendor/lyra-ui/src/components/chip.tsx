import * as React from "react";
import { cn } from "../lib/utils";

/* ── Types ── */

export type ChipColor =
  | "slate"
  | "red"
  | "orange"
  | "yellow"
  | "lime"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "pink";

/**
 * subtle — rounded-rect, soft tinted background, strong-color text
 * solid  — rounded-rect, strong filled background, white text
 */
export type ChipVariant = "subtle" | "solid";

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Accent color family */
  color?: ChipColor;
  /** Visual variant */
  variant?: ChipVariant;
}

/* ── Style helpers ── */

function getInlineStyles(
  variant: ChipVariant,
  color: ChipColor
): React.CSSProperties {
  const soft = `var(--lyra-color-accent-${color}-soft)`;
  const strong = `var(--lyra-color-accent-${color}-strong)`;

  switch (variant) {
    case "subtle":
      return { backgroundColor: soft, color: strong };
    case "solid":
      return { backgroundColor: strong, color: "var(--lyra-color-fg-on-primary)" };
  }
}

/* ── Chip ── */

const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  (
    {
      className,
      color = "slate",
      variant = "subtle",
      children,
      ...props
    },
    ref
  ) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center h-6 px-2 lyra-body-md-emphasis whitespace-nowrap rounded-lyra-md",
        className
      )}
      style={getInlineStyles(variant, color)}
      {...props}
    >
      {children}
    </span>
  )
);
Chip.displayName = "Chip";

export { Chip };
