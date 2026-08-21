import * as React from "react";
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { ErrorIcon } from "./icons/error-icon";
import { Select } from "./select";
import { Tooltip } from "./tooltip";
import { cn } from "../lib/utils";

/* ── Types ── */

interface FilterChipOption {
  /** Unique value */
  value: string;
  /** Display label */
  label: string;
}

type FilterChipVariant = "default" | "active" | "error" | "disabled";

/* ── CVA definitions ── */

const filterChipVariants = cva(
  "inline-flex items-center gap-1.5 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:  "border-lyra-border-default bg-lyra-bg-control-subtle text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
        active:   "border-lyra-border-active bg-lyra-bg-active-subtle text-lyra-fg-active-strong hover:bg-lyra-state-hover-active-subtle active:bg-lyra-state-pressed-active-subtle",
        error:    "border-lyra-status-critical-strong bg-lyra-status-critical-subtle text-lyra-status-critical-strong hover:bg-lyra-state-hover-critical-subtle active:bg-lyra-state-pressed-critical-subtle",
        disabled: "border-lyra-border-disabled bg-lyra-bg-disabled text-lyra-fg-disabled cursor-not-allowed",
      },
      /** `sm` is a deliberately compact treatment for toolbars/filter rows
       *  that need several chips side by side without dominating the row
       *  the way the default size does — see `FilterChipProps.size`'s own
       *  doc comment. */
      size: {
        sm: "h-6 px-2",
        md: "h-8 px-3",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

/** Segment color classes (bg + text only, no border) — used in operator wrapper */
const filterChipSegmentColorVariants = cva("", {
  variants: {
    variant: {
      default:  "bg-lyra-bg-control-subtle text-lyra-fg-default",
      active:   "bg-lyra-bg-active-subtle text-lyra-fg-active-strong",
      error:    "bg-lyra-status-critical-subtle text-lyra-status-critical-strong",
      disabled: "bg-lyra-bg-disabled text-lyra-fg-disabled",
    },
  },
  defaultVariants: { variant: "default" },
});

/** Outer border color — used for the operator wrapper div */
const filterChipOuterBorderVariants = cva("", {
  variants: {
    variant: {
      default:  "border-lyra-border-default",
      active:   "border-lyra-border-active",
      error:    "border-lyra-status-critical-strong",
      disabled: "border-lyra-border-disabled",
    },
  },
  defaultVariants: { variant: "default" },
});

/** Remove button classes */
const filterChipRemoveButtonVariants = cva(
  "inline-flex items-center justify-center -ml-px rounded-r-lyra-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:  "border-lyra-border-default bg-lyra-bg-control-subtle text-lyra-fg-secondary hover:bg-lyra-state-hover hover:text-lyra-fg-default active:bg-lyra-state-pressed",
        active:   "border-lyra-border-active bg-lyra-bg-active-subtle text-lyra-fg-active-strong hover:bg-lyra-state-hover-active-subtle active:bg-lyra-state-pressed-active-subtle",
        error:    "border-lyra-status-critical-strong bg-lyra-status-critical-subtle text-lyra-status-critical-strong hover:bg-lyra-state-hover-critical-subtle active:bg-lyra-state-pressed-critical-subtle",
        disabled: "border-lyra-border-disabled bg-lyra-bg-disabled text-lyra-fg-disabled cursor-not-allowed",
      },
      size: {
        sm: "h-6 w-6",
        md: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

interface FilterChipProps {
  /** Filter label (e.g. "Status", "Region") */
  label: string;
  /** Available options in the dropdown */
  options: FilterChipOption[];
  /** Currently selected values */
  selectedValues?: string[];
  /** Called when selection changes */
  onSelectionChange?: (values: string[]) => void;
  /**
   * Operator options (e.g. Contains, Equals, Starts With).
   * When provided, a separate operator selector is rendered between the label and value.
   */
  operators?: FilterChipOption[];
  /** Currently selected operator value */
  selectedOperator?: string;
  /** Called when the operator changes */
  onOperatorChange?: (operator: string) => void;
  /** Error state — shows red styling and error icon */
  error?: boolean;
  /** Disable the chip */
  disabled?: boolean;
  /** Show a remove (×) button — called when the chip is dismissed */
  onRemove?: () => void;
  /**
   * Which edge of the trigger the dropdown's own edge aligns to — "left"
   * (default) anchors the dropdown's left edge to the trigger's left edge
   * and grows rightward; "right" anchors the dropdown's right edge to the
   * trigger's right edge and grows leftward instead. Neither this nor
   * `Select` (which this wraps) does automatic viewport-collision
   * flipping — a chip positioned near the right edge of its container
   * needs `dropdownAlign="right"` explicitly, or its dropdown will
   * overflow off the screen. `DashboardCard`'s header filter chip defaults
   * to `"right"` for exactly this reason (see `dashboard-card.tsx`).
   */
  dropdownAlign?: "left" | "right";
  /**
   * Compact sizing for dense toolbars/filter rows — `"sm"` drops the chip
   * to `h-6` (from the default `h-8`) with tighter padding and `lyra-body-sm`
   * typography instead of `lyra-body-md`, so several filter chips can sit
   * next to a primary search field without reading at the same visual
   * weight as it. Default `"md"` — every existing consumer keeps its
   * current size unless it opts in.
   */
  size?: "sm" | "md";
  /** Additional className */
  className?: string;
}

/* ── FilterChip ── */

const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  (
    {
      label,
      options,
      selectedValues = [],
      onSelectionChange,
      operators,
      selectedOperator,
      onOperatorChange,
      error = false,
      disabled = false,
      onRemove,
      dropdownAlign = "left",
      size = "md",
      className,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [operatorOpen, setOperatorOpen] = useState(false);
    const hasOperators = operators && operators.length > 0;
    const operatorLabel = hasOperators
      ? operators!.find((o) => o.value === selectedOperator)?.label ?? operators![0]?.label
      : null;
    const isSm = size === "sm";
    /** `lyra-body-sm`/`-emphasis` at `sm`, `lyra-body-md`/`-emphasis` at
     *  `md` — kept as two small lookups rather than sprinkling the ternary
     *  at every call site below. */
    const labelTextClass = isSm ? "lyra-body-sm-emphasis" : "lyra-body-md-emphasis";
    const valueTextClass = isSm ? "lyra-body-sm" : "lyra-body-md";

    const hasValues = selectedValues.length > 0;
    const firstSelectedLabel = hasValues
      ? options.find((o) => o.value === selectedValues[0])?.label ?? selectedValues[0]
      : null;
    const extraCount = selectedValues.length - 1;

    /* Variant */
    const variant: FilterChipVariant = disabled
      ? "disabled"
      : error
        ? "error"
        : hasValues
          ? "active"
          : "default";

    /* Chip trigger button */
    const chipTrigger = (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          filterChipVariants({ variant, size }),
          // In operator wrapper, the trigger has no visible border (wrapper provides it)
          hasOperators
            ? "border-0 rounded-none"
            : onRemove && !disabled ? "rounded-l-lyra-md" : "rounded-lyra-md",
        )}
      >
        {/* Error icon */}
        {variant === "error" && (
          <ErrorIcon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
        )}

        {/* Label + value — when no operators, include label inline */}
        {!hasOperators && (
          hasValues ? (
            <span className="inline-flex items-baseline gap-1 max-w-[200px]">
              <span className={cn(labelTextClass, "whitespace-nowrap")}>{label}:</span>
              <span className={cn(valueTextClass, "truncate")}>{firstSelectedLabel}</span>
            </span>
          ) : (
            <span className={cn(labelTextClass, "text-lyra-fg-default whitespace-nowrap")}>{label}</span>
          )
        )}
        {/* Value only — when operators are shown, label+operator are separate segments */}
        {hasOperators && (
          hasValues ? (
            <span className={cn(valueTextClass, "truncate max-w-[120px]")}>{firstSelectedLabel}</span>
          ) : (
            <span className={cn(valueTextClass, "text-lyra-fg-disabled whitespace-nowrap")}>Value</span>
          )
        )}

        {/* Extra count badge */}
        {extraCount > 0 && (
          <span
            className={cn(
              "inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-lyra-xs lyra-body-sm-emphasis",
              variant === "active" && "bg-lyra-state-pressed-active-subtle text-lyra-fg-active-strong",
              variant === "error" && "bg-lyra-state-pressed-critical-subtle text-lyra-status-critical-strong"
            )}
          >
            +{extraCount}
          </span>
        )}

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0 transition-transform",
            open && "rotate-180"
          )}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </button>
    );

    /* Color/bg/text — no border (used inside operator wrapper) */
    const segmentColor = filterChipSegmentColorVariants({ variant });

    /* Outer border color */
    const outerBorder = filterChipOuterBorderVariants({ variant });

    /* Operator trigger button — no border, just color */
    const operatorTrigger = hasOperators ? (
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={operatorOpen}
        className={cn(
          "inline-flex items-center gap-1.5 transition-colors whitespace-nowrap",
          isSm ? "h-6 px-1.5" : "h-8 px-2",
          segmentColor,
          !disabled && variant === "default" && "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
          !disabled && variant === "active" && "hover:bg-lyra-state-hover-active-subtle active:bg-lyra-state-pressed-active-subtle",
          !disabled && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-inset"
        )}
      >
        <span className={labelTextClass}>{operatorLabel}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 flex-shrink-0 transition-transform", operatorOpen && "rotate-180")}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </button>
    ) : null;

    /* When operators present: render everything inside a single bordered wrapper */
    if (hasOperators && operators) {
      return (
        <div className={cn("inline-flex", className)}>
          <div className={cn(
            "inline-flex items-center rounded-l-lyra-md border overflow-hidden",
            isSm ? "h-6" : "h-8",
            outerBorder, segmentColor,
            onRemove && !disabled ? "rounded-r-none" : "rounded-r-lyra-md"
          )}>
            {/* Label */}
            <span className={cn(isSm ? "px-2" : "px-3", labelTextClass, "whitespace-nowrap select-none")}>{label}:</span>

            {/* Operator selector */}
            <Select
              options={operators}
              portalDropdown
              value={selectedOperator ?? operators[0]?.value}
              onValueChange={onOperatorChange}
              onOpenChange={setOperatorOpen}
              disabled={disabled}
              trigger={operatorTrigger!}
              dropdownAlign={dropdownAlign}
              className="inline-flex relative"
            />

            {/* Value selector — reuse chipTrigger but strip its own border */}
            <Select
              options={options}
              multiple
              searchable
              showSelectAll
              portalDropdown
              values={selectedValues}
              onValuesChange={onSelectionChange}
              onOpenChange={setOpen}
              disabled={disabled}
              trigger={chipTrigger}
              dropdownAlign={dropdownAlign}
              className="inline-flex relative"
            />
          </div>

          {/* Remove button */}
          {onRemove && !disabled && (
            <Tooltip content={`Remove ${label} filter`} placement="top" asLabel>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              aria-label={`Remove ${label} filter`}
              className={filterChipRemoveButtonVariants({ variant, size })}
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            </Tooltip>
          )}
        </div>
      );
    }

    return (
      <div className={cn("inline-flex", className)}>
        <Select
          options={options}
          multiple
          searchable
          showSelectAll
          portalDropdown
          values={selectedValues}
          onValuesChange={onSelectionChange}
          onOpenChange={setOpen}
          disabled={disabled}
          trigger={chipTrigger}
          dropdownAlign={dropdownAlign}
          className="inline-flex relative"
        />

        {/* Remove button */}
        {onRemove && !disabled && (
          <Tooltip content={`Remove ${label} filter`} placement="top" asLabel>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label={`Remove ${label} filter`}
            className={filterChipRemoveButtonVariants({ variant, size })}
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          </Tooltip>
        )}
      </div>
    );
  }
);
FilterChip.displayName = "FilterChip";

export { FilterChip, filterChipVariants };
export type { FilterChipProps, FilterChipOption, FilterChipVariant };
