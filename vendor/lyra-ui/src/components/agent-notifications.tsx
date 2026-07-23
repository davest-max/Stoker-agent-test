import * as React from "react";
import { UserPlus, MessageSquare, AlertTriangle, PhoneMissed, Bell, Trash2, GripVertical, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/utils";
import { ListItem } from "./list-item";
import { StatusBadge } from "./status-badge";
import { Tooltip } from "./tooltip";
import { Draggable, type DraggableVariant } from "./draggable";
import { ContainerHeader } from "./container-header";
import { Menu } from "./menu";

/* ── Types ── */

export type NotificationType = "new-case" | "new-chat" | "escalation" | "missed-call" | "custom";

export interface AgentNotification {
  id: string;
  type: NotificationType;
  title: string;
  subtitle?: string;
  timestamp: string;
  read?: boolean;
  /** Override icon for type "custom" */
  icon?: React.ReactNode;
}

export interface AgentNotificationsProps {
  notifications: AgentNotification[];
  onClearAll?: () => void;
  onMarkAllRead?: () => void;
  onClose?: () => void;
  onNotificationClick?: (notification: AgentNotification) => void;
  onDismiss?: (id: string) => void;
  /** Restored width on each remount so resize is preserved across float↔docked switches */
  defaultWidth?: number;
  /** Max width for the Draggable wrapper (default: unlimited) */
  maxWidth?: number;
  /** Controlled height — overrides defaultHeight on the Draggable (e.g. for viewport-responsive sizing) */
  height?: number;
  /** Initial Draggable variant (default: "float") */
  draggableVariant?: DraggableVariant;
  /** Called when variant changes (float ↔ docked) */
  onVariantChange?: (variant: DraggableVariant) => void;
  /** Called when the draggable width changes (for animating docked wrapper) */
  onWidthChange?: (width: number) => void;
  /** Called when resize drag starts/ends (suppress transition during drag) */
  onResizeStateChange?: (isResizing: boolean) => void;
  /** Called on any mousedown inside the panel — use for z-index "bring to front" logic */
  onInteract?: () => void;
  className?: string;
}

/* ── Notification type config ── */

const typeConfig: Record<NotificationType, { icon: React.ReactNode; bg: string; color: string }> = {
  "new-case": {
    icon: <UserPlus className="h-4 w-4" strokeWidth={1.5} />,
    bg: "bg-lyra-bg-active-subtle",
    color: "text-lyra-fg-active-strong",
  },
  "new-chat": {
    icon: <MessageSquare className="h-4 w-4" strokeWidth={1.5} />,
    bg: "bg-lyra-status-success-subtle",
    color: "text-lyra-status-success-strong",
  },
  escalation: {
    icon: <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />,
    bg: "bg-lyra-status-warning-subtle",
    color: "text-lyra-status-warning-strong",
  },
  "missed-call": {
    icon: <PhoneMissed className="h-4 w-4" strokeWidth={1.5} />,
    bg: "bg-lyra-status-critical-subtle",
    color: "text-lyra-status-critical-strong",
  },
  custom: {
    icon: <Bell className="h-4 w-4" strokeWidth={1.5} />,
    bg: "bg-lyra-bg-surface-shell",
    color: "text-lyra-fg-secondary",
  },
};

function NotificationIcon({ type, icon }: { type: NotificationType; icon?: React.ReactNode }) {
  const config = typeConfig[type];
  return (
    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", config.bg, config.color)}>
      {icon ?? config.icon}
    </div>
  );
}


/* ── Component ── */

const AgentNotifications = React.forwardRef<HTMLDivElement, AgentNotificationsProps>(
  ({ notifications, onClearAll, onMarkAllRead, onClose, onNotificationClick, onDismiss,
     defaultWidth = 320, maxWidth, height,
     draggableVariant: draggableVariantProp = "float", onVariantChange, onWidthChange, onResizeStateChange,
     onInteract, className }, ref) => {
    const [draggableVariant, setDraggableVariant] = React.useState<DraggableVariant>(draggableVariantProp);

    // Sync when parent forces a variant change (single-dock rule)
    React.useEffect(() => { setDraggableVariant(draggableVariantProp); }, [draggableVariantProp]);

    const unreadCount = notifications.filter((n) => !n.read).length;
    const hasUnread = notifications.some((n) => !n.read);
    const [overflowOpen, setOverflowOpen] = React.useState(false);

    // Pre-compute outside JSX to avoid IIFE type-widening issues
    const overflowItems: Array<{ id: string; label: string; onClick: () => void; destructive?: boolean }> = [
      ...(onMarkAllRead && hasUnread
        ? [{ id: "mark-read", label: "Mark all as read", onClick: onMarkAllRead }]
        : []),
      ...(onClearAll
        ? [{ id: "clear-all", label: "Clear all", onClick: onClearAll, destructive: true }]
        : []),
    ];

    return (
      <Draggable
        ref={ref}
        variant={draggableVariant}
        defaultWidth={defaultWidth}
        defaultHeight={height ?? 480}
        minWidth={280}
        maxWidth={maxWidth}
        minHeight={200}
        onVariantChange={(v) => { setDraggableVariant(v); onVariantChange?.(v); }}
        onWidthChange={onWidthChange}
        onResizeStateChange={onResizeStateChange}
        onInteract={onInteract}
        className={cn(
          "rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base",
          draggableVariant === "float" ? "shadow-lg" : "h-full",
          className
        )}
        renderHeaderControls={({ gripProps, dockButtonProps, dockIcon, variant }) => (
          <ContainerHeader
            title="Notifications"
            /* Grip icon in float mode; spacer div to preserve header height in docked mode */
            icon={
              variant === "float" ? (
                <div {...gripProps}><GripVertical className="h-4 w-4" strokeWidth={1.5} /></div>
              ) : (
                <div className="w-4" aria-hidden="true" />
              )
            }
            /* Count badge sits inline right after the title */
            titleBadge={
              unreadCount > 0
                ? <StatusBadge variant="info" size="sm" className="-translate-y-0.5">{unreadCount}</StatusBadge>
                : undefined
            }
            /* lyra-heading-md line-height collapses so items-center aligns the badge correctly */
            titleClassName="lyra-heading-md leading-none"
            actions={
              <>
                {/* Overflow menu — "Mark all as read" + "Clear all" */}
                {overflowItems.length > 0 && (
                  <div className="relative">
                    <Tooltip content="More options" placement="bottom" asLabel>
                      <button
                        type="button"
                        aria-label="More options"
                        aria-expanded={overflowOpen}
                        onClick={() => setOverflowOpen((v) => !v)}
                        className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-state-hover hover:text-lyra-fg-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
                      >
                        <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </Tooltip>
                    {overflowOpen && (
                      <div className="absolute right-0 top-full mt-1 z-50">
                        <Menu
                          items={overflowItems.map((item) => ({
                            ...item,
                            onClick: () => { item.onClick(); setOverflowOpen(false); },
                          }))}
                        />
                      </div>
                    )}
                  </div>
                )}
                {/* Dock / undock toggle */}
                <Tooltip content={dockButtonProps["aria-label"]} placement="bottom" asLabel>
                  <button
                    {...dockButtonProps}
                    className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-state-hover hover:text-lyra-fg-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
                  >
                    {dockIcon}
                  </button>
                </Tooltip>
              </>
            }
            onClose={onClose}
            bordered
          />
        )}
      >
        {/* ── Notification list ── */}
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Bell className="h-8 w-8 text-lyra-fg-disabled" strokeWidth={1} />
              <p className="lyra-body-md text-lyra-fg-disabled">No notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "group/notif relative border-l-2",
                  !n.read ? "border-lyra-bg-primary" : "border-transparent"
                )}
              >
                <ListItem
                  onClick={() => onNotificationClick?.(n)}
                  leading={<NotificationIcon type={n.type} icon={n.icon} />}
                  title={n.title}
                  subtitle={n.subtitle}
                  meta={n.timestamp}
                  divider
                  className={cn("pr-10", !n.read && "bg-lyra-bg-active-subtle")}
                />
                {/* Dismiss button — visible on row hover */}
                <Tooltip content="Clear" placement="left" asLabel>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDismiss?.(n.id); }}
                    aria-label={`Clear ${n.title}`}
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2",
                      "flex h-6 w-6 items-center justify-center rounded-lyra-sm",
                      "text-lyra-fg-secondary hover:text-lyra-fg-default hover:bg-lyra-state-hover transition-colors",
                      "opacity-0 group-hover/notif:opacity-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </Tooltip>
              </div>
            ))
          )}
        </div>
      </Draggable>
    );
  }
);
AgentNotifications.displayName = "AgentNotifications";

export { AgentNotifications };
