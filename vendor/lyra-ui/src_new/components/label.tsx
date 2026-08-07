import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";

/* ── Types ── */

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** The label text */
  label: string;
  /**
   * Associates the label with a form control.
   * Maps to the native `htmlFor` / `for` attribute.
   */
  labelFor?: string;
  /**
   * Help text displayed in a tooltip via an info icon.
   * Hidden when empty or when `disabled` is true.
   */
  labelHelpText?: string;
  /** Shows a required asterisk. Hidden automatically when `disabled` or `readonly`. */
  required?: boolean;
  /** Applies disabled styling and hides both the required indicator and help text. */
  disabled?: boolean;
  /** Applies read-only styling and hides the required indicator (help text remains visible). */
  readonly?: boolean;
}

/* ── Component ── */

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      label,
      labelFor,
      labelHelpText,
      required = false,
      disabled = false,
      readonly = false,
      className,
      ...props
    },
    ref
  ) => {
    if (!label) return null;

    // Required indicator is hidden when disabled or readonly
    const showRequired = required && !disabled && !readonly;
    // Help text is hidden when disabled
    const showHelp = !!labelHelpText && !disabled;

    return (
      <label
        ref={ref}
        htmlFor={labelFor}
        className={cn(
          "inline-flex items-center gap-1 lyra-label",
          disabled
            ? "text-lyra-fg-disabled"
            : readonly
            ? "text-lyra-fg-secondary"
            : "text-lyra-fg-default",
          className
        )}
        {...props}
      >
        <span>{label}</span>

        {showRequired && (
          <span
            aria-hidden="true"
            className="text-lyra-status-critical-strong leading-none"
          >
            *
          </span>
        )}

        {showHelp && (
          <Tooltip content={labelHelpText!} placement="right">
            <span className="inline-flex items-center text-lyra-fg-secondary hover:text-lyra-fg-action transition-colors cursor-default">
              <Info
                className="h-3.5 w-3.5"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className="sr-only">{labelHelpText}</span>
            </span>
          </Tooltip>
        )}
      </label>
    );
  }
);

Label.displayName = "Label";

export { Label };
