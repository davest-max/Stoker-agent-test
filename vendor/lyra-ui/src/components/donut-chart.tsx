import * as React from "react";
import type { EChartsOption } from "echarts";
import { Chart, resolveCssColor, useThemeVersion } from "./chart";
import { cn } from "../lib/utils";

/* ── DonutChart ──
   A ring/donut chart built on the shared `Chart` (ECharts) wrapper — e.g.
   the home screen's Activity card (Available/Working/Unavailable
   breakdown). Hovering a slice adds a soft shadow and dims the other
   slices (`emphasis`/`blur` below) — this is a fixed default, not exposed
   as a prop, since every current consumer wants the same hover feedback;
   revisit if a future consumer genuinely needs it off. Deliberately does
   NOT use ECharts' hover scale-out (`emphasis.scale`): it grows the
   slice's actual drawn radius, and with the default `outerRadius` already
   at 95% there's almost no headroom left inside the chart's own canvas, so
   the grown slice gets hard-clipped against the canvas edge (visible as a
   flat-cut arc on hover) — a shadow glow gives equivalent "this one's
   active" feedback without growing the geometry past the canvas bounds.
   Renders only the ring; a consumer that also wants a legend
   (colored dot + label + value, à la the Activity card) builds it
   alongside from the same `data` array rather than this component owning
   two different jobs — keeps DonutChart reusable for any "ring + external
   legend/breakdown" layout, not just this one card's exact look.

   **Canvas color gotcha:** ECharts renders to `<canvas>`, and the Canvas 2D
   API can't resolve CSS custom properties the way DOM/CSSOM styles can —
   `ctx.fillStyle = "var(--lyra-color-status-success-strong)"` is silently
   invalid and falls back to black. So every slice color has to be resolved
   to a concrete value via `getComputedStyle` before it reaches ECharts.
   `resolveCssColor`/`useThemeVersion` (now shared in `chart.tsx` — see its
   own doc comment — since `Sparkline` needs the exact same resolution)
   re-trigger that resolution whenever the app's `[data-theme]` attribute
   flips (the same mechanism AgentProfile/LoginCard use for dark mode),
   since a color resolved once at light-mode mount would otherwise go stale
   the moment the user switches to dark mode without a remount. Any future
   canvas-based chart in this repo should reuse those same two helpers
   rather than re-deriving them — don't assume a `var()` string just works
   because it does for every other DOM-based component in this library. */

export interface DonutChartDatum {
  /** Slice label — shown in the hover tooltip. */
  label: string;
  /** Slice value (percentage, count, or any comparable numeric measure). */
  value: number;
  /** A lyra CSS variable reference for this slice's fill, e.g. `"var(--lyra-color-status-success-strong)"` — resolved to a concrete color at render time, see the canvas note above. */
  colorVar: string;
}

export interface DonutChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: DonutChartDatum[];
  /** Inner radius of the ring, as an ECharts percentage string. Default `"65%"`. */
  innerRadius?: string;
  /** Outer radius of the ring, as an ECharts percentage string. Default `"95%"`. */
  outerRadius?: string;
  /** Show the built-in hover tooltip. Set false when a consumer's own legend already surfaces every value. Default `true`. */
  showTooltip?: boolean;
}

const DonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>(
  ({ data, innerRadius = "65%", outerRadius = "95%", showTooltip = true, className, ...props }, ref) => {
    const themeVersion = useThemeVersion();

    const option: EChartsOption = React.useMemo(
      () => ({
        tooltip: showTooltip ? { trigger: "item", formatter: "{b}: {c}" } : { show: false },
        series: [
          {
            type: "pie",
            radius: [innerRadius, outerRadius],
            avoidLabelOverlap: false,
            label: { show: false },
            labelLine: { show: false },
            itemStyle: { borderWidth: 0 },
            emphasis: {
              // scale: false — the default `outerRadius` ("95%") already
              // leaves very little headroom inside the chart's own canvas,
              // and ECharts' hover scale-out grows the slice's actual drawn
              // radius (not just a CSS transform), so at any radius above
              // roughly 90% the grown slice gets hard-clipped against the
              // canvas edge — confirmed visually (a slice's outer arc
              // visibly cut flat on hover). A soft shadow glow on the
              // hovered slice gives the same "this one's active" feedback
              // without growing the drawn geometry past the canvas bounds.
              scale: false,
              focus: "self",
              itemStyle: { shadowBlur: 10, shadowColor: "rgba(0, 0, 0, 0.25)" },
            },
            blur: { itemStyle: { opacity: 0.35 } },
            data: data.map((d) => ({
              name: d.label,
              value: d.value,
              itemStyle: { color: resolveCssColor(d.colorVar) },
            })),
          },
        ],
      }),
      [data, innerRadius, outerRadius, showTooltip, themeVersion]
    );

    return (
      <div ref={ref} className={cn("h-full w-full", className)} {...props}>
        <Chart option={option} />
      </div>
    );
  }
);
DonutChart.displayName = "DonutChart";

export { DonutChart };
