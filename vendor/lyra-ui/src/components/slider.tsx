import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../lib/utils";
import { Label } from "./label";

/* ── Types ── */

export interface SliderProps {
  /** Single value */
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  labelHelpText?: string;
  required?: boolean;
  disabled?: boolean;
  /** Show tick marks and numeric labels below the track */
  showTicks?: boolean;
  className?: string;
  id?: string;
}

export interface SliderRangeProps {
  value?: [number, number];
  onChange?: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  labelHelpText?: string;
  required?: boolean;
  disabled?: boolean;
  showTicks?: boolean;
  className?: string;
  id?: string;
}

/* ── Tick marks ── */

function Ticks({ min, max, step, disabled }: { min: number; max: number; step: number; disabled?: boolean }) {
  const count = Math.round((max - min) / step);
  const ticks = Array.from({ length: count + 1 }, (_, i) => min + i * step);

  return (
    <div className="relative flex justify-between mt-1.5 px-0">
      {ticks.map((t) => (
        <div key={t} className="flex flex-col items-center gap-0.5" style={{ width: 0 }}>
          <span className={cn("block w-px h-1.5", disabled ? "bg-lyra-fg-disabled" : "bg-lyra-fg-secondary")} />
          <span className={cn("lyra-body-sm tabular-nums", disabled ? "text-lyra-fg-disabled" : "text-lyra-fg-secondary")}>
            {t}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Shared thumb style ── */
const thumbClass = cn(
  "block h-5 w-5 rounded-full border-2 border-lyra-bg-surface-overlay bg-lyra-bg-surface-overlay shadow-md",
  "ring-lyra-bg-primary ring-offset-0",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
  "disabled:pointer-events-none disabled:opacity-40",
  "hover:scale-110 transition-transform"
);

/* ══════════════════════════════
   Slider (single value)
══════════════════════════════ */

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({
    value, onChange, min = 0, max = 10, step = 1,
    label, labelHelpText, required, disabled,
    showTicks = true, className, id,
  }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const range = max - min;

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {label && (
          <Label label={label} labelFor={inputId} labelHelpText={labelHelpText}
            required={required} disabled={disabled} className="block mb-3" />
        )}

        <SliderPrimitive.Root
          id={inputId}
          min={min} max={max} step={step}
          value={value !== undefined ? [value] : undefined}
          onValueChange={([v]) => onChange?.(v)}
          disabled={disabled}
          className="relative flex w-full touch-none select-none items-center"
          aria-label={label ?? "Slider"}
        >
          {/* Track: 6px container with 2px visual stripe for inactive portion */}
          <SliderPrimitive.Track
            className="relative h-[6px] w-full grow rounded-full"
            style={{ background: `linear-gradient(to bottom, transparent calc(50% - 1px), var(${disabled ? "--lyra-color-fg-disabled" : "--lyra-color-fg-secondary"}) calc(50% - 1px), var(${disabled ? "--lyra-color-fg-disabled" : "--lyra-color-fg-secondary"}) calc(50% + 1px), transparent calc(50% + 1px))` }}
          >
            <SliderPrimitive.Range className={cn(
              "absolute h-full rounded-full",
              disabled ? "bg-lyra-fg-disabled" : "bg-lyra-fg-active-strong"
            )} />
          </SliderPrimitive.Track>

          {/* Thumb */}
          <SliderPrimitive.Thumb className={thumbClass} />
        </SliderPrimitive.Root>

        {showTicks && (
          <Ticks min={min} max={max} step={step} disabled={disabled} />
        )}
      </div>
    );
  }
);
Slider.displayName = "Slider";

/* ══════════════════════════════
   SliderRange (two thumbs)
══════════════════════════════ */

const SliderRange = React.forwardRef<HTMLDivElement, SliderRangeProps>(
  ({
    value, onChange, min = 0, max = 10, step = 1,
    label, labelHelpText, required, disabled,
    showTicks = true, className, id,
  }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {label && (
          <Label label={label} labelFor={inputId} labelHelpText={labelHelpText}
            required={required} disabled={disabled} className="block mb-3" />
        )}

        <SliderPrimitive.Root
          id={inputId}
          min={min} max={max} step={step}
          value={value ?? [min, max]}
          onValueChange={(v) => onChange?.([v[0], v[1]])}
          disabled={disabled}
          className="relative flex w-full touch-none select-none items-center"
          aria-label={label ?? "Range slider"}
        >
          {/* Track: 6px container with 2px visual stripe for inactive portion */}
          <SliderPrimitive.Track
            className="relative h-[6px] w-full grow rounded-full"
            style={{ background: `linear-gradient(to bottom, transparent calc(50% - 1px), var(${disabled ? "--lyra-color-fg-disabled" : "--lyra-color-fg-secondary"}) calc(50% - 1px), var(${disabled ? "--lyra-color-fg-disabled" : "--lyra-color-fg-secondary"}) calc(50% + 1px), transparent calc(50% + 1px))` }}
          >
            <SliderPrimitive.Range className={cn(
              "absolute h-full rounded-full",
              disabled ? "bg-lyra-fg-disabled" : "bg-lyra-fg-active-strong"
            )} />
          </SliderPrimitive.Track>

          {/* Two thumbs */}
          <SliderPrimitive.Thumb className={thumbClass} />
          <SliderPrimitive.Thumb className={thumbClass} />
        </SliderPrimitive.Root>

        {showTicks && (
          <Ticks min={min} max={max} step={step} disabled={disabled} />
        )}
      </div>
    );
  }
);
SliderRange.displayName = "SliderRange";

export { Slider, SliderRange };
