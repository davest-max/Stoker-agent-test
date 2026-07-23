import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "../lib/utils";
import { Label } from "./label";

/* ── RadioGroup ── */

interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Controlled value */
  value?: string;
  /** Default value for uncontrolled usage */
  defaultValue?: string;
  /** Called when the selected value changes */
  onValueChange?: (value: string) => void;
  /** Shared name attribute for all radios in the group */
  name?: string;
  /** Disable all radios in the group */
  disabled?: boolean;
  /** Label displayed above the radio group */
  label?: string;
  /** Help text shown in a tooltip on the label */
  labelHelpText?: string;
  /** Shows required asterisk on the label */
  required?: boolean;
  /** Layout orientation of the radio items */
  orientation?: "vertical" | "horizontal";
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, defaultValue, onValueChange, name, disabled, label, labelHelpText, required, orientation = "vertical", children, ...props }, ref) => {
    const labelId = React.useId();

    return (
      <div ref={ref} className={cn("flex flex-col", className)} {...props}>
        {label && (
          <Label
            id={labelId}
            label={label}
            labelHelpText={labelHelpText}
            required={required}
            disabled={disabled}
            className="block mb-1.5"
          />
        )}
        <RadioGroupPrimitive.Root
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange}
          name={name}
          disabled={disabled}
          orientation={orientation === "horizontal" ? "horizontal" : "vertical"}
          aria-labelledby={label ? labelId : undefined}
          className={cn(
            "flex",
            orientation === "horizontal" ? "flex-row gap-6" : "flex-col gap-2"
          )}
        >
          {children}
        </RadioGroupPrimitive.Root>
      </div>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

/* ── RadioGroupItem ── */

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  /** Value for this radio option */
  value: string;
  /** Label text */
  label?: string;
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, value, label, disabled: itemDisabled, id, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id || autoId;

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "group/radio flex items-center gap-2.5",
          itemDisabled ? "cursor-not-allowed" : "cursor-pointer",
          className
        )}
      >
        <RadioGroupPrimitive.Item
          ref={ref}
          id={inputId}
          value={value}
          disabled={itemDisabled}
          className={cn(
            "peer group relative flex-shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] transition-colors outline-none",
            /* Unchecked */
            "data-[state=unchecked]:border-lyra-border-default data-[state=unchecked]:bg-lyra-bg-control",
            "data-[state=unchecked]:hover:border-lyra-border-strong",
            "data-[state=unchecked]:active:border-lyra-border-strong data-[state=unchecked]:active:bg-lyra-state-pressed",
            /* Checked */
            "data-[state=checked]:border-lyra-bg-primary data-[state=checked]:bg-lyra-bg-primary",
            "data-[state=checked]:hover:border-lyra-state-hover-primary data-[state=checked]:hover:bg-lyra-state-hover-primary",
            "data-[state=checked]:active:border-lyra-state-pressed-primary data-[state=checked]:active:bg-lyra-state-pressed-primary",
            /* Disabled — must come after checked/unchecked to win */
            "disabled:cursor-not-allowed",
            "disabled:data-[state=unchecked]:border-lyra-border-disabled disabled:data-[state=unchecked]:bg-lyra-bg-disabled",
            "disabled:data-[state=checked]:border-lyra-border-disabled disabled:data-[state=checked]:bg-lyra-bg-disabled",
            "disabled:data-[state=checked]:hover:border-lyra-border-disabled disabled:data-[state=checked]:hover:bg-lyra-bg-disabled",
            /* Focus */
            "focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
          )}
        >
          <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
            {/* group-disabled targets the parent button's :disabled state */}
            <span className="h-2 w-2 rounded-full bg-lyra-fg-on-primary group-disabled:bg-lyra-fg-disabled" />
          </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
        {label && (
          /* peer-disabled targets the button above; drives label text color */
          <span className="lyra-body-md text-lyra-fg-default peer-disabled:text-lyra-fg-disabled">
            {label}
          </span>
        )}
      </label>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
export type { RadioGroupProps, RadioGroupItemProps };
