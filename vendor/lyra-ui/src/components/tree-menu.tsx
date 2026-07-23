import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

/* ── Types ── */

export interface TreeMenuChild {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export interface TreeMenuItem {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  children?: TreeMenuChild[];
  defaultOpen?: boolean;
  onClick?: () => void;
}

/* ── CollapsiblePanel (animated height) ── */

function CollapsiblePanel({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(open ? undefined as number | undefined : 0);
  const isOpen = useRef(open);
  const isAnimating = useRef(false);
  const isInitialRender = useRef(true);

  /* Keep content height in sync while open (handles dynamic content) */
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const ro = new ResizeObserver(() => {
      if (isOpen.current && !isAnimating.current) {
        setHeight(content.scrollHeight);
      }
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  /* Set explicit pixel height on first render if defaultOpen */
  useEffect(() => {
    if (open && contentRef.current && height === undefined) {
      setHeight(contentRef.current.scrollHeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Animate open/close */
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const el = wrapperRef.current;
    const content = contentRef.current;
    if (!el || !content) return;

    isAnimating.current = true;
    isOpen.current = open;

    if (open) {
      setHeight(content.scrollHeight);
    } else {
      /* Pin to current scrollHeight, force reflow, then collapse to 0 */
      const scrollH = content.scrollHeight;
      setHeight(scrollH);
      requestAnimationFrame(() => {
        el.getBoundingClientRect();
        setHeight(0);
      });
    }
  }, [open]);

  const handleTransitionEnd = () => {
    isAnimating.current = false;
    /* Keep height as explicit pixels — never switch to auto */
    if (open && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        height: height ?? 0,
        overflow: "hidden",
        transition: "height 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

/* ── TreeMenu ── */

interface TreeMenuProps extends React.HTMLAttributes<HTMLElement> {
  /** Menu items to render */
  items: TreeMenuItem[];
}

const TreeMenu = React.forwardRef<HTMLElement, TreeMenuProps>(
  ({ className, items, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="Navigation menu"
      className={cn("flex flex-col gap-0.5 py-1", className)}
      {...props}
    >
      <ul role="tree" className="flex flex-col gap-0.5 list-none m-0 p-0">
        {items.map((item, i) => (
          <li key={i} role="treeitem" aria-expanded={item.children && item.children.length > 0 ? undefined : undefined}>
            <TreeMenuRow item={item} />
          </li>
        ))}
      </ul>
    </nav>
  )
);
TreeMenu.displayName = "TreeMenu";

/* ── TreeMenuRow (internal) ── */

function TreeMenuRow({ item }: { item: TreeMenuItem }) {
  const [open, setOpen] = useState(item.defaultOpen ?? false);
  const hasChildren = item.children && item.children.length > 0;
  const isParentActive =
    item.active || (hasChildren && item.children!.some((c) => c.active));
  /* Leaf items (no children) that are active get the stronger moderate bg */
  const isLeafActive = item.active && !hasChildren;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setOpen((v) => !v);
          item.onClick?.();
        }}
        aria-expanded={hasChildren ? open : undefined}
        className={cn(
          "relative flex w-full items-center gap-2.5 rounded-lyra-sm px-2.5 h-9 lyra-body-md transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
          isLeafActive
            ? "bg-lyra-bg-active-moderate text-lyra-fg-active-strong lyra-body-md-emphasis hover:bg-lyra-bg-active-moderate active:bg-lyra-bg-active-subtle"
            : isParentActive
              ? "text-lyra-fg-active-strong lyra-body-md-emphasis hover:bg-lyra-state-hover active:bg-lyra-state-pressed"
              : "text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed"
        )}
      >
        {/* Left accent bar — visible only on leaf (non-expandable) active items */}
        {isLeafActive && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-lyra-border-active"
          />
        )}
        {item.icon && (
          <span aria-hidden="true" className={cn("flex-shrink-0", isParentActive || isLeafActive ? "text-lyra-fg-active-strong" : "text-lyra-fg-default")}>{item.icon}</span>
        )}
        <span className="flex-1 text-left truncate">{item.label}</span>
        {hasChildren && (
          <span
            aria-hidden="true"
            className="text-lyra-fg-disabled transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
          </span>
        )}
      </button>

      {/* Children — animated expand/collapse */}
      {hasChildren && (
        <CollapsiblePanel open={open}>
          <ul role="group" className="ml-[18px] mt-0.5 flex flex-col gap-0.5 pl-3 list-none border-l border-lyra-border-subtle">
            {item.children!.map((child, j) => (
              <li key={j} role="treeitem">
                <button
                  onClick={child.onClick}
                  aria-current={child.active ? "page" : undefined}
                  className={cn(
                    "relative w-full rounded-lyra-sm px-2.5 h-9 text-left lyra-body-md transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
                    child.active
                      ? "bg-lyra-bg-active-moderate text-lyra-fg-active-strong lyra-body-md-emphasis hover:bg-lyra-bg-active-moderate active:bg-lyra-bg-active-subtle"
                      : "text-lyra-fg-secondary hover:bg-lyra-state-hover hover:text-lyra-fg-default active:bg-lyra-state-pressed"
                  )}
                >
                  {child.active && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-lyra-border-active"
                    />
                  )}
                  {child.label}
                </button>
              </li>
            ))}
          </ul>
        </CollapsiblePanel>
      )}
    </div>
  );
}

export { TreeMenu, CollapsiblePanel };
export type { TreeMenuProps };
