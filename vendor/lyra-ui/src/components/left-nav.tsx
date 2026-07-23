import * as React from "react";
import { useMemo, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TreeMenu, type TreeMenuItem } from "./tree-menu";
import { Tooltip } from "./tooltip";
import { cn } from "../lib/utils";

/* ── Types ── */

export interface NavChild {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  expandable?: boolean;
  defaultOpen?: boolean;
  children?: NavChild[];
  onClick?: () => void;
}

/* ── LeftNav ── */

interface LeftNavProps extends React.HTMLAttributes<HTMLElement> {
  /** Navigation items to render */
  items: NavItem[];
  /** Whether the nav is expanded or collapsed */
  open?: boolean;
  /** Called when the toggle button is clicked */
  onToggle?: () => void;
  /** Show/hide the collapse toggle button */
  collapsible?: boolean;
  /**
   * Overlay mode (narrow screens): the aside keeps a fixed 52px footprint;
   * the expanded panel slides out as an absolutely-positioned overlay.
   */
  overlay?: boolean;
  /** Content pinned to the bottom of the nav rail (e.g. a CreateNew button) */
  footer?: React.ReactNode;
  /**
   * Content pinned to the very top of the nav rail, above everything else
   * — exempt from scrolling, unlike `header` below (e.g. a CreateNew
   * trigger button, which should always stay put while a long list of
   * interaction cards or nav items scrolls underneath it). Like `footer`,
   * consumers should pass their own `expanded` prop tied to `open` in
   * inline mode; overlay mode auto-injects it based on hover state.
   */
  pinnedHeader?: React.ReactNode;
  /**
   * Content rendered at the top of the scrollable item list (e.g. a list
   * of InteractionNavItem active-interaction cards) — scrolls together
   * with the nav items below it in one continuous region, rather than
   * being fixed itself. Use `pinnedHeader` instead for content that must
   * stay fixed (e.g. the CreateNew trigger). Consumers should pass their
   * own `expanded` prop tied to `open` in inline mode; overlay mode
   * auto-injects it based on hover state.
   */
  header?: React.ReactNode;
}

/**
 * Clone `expanded` onto every top-level element inside `node` — used to
 * auto-inject overlay mode's `hoverOpen` into `header`/`footer`. Consumers
 * commonly pass more than one element (e.g. a `CreateNew` button plus a
 * list of `InteractionNavItem` cards) wrapped in a `<>...</>` fragment.
 * `React.isValidElement`/`cloneElement` treat a fragment as a single
 * element and clone the fragment itself, which doesn't forward props to
 * its children — so a bare `cloneElement(node, { expanded })` silently
 * no-ops for fragment children. This unwraps one level of fragment first,
 * then clones each real child, so both a single element and a
 * multi-element fragment get `expanded` applied correctly.
 */
function injectExpanded(node: React.ReactNode, expanded: boolean): React.ReactNode {
  const children =
    React.isValidElement(node) && node.type === React.Fragment
      ? (node.props as { children?: React.ReactNode }).children
      : node;

  return React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child as React.ReactElement<{ expanded?: boolean }>, { expanded })
      : child
  );
}

/** Convert NavItem[] → TreeMenuItem[] so TreeMenu can render them */
function toTreeItems(items: NavItem[]): TreeMenuItem[] {
  return items.map((item) => ({
    icon: item.icon,
    label: item.label,
    active: item.active,
    defaultOpen: item.defaultOpen,
    onClick: item.onClick,
    children: item.expandable ? item.children : undefined,
  }));
}

const LeftNav = React.forwardRef<HTMLElement, LeftNavProps>(
  (
    {
      className,
      items,
      open = true,
      onToggle,
      collapsible = true,
      overlay = false,
      footer,
      pinnedHeader,
      header,
      ...props
    },
    ref
  ) => {
    const treeItems = useMemo(() => toTreeItems(items), [items]);

    // Hover-open state used in overlay mode
    const [hoverOpen, setHoverOpen] = useState(false);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const onHoverStart = useCallback(() => {
      clearTimeout(hoverTimer.current);
      setHoverOpen(true);
    }, []);
    const onHoverEnd = useCallback(() => {
      hoverTimer.current = setTimeout(() => setHoverOpen(false), 300);
    }, []);

    const toggleButton = collapsible ? (
      <Tooltip content={open ? "Collapse sidebar" : "Expand sidebar"} placement="right" asLabel>
        <button
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          className={cn(
            "absolute -right-3 top-[25px] z-10 flex h-5 w-5 items-center justify-center rounded-full border border-lyra-border-default bg-lyra-bg-surface-base text-lyra-fg-secondary shadow-sm hover:bg-lyra-bg-surface-shell transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
            // Fixed regardless of `header` — this button must stay aligned
            // with the page's PageHeader row (an external, constant-height
            // sibling elsewhere in the layout), not shift based on whatever
            // content happens to be first inside `header`.
          )}
        >
          {open ? (
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>
      </Tooltip>
    ) : null;

    // No `overflow`/`flex-1` of its own — this list shares one scroll
    // region with `header` (see the scroll wrapper in both render branches
    // below), rather than owning its own separate scrollbar. `flex-shrink-0`
    // on both the `<nav>` and each item guards against the rail's items
    // compressing their spacing to fit when content overflows instead of
    // scrolling — the bug this replaced (see left-nav.tsx's git history/
    // PROJECT_SUMMARY.md for the reference screenshot).
    const iconOnlyNav = (
      <nav aria-label="Main navigation" className="flex flex-shrink-0 flex-col gap-0.5 items-center">
        {items.map((item, i) => {
          const isActive =
            item.active ||
            (item.children && item.children.some((c) => c.active));
          return (
            <Tooltip key={i} content={item.label} placement="right" asLabel>
              <button
                onClick={item.onClick}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lyra-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
                  isActive
                    ? "bg-lyra-bg-active-moderate text-lyra-fg-active-strong"
                    : "text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed"
                )}
              >
                <span aria-hidden="true">{item.icon}</span>
              </button>
            </Tooltip>
          );
        })}
      </nav>
    );

    /* ── Overlay mode (narrow screens): hover to open, no toggle button ── */
    if (overlay) {
      return (
        <aside
          ref={ref}
          aria-label="Main navigation"
          className={cn("relative z-10 flex-shrink-0 overflow-visible bg-lyra-bg-surface-shell w-[52px]", className)}
          onMouseEnter={onHoverStart}
          onMouseLeave={onHoverEnd}
          {...props}
        >
          {/* Sliding panel: 52px footprint when closed, 256px overlay when open */}
          <div
            className="absolute left-0 top-0 bottom-0 flex flex-col bg-lyra-bg-surface-shell overflow-hidden"
            style={{
              width: hoverOpen ? 256 : 52,
              zIndex: hoverOpen ? 20 : 10,
              transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: hoverOpen ? "4px 0 12px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {pinnedHeader && (
              // No top padding here — the pinned header's first item (e.g.
              // CreateNew) should sit flush with the rail's top edge,
              // top-aligned with the container itself rather than inset to
              // match the nav list. Exempt from scrolling, unlike `header`
              // below (see the scroll wrapper's own comment).
              <div className={cn("flex-shrink-0 flex flex-col items-center px-2 pt-0", hoverOpen ? "gap-2" : "gap-1")}>
                {injectExpanded(pinnedHeader, hoverOpen)}
              </div>
            )}
            {/* `header` (e.g. InteractionNavItem cards) and the nav item
                list share one scrollable region — the nav list stays in
                its normal flow position right after `header`'s content
                (no artificial gap when there are only one or two cards),
                but is `position: sticky; bottom: 0`, so once a long list
                of cards would otherwise push it below the visible rail, it
                sticks to the bottom of the scroll viewport instead and the
                cards keep scrolling underneath/behind it (see the
                reference screenshot in PROJECT_SUMMARY.md — the nav items
                scrolled out of view entirely before this; an earlier fix
                pinned them to the bottom *unconditionally*, which the user
                caught as wrong too — it left a large empty gap above them
                whenever there were only a few cards, since "sticky", not
                "always pinned regardless of content", is what was asked
                for). Needs an opaque background so scrolled-under cards
                don't show through the nav items' icons/labels. */}
            <div className="flex flex-1 flex-col overflow-hidden min-h-0">
              <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden lyra-scrollbar-hide min-h-0">
                {/* No `gap` here — `header` (InteractionNavItem cards) supplies its own
                    bottom margin per item (see InteractionNavItem), so spacing only
                    appears when there's a real card to space out. */}
                {header && (
                  <div className={cn("flex flex-shrink-0 flex-col px-2 pt-3", hoverOpen ? "items-stretch" : "items-center")}>
                    {injectExpanded(header, hoverOpen)}
                  </div>
                )}
                <div className={cn("sticky bottom-0 flex flex-shrink-0 flex-col bg-lyra-bg-surface-shell px-2 pb-3", !header && "pt-3")}>
                  {hoverOpen ? <TreeMenu items={treeItems} /> : iconOnlyNav}
                </div>
              </div>
            </div>
            {footer && (
              <div className="flex-shrink-0 flex items-center justify-center px-2 pb-3">
                {injectExpanded(footer, hoverOpen)}
              </div>
            )}
          </div>
        </aside>
      );
    }

    /* ── Default (inline) mode ── */
    return (
      <aside
        ref={ref}
        aria-label="Main navigation"
        className={cn(
          "relative z-10 flex h-full flex-shrink-0 flex-col overflow-visible bg-lyra-bg-surface-shell transition-all duration-200",
          open ? "w-[256px]" : "w-[52px]",
          className
        )}
        {...props}
      >
        {toggleButton}

        {pinnedHeader && (
          // Same reasoning as the overlay branch above: flush to the top,
          // no pt-3 inset, so the pinned header's first item (CreateNew) is
          // top-aligned with the rail itself. Exempt from scrolling — see
          // the scroll wrapper's own comment below.
          <div className={cn("flex-shrink-0 flex flex-col items-center px-2 pt-0", open ? "gap-2" : "gap-1")}>
            {pinnedHeader}
          </div>
        )}

        {/* Scroll wrapper — overflow-hidden + min-h-0 on the outer div constrains height so
            overflow-y-auto on the inner div triggers. The aside keeps overflow-visible for
            the toggle button that pokes out; this wrapper sits as a sibling to that button.
            `header` (e.g. InteractionNavItem cards) and the nav item list share one
            scrollable region — the nav list stays in its normal flow position right after
            `header`'s content (no artificial gap when there are only one or two cards), but
            is `position: sticky; bottom: 0`, so once a long list of cards would otherwise
            push it below the visible rail, it sticks to the bottom of the scroll viewport
            instead and the cards keep scrolling underneath/behind it (see the reference
            screenshot in PROJECT_SUMMARY.md — the nav items scrolled out of view entirely
            before this; an earlier fix pinned them to the bottom *unconditionally*, which the
            user caught as wrong too — it left a large empty gap above them whenever there
            were only a few cards, since "sticky", not "always pinned regardless of content",
            is what was asked for). Needs an opaque background so scrolled-under cards don't
            show through the nav items' icons/labels. */}
        <div className="flex flex-1 flex-col overflow-hidden min-h-0">
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden lyra-scrollbar-hide min-h-0">
            {/* No `gap` here — `header`'s items (InteractionNavItem cards) carry their own
                bottom margin, so an empty-but-truthy `header` (e.g. a Fragment wrapping a
                zero-length `.map()`) contributes zero visible space instead of a phantom gap
                before the nav list below. */}
            {header && (
              <div className={cn("flex flex-shrink-0 flex-col px-2 pt-3", open ? "items-stretch" : "items-center")}>
                {header}
              </div>
            )}
            <div className={cn("sticky bottom-0 flex flex-shrink-0 flex-col bg-lyra-bg-surface-shell px-2 pb-3", !header && "pt-3")}>
              {open ? <TreeMenu items={treeItems} /> : iconOnlyNav}
            </div>
          </div>
        </div>
        {footer && (
          <div className="flex-shrink-0 flex items-center justify-center px-2 pb-3">
            {footer}
          </div>
        )}
      </aside>
    );
  }
);
LeftNav.displayName = "LeftNav";

export { LeftNav };
export type { LeftNavProps };
