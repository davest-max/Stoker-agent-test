import * as React from "react";
import { ErrorIcon } from "./icons/error-icon";
import { cn } from "../lib/utils";
import { RadioGroup, RadioGroupItem } from "./radio";
import { Label } from "./label";

/* ── Types ── */

export interface RadioButtonGroupOption {
  /** Unique value for this option */
  value: string;
  /** Display label */
  label: string;
  /** Disable this individual option */
  disabled?: boolean;
}

export interface RadioButtonGroupProps {
  /** Group label displayed above the options */
  label?: string;
  /** Help text shown in a tooltip on the group label */
  labelHelpText?: string;
  /** Shows required asterisk on the group label */
  required?: boolean;
  /** Marks the group as read-only — visually muted, non-interactive */
  readonly?: boolean;
  /** Disables the entire group */
  disabled?: boolean;
  /** Error message shown below the group */
  error?: string;
  /** Radio options to render */
  options: RadioButtonGroupOption[];
  /** Controlled selected value */
  value?: string;
  /** Default selected value (uncontrolled) */
  defaultValue?: string;
  /** Called when the selection changes */
  onValueChange?: (value: string) => void;
  /** Shared name for the radio inputs */
  name?: string;
  /** Layout direction */
  orientation?: "vertical" | "horizontal";
  /** Additional className on the root element */
  className?: string;
}

/* ── Component ── */

const RadioButtonGroup = React.forwardRef<HTMLDivElement, RadioButtonGroupProps>(
  (
    {
      label,
      labelHelpText,
      required,
      readonly,
      disabled,
      error,
      options,
      value,
      defaultValue,
      onValueChange,
      name,
      orientation = "vertical",
      className,
    },
    ref
  ) => {
    const isEffectivelyDisabled = disabled || readonly;

    return (
      <div ref={ref} className={cn("flex flex-col", className)}>
        {/* Label */}
        {label && (
          <Label
            label={label}
            labelHelpText={labelHelpText}
            required={required}
            disabled={disabled}
            readonly={readonly}
            className="block mb-2"
          />
        )}

        {/* Radio options */}
        <RadioGroup
          value={value}
          defaultValue={defaultValue}
          onValueChange={readonly ? undefined : onValueChange}
          name={name}
          disabled={isEffectivelyDisabled}
          orientation={orientation}
        >
          {options.map((option) => (
            <RadioGroupItem
              key={option.value}
              value={option.value}
              label={option.label}
              disabled={isEffectivelyDisabled || option.disabled}
            />
          ))}
        </RadioGroup>

        {/* Error message */}
        {error && (
          <div role="alert" className="flex items-center gap-1 mt-2">
            <ErrorIcon
              className="h-3.5 w-3.5 flex-shrink-0"
              aria-hidden="true"
            />
            <span className="lyra-body-sm text-lyra-status-critical-strong">
              {error}
            </span>
          </div>
        )}
      </div>
    );
  }
);

RadioButtonGroup.displayName = "RadioButtonGroup";

export { RadioButtonGroup };
