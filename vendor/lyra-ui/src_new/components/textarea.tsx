import * as React from "react";
import { ErrorIcon } from "./icons/error-icon";
import { cn } from "../lib/utils";
import { Label } from "./label";

/* ── Types ── */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label text displayed above the textarea */
  label?: string;
  /** Help text shown in a tooltip on the label's info icon */
  labelHelpText?: string;
  /** Marks the field as required — shows asterisk on label */
  required?: boolean;
  /** Marks the field as read-only */
  readonly?: boolean;
  /** Error message — triggers error styling when provided */
  error?: string;
  /** Maximum character count — shows a counter next to the label */
  maxLength?: number;
  /** Number of visible text rows (default 4) */
  rows?: number;
}

/* ── Component ── */

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      labelHelpText,
      required,
      readonly,
      error,
      maxLength,
      rows = 4,
      disabled,
      id,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const autoId = React.useId();
    const inputId = id || autoId;

    // Track character count when maxLength is provided
    const [charCount, setCharCount] = React.useState<number>(() => {
      const initial = value ?? defaultValue ?? "";
      return String(initial).length;
    });

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (maxLength !== undefined) setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className={className}>
        {/* Label row — label left, counter right */}
        {(label || maxLength !== undefined) && (
          <div className="flex items-center justify-between mb-1.5">
            {label ? (
              <Label
                label={label}
                labelFor={inputId}
                labelHelpText={labelHelpText}
                required={required}
                disabled={disabled}
                readonly={readonly}
              />
            ) : (
              <span />
            )}
            {maxLength !== undefined && (
              <span
                className={cn(
                  "lyra-body-sm tabular-nums",
                  disabled || readonly
                    ? "text-lyra-fg-disabled"
                    : charCount > maxLength
                    ? "text-lyra-status-critical-strong"
                    : "text-lyra-fg-secondary"
                )}
                aria-live="polite"
                aria-label={`${charCount} of ${maxLength} characters used`}
              >
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readonly}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          className={cn(
            "w-full rounded-lyra-sm border lyra-body-md transition-colors resize-y",
            "px-3 py-2",
            "placeholder:text-lyra-fg-disabled",
            "focus:outline-none",
            // States
            error
              ? "border-lyra-status-critical-strong bg-lyra-status-critical-subtle text-lyra-fg-default focus:ring-2 focus:ring-lyra-status-critical-strong/20"
              : readonly
              ? "border-lyra-border-strong bg-lyra-bg-surface-canvas text-lyra-fg-default cursor-default resize-none pointer-events-none"
              : disabled
              ? "border-transparent bg-lyra-bg-disabled text-lyra-fg-disabled cursor-not-allowed resize-none"
              : "border-lyra-border-strong bg-lyra-bg-field text-lyra-fg-default hover:border-lyra-state-border-hover-neutral focus:border-lyra-border-active focus:ring-2 focus:ring-lyra-border-active/20"
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />

        {/* Error message */}
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

Textarea.displayName = "Textarea";

export { Textarea };
