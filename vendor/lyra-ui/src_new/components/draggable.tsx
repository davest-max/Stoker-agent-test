import * as React from "react";
import { GripVertical, PanelRight, Move } from "lucide-react";
import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";

/* ── Not a panel ─────────────────────────────────────────────────────────
   `Draggable` is a generic float/dock-and-resize shell (used to build
   things like `DraggablePanel`, the AI panel, the notifications dropdown)
   — it is NOT one of the two design-system panel types and shouldn't be
   confused with either of them:

     - `SidePanel`     — over the page header, hover/pin, left or right.
     - `InteriorPanel` — below the page header, inline, click-triggered,
                          left or right.

   The comments below use the word "panel" a lot in the generic/lowercase
   sense (the floating window this component drags/resizes), not as a
   reference to `SidePanel`/`InteriorPanel`. ── */

/* ── Panel Resize Direction Rules ─────────────────────────────────────────
 *
 *  FLOAT mode — bottom-right corner handle
 *    • Left edge is ANCHORED (fixed CSS `left` position stored in a ref).
 *    • Resizing always grows the RIGHT edge rightward.
 *    • The `floatLeft` ref MUST be set when the panel opens and cleared when
 *      it closes so that the `left` style value does NOT recalculate on every
 *      render as `width` changes (which would move the left edge leftward and
 *      make the panel appear to resize in the wrong direction).
 *    • Rule: anchor floatLeft.current = containerWidth - panelWidth - margin
 *      on open; reset to null on close; update on variant change (dock→float).
 *
 *  DOCKED mode — left edge handle
 *    • Right edge is fixed at the viewport/container boundary.
 *    • Dragging the left edge LEFTWARD grows the panel (into the content area).
 *    • Dragging RIGHTWARD shrinks the panel.
 *    • This is the correct natural behavior for a right-docked panel.
 *
 * ── Panel Open / Close Animation Rules ────────────────────────────────────
 *
 *  All panels and dropdowns in the design system use the same data-state
 *  animation pattern driven by tailwindcss-animate utility classes.
 *
 *  Standard classes (apply to the outermost wrapper div of the panel):
 *    open:   animate-in fade-in-0 slide-in-from-top-2 duration-150
 *    close:  data-[state=closed]:animate-out data-[state=closed]:fade-out-0
 *            data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-100
 *
 *  data-state attribute:
 *    • Set to "open" or "closed" on the wrapper div.
 *    • Driven by a `visible` state variable that is toggled to false IMMEDIATELY
 *      when the panel closes — this triggers the CSS animate-out before removal.
 *    • A separate `mounted` state variable stays true for 300 ms after close
 *      (via setTimeout) to keep the element in the DOM long enough for the
 *      animate-out to complete before unmounting.
 *    • `visible` → false immediately on close (triggers CSS close animation)
 *    • `mounted` → false after 300 ms (removes element from DOM)
 *
 *  Float panels:
 *    • Apply all open AND close classes (slide-in/slide-out from top).
 *    • data-state={visible ? "open" : "closed"}
 *
 *  Docked panels:
 *    • The width wrapper already provides a slide effect via CSS width transition.
 *    • Apply only fade-in/fade-out to the inner content wrapper (no slide).
 *    • data-state={visible ? "open" : "closed"}
 *
 * ── Multi-Panel Z-Index & Docking Rules ──────────────────────────────────
 *
 *  Z-INDEX (float mode only)
 *    • The most recently opened or clicked panel gets z-index: 10000.
 *    • Other float panels get z-index: 9999.
 *    • Track with `topPanel` state in the parent; attach onMouseDown to float wrapper.
 *
 *  SINGLE-DOCK RULE
 *    • Only one panel may be docked at a time.
 *    • When a second panel docks, force the current docked panel back to float.
 *    • Reset the displaced panel's floatLeft ref to containerWidth - panelWidth - 16.
 *    • Requires variant prop to be synced into internal state via useEffect so the
 *      parent can force a variant change externally.
 *
 * ── Viewport Containment ──────────────────────────────────────────────────
 *
 *  The panel's box must always stay fully inside the browser viewport — no
 *  edge may be dragged or resized past `window.innerWidth`/`innerHeight` (or
 *  before 0). This is enforced entirely inside this component, using the
 *  panel's own `getBoundingClientRect()` at the moment a drag/resize starts
 *  as the reference frame — it does NOT depend on how a consumer positions
 *  the float wrapper (fixed/absolute, floatLeft/floatTop refs, etc.), so no
 *  changes are needed in any consuming app.
 *
 *  • Float drag — `onDragMouseDown` captures the panel's un-offset base
 *    position (`rect.left/top - current offset`) at drag start, then clamps
 *    every subsequent offset so `base + offset` stays within
 *    `[0, viewport - panelSize]` on both axes.
 *  • Float corner resize — `onCornerResizeDown` captures the panel's fixed
 *    top/left at resize start, then caps the new width/height so the
 *    (fixed) top-left corner plus the (growing) size never exceeds the
 *    viewport's right/bottom edge.
 *  • Docked left-edge resize — the right edge is already pinned by the
 *    consumer's flex layout, so only the left edge can leave the viewport;
 *    `onLeftEdgeResizeDown` caps the new width so the left edge never goes
 *    past `x = 0`.
 *  • Browser window resize (no active drag/resize) — none of the above
 *    handlers fire just because the window shrinks; a `window` `resize`
 *    listener covers that case too:
 *      – Docked: sibling elements (nav rail, content column) get squeezed
 *        by the browser's own flex layout *before* this listener runs, so
 *        `rootRef.current.getBoundingClientRect()` at that point already
 *        reflects their final squeezed size. If the panel's measured right
 *        edge now exceeds `window.innerWidth`, shrink `width` by exactly
 *        that overflow (floored at `minWidth`) and call `onWidthChange` —
 *        the same callback the consumer already uses to mirror width into
 *        its own flex-sibling wrapper for manual resize, so the wrapper
 *        shrinks too with no consumer-side changes needed.
 *      – Float: re-clamp `offset` the same way `onDragMouseDown` does, and
 *        shrink `width`/`height` if the panel itself is now bigger than the
 *        shrunk viewport.
 *  • Responsive max-width — below a 1440px viewport width, the effective
 *    width cap tightens to 800px (or the `maxWidth` prop, whichever is
 *    smaller — `getResponsiveMaxWidth` below). Applied everywhere `maxWidth`
 *    is consulted: float corner-resize, docked left-edge resize, and the
 *    window-resize listener, which also proactively shrinks an
 *    already-wider panel down to the tightened cap even without a
 *    resize-driven overflow (the same "shrink on window resize" mechanism
 *    used for plain viewport overflow above). Like the rest of viewport
 *    containment, this only ever shrinks — sizing the window back up past
 *    1440px does not grow the panel back to its pre-shrink width.
 *
 * ─────────────────────────────────────────────────────────────────────── */

/** Breakpoint and cap for the responsive max-width rule above. */
const RESPONSIVE_MAX_WIDTH_BREAKPOINT = 1440;
const RESPONSIVE_MAX_WIDTH_CAP = 800;

/** Tightens `maxWidth` to `RESPONSIVE_MAX_WIDTH_CAP` once the viewport drops
 *  below `RESPONSIVE_MAX_WIDTH_BREAKPOINT` — otherwise returns `maxWidth`
 *  unchanged. Reads `window.innerWidth` live (not memoized) since every call
 *  site already runs inside an event handler, after a resize/mousemove. */
function getResponsiveMaxWidth(maxWidth: number): number {
  if (typeof window === "undefined") return maxWidth;
  return window.innerWidth < RESPONSIVE_MAX_WIDTH_BREAKPOINT
    ? Math.min(maxWidth, RESPONSIVE_MAX_WIDTH_CAP)
    : maxWidth;
}

/* ── Types ── */

export type DraggableVariant = "float" | "docked";

/** Props passed to renderHeaderControls so the consumer can inline grip + dock. */
export interface DraggableHeaderControls {
  /** Spread onto a draggable handle element (float mode only — noop in docked). */
  gripProps: {
    onMouseDown: React.MouseEventHandler<HTMLElement>;
    "aria-hidden": true;
    className: string;
  };
  /** Spread onto the dock/undock button. */
  dockButtonProps: {
    type: "button";
    onClick: () => void;
    "aria-label": string;
    className: string;
  };
  /** Current icon for the dock button (already correct for the active variant). */
  dockIcon: React.ReactNode;
  /** Current variant — lets the consumer conditionally render the grip. */
  variant: DraggableVariant;
}

export interface DraggableProps {
  children: React.ReactNode;
  /** "float" — freely draggable. "docked" — pinned to right edge. */
  variant?: DraggableVariant;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  /** Caps both float resize and docked width-resize (default: 1024 — override per-instance if a panel genuinely needs to go wider/narrower). */
  maxWidth?: number;
  minHeight?: number;
  /** Called when variant changes via the dock toggle button */
  onVariantChange?: (variant: DraggableVariant) => void;
  /**
   * When provided, Draggable skips its built-in overlay and calls this instead,
   * passing grip + dock props so the consumer can place them inside its own header.
   * When used, the automatic pl-7 padding on the first child is also suppressed.
   */
  renderHeaderControls?: (controls: DraggableHeaderControls) => React.ReactNode;
  /** Hide the built-in grip/dock header controls (use when the consumer renders them inline) */
  showHeaderControls?: boolean;
  /** Prevent the variant from being toggled via the header button */
  lockVariant?: boolean;
  /** Called when width changes via resize */
  onWidthChange?: (width: number) => void;
  /** Called when resize drag starts/ends */
  onResizeStateChange?: (resizing: boolean) => void;
  /**
   * Called on any mousedown inside the panel root.
   * Use this in the parent to implement "bring to front" z-index management.
   * Prefer this over onMouseDown on the float wrapper div — the wrapper's layout
   * box stays at the original position when the panel is dragged via CSS transform,
   * creating an invisible ghost hit area. The Draggable root div follows the transform.
   */
  onInteract?: () => void;
  className?: string;
}

/* ── Component ── */

const Draggable = React.forwardRef<HTMLDivElement, DraggableProps>(
  ({
    children,
    variant: variantProp  = "float",
    defaultWidth          = 320,
    defaultHeight         = 480,
    minWidth              = 280,
    maxWidth              = 1024,
    minHeight             = 200,
    onVariantChange,
    renderHeaderControls,
    showHeaderControls = true,
    lockVariant = false,
    onWidthChange,
    onResizeStateChange,
    onInteract,
    className,
  }, ref) => {
    const [variant, setVariant] = React.useState<DraggableVariant>(variantProp);
    const [offset,  setOffset]  = React.useState({ x: 0, y: 0 });
    const [width,   setWidth]   = React.useState(defaultWidth);
    const [height,  setHeight]  = React.useState(defaultHeight);

    // Sync variant when parent changes the prop (e.g. forced float by single-dock rule)
    React.useEffect(() => { setVariant(variantProp); }, [variantProp]);

    // Sync when defaultHeight changes (e.g. viewport resize)
    React.useEffect(() => { setHeight(defaultHeight); }, [defaultHeight]);

    const dragStart   = React.useRef<{ mx: number; my: number; ox: number; oy: number; baseLeft: number; baseTop: number } | null>(null);
    const resizeStart = React.useRef<{ mx: number; my: number; w: number; h: number; left: number; top: number } | null>(null);

    // Local ref for measuring the panel's own on-screen position (viewport
    // containment needs this regardless of how a consumer positions the
    // float wrapper) — merged with any ref the consumer passed in.
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const setRootRef = (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };

    // Always-current snapshot for the window-resize listener below — written
    // on every render (not inside an effect) so the listener, which mounts
    // once, never reads stale values without needing to re-subscribe on
    // every offset/width change during a drag.
    const latestRef = React.useRef({ variant, offset, width, height, minWidth, maxWidth, minHeight, onWidthChange });
    latestRef.current = { variant, offset, width, height, minWidth, maxWidth, minHeight, onWidthChange };

    // Window resize (no active drag) — see "Viewport Containment" above.
    React.useEffect(() => {
      const handleResize = () => {
        const rect = rootRef.current?.getBoundingClientRect();
        if (!rect) return;
        const { variant, offset, width, height, minWidth, maxWidth, minHeight, onWidthChange } = latestRef.current;
        const effectiveMaxWidth = getResponsiveMaxWidth(maxWidth);
        if (variant === "docked") {
          // Combines two independent reasons width might need to shrink:
          // the panel's right edge overflowing the (now narrower) viewport,
          // and the responsive cap having tightened below the panel's
          // current width even with no overflow at all.
          const overflow = Math.max(0, rect.right - window.innerWidth);
          const newW = Math.max(minWidth, Math.min(effectiveMaxWidth, width - overflow));
          if (newW !== width) { setWidth(newW); onWidthChange?.(newW); }
        } else {
          const baseLeft = rect.left - offset.x;
          const baseTop  = rect.top  - offset.y;
          const minX = -baseLeft;
          const minY = -baseTop;
          const maxX = window.innerWidth  - width  - baseLeft;
          const maxY = window.innerHeight - height - baseTop;
          const x = Math.max(minX, Math.min(maxX, offset.x));
          const y = Math.max(minY, Math.min(maxY, offset.y));
          if (x !== offset.x || y !== offset.y) setOffset({ x, y });
          const newW = Math.min(width, window.innerWidth, effectiveMaxWidth);
          const newH = Math.min(height, window.innerHeight);
          if (newW !== width)  { setWidth(newW);  onWidthChange?.(newW); }
          if (newH !== height) setHeight(newH);
        }
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleVariant = () => {
      if (lockVariant) return;
      const next: DraggableVariant = variant === "float" ? "docked" : "float";
      setVariant(next);
      setOffset({ x: 0, y: 0 });
      onVariantChange?.(next);
    };

    /* ── Float: drag ── */
    const onDragMouseDown = (e: React.MouseEvent) => {
      if (variant !== "float") return;
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      // Base position = current on-screen position with the *current*
      // offset subtracted back out, i.e. where the panel would sit at
      // offset (0,0). Every subsequent offset during this drag gets
      // clamped against this fixed reference so base + offset never
      // leaves the viewport (see "Viewport Containment" above).
      const rect = rootRef.current?.getBoundingClientRect();
      const baseLeft = rect ? rect.left - offset.x : 0;
      const baseTop  = rect ? rect.top  - offset.y : 0;
      dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y, baseLeft, baseTop };
      document.body.style.cursor     = "grabbing";
      document.body.style.userSelect = "none";
      const onMove = (ev: MouseEvent) => {
        if (!dragStart.current) return;
        const { baseLeft, baseTop, ox, oy, mx, my } = dragStart.current;
        const minX = -baseLeft;
        const minY = -baseTop;
        const maxX = window.innerWidth  - width  - baseLeft;
        const maxY = window.innerHeight - height - baseTop;
        // If the panel is wider/taller than the viewport, prioritize
        // keeping the top-left corner on screen over the bottom-right.
        const x = Math.max(minX, Math.min(maxX, ox + ev.clientX - mx));
        const y = Math.max(minY, Math.min(maxY, oy + ev.clientY - my));
        setOffset({ x, y });
      };
      const onUp = () => {
        dragStart.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };

    /* ── Float: corner resize ── */
    const onCornerResizeDown = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      // Top-left corner is fixed during a corner resize, so the viewport
      // cap on width/height is just "don't grow past the viewport's own
      // right/bottom edge from here" (see "Viewport Containment" above).
      const rect = rootRef.current?.getBoundingClientRect();
      resizeStart.current = { mx: e.clientX, my: e.clientY, w: width, h: height, left: rect?.left ?? 0, top: rect?.top ?? 0 };
      document.body.style.cursor     = "se-resize";
      document.body.style.userSelect = "none";
      onResizeStateChange?.(true);
      const onMove = (ev: MouseEvent) => {
        if (!resizeStart.current) return;
        const { left, top } = resizeStart.current;
        const maxWViewport = window.innerWidth  - left;
        const maxHViewport = window.innerHeight - top;
        const newW = Math.min(getResponsiveMaxWidth(maxWidth), maxWViewport, Math.max(minWidth, resizeStart.current.w + ev.clientX - resizeStart.current.mx));
        setWidth(newW); onWidthChange?.(newW);
        const newH = Math.min(maxHViewport, Math.max(minHeight, resizeStart.current.h + ev.clientY - resizeStart.current.my));
        setHeight(newH);
      };
      const onUp = () => {
        resizeStart.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        onResizeStateChange?.(false);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };

    /* ── Docked: left edge resize ── */
    const onLeftEdgeResizeDown = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      // Right edge is pinned by the consumer's flex layout, so the only way
      // this can leave the viewport is the left edge crossing x = 0 as width
      // grows — cap width at the panel's current right edge (see "Viewport
      // Containment" above).
      const rect = rootRef.current?.getBoundingClientRect();
      const rightEdge = rect ? rect.left + rect.width : Infinity;
      resizeStart.current = { mx: e.clientX, my: e.clientY, w: width, h: height, left: rect?.left ?? 0, top: rect?.top ?? 0 };
      document.body.style.cursor     = "ew-resize";
      document.body.style.userSelect = "none";
      onResizeStateChange?.(true);
      const onMove = (ev: MouseEvent) => {
        if (!resizeStart.current) return;
        const newW = Math.min(getResponsiveMaxWidth(maxWidth), rightEdge, Math.max(minWidth, resizeStart.current.w + resizeStart.current.mx - ev.clientX));
        setWidth(newW); onWidthChange?.(newW);
      };
      const onUp = () => {
        resizeStart.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        onResizeStateChange?.(false);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };

    /* ── Built-in overlay (used when renderHeaderControls is NOT provided) ── */
    /* h-16 = 64px matches ContainerHeader (py-5 + heading-md line-height) */
    const BuiltInHeaderControls = (
      <div className="absolute inset-x-0 top-0 h-16 z-20 flex items-center justify-between px-2 pointer-events-none">
        {/* Grip — float only */}
        {variant === "float" ? (
          <div
            className="flex items-center pointer-events-auto cursor-grab active:cursor-grabbing text-lyra-fg-secondary hover:text-lyra-fg-default transition-colors"
            onMouseDown={onDragMouseDown}
            aria-hidden="true"
          >
            <GripVertical className="h-4 w-4" strokeWidth={1.5} />
          </div>
        ) : <span />}

        {/* Dock/undock toggle */}
        <Tooltip content={variant === "float" ? "Dock to side" : "Undock"} placement="bottom">
          <button
            type="button"
            onClick={toggleVariant}
            aria-label={variant === "float" ? "Dock to side" : "Undock"}
            className="flex h-6 w-6 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:text-lyra-fg-default hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus pointer-events-auto"
          >
            {variant === "float"
              ? <PanelRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              : <Move       className="h-3.5 w-3.5" strokeWidth={1.5} />}
          </button>
        </Tooltip>
      </div>
    );

    /* Controls object passed to renderHeaderControls consumers */
    const headerControlProps: DraggableHeaderControls = {
      gripProps: {
        onMouseDown: onDragMouseDown,
        "aria-hidden": true,
        className: "flex items-center cursor-grab active:cursor-grabbing text-lyra-fg-secondary hover:text-lyra-fg-default transition-colors",
      },
      dockButtonProps: {
        type: "button",
        onClick: toggleVariant,
        "aria-label": variant === "float" ? "Dock to side" : "Undock",
        className: "flex h-6 w-6 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:text-lyra-fg-default hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
      },
      dockIcon: variant === "float"
        ? <PanelRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        : <Move       className="h-3.5 w-3.5" strokeWidth={1.5} />,
      variant,
    };

    const useInlineControls = !!renderHeaderControls;

    /* ── Docked ── */
    if (variant === "docked") {
      return (
        <div
          ref={setRootRef}
          style={{ width, minWidth }}
          className={cn("relative flex flex-col h-full overflow-hidden", className)}
          onMouseDown={() => onInteract?.()}
        >
          {/* Left edge resize handle — expands left, right side stays fixed */}
          <div
            onMouseDown={onLeftEdgeResizeDown}
            className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-10 group/edge"
            aria-hidden="true"
          >
            <div className="absolute inset-y-0 left-0 w-px bg-lyra-border-subtle group-hover/edge:bg-lyra-border-active transition-colors" />
          </div>

          {!useInlineControls && showHeaderControls && BuiltInHeaderControls}
          <div className="flex flex-col flex-1 min-h-0">
            {useInlineControls ? renderHeaderControls!(headerControlProps) : null}
            {children}
          </div>
        </div>
      );
    }

    /* ── Float ── */
    return (
      <div
        ref={setRootRef}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, width, height, pointerEvents: "auto" }}
        className={cn("relative flex flex-col overflow-hidden", className)}
        onMouseDown={() => onInteract?.()}
      >
        {!useInlineControls && showHeaderControls && BuiltInHeaderControls}
        {/* pl-7 gives the first child's header room for the grip icon — only when using built-in overlay */}
        <div className={cn("flex flex-col flex-1 min-h-0", !useInlineControls && "[&>*:first-child]:pl-7")}>
          {useInlineControls ? renderHeaderControls!(headerControlProps) : null}
          {children}
        </div>

        {/* Bottom-right corner resize handle */}
        <div
          onMouseDown={onCornerResizeDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end pb-1 pr-1 group/resize z-10"
          aria-hidden="true"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" className="text-lyra-border-default group-hover/resize:text-lyra-border-active transition-colors">
            <path d="M9 1L1 9M9 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }
);
Draggable.displayName = "Draggable";

export { Draggable };
