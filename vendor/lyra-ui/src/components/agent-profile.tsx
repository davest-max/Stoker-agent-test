import * as React from "react";
import { ChevronDown, Moon, Sun, Activity, LogOut, Link2Off, Link2, Loader2, Search, CircleHelp, Check, Minus } from "lucide-react";
import { cn } from "../lib/utils";
import { Menu, type MenuEntry } from "./menu";
import { ConnectedAppsPanel, type ConnectedApp } from "./connected-apps";
import { Popover } from "./popover";
import { Tooltip } from "./tooltip";
import { FavoriteButton } from "./favorite-button";
import { StatusBadge, type StatusBadgeProps } from "./status-badge";
import { Input } from "./input";

/* ── Types ──
   Was "available" | "busy" | "away" | "offline" — "away" was dropped
   (three real states plus Offline was one too many to tell apart at a
   glance, color-only) and "busy" renamed to "unavailable" to match the
   same terminology `AgentDashboard`'s "Unavailable Agents" badge already
   uses (see agent-dashboard.tsx) — same word, same red/critical color,
   now also the same icon. */

export type AgentStatus = "available" | "unavailable" | "offline";

export interface AgentProfileProps {
  name: string;
  initials?: string;
  avatarSrc?: string;
  status?: AgentStatus;
  onStatusChange?: (status: AgentStatus) => void;
  timer?: string;
  /** Pass apps to show the Connected Apps flyout panel */
  connectedApps?: ConnectedApp[];
  /** Called when reconnect is triggered for an app */
  onReconnect?: (appId: string) => void;
  onDarkModeToggle?: () => void;
  /** Whether dark mode is currently active — controls the label/icon shown in the menu */
  isDarkMode?: boolean;
  /** Shows a "Help" row (below "Agent Leg Disconnected") when provided */
  onHelpClick?: () => void;
  onLogOut?: () => void;
  className?: string;
}

/* ── Status config ──
   `badgeVariant`/`icon` are only set for statuses that get a real icon
   badge in the status menu (ADA — color alone isn't an accessible signal).
   "offline" has neither and falls back to `StatusBadge`'s own `dot` mode
   in `StatusIcon` below — a solid gray circle doesn't read as "which
   status" the way a check/minus glyph does, so there's no icon metaphor
   worth forcing there. */

type StatusBadgeVariant = NonNullable<StatusBadgeProps["variant"]>;

const statusConfig: Record<AgentStatus, { label: string; color: string; textColor: string; icon?: typeof Check; badgeVariant?: StatusBadgeVariant }> = {
  available:   { label: "Available",   color: "bg-lyra-status-success-strong",  textColor: "text-lyra-status-success-strong",  icon: Check, badgeVariant: "success" },
  unavailable: { label: "Unavailable", color: "bg-lyra-status-critical-strong", textColor: "text-lyra-status-critical-strong", icon: Minus, badgeVariant: "critical" },
  offline:     { label: "Offline",     color: "bg-lyra-accent-slate-strong",    textColor: "text-lyra-accent-slate-strong" },
};

/** Status menu row icon — `StatusBadge` with the status glyph as its
 *  content (same badge used for the Connected Apps count, just an icon
 *  instead of a number) for statuses that have one, `StatusBadge`'s own
 *  `dot` mode for "offline". */
function StatusIcon({ status, className }: { status: AgentStatus; className?: string }) {
  const { icon: StatusGlyph, badgeVariant } = statusConfig[status];
  if (StatusGlyph && badgeVariant) {
    return (
      <StatusBadge variant={badgeVariant} size="sm" className={className}>
        <StatusGlyph className="h-2 w-2" strokeWidth={3} aria-hidden="true" />
      </StatusBadge>
    );
  }
  return (
    <StatusBadge variant="neutral" size="sm" className={className} aria-label={statusConfig[status].label}>
      <span className="block h-2 w-2 rounded-full bg-white" aria-hidden="true" />
    </StatusBadge>
  );
}

function Avatar({ initials, src, status }: { initials?: string; src?: string; status: AgentStatus }) {
  return (
    <div className="relative shrink-0">
      <div className="h-9 w-9 rounded-full overflow-hidden bg-lyra-avatar-default-bg flex items-center justify-center">
        {src
          ? <img src={src} alt={initials} className="h-full w-full object-cover" />
          : <span className="lyra-label text-white">{initials}</span>}
      </div>
      <StatusIcon status={status} className="absolute bottom-[-2px] right-[-2px] px-0 border border-lyra-bg-surface-base" />
    </div>
  );
}

/* ── Component ── */

const AgentProfile = React.forwardRef<HTMLDivElement, AgentProfileProps>(
  ({
    name, initials = "AG", avatarSrc,
    status = "offline", onStatusChange,
    timer,
    connectedApps = [],
    onReconnect,
    onDarkModeToggle, isDarkMode = false, onHelpClick, onLogOut,
    className,
  }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [statusSearch, setStatusSearch] = React.useState("");
    const [favoriteStatuses, setFavoriteStatuses] = React.useState<Set<AgentStatus>>(new Set());
    const [agentLegStatus, setAgentLegStatus] = React.useState<"disconnected" | "connecting" | "connected">("disconnected");
    const [reconnectedIds, setReconnectedIds] = React.useState<Set<string>>(new Set());
    const contentRef = React.useRef<HTMLDivElement>(null);
    const issueCount = connectedApps.filter((a) => a.status !== "healthy" && !reconnectedIds.has(a.id)).length;

    const handleReconnect = (appId: string) => {
      onReconnect?.(appId);
      setTimeout(() => setReconnectedIds((prev) => new Set([...prev, appId])), 2500);
    };

    const toggleFavoriteStatus = (s: AgentStatus) => {
      setFavoriteStatuses((prev) => {
        const next = new Set(prev);
        if (next.has(s)) next.delete(s);
        else next.add(s);
        return next;
      });
    };

    const handleAgentLegToggle = () => {
      if (agentLegStatus === "connecting") return;
      if (agentLegStatus === "disconnected") {
        setAgentLegStatus("connecting");
        setTimeout(() => setAgentLegStatus("connected"), 2000);
      } else {
        setAgentLegStatus("disconnected");
      }
    };

    const agentLegIconMap = {
      disconnected: { icon: <Link2Off className="h-4 w-4" strokeWidth={1.4} />, color: "text-lyra-fg-secondary",          tooltip: "Click to connect"    },
      connecting:   { icon: <Loader2  className="h-4 w-4 animate-spin" strokeWidth={1.4} />, color: "text-lyra-status-warning-strong", tooltip: "Connecting..."       },
      connected:    { icon: <Link2    className="h-4 w-4" strokeWidth={1.4} />, color: "text-lyra-status-success-strong", tooltip: "Click to disconnect" },
    };

    // Clear search when main menu closes. The Connected Apps flyout no
    // longer needs a matching reset — its open state now lives inside
    // Menu's own MenuItemRow (via submenuContent) and unmounts along with
    // the rest of the popover content.
    React.useEffect(() => {
      if (!open) setStatusSearch("");
    }, [open]);

    // Shared between the "Favorites" shortcut section and the "All Codes"
    // list below — every status row gets the same favorite star, including
    // rows inside the Favorites section itself, so a status can be
    // unfavorited from either place.
    const favoriteRightElement = (s: AgentStatus) => (
      <FavoriteButton
        favorited={favoriteStatuses.has(s)}
        onClick={() => toggleFavoriteStatus(s)}
        label={statusConfig[s].label}
        placement="left"
        // Menu's own item root (this row) is already a real <button> —
        // nesting another <button> inside it is invalid HTML with
        // unreliable click bubbling, so this renders as a
        // <span role="button"> instead. Its hover-reveal keys off Menu's
        // `group/item`, not the default `group/row`. See favorite-button.tsx.
        as="span"
        hoverGroup="item"
        className="h-6 w-6"
        // This tooltip's trigger lives inside the z-[10001] status menu
        // panel below, so the default z-[10000] tooltip level would render
        // behind it. See CONTRIBUTING.md §5.
        tooltipClassName="z-[10002]"
      />
    );

    /* Build Menu entries using the Menu component's interface */
    const allStatuses = ["available", "unavailable", "offline"] as AgentStatus[];
    const filteredStatuses = statusSearch.trim()
      ? allStatuses.filter((s) => statusConfig[s].label.toLowerCase().includes(statusSearch.toLowerCase()))
      : allStatuses;

    const noStatusMatch = filteredStatuses.length === 0;
    const favoriteStatusList = filteredStatuses.filter((s) => favoriteStatuses.has(s));

    const menuItems: MenuEntry[] = [
      // Favorites shortcut — only shown once something's been starred, and
      // only lists whatever still matches the active search (so it hides
      // itself naturally when a search excludes every favorite).
      ...(favoriteStatusList.length > 0
        ? [
            { sectionLabel: "Favorites" },
            ...favoriteStatusList.map((s) => ({
              id: `favorite-${s}`,
              label: statusConfig[s].label,
              icon: <StatusIcon status={s} />,
              selected: status === s,
              onClick: () => { onStatusChange?.(s); setOpen(false); },
              rightElement: favoriteRightElement(s),
            })),
            "separator" as const,
          ]
        : []),
      ...(noStatusMatch
        ? [{
            id: "_no-results",
            label: "No matching statuses",
            disabled: true,
            icon: <span className="h-5 w-5" />,
          }]
        : [
            { sectionLabel: `All Codes (${filteredStatuses.length})` },
            ...filteredStatuses.map((s) => ({
              id: s,
              label: statusConfig[s].label,
              icon: <StatusIcon status={s} />,
              selected: status === s,
              onClick: () => { onStatusChange?.(s); setOpen(false); },
              rightElement: favoriteRightElement(s),
            })),
          ]),
      "separator" as const,
      {
        id: "dark-mode",
        label: isDarkMode ? "Light Mode" : "Dark Mode",
        icon: isDarkMode
          ? <Sun  className="h-4 w-4" strokeWidth={1.5} />
          : <Moon className="h-4 w-4" strokeWidth={1.5} />,
        onClick: onDarkModeToggle,
      },
      {
        id: "connected-apps",
        label: "Connected Apps",
        icon: <Activity className="h-4 w-4" strokeWidth={1.5} />,
        // Submenu hover/click-to-open, portal-to-body, and viewport-edge
        // flip positioning are all handled by Menu itself (same mechanism
        // as a regular `submenu`) — this just supplies the rich panel
        // content instead of a flat list of menu items.
        submenuContent: <ConnectedAppsPanel apps={connectedApps} onReconnect={handleReconnect} />,
        rightElement: (
          issueCount > 0 ? (
            <Tooltip content={`${issueCount} app${issueCount > 1 ? "s" : ""} not fully connected`} placement="left" className="z-[10002]">
              <span>
                <StatusBadge variant="warning" size="sm">{connectedApps.length}</StatusBadge>
              </span>
            </Tooltip>
          ) : connectedApps.length > 0 ? (
            <StatusBadge variant="success" size="sm">{connectedApps.length}</StatusBadge>
          ) : (
            <StatusBadge variant="neutral" size="sm">0</StatusBadge>
          )
        ),
      },
      {
        id: "agent-leg",
        label: agentLegStatus === "connected" ? "Agent Leg Connected" : agentLegStatus === "connecting" ? "Agent Leg Connecting…" : "Agent Leg Disconnected",
        icon: (
          <Tooltip content={agentLegIconMap[agentLegStatus].tooltip} placement="left" className="z-[10002]">
            <span className={cn("flex items-center", agentLegIconMap[agentLegStatus].color)}>
              {agentLegIconMap[agentLegStatus].icon}
            </span>
          </Tooltip>
        ),
        onClick: handleAgentLegToggle,
      },
      // Only shown when `onHelpClick` is actually passed — see that prop's
      // own doc comment ("shows a 'Help' row ... when provided"). Was
      // previously added unconditionally regardless of whether a handler
      // existed, which put a dead "Help" row in every consumer's status
      // menu. `agent-next-gen-v1` had briefly added its own standalone "?"
      // AppHeader icon instead of using this prop, then moved back to this
      // row per user request (screenshot of the status dropdown, asked for
      // "Help" below "Agent Leg Disconnected" — exactly this row's position).
      // `AgentNextGenTemplate.stories.tsx` and `lyra-ux-templates` don't
      // currently pass `onHelpClick` at all (no Help entry point in either
      // right now) — flagging, not fixing, since this request was scoped to
      // `agent-next-gen-v1` only.
      ...(onHelpClick
        ? [{
            id: "help",
            label: "Help",
            icon: <CircleHelp className="h-4 w-4" strokeWidth={1.5} />,
            onClick: onHelpClick,
          }]
        : []),
      "separator" as const,
      {
        id: "logout",
        label: "Log Out",
        icon: <LogOut className="h-4 w-4" strokeWidth={1.5} />,
        onClick: onLogOut,
        destructive: true,
      },
    ];

    return (
      <div ref={ref} className={className}>
        <Tooltip content="Agent Status and More" placement="bottom" asLabel>
          {/* Wrap the whole Popover (not just its trigger) in a plain span —
              Tooltip's own Trigger clones its hover/focus props onto its
              immediate child via Radix Slot, which only works on a plain
              DOM element or another Slot-forwarding component. Popover
              itself doesn't forward arbitrary cloned props to its internals,
              so it has to sit *inside* the span, not be the span's stand-in.
              Same pattern as the advanced-search Popover+Tooltip combo in
              table.tsx. */}
          <span className="inline-flex">
            <Popover
              ref={contentRef}
              open={open}
              onOpenChange={setOpen}
              placement="bottom"
              align="end"
              sideOffset={6}
              showArrow={false}
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                // Focus the search input instead
                setTimeout(() => contentRef.current?.querySelector<HTMLInputElement>("input")?.focus(), 0);
              }}
              onInteractOutside={(e) => {
                // The Connected Apps submenu (rendered by Menu via
                // submenuContent) is portaled to document.body, outside this
                // popover's own DOM subtree — without this it would register
                // as an "outside" click and close the whole status menu the
                // moment someone clicks reconnect on an app.
                if ((e.target as HTMLElement)?.closest('[data-menu-submenu-for="connected-apps"]')) e.preventDefault();
              }}
              className={cn(
                /* "md" on the Menu/Popover width scale (CONTRIBUTING.md) —
                   a search row above the list warrants one step above sm. */
                "z-[10001] w-64"
              )}
              content={
                // Radix's avoidCollisions (on by default) only repositions
                // the popover — it flips/shifts to whichever side has more
                // room, it never shrinks the content. With the trigger near
                // a screen edge and a variable-length list (Favorites can
                // make this tall), nothing capped the height, so it could
                // run off the viewport with no way to scroll to the rest.
                // --radix-popper-available-height is the space Radix
                // actually computed as free, live-updated as it repositions
                // — capping total height to it and making just the list
                // scroll (search stays pinned) keeps this on-screen no
                // matter how many favorites/statuses there are.
                <div className="flex flex-col" style={{ maxHeight: "var(--radix-popper-available-height, 400px)" }}>
                  {/* Search statuses */}
                  <div className="px-3 py-2.5 border-b border-lyra-border-subtle flex-shrink-0">
                    <Input
                      type="text"
                      placeholder="Search statuses"
                      value={statusSearch}
                      onChange={(e) => setStatusSearch(e.target.value)}
                      startIcon={<Search className="h-4 w-4 text-lyra-fg-disabled" strokeWidth={1.4} aria-hidden="true" />}
                    />
                  </div>

                  {/* Menu — uses the existing Menu component for consistent styling */}
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <Menu
                      items={menuItems}
                      className="border-0 shadow-none rounded-none rounded-b-lyra-lg bg-transparent"
                    />
                  </div>
                </div>
              }
            >
              <button
                type="button"
                aria-label="Agent Status and More"
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lyra-lg hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
              >
                <Avatar initials={initials} src={avatarSrc} status={status} />
                <div className="flex flex-col items-start min-w-0">
                  <span className={cn("lyra-label leading-tight", statusConfig[status].textColor)}>{statusConfig[status].label}</span>
                  {timer && <span className={cn("lyra-body-sm tabular-nums", statusConfig[status].textColor)}>{timer}</span>}
                </div>
                <ChevronDown className={cn("h-4 w-4 text-lyra-fg-secondary shrink-0 transition-transform duration-200", open && "rotate-180")} strokeWidth={1.5} />
              </button>
            </Popover>
          </span>
        </Tooltip>
      </div>
    );
  }
);
AgentProfile.displayName = "AgentProfile";

export { AgentProfile };
