import * as React from "react";
import * as ReactDOM from "react-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

/* ── Types ── */

interface MenuItemDef {
  /** Unique key */
  id: string;
  /** Display label */
  label: string;
  /** Fires when the item is clicked */
  onClick?: () => void;
  /** Nested submenu items — renders a flyout on hover, styled as a nested Menu */
  submenu?: MenuEntry[];
  /** Arbitrary custom content rendered in the flyout instead of a nested Menu
   *  (e.g. a rich panel). Takes precedence over `submenu` when both are set.
   *  Reuses the same hover/click/keyboard, portal, and viewport-flip
   *  positioning as `submenu` — use this instead of hand-rolling a separate
   *  flyout/portal for non-menu-list content. */
  submenuContent?: React.ReactNode;
  /** Render the item in destructive (red) styling */
  destructive?: boolean;
  /** Disable the item */
  disabled?: boolean;
  /** Optional leading icon (React node, e.g. a Lucide icon) */
  icon?: React.ReactNode;
  /** Optional keyboard shortcut label displayed on the right */
  shortcut?: string;
  /** Optional custom element rendered on the right (overrides shortcut) */
  rightElement?: React.ReactNode;
  /** Optional secondary/description text below the label */
  description?: string;
  /** Highlight as the currently selected/active item */
  selected?: boolean;
  /** Keep the item in its hover background state. Items with a submenu/
   *  submenuContent already get this automatically while their flyout is
   *  open — use this for other cases where an external state should force
   *  the hover look (e.g. a related panel opened elsewhere). */
  active?: boolean;
}

/** Non-interactive section header rendered inline within the list (e.g.
 *  "Favorites", "All Codes (2)"). Keyed on `sectionLabel` rather than a
 *  discriminant field so plain `{ sectionLabel: "..." }` literals work
 *  without importing a type. Skipped entirely by the arrow-key/Home/End
 *  keyboard navigation in Menu below since it has no `role="menuitem"`. */
interface MenuSectionLabel {
  sectionLabel: string;
}

type MenuEntry = MenuItemDef | "separator" | MenuSectionLabel;

/* ── Menu ── */

interface MenuProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of items and separators */
  items: MenuEntry[];
  /** Override the ARIA role on the menu container. Defaults to "menu".
   *  Use "listbox" for combobox/autocomplete dropdowns. */
  menuRole?: React.AriaRole;
  /** Override the ARIA role on each item. Defaults to "menuitem".
   *  Use "option" when menuRole is "listbox". */
  itemRole?: React.AriaRole;
}

const Menu = React.forwardRef<HTMLDivElement, MenuProps>(
  ({ className, items, menuRole = "menu", itemRole = "menuitem", ...props }, ref) => {
    const menuRef = React.useRef<HTMLDivElement>(null);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      const menu = menuRef.current;
      if (!menu) return;

      const menuItems = Array.from(
        menu.querySelectorAll<HTMLElement>(':scope > div > [role="menuitem"]:not([disabled]), :scope > [role="menuitem"]:not([disabled])')
      );
      const current = document.activeElement as HTMLElement;
      const idx = menuItems.indexOf(current);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = idx < menuItems.length - 1 ? menuItems[idx + 1] : menuItems[0];
        next?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = idx > 0 ? menuItems[idx - 1] : menuItems[menuItems.length - 1];
        prev?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        menuItems[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        menuItems[menuItems.length - 1]?.focus();
      }
    }, []);

    return (
      <div
        ref={(node) => {
          (menuRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        role={menuRole}
        onKeyDown={handleKeyDown}
        className={cn(
          "min-w-[200px] rounded-lyra-lg bg-lyra-bg-surface-overlay border border-lyra-border-subtle shadow-lg p-1 overflow-hidden",
          className
        )}
        {...props}
      >
        {items.map((entry, i) => {
          if (entry === "separator") {
            return (
              <div
                key={`sep-${i}`}
                role="separator"
                className="border-b border-lyra-border-subtle my-1.5"
              />
            );
          }

          if ("sectionLabel" in entry) {
            return (
              <div
                key={`label-${i}`}
                className="px-3 pt-2.5 pb-1 lyra-body-sm text-lyra-fg-secondary truncate"
              >
                {entry.sectionLabel}
              </div>
            );
          }

          return <MenuItemRow key={entry.id} item={entry} itemRole={itemRole} />;
        })}
      </div>
    );
  }
);
Menu.displayName = "Menu";

/* ── MenuItemRow (internal) ── */

interface MenuItemRowProps {
  item: MenuItemDef;
  itemRole?: React.AriaRole;
}

const MenuItemRow: React.FC<MenuItemRowProps> = ({ item, itemRole = "menuitem" }) => {
  const [submenuOpen, setSubmenuOpen] = React.useState(false);
  const [submenuPos, setSubmenuPos] = React.useState<{ top?: number; bottom?: number; left?: number; right?: number }>({ top: 0, left: 0 });
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRef = React.useRef<HTMLDivElement>(null);
  const submenuRef = React.useRef<HTMLDivElement>(null);
  const anchorRectRef = React.useRef<DOMRect | null>(null);
  const hasSubmenu = !!item.submenuContent || (item.submenu && item.submenu.length > 0);

  const openSubmenu = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Only compute the anchor/initial position on the transition from
    // closed to open. openSubmenu also fires on every re-entry while
    // already open — e.g. the flyout's own onMouseEnter, which exists so
    // moving the cursor off the row and onto the flyout doesn't close it —
    // and resetting the position on those calls would stomp the flip
    // computed by the layout effect below, snapping an already-flipped
    // flyout back to its default (unflipped) spot the moment the cursor
    // reaches it, before the user can interact with it.
    if (!submenuOpen) {
      // Rendered through a portal to document.body (see below) so it can
      // never be clipped by Menu's own overflow-hidden root — a submenu
      // positioned with plain CSS `left-full` inside that container would be
      // cut off entirely, not just its shadow, since it extends past the
      // parent's own clipped bounds. Position is computed here, before open,
      // from this row's own rect (not the whole Menu's).
      const rect = rowRef.current?.getBoundingClientRect();
      if (rect) {
        anchorRectRef.current = rect;
        setSubmenuPos({ top: rect.top, left: rect.right + 4 });
      }
    }
    setSubmenuOpen(true);
  };

  const closeSubmenu = () => {
    timeoutRef.current = setTimeout(() => setSubmenuOpen(false), 150);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  /* Top-align and right-of-row by default (set in openSubmenu above); if
     the flyout's actual rendered size would push it past the bottom or
     right edge of the viewport, flip to bottom-aligned and/or left-of-row
     instead so the whole thing stays visible — e.g. a trigger anchored
     near the right edge of the screen (like AgentProfile's status menu)
     needs its submenu to open to the left. Runs before paint so there's no
     visible flash of the wrong alignment. */
  React.useLayoutEffect(() => {
    if (!submenuOpen) return;
    const el = submenuRef.current;
    const anchor = anchorRectRef.current;
    if (!el || !anchor) return;
    const rect = el.getBoundingClientRect();
    setSubmenuPos((prev) => {
      const next = { ...prev };
      if (rect.right > window.innerWidth) {
        next.left = undefined;
        next.right = window.innerWidth - anchor.left + 4;
      }
      if (rect.bottom > window.innerHeight) {
        next.top = undefined;
        next.bottom = window.innerHeight - anchor.bottom;
      }
      return next;
    });
  }, [submenuOpen]);

  const handleClick = () => {
    if (item.disabled) return;
    if (hasSubmenu) {
      // Always open, never toggle closed — matches the keyboard handler
      // below. Hovering already opens the submenu via onMouseEnter, so a
      // toggle here would immediately close it again on click (the submenu
      // was already open by the time the click fires), making click look
      // like a no-op.
      openSubmenu();
      return;
    }
    item.onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (hasSubmenu) {
      if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        // Route through openSubmenu (not setSubmenuOpen directly) so a
        // keyboard-triggered open also gets its anchor position computed —
        // otherwise it would open pinned at the flyout's default (0, 0).
        openSubmenu();
      }
    }
    if (e.key === "ArrowLeft" && submenuOpen) {
      e.preventDefault();
      e.stopPropagation();
      setSubmenuOpen(false);
    }
    if (e.key === "Escape" && submenuOpen) {
      e.preventDefault();
      e.stopPropagation();
      setSubmenuOpen(false);
    }
  };

  const isDestructive = item.destructive;

  return (
    <div
      ref={rowRef}
      className="relative"
      onMouseEnter={hasSubmenu ? openSubmenu : undefined}
      onMouseLeave={hasSubmenu ? closeSubmenu : undefined}
    >
      <button
        type="button"
        role={itemRole}
        disabled={item.disabled}
        data-menu-item-id={item.id}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-haspopup={hasSubmenu ? "menu" : undefined}
        aria-expanded={hasSubmenu ? submenuOpen : undefined}
        className={cn(
          "group/item flex w-full items-center gap-2.5 px-3 py-2.5 lyra-body-md transition-colors text-left relative rounded-lyra-sm",
          "focus:outline-none focus-visible:bg-lyra-state-hover",
          isDestructive
            ? "text-lyra-status-critical-strong hover:bg-lyra-status-critical-subtle active:bg-lyra-status-critical-medium"
            : "text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
          item.selected && !isDestructive && "bg-lyra-bg-active-subtle text-lyra-fg-active-strong",
          (item.active || (hasSubmenu && submenuOpen)) && !isDestructive && !item.selected && "bg-lyra-state-hover",
          item.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent active:bg-transparent"
        )}
      >
        {/* Left accent bar — visible on hover/active of this button only */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full opacity-0 transition-opacity",
            isDestructive
              ? "bg-lyra-status-critical-strong group-hover/item:opacity-100 group-active/item:opacity-100"
              : cn("bg-lyra-fg-default group-hover/item:opacity-100 group-active/item:opacity-100", (item.active || (hasSubmenu && submenuOpen)) && "opacity-100"),
            item.disabled && "group-hover/item:opacity-0 group-active/item:opacity-0"
          )}
        />

        {/* Leading icon */}
        {item.icon && (
          <span
            aria-hidden="true"
            className={cn(
              "flex h-5 w-5 items-center justify-center flex-shrink-0",
              item.description && "self-start mt-0.5",
              isDestructive ? "text-lyra-status-critical-strong" : "text-lyra-fg-secondary"
            )}
          >
            {item.icon}
          </span>
        )}

        {/* Label + optional description */}
        <span className="flex-1 min-w-0">
          <span className="block truncate">{item.label}</span>
          {item.description && (
            <span className="block lyra-body-sm text-lyra-fg-secondary truncate">{item.description}</span>
          )}
        </span>

        {/* Right element (custom) or shortcut */}
        {item.rightElement
          ? <span className="flex-shrink-0 ml-2">{item.rightElement}</span>
          : item.shortcut && (
            <span className="lyra-body-sm text-lyra-fg-secondary flex-shrink-0 ml-4">
              {item.shortcut}
            </span>
          )}

        {/* Submenu chevron */}
        {hasSubmenu && (
          <ChevronRight
            className="h-4 w-4 text-lyra-fg-secondary flex-shrink-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Submenu flyout — top-aligned with this row by default; flips to
          bottom-aligned (see the layout effect above) if that would push
          it past the bottom of the viewport. Rendered through a portal to
          document.body (see openSubmenu above) and positioned with fixed
          viewport coordinates from submenuPos so it's never clipped by
          this Menu's own overflow-hidden root. Renders `submenuContent` as-is
          when provided (for rich, non-menu-list flyouts); otherwise wraps
          `submenu` in a nested Menu. */}
      {hasSubmenu && submenuOpen && ReactDOM.createPortal(
        <div
          ref={submenuRef}
          data-menu-submenu-for={item.id}
          style={{ position: "fixed", top: submenuPos.top, bottom: submenuPos.bottom, left: submenuPos.left, right: submenuPos.right }}
          className="z-50"
          onMouseEnter={openSubmenu}
          onMouseLeave={closeSubmenu}
        >
          {item.submenuContent ?? <Menu items={item.submenu!} />}
        </div>,
        document.body
      )}
    </div>
  );
};

export { Menu };
export type { MenuItemDef, MenuEntry, MenuProps, MenuSectionLabel };
