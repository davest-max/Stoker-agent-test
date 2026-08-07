import * as React from "react";
import { cn } from "../lib/utils";

/* ── AppHeader ── */

interface AppHeaderProps extends React.HTMLAttributes<HTMLElement> {
  /** Left side content — typically an AppName component */
  appName: React.ReactNode;
  /** Right side content — typically ActionIconButtons + ActionAvatarButton */
  actions?: React.ReactNode;
}

const AppHeader = React.forwardRef<HTMLElement, AppHeaderProps>(
  ({ className, appName, actions, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "flex h-14 items-center justify-between pl-2 pr-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center">{appName}</div>
      {actions && (
        <div className="flex items-center gap-1">{actions}</div>
      )}
    </header>
  )
);
AppHeader.displayName = "AppHeader";

export { AppHeader };
export type { AppHeaderProps };
