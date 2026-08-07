import * as React from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { cn } from "../lib/utils";

/* ── Chart ──
   Thin, generic wrapper around echarts-for-react — the shared base for
   every ECharts-backed chart in lyra-ui (DonutChart, Sparkline, more chart
   types as they're needed). Deliberately unopinionated: it takes a raw
   ECharts `option` object and renders it, nothing else. Chart-type-specific
   components own building that `option` object and any lyra-token color
   resolution — this component's only job is mounting/sizing the ECharts
   instance consistently.

   Not controlled in the §4 CONTRIBUTING.md sense (no primary user-editable
   value/onChange) — a chart renders data, it doesn't collect input. */

export interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Raw ECharts option object. Chart-type wrapper components build this. */
  option: EChartsOption;
}

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ option, className, ...props }, ref) => (
    <div ref={ref} className={cn("h-full w-full", className)} {...props}>
      <ReactECharts option={option} notMerge style={{ height: "100%", width: "100%" }} />
    </div>
  )
);
Chart.displayName = "Chart";

/* ── Shared canvas color-resolution helpers ──
   ECharts renders to `<canvas>`, and the Canvas 2D API can't resolve CSS
   custom properties the way DOM/CSSOM styles can — `ctx.fillStyle =
   "var(--lyra-color-status-success-strong)"` is silently invalid and falls
   back to black. So every color reaching an ECharts `option` has to be
   resolved to a concrete value via `getComputedStyle` first. Originally
   local to `donut-chart.tsx`; moved here once `Sparkline` needed the exact
   same resolution + dark-mode-revalidation logic, so any future
   ECharts-backed component in this repo reuses one implementation instead
   of re-deriving it a third time. */

/** Resolves a `"var(--x)"` string to its concrete computed value; passes any other string through unchanged. */
export function resolveCssColor(value: string): string {
  const match = value.match(/var\((--[\w-]+)\)/);
  if (!match) return value;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  return resolved || value;
}

/** Bumps whenever `[data-theme]` on `document.documentElement` changes, so
    color resolution above can be recomputed instead of staying pinned to
    whatever theme was active on first render. */
export function useThemeVersion(): number {
  const [version, setVersion] = React.useState(0);
  React.useEffect(() => {
    const observer = new MutationObserver(() => setVersion((v) => v + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return version;
}

export { Chart };
export type { EChartsOption };
