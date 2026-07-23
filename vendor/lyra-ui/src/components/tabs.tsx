import * as React from "react";
import { useRef, useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { KebabMenuButton } from "./kebab-menu-button";
import { Menu, type MenuEntry } from "./menu";

/* ── Tab List (container with bottom border) ── */

interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When true, tabs stretch to fill the full width */
  fullWidth?: boolean;
  /**
   * Native responsive overflow behavior. Reacts to this `TabList`'s own
   * available width via a CSS container query (not the viewport — a docked
   * side panel, a narrow card, or any other layout squeeze can make this
   * width small for reasons that have nothing to do with the browser
   * window). Once that width drops to 991px or below, the row collapses to
   * exactly two full-width slots: the active tab, and a "{n} More" dropdown
   * listing every other tab, in its original order (e.g. a record detail
   * panel's Overview/Details/Tickets/Accounts/... tab bar). Selecting a
   * tab from the dropdown just changes which `Tab` has `active` — the
   * "other tabs" list is re-derived fresh from `children` order on every
   * render, so the tab that was active a moment ago reappears in the
   * dropdown at its original position automatically; nothing here tracks
   * or reorders anything itself.
   *
   * Off by default: `ChannelTab` (`channel-row.tsx`) already implements
   * its own different collapse strategy — shedding each tab's own text,
   * never moving tabs into a menu — at much narrower, unrelated
   * breakpoints via its own `.lyra-channel-tab-list-wrap` container query.
   * Turning this on unconditionally for every `TabList` would fire before
   * that narrower, purpose-built behavior ever got a chance to run. Opt in
   * per `TabList` that actually wants this pattern.
   */
  overflowMenu?: boolean;
  /** Formats the dropdown trigger's label from the number of tabs it
   *  holds (every tab except the active one). Defaults to `"{n} More"`. */
  overflowMoreLabel?: (count: number) => string;
}

const TabList = React.forwardRef<HTMLDivElement, TabListProps>(
  (
    {
      className,
      fullWidth,
      overflowMenu,
      overflowMoreLabel = (count) => `${count} More`,
      onKeyDown,
      children,
      ...props
    },
    ref
  ) => {
    const listRef = useRef<HTMLDivElement>(null);
    const [overflowOpen, setOverflowOpen] = useState(false);
    const [overflowPosition, setOverflowPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    const overflowTriggerRef = useRef<HTMLButtonElement>(null);
    const overflowMenuRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(e);
        const list = listRef.current;
        if (!list) return;

        const tabs = Array.from(
          list.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])')
        );
        const current = document.activeElement as HTMLElement;
        const index = tabs.indexOf(current);
        if (index === -1) return;

        let next: HTMLElement | undefined;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          next = tabs[(index + 1) % tabs.length];
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          next = tabs[(index - 1 + tabs.length) % tabs.length];
        } else if (e.key === "Home") {
          e.preventDefault();
          next = tabs[0];
        } else if (e.key === "End") {
          e.preventDefault();
          next = tabs[tabs.length - 1];
        }

        if (next) {
          next.focus();
          next.click();
        }
      },
      [onKeyDown]
    );

    // Close the overflow dropdown on outside click / Escape — same pattern
    // as `KebabMenuButton`'s own portal dropdown.
    useEffect(() => {
      if (!overflowOpen) return;
      const handleOutsideClick = (e: MouseEvent) => {
        if (
          overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node) &&
          overflowTriggerRef.current && !overflowTriggerRef.current.contains(e.target as Node)
        ) setOverflowOpen(false);
      };
      const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") setOverflowOpen(false); };
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [overflowOpen]);

    const tablistEl = (
      <div
        ref={(node) => {
          (listRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        role="tablist"
        onKeyDown={handleKeyDown}
        className={cn(
          "flex border-b border-lyra-border-subtle",
          fullWidth ? "[&>*]:flex-1" : "gap-1",
          // Stays in the DOM (just CSS-hidden below 991px, see
          // `.lyra-tab-overflow-full` in lyra-tokens.css) so its buttons
          // can still be `.click()`ed programmatically from the collapsed
          // dropdown below.
          overflowMenu && "lyra-tab-overflow-full",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );

    if (!overflowMenu) return tablistEl;

    const childArray = React.Children.toArray(children) as React.ReactElement<TabProps>[];
    const rawActiveIndex = childArray.findIndex((child) => child.props?.active);
    const activeIndex = rawActiveIndex === -1 ? 0 : rawActiveIndex;
    const activeChild = childArray[activeIndex];
    const otherChildren = childArray.filter((_, i) => i !== activeIndex);

    const openOverflowMenu = () => {
      const rect = overflowTriggerRef.current?.getBoundingClientRect();
      if (rect) setOverflowPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      setOverflowOpen(true);
    };
    const handleOverflowTriggerClick = () => {
      if (overflowOpen) setOverflowOpen(false);
      else openOverflowMenu();
    };

    const overflowEntries: MenuEntry[] = otherChildren.map((child) => {
      const originalIndex = childArray.indexOf(child);
      const label = typeof child.props.children === "string" ? child.props.children : `Tab ${originalIndex + 1}`;
      return {
        id: child.key != null ? String(child.key) : `tab-overflow-${originalIndex}`,
        label,
        icon: child.props.icon,
        disabled: child.props.disabled,
        onClick: () => {
          // Click the real (hidden) tab button rather than reaching into
          // its `onClick` prop directly — same reasoning as the arrow-key
          // navigation above: it fires exactly the same handlers a real
          // click would, with no separate "select this tab" code path to
          // keep in sync.
          listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[originalIndex]?.click();
          setOverflowOpen(false);
        },
      };
    });

    return (
      <div className="lyra-tab-overflow-wrap">
        {tablistEl}
        {activeChild && (
          <div className="lyra-tab-overflow-collapsed [&>*]:flex-1 flex items-stretch gap-2 border-b border-lyra-border-subtle py-1.5">
            {React.cloneElement(activeChild, {
              key: `${activeChild.key ?? activeIndex}-overflow-active`,
              // No `id` here — the tab with the real id lives in the
              // hidden full-width row above (`.lyra-tab-overflow-full`);
              // this is purely a visible mirror of it for the collapsed
              // two-slot layout, and duplicating that id on a second DOM
              // node would be invalid HTML.
              id: undefined,
            })}
            {otherChildren.length > 0 && (
              // Styled as a plain (never-"active") `Tab` — no border/fill —
              // rather than a bordered pill/chip, per feedback on the first
              // pass: this is still just a tab, it just happens to open a
              // menu instead of a panel directly. Same base classes and
              // bottom hover indicator as `Tab`'s own non-active state
              // below, minus the `role="tab"`/`aria-selected` semantics
              // that wouldn't make sense for a trigger with no panel of its
              // own.
              <button
                ref={overflowTriggerRef}
                type="button"
                onClick={handleOverflowTriggerClick}
                aria-haspopup="menu"
                aria-expanded={overflowOpen}
                aria-label={`${otherChildren.length} more tabs`}
                className="group relative inline-flex items-center justify-center gap-2 px-3 py-2.5 lyra-body-md-emphasis text-lyra-fg-secondary transition-colors hover:text-lyra-fg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
              >
                {overflowMoreLabel(otherChildren.length)}
                <ChevronDown
                  className="h-4 w-4 flex-shrink-0 text-lyra-fg-disabled transition-colors group-hover:text-lyra-fg-secondary"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-[3px] bg-transparent group-hover:bg-lyra-border-medium transition-colors" />
              </button>
            )}
          </div>
        )}
        {overflowOpen && overflowPosition && createPortal(
          <div
            ref={overflowMenuRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: overflowPosition.top,
              left: overflowPosition.left,
              minWidth: overflowPosition.width,
              zIndex: 9999,
            }}
          >
            <Menu items={overflowEntries} aria-label="More tabs" />
          </div>,
          document.body
        )}
      </div>
    );
  }
);
TabList.displayName = "TabList";

/* ── Tab (individual tab button) ── */

interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  /** Right-side icon (e.g. close or menu icon) */
  rightIcon?: React.ReactNode;
  /** Called when the remove button is clicked (renders an × button on the right) */
  onRemove?: (e: React.MouseEvent) => void;
  /** Accessible label for the remove button (default: "Remove tab") */
  removeLabel?: string;
  /**
   * Renders a trailing kebab (⋮) menu on this tab — e.g. a channel tab's
   * "Unassign & Dismiss"/"Consult / Transfer"/etc. actions (see
   * `ChannelTab` in `channel-row.tsx`, the first consumer of this). Uses
   * `KebabMenuButton`'s `as="span"` mode rather than nesting a real
   * `<button>` inside this `<button>`, which HTML forbids — same reasoning
   * as `onRemove`'s own `role="button"` span below. Mutually exclusive with
   * `onRemove`/`rightIcon` (this takes priority if more than one is passed —
   * a tab needs at most one trailing action).
   */
  menuItems?: MenuEntry[];
  /** Accessible label for the kebab menu trigger (default: "More options") */
  menuAriaLabel?: string;
  /** ID of the associated TabPanel */
  panelId?: string;
}

const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  (
    {
      className,
      active,
      icon,
      rightIcon,
      onRemove,
      removeLabel = "Remove tab",
      menuItems,
      menuAriaLabel = "More options",
      panelId,
      children,
      id,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 px-3 py-2.5 lyra-body-md-emphasis transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
        active
          ? "text-lyra-fg-action"
          : "text-lyra-fg-secondary hover:text-lyra-fg-default",
        className
      )}
      {...props}
    >
      {icon && (
        <span
          aria-hidden="true"
          className={cn("flex-shrink-0 transition-colors", active ? "text-lyra-fg-action" : "text-lyra-fg-disabled group-hover:text-lyra-fg-secondary")}
        >
          {icon}
        </span>
      )}
      {children}
      {menuItems && (
        <KebabMenuButton
          as="span"
          items={menuItems}
          ariaLabel={menuAriaLabel}
          className={cn(
            "h-5 w-5 flex-shrink-0",
            active ? "text-lyra-fg-action" : "text-lyra-fg-disabled group-hover:text-lyra-fg-secondary"
          )}
        />
      )}
      {onRemove && !menuItems && (
        <span
          role="button"
          tabIndex={0}
          aria-label={removeLabel}
          onClick={(e) => { e.stopPropagation(); onRemove(e); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onRemove(e as unknown as React.MouseEvent); } }}
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-lyra-xs flex-shrink-0 transition-colors",
            "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
            active ? "text-lyra-fg-action" : "text-lyra-fg-disabled group-hover:text-lyra-fg-secondary"
          )}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <line x1="1.5" y1="1.5" x2="8.5" y2="8.5" />
            <line x1="8.5" y1="1.5" x2="1.5" y2="8.5" />
          </svg>
        </span>
      )}
      {rightIcon && !onRemove && !menuItems && (
        <span
          aria-hidden="true"
          className={cn("flex-shrink-0 transition-colors", active ? "text-lyra-fg-action" : "text-lyra-fg-disabled group-hover:text-lyra-fg-secondary")}
        >
          {rightIcon}
        </span>
      )}
      {/* Active indicator — blue bar */}
      {active && (
        <span aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-[3px] bg-lyra-bg-primary" />
      )}
      {/* Hover indicator — gray bar (only when not active) */}
      {!active && (
        <span aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-[3px] bg-transparent group-hover:bg-lyra-border-medium transition-colors" />
      )}
    </button>
  )
);
Tab.displayName = "Tab";

/* ── Tab Panel (content area) ── */

interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  /** ID of the associated Tab */
  tabId?: string;
}

const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(
  ({ className, active, tabId, ...props }, ref) => {
    if (!active) return null;
    return (
      <div
        ref={ref}
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={tabId}
        className={cn("flex-1", className)}
        {...props}
      />
    );
  }
);
TabPanel.displayName = "TabPanel";

export { TabList, Tab, TabPanel };
export type { TabListProps, TabProps, TabPanelProps };
