import { forwardRef } from "react";
import { DraggablePanel, ContainerHeader, type DraggableVariant } from "@nicecxone/lyra-ui";

/* ── SlideInPage ──
 * Generic wrapper for right-side destinations (Directory, and later
 * Contacts/Schedule/Customer profile) — no page-specific logic here.
 *
 * "panel"  — docks beside an active customer interaction, or floats free —
 *            built on lyra-ui's `DraggablePanel` (the same float/dock shell
 *            Notifications and Ask AI use — see that component's own doc
 *            comment, which literally calls out "Schedule" as an intended
 *            consumer). Docking/floating and the resulting position math
 *            live in AgentNextGenPage.tsx, next to the identical plumbing
 *            already there for the AI panel/Notifications/Chat.
 *            One trade-off inherited from `DraggablePanel`: its header's
 *            leading-icon slot is reserved for the drag grip (float mode)
 *            or a same-width spacer (docked mode) — `icon` is accepted here
 *            for API compatibility with existing call sites but no longer
 *            rendered in the header, matching how Notifications/Ask AI
 *            already forgo a custom leading icon of their own.
 * "full"   — takes over the whole content column when there's no
 *            interaction behind it to dock beside. Unchanged — no
 *            float/dock capability here since there's nothing to dock
 *            *beside* in this mode. */

export interface SlideInPageProps {
  variant: "panel" | "full";
  open: boolean;
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  /** Panel variant only. */
  width?: number;
  maxWidth?: number;
  /** Panel variant, float mode only — height of the floating window. */
  height?: number;
  /** Panel variant only — float ↔ docked, mirrors the `DraggableVariant`
   *  Notifications/Ask AI already use. Defaults to "docked" (unlike those
   *  two, which default to "float") since a slide-in's established default
   *  is appearing docked beside the interaction — floating is the new,
   *  opt-in capability, not the default entry point. */
  draggableVariant?: DraggableVariant;
  onVariantChange?: (variant: DraggableVariant) => void;
  onWidthChange?: (width: number) => void;
  onResizeStateChange?: (isResizing: boolean) => void;
  onInteract?: () => void;
  children: React.ReactNode;
}

/** Forwards its ref to the panel variant's `DraggablePanel` root (which
 *  itself forwards to `Draggable`'s root div) — AgentNextGenPage.tsx reads
 *  `getBoundingClientRect()` off this ref at the moment a dock/float
 *  transition happens, the same way it already does for the AI panel and
 *  Notifications, to carry the panel's on-screen position across the
 *  remount that switching wrappers (docked flex sibling ↔ fixed-position
 *  float overlay) causes. Not used by the "full" variant, which never
 *  moves. */
export const SlideInPage = forwardRef<HTMLDivElement, SlideInPageProps>(function SlideInPage(
  {
    variant,
    open,
    title,
    icon,
    onClose,
    width = 600,
    maxWidth = 720,
    height,
    draggableVariant = "docked",
    onVariantChange,
    onWidthChange,
    onResizeStateChange,
    onInteract,
    children,
  },
  ref
) {
  if (variant === "panel") {
    if (!open) return null;
    return (
      <DraggablePanel
        ref={ref}
        title={title}
        onClose={onClose}
        defaultWidth={width}
        maxWidth={maxWidth}
        defaultHeight={height}
        draggableVariant={draggableVariant}
        onVariantChange={onVariantChange}
        onWidthChange={onWidthChange}
        onResizeStateChange={onResizeStateChange}
        onInteract={onInteract}
        className="h-full"
      >
        {children}
      </DraggablePanel>
    );
  }

  if (!open) return null;

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-lyra-bg-surface-base">
      <ContainerHeader title={title} icon={icon} onClose={onClose} />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
});

/** Stand-in content for destinations that don't have real content yet
 *  (every nav icon besides Directory, for now) — slide-ins and full-page
 *  takeovers (Settings/Dashboard) alike. */
export function SlideInPlaceholder({ title }: { title?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 text-center">
      {title && <h1 className="lyra-heading-sm text-lyra-fg-default">{title}</h1>}
      <p className="lyra-body-sm text-lyra-fg-secondary">Design coming</p>
    </div>
  );
}
