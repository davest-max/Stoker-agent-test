import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { Label } from "./label";
import { ErrorIcon } from "./icons/error-icon";

/* ── Types ── */

export interface NumberInputProps {
  /** Controlled value */
  value?: number;
  /** Default value (uncontrolled) */
  defaultValue?: number;
  /** Called when value changes */
  onChange?: (value: number) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step amount for each increment/decrement */
  step?: number;
  /** Pad the displayed value with leading zeros to this width */
  padWidth?: number;
  /** Whether the value wraps when reaching min/max */
  wrap?: boolean;
  /** Label text */
  label?: string;
  /** Help text in tooltip on label */
  labelHelpText?: string;
  /** Shows asterisk on label */
  required?: boolean;
  /** Read-only state */
  readonly?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional className on the root */
  className?: string;
  id?: string;
}

/* ── Component ── */

const NumberInput = React.forwardRef<HTMLDivElement, NumberInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      min,
      max,
      step = 1,
      padWidth,
      wrap = false,
      label,
      labelHelpText,
      required,
      readonly,
      disabled,
      error,
      placeholder,
      className,
      id,
    },
    ref
  ) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState<number>(
      defaultValue ?? min ?? 0
    );
    const current = isControlled ? value! : internalValue;

    const [inputText, setInputText] = React.useState(formatValue(current, padWidth));
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [focused, setFocused] = React.useState(false);

    // Sync text from controlled value changes
    React.useEffect(() => {
      if (!focused) setInputText(formatValue(current, padWidth));
    }, [current, padWidth, focused]);

    function clamp(v: number): number {
      if (min !== undefined && v < min) return wrap && max !== undefined ? max : min;
      if (max !== undefined && v > max) return wrap && min !== undefined ? min : max;
      return v;
    }

    function formatValue(v: number, pad?: number): string {
      return pad ? String(v).padStart(pad, "0") : String(v);
    }

    function applyChange(next: number) {
      const clamped = clamp(next);
      if (!isControlled) setInternalValue(clamped);
      onChange?.(clamped);
      setInputText(formatValue(clamped, padWidth));
    }

    const increment = () => { if (!disabled && !readonly) applyChange(current + step); };
    const decrement = () => { if (!disabled && !readonly) applyChange(current - step); };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "ArrowUp")   { e.preventDefault(); increment(); }
      if (e.key === "ArrowDown") { e.preventDefault(); decrement(); }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setInputText(raw);
      const n = parseInt(raw.replace(/^0+/, "") || "0", 10);
      if (!isNaN(n)) {
        const clamped = clamp(n);
        if (!isControlled) setInternalValue(clamped);
        onChange?.(clamped);
      }
    };

    const handleBlur = () => {
      setFocused(false);
      // Reformat on blur
      setInputText(formatValue(current, padWidth));
    };

    const btnClass = cn(
      "flex items-center justify-center h-full px-2 transition-colors",
      "text-lyra-fg-secondary",
      disabled || readonly
        ? "cursor-not-allowed opacity-40"
        : "hover:bg-lyra-state-hover hover:text-lyra-fg-default active:bg-lyra-state-pressed cursor-pointer",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lyra-border-focus focus-visible:ring-inset"
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

        <div
          className={cn(
            "relative flex h-9 w-full items-stretch rounded-lyra-sm border lyra-body-md transition-colors overflow-hidden",
            error
              ? "border-lyra-status-critical-strong bg-lyra-status-critical-subtle"
              : readonly
              ? "border-lyra-border-strong bg-lyra-bg-surface-canvas"
              : disabled
              ? "border-transparent bg-lyra-bg-disabled"
              : focused
              ? "border-lyra-border-active ring-2 ring-lyra-border-active/20 bg-lyra-bg-field"
              : "border-lyra-border-strong bg-lyra-bg-field hover:border-lyra-state-border-hover-neutral"
          )}
        >
          {/* Text input */}
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="numeric"
            value={focused ? inputText : formatValue(current, padWidth)}
            onChange={handleInputChange}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readonly}
            className={cn(
              "flex-1 min-w-0 bg-transparent outline-none pl-3 text-lyra-fg-default",
              "placeholder:text-lyra-fg-disabled",
              (disabled || readonly) && "cursor-not-allowed"
            )}
            aria-label={label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={current}
            autoComplete="off"
          />

          {/* Up / Down buttons */}
          {!readonly && (
            <div className="flex flex-col border-l border-lyra-border-subtle flex-shrink-0">
              <button
                type="button"
                tabIndex={-1}
                onClick={increment}
                disabled={disabled || (max !== undefined && !wrap && current >= max)}
                aria-label={`Increase${label ? ` ${label}` : ""}`}
                className={cn(btnClass, "border-b border-lyra-border-subtle flex-1")}
              >
                <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={decrement}
                disabled={disabled || (min !== undefined && !wrap && current <= min)}
                aria-label={`Decrease${label ? ` ${label}` : ""}`}
                className={cn(btnClass, "flex-1")}
              >
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="flex items-center gap-1 mt-1.5">
            <ErrorIcon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="lyra-body-sm text-lyra-status-critical-strong">{error}</span>
          </div>
        )}
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
