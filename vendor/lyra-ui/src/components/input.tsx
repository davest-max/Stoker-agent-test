import * as React from "react";
import { ErrorIcon } from "./icons/error-icon";
import { cn } from "../lib/utils";
import { Label } from "./label";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;
  /** Help text shown in a tooltip on the label's info icon */
  labelHelpText?: string;
  /** Marks the field as required — shows asterisk on label */
  required?: boolean;
  /** Marks the field as read-only — affects label styling */
  readonly?: boolean;
  /** Error message — triggers error styling when provided */
  error?: string;
  /** Icon rendered at the start (left) of the input */
  startIcon?: React.ReactNode;
  /** Icon rendered at the end (right) of the input */
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      labelHelpText,
      required,
      readonly,
      error,
      disabled,
      id,
      startIcon,
      endIcon,
      ...props
    },
    ref
  ) => {
    const autoId = React.useId();
    const inputId = id || autoId;

    return (
      <div className={className}>
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

        <div className="relative flex items-center">
          {startIcon && (
            <span className="absolute left-3 flex items-center pointer-events-none">
              {startIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            readOnly={readonly}
            className={cn(
              "h-9 w-full rounded-lyra-sm border lyra-body-md transition-colors",
              "placeholder:text-lyra-fg-disabled",
              "focus:outline-none",
              startIcon ? "pl-9" : "pl-3",
              endIcon ? "pr-9" : "pr-3",
              error
                ? "border-lyra-status-critical-strong bg-lyra-status-critical-subtle text-lyra-fg-default focus:ring-2 focus:ring-lyra-status-critical-strong/20"
                : readonly
                ? "border-lyra-border-strong bg-lyra-bg-surface-canvas text-lyra-fg-default cursor-default pointer-events-none"
                : "border-lyra-border-strong bg-lyra-bg-field text-lyra-fg-default hover:border-lyra-state-border-hover-neutral focus:border-lyra-border-active focus:ring-2 focus:ring-lyra-border-active/20",
              disabled &&
                "bg-lyra-bg-disabled border-transparent text-lyra-fg-disabled cursor-not-allowed"
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {endIcon && (
            <span className="absolute right-3 flex items-center pointer-events-none">
              {endIcon}
            </span>
          )}
        </div>

        {error && (
          <div
            id={`${inputId}-error`}
            role="alert"
            className="flex items-center gap-1 mt-1.5"
          >
            <ErrorIcon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="lyra-body-sm text-lyra-status-critical-strong">
              {error}
            </span>
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
export type { InputProps };
