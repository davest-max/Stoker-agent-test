import * as React from "react";
import { GripVertical } from "lucide-react";
import { cn } from "../lib/utils";
import { Draggable, type DraggableVariant } from "./draggable";
import { ContainerHeader } from "./container-header";
import { Tooltip } from "./tooltip";

/**
 * Generic draggable/dockable panel shell — the same `Draggable` +
 * `ContainerHeader` composition `AiPanel` and `AgentNotifications` each
 * hand-roll around their own specific content, extracted here for any
 * panel that just needs a labeled, draggable, dockable shell with no
 * bespoke content of its own (e.g. a blank "Messages" or "Schedule"
 * dropdown). Renders a blank empty-state by default when no `children`
 * are passed.
 */

export interface DraggablePanelProps {
  /** Header title — should match the trigger button's label */
  title: string;
  /**
   * Extra content rendered directly below the title row, still above the
   * header's bottom divider — e.g. a filter or app-select field that should
   * stay fixed at the top of the panel (outside the scrollable body below)
   * rather than scroll away with `children`. Omit for the plain title-only
   * header every other panel uses.
   */
  headerContent?: React.ReactNode;
  /** Panel body — defaults to a blank empty-state placeholder when omitted */
  children?: React.ReactNode;
  onClose?: () => void;
  /** Restored width on each remount so resize is preserved across float↔docked switches */
  defaultWidth?: number;
  /** Max width for the Draggable wrapper (default: unlimited) */
  maxWidth?: number;
  /** Default height in float mode (default: 480) */
  defaultHeight?: number;
  /** Controlled height — overrides defaultHeight (e.g. for viewport-responsive sizing) */
  height?: number;
  /** Initial Draggable variant (default: "float") */
  draggableVariant?: DraggableVariant;
  /** Called when variant changes (float ↔ docked) */
  onVariantChange?: (variant: DraggableVariant) => void;
  /** Called when the draggable width changes (for animating a docked wrapper) */
  onWidthChange?: (width: number) => void;
  /** Called when resize drag starts/ends (suppress transition during drag) */
  onResizeStateChange?: (isResizing: boolean) => void;
  /** Called on any mousedown inside the panel — use for z-index "bring to front" logic */
  onInteract?: () => void;
  className?: string;
}

const DraggablePanel = React.forwardRef<HTMLDivElement, DraggablePanelProps>(
  ({
    title, headerContent, children, onClose,
    defaultWidth = 320, maxWidth, defaultHeight = 480, height,
    draggableVariant: draggableVariantProp = "float",
    onVariantChange, onWidthChange, onResizeStateChange, onInteract,
    className,
  }, ref) => {
    const [draggableVariant, setDraggableVariant] = React.useState<DraggableVariant>(draggableVariantProp);

    // Sync when parent forces a variant change (single-dock rule)
    React.useEffect(() => { setDraggableVariant(draggableVariantProp); }, [draggableVariantProp]);

    return (
      <Draggable
        ref={ref}
        variant={draggableVariant}
        defaultWidth={defaultWidth}
        defaultHeight={height ?? defaultHeight}
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
          <>
            <ContainerHeader
              title={title}
              /* Grip icon in float mode; spacer div to preserve header height in docked mode */
              icon={
                variant === "float" ? (
                  <div {...gripProps}><GripVertical className="h-4 w-4" strokeWidth={1.5} /></div>
                ) : (
                  <div className="w-4" aria-hidden="true" />
                )
              }
              actions={
                <Tooltip content={dockButtonProps["aria-label"]} placement="bottom" asLabel>
                  <button
                    {...dockButtonProps}
                    className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-state-hover hover:text-lyra-fg-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
                  >
                    {dockIcon}
                  </button>
                </Tooltip>
              }
              onClose={onClose}
              /* When `headerContent` is provided, the divider moves below
                 it instead of directly under the title row — see the
                 bordered wrapper below. */
              bordered={!headerContent}
            />
            {headerContent && (
              // Sits between the title row and the scrollable body, still
              // outside `children`'s own scroll container below — so it
              // stays fixed at the top of the panel ("sticky to the top")
              // the same way the title row itself already does, rather
              // than scrolling away with the body content.
              <div className="shrink-0 px-4 pb-3 border-b border-lyra-border-subtle">
                {headerContent}
              </div>
            )}
          </>
        )}
      >
        {/* Empty-state placeholder centers both axes (a short line of text
            floating in the middle of the panel); real `children` — e.g. a
            form field — instead top/left-align and fill the width, the
            usual layout for actual panel content rather than a centered
            message. */}
        <div className={cn(
          "overflow-y-auto flex-1 flex p-4",
          children ? "flex-col items-stretch" : "items-center justify-center"
        )}>
          {children ?? (
            <p className="lyra-body-md text-lyra-fg-disabled text-center">Nothing here yet.</p>
          )}
        </div>
      </Draggable>
    );
  }
);
DraggablePanel.displayName = "DraggablePanel";

export { DraggablePanel };
