import type { Meta, StoryObj } from "@storybook/react";
import { Clock, Gauge, List, CheckCircle2, CircleDot, MinusCircle, type LucideIcon } from "lucide-react";
import { DashboardCard, type DashboardCardMetric } from "../dashboard-card";
import { DonutChart } from "../donut-chart";
import { Icon } from "../icon";
import { Tag } from "../tag";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, useAutoFitRows } from "../table";
import { cn } from "../../lib/utils";

const meta = {
  title: "Atoms/Dashboard Card",
  component: DashboardCard,
  tags: ["autodocs"],
  // fullscreen — every story below stretches its card to `w-full` inside a
  // light `p-6` frame instead of a fixed pixel width, per "all cards should
  // stretch to 100% width of the screen." `padded` (Storybook's default)
  // caps the canvas at a fixed max-width, which would silently re-impose a
  // pixel ceiling underneath any `w-full` card.
  parameters: { layout: "fullscreen", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    metrics: { table: { disable: true } },
    children: { table: { disable: true } },
    headerIcon: { table: { disable: true } },
    headerSubhead: { table: { disable: true } },
    headerTopSlot: { table: { disable: true } },
    headerActions: { table: { disable: true } },
    filterChipProps: { table: { disable: true } },
    kebabMenuItems: { table: { disable: true } },
    metricVariant: { control: "select", options: ["divided", "contained"] },
    showFilterChip: { control: "boolean" },
    showKebabMenu: { control: "boolean" },
    showHeaderIcon: { control: "boolean" },
    showHeaderSubhead: { control: "boolean" },
    showHeaderTag: { control: "boolean" },
    showHeaderText: { control: "boolean" },
    showContainer: { control: "boolean" },
    showTrend: { control: "boolean" },
  },
} satisfies Meta<typeof DashboardCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Metric data (matches the reference screenshots) ── */

const METRICS: DashboardCardMetric[] = [
  { value: 70, label: "Metric Name" },
  { value: 10, label: "Metric Name" },
  { value: 58, label: "Metric Name" },
  { value: 2, label: "Metric Name" },
];

const METRICS_WITH_SELECTION: DashboardCardMetric[] = METRICS.map((m, i) => ({ ...m, selected: i === 0 }));

/* Same `value`/`label` as METRICS (untouched by trend, per the request —
   trend only ever replaces the subhead line, never the main figure above
   it) plus a `trend` object and one sparkline series per direction —
   jagged but generally moving the way its `trend.direction` claims, same
   shape `Sparkline.stories.tsx` uses. */
const METRICS_WITH_TREND: DashboardCardMetric[] = [
  { value: 70, label: "Metric Name", trend: { direction: "up",   percent: 12.4 }, sparkline: [4, 6, 5, 8, 7, 10, 9, 12, 11, 14, 13, 16] },
  { value: 10, label: "Metric Name", trend: { direction: "flat", percent: 0.4 },  sparkline: [8, 9, 8, 7, 8, 9, 8, 8, 9, 8, 7, 8] },
  { value: 58, label: "Metric Name", trend: { direction: "down", percent: -3.1 }, sparkline: [16, 14, 15, 12, 13, 10, 11, 8, 9, 6, 7, 4] },
  { value: 2,  label: "Metric Name", trend: { direction: "up",   percent: 5.8 },  sparkline: [5, 6, 6, 7, 6, 8, 8, 9, 8, 10, 9, 11] },
];

/* ── Default ──
   The simplest real usage: a bare 4-column "divided" metric strip, no
   outer card chrome — matches the plain reference screenshot exactly. */

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <DashboardCard metrics={METRICS} metricVariant="divided" className="w-full border-0 bg-transparent shadow-none" />
    </div>
  ),
};

/* ── Chart Widget ──
   Same composition as the home screen's Activity card: a Container-style
   header (icon + title) with a DonutChart + hand-built legend as
   `children` — DashboardCard doesn't know anything about charts, it's
   just the card shell around whatever the consumer puts inside it. */

const ACTIVITY_DATA = [
  { label: "Available",   value: 22, colorVar: "var(--lyra-color-status-success-strong)",  dotClassName: "bg-lyra-status-success-strong" },
  { label: "Working",     value: 61, colorVar: "var(--lyra-color-status-warning-strong)",  dotClassName: "bg-lyra-status-warning-strong" },
  { label: "Unavailable", value: 17, colorVar: "var(--lyra-color-status-critical-strong)", dotClassName: "bg-lyra-status-critical-strong" },
];

function ChartWidgetBody() {
  return (
    <div className="flex items-center gap-6 px-4 pb-4">
      <div className="h-[120px] w-[120px] shrink-0">
        <DonutChart data={ACTIVITY_DATA} />
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        {ACTIVITY_DATA.map((d) => (
          <div key={d.label} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 lyra-body-md text-lyra-fg-secondary">
              <span className={cn("h-2.5 w-2.5 rounded-full", d.dotClassName)} aria-hidden="true" />
              {d.label}
            </span>
            <span className="lyra-heading-sm text-lyra-fg-default">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const ChartWidget: Story = {
  name: "Chart Widget",
  render: () => (
    <div className="p-6">
      <DashboardCard
        variant="neutral-subtle"
        className="w-full"
        headerTitle="Activity"
        headerIcon={<Icon icon={Clock} size="md" background="active" shape="rounded" decorative />}
        showFilterChip
        showKebabMenu
      >
        <ChartWidgetBody />
      </DashboardCard>
    </div>
  ),
};

/* ── Data Card ──
   Same composition as the home screen's Productivity breakdown card: an
   icon + title header, with self/team duration rows as `children` — no
   chart at all, proving DashboardCard's header+body shell works equally
   well for a "just rows" widget. */

const PRODUCTIVITY_ROWS: {
  label: string;
  icon: LucideIcon;
  iconColorClassName: string;
  percent: number;
  time: string;
  teamPercent: number;
  teamTime: string;
}[] = [
  { label: "Available",   icon: CheckCircle2, iconColorClassName: "text-lyra-status-success-strong",  percent: 22, time: "01:45:12", teamPercent: 28, teamTime: "02:14:40" },
  { label: "Working",     icon: CircleDot,    iconColorClassName: "text-lyra-status-warning-strong",  percent: 61, time: "04:53:08", teamPercent: 55, teamTime: "04:24:00" },
  { label: "Unavailable", icon: MinusCircle,  iconColorClassName: "text-lyra-status-critical-strong", percent: 17, time: "01:21:40", teamPercent: 17, teamTime: "01:21:20" },
];

function DataCardBody() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      {PRODUCTIVITY_ROWS.map((row) => (
        <div key={row.label} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 lyra-body-md-emphasis text-lyra-fg-default">
              <row.icon className={cn("h-4 w-4", row.iconColorClassName)} strokeWidth={1.5} />
              {row.label}
              <span className="lyra-body-sm text-lyra-fg-secondary font-normal">({row.percent}%)</span>
            </span>
            <span className="lyra-body-md-emphasis tabular-nums text-lyra-fg-default">{row.time}</span>
          </div>
          <div className="flex items-center justify-between gap-3 pl-6">
            <span className="lyra-body-sm text-lyra-fg-secondary">Team ({row.teamPercent}%)</span>
            <span className="lyra-body-sm tabular-nums text-lyra-fg-secondary">{row.teamTime}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export const DataCard: Story = {
  name: "Data Card",
  render: () => (
    <div className="p-6">
      <DashboardCard
        variant="neutral-subtle"
        className="w-full"
        headerTitle="Productivity"
        headerIcon={<Icon icon={Gauge} size="md" background="info" shape="rounded" decorative />}
        showFilterChip
        showKebabMenu
      >
        <DataCardBody />
      </DashboardCard>
    </div>
  ),
};

/* ── Table Card ──
   `useAutoFitRows` (see `table.tsx`) measures the height of the container
   it's given and computes how many rows fit — the consumer slices its own
   data to that count (Table itself has no `rowsPerPage` prop; see
   `DataManagement.stories.tsx`'s `AutoFit` story for the same pattern at
   full toolbar/pagination scale). Resize this story's frame vertically to
   see the row count adjust. */

interface TableCardRow {
  id: number;
  name: string;
  status: "Active" | "Paused" | "Draft";
  owner: string;
}

const TABLE_CARD_ROWS: TableCardRow[] = [
  { id: 1, name: "Outbound Collections",     status: "Active", owner: "John Smith" },
  { id: 2, name: "Winback — Q3",             status: "Paused", owner: "Kevin Jensen" },
  { id: 3, name: "Escalations Overflow",     status: "Active", owner: "Priya Nair" },
  { id: 4, name: "VIP Renewals",             status: "Draft",  owner: "Wei Chen" },
  { id: 5, name: "Billing Support",          status: "Active", owner: "John Smith" },
  { id: 6, name: "Technical Support Backlog", status: "Paused", owner: "Jamie Torres" },
];

const TABLE_STATUS_CLASSNAME: Record<TableCardRow["status"], string> = {
  Active: "text-lyra-status-success-strong",
  Paused: "text-lyra-status-warning-strong",
  Draft: "text-lyra-fg-secondary",
};

function AutoFitTableCardBody() {
  // 41/41, not the hook's 40/40 default — TableHead/TableCell are h-10
  // (40px, border-box) but TableRow adds its own border-b *on the row*,
  // outside that box, so every row except the last is actually 41px tall
  // (same for the header row). Passing the hook the real 41px per row
  // keeps its floor()-based row count from overshooting what the
  // container can actually hold without scrolling — with the un-adjusted
  // 40px assumption, 6 rows measured as "fits in 280px" (240/40 = 6.0
  // exactly) when they actually need 286px (5 borders + the header's own),
  // clipping the last row and forcing a scrollbar. `h-[320px]` leaves a
  // further ~30px of slack on top of that fix so this isn't re-balanced
  // on a knife's edge the next time anything here changes by a pixel.
  const { containerRef, rowsPerPage } = useAutoFitRows(41, 41, 3);
  const rows = TABLE_CARD_ROWS.slice(0, rowsPerPage);

  return (
    <div ref={containerRef} className="h-[320px] px-4 pb-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="flex-[2]">Campaign</TableHead>
            <TableHead className="flex-1">Status</TableHead>
            <TableHead className="flex-1">Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="flex-[2]">{row.name}</TableCell>
              <TableCell className={cn("flex-1", TABLE_STATUS_CLASSNAME[row.status])}>{row.status}</TableCell>
              <TableCell className="flex-1">{row.owner}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const TableCard: Story = {
  name: "Table Card",
  render: () => (
    <div className="p-6">
      <DashboardCard
        variant="neutral-subtle"
        className="w-full"
        headerTitle="Campaigns"
        headerIcon={<Icon icon={List} size="md" background="neutral" shape="rounded" decorative />}
        showFilterChip
        showKebabMenu
      >
        <AutoFitTableCardBody />
      </DashboardCard>
    </div>
  ),
};

/* ── Header Controls ──
   `showFilterChip`/`showKebabMenu`/`showHeaderIcon`/`showHeaderSubhead`/
   `showHeaderTag`/`showHeaderText`/`showContainer` as live Storybook
   Controls — flip them in the Controls panel below to turn each header
   piece on and off on this exact rendered card (not just a static prop
   table). `contentType` goes a step further: it swaps the card's entire
   body between the four real content shapes this file demonstrates (Chart
   Widget / Data Card / Table Card / Metric Card), so any header-control
   combination can be checked against any content type instead of just
   one. Per-type header title/icon come from `CONTENT_TYPE_HEADER` below —
   same title/icon each type's own dedicated story uses, not a re-guessed
   copy. The kebab's dropdown (Edit / Refresh / Remove by default) opens
   via a portal, same as `KebabMenuButton`'s own story.

   `showHeaderTag` renders a `Tag` ("Anomaly", critical, pill) via
   `headerTopSlot` — a real `Container`/`ContainerHeader` prop (not a
   DashboardCard-specific one; DashboardCard just inherits it through
   `ContainerProps`), rendered on its own line above the icon+title row.
   `showHeaderIcon`/`showHeaderSubhead`/`showHeaderText` are synthetic
   story-only args (`headerIcon`/`headerSubhead`/`headerTitle` are the real
   props); `showHeaderTag` follows the same story-only convention for the
   same reason — the underlying prop already exists and doesn't need its
   own boolean twin.

   `showHeaderText` turns the title text off while leaving icon/subhead/tag
   alone — this required a real fix in `ContainerHeader`/`Container`, which
   previously gated the *entire* header's existence on `headerTitle` being
   truthy; an icon-only header with no title text simply couldn't render
   before. `Container` now renders the header row when any header-related
   prop is present, and `ContainerHeader`'s own title is optional.

   `showContainer`, unlike the others, is a real `DashboardCard` prop (see
   `dashboard-card.tsx`) rather than a synthetic toggle — off strips just
   the card's background/border/shadow. Padding is untouched: an earlier
   version also zeroed the header's own padding, but a screenshot showed
   it landing flush against whatever's below with no breathing room, so
   header/body spacing now stays the same whether the surface is on or
   off.

   `metricCount` (1-4, synthetic, only meaningful when `contentType` is
   "metric") slices `METRICS` down to that many columns and passes the
   result as the real `metrics` prop — same underlying mechanism the
   dedicated "Metric Card" story below uses (`METRICS.slice(0, n)`), just
   wired to a live control here instead of separate hardcoded examples.

   `showTrend` (synthetic, only meaningful when `contentType` is "metric")
   swaps `METRICS` for `METRICS_WITH_TREND` — same `value`/`label` as
   `METRICS` (trend never touches the main figure), plus the real `trend`/
   `sparkline` fields, which *replace* the label subhead with an arrow (or
   em dash for "flat") + percent + "vs. last week," matching the reference
   screenshot's "+12.4% vs last week" line. `metricCount` slices whichever
   of the two arrays is active, so both controls compose. */

type HeaderControlsContentType = "chart" | "data" | "table" | "metric";

const CONTENT_TYPE_HEADER: Record<HeaderControlsContentType, { title: string; icon: LucideIcon; background: "active" | "info" | "neutral" }> = {
  chart:  { title: "Activity",     icon: Clock, background: "active" },
  data:   { title: "Productivity", icon: Gauge, background: "info" },
  table:  { title: "Campaigns",    icon: List,  background: "neutral" },
  metric: { title: "Metrics",      icon: Clock, background: "active" },
};

export const HeaderControls: Story = {
  name: "Header Controls",
  args: {
    showFilterChip: true,
    showKebabMenu: true,
    showHeaderIcon: true,
    showHeaderSubhead: true,
    showHeaderTag: false,
    showHeaderText: true,
    showContainer: true,
    showTrend: false,
    metricVariant: "divided",
    contentType: "chart",
    metricCount: 4,
  },
  argTypes: {
    contentType: { control: "select", options: ["chart", "data", "table", "metric"] },
    // Both only meaningful when contentType is "metric" — see below.
    metricCount: { control: "select", options: [1, 2, 3, 4] },
  },
  render: (args) => {
    const contentType: HeaderControlsContentType = args.contentType ?? "chart";
    const header = CONTENT_TYPE_HEADER[contentType];
    const metricCount = args.metricCount ?? 4;
    const metricSource = args.showTrend ? METRICS_WITH_TREND : METRICS;

    return (
      <div className="p-6">
        <DashboardCard
          variant="neutral-subtle"
          className="w-full"
          headerTitle={args.showHeaderText ?? true ? header.title : undefined}
          headerIcon={
            args.showHeaderIcon ? (
              <Icon icon={header.icon} size="md" background={header.background} shape="rounded" decorative />
            ) : undefined
          }
          headerSubhead={args.showHeaderSubhead ? "Jan 26, 2026 at 4:00 PM" : undefined}
          headerTopSlot={args.showHeaderTag ? <Tag label="Anomaly" variant="critical" shape="pill" /> : undefined}
          showFilterChip={args.showFilterChip}
          showKebabMenu={args.showKebabMenu}
          showContainer={args.showContainer ?? true}
          {...(contentType === "metric"
            ? { metrics: metricSource.slice(0, metricCount), metricVariant: args.metricVariant }
            : {})}
        >
          {contentType === "chart" && <ChartWidgetBody />}
          {contentType === "data" && <DataCardBody />}
          {contentType === "table" && <AutoFitTableCardBody />}
        </DashboardCard>
      </div>
    );
  },
};

/* ── Metric Card ──
   The `metrics` prop, both layouts side by side — "divided" (plain
   reference screenshot) and "contained" with the first metric `selected`
   (the blue reference screenshot: "the blue contained card is an example
   of a selected card"). The trend/sparkline example (`METRICS_WITH_TREND`)
   matches a further reference screenshot: the value stays untouched (same
   70/10/58/2 as `METRICS`), but the subhead line where "Metric Name" used
   to sit is replaced entirely by an arrow (or em dash for "flat") +
   percent + "vs. last week," colored success/warning/critical, plus a
   Sparkline alongside it colored to match — the same "Header Controls"
   `showTrend` toggle applies this, this is just the always-on dedicated
   example. */

export const MetricCard: Story = {
  name: "Metric Card",
  render: () => (
    <div className="flex flex-col gap-8 p-6">
      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-2">Divided</p>
        <DashboardCard metrics={METRICS} metricVariant="divided" className="w-full border-0 bg-transparent shadow-none" />
      </div>
      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-2">Contained — first metric selected</p>
        <DashboardCard metrics={METRICS_WITH_SELECTION} metricVariant="contained" className="w-full border-0 bg-transparent shadow-none" />
      </div>
      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-2">Contained — 2 columns</p>
        <DashboardCard metrics={METRICS.slice(0, 2)} metricVariant="contained" className="w-full border-0 bg-transparent shadow-none" />
      </div>
      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-2">Divided — with trend + sparkline</p>
        <DashboardCard metrics={METRICS_WITH_TREND} metricVariant="divided" className="w-full border-0 bg-transparent shadow-none" />
      </div>
    </div>
  ),
};

/* ── AllVariants ──
   All usages side by side / stacked for a single visual-regression pass,
   reusing the exact same data as the dedicated stories above. */

export const AllVariants: Story = {
  name: "AllVariants",
  render: () => (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <DashboardCard
          variant="neutral-subtle"
          className="w-full"
          headerTitle="Activity"
          headerIcon={<Icon icon={Clock} size="md" background="active" shape="rounded" decorative />}
          showFilterChip
          showKebabMenu
        >
          <ChartWidgetBody />
        </DashboardCard>

        <DashboardCard
          variant="neutral-subtle"
          className="w-full"
          headerTitle="Productivity"
          headerIcon={<Icon icon={Gauge} size="md" background="info" shape="rounded" decorative />}
          showFilterChip
          showKebabMenu
        >
          <DataCardBody />
        </DashboardCard>

        <DashboardCard
          variant="neutral-subtle"
          className="w-full"
          headerTitle="Campaigns"
          headerIcon={<Icon icon={List} size="md" background="neutral" shape="rounded" decorative />}
          showFilterChip
          showKebabMenu
        >
          <AutoFitTableCardBody />
        </DashboardCard>
      </div>

      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-2">Metric — divided</p>
        <DashboardCard metrics={METRICS} metricVariant="divided" className="w-full border-0 bg-transparent shadow-none" />
      </div>

      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-2">Metric — contained, first selected</p>
        <DashboardCard metrics={METRICS_WITH_SELECTION} metricVariant="contained" className="w-full border-0 bg-transparent shadow-none" />
      </div>
    </div>
  ),
};
