import * as React from "react";
import { cn } from "../lib/utils";

/* ── ContentArea ──
   Shell-level wrapper that sits beside the LeftNav and provides
   the inset padding (right + bottom) before the main Container.

   Usage:
     <div className="flex flex-1 overflow-hidden bg-lyra-bg-surface-shell">
       <LeftNav … />
       <ContentArea>
         <Container className="flex flex-1 overflow-hidden">
           …page content…
         </Container>
       </ContentArea>
     </div>
*/

interface ContentAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Override the default padding (pr-3 pb-3 = 12px right & bottom) */
  padding?: string;
}

const ContentArea = React.forwardRef<HTMLDivElement, ContentAreaProps>(
  ({ className, padding, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-1 overflow-hidden",
        padding ?? "pr-3 pb-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
ContentArea.displayName = "ContentArea";

export { ContentArea };
export type { ContentAreaProps };
