import * as React from "react";
import { ErrorIcon } from "./icons/error-icon";
import { cn } from "../lib/utils";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

/* ── Types ── */

export interface CheckboxGroupOption {
  /** Unique value for this option */
  value: string;
  /** Display label */
  label: string;
  /** Disable this individual option */
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  /** Group label displayed above the options */
  label?: string;
  /** Help text shown in a tooltip on the group label */
  labelHelpText?: string;
  /** Shows required asterisk on the group label */
  required?: boolean;
  /** Makes all options non-interactive (preserves current values) */
  readonly?: boolean;
  /** Disables the entire group */
  disabled?: boolean;
  /** Error message shown below the group */
  error?: string;
  /** Options to render */
  options: CheckboxGroupOption[];
  /** Controlled selected values */
  values?: string[];
  /** Default selected values (uncontrolled) */
  defaultValues?: string[];
  /** Called when the selection changes */
  onChange?: (values: string[]) => void;
  /** Layout direction of the options */
  direction?: "vertical" | "horizontal";
  /** Additional className on the root element */
  className?: string;
}

/* ── Component ── */

const CheckboxGroup = React.forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(
  (
    {
      label,
      labelHelpText,
      required,
      readonly,
      disabled,
      error,
      options,
      values,
      defaultValues,
      onChange,
      direction = "vertical",
      className,
    },
    ref
  ) => {
    const isControlled = values !== undefined;
    const [internalValues, setInternalValues] = React.useState<string[]>(
      defaultValues ?? []
    );
    const currentValues = isControlled ? values : internalValues;

    const toggle = (value: string) => {
      if (readonly || disabled) return;
      const next = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      if (!isControlled) setInternalValues(next);
      onChange?.(next);
    };

    return (
      <fieldset
        ref={ref}
        disabled={disabled}
        className={cn("border-0 p-0 m-0 min-w-0", className)}
      >
        {/* Legend / Label row */}
        {label && (
          <legend className="mb-2 float-none p-0 w-full">
            <Label
              label={label}
              labelHelpText={labelHelpText}
              required={required}
              disabled={disabled}
              readonly={readonly}
            />
          </legend>
        )}

        {/* Options */}
        <div
          className={cn(
            direction === "horizontal"
              ? "flex flex-wrap items-center gap-x-6 gap-y-2"
              : "flex flex-col gap-2"
          )}
        >
          {options.map((option) => {
            const isChecked = currentValues.includes(option.value);
            const isOptionDisabled = disabled || option.disabled;

            return (
              <Checkbox
                key={option.value}
                id={`cbg-${option.value}`}
                label={option.label}
                checked={isChecked}
                disabled={isOptionDisabled}
                readonly={readonly}
                error={!!error && !isChecked}
                onCheckedChange={() => toggle(option.value)}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div role="alert" className="flex items-center gap-1 mt-2">
            <ErrorIcon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="lyra-body-sm text-lyra-status-critical-strong">
              {error}
            </span>
          </div>
        )}
      </fieldset>
    );
  }
);

CheckboxGroup.displayName = "CheckboxGroup";

export { CheckboxGroup };
