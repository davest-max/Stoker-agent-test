import { Panel, ContainerHeader } from "@nicecxone/lyra-ui";

/* ── SlideInPage ──
 * Generic wrapper for right-side destinations (Directory, and later
 * Contacts/Schedule/Customer profile) — no page-specific logic here.
 *
 * "panel"  — docks at a fixed width beside an active customer interaction
 *            (built on lyra-ui's Panel, variant="interior" — the exact
 *            mechanism already used for the "Case Details" panel).
 * "full"   — takes over the whole content column when there's no
 *            interaction behind it to dock beside. */

export interface SlideInPageProps {
  variant: "panel" | "full";
  open: boolean;
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  /** Panel variant only — defaults sized for a 4-tab directory rather than
   *  Panel's own narrower defaults (340/425), which are too tight here. */
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  children: React.ReactNode;
}

export function SlideInPage({
  variant,
  open,
  title,
  icon,
  onClose,
  width = 600,
  minWidth = 420,
  maxWidth = 720,
  children,
}: SlideInPageProps) {
  if (variant === "panel") {
    return (
      <Panel
        variant="interior"
        side="right"
        open={open}
        headerTitle={title}
        headerIcon={icon}
        onClose={onClose}
        width={width}
        minWidth={minWidth}
        maxWidth={maxWidth}
      >
        {children}
      </Panel>
    );
  }

  if (!open) return null;

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-lyra-bg-surface-base">
      <ContainerHeader title={title} icon={icon} onClose={onClose} />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

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
