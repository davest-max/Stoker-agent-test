import * as React from "react";
import { cn } from "../lib/utils";

interface PanelFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const PanelFooter = React.forwardRef<HTMLDivElement, PanelFooterProps>(
  ({ className, children, ...props }, ref) => {
    const sentinelRef = React.useRef<HTMLDivElement>(null);
    const [elevated, setElevated] = React.useState(false);

    // Watch a zero-height sentinel element placed just above the footer.
    // When it scrolls out of view (hidden under scrolled content), the footer
    // gets elevated — showing a shadow to indicate content behind it.
    React.useEffect(() => {
      const el = sentinelRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => setElevated(!entry.isIntersecting),
        { threshold: 0 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    return (
      <>
        {/* Zero-height sentinel — sits just above the footer in the scroll container */}
        <div ref={sentinelRef} className="shrink-0 h-px" aria-hidden="true" />
        <div
          ref={ref}
          className={cn(
            "flex items-center justify-end gap-2 px-4 py-3 shrink-0 transition-shadow duration-150",
            elevated ? "shadow-[0_-4px_12px_0_rgba(0,0,0,0.08)]" : "shadow-none",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);
PanelFooter.displayName = "PanelFooter";

export { PanelFooter };
export type { PanelFooterProps };
