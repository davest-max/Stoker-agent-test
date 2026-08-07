import { useCallback, useRef, useState } from "react";

/**
 * Shared drag-to-resize plumbing for `SidePanel` and `InteriorPanel`.
 *
 * Not exported from `index.ts` — this is internal wiring shared between the
 * two panel components (which are otherwise intentionally separate, public
 * components; see CONTRIBUTING.md "Panels" section) so the resize math and
 * cursor/user-select handling during a drag doesn't have to be hand-copied
 * twice and drift apart.
 */
export function usePanelDragResize(
  side: "left" | "right",
  initialWidth: number,
  min: number,
  max: number,
  onResizeStateChange?: (isResizing: boolean) => void,
  onWidthChange?: (width: number) => void
) {
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startW.current = dragWidth ?? initialWidth;
      onResizeStateChange?.(true);

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta = side === "right"
          ? startX.current - ev.clientX
          : ev.clientX - startX.current;
        const newW = Math.min(max, Math.max(min, startW.current + delta));
        setDragWidth(newW);
        onWidthChange?.(newW);
      };
      const onUp = () => {
        dragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        onResizeStateChange?.(false);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [side, dragWidth, initialWidth, min, max, onResizeStateChange, onWidthChange]
  );

  return { width: dragWidth ?? initialWidth, onMouseDown };
}
