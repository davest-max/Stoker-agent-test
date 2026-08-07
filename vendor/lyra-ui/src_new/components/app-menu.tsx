import * as React from "react";
import { cn } from "../lib/utils";

/* ── Types ── */

export interface AppMenuItem {
  /** Display label */
  label: string;
  /** Optional icon (rendered as a rounded square placeholder if omitted) */
  icon?: React.ReactNode;
  /** Whether this item is currently active/selected */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export interface AppMenuGroup {
  items: AppMenuItem[];
}

/* ── AppMenu ── */

interface AppMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Groups of menu items, separated by dividers */
  groups: AppMenuGroup[];
  /** Optional footer content (e.g., logo) */
  footer?: React.ReactNode;
  /** Optional header shown at the top of the menu (e.g. app name in compact mode) */
  header?: React.ReactNode;
}

const AppMenu = React.forwardRef<HTMLDivElement, AppMenuProps>(
  ({ className, groups, footer, header, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "w-[320px] rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg",
        "overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Header — app name shown here in compact/narrow mode */}
      {header && (
        <div className="px-5 pb-1 pt-4">
          <span className="lyra-body-lg-emphasis text-lyra-fg-default">{header}</span>
        </div>
      )}

      <div
        role="menu"
        aria-label="Applications"
        className="max-h-[480px] overflow-y-auto py-2"
      >
        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <div role="separator" className="mx-4 my-1 border-t border-lyra-border-subtle" />
            )}
            <div role="group" className="flex flex-col gap-0.5 px-2">
              {group.items.map((item, ii) => (
                <AppMenuItemRow key={ii} item={item} />
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Footer (logo) — outside role="menu" */}
      {footer && (
        <>
          <div className="mx-4 border-t border-lyra-border-subtle" />
          <div className="flex items-center justify-center px-4 py-3 min-h-[50px]">
            {footer}
          </div>
        </>
      )}
    </div>
  )
);
AppMenu.displayName = "AppMenu";

/* ── AppMenuItemRow (internal) ── */

function AppMenuItemRow({ item }: { item: AppMenuItem }) {
  return (
    <button
      role="menuitem"
      aria-current={item.active ? "true" : undefined}
      onClick={item.onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lyra-md px-3 py-2 text-left lyra-body-md transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-inset",
        item.active
          ? "bg-lyra-bg-active-subtle text-lyra-fg-active-strong lyra-body-md-emphasis"
          : "text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed"
      )}
    >
      {/* Icon or placeholder */}
      {item.icon ? (
        <span aria-hidden="true" className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
          {item.icon}
        </span>
      ) : (
        <span aria-hidden="true" className="h-8 w-8 flex-shrink-0 rounded-lyra-sm bg-lyra-bg-surface-shell" />
      )}
      <span className="truncate">{item.label}</span>
    </button>
  );
}

export { AppMenu };
export type { AppMenuProps };
