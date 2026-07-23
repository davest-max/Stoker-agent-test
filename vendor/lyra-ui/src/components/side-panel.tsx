import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PanelHeader } from "./panel-header";
import { PanelContent } from "./panel-content";
import { PanelPinButton } from "./panel-pin-button";
import { usePanelDragResize } from "./use-panel-drag-resize";
import { cn } from "../lib/utils";

/* ── SidePanel ──
   The navigation/tool panel that lives OVER the page header, on the left or
   right edge of the app shell (e.g. the "Designer"/record-context panel in
   admin-shell.tsx). Two states:

     - unpinned (default) — floats as a hover overlay above the page header
       (`position: absolute`, elevated z-index, drop shadow). Doesn't push
       or resize the page content.
     - pinned — sits inline, pushing the main content column over. Toggled
       via the pin button (rendered when `onPinToggle` is passed).

   Opening on hover is a convention this component enables rather than
   manages itself: `open` is a controlled prop, and the native
   `onMouseEnter`/`onMouseLeave` handlers (inherited from
   `HTMLAttributes<HTMLDivElement>`) are how a consumer wires up "open on
   hover, close after a short delay" — see Panel.stories.tsx's "Side Panel —
   Left/Right" stories, or admin-shell.tsx, for the reference pattern. This
   keeps hover-timing/debounce policy with the app, not baked into the
   component.

   This is one of exactly two panel types in the design system — the other
   being `InteriorPanel` (inline, below the page header, click/trigger-
   opened). They're deliberately separate components with different
   behavior, not one component switching on a `variant` prop — a prior
   unified `Panel` (`variant="side" | "interior"`) caused enough confusion
   between the two that it was split back into these two.

   Also distinct from `Draggable`/`DraggablePanel` (float/dockable overlay
   shells for things like the AI panel or notifications dropdown) — those
   aren't part of the app shell's side/interior panel system at all, see
   draggable.tsx. */

export interface SidePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which edge of the layout the panel is docked to (default: "right") */
  side?: "left" | "right";
  /** Whether the panel is open (default: true) */
  open?: boolean;
  /**
   * Pinned = inline, pushes content. Unpinned = hover overlay above the
   * page header. Defaults to `false` (unpinned) — only start a side panel
   * pinned when a specific prototype calls for it.
   */
  pinned?: boolean;
  /** Renders a pin/unpin button in the header when provided */
  onPinToggle?: () => void;

  /** Allow drag-to-resize on the panel's inner edge (default: true) */
  resizable?: boolean;
  /** Min width when resizing, px (default: 200) */
  minWidth?: number;
  /** Max width when resizing, px (default: 425) */
  maxWidth?: number;
  /** Fired when a resize drag starts (true) or ends (false) */
  onResizeStateChange?: (isResizing: boolean) => void;
  /** Fired whenever the width changes during a drag */
  onWidthChange?: (width: number) => void;
  /** Width in px (default: 256) */
  width?: number;

  headerTitle?: string;
  /** Optional line below `headerTitle`, e.g. a record's name + id */
  headerSubhead?: string;
  headerIcon?: React.ReactNode;
  headerActions?: React.ReactNode;

  footer?: React.ReactNode;
}

const SidePanel = React.forwardRef<HTMLDivElement, SidePanelProps>(
  (
    {
      className,
      side = "right",
      open = true,
      pinned = false,
      onPinToggle,
      resizable = true,
      minWidth = 200,
      maxWidth = 425,
      onResizeStateChange,
      onWidthChange,
      width = 256,
      headerTitle,
      headerSubhead,
      headerIcon,
      headerActions,
      footer,
      children,
      ...props
    },
    ref
  ) => {
    const [isResizing, setIsResizing] = useState(false);
    const handleResizeStateChange = useCallback((r: boolean) => {
      setIsResizing(r);
      onResizeStateChange?.(r);
    }, [onResizeStateChange]);
    const { width: currentWidth, onMouseDown } = usePanelDragResize(
      side, width, minWidth, maxWidth, handleResizeStateChange, onWidthChange
    );
    const widthTransition = isResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)";

    const pinButton = onPinToggle ? (
      <PanelPinButton pinned={pinned} onToggle={onPinToggle} />
    ) : null;

    const dragHandle = resizable ? (
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 bottom-0 z-10 flex items-center justify-center group"
        style={{ [side === "right" ? "left" : "right"]: -4, width: 8, cursor: "col-resize" }}
        aria-hidden="true"
      >
        <div className="w-0.5 h-8 rounded-full bg-lyra-border-default opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    ) : null;

    const inner = (
      <div
        className="relative flex flex-col h-full"
        style={{ width: currentWidth, minWidth: currentWidth }}
      >
        {dragHandle}
        {/* Snap content invisible on close (no squish); fade in on open */}
        <div
          className="flex flex-col flex-1 min-h-0"
          style={{
            opacity: open ? 1 : 0,
            visibility: open ? "visible" : "hidden",
            transition: open ? "opacity 150ms ease 30ms" : "none",
          }}
        >
          {headerTitle && (
            <PanelHeader
              title={headerTitle}
              subhead={headerSubhead}
              icon={headerIcon}
              actions={<>{headerActions}{pinButton}</>}
              bordered={false}
            />
          )}
          <PanelContent>{children}</PanelContent>
          {footer && <div className="shrink-0">{footer}</div>}
        </div>
      </div>
    );

    const border = side === "left" ? "border-r border-lyra-border-subtle" : "border-l border-lyra-border-subtle";

    /* ── Pinned: inline, pushes content ── */
    if (pinned) {
      return (
        <div
          ref={ref}
          role="region"
          aria-label={headerTitle || "Side panel"}
          className={cn("shrink-0 overflow-hidden bg-lyra-bg-surface-container-subtle", open && border, className)}
          style={{ width: open ? currentWidth : 0, transition: widthTransition }}
          {...props}
        >
          {inner}
        </div>
      );
    }

    /* ── Unpinned: hover overlay above the page header ── */
    const pos = side === "left" ? "left-0" : "right-0";
    return (
      <div
        ref={ref}
        role="region"
        aria-label={headerTitle || "Side panel"}
        className={cn("absolute top-0 z-[5] h-full overflow-hidden bg-lyra-bg-surface-container-subtle shadow-lg", pos, open ? border : "pointer-events-none", className)}
        style={{ width: open ? currentWidth : 0, transition: widthTransition }}
        {...props}
      >
        {inner}
      </div>
    );
  }
);
SidePanel.displayName = "SidePanel";

export { SidePanel };
