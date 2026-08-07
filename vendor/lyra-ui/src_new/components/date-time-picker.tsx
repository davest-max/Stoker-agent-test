import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { Label } from "./label";
import { Calendar, type DateRange } from "./calendar";
import { NumberInput } from "./number-input";

/* ── Formatting helpers ── */

const DATE_FORMAT = "MM/DD/YYYY";
const DATETIME_FORMAT = `${DATE_FORMAT}, HH:MM AM`;

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDateTime(d: Date): string {
  const mm  = padTwo(d.getMonth() + 1);
  const dd  = padTwo(d.getDate());
  const yr  = d.getFullYear();
  let   hr  = d.getHours();
  const min = padTwo(d.getMinutes());
  const ampm = hr >= 12 ? "PM" : "AM";
  hr = hr % 12 || 12;
  return `${mm}/${dd}/${yr}, ${padTwo(hr)}:${min} ${ampm}`;
}

function parseDateTime(s: string): Date | undefined {
  // Accepts: "MM/DD/YYYY, HH:MM AM/PM" or "MM/DD/YYYY"
  const m = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm))?$/
  );
  if (!m) return undefined;
  const [, mo, da, yr, hStr, mStr, ampm] = m;
  let hour = hStr ? parseInt(hStr, 10) : 0;
  const minute = mStr ? parseInt(mStr, 10) : 0;
  if (ampm) {
    if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
  }
  const d = new Date(parseInt(yr, 10), parseInt(mo, 10) - 1, parseInt(da, 10), hour, minute);
  return isNaN(d.getTime()) ? undefined : d;
}

/* ── Time Selector ── */

interface TimeSelectorProps {
  hour: number;    // 1–12
  minute: number;  // 0–59
  ampm: "AM" | "PM";
  onHourChange:   (h: number) => void;
  onMinuteChange: (m: number) => void;
  onAmpmChange:   (a: "AM" | "PM") => void;
}

function TimeSelector({ hour, minute, ampm, onHourChange, onMinuteChange, onAmpmChange }: TimeSelectorProps) {
  return (
    <div className="w-full flex items-center gap-1.5 pt-3 border-t border-lyra-border-subtle mt-2">
      <NumberInput
        value={hour}
        min={1} max={12} wrap
        padWidth={2}
        onChange={onHourChange}
        className="flex-1 min-w-0"
        aria-label="Hour"
      />
      <span className="lyra-body-md text-lyra-fg-secondary flex-shrink-0">:</span>
      <NumberInput
        value={minute}
        min={0} max={59} wrap
        padWidth={2}
        onChange={onMinuteChange}
        className="flex-1 min-w-0"
        aria-label="Minute"
      />
      {/* Single AM/PM toggle button */}
      <button
        type="button"
        onClick={() => onAmpmChange(ampm === "AM" ? "PM" : "AM")}
        className="flex-shrink-0 w-12 h-9 rounded-lyra-sm lyra-label font-medium transition-colors bg-lyra-bg-primary text-lyra-fg-on-primary hover:bg-lyra-state-hover-primary active:bg-lyra-state-pressed-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
        aria-label={`Toggle AM/PM, currently ${ampm}`}
        aria-pressed={ampm === "PM"}
      >
        {ampm}
      </button>
    </div>
  );
}

/* ── Types ── */

export interface DateTimePickerProps {
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

/* ── Popover panel ── */

function CalendarPanel({ children }: { children: React.ReactNode }) {
  return (
    <PopoverPrimitive.Content
      side="bottom" sideOffset={6} align="start"
      avoidCollisions collisionPadding={4}
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

/* ── DateTimePicker ── */

const DateTimePicker = React.forwardRef<HTMLDivElement, DateTimePickerProps>(
  ({ value, onChange, placeholder = DATETIME_FORMAT, disabled, label, labelHelpText, required, readonly, defaultMonth, className, id }, ref) => {
    const autoId    = React.useId();
    const inputId   = id ?? autoId;
    const inputRef  = React.useRef<HTMLInputElement>(null);

    const [open, setOpen]     = React.useState(false);
    const [text, setText]     = React.useState(value ? formatDateTime(value) : "");

    // Derive initial time state from value
    const initTime = (d?: Date) => {
      if (!d) return { hour: 12, minute: 0, ampm: "PM" as const };
      let h = d.getHours();
      const ampm = h >= 12 ? "PM" as const : "AM" as const;
      h = h % 12 || 12;
      return { hour: h, minute: d.getMinutes(), ampm };
    };

    const [timeState, setTimeState] = React.useState(initTime(value));
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);

    // Sync external value
    React.useEffect(() => {
      if (document.activeElement !== inputRef.current) {
        setText(value ? formatDateTime(value) : "");
        setSelectedDate(value);
        setTimeState(initTime(value));
      }
    }, [value]);

    const buildDate = (date: Date, hour: number, minute: number, ampm: "AM" | "PM"): Date => {
      let h = hour % 12;
      if (ampm === "PM") h += 12;
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, minute);
    };

    const commit = (date: Date | undefined, ts: typeof timeState) => {
      if (!date) { onChange?.(undefined); setText(""); return; }
      const full = buildDate(date, ts.hour, ts.minute, ts.ampm);
      setText(formatDateTime(full));
      onChange?.(full);
    };

    const handleCalendarSelect = (date: Date | undefined) => {
      setSelectedDate(date);
      commit(date, timeState);
    };

    const handleTimeChange = (patch: Partial<typeof timeState>) => {
      const next = { ...timeState, ...patch };
      setTimeState(next);
      if (selectedDate) commit(selectedDate, next);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setText(v);
      const parsed = parseDateTime(v);
      if (parsed) {
        setSelectedDate(parsed);
        setTimeState(initTime(parsed));
        onChange?.(parsed);
      } else if (v === "") {
        setSelectedDate(undefined);
        onChange?.(undefined);
      }
    };

    const inputClass = cn(
      "relative flex h-9 w-full items-center rounded-lyra-sm border lyra-body-md transition-colors cursor-text",
      "bg-lyra-bg-field text-lyra-fg-default",
      "border-lyra-border-strong hover:border-lyra-state-border-hover-neutral",
      "focus-within:border-lyra-border-active focus-within:ring-2 focus-within:ring-lyra-border-active/20",
      disabled && "bg-lyra-bg-disabled border-transparent cursor-not-allowed",
      readonly && "bg-lyra-bg-surface-canvas cursor-default pointer-events-none"
    );

    return (
      <div ref={ref} className={className}>
        {label && (
          <Label label={label} labelFor={inputId} labelHelpText={labelHelpText}
            required={required} disabled={disabled} readonly={readonly} className="block mb-1.5" />
        )}
        <PopoverPrimitive.Root open={!disabled && !readonly && open} onOpenChange={setOpen}>
          <PopoverPrimitive.Anchor asChild>
            <div className={inputClass} onClick={() => !disabled && !readonly && setOpen(true)}>
              <input
                ref={inputRef} id={inputId} type="text" value={text}
                onChange={handleTextChange} placeholder={placeholder}
                disabled={disabled} readOnly={readonly}
                className="flex-1 bg-transparent outline-none pl-3 pr-1 truncate placeholder:text-lyra-fg-disabled"
                role="combobox" aria-expanded={open} aria-haspopup="dialog"
                aria-label={label ?? "Date and time"} autoComplete="off"
              />
              <span className="pr-3 flex items-center text-lyra-fg-secondary flex-shrink-0">
                <CalendarIcon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </div>
          </PopoverPrimitive.Anchor>
          <PopoverPrimitive.Portal>
            <CalendarPanel>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarSelect}
                defaultMonth={defaultMonth ?? selectedDate}
              />
              <TimeSelector
                hour={timeState.hour}
                minute={timeState.minute}
                ampm={timeState.ampm}
                onHourChange={(h) => handleTimeChange({ hour: h })}
                onMinuteChange={(m) => handleTimeChange({ minute: m })}
                onAmpmChange={(a) => handleTimeChange({ ampm: a })}
              />
            </CalendarPanel>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    );
  }
);
DateTimePicker.displayName = "DateTimePicker";

/* ══════════════════════════════
   DateRangeTimePicker
═══════════════════════════════ */

export interface DateRangeTimeValue {
  from?: Date;
  to?: Date;
}

export interface DateRangeTimePickerProps {
  value?: DateRangeTimeValue;
  onChange?: (range: DateRangeTimeValue | undefined) => void;
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

function formatRangeTime(v: DateRangeTimeValue | undefined): string {
  if (!v) return "";
  const from = v.from ? formatDateTime(v.from) : "";
  const to   = v.to   ? formatDateTime(v.to)   : "";
  if (from && to) return `${from} – ${to}`;
  if (from) return from;
  return "";
}

const DateRangeTimePicker = React.forwardRef<HTMLDivElement, DateRangeTimePickerProps>(
  ({ value, onChange, placeholder, disabled, label, labelHelpText, required, readonly, defaultMonth, className, id }, ref) => {
    const autoId   = React.useId();
    const inputId  = id ?? autoId;
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [open, setOpen] = React.useState(false);
    const [text, setText] = React.useState(formatRangeTime(value));

    const initTimeState = (d?: Date) => {
      if (!d) return { hour: 12, minute: 0, ampm: "AM" as const };
      let h = d.getHours();
      const ampm = h >= 12 ? "PM" as const : "AM" as const;
      h = h % 12 || 12;
      return { hour: h, minute: d.getMinutes(), ampm };
    };

    type TimeState = { hour: number; minute: number; ampm: "AM" | "PM" };

    const [fromDate, setFromDate] = React.useState<Date | undefined>(value?.from);
    const [toDate,   setToDate]   = React.useState<Date | undefined>(value?.to);
    const [fromTime, setFromTime] = React.useState<TimeState>(initTimeState(value?.from));
    const [toTime,   setToTime]   = React.useState<TimeState>(initTimeState(value?.to));

    React.useEffect(() => {
      if (document.activeElement !== inputRef.current) {
        setText(formatRangeTime(value));
        setFromDate(value?.from);
        setToDate(value?.to);
        setFromTime(initTimeState(value?.from));
        setToTime(initTimeState(value?.to));
      }
    }, [value]);

    const buildWithTime = (date: Date | undefined, ts: TimeState): Date | undefined => {
      if (!date) return undefined;
      let h = ts.hour % 12;
      if (ts.ampm === "PM") h += 12;
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, ts.minute);
    };

    const commit = (fd: Date | undefined, td: Date | undefined, ft: TimeState, tt: TimeState) => {
      const next: DateRangeTimeValue = {
        from: buildWithTime(fd, ft),
        to:   buildWithTime(td, tt),
      };
      setText(formatRangeTime(next));
      onChange?.(next.from || next.to ? next : undefined);
    };

    const handleCalendarSelect = (range: DateRange | undefined) => {
      const fd = range?.from;
      const td = range?.to;
      setFromDate(fd);
      setToDate(td);
      commit(fd, td, fromTime, toTime);
    };

    const handleFromTime = (patch: Partial<TimeState>) => {
      const next = { ...fromTime, ...patch };
      setFromTime(next);
      commit(fromDate, toDate, next, toTime);
    };

    const handleToTime = (patch: Partial<TimeState>) => {
      const next = { ...toTime, ...patch };
      setToTime(next);
      commit(fromDate, toDate, fromTime, next);
    };

    const ph = placeholder ?? `MM/DD/YYYY, HH:MM AM – MM/DD/YYYY, HH:MM AM`;
    const inputClass = cn(
      "relative flex h-9 w-full items-center rounded-lyra-sm border lyra-body-md transition-colors cursor-text",
      "bg-lyra-bg-field text-lyra-fg-default",
      "border-lyra-border-strong hover:border-lyra-state-border-hover-neutral",
      "focus-within:border-lyra-border-active focus-within:ring-2 focus-within:ring-lyra-border-active/20",
      disabled && "bg-lyra-bg-disabled border-transparent cursor-not-allowed",
      readonly && "bg-lyra-bg-surface-canvas cursor-default pointer-events-none"
    );

    return (
      <div ref={ref} className={className}>
        {label && (
          <Label label={label} labelFor={inputId} labelHelpText={labelHelpText}
            required={required} disabled={disabled} readonly={readonly} className="block mb-1.5" />
        )}
        <PopoverPrimitive.Root open={!disabled && !readonly && open} onOpenChange={setOpen}>
          <PopoverPrimitive.Anchor asChild>
            <div className={inputClass} onClick={() => !disabled && !readonly && setOpen(true)}>
              <input
                ref={inputRef} id={inputId} type="text" value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={ph} disabled={disabled} readOnly={readonly}
                className="flex-1 bg-transparent outline-none pl-3 pr-1 truncate placeholder:text-lyra-fg-disabled"
                role="combobox" aria-expanded={open} aria-haspopup="dialog"
                aria-label={label ?? "Date and time range"} autoComplete="off"
              />
              <span className="pr-3 flex items-center text-lyra-fg-secondary flex-shrink-0">
                <CalendarIcon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </div>
          </PopoverPrimitive.Anchor>
          <PopoverPrimitive.Portal>
            <CalendarPanel>
              <Calendar
                mode="range"
                selected={{ from: fromDate, to: toDate }}
                onSelect={handleCalendarSelect}
                defaultMonth={defaultMonth ?? fromDate}
              />
              {/* Start time */}
              <div className="mt-2">
                <p className="lyra-body-sm text-lyra-fg-secondary mb-1">Start time</p>
                <TimeSelector
                  hour={fromTime.hour} minute={fromTime.minute} ampm={fromTime.ampm}
                  onHourChange={(h) => handleFromTime({ hour: h })}
                  onMinuteChange={(m) => handleFromTime({ minute: m })}
                  onAmpmChange={(a) => handleFromTime({ ampm: a })}
                />
              </div>
              {/* End time */}
              <div className="mt-3">
                <p className="lyra-body-sm text-lyra-fg-secondary mb-1">End time</p>
                <TimeSelector
                  hour={toTime.hour} minute={toTime.minute} ampm={toTime.ampm}
                  onHourChange={(h) => handleToTime({ hour: h })}
                  onMinuteChange={(m) => handleToTime({ minute: m })}
                  onAmpmChange={(a) => handleToTime({ ampm: a })}
                />
              </div>
            </CalendarPanel>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    );
  }
);
DateRangeTimePicker.displayName = "DateRangeTimePicker";

export { DateTimePicker, DateRangeTimePicker };
