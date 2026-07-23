import * as React from "react";
import { ArrowUp, Plus, Paperclip, FolderPlus, Mic } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";

/* ── Types ── */

export interface AIInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  /** Helper text shown below the input */
  helperText?: string;
  /** Disable the input and submit button */
  disabled?: boolean;
  /** Extra actions rendered to the left of the submit button */
  actions?: React.ReactNode;
  /** Called when "Add files or photos" is selected */
  onAttachFiles?: () => void;
  /** Called when "Add folder" is selected */
  onAttachFolder?: () => void;
  /** Hide the + attach button */
  showAttach?: boolean;
  /** Max rows before scrolling (default 6) */
  maxRows?: number;
  className?: string;
  id?: string;
}

/* ── Component ── */

const AIInput = React.forwardRef<HTMLTextAreaElement, AIInputProps>(
  ({
    value,
    onChange,
    onSubmit,
    placeholder = "Ask anything...",
    helperText = "AI assistant can make mistakes. Double check responses.",
    disabled,
    actions,
    onAttachFiles,
    onAttachFolder,
    showAttach = true,
    maxRows = 6,
    className,
    id,
  }, ref) => {
    const autoId        = React.useId();
    const inputId       = id ?? autoId;
    const internalRef   = React.useRef<HTMLTextAreaElement>(null);
    const textareaRef   = (ref as React.RefObject<HTMLTextAreaElement>) ?? internalRef;

    const [internalValue, setInternalValue] = React.useState("");
    const controlled = value !== undefined;
    const current    = controlled ? value : internalValue;
    const canSubmit  = current.trim().length > 0 && !disabled;

    /* Auto-resize textarea */
    const resize = React.useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10) || 20;
      const maxHeight  = lineHeight * maxRows;
      el.style.height  = `${Math.min(el.scrollHeight, maxHeight)}px`;
      el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [maxRows]);

    React.useEffect(() => { resize(); }, [current, resize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!controlled) setInternalValue(e.target.value);
      onChange?.(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && canSubmit) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const handleSubmit = () => {
      if (!canSubmit) return;
      onSubmit?.(current);
      if (!controlled) setInternalValue("");
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    };

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {/* Input container */}
        <div className={cn(
          "flex flex-col rounded-lyra-xl border bg-lyra-bg-surface-container-subtle transition-colors",
          "border-lyra-border-strong",
          "focus-within:border-lyra-border-active focus-within:ring-2 focus-within:ring-lyra-border-active/20",
          disabled && "opacity-50 pointer-events-none bg-lyra-bg-disabled border-transparent"
        )}>
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id={inputId}
            value={current}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            aria-label={placeholder}
            className={cn(
              "w-full resize-none bg-transparent outline-none",
              "px-4 pt-3 pb-1",
              "lyra-body-md text-lyra-fg-default placeholder:text-lyra-fg-disabled",
              "leading-relaxed",
            )}
          />

          {/* Toolbar row */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            {/* Left actions */}
            <div className="flex items-center gap-1">
              {showAttach && (
                <PopoverPrimitive.Root>
                  <PopoverPrimitive.Trigger asChild>
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label="Add attachment"
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lyra-sm",
                        "text-lyra-fg-secondary transition-colors",
                        "hover:bg-lyra-state-hover hover:text-lyra-fg-default",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                      )}
                    >
                      <Plus className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                  </PopoverPrimitive.Trigger>
                  <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                      side="top"
                      align="start"
                      sideOffset={6}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      className={cn(
                        "z-50 min-w-[220px] rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg p-2",
                        "animate-in fade-in-0 slide-in-from-top-2 duration-150",
                        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-100"
                      )}
                    >
                      {/* Add files or photos */}
                      <PopoverPrimitive.Close asChild>
                        <button
                          type="button"
                          onClick={onAttachFiles}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-lyra-sm lyra-body-md text-lyra-fg-default hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:bg-lyra-state-hover"
                        >
                          <Paperclip className="h-4 w-4 text-lyra-fg-secondary shrink-0" strokeWidth={1.5} />
                          <span className="flex-1 text-left">Add files or photos</span>
                          <span className="lyra-body-sm text-lyra-fg-secondary shrink-0">⌘U</span>
                        </button>
                      </PopoverPrimitive.Close>
                      {/* Add folder */}
                      <PopoverPrimitive.Close asChild>
                        <button
                          type="button"
                          onClick={onAttachFolder}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-lyra-sm lyra-body-md text-lyra-fg-default hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:bg-lyra-state-hover"
                        >
                          <FolderPlus className="h-4 w-4 text-lyra-fg-secondary shrink-0" strokeWidth={1.5} />
                          <span className="flex-1 text-left">Add folder</span>
                        </button>
                      </PopoverPrimitive.Close>
                    </PopoverPrimitive.Content>
                  </PopoverPrimitive.Portal>
                </PopoverPrimitive.Root>
              )}
              {actions}
            </div>

            {/* Submit button — mic when empty, blue arrow when typing */}
            {canSubmit ? (
              <button
                type="button"
                onClick={handleSubmit}
                aria-label="Submit"
                className="flex h-9 w-9 items-center justify-center rounded-lyra-md transition-colors bg-lyra-bg-primary text-lyra-fg-on-primary hover:bg-lyra-state-hover-primary active:bg-lyra-state-pressed-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
              >
                <ArrowUp className="h-5 w-5" strokeWidth={2} />
              </button>
            ) : (
              <Tooltip content="Press and hold to record" placement="top">
                <button
                  type="button"
                  disabled={disabled}
                  aria-label="Voice input"
                  className="flex h-9 w-9 items-center justify-center rounded-lyra-md transition-colors bg-lyra-bg-surface-shell text-lyra-fg-secondary hover:bg-lyra-state-hover hover:text-lyra-fg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Mic className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Helper text */}
        {helperText && (
          <p className="lyra-body-sm text-lyra-fg-secondary text-center px-2">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
AIInput.displayName = "AIInput";

export { AIInput };
