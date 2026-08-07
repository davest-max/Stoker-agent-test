import * as React from "react";
import { cn } from "../lib/utils";

/* ── Types ── */

export type ToggleGroupType = "single" | "multiple";

export interface ToggleGroupItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface ToggleGroupProps {
  /** Items to render */
  items: ToggleGroupItem[];
  /** Selection mode */
  type?: ToggleGroupType;
  /** Controlled selected value (single mode) */
  value?: string;
  /** Controlled selected values (multiple mode) */
  values?: string[];
  /** Default selected value (single, uncontrolled) */
  defaultValue?: string;
  /** Default selected values (multiple, uncontrolled) */
  defaultValues?: string[];
  /** Called when selection changes */
  onValueChange?: (value: string) => void;
  /** Called when selection changes (multiple mode) */
  onValuesChange?: (values: string[]) => void;
  /** Disable all items */
  disabled?: boolean;
  /** Additional className on the root */
  className?: string;
}

/* ── Component ── */

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
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
      disabled,
      className,
    },
    ref
  ) => {
    /* ── Uncontrolled internal state ── */
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

    const isSelected = (itemValue: string) =>
      type === "multiple"
        ? currentValues.includes(itemValue)
        : currentValue === itemValue;

    const handleClick = (itemValue: string) => {
      if (type === "multiple") {
        const next = currentValues.includes(itemValue)
          ? currentValues.filter((v) => v !== itemValue)
          : [...currentValues, itemValue];
        if (!isControlledMulti) setInternalValues(next);
        onValuesChange?.(next);
      } else {
        // Single: clicking selected item deselects it
        const next = currentValue === itemValue ? "" : itemValue;
        if (!isControlledSingle) setInternalValue(next);
        onValueChange?.(next);
      }
    };

    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          "inline-flex items-center rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-base p-0.5 gap-0",
          className
        )}
      >
        {items.map((item, i) => {
          const selected = isSelected(item.value);
          const isDisabled = disabled || item.disabled;

          /* Divider is always rendered between items to prevent layout shift,
           * but invisible when either neighbour is selected. */
          const prevSelected = i > 0 && isSelected(items[i - 1].value);
          const dividerVisible = i > 0 && !selected && !prevSelected;

          return (
            <React.Fragment key={item.value}>
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-px h-4 bg-lyra-border-subtle flex-shrink-0 transition-opacity",
                    dividerVisible ? "opacity-100" : "opacity-0"
                  )}
                />
              )}
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={isDisabled}
                onClick={() => !isDisabled && handleClick(item.value)}
                className={cn(
                  "relative px-3 py-1.5 lyra-body-md rounded-lyra-sm transition-colors select-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-1",
                  /* Off — border always present but transparent, so hover/press don't shift layout */
                  !selected && !isDisabled && [
                    "text-lyra-fg-default border border-transparent",
                    "hover:bg-lyra-bg-surface-shell hover:border-lyra-border-default",
                    "active:bg-lyra-bg-disabled active:border-lyra-border-default",
                  ],
                  /* Disabled */
                  isDisabled && !selected && "text-lyra-fg-disabled cursor-not-allowed border border-transparent",
                  /* Selected / On */
                  selected && !isDisabled && [
                    "bg-lyra-bg-active-subtle border border-lyra-border-active text-lyra-fg-active-strong font-medium",
                    "hover:bg-lyra-state-hover-active-subtle",
                    "active:bg-lyra-state-pressed-active-subtle",
                  ],
                  /* Selected + disabled */
                  selected && isDisabled && [
                    "bg-lyra-bg-active-subtle border border-lyra-border-disabled text-lyra-fg-disabled",
                  ],
                )}
              >
                {item.label}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  }
);

ToggleGroup.displayName = "ToggleGroup";

export { ToggleGroup };
