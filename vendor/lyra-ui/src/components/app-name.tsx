import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

interface AppNameProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** App icon — an img element or SVG component. Optional: omit it entirely
   *  (rather than passing something just to satisfy a required prop) for a
   *  consumer that doesn't want an icon glyph next to the name at all —
   *  nothing renders in that slot instead of an empty placeholder box. */
  icon?: React.ReactNode;
  /** Application name text */
  name: string;
  /**
   * Compact mode (narrow viewports): show only the icon.
   * Name and chevron are hidden; the app name moves into the menu header.
   */
  compact?: boolean;
  /**
   * Show the trailing chevron that signals "this opens a menu." Default
   * `true`. Ignored entirely when `interactive` is `false` (see below) —
   * a non-interactive heading never shows a chevron regardless of this.
   */
  showChevron?: boolean;
  /**
   * Whether this actually opens something (an app-switcher menu, typically
   * via a `Popover.Trigger` wrapping this component). Default `true`. Set
   * `false` for a consumer that just wants the app name to read as a plain
   * heading with no menu behind it at all — no `aria-haspopup`, no "open
   * application menu" label, no hover/pressed background, no chevron
   * (`showChevron` is ignored), and removed from the tab order
   * (`tabIndex={-1}`) since there's nothing for a keyboard user to
   * activate. Still renders as a `<button>` under the hood (keeps this
   * component's own ref/prop typing simple) — a consumer isn't expected to
   * wrap it in a `Popover.Trigger` at all when this is `false`.
   */
  interactive?: boolean;
}

const AppName = React.forwardRef<HTMLButtonElement, AppNameProps>(
  ({ className, icon, name, compact = false, showChevron = true, interactive = true, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-haspopup={interactive ? "true" : undefined}
      aria-label={interactive ? `${name} — open application menu` : name}
      tabIndex={interactive ? undefined : -1}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lyra-sm p-2 transition-colors",
        interactive && "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
        interactive && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
        !interactive && "cursor-default",
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
      {!compact && (
        <>
          <span className="lyra-body-lg-emphasis text-lyra-fg-default">{name}</span>
          {interactive && showChevron && (
            <ChevronDown
              className="h-3.5 w-3.5 text-lyra-fg-secondary"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )}
        </>
      )}
    </button>
  )
);
AppName.displayName = "AppName";

export { AppName };
export type { AppNameProps };
