import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Clock } from "lucide-react";
import { cn } from "../lib/utils";
import { Label } from "./label";
import { NumberInput } from "./number-input";

/* ── Helpers ── */

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

function formatTime(hour: number, minute: number, ampm: "AM" | "PM"): string {
  return `${padTwo(hour)}:${padTwo(minute)} ${ampm}`;
}

function parseTime(s: string): { hour: number; minute: number; ampm: "AM" | "PM" } | undefined {
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (!m) return undefined;
  let hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase() as "AM" | "PM";
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return undefined;
  return { hour, minute, ampm };
}

/** Convert 12h state → 24h Date-style hours */
function toHours24(hour: number, ampm: "AM" | "PM"): number {
  let h = hour % 12;
  if (ampm === "PM") h += 12;
  return h;
}

/* ── TimeSelector (shared UI) ── */

interface TimeSelectorProps {
  hour: number;
  minute: number;
  ampm: "AM" | "PM";
  onHourChange:   (h: number) => void;
  onMinuteChange: (m: number) => void;
  onAmpmChange:   (a: "AM" | "PM") => void;
}

function TimeSelector({ hour, minute, ampm, onHourChange, onMinuteChange, onAmpmChange }: TimeSelectorProps) {
  return (
    <div className="flex items-center gap-1.5 p-3">
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

/* ── Input shell ── */

const inputShell = (disabled?: boolean, readonly?: boolean) =>
  cn(
    "relative flex h-9 w-full items-center rounded-lyra-sm border lyra-body-md transition-colors cursor-text",
    "bg-lyra-bg-field text-lyra-fg-default",
    "border-lyra-border-strong hover:border-lyra-state-border-hover-neutral",
    "focus-within:border-lyra-border-active focus-within:ring-2 focus-within:ring-lyra-border-active/20",
    disabled  && "bg-lyra-bg-disabled border-transparent cursor-not-allowed",
    readonly  && "bg-lyra-bg-surface-canvas cursor-default pointer-events-none"
  );

/* ── Popover panel ── */

function TimePanel({ children }: { children: React.ReactNode }) {
  return (
    <PopoverPrimitive.Content
      side="bottom" sideOffset={6} align="start"
      avoidCollisions collisionPadding={4}
      className={cn(
        "z-50 w-[260px] rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg",
        "animate-in fade-in-0 slide-in-from-top-2 duration-150",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-100"
      )}
    >
      {children}
    </PopoverPrimitive.Content>
  );
}

/* ══════════════════════════════════════
   TimePicker
══════════════════════════════════════ */

export interface TimePickerProps {
  /** Controlled value — 24h Date object (only time portion is used) */
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  labelHelpText?: string;
  required?: boolean;
  readonly?: boolean;
  className?: string;
  id?: string;
}

const initState = (d?: Date) => {
  if (!d) return { hour: 12, minute: 0, ampm: "PM" as const };
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" as const : "AM" as const;
  h = h % 12 || 12;
  return { hour: h, minute: d.getMinutes(), ampm };
};

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  ({ value, onChange, placeholder = "HH:MM AM", disabled, label, labelHelpText, required, readonly, className, id }, ref) => {
    const autoId   = React.useId();
    const inputId  = id ?? autoId;
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [open, setOpen]     = React.useState(false);
    const [ts,   setTs]       = React.useState(initState(value));
    const [text, setText]     = React.useState(value ? formatTime(initState(value).hour, initState(value).minute, initState(value).ampm) : "");

    React.useEffect(() => {
      if (document.activeElement !== inputRef.current) {
        const s = initState(value);
        setTs(s);
        setText(value ? formatTime(s.hour, s.minute, s.ampm) : "");
      }
    }, [value]);

    const commit = (next: typeof ts) => {
      const now = value ?? new Date();
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), toHours24(next.hour, next.ampm), next.minute);
      setText(formatTime(next.hour, next.minute, next.ampm));
      onChange?.(d);
    };

    const handleChange = (patch: Partial<typeof ts>) => {
      const next = { ...ts, ...patch };
      setTs(next);
      commit(next);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setText(v);
      if (v === "") { onChange?.(undefined); return; }
      const parsed = parseTime(v);
      if (parsed) {
        setTs(parsed);
        commit(parsed);
      }
    };

    return (
      <div ref={ref} className={className}>
        {label && (
          <Label label={label} labelFor={inputId} labelHelpText={labelHelpText}
            required={required} disabled={disabled} readonly={readonly} className="block mb-1.5" />
        )}
        <PopoverPrimitive.Root open={!disabled && !readonly && open} onOpenChange={setOpen}>
          <PopoverPrimitive.Anchor asChild>
            <div className={inputShell(disabled, readonly)} onClick={() => !disabled && !readonly && setOpen(true)}>
              <input
                ref={inputRef} id={inputId} type="text" value={text}
                onChange={handleTextChange} placeholder={placeholder}
                disabled={disabled} readOnly={readonly}
                className="flex-1 bg-transparent outline-none pl-3 pr-1 truncate placeholder:text-lyra-fg-disabled"
                role="combobox" aria-expanded={open} aria-haspopup="dialog"
                aria-label={label ?? "Time"} autoComplete="off"
              />
              <span className="pr-3 flex items-center text-lyra-fg-secondary flex-shrink-0">
                <Clock className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </div>
          </PopoverPrimitive.Anchor>
          <PopoverPrimitive.Portal>
            <TimePanel>
              <TimeSelector
                hour={ts.hour} minute={ts.minute} ampm={ts.ampm}
                onHourChange={(h) => handleChange({ hour: h })}
                onMinuteChange={(m) => handleChange({ minute: m })}
                onAmpmChange={(a) => handleChange({ ampm: a })}
              />
            </TimePanel>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    );
  }
);
TimePicker.displayName = "TimePicker";

/* ══════════════════════════════════════
   TimeRangePicker
══════════════════════════════════════ */

export interface TimeRangeValue {
  from?: Date;
  to?: Date;
}

export interface TimeRangePickerProps {
  value?: TimeRangeValue;
  onChange?: (range: TimeRangeValue | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  labelHelpText?: string;
  required?: boolean;
  readonly?: boolean;
  className?: string;
  id?: string;
}

function formatRange(v: TimeRangeValue | undefined): string {
  if (!v) return "";
  const s = initState(v.from);
  const e = initState(v.to);
  const from = v.from ? formatTime(s.hour, s.minute, s.ampm) : "";
  const to   = v.to   ? formatTime(e.hour, e.minute, e.ampm) : "";
  if (from && to) return `${from} – ${to}`;
  return from;
}

const TimeRangePicker = React.forwardRef<HTMLDivElement, TimeRangePickerProps>(
  ({ value, onChange, placeholder = "HH:MM AM – HH:MM AM", disabled, label, labelHelpText, required, readonly, className, id }, ref) => {
    const autoId   = React.useId();
    const inputId  = id ?? autoId;
    const inputRef = React.useRef<HTMLInputElement>(null);

    type TS = { hour: number; minute: number; ampm: "AM" | "PM" };
    const [open,     setOpen]     = React.useState(false);
    const [text,     setText]     = React.useState(formatRange(value));
    const [fromTs,   setFromTs]   = React.useState<TS>(initState(value?.from));
    const [toTs,     setToTs]     = React.useState<TS>(initState(value?.to));

    React.useEffect(() => {
      if (document.activeElement !== inputRef.current) {
        setFromTs(initState(value?.from));
        setToTs(initState(value?.to));
        setText(formatRange(value));
      }
    }, [value]);

    const buildDate = (ts: TS, base?: Date): Date => {
      const now = base ?? new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), toHours24(ts.hour, ts.ampm), ts.minute);
    };

    const commit = (ft: TS, tt: TS) => {
      const next: TimeRangeValue = { from: buildDate(ft, value?.from), to: buildDate(tt, value?.to) };
      setText(formatRange(next));
      onChange?.(next);
    };

    const handleFrom = (patch: Partial<TS>) => {
      const next = { ...fromTs, ...patch };
      setFromTs(next);
      commit(next, toTs);
    };

    const handleTo = (patch: Partial<TS>) => {
      const next = { ...toTs, ...patch };
      setToTs(next);
      commit(fromTs, next);
    };

    return (
      <div ref={ref} className={className}>
        {label && (
          <Label label={label} labelFor={inputId} labelHelpText={labelHelpText}
            required={required} disabled={disabled} readonly={readonly} className="block mb-1.5" />
        )}
        <PopoverPrimitive.Root open={!disabled && !readonly && open} onOpenChange={setOpen}>
          <PopoverPrimitive.Anchor asChild>
            <div className={inputShell(disabled, readonly)} onClick={() => !disabled && !readonly && setOpen(true)}>
              <input
                ref={inputRef} id={inputId} type="text" value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder} disabled={disabled} readOnly={readonly}
                className="flex-1 bg-transparent outline-none pl-3 pr-1 truncate placeholder:text-lyra-fg-disabled"
                role="combobox" aria-expanded={open} aria-haspopup="dialog"
                aria-label={label ?? "Time range"} autoComplete="off"
              />
              <span className="pr-3 flex items-center text-lyra-fg-secondary flex-shrink-0">
                <Clock className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </div>
          </PopoverPrimitive.Anchor>
          <PopoverPrimitive.Portal>
            <TimePanel>
              <div className="px-3 pt-3 pb-1">
                <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">Start time</p>
              </div>
              <TimeSelector
                hour={fromTs.hour} minute={fromTs.minute} ampm={fromTs.ampm}
                onHourChange={(h) => handleFrom({ hour: h })}
                onMinuteChange={(m) => handleFrom({ minute: m })}
                onAmpmChange={(a) => handleFrom({ ampm: a })}
              />
              <div className="border-t border-lyra-border-subtle mx-3" />
              <div className="px-3 pt-3 pb-1">
                <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">End time</p>
              </div>
              <TimeSelector
                hour={toTs.hour} minute={toTs.minute} ampm={toTs.ampm}
                onHourChange={(h) => handleTo({ hour: h })}
                onMinuteChange={(m) => handleTo({ minute: m })}
                onAmpmChange={(a) => handleTo({ ampm: a })}
              />
            </TimePanel>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    );
  }
);
TimeRangePicker.displayName = "TimeRangePicker";

export { TimePicker, TimeRangePicker, TimeSelector };
