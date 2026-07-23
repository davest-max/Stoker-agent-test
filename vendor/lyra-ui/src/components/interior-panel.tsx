import * as React from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PanelHeader } from "./panel-header";
import { PanelContent } from "./panel-content";
import { PanelFooter } from "./panel-footer";
import { usePanelDragResize } from "./use-panel-drag-resize";
import { cn } from "../lib/utils";

/* ── InteriorPanel ──
   The inline detail/properties panel that lives BELOW the page header,
   inside the main container (e.g. the record-details panel in
   admin-shell.tsx's "interior panels row"). Always inline and resizable;
   opened via a click/trigger elsewhere in the main container (a button, a
   row select, etc. — there's no hover-to-open concept here, unlike
   `SidePanel`). Below ~1050px of its parent container's width it switches
   to an absolute overlay instead of squeezing the content column further.

   This is one of exactly two panel types in the design system — the other
   being `SidePanel` (over the page header, hover/pin, left or right).
   They're deliberately separate components with different behavior, not
   one component switching on a `variant` prop — a prior unified `Panel`
   (`variant="side" | "interior"`) caused enough confusion between the two
   that it was split back into these two.

   Also distinct from `Draggable`/`DraggablePanel` (float/dockable overlay
   shells for things like the AI panel or notifications dropdown) — those
   aren't part of the app shell's side/interior panel system at all, see
   draggable.tsx. */

export interface InteriorPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which edge of the main container the panel is docked to (default: "right") */
  side?: "left" | "right";
  /** Whether the panel is open (default: true) */
  open?: boolean;
  /** Called when the header's close (×) button is clicked */
  onClose?: () => void;

  /** Allow drag-to-resize on the panel's leading border (default: true) */
  resizable?: boolean;
  /** Min width when resizing, px (default: 200) */
  minWidth?: number;
  /** Max width when resizing, px (default: 425) */
  maxWidth?: number;
  /** Fired when a resize drag starts (true) or ends (false) */
  onResizeStateChange?: (isResizing: boolean) => void;
  /** Fired whenever the width changes during a drag */
  onWidthChange?: (width: number) => void;
  /** Width in px (default: 340) */
  width?: number;

  headerTitle?: string;
  /** Optional line below `headerTitle`, e.g. a record's name + id */
  headerSubhead?: string;
  headerIcon?: React.ReactNode;
  headerActions?: React.ReactNode;

  footer?: React.ReactNode;
}

const InteriorPanel = React.forwardRef<HTMLDivElement, InteriorPanelProps>(
  (
    {
      className,
      side = "right",
      open = true,
      onClose,
      resizable = true,
      minWidth = 200,
      maxWidth = 425,
      onResizeStateChange,
      onWidthChange,
      width = 340,
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

    // Keep border visible during the close animation so it doesn't snap away
    const [isClosing, setIsClosing] = useState(false);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => {
      if (!open) {
        setIsClosing(true);
        closeTimerRef.current = setTimeout(() => setIsClosing(false), 260);
      } else {
        clearTimeout(closeTimerRef.current);
        setIsClosing(false);
      }
      return () => clearTimeout(closeTimerRef.current);
    }, [open]);

    /* ── Go absolute/overlay when the parent container is < 1050px, instead
       of squeezing the main content column further ── */
    const outerRef = useRef<HTMLDivElement>(null);
    const [parentWidth, setParentWidth] = useState(9999);
    const isNarrow = parentWidth < 1050;

    const stableOuterRef = useCallback((el: HTMLDivElement | null) => {
      (outerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useLayoutEffect(() => {
      const el = outerRef.current?.parentElement;
      if (!el) return;
      setParentWidth(el.getBoundingClientRect().width);
      const ro = new ResizeObserver(([entry]) => setParentWidth(entry.contentRect.width));
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const dragHandle = resizable && open ? (
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
              actions={headerActions}
              onClose={onClose}
              bordered={false}
            />
          )}
          <PanelContent>{children}</PanelContent>
          {footer && <PanelFooter>{footer}</PanelFooter>}
        </div>
      </div>
    );

    // Keep border visible during close animation so it doesn't snap away
    const border = (open || isClosing)
      ? (side === "right" ? "border-l border-lyra-border-subtle" : "border-r border-lyra-border-subtle")
      : "";
    const interiorWidth = open ? currentWidth : 0;
    const pos = side === "right" ? "right-0" : "left-0";

    // Narrow: overlay like an unpinned side panel instead of pushing content full-width
    if (isNarrow) {
      return (
        <div
          ref={stableOuterRef}
          className={cn("absolute top-0 z-[5] h-full overflow-hidden bg-lyra-bg-surface-overlay shadow-lg", pos, border, className)}
          style={{ width: interiorWidth, transition: widthTransition }}
          {...props}
        >
          {inner}
        </div>
      );
    }

    return (
      <div
        ref={stableOuterRef}
        className={cn("relative flex flex-col h-full bg-lyra-bg-surface-overlay shrink-0", border, className)}
        style={{
          width: interiorWidth,
          minWidth: 0,
          overflow: "hidden",
          transition: widthTransition,
        }}
        {...props}
      >
        {/* Left-side interior: align content to right edge during animation */}
        {side === "left"
          ? <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: currentWidth, minWidth: currentWidth }}>{inner}</div>
          : inner
        }
      </div>
    );
  }
);
InteriorPanel.displayName = "InteriorPanel";

export { InteriorPanel };
