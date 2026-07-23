import * as React from "react";
import { Pencil, RefreshCw, Trash2, TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { Container, type ContainerProps } from "./container";
import { Divider } from "./divider";
import { FilterChip, type FilterChipProps, type FilterChipOption } from "./filter-chip";
import { KebabMenuButton } from "./kebab-menu-button";
import type { MenuEntry } from "./menu";
import { Sparkline } from "./sparkline";
import { cn } from "../lib/utils";

/* ── DashboardCard ──
   The general-purpose home-screen/dashboard widget shell — built on top of
   `Container` (composition, not reimplementation: Container already owns
   the card surface, border, radius, and header row) rather than
   reinventing any of that. Three real usages, all the same component:

   1. Chart widget — pass `children` containing a chart (e.g. `DonutChart`)
      plus whatever legend/breakdown markup goes with it. See the "Chart
      Widget" story, modeled on the home screen's Activity card.
   2. Data card — pass `children` containing rows/bars, same as (1) but
      without a chart. See the "Data Card" story, modeled on the Productivity
      breakdown card.
   3. Metric card — pass `metrics` instead of `children`: up to 4
      value+label columns, laid out either "divided" (plain columns
      separated by a vertical rule) or "contained" (each metric in its own
      bordered box, with `selected` giving the active/blue treatment). See
      the "Metric Card" story. Each metric can also opt into a `trend`
      row — direction (up/flat/down → success/warning/critical) + percent
      + "vs. last {period}" — which *replaces* its `label` subhead rather
      than sitting next to it, and/or an inline `sparkline` colored to
      match. See `DashboardCardMetric` and the "Header Controls" story's
      `showTrend` control. As the card's own width narrows (a CSS container
      query, not a viewport breakpoint — see `lyra-tokens.css`), metrics
      adapt in three ordered stages: each metric's sparkline moves below
      its text first, then the row becomes a 2-column grid, then finally a
      single stacked column.

   `metrics` and `children` are mutually exclusive — `metrics`, when
   present, takes over the card body instead of `children`.

   Every usage can also opt into two header controls, both off by default
   and each independently toggleable (see `showFilterChip`/`showKebabMenu`
   below — exposed as Storybook boolean controls too, so they're literally
   switches in the Controls panel, not just a prop you have to know about):
   a `FilterChip` and, at the far right of the header, a `KebabMenuButton`
   (composed from the shared atom — see `kebab-menu-button.tsx` — not a
   one-off dropdown). Both compose with any custom `headerActions` a
   consumer already passes, in this order: [headerActions] [filter chip]
   [kebab menu].

   `showContainer` (default `true`) is the inverse of those two — it's on
   by default and, when turned off, strips just the card's own surface:
   background, border, shadow. Padding is left alone deliberately (an
   earlier version of this also zeroed the header's padding, but a
   screenshot showed it landing flush against the header with no breathing
   room at all — too tight to read once there's no border separating them)
   so header/body spacing stays exactly as it is with the surface on. See
   the "Header Controls" story.

   The single value+label (+trend/sparkline) block each metric column
   renders is also exported on its own as `Metric` — for any spot that
   wants that exact look (a bold figure over a caption, no border) outside
   a full `DashboardCard`, e.g. a couple of them sitting inline in an
   `Accordion` row's `endSlot`. Pass `className="flex-none"` (or similar)
   to drop the `flex-1` that only makes sense inside `MetricRow`'s
   equal-width columns. */

const DEFAULT_FILTER_OPTIONS: FilterChipOption[] = [
  { value: "option-1", label: "Option 1" },
  { value: "option-2", label: "Option 2" },
  { value: "option-3", label: "Option 3" },
];

const DEFAULT_KEBAB_MENU_ITEMS: MenuEntry[] = [
  { id: "edit", label: "Edit", icon: <Pencil className="h-4 w-4" strokeWidth={1.5} /> },
  { id: "refresh", label: "Refresh", icon: <RefreshCw className="h-4 w-4" strokeWidth={1.5} /> },
  { id: "remove", label: "Remove", icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} /> },
];

/** "up" (green, `TrendingUp`), "down" (red, `TrendingDown`), "flat" (amber, em dash). */
export type DashboardCardMetricTrendDirection = "up" | "down" | "flat";

export interface DashboardCardMetricTrend {
  direction: DashboardCardMetricTrendDirection;
  /** Percentage change — e.g. `12.4` renders "+12.4%", `-3.1` renders "-3.1%", `0` renders "0%". Sign is derived from the number, not implied by `direction`, so a "flat" trend with a genuinely negative percent still shows its sign. */
  percent: number;
  /** Shown after "vs. last" — e.g. `"week"` → "vs. last week". Default `"week"`. */
  comparisonPeriod?: string;
}

const METRIC_TREND_META: Record<DashboardCardMetricTrendDirection, { icon: LucideIcon | null; colorClassName: string; colorVar: string }> = {
  up:   { icon: TrendingUp,   colorClassName: "text-lyra-status-success-strong",  colorVar: "var(--lyra-color-status-success-strong)" },
  flat: { icon: null,         colorClassName: "text-lyra-status-warning-strong",  colorVar: "var(--lyra-color-status-warning-strong)" },
  down: { icon: TrendingDown, colorClassName: "text-lyra-status-critical-strong", colorVar: "var(--lyra-color-status-critical-strong)" },
};

function formatTrendPercent(percent: number): string {
  if (percent > 0) return `+${percent}%`;
  return `${percent}%`;
}

export interface DashboardCardMetric {
  /** The large headline figure — a count, percentage, duration, etc. Untouched by `trend`/`sparkline` below — those only ever affect the subhead line underneath, never this. */
  value: React.ReactNode;
  /** Caption shown beneath the value. Replaced entirely by the trend row (arrow/em-dash + percent + "vs. last {period}") whenever `trend` is set — the two are alternatives, not stacked. */
  label: string;
  /** "contained" variant only — gives this metric the selected/active (blue) treatment. Ignored in "divided". */
  selected?: boolean;
  /** When set, replaces the `label` subhead with an inline trend row. See `DashboardCardMetricTrend`. Omit to show `label` as plain text instead. */
  trend?: DashboardCardMetricTrend;
  /**
   * Renders a small inline `Sparkline` alongside this metric's value/label
   * when provided. Colored to match `trend`'s own success/warning/critical
   * color by default (`sparklineColorVar` overrides it) — matches the
   * reference screenshot's colored trend line. Only meaningful paired with
   * `trend`; without a `trend` there's no color to match, and it falls
   * back to `Sparkline`'s own default blue.
   */
  sparkline?: number[];
  /** Overrides the sparkline's line/fill color. Default: `trend`'s color when `trend` is set, otherwise `Sparkline`'s own default. Ignored when `sparkline` is omitted. */
  sparklineColorVar?: string;
}

export type DashboardCardMetricVariant = "divided" | "contained";

export interface DashboardCardProps extends Omit<ContainerProps, "children"> {
  /** Up to 4 metrics rendered as equal-width columns. Takes over the card body in place of `children` when provided. */
  metrics?: DashboardCardMetric[];
  /**
   * "divided" (default) — plain columns separated by a vertical `Divider`, no per-item border.
   * "contained" — each metric renders inside its own `Container` (bordered box); pair with `metric.selected` for the active-card look.
   */
  metricVariant?: DashboardCardMetricVariant;
  children?: React.ReactNode;

  /** Shows a `FilterChip` in the header, before the kebab menu. Default `false`. */
  showFilterChip?: boolean;
  /**
   * Configures the header filter chip — merged over a generic placeholder
   * (label "Filter", 3 generic options). Uncontrolled by default (manages
   * its own selection internally); pass `selectedValues`/`onSelectionChange`
   * to control it from outside. Only rendered when `showFilterChip` is true.
   */
  filterChipProps?: Partial<FilterChipProps>;

  /** Shows a kebab (⋮) menu at the far right of the header. Default `false`. */
  showKebabMenu?: boolean;
  /** Kebab menu items. Defaults to Edit / Refresh / Remove when omitted. Only rendered when `showKebabMenu` is true. */
  kebabMenuItems?: MenuEntry[];

  /**
   * Shows the card's own surface — background, border, shadow. Default
   * `true`. Set to `false` for a bare/inline card with none of that.
   * Doesn't touch padding — the header and body keep the same spacing
   * either way, since removing it too left the header sitting flush
   * against whatever's below it with no breathing room. Still overridable
   * per-instance via `className`, which is merged on top of (i.e. wins
   * over) this.
   */
  showContainer?: boolean;
}

function HeaderFilterChip(props: Partial<FilterChipProps>) {
  const [internalValues, setInternalValues] = React.useState<string[]>(props.selectedValues ?? []);
  return (
    <FilterChip
      label="Filter"
      options={DEFAULT_FILTER_OPTIONS}
      // Header filter chips sit at the far right of the card (right before
      // the kebab menu — see the class comment above), and neither
      // FilterChip nor the Select it wraps does viewport-collision
      // flipping (see filter-chip.tsx's dropdownAlign doc comment). Left
      // alignment (the FilterChip-wide default, correct for a chip that
      // isn't hugging an edge) would grow the dropdown rightward off the
      // screen from here every time, confirmed from an actual screenshot,
      // not a hunch — so "right" is the sane default specifically for this
      // position. Still overridable via filterChipProps.dropdownAlign for
      // a card layout where the chip genuinely has room to grow rightward.
      dropdownAlign="right"
      {...props}
      selectedValues={props.selectedValues ?? internalValues}
      onSelectionChange={(values) => {
        setInternalValues(values);
        props.onSelectionChange?.(values);
      }}
    />
  );
}

const DashboardCard = React.forwardRef<HTMLDivElement, DashboardCardProps>(
  (
    {
      metrics,
      metricVariant = "divided",
      children,
      headerTitle,
      headerActions,
      showFilterChip = false,
      filterChipProps,
      showKebabMenu = false,
      kebabMenuItems,
      showContainer = true,
      className,
      headerClassName,
      ...containerProps
    },
    ref
  ) => {
    const hasHeaderControls = Boolean(headerActions || showFilterChip || showKebabMenu);

    return (
      <Container
        ref={ref}
        headerTitle={headerTitle}
        headerActions={
          hasHeaderControls ? (
            <div className="flex items-center gap-2">
              {headerActions}
              {showFilterChip && <HeaderFilterChip {...filterChipProps} />}
              {showKebabMenu && (
                <KebabMenuButton
                  items={kebabMenuItems ?? DEFAULT_KEBAB_MENU_ITEMS}
                  ariaLabel={headerTitle ? `More options for ${headerTitle}` : "More options"}
                />
              )}
            </div>
          ) : undefined
        }
        className={cn(
          !showContainer && "border-0 bg-transparent shadow-none",
          // Establishes the container-query boundary `MetricRow`/
          // `MetricContent` query against for their staged responsive
          // collapse (sparkline below text, then 2-up, then 1-up — see
          // lyra-tokens.css) as the card's own available width gets
          // tight — not the browser viewport's. Only relevant when
          // `metrics` is actually being rendered.
          metrics && "lyra-metric-row-wrap",
          // Hover lift — one step up the same shadow scale the card
          // already sits on (`default`'s own `shadow-sm`, see
          // `container.tsx`'s `containerVariants`), same "elevate on
          // hover" idiom `InteractionNavItem`'s expanded card already uses
          // (`hover:shadow-md` there too). Applies regardless of whether
          // this particular card happens to be clickable — plenty of
          // dashboard widgets (Productivity, Contact History) are read-only
          // and still benefit from the same "this is a distinct card"
          // affordance on hover. Skipped when `showContainer` is false —
          // a card with no surface/shadow of its own shouldn't grow one
          // only on hover.
          showContainer && "transition-shadow hover:shadow-md",
          className
        )}
        headerClassName={cn(
          // MetricRow always carries its own top padding (see below) so
          // the space above the metrics matches the rest of its padding
          // whether or not a header is shown — with the header's own
          // default bottom padding (ContainerHeader's `py-5`) still in
          // place too, that would stack into a bigger gap than before
          // whenever a header IS shown, which is explicitly what not to
          // do. Dropping the header's own bottom padding here (twMerge
          // resolves `py-5 pb-0` down to just the top half) keeps the
          // header-to-metrics gap the same order of magnitude as before —
          // slightly less (16px vs. 20px), never more. Scoped to `metrics`
          // only; `children` content types keep the header's default
          // padding untouched, since only metrics were reported tight.
          metrics && "pb-0",
          headerClassName
        )}
        {...containerProps}
      >
        {/* Caps a card's own body at 600px — the header (rendered by
            `Container` above, outside this wrapper) always stays put;
            only the body scrolls once its content would otherwise push
            the card taller than that. `max-h-[…] overflow-y-auto` is the
            same pattern `app-menu.tsx`'s dropdown list already uses, just
            with this card body's own 600px cap instead of that menu's
            480px. Wraps `children` for the "data card"/"chart widget"
            usages and `MetricRow` for the "metric card" usage alike, so
            every `DashboardCard` gets this regardless of which body type
            it renders. */}
        <div className="max-h-[600px] overflow-y-auto">
          {metrics ? <MetricRow metrics={metrics.slice(0, 4)} variant={metricVariant} /> : children}
        </div>
      </Container>
    );
  }
);
DashboardCard.displayName = "DashboardCard";

export interface MetricProps {
  metric: DashboardCardMetric;
  /**
   * Merged onto the root element, overriding its default `flex-1` (which
   * exists so a metric fills the equal-width column `MetricRow` gives it —
   * not something a standalone `Metric` outside that row layout wants; a
   * `Metric` sitting inline next to other content, e.g. an `Accordion`
   * item's `endSlot`, should size to its own content instead). Last
   * argument wins via `cn`'s twMerge, so passing e.g. `"flex-none"` here
   * replaces the default rather than fighting it.
   */
  className?: string;
}

/** Value + subhead (plain `label`, or a trend row when `trend` is set),
    plus the optional sparkline alongside it. Exported standalone (not just
    used inside `MetricRow`) so any other spot that wants exactly this
    "value on top, label/trend below" look — e.g. a couple of these sitting
    inline in an `Accordion` row's `endSlot` — composes the real thing
    instead of a separately hand-rolled lookalike that can drift from it.

    `lyra-metric-content`/`lyra-metric-sparkline` (not Tailwind's own
    `flex`/`items-center`/sizing utilities) own the beside-text →
    below-text layout switch as the card narrows — see the container-query
    block in `lyra-tokens.css` for the actual breakpoint; this component
    only needs to know the two class names, not the threshold. That
    responsive collapse only actually triggers inside a `.lyra-metric-row-
    wrap` container-query ancestor (i.e. inside a `DashboardCard`'s
    `metrics` body) — a standalone `Metric` elsewhere just keeps the
    unconstrained row layout, which is the right default for a compact
    inline usage anyway. */
function Metric({ metric, className }: MetricProps) {
  const trend = metric.trend;
  const trendMeta = trend ? METRIC_TREND_META[trend.direction] : null;
  const sparklineColorVar = metric.sparklineColorVar ?? trendMeta?.colorVar;

  return (
    <div className={cn("lyra-metric-content flex-1 justify-between gap-3 min-w-0", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="lyra-heading-2xl text-lyra-fg-default truncate">{metric.value}</span>
        {trend && trendMeta ? (
          <span className="inline-flex items-center gap-1 lyra-body-sm truncate">
            {trendMeta.icon ? (
              <trendMeta.icon className={cn("h-3.5 w-3.5 shrink-0", trendMeta.colorClassName)} strokeWidth={2} aria-hidden="true" />
            ) : (
              <span className={cn("shrink-0", trendMeta.colorClassName)} aria-hidden="true">—</span>
            )}
            <span className={trendMeta.colorClassName}>{formatTrendPercent(trend.percent)}</span>
            <span className="text-lyra-fg-secondary truncate">vs. last {trend.comparisonPeriod ?? "week"}</span>
          </span>
        ) : (
          <span className="lyra-body-sm text-lyra-fg-secondary truncate">{metric.label}</span>
        )}
      </div>
      {metric.sparkline && (
        <div className="lyra-metric-sparkline">
          <Sparkline data={metric.sparkline} colorVar={sparklineColorVar} />
        </div>
      )}
    </div>
  );
}

function MetricRow({ metrics, variant }: { metrics: DashboardCardMetric[]; variant: DashboardCardMetricVariant }) {
  // The container-query stacking thresholds below (see lyra-tokens.css)
  // were calibrated around up to 4 metrics needing to progressively
  // collapse. A row of 2 (or fewer) already fits comfortably side by side
  // at widths where a 4-metric row genuinely needs to stack — e.g.
  // DashboardQueue's per-card Skills/Contacts pair, which is often
  // narrower than a full-width DashboardCard ever is. `lyra-metric-row--
  // compact` tells the CSS to keep a ≤2-metric row's own 2-up layout all
  // the way down instead of collapsing it to 1-up at the same 360px point
  // a 4-metric row would.
  const isCompact = metrics.length <= 2;

  if (variant === "contained") {
    return (
      <div className={cn("lyra-metric-row items-stretch gap-3 px-4 pb-4 pt-4", isCompact && "lyra-metric-row--compact")}>
        {metrics.map((metric, i) => (
          <Container
            key={i}
            variant={metric.selected ? "info-strong" : "default"}
            className="flex flex-1 p-4"
          >
            <Metric metric={metric} />
          </Container>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("lyra-metric-row lyra-metric-row--divided items-stretch px-4 pb-4 pt-4", isCompact && "lyra-metric-row--compact")}>
      {metrics.map((metric, i) => (
        <React.Fragment key={i}>
          {/* lyra-metric-row-item (not Tailwind's first:pl-0/last:pr-0) —
              the plain Tailwind pseudo-class version can't be selectively
              undone from inside the container query below it once metrics
              stack into a column: every stacked item needs the *same*
              left/right padding, not just the ones that were first/last in
              the (now nonexistent) row. */}
          <div className="flex flex-1 lyra-metric-row-item">
            <Metric metric={metric} />
          </div>
          {i < metrics.length - 1 && (
            <>
              <Divider orientation="horizontal" className="lyra-metric-row-divider--horizontal" />
              {/* Divider's own vertical styling is `h-full` (height:
                  100%) — inside `.lyra-metric-row`'s intrinsic (content-
                  driven), not fixed, height, that percentage has nothing
                  definite to resolve against and the divider collapses to
                  0 height instead of stretching, so no line ever shows.
                  Overriding to `h-auto self-stretch` (the className prop
                  is merged in *after* Divider's own base classes via
                  `cn`'s twMerge, so it wins) sidesteps the percentage
                  entirely and stretches purely via the flex algorithm,
                  which has no such ambiguity. */}
              <Divider orientation="vertical" className="lyra-metric-row-divider--vertical h-auto self-stretch" />
            </>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export { DashboardCard, Metric };
