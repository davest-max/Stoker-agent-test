import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { CollapsiblePanel } from "./tree-menu";

/* ── Types ── */

export interface AccordionItem {
  /** Unique identifier */
  id: string;
  /** Trigger label. Accepts a plain string or richer content (e.g. a name + status Tag) */
  title: React.ReactNode;
  /** Optional secondary text rendered below the title. Accepts a plain string or richer content (e.g. a multi-line summary) */
  subhead?: React.ReactNode;
  /** Optional icon rendered left of the title */
  icon?: React.ReactNode;
  /** Content rendered when the item is open */
  content: React.ReactNode;
  /**
   * Extra content rendered at the end of the trigger row, between the
   * title/subhead and the chevron — e.g. a couple of `DashboardCard`'s
   * `Metric`s ("Skills" "4", "Contacts" "8") inline with a queue row.
   * Rendered inside the same `<button>` as the rest of the row, so
   * anything passed here should stay non-interactive (display-only); an
   * interactive control here would be a button-inside-a-button.
   */
  endSlot?: React.ReactNode;
  /** Prevent this item from being opened */
  disabled?: boolean;
}

export interface AccordionProps {
  /** Accordion items */
  items: AccordionItem[];
  /**
   * "single" — only one item open at a time (default)
   * "multiple" — multiple items can be open simultaneously
   */
  type?: "single" | "multiple";
  /** Controlled open id (single mode) */
  value?: string;
  /** Controlled open ids (multiple mode) */
  values?: string[];
  /** Default open id (single, uncontrolled) */
  defaultValue?: string;
  /** Default open ids (multiple, uncontrolled) */
  defaultValues?: string[];
  /** Called when open item changes (single mode) */
  onValueChange?: (value: string) => void;
  /** Called when open items change (multiple mode) */
  onValuesChange?: (values: string[]) => void;
  /** Additional className on the root element */
  className?: string;
}

/* ── Component ── */

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      items,
      type = "single",
      value,
      values,
      defaultValue,
      defaultValues,
      onValueChange,
      onValuesChange,
      className,
    },
    ref
  ) => {
    /* ── Uncontrolled state ── */
    const [internalValue, setInternalValue] = React.useState<string>(
      defaultValue ?? ""
    );
    const [internalValues, setInternalValues] = React.useState<string[]>(
      defaultValues ?? []
    );

    const isControlledSingle = value !== undefined;
    const isControlledMulti = values !== undefined;

    const currentValue = isControlledSingle ? value : internalValue;
    const currentValues = isControlledMulti ? values : internalValues;

    const isOpen = (id: string) =>
      type === "multiple"
        ? currentValues.includes(id)
        : currentValue === id;

    const toggle = (id: string) => {
      if (type === "multiple") {
        const next = currentValues.includes(id)
          ? currentValues.filter((v) => v !== id)
          : [...currentValues, id];
        if (!isControlledMulti) setInternalValues(next);
        onValuesChange?.(next);
      } else {
        const next = currentValue === id ? "" : id;
        if (!isControlledSingle) setInternalValue(next);
        onValueChange?.(next);
      }
    };

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {items.map((item) => {
          const open = isOpen(item.id);
          return (
            <div key={item.id}>
              {/* Trigger row */}
              <button
                type="button"
                disabled={item.disabled}
                aria-expanded={open}
                onClick={() => !item.disabled && toggle(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-inset",
                  item.disabled
                    ? "cursor-not-allowed"
                    : "hover:bg-lyra-state-hover active:bg-lyra-state-pressed cursor-pointer"
                )}
              >
                {/* Title (+ icon) row + optional subhead below. Icon sits in
                    its own inner row with the title — not as a sibling of
                    the whole title+subhead+endSlot block — so it centers
                    against the title text specifically. Left as a direct
                    sibling of the block (the old structure), the button's
                    own `items-center` centers the icon against whichever
                    sibling is tallest, which became the metric `endSlot`
                    boxes once those shipped — visibly off from the title
                    it's meant to sit next to. */}
                <span className="flex-1 flex flex-col min-w-0">
                  <span className="flex items-center gap-2 min-w-0">
                    {item.icon && (
                      <span
                        className={cn(
                          "flex-shrink-0",
                          item.disabled ? "text-lyra-fg-disabled" : "text-lyra-fg-secondary"
                        )}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span
                      className={cn(
                        "lyra-body-md truncate",
                        item.disabled ? "text-lyra-fg-disabled" : "text-lyra-fg-default"
                      )}
                    >
                      {item.title}
                    </span>
                  </span>
                  {item.subhead && (
                    <span
                      className={cn(
                        "lyra-body-sm",
                        // Indent to align under the title text (not the
                        // icon) — only when there is an icon to clear;
                        // pl-7 (28px) = the icon's own width (h-5, 20px)
                        // plus the gap-2 (8px) between it and the title.
                        item.icon && "pl-7",
                        item.disabled ? "text-lyra-fg-disabled" : "text-lyra-fg-secondary"
                      )}
                    >
                      {item.subhead}
                    </span>
                  )}
                </span>

                {/* End slot — e.g. a couple of DashboardCard `Metric`s inline with the row */}
                {item.endSlot && (
                  <span className="flex flex-shrink-0 items-center gap-2">{item.endSlot}</span>
                )}

                {/* Chevron */}
                <ChevronDown
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                    open && "rotate-180",
                    item.disabled ? "text-lyra-fg-disabled" : "text-lyra-fg-secondary"
                  )}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </button>

              {/* Collapsible content */}
              <CollapsiblePanel open={open}>
                <div className="p-4">{item.content}</div>
              </CollapsiblePanel>

              {/* Divider */}
              <div className="border-b border-lyra-border-subtle" />
            </div>
          );
        })}
      </div>
    );
  }
);

Accordion.displayName = "Accordion";

export { Accordion };
