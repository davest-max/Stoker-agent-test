import * as React from "react";
import * as ReactDOM from "react-dom";
import { Bell } from "lucide-react";
import { cn } from "../lib/utils";
import { StatusBadge } from "./status-badge";
import { Tooltip } from "./tooltip";
import { AgentNotifications, type AgentNotification } from "./agent-notifications";

/* ── Types ── */

export interface NotificationsBellProps {
  notifications?: AgentNotification[];
  onClearAll?: () => void;
  onMarkAllRead?: () => void;
  onNotificationClick?: (notification: AgentNotification) => void;
  onDismiss?: (id: string) => void;
  /**
   * Controlled open state. When provided, the component uses this value
   * instead of internal state and calls `onOpenChange` on toggle.
   */
  open?: boolean;
  /** Called when the trigger is clicked (controlled mode). */
  onOpenChange?: (open: boolean) => void;
  /**
   * When false, the component renders only the trigger button and omits the
   * built-in portal panel. Use this when the parent manages panel placement
   * (e.g. docked inside a layout). Default: true.
   */
  renderPanel?: boolean;
  className?: string;
}

/* ── Component ── */

const NotificationsBell = React.forwardRef<HTMLDivElement, NotificationsBellProps>(
  ({
    notifications = [],
    onClearAll, onMarkAllRead, onNotificationClick, onDismiss,
    open: openProp, onOpenChange,
    renderPanel = true,
    className,
  }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const isControlled = openProp !== undefined;
    const open = isControlled ? openProp : internalOpen;

    const [panelPos, setPanelPos] = React.useState({ top: 0, left: 0 });
    const [panelHeight, setPanelHeight] = React.useState(480);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const count = notifications.filter((n) => !n.read).length;
    const PANEL_DEFAULT_WIDTH = 320;
    const MAX_PANEL_HEIGHT = 860;
    const BOTTOM_PADDING = 8;

    const computeHeight = React.useCallback((top: number) =>
      Math.min(window.innerHeight - top - BOTTOM_PADDING, MAX_PANEL_HEIGHT),
    []);

    const handleToggle = () => {
      if (renderPanel && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const top = rect.bottom + 6;
        setPanelPos({ top, left: rect.right - PANEL_DEFAULT_WIDTH });
        setPanelHeight(computeHeight(top));
      }
      const next = !open;
      if (isControlled) {
        onOpenChange?.(next);
      } else {
        setInternalOpen(next);
      }
    };

    // Update panel height on viewport resize while open (self-managed portal only)
    React.useEffect(() => {
      if (!open || !renderPanel) return;
      const onResize = () => setPanelHeight(computeHeight(panelPos.top));
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [open, renderPanel, panelPos.top, computeHeight]);

    const handleClose = () => {
      if (isControlled) {
        onOpenChange?.(false);
      } else {
        setInternalOpen(false);
      }
    };

    return (
      <div ref={ref} className={className}>
        <Tooltip content="Notifications" placement="bottom" asLabel>
          <button
            ref={buttonRef}
            type="button"
            aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}
            aria-expanded={open}
            onClick={handleToggle}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-lyra-lg",
              "text-lyra-fg-default transition-colors",
              "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
              open && "bg-lyra-state-hover"
            )}
          >
            <span className="relative inline-flex">
              <Bell className="h-5 w-5" strokeWidth={1.5} />
              {count > 0 && (
                <StatusBadge
                  variant="critical"
                  size="sm"
                  count={count}
                  className="absolute -right-1.5 -top-1.5"
                />
              )}
            </span>
          </button>
        </Tooltip>

        {/* Built-in portal panel — only rendered when renderPanel is true */}
        {renderPanel && open && ReactDOM.createPortal(
          <div
            style={{ position: "fixed", top: panelPos.top, left: panelPos.left, zIndex: 9999 }}
            className="animate-in fade-in-0 slide-in-from-top-2 duration-150"
          >
            <AgentNotifications
              notifications={notifications}
              onClearAll={onClearAll}
              onMarkAllRead={onMarkAllRead}
              onClose={handleClose}
              onNotificationClick={onNotificationClick}
              onDismiss={onDismiss}
              height={panelHeight}
            />
          </div>,
          document.body
        )}
      </div>
    );
  }
);
NotificationsBell.displayName = "NotificationsBell";

export { NotificationsBell };
export type { AgentNotification };
