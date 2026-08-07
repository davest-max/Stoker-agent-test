import * as React from "react";
import * as ReactDOM from "react-dom";
import { ChevronDown, Search, X, Check } from "lucide-react";
import { ErrorIcon } from "./icons/error-icon";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { cn } from "../lib/utils";

/* ── Types ── */

interface SelectOption {
  /** Unique value */
  value: string;
  /** Display label */
  label: string;
  /** Disable this option */
  disabled?: boolean;
}

/** One labeled section of options — see `SelectProps.optionGroups`. */
interface SelectOptionGroup {
  /** Section header shown above this group's options — omit for an
   *  unlabeled trailing group (e.g. "everything else" below a labeled
   *  "Recent" section). */
  label?: string;
  options: SelectOption[];
}

/* ── Select ── */

interface SelectProps {
  /** Label text displayed above the select */
  label?: string;
  /** Help text shown in a tooltip on the label's info icon */
  labelHelpText?: string;
  /** Marks the field as required — shows asterisk on label */
  required?: boolean;
  /** Marks the field as read-only — affects label and trigger styling */
  readonly?: boolean;
  /** Placeholder text when nothing is selected */
  placeholder?: string;
  /** Options to display */
  options: SelectOption[];
  /**
   * Renders the dropdown's option list as labeled sections (e.g. a
   * "Recent" group above the full list) instead of one flat list.
   * Single-select only — ignored when `multiple`. `options` is still
   * required and should be the flattened union of every group's options;
   * it's what drives the trigger's displayed label and the `searchable`
   * filter, which continues to run against `options` — a group is simply
   * skipped once none of its options remain in that filtered set.
   */
  optionGroups?: SelectOptionGroup[];
  /** Error message — triggers error styling */
  error?: string;
  /** Disable the select */
  disabled?: boolean;
  /** Allow multiple selections */
  multiple?: boolean;
  /** Show a search input in the dropdown */
  searchable?: boolean;
  /** Show a "select all" checkbox (only for multiple mode) */
  showSelectAll?: boolean;
  /**
   * Maximum number of items that can be selected (multiple mode only).
   * Shows a header with selection count. When limit is reached, remaining
   * options are disabled and the header changes to "Limit Reached (N)".
   */
  maxSelection?: number;
  /**
   * Custom label for the selection header (default: "Select up to N items").
   * Only used when maxSelection is set.
   */
  selectionLabel?: string;
  /** Custom trigger element — replaces the default button. Must accept a ref and onClick. */
  trigger?: React.ReactNode;

  /* ── Controlled single-select ── */
  /** Controlled value (single select) */
  value?: string;
  /** Called when the value changes (single select) */
  onValueChange?: (value: string) => void;

  /* ── Controlled multi-select ── */
  /** Controlled values (multi select) */
  values?: string[];
  /** Called when the values change (multi select) */
  onValuesChange?: (values: string[]) => void;

  /** Called when the dropdown opens or closes */
  onOpenChange?: (open: boolean) => void;

  /** Dropdown alignment relative to the trigger. Defaults to "left". */
  dropdownAlign?: "left" | "right";

  /** Render dropdown in a portal (fixed position) to escape overflow containers */
  portalDropdown?: boolean;

  /** Additional class on the root */
  className?: string;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      labelHelpText,
      required,
      readonly,
      placeholder = "Select...",
      options,
      optionGroups,
      error,
      disabled,
      multiple = false,
      searchable = false,
      showSelectAll = false,
      maxSelection,
      selectionLabel,
      trigger,
      value,
      onValueChange,
      values,
      onValuesChange,
      onOpenChange,
      dropdownAlign = "left",
      portalDropdown = true,
      className,
    },
    ref
  ) => {
    const autoId = React.useId();

    /* ── State ── */
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    // Uncontrolled fallback
    const [internalValue, setInternalValue] = React.useState<string>("");
    const [internalValues, setInternalValues] = React.useState<string[]>([]);

    const isControlledSingle = value !== undefined;
    const isControlledMulti = values !== undefined;

    const currentValue = isControlledSingle ? value : internalValue;
    const currentValues = isControlledMulti ? values : internalValues;

    const rootRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);
    const [portalStyle, setPortalStyle] = React.useState<React.CSSProperties>({});

    // Merge forwarded ref with internal ref
    const setTriggerRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        triggerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      },
      [ref]
    );

    /* ── Notify parent of open/close ── */
    React.useEffect(() => {
      onOpenChange?.(open);
    }, [open, onOpenChange]);

    /* ── Portal positioning — useLayoutEffect so position is set before first paint ── */
    React.useLayoutEffect(() => {
      if (!open || !portalDropdown || !triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPortalStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: dropdownAlign === "left" ? rect.left : undefined,
        right: dropdownAlign === "right" ? window.innerWidth - rect.right : undefined,
        width: trigger ? 240 : rect.width,
        zIndex: 9999,
      });
    }, [open, portalDropdown, dropdownAlign, trigger]);

    /* ── Filtered options ── */
    const filtered = React.useMemo(() => {
      if (!search) return options;
      const q = search.toLowerCase();
      return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, search]);

    /* ── Handlers ── */
    const toggleOpen = () => {
      if (disabled) return;
      setOpen((prev) => {
        if (!prev) {
          // Opening — reset search
          setSearch("");
        }
        return !prev;
      });
    };

    const selectSingle = (val: string) => {
      if (!isControlledSingle) setInternalValue(val);
      onValueChange?.(val);
      setOpen(false);
    };

    /** Single-select option row — extracted so `optionGroups` and the
     *  plain flat list below render identical rows instead of drifting
     *  copies. */
    const renderSingleOption = (option: SelectOption) => {
      const isSelected = currentValue === option.value;
      return (
        <button
          key={option.value}
          type="button"
          role="option"
          aria-selected={isSelected}
          disabled={option.disabled}
          onClick={() => selectSingle(option.value)}
          className={cn(
            "flex w-full items-center gap-2.5 px-3 py-2 lyra-body-md text-left transition-colors rounded-lyra-sm",
            "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
            "focus:outline-none focus-visible:bg-lyra-state-hover",
            isSelected && "bg-lyra-bg-active-subtle",
            option.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
          )}
        >
          {isSelected && (
            <span
              aria-hidden="true"
              className="flex h-4 w-4 items-center justify-center flex-shrink-0 text-lyra-bg-primary"
            >
              <Check className="h-4 w-4" strokeWidth={2} />
            </span>
          )}
          <span className="text-lyra-fg-default">{option.label}</span>
        </button>
      );
    };

    const toggleMultiValue = (val: string) => {
      const next = currentValues.includes(val)
        ? currentValues.filter((v) => v !== val)
        : [...currentValues, val];
      if (!isControlledMulti) setInternalValues(next);
      onValuesChange?.(next);
    };

    const toggleAll = () => {
      const allVals = filtered.filter((o) => !o.disabled).map((o) => o.value);
      const allSelected = allVals.every((v) => currentValues.includes(v));
      const next = allSelected
        ? currentValues.filter((v) => !allVals.includes(v))
        : [...new Set([...currentValues, ...allVals])];
      if (!isControlledMulti) setInternalValues(next);
      onValuesChange?.(next);
    };

    /* ── Close on outside click ── */
    React.useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          rootRef.current && !rootRef.current.contains(target) &&
          (!dropdownRef.current || !dropdownRef.current.contains(target))
        ) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    /* ── Close on Escape ── */
    React.useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
          triggerRef.current?.focus();
        }
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [open]);

    /* ── Focus search on open ── */
    React.useEffect(() => {
      if (open && searchable) {
        // Slight delay so the dropdown renders first
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    }, [open, searchable]);

    /* ── Display value ── */
    const displayText = React.useMemo(() => {
      if (multiple) {
        if (currentValues.length === 0) return null;
        if (currentValues.length === 1) {
          return options.find((o) => o.value === currentValues[0])?.label;
        }
        return `${currentValues.length} selected`;
      }
      if (!currentValue) return null;
      return options.find((o) => o.value === currentValue)?.label;
    }, [multiple, currentValue, currentValues, options]);

    /* ── Select-all state ── */
    const allFilteredVals = filtered.filter((o) => !o.disabled).map((o) => o.value);
    const allSelected = allFilteredVals.length > 0 && allFilteredVals.every((v) => currentValues.includes(v));
    const someSelected = !allSelected && allFilteredVals.some((v) => currentValues.includes(v));

    /* ── Max selection ── */
    const limitReached = multiple && maxSelection !== undefined && currentValues.length >= maxSelection;
    const handleClear = () => {
      if (isControlledMulti) onValuesChange?.([]);
      else setInternalValues([]);
    };

    return (
      <div ref={rootRef} className={cn("relative", className)}>
        {/* Label */}
        {label && (
          <Label
            id={`${autoId}-label`}
            label={label}
            labelHelpText={labelHelpText}
            required={required}
            disabled={disabled}
            readonly={readonly}
            className="block mb-1.5"
          />
        )}

        {/* Trigger */}
        {trigger && React.isValidElement(trigger) && trigger.type === "button" ? (
          React.cloneElement(trigger as React.ReactElement<any>, {
            ref: setTriggerRef,
            onClick: (e: React.MouseEvent) => {
              toggleOpen();
              (trigger as React.ReactElement<any>).props.onClick?.(e);
            },
          })
        ) : trigger ? (
          <button
            ref={setTriggerRef}
            type="button"
            disabled={disabled}
            onClick={toggleOpen}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={label || placeholder}
            className="inline-flex items-center justify-center rounded-lyra-sm text-lyra-fg-action hover:bg-lyra-state-hover active:bg-lyra-state-pressed transition-colors h-8 w-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
          >
            {trigger}
          </button>
        ) : (
          <button
            ref={setTriggerRef}
            type="button"
            disabled={disabled}
            onClick={toggleOpen}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-labelledby={label ? `${autoId}-label` : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${autoId}-error` : undefined}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-lyra-sm border px-3 lyra-body-md transition-colors",
              "focus:outline-none",
              error
                ? "border-lyra-status-critical-strong bg-lyra-status-critical-subtle text-lyra-fg-default focus:ring-2 focus:ring-lyra-status-critical-strong/20"
                : "border-lyra-border-strong bg-lyra-bg-field text-lyra-fg-default hover:border-lyra-state-border-hover-neutral focus:border-lyra-border-active focus:ring-2 focus:ring-lyra-border-active/20",
              disabled &&
                "bg-lyra-bg-disabled border-transparent text-lyra-fg-disabled cursor-not-allowed",
              readonly &&
                "bg-lyra-bg-surface-canvas cursor-default pointer-events-none",
              open && !error && "border-lyra-border-active ring-2 ring-lyra-border-active/20"
            )}
          >
            <span className={cn(!displayText && "text-lyra-fg-disabled")}>
              {displayText || placeholder}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 flex-shrink-0 transition-transform",
                disabled ? "text-lyra-fg-disabled" : "text-lyra-fg-secondary",
                open && "rotate-180"
              )}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        )}

        {/* Error */}
        {error && (
          <div id={`${autoId}-error`} role="alert" className="flex items-center gap-1 mt-1.5">
            <ErrorIcon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="lyra-body-sm text-lyra-status-critical-strong">{error}</span>
          </div>
        )}

        {/* Dropdown */}
        {open && (() => {
          const dropdownContent = (
          <div
            ref={dropdownRef}
            className={cn(
              "rounded-lyra-lg bg-lyra-bg-surface-overlay border border-lyra-border-subtle shadow-lg flex flex-col max-h-[300px]",
              portalDropdown ? "" : "absolute top-full z-50 mt-1",
              !portalDropdown && trigger ? cn(dropdownAlign === "left" ? "left-0" : "right-0", "w-[240px]") : !portalDropdown ? "w-full" : ""
            )}
            style={portalDropdown ? portalStyle : undefined}
          >
            {/* Search — fixed, does not scroll */}
            {searchable && (
              <div className="shrink-0 px-2 pt-2 pb-1">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lyra-fg-secondary pointer-events-none"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    aria-label="Search options"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search"
                    className={cn(
                      "h-9 w-full rounded-lyra-sm border border-lyra-border-strong bg-lyra-bg-field pl-9 pr-9 lyra-body-md text-lyra-fg-default transition-colors",
                      "placeholder:text-lyra-fg-disabled",
                      "hover:border-lyra-state-border-hover-neutral",
                      "focus:outline-none focus:border-lyra-border-active focus:ring-2 focus:ring-lyra-border-active/20"
                    )}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-lyra-xs text-lyra-fg-secondary hover:text-lyra-fg-default hover:bg-lyra-state-hover transition-colors"
                      tabIndex={-1}
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Max-selection header — fixed, does not scroll */}
            {multiple && maxSelection !== undefined && (
              <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-lyra-border-subtle">
                <span className={cn(
                  "lyra-label",
                  limitReached ? "text-lyra-status-critical-strong" : "text-lyra-fg-default"
                )}>
                  {limitReached
                    ? `Limit Reached (${maxSelection})`
                    : selectionLabel ?? `Select up to ${maxSelection} items`}
                </span>
                {currentValues.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="lyra-body-sm text-lyra-fg-secondary hover:text-lyra-fg-default transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Select All — fixed, does not scroll */}
            {multiple && showSelectAll && (
              <div className="shrink-0 px-1 pt-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-lyra-state-hover active:bg-lyra-state-pressed transition-colors rounded-lyra-sm"
                  onClick={() => toggleAll()}
                >
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                  <span className="lyra-body-md text-lyra-fg-default">Select All</span>
                </button>
                <div className="border-b border-lyra-border-subtle mt-1" />
              </div>
            )}

            {/* Options list — scrollable, no right padding so scrollbar sits at border edge */}
            <div
              ref={listRef}
              role="listbox"
              aria-labelledby={label ? `${autoId}-label` : undefined}
              aria-multiselectable={multiple || undefined}
              tabIndex={-1}
              onKeyDown={(e) => {
                const opts = Array.from(
                  listRef.current?.querySelectorAll<HTMLElement>('[role="option"]:not([disabled])') ?? []
                );
                const current = document.activeElement as HTMLElement;
                const idx = opts.indexOf(current);

                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const next = idx < opts.length - 1 ? opts[idx + 1] : opts[0];
                  next?.focus();
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const prev = idx > 0 ? opts[idx - 1] : opts[opts.length - 1];
                  prev?.focus();
                } else if (e.key === "Home") {
                  e.preventDefault();
                  opts[0]?.focus();
                } else if (e.key === "End") {
                  e.preventDefault();
                  opts[opts.length - 1]?.focus();
                }
              }}
              className="overflow-y-auto p-1"
            >
              {filtered.length === 0 && (
                <div className="px-3 py-2 lyra-body-sm text-lyra-fg-secondary">
                  No results found
                </div>
              )}

              {multiple
                ? filtered.map((option) => {
                    const isSelected = currentValues.includes(option.value);
                    const isDisabledByLimit = !isSelected && !!limitReached;
                    const isDisabled = option.disabled || isDisabledByLimit;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={isDisabled}
                        onClick={() => !isDisabled && toggleMultiValue(option.value)}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3 py-2 lyra-body-md text-left transition-colors rounded-lyra-sm",
                          "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
                          "focus:outline-none focus-visible:bg-lyra-state-hover",
                          isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabledByLimit}
                          tabIndex={-1}
                          className="pointer-events-none"
                        />
                        <span className={cn(
                          isDisabledByLimit ? "text-lyra-fg-disabled" : "text-lyra-fg-default"
                        )}>{option.label}</span>
                      </button>
                    );
                  })
                : optionGroups
                  ? optionGroups.map((group, groupIndex) => {
                      // A group is only ever narrowed by `filtered` (the
                      // search match against the flat `options` list), never
                      // widened past what it already declared — so a group
                      // can shrink to nothing (hidden) but never surface an
                      // option the caller didn't put in it.
                      const groupOptions = group.options.filter((option) =>
                        filtered.some((f) => f.value === option.value)
                      );
                      if (groupOptions.length === 0) return null;
                      return (
                        <div key={group.label ?? groupIndex}>
                          {group.label && (
                            <p className="px-3 pb-1 pt-2 lyra-body-xs text-lyra-fg-secondary uppercase tracking-wide">
                              {group.label}
                            </p>
                          )}
                          {groupOptions.map((option) => renderSingleOption(option))}
                        </div>
                      );
                    })
                  : filtered.map((option) => renderSingleOption(option))}
            </div>
          </div>
          );
          return portalDropdown ? ReactDOM.createPortal(dropdownContent, document.body) : dropdownContent;
        })()}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
export type { SelectProps, SelectOption, SelectOptionGroup };
