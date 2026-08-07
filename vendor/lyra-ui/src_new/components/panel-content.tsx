import * as React from "react";
import { cn } from "../lib/utils";

interface PanelContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const PanelContent = React.forwardRef<HTMLDivElement, PanelContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex-1 overflow-y-auto min-h-0", className)}
      {...props}
    >
      {children}
    </div>
  )
);
PanelContent.displayName = "PanelContent";

export { PanelContent };
export type { PanelContentProps };
