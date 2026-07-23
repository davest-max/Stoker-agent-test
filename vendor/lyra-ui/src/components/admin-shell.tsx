import { useState, useCallback, useRef, useEffect } from "react";
import { SidePanel } from "./side-panel";
import { InteriorPanel } from "./interior-panel";
import { PageHeader } from "./page-header";
import { TreeMenu, type TreeMenuItem } from "./tree-menu";
import { cn } from "../lib/utils";

/* ── Cookie helpers (left-panel pinned state only — mirrors the pattern
   already used by OutboundEngagementPage / DesktopDesignsPage) ── */
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
}
function readBoolCookie(name: string, fallback: boolean): boolean {
  const val = getCookie(name);
  if (val === "true") return true;
  if (val === "false") return false;
  return fallback;
}

export interface AdminShellProps {
  /** Cookie key prefix for the left panel's pinned state, e.g. "lyra_outbound" or "lyra_panel". */
  storageKeyPrefix: string;
  /** Label shown in both side panels' header (e.g. "Outbound", "Designer"). */
  navTitle: string;
  /** Left nav tree items. */
  navItems: TreeMenuItem[];
  /** Pinned state to fall back to before the cookie is read. */
  defaultLeftPinned?: boolean;

  /** Renders the PageHeader row. Off for the bare "Shell" template. */
  showPageHeader?: boolean;
  pageTitle?: string;
  pageChip?: string;
  pageActions?: React.ReactNode;

  /**
   * Interior (in-content) detail panel. Left fully controlled by the
   * consumer since it's usually opened from inside `children` (e.g. a
   * TableToolbar button) rather than by the shell itself.
   */
  interiorPanelTitle?: string;
  interiorPanelOpen?: boolean;
  onInteriorPanelClose?: () => void;
  interiorPanelContent?: React.ReactNode;

  /** Right side panel content — mirrors the left nav panel. */
  rightPanelContent?: React.ReactNode;

  /** Main content, rendered below the PageHeader. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * AdminShell — shared page template for admin-style CRUD/config screens
 * (left nav-tree side panel, PageHeader, main content, interior detail
 * panel, right side panel). Extracted from the Outbound Engagement page;
 * also used by Agent Workspace Premium's Designer page.
 *
 * See Storybook: "Templates/Admin UIs".
 */
export function AdminShell({
  storageKeyPrefix,
  navTitle,
  navItems,
  defaultLeftPinned = false,
  showPageHeader = false,
  pageTitle,
  pageChip,
  pageActions,
  interiorPanelTitle = "Details",
  interiorPanelOpen = false,
  onInteriorPanelClose,
  interiorPanelContent,
  rightPanelContent,
  children,
  className,
}: AdminShellProps) {
  const pinCookieKey = `${storageKeyPrefix}_panel_pinned`;
  const mainRef = useRef<HTMLElement>(null);

  /* ── Container-width pin guard ──
     Measures this shell's own rendered width (not window.innerWidth) so
     pinning is correctly disabled any time the available space is narrow —
     whether that's a narrow browser window, a narrow Storybook canvas, or
     the content area having shrunk because something else (e.g. a docked
     AI panel) is eating width while the window itself stays wide. Mirrors
     the `isNarrowContainer` pattern used by the Agent Next Gen template. */
  const [containerWidth, setContainerWidth] = useState(9999);
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const isNarrowContainer = containerWidth < 1024;

  /* ── Left side panel ── */
  const [leftPanelPinned, setLeftPanelPinned] = useState(() => readBoolCookie(pinCookieKey, defaultLeftPinned));
  const [leftPanelOpen, setLeftPanelOpen] = useState(() => readBoolCookie(pinCookieKey, defaultLeftPinned));
  const effectiveLeftPinned = isNarrowContainer ? false : leftPanelPinned;
  const leftHoverTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleLeftToggle = useCallback(() => {
    if (effectiveLeftPinned) setLeftPanelOpen((v) => !v);
  }, [effectiveLeftPinned]);

  const handleLeftHoverStart = useCallback(() => {
    if (!effectiveLeftPinned) { clearTimeout(leftHoverTimeout.current); setLeftPanelOpen(true); }
  }, [effectiveLeftPinned]);

  const handleLeftHoverEnd = useCallback(() => {
    if (!effectiveLeftPinned) { leftHoverTimeout.current = setTimeout(() => setLeftPanelOpen(false), 300); }
  }, [effectiveLeftPinned]);

  const handleLeftPinToggle = useCallback(() => {
    setLeftPanelPinned((prev) => {
      const next = !prev;
      setCookie(pinCookieKey, String(next));
      setLeftPanelOpen(next);
      return next;
    });
  }, [pinCookieKey]);

  /* ── Right side panel ── */
  const [rightSidePanelOpen, setRightSidePanelOpen] = useState(false);
  const [rightSidePanelPinned, setRightSidePanelPinned] = useState(false);
  const effectiveRightPinned = isNarrowContainer ? false : rightSidePanelPinned;
  const rightHoverTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleRightHoverStart = useCallback(() => {
    if (!effectiveRightPinned) { clearTimeout(rightHoverTimeout.current); setRightSidePanelOpen(true); }
  }, [effectiveRightPinned]);

  const handleRightHoverEnd = useCallback(() => {
    if (!effectiveRightPinned) { rightHoverTimeout.current = setTimeout(() => setRightSidePanelOpen(false), 300); }
  }, [effectiveRightPinned]);

  const handleRightPinToggle = useCallback(() => {
    setRightSidePanelPinned((prev) => { const next = !prev; setRightSidePanelOpen(next); return next; });
  }, []);

  return (
    <main ref={mainRef} className={cn("flex flex-1 overflow-hidden bg-lyra-bg-surface-base relative animate-in fade-in-0 duration-500", className)}>

      {/* ════ Left side panel ════
          z-[8] sits between the interior panel's z-[5] and the app-level
          icon LeftNav's z-10 chevron toggle / z-20 hover-open overlay
          (see left-nav.tsx): high enough that this panel still stacks above
          the interior detail panel when both are overlays at once, but low
          enough that it never covers the icon rail's own toggle affordance. */}
      <SidePanel
        side="left"
        open={leftPanelOpen}
        pinned={effectiveLeftPinned}
        headerTitle={navTitle}
        onPinToggle={isNarrowContainer ? undefined : handleLeftPinToggle}
        onMouseEnter={!effectiveLeftPinned ? handleLeftHoverStart : undefined}
        onMouseLeave={!effectiveLeftPinned ? handleLeftHoverEnd : undefined}
        className="z-[8]"
      >
        <TreeMenu className="px-2" items={navItems} />
      </SidePanel>

      {/* ════ Main content column ════ */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* ════ Page Header ════ */}
        {showPageHeader && (
          <PageHeader
            title={pageTitle ?? ""}
            panelToggle="left"
            chip={pageChip}
            panelPinned={effectiveLeftPinned}
            onPanelToggle={handleLeftToggle}
            onPanelHoverStart={!effectiveLeftPinned ? handleLeftHoverStart : undefined}
            onPanelHoverEnd={!effectiveLeftPinned ? handleLeftHoverEnd : undefined}
            onInnerPanelHoverStart={!effectiveRightPinned ? handleRightHoverStart : undefined}
            onInnerPanelHoverEnd={!effectiveRightPinned ? handleRightHoverEnd : undefined}
            actions={pageActions}
          />
        )}

        {/* ════ Interior panels row ════
            `relative` here (not just on the outer `<main>`) matters:
            `InteriorPanel` switches to `position: absolute; top: 0; height:
            100%` below 1050px of this row's width, and without a positioned
            ancestor of its own it anchors to `<main>` instead — which
            starts at the same top edge as the PageHeader, so the panel
            renders over the header instead of below it. Scoping the
            positioned ancestor to this row keeps it confined to the area
            below the PageHeader. */}
        <div className="relative flex flex-1 min-h-0 overflow-hidden">

          {/* ════ Main content column ════ */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {children}
          </div>

          {/* Interior right panel */}
          {interiorPanelContent !== undefined && (
            <InteriorPanel
              side="right"
              open={interiorPanelOpen}
              headerTitle={interiorPanelTitle}
              onClose={onInteriorPanelClose}
            >
              {interiorPanelContent}
            </InteriorPanel>
          )}

        </div>
      </div>

      {/* ════ Right side panel ════ */}
      {rightPanelContent !== undefined && (
        <SidePanel
          side="right"
          open={rightSidePanelOpen}
          pinned={effectiveRightPinned}
          headerTitle={navTitle}
          onPinToggle={isNarrowContainer ? undefined : handleRightPinToggle}
          onMouseEnter={!effectiveRightPinned ? handleRightHoverStart : undefined}
          onMouseLeave={!effectiveRightPinned ? handleRightHoverEnd : undefined}
        >
          {rightPanelContent}
        </SidePanel>
      )}

    </main>
  );
}
