import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

interface AppNameProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** App icon — an img element or SVG component */
  icon: React.ReactNode;
  /** Application name text */
  name: string;
  /**
   * Compact mode (narrow viewports): show only the icon.
   * Name and chevron are hidden; the app name moves into the menu header.
   */
  compact?: boolean;
}

const AppName = React.forwardRef<HTMLButtonElement, AppNameProps>(
  ({ className, icon, name, compact = false, ...props }, ref) => (
    <button
      ref={ref}
      aria-haspopup="true"
      aria-label={`${name} — open application menu`}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lyra-sm p-2 transition-colors",
        "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
      {!compact && (
        <>
          <span className="lyra-body-lg-emphasis text-lyra-fg-default">{name}</span>
          <ChevronDown
            className="h-3.5 w-3.5 text-lyra-fg-secondary"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </>
      )}
    </button>
  )
);
AppName.displayName = "AppName";

export { AppName };
export type { AppNameProps };
