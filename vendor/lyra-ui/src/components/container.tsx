import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ContainerHeader } from "./container-header";
import { cn } from "../lib/utils";

/*
 * Container variant naming convention: {color}-{border-style}
 *
 * Colors  : base | overlay | info | success | warning | error | neutral
 * Borders : none | subtle | strong | dotted
 *
 * Special surfaces (popover, modal) keep their own names.
 */
const containerVariants = cva("rounded-lyra-lg", {
  variants: {
    variant: {
      /* ── Base / overlay surfaces ── */
      default:          "bg-lyra-bg-surface-base border border-lyra-border-subtle shadow-sm",
      popover:          "bg-lyra-bg-surface-overlay border border-lyra-border-subtle shadow-lg",
      modal:            "bg-lyra-bg-surface-overlay border border-lyra-border-subtle shadow-xl",

      /* ── Info (blue) ── */
      "info-none":      "bg-lyra-bg-active-subtle",
      "info-subtle":    "bg-lyra-bg-active-subtle border border-lyra-bg-active-moderate",
      "info-strong":    "bg-lyra-bg-active-subtle border border-lyra-border-active",
      "info-dotted":    "bg-lyra-bg-active-subtle border border-dashed border-lyra-border-active",

      /* ── Success (green) ── */
      "success-none":   "bg-lyra-status-success-subtle",
      "success-subtle": "bg-lyra-status-success-subtle border border-lyra-status-success-medium/30",
      "success-strong": "bg-lyra-status-success-subtle border border-lyra-status-success-strong",
      "success-dotted": "bg-lyra-status-success-subtle border border-dashed border-lyra-status-success-strong",

      /* ── Warning (amber) ── */
      "warning-none":   "bg-lyra-status-warning-subtle",
      "warning-subtle": "bg-lyra-status-warning-subtle border border-lyra-status-warning-strong/30",
      "warning-solid":  "bg-lyra-status-warning-subtle border border-lyra-status-warning-strong",
      "warning-dotted": "bg-lyra-status-warning-subtle border border-dashed border-lyra-status-warning-strong",

      /* ── Error / Critical (red) ── */
      "error-none":     "bg-lyra-status-critical-subtle",
      "error-subtle":   "bg-lyra-status-critical-subtle border border-lyra-state-pressed-critical-subtle",
      "error-strong":   "bg-lyra-status-critical-subtle border border-lyra-status-critical-strong",
      "error-dotted":   "bg-lyra-status-critical-subtle border border-dashed border-lyra-status-critical-strong",

      /* ── Neutral ── */
      "neutral-none":   "bg-lyra-bg-surface-container-subtle",
      "neutral-subtle": "bg-lyra-bg-surface-container-subtle border border-lyra-border-subtle",
      "neutral-strong": "bg-lyra-bg-surface-container-subtle border border-lyra-border-default",
      "neutral-dotted": "bg-lyra-bg-surface-container-subtle border border-dashed border-lyra-border-default",

      /* ── Legacy aliases (kept for backwards compatibility) ── */
      info:             "bg-lyra-bg-active-subtle border border-lyra-bg-active-moderate",
      success:          "bg-lyra-status-success-subtle border border-lyra-status-success-medium/30",
      warning:          "bg-lyra-status-warning-subtle border border-dashed border-lyra-status-warning-strong",
      critical:         "bg-lyra-status-critical-subtle border border-lyra-state-pressed-critical-subtle",
      "neutral-flat":   "bg-lyra-bg-surface-container-subtle",
      "neutral-card":   "bg-lyra-bg-surface-container-subtle border border-lyra-border-subtle",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  /**
   * Header title — renders a `ContainerHeader` when this or any other
   * `header*` prop below is present. Optional on its own (not just when
   * every `header*` prop is absent): an icon-only or tag-only header with
   * no title text is valid — see `ContainerHeader`'s `title` doc comment.
   */
  headerTitle?: string;
  /** Icon shown to the left of the title */
  headerIcon?: React.ReactNode;
  /** Actions rendered on the right of the header */
  headerActions?: React.ReactNode;
  /** Badge/tag shown inline immediately after the title */
  headerTitleBadge?: React.ReactNode;
  /** Rendered on its own line above the icon+title row — e.g. a status `Tag` ("Anomaly", "Alert"). See `ContainerHeader`'s `topSlot`. */
  headerTopSlot?: React.ReactNode;
  /** Subtitle shown below the title in body-sm secondary */
  headerSubhead?: string;
  /** Show a dividing border below the header (default: false) */
  headerBordered?: boolean;
  /** Typography class for the header title (default: "lyra-heading-md", set on ContainerHeader) */
  headerTitleClassName?: string;
  /** Additional className merged onto the header's own wrapper div — e.g. to zero its padding (`"px-0 py-0"`) when a consumer is rendering a chromeless/bare card. */
  headerClassName?: string;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({
    className, variant,
    headerTitle, headerIcon, headerActions,
    headerTitleBadge, headerTopSlot, headerSubhead, headerBordered = false,
    headerTitleClassName, headerClassName,
    children, ...props
  }, ref) => {
    // Render the header whenever *any* header-related prop is present, not
    // just when there's title text — an icon-only or tag-only header (no
    // title, e.g. DashboardCard's "show/hide header text" control) still
    // needs the row to render so the icon/subhead/topSlot aren't silently
    // dropped along with the title.
    const hasHeader = Boolean(
      headerTitle || headerIcon || headerActions || headerTitleBadge || headerTopSlot || headerSubhead
    );

    return (
      <div
        ref={ref}
        className={cn(containerVariants({ variant }), className)}
        {...props}
      >
        {hasHeader && (
          <ContainerHeader
            title={headerTitle}
            icon={headerIcon}
            actions={headerActions}
            titleBadge={headerTitleBadge}
            topSlot={headerTopSlot}
            subhead={headerSubhead}
            bordered={headerBordered}
            className={headerClassName}
            {...(headerTitleClassName ? { titleClassName: headerTitleClassName } : {})}
          />
        )}
        {children}
      </div>
    );
  }
);
Container.displayName = "Container";

export { Container, containerVariants };
export type { ContainerProps };
