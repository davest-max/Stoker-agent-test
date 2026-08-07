import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { Label } from "./label";
import { Menu } from "./menu";

/* ── Types ── */

export interface AutocompleteOption {
  value: string;
  label: string;
  /** Optional icon/element rendered before the label in the dropdown and input */
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  label?: string;
  labelHelpText?: string;
  required?: boolean;
  /** Show all options when input is empty (default: true) */
  showAllOnEmpty?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  className?: string;
  id?: string;
}

/* ── Component ── */

const Autocomplete = React.forwardRef<HTMLDivElement, AutocompleteProps>(
  ({
    options,
    value,
    onChange,
    placeholder = "Search…",
    disabled,
    readonly,
    label,
    labelHelpText,
    required,
    showAllOnEmpty = true,
    emptyMessage = "No Items Found",
    className,
    id,
  }, ref) => {
    const autoId   = React.useId();
    const inputId  = id ?? autoId;
    const listId   = `${inputId}-list`;
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Find the label of the currently selected value
    const selectedOption = options.find((o) => o.value === value);

    const [open,        setOpen]        = React.useState(false);
    const [inputValue,  setInputValue]  = React.useState(selectedOption?.label ?? "");
    const [activeIndex, setActiveIndex] = React.useState<number>(-1);

    // Sync external value changes
    React.useEffect(() => {
      if (!open) {
        setInputValue(selectedOption?.label ?? "");
      }
    }, [value, open]);

    // Filter options based on input
    const filtered = React.useMemo(() => {
      const q = inputValue.trim().toLowerCase();
      if (!q && showAllOnEmpty) return options;
      if (!q) return [];
      return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [inputValue, options, showAllOnEmpty]);

    // Reset active index when filtered list changes
    React.useEffect(() => {
      setActiveIndex(-1);
    }, [filtered.length]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      setOpen(true);
      // If user edits text, clear the selection
      if (selectedOption && e.target.value !== selectedOption.label) {
        onChange?.(undefined);
      }
    };

    const handleSelect = (option: AutocompleteOption) => {
      setInputValue(option.label);
      onChange?.(option.value);
      setOpen(false);
      inputRef.current?.focus();
    };

    const handleClear = () => {
      setInputValue("");
      onChange?.(undefined);
      setOpen(false);
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          setOpen(true);
          return;
        }
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && filtered[activeIndex] && !filtered[activeIndex].disabled) {
            handleSelect(filtered[activeIndex]);
          }
          break;
        case "Escape":
          setOpen(false);
          setInputValue(selectedOption?.label ?? "");
          break;
        case "Tab":
          setOpen(false);
          break;
      }
    };

    const inputShell = cn(
      "relative flex h-9 w-full items-center rounded-lyra-sm border lyra-body-md transition-colors",
      "bg-lyra-bg-field text-lyra-fg-default",
      "border-lyra-border-strong hover:border-lyra-state-border-hover-neutral",
      open && "border-lyra-border-active ring-2 ring-lyra-border-active/20",
      disabled && "bg-lyra-bg-disabled border-transparent cursor-not-allowed",
      readonly && "bg-lyra-bg-surface-canvas cursor-default pointer-events-none"
    );

    return (
      <div ref={ref} className={className}>
        {label && (
          <Label
            label={label}
            labelFor={inputId}
            labelHelpText={labelHelpText}
            required={required}
            disabled={disabled}
            readonly={readonly}
            className="block mb-1.5"
          />
        )}

        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          <PopoverPrimitive.Anchor asChild>
            <div
              className={inputShell}
              onClick={() => !disabled && !readonly && setOpen(true)}
            >
              {/* Show selected option's icon inside the input */}
              {selectedOption?.icon && !open && (
                <span className="pl-3 flex items-center shrink-0 text-base leading-none select-none">
                  {selectedOption.icon}
                </span>
              )}
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-autocomplete="list"
                aria-controls={listId}
                aria-activedescendant={activeIndex >= 0 ? `${inputId}-opt-${activeIndex}` : undefined}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readonly}
                autoComplete="off"
                className={cn(
                  "flex-1 bg-transparent outline-none pr-1 truncate placeholder:text-lyra-fg-disabled disabled:cursor-not-allowed",
                  selectedOption?.icon && !open ? "pl-2" : "pl-3"
                )}
              />
              {inputValue && !disabled && !readonly && (
                <button
                  type="button"
                  onClick={handleClear}
                  tabIndex={-1}
                  aria-label="Clear"
                  className="pr-3 flex items-center text-lyra-fg-secondary hover:text-lyra-fg-default transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </PopoverPrimitive.Anchor>

          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              id={listId}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onInteractOutside={() => {
                setOpen(false);
                setInputValue(selectedOption?.label ?? "");
              }}
              side="bottom"
              sideOffset={4}
              align="start"
              avoidCollisions
              collisionPadding={4}
              style={{ width: "var(--radix-popover-trigger-width)" }}
              className={cn(
                "z-50",
                "animate-in fade-in-0 slide-in-from-top-2 duration-150",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-100"
              )}
            >
              {filtered.length === 0 ? (
                <div className="rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg px-3 py-2.5 lyra-body-md text-lyra-fg-disabled select-none">
                  {emptyMessage}
                </div>
              ) : (
                <Menu
                  aria-label={label ?? "Options"}
                  menuRole="listbox"
                  itemRole="option"
                  className="max-h-60 overflow-y-auto"
                  items={filtered.map((option) => ({
                    id: option.value,
                    label: option.label,
                    icon: option.icon,
                    disabled: option.disabled,
                    selected: option.value === value,
                    onClick: () => handleSelect(option),
                  }))}
                />
              )}
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    );
  }
);
Autocomplete.displayName = "Autocomplete";

export { Autocomplete };
