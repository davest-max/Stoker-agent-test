import * as React from "react";
import { Eye, EyeOff, Info, Check, X } from "lucide-react";
import { cn } from "../lib/utils";
import { Label } from "./label";
import { Tooltip } from "./tooltip";
import { ErrorIcon } from "./icons/error-icon";

/* ── Password requirements ── */

export interface PasswordRequirement {
  label: string;
  test: (value: string) => boolean;
}

export const DEFAULT_REQUIREMENTS: PasswordRequirement[] = [
  { label: "At least 8 characters",           test: (v) => v.length >= 8 },
  { label: "At least one uppercase letter",   test: (v) => /[A-Z]/.test(v) },
  { label: "At least one lowercase letter",   test: (v) => /[a-z]/.test(v) },
  { label: "At least one number",             test: (v) => /\d/.test(v) },
  { label: "At least one special character",  test: (v) => /[^A-Za-z0-9]/.test(v) },
];

/* ── Requirements tooltip content ── */

function RequirementsTooltip({ requirements, value }: {
  requirements: PasswordRequirement[];
  value?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-0.5">
      <p className="lyra-body-sm-emphasis text-lyra-fg-default mb-0.5">Password requirements</p>
      {requirements.map((req) => {
        const met = value ? req.test(value) : false;
        return (
          <div key={req.label} className="flex items-center gap-1.5">
            {met
              ? <Check className="h-3.5 w-3.5 text-lyra-status-success-strong shrink-0" strokeWidth={2} />
              : <X     className="h-3.5 w-3.5 text-lyra-fg-disabled shrink-0" strokeWidth={2} />
            }
            <span className={cn("lyra-body-sm", met ? "text-lyra-status-success-strong" : "text-lyra-fg-secondary")}>
              {req.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── PasswordInput ── */

export interface PasswordInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  label?: string;
  labelHelpText?: string;
  required?: boolean;
  error?: string;
  /** Show requirements tooltip on the label */
  showRequirements?: boolean;
  requirements?: PasswordRequirement[];
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  autoComplete?: string;
  className?: string;
  id?: string;
}

const PasswordInput = React.forwardRef<HTMLDivElement, PasswordInputProps>(
  ({
    value = "",
    onChange,
    placeholder = "Enter password",
    disabled,
    readonly,
    label,
    labelHelpText,
    required,
    error,
    showRequirements,
    requirements = DEFAULT_REQUIREMENTS,
    onBlur,
    autoComplete = "current-password",
    className,
    id,
  }, ref) => {
    const autoId  = React.useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;

    const [visible, setVisible] = React.useState(false);

    const shellClass = cn(
      "relative flex h-9 w-full items-center rounded-lyra-sm border lyra-body-md transition-colors",
      "bg-lyra-bg-field text-lyra-fg-default",
      error
        ? "border-lyra-status-critical-strong focus-within:ring-2 focus-within:ring-lyra-status-critical-strong/20"
        : "border-lyra-border-strong hover:border-lyra-state-border-hover-neutral focus-within:border-lyra-border-active focus-within:ring-2 focus-within:ring-lyra-border-active/20",
      disabled  && "bg-lyra-bg-disabled border-transparent cursor-not-allowed",
      readonly  && "bg-lyra-bg-surface-canvas cursor-default pointer-events-none"
    );

    return (
      <div ref={ref} className={className}>
        {label && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <Label label={label} labelFor={inputId} labelHelpText={labelHelpText}
              required={required} disabled={disabled} readonly={readonly} />
            {showRequirements && (
              <Tooltip
                placement="right"
                content={<RequirementsTooltip requirements={requirements} value={value} />}
              >
                <button type="button" className="flex items-center text-lyra-fg-secondary hover:text-lyra-fg-default transition-colors focus:outline-none">
                  <Info className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </Tooltip>
            )}
          </div>
        )}

        <div className={shellClass}>
          <input
            id={inputId}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readonly}
            autoComplete={autoComplete}
            onBlur={onBlur}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="flex-1 bg-transparent outline-none pl-3 pr-1 truncate placeholder:text-lyra-fg-disabled disabled:cursor-not-allowed"
          />
          {!disabled && !readonly && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
              className="pr-3 flex items-center text-lyra-fg-secondary hover:text-lyra-fg-default transition-colors shrink-0"
            >
              {visible
                ? <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                : <Eye    className="h-4 w-4" strokeWidth={1.5} />}
            </button>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="mt-1.5 lyra-body-sm text-lyra-status-critical-strong flex items-center gap-1">
            <ErrorIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

/* ── ChangePassword ── */

export interface ChangePasswordProps {
  onSubmit?: (values: { current: string; next: string }) => void;
  requirements?: PasswordRequirement[];
  className?: string;
}

function ChangePassword({ onSubmit, requirements = DEFAULT_REQUIREMENTS, className }: ChangePasswordProps) {
  const [current, setCurrent]   = React.useState("");
  const [next,    setNext]      = React.useState("");
  const [confirm, setConfirm]   = React.useState("");
  const [touched, setTouched]   = React.useState({ current: false, next: false, confirm: false });

  const allMet     = next && requirements.every((r) => r.test(next));
  const mismatch   = touched.confirm && confirm.length > 0 && confirm !== next;
  const noPassword = touched.current && !current;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ current: true, next: true, confirm: true });
    if (!current || !allMet || confirm !== next) return;
    onSubmit?.({ current, next });
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-4", className)} noValidate>
      <PasswordInput
        label="Current password"
        value={current}
        onChange={setCurrent}
        onBlur={() => setTouched((t) => ({ ...t, current: true }))}
        error={noPassword ? "Current password is required" : undefined}
        required
        autoComplete="current-password"
        id="change-password-current"
      />

      <PasswordInput
        label="New password"
        value={next}
        onChange={setNext}
        onBlur={() => setTouched((t) => ({ ...t, next: true }))}
        error={touched.next && next && !allMet ? "Password does not meet requirements" : undefined}
        showRequirements
        requirements={requirements}
        required
        autoComplete="new-password"
        id="change-password-new"
        placeholder="Enter new password"
      />

      <PasswordInput
        label="Confirm new password"
        value={confirm}
        onChange={setConfirm}
        onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
        error={mismatch ? "Passwords do not match" : undefined}
        required
        autoComplete="new-password"
        id="change-password-confirm"
        placeholder="Re-enter new password"
      />

      <button
        type="submit"
        className="mt-2 h-9 px-4 rounded-lyra-sm lyra-label bg-lyra-bg-primary text-lyra-fg-on-primary hover:bg-lyra-state-hover-primary active:bg-lyra-state-pressed-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus disabled:opacity-40"
        disabled={!current || !allMet || confirm !== next}
      >
        Update password
      </button>
    </form>
  );
}

export { PasswordInput, ChangePassword, RequirementsTooltip };
