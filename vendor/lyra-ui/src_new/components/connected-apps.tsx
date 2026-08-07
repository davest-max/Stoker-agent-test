import * as React from "react";
import { RotateCw, Activity } from "lucide-react";
import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";

/* ── Types ── */

export type AppConnectionStatus = "healthy" | "warning" | "error";

export interface ConnectedApp {
  id: string;
  name: string;
  /** Single letter or short label for the avatar */
  initial: string;
  latencyMs?: number;
  uptimePct?: number;
  status: AppConnectionStatus;
}

export interface ConnectedAppsPanelProps {
  apps: ConnectedApp[];
  /** Called when reconnect is triggered for an app */
  onReconnect?: (appId: string) => void;
  className?: string;
}

/* ── Status dot ── */

const statusColors: Record<AppConnectionStatus, string> = {
  healthy: "bg-lyra-status-success-strong",
  warning: "bg-lyra-status-warning-strong",
  error:   "bg-lyra-status-critical-strong",
};

/* ── App row ── */

function AppRow({
  app,
  onReconnect,
}: {
  app: ConnectedApp;
  onReconnect?: (id: string) => void;
}) {
  const [reconnecting, setReconnecting] = React.useState(false);
  const [reconnected,  setReconnected]  = React.useState(false);

  const handleReconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reconnecting || reconnected) return;
    setReconnecting(true);
    onReconnect?.(app.id);
    setTimeout(() => {
      setReconnecting(false);
      setReconnected(true);
    }, 2500);
  };

  // Use reconnected state to override display values
  const displayStatus  = reconnected ? "healthy" : app.status;
  const displayUptime  = reconnected ? 100 : app.uptimePct;

  const showReconnect = !reconnected && (app.status === "warning" || app.status === "error");

  return (
    <div className="group/row flex items-center gap-3 px-4 py-3 border-b border-lyra-border-subtle/50 last:border-0">
      {/* App initial avatar */}
      <div className="h-9 w-9 rounded-lyra-md bg-lyra-bg-surface-shell flex items-center justify-center shrink-0">
        <span className="lyra-label text-lyra-fg-secondary uppercase">{app.initial}</span>
      </div>

      {/* Name + metrics */}
      <div className="flex-1 min-w-0">
        <p className="lyra-body-md text-lyra-fg-default truncate">{app.name}</p>
        {(app.latencyMs !== undefined || displayUptime !== undefined) && (
          <p className="lyra-body-sm text-lyra-fg-secondary">
            {app.latencyMs !== undefined && `${app.latencyMs}ms`}
            {app.latencyMs !== undefined && displayUptime !== undefined && " · "}
            {displayUptime !== undefined && `${displayUptime}% uptime`}
          </p>
        )}
      </div>

      {/* Status indicator */}
      <div className="shrink-0 flex items-center justify-center w-4 h-4">
        {showReconnect ? (
          <button
            type="button"
            onClick={handleReconnect}
            aria-label={`Reconnect ${app.name}`}
            className="flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus rounded-full"
          >
            {reconnecting ? (
              <RotateCw className="h-4 w-4 text-lyra-status-warning-strong animate-spin" strokeWidth={2} />
            ) : (
              <>
                {/* Dot — visible when not hovering the row */}
                <span className={cn(
                  "h-3 w-3 rounded-full block group-hover/row:hidden",
                  statusColors[app.status]
                )} />
                {/* Refresh icon — visible on row hover */}
                <RotateCw
                  className="h-4 w-4 text-lyra-status-warning-strong hidden group-hover/row:block"
                  strokeWidth={2}
                />
              </>
            )}
          </button>
        ) : (
          <span className={cn("h-3 w-3 rounded-full block", statusColors[displayStatus])} />
        )}
      </div>
    </div>
  );
}

/* ── Panel ── */

const ConnectedAppsPanel = React.forwardRef<HTMLDivElement, ConnectedAppsPanelProps>(
  ({ apps, onReconnect, className }, ref) => {
    const [reconnectedIds, setReconnectedIds] = React.useState<Set<string>>(new Set());
    const effectiveHealthy = apps.filter((a) => a.status === "healthy" || reconnectedIds.has(a.id)).length;
    const issueCount = apps.length - effectiveHealthy;

    const handleReconnect = (id: string) => {
      onReconnect?.(id);
      setTimeout(() => setReconnectedIds((prev) => new Set([...prev, id])), 2500);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-72 rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg overflow-hidden",
          className
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-lyra-border-subtle">
          <div className="flex items-center justify-between">
            <p className="lyra-body-md-emphasis text-lyra-fg-default">Connected Applications</p>
            {apps.length > 0 && (
              <span className={cn(
                "lyra-body-sm font-medium tabular-nums",
                issueCount > 0 ? "text-lyra-status-warning-strong" : "text-lyra-status-success-strong"
              )}>
                {effectiveHealthy}/{apps.length} healthy
              </span>
            )}
          </div>
          <p className="lyra-body-sm text-lyra-fg-secondary mt-0.5">System health overview</p>
        </div>

        {/* App list */}
        <div className="overflow-y-auto max-h-80">
          {apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 px-4 py-8 text-center">
              <Activity className="h-6 w-6 text-lyra-fg-disabled mb-1" strokeWidth={1.4} />
              <p className="lyra-body-md-emphasis text-lyra-fg-secondary">No connected apps</p>
              <p className="lyra-body-sm text-lyra-fg-disabled">Apps will appear here once connected.</p>
            </div>
          ) : (
            apps.map((app) => (
              <AppRow key={app.id} app={app} onReconnect={handleReconnect} />
            ))
          )}
        </div>
      </div>
    );
  }
);
ConnectedAppsPanel.displayName = "ConnectedAppsPanel";

export { ConnectedAppsPanel };
