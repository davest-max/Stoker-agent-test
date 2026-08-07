import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { Label } from "./label";
import { Calendar, type DateRange } from "./calendar";

/* ── Date formatting helpers ── */

const FORMAT = "MM/DD/YYYY";

function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function parseDate(s: string): Date | undefined {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return undefined;
  const [, mo, da, yr] = m.map(Number);
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return undefined;
  const d = new Date(yr, mo - 1, da);
  return isNaN(d.getTime()) ? undefined : d;
}

function formatRange(r: DateRange | undefined): string {
  if (!r) return "";
  if (r.from && r.to) return `${formatDate(r.from)} – ${formatDate(r.to)}`;
  if (r.from) return formatDate(r.from);
  return "";
}

function parseRange(s: string): DateRange | undefined {
  const parts = s.split(/\s*[–-]\s*/);
  if (parts.length === 2) {
    const from = parseDate(parts[0].trim());
    const to   = parseDate(parts[1].trim());
    if (from && to) return { from, to };
    if (from) return { from };
  }
  const single = parseDate(s.trim());
  return single ? { from: single } : undefined;
}

/* ── Shared input trigger styles ── */

const inputClass = cn(
  "relative flex h-9 w-full items-center rounded-lyra-sm border lyra-body-md transition-colors",
  "bg-lyra-bg-field text-lyra-fg-default cursor-text",
  "border-lyra-border-strong hover:border-lyra-state-border-hover-neutral",
  "focus-within:border-lyra-border-active focus-within:ring-2 focus-within:ring-lyra-border-active/20",
  "data-[disabled=true]:bg-lyra-bg-disabled data-[disabled=true]:border-transparent",
  "data-[disabled=true]:text-lyra-fg-disabled data-[disabled=true]:cursor-not-allowed",
  "data-[readonly=true]:bg-lyra-bg-surface-canvas data-[readonly=true]:cursor-default data-[readonly=true]:pointer-events-none"
);

const textInputClass = cn(
  "flex-1 bg-transparent outline-none pl-3 pr-1 truncate h-full",
  "placeholder:text-lyra-fg-disabled"
);

/* ── Calendar popover panel ── */

function CalendarPanel({ children }: { children: React.ReactNode }) {
  return (
    <PopoverPrimitive.Content
      side="bottom"
      sideOffset={6}
      align="start"
      avoidCollisions
      collisionPadding={4}

      className={cn(
        "z-50 w-[288px] rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg p-3",
        "animate-in fade-in-0 slide-in-from-top-2 duration-150",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-100"
      )}
    >
      {children}
    </PopoverPrimitive.Content>
  );
}

/* ══════════════════════════════
   DatePicker
═══════════════════════════════ */

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  labelHelpText?: string;
  required?: boolean;
  readonly?: boolean;
  defaultMonth?: Date;
  className?: string;
  id?: string;
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({ value, onChange, placeholder = FORMAT, disabled, label, labelHelpText, required, readonly, defaultMonth, className, id }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [open, setOpen] = React.useState(false);
    const [text, setText] = React.useState(value ? formatDate(value) : "");

    // Fix #2: only sync value→text when the input is NOT focused (user isn't typing)
    React.useEffect(() => {
      if (document.activeElement !== inputRef.current) {
        setText(value ? formatDate(value) : "");
      }
    }, [value]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setText(v);
      const parsed = parseDate(v);
      // Only propagate valid dates or explicit clear — never propagate partial input
      if (parsed) onChange?.(parsed);
      else if (v === "") onChange?.(undefined);
    };

    const handleCalendarSelect = (date: Date | undefined) => {
      setText(date ? formatDate(date) : "");
      onChange?.(date);
      setOpen(false);
      inputRef.current?.blur();
    };

    const selectedDate = parseDate(text) ?? value;

    return (
      <div ref={ref} className={className}>
        {label && (
          <Label label={label} labelFor={inputId} labelHelpText={labelHelpText}
            required={required} disabled={disabled} readonly={readonly} className="block mb-1.5" />
        )}
        <PopoverPrimitive.Root open={!disabled && !readonly && open} onOpenChange={setOpen}>
          <PopoverPrimitive.Anchor asChild>
            <div data-disabled={disabled || undefined} data-readonly={readonly || undefined}
              className={inputClass} onClick={() => !disabled && !readonly && setOpen(true)}>
              <input ref={inputRef} id={inputId} type="text" value={text}
                onChange={handleTextChange} placeholder={placeholder}
                disabled={disabled} readOnly={readonly}
                className={cn(textInputClass, (disabled || readonly) && "cursor-not-allowed")}
                role="combobox" aria-expanded={open} aria-haspopup="dialog"
                aria-label={label ?? "Date"} autoComplete="off" />
              <span className="pr-3 flex items-center text-lyra-fg-secondary flex-shrink-0">
                <CalendarIcon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </div>
          </PopoverPrimitive.Anchor>
          <PopoverPrimitive.Portal>
            <CalendarPanel>
              <Calendar mode="single" selected={selectedDate}
                onSelect={handleCalendarSelect} defaultMonth={defaultMonth ?? selectedDate} />
            </CalendarPanel>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    );
  }
);
DatePicker.displayName = "DatePicker";

/* ══════════════════════════════
   DateRangePicker
═══════════════════════════════ */

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  labelHelpText?: string;
  required?: boolean;
  readonly?: boolean;
  defaultMonth?: Date;
  className?: string;
  id?: string;
}

const DateRangePicker = React.forwardRef<HTMLDivElement, DateRangePickerProps>(
  ({ value, onChange, placeholder = `${FORMAT} – ${FORMAT}`, disabled, label, labelHelpText, required, readonly, defaultMonth, className, id }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [open, setOpen] = React.useState(false);
    const [text, setText] = React.useState(formatRange(value));

    // Fix #2: only sync value→text when input is not focused
    React.useEffect(() => {
      if (document.activeElement !== inputRef.current) {
        setText(formatRange(value));
      }
    }, [value]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setText(v);
      if (v === "") { onChange?.(undefined); return; }
      const parsed = parseRange(v);
      if (parsed?.from && parsed?.to) onChange?.(parsed);
    };

    const handleCalendarSelect = (range: DateRange | undefined) => {
      setText(formatRange(range));
      onChange?.(range);
      // Fix #3: never auto-close — user closes by clicking outside or the trigger
    };

    const selectedRange = parseRange(text) ?? value;

    return (
      <div ref={ref} className={className}>
        {label && (
          <Label label={label} labelFor={inputId} labelHelpText={labelHelpText}
            required={required} disabled={disabled} readonly={readonly} className="block mb-1.5" />
        )}
        <PopoverPrimitive.Root open={!disabled && !readonly && open} onOpenChange={setOpen}>
          <PopoverPrimitive.Anchor asChild>
            <div data-disabled={disabled || undefined} data-readonly={readonly || undefined}
              className={inputClass} onClick={() => !disabled && !readonly && setOpen(v => !v)}>
              <input ref={inputRef} id={inputId} type="text" value={text}
                onChange={handleTextChange} placeholder={placeholder}
                disabled={disabled} readOnly={readonly}
                className={cn(textInputClass, (disabled || readonly) && "cursor-not-allowed")}
                role="combobox" aria-expanded={open} aria-haspopup="dialog"
                aria-label={label ?? "Date range"} autoComplete="off" />
              <span className="pr-3 flex items-center text-lyra-fg-secondary flex-shrink-0">
                <CalendarIcon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </div>
          </PopoverPrimitive.Anchor>
          <PopoverPrimitive.Portal>
            <CalendarPanel>
              <Calendar mode="range" selected={selectedRange}
                onSelect={handleCalendarSelect} defaultMonth={defaultMonth ?? selectedRange?.from} />
            </CalendarPanel>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    );
  }
);
DateRangePicker.displayName = "DateRangePicker";

export { DatePicker, DateRangePicker };
