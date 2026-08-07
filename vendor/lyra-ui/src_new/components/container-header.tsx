import * as React from "react";
import { X } from "lucide-react";
import { Tooltip } from "./tooltip";
import { cn } from "../lib/utils";

/* ── Types ── */

export interface ContainerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Header title. Optional so the header can still render for icon-only /
   * tag-only layouts (e.g. `DashboardCard`'s "show/hide header text"
   * control) — when omitted, the title line simply isn't rendered rather
   * than showing an empty heading.
   */
  title?: string;
  /** Optional icon to the left of the title */
  icon?: React.ReactNode;
  /** Actions rendered to the right of the title (buttons, badges, etc.) */
  actions?: React.ReactNode;
  /** Renders a built-in close button and calls this when clicked */
  onClose?: () => void;
  /** Typography class for the title (default: "lyra-heading-md") */
  titleClassName?: string;
  /** Optional subtitle displayed below the title in body-sm secondary */
  subhead?: string;
  /** Badge or tag rendered inline immediately after the title */
  titleBadge?: React.ReactNode;
  /**
   * Rendered on its own line above the icon+title row — e.g. a status
   * `Tag` ("Anomaly", "Alert") that needs to sit above the headline rather
   * than inline beside it like `titleBadge`. Left-aligned with the icon
   * (i.e. flush with the header's own left edge), not indented to the
   * title's start.
   */
  topSlot?: React.ReactNode;
  /** Show a bottom border (default: true) */
  bordered?: boolean;
}

/* ── Component ── */

const ContainerHeader = React.forwardRef<HTMLDivElement, ContainerHeaderProps>(
  ({
    className,
    title,
    icon,
    actions,
    onClose,
    titleClassName = "lyra-heading-md",
    subhead,
    titleBadge,
    topSlot,
    bordered = true,
    ...props
  }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between px-4 py-5 shrink-0",
        bordered && "border-b border-lyra-border-subtle",
        className
      )}
      {...props}
    >
      {/* Left: optional top slot, above icon + title + optional subhead */}
      <div className="flex flex-col items-start gap-1 min-w-0">
        {topSlot}
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="flex-shrink-0 text-lyra-fg-secondary">{icon}</span>}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {title && <h2 className={cn(titleClassName, "text-lyra-fg-default truncate")}>{title}</h2>}
              {titleBadge && <span className="shrink-0">{titleBadge}</span>}
            </div>
            {subhead && (
              <p className="lyra-body-sm text-lyra-fg-secondary truncate">{subhead}</p>
            )}
          </div>
        </div>
      </div>

      {/* Right: actions + optional close button */}
      <div className="flex items-center gap-1 shrink-0 ml-4">
        {actions}
        {onClose && (
          <Tooltip content={title ? `Close ${title}` : "Close"} placement="bottom" asLabel>
            <button
              aria-label={title ? `Close ${title}` : "Close"}
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
            >
              <X className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  )
);
ContainerHeader.displayName = "ContainerHeader";

export { ContainerHeader };
