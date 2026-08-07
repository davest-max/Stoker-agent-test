import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "../lib/utils";
import { Label } from "./label";

interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  /** Show error/destructive styling */
  error?: boolean;
  /** Label text displayed next to the checkbox */
  label?: string;
  /** Help text shown in a tooltip on the label's info icon */
  labelHelpText?: string;
  /** Marks the field as required — shows asterisk on label */
  required?: boolean;
  /**
   * Marks the field as read-only — visually muted, not interactive,
   * preserves current checked state.
   */
  readonly?: boolean;
  /** Additional class applied to the wrapper div (only used when label is provided) */
  wrapperClassName?: string;
}

const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, error, label, labelHelpText, required, readonly, wrapperClassName, disabled, id, onCheckedChange, ...props }, ref) => {
  const autoId = React.useId();
  const checkboxId = id || (label ? autoId : undefined);

  const checkbox = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={checkboxId}
      disabled={disabled}
      // Block changes in readonly mode without visually disabling
      onCheckedChange={readonly ? undefined : onCheckedChange}
      aria-readonly={readonly || undefined}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-lyra-xs border-[1.5px] transition-colors",

        /* Readonly — muted, no hover/active effects, cursor default */
        readonly && [
          "border-lyra-border-default bg-lyra-bg-surface-canvas cursor-default",
          "data-[state=checked]:bg-lyra-border-default data-[state=checked]:border-lyra-border-default data-[state=checked]:text-lyra-fg-inverse",
          "data-[state=indeterminate]:bg-lyra-border-default data-[state=indeterminate]:border-lyra-border-default data-[state=indeterminate]:text-lyra-fg-inverse",
          "hover:border-lyra-border-default active:border-lyra-border-default active:bg-transparent",
          "focus-visible:ring-0",
        ],

        /* Normal states (when not readonly) */
        !readonly && [
          /* Unchecked default */
          error
            ? "border-lyra-status-critical-strong bg-lyra-bg-control"
            : "border-lyra-border-default bg-lyra-bg-control",
          /* Unchecked hover/pressed */
          error
            ? "hover:border-lyra-status-critical-strong active:border-lyra-status-critical-strong active:bg-lyra-state-pressed"
            : "hover:border-lyra-border-strong active:border-lyra-border-strong active:bg-lyra-state-pressed",
          /* Focus */
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
          /* Checked */
          error
            ? [
                "data-[state=checked]:bg-lyra-bg-destructive data-[state=checked]:border-lyra-bg-destructive data-[state=checked]:text-lyra-fg-on-primary",
                "data-[state=checked]:hover:bg-lyra-state-hover-destructive data-[state=checked]:hover:border-lyra-state-hover-destructive",
                "data-[state=checked]:active:bg-lyra-state-pressed-destructive data-[state=checked]:active:border-lyra-state-pressed-destructive",
              ]
            : [
                "data-[state=checked]:bg-lyra-bg-primary data-[state=checked]:border-lyra-bg-primary data-[state=checked]:text-lyra-fg-on-primary",
                "data-[state=checked]:hover:bg-lyra-state-hover-primary data-[state=checked]:hover:border-lyra-state-hover-primary",
                "data-[state=checked]:active:bg-lyra-state-pressed-primary data-[state=checked]:active:border-lyra-state-pressed-primary",
              ],
          /* Indeterminate */
          error
            ? [
                "data-[state=indeterminate]:bg-lyra-bg-destructive data-[state=indeterminate]:border-lyra-bg-destructive data-[state=indeterminate]:text-lyra-fg-on-primary",
                "data-[state=indeterminate]:hover:bg-lyra-state-hover-destructive data-[state=indeterminate]:hover:border-lyra-state-hover-destructive",
                "data-[state=indeterminate]:active:bg-lyra-state-pressed-destructive data-[state=indeterminate]:active:border-lyra-state-pressed-destructive",
              ]
            : [
                "data-[state=indeterminate]:bg-lyra-bg-primary data-[state=indeterminate]:border-lyra-bg-primary data-[state=indeterminate]:text-lyra-fg-on-primary",
                "data-[state=indeterminate]:hover:bg-lyra-state-hover-primary data-[state=indeterminate]:hover:border-lyra-state-hover-primary",
                "data-[state=indeterminate]:active:bg-lyra-state-pressed-primary data-[state=indeterminate]:active:border-lyra-state-pressed-primary",
              ],
        ],

        /* Disabled (applies on top of everything) */
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-lyra-border-default",

        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current" aria-hidden="true">
        {props.checked === "indeterminate" ? (
          <Minus className="h-3 w-3" strokeWidth={3} />
        ) : (
          <Check className="h-3 w-3" strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return checkbox;

  return (
    <div className={cn("inline-flex items-start gap-2", wrapperClassName)}>
      <div className="flex items-center h-5">{checkbox}</div>
      <Label
        label={label}
        labelFor={checkboxId}
        labelHelpText={labelHelpText}
        required={required}
        disabled={disabled}
        readonly={readonly}
        className="lyra-body-md leading-5"
      />
    </div>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
export type { CheckboxProps };
