import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { Label } from "./label";
import { ErrorIcon } from "./icons/error-icon";
import { Tooltip } from "./tooltip";

/* ── Types ── */

export interface TagsInputProps {
  /** Controlled tags array */
  value?: string[];
  /** Default tags (uncontrolled) */
  defaultValue?: string[];
  /** Called when tags change */
  onChange?: (tags: string[]) => void;
  /** Placeholder shown in the input area */
  placeholder?: string;
  /** Keys that confirm a tag (default: Enter, Tab) */
  addKeys?: string[];
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Label text */
  label?: string;
  /** Help text in a tooltip on the label */
  labelHelpText?: string;
  /** Shows asterisk on label */
  required?: boolean;
  /** Read-only — tags shown but input hidden */
  readonly?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Additional className on the root */
  className?: string;
  id?: string;
}

/* ── Component ── */

const TagsInput = React.forwardRef<HTMLDivElement, TagsInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      placeholder = "Add a tag…",
      addKeys = ["Enter", "Tab", ","],
      maxTags,
      label,
      labelHelpText,
      required,
      readonly,
      disabled,
      error,
      className,
      id,
    },
    ref
  ) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const inputRef = React.useRef<HTMLInputElement>(null);

    const isControlled = value !== undefined;
    const [internalTags, setInternalTags] = React.useState<string[]>(
      defaultValue ?? []
    );
    const tags = isControlled ? value! : internalTags;

    const [inputVal, setInputVal] = React.useState("");
    const [focused, setFocused] = React.useState(false);

    const updateTags = (next: string[]) => {
      if (!isControlled) setInternalTags(next);
      onChange?.(next);
    };

    const addTag = (raw: string) => {
      const tag = raw.trim();
      if (!tag || tags.includes(tag)) { setInputVal(""); return; }
      if (maxTags !== undefined && tags.length >= maxTags) return;
      updateTags([...tags, tag]);
      setInputVal("");
    };

    const removeTag = (idx: number) => {
      updateTags(tags.filter((_, i) => i !== idx));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (addKeys.includes(e.key)) {
        e.preventDefault();
        addTag(inputVal);
        return;
      }
      if (e.key === "Backspace" && inputVal === "" && tags.length > 0) {
        removeTag(tags.length - 1);
      }
    };

    const handleBlur = () => {
      setFocused(false);
      // Add tag on blur if there's text
      if (inputVal.trim()) addTag(inputVal);
    };

    const atMax = maxTags !== undefined && tags.length >= maxTags;

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

        {/* Input container */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5 min-h-[36px] w-full rounded-lyra-sm border px-2.5 py-1.5 transition-colors cursor-text",
            error
              ? "border-lyra-status-critical-strong bg-lyra-status-critical-subtle"
              : readonly
              ? "border-lyra-border-strong bg-lyra-bg-surface-canvas"
              : disabled
              ? "border-transparent bg-lyra-bg-disabled cursor-not-allowed"
              : focused
              ? "border-lyra-border-active ring-2 ring-lyra-border-active/20 bg-lyra-bg-field"
              : "border-lyra-border-strong bg-lyra-bg-field hover:border-lyra-state-border-hover-neutral"
          )}
          onClick={() => !disabled && !readonly && inputRef.current?.focus()}
        >
          {/* Tags */}
          {tags.map((tag, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1 rounded-lyra-xs px-2 py-0.5 lyra-body-sm transition-colors",
                disabled
                  ? "bg-lyra-bg-disabled text-lyra-fg-disabled"
                  : error
                  ? "bg-lyra-status-critical-subtle text-lyra-status-critical-strong border border-lyra-status-critical-strong/30"
                  : "bg-lyra-bg-active-subtle text-lyra-fg-active-strong border border-lyra-border-active/30"
              )}
            >
              {tag}
              {!readonly && !disabled && (
                <Tooltip content={`Remove ${tag}`} placement="top" delayMs={400}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeTag(i); }}
                  aria-label={`Remove tag: ${tag}`}
                  className={cn(
                    "rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lyra-border-focus",
                    "hover:bg-lyra-state-hover-active-subtle"
                  )}
                >
                  <X className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                </button>
                </Tooltip>
              )}
            </span>
          ))}

          {/* Text input */}
          {!readonly && !disabled && !atMax && (
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={handleBlur}
              placeholder={tags.length === 0 ? placeholder : ""}
              className="flex-1 min-w-[120px] bg-transparent outline-none lyra-body-md text-lyra-fg-default placeholder:text-lyra-fg-disabled py-0.5"
              aria-label={label ?? "Add tags"}
              autoComplete="off"
            />
          )}

          {/* Readonly empty state */}
          {readonly && tags.length === 0 && (
            <span className="lyra-body-md text-lyra-fg-disabled">{placeholder}</span>
          )}

          {/* Max reached hint */}
          {atMax && !readonly && !disabled && (
            <span className="lyra-body-sm text-lyra-fg-secondary ml-1">
              Max {maxTags} tags
            </span>
          )}
        </div>

        {/* Helper text */}
        {!error && !readonly && !disabled && (
          <p className="lyra-body-sm text-lyra-fg-secondary mt-1">
            Press Enter or Tab to add a tag
          </p>
        )}

        {/* Error message */}
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

TagsInput.displayName = "TagsInput";

export { TagsInput };
