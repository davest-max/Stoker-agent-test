import type { Meta, StoryObj } from "@storybook/react";
import { DonutChart, type DonutChartDatum } from "../donut-chart";
import { cn } from "../../lib/utils";

const meta = {
  title: "Atoms/DonutChart",
  component: DonutChart,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    data: { table: { disable: true } },
  },
} satisfies Meta<typeof DonutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/* Same status breakdown shape the home screen's Activity card uses. */
const ACTIVITY_DATA: (DonutChartDatum & { dotClassName: string })[] = [
  { label: "Available",   value: 22, colorVar: "var(--lyra-color-status-success-strong)",  dotClassName: "bg-lyra-status-success-strong" },
  { label: "Working",     value: 61, colorVar: "var(--lyra-color-status-warning-strong)",  dotClassName: "bg-lyra-status-warning-strong" },
  { label: "Unavailable", value: 17, colorVar: "var(--lyra-color-status-critical-strong)", dotClassName: "bg-lyra-status-critical-strong" },
];

/* ── Default ── */

export const Default: Story = {
  render: () => (
    <div className="h-[160px] w-[160px]">
      <DonutChart data={ACTIVITY_DATA} />
    </div>
  ),
};

/* ── AllVariants ──
   Ring-only (default), a thinner ring via a smaller innerRadius, and the
   "ring + external legend" composition every real consumer (e.g. the home
   screen's Activity card) actually uses — DonutChart intentionally has no
   legend of its own (see the component's own doc comment), so the third
   example shows the intended pairing: showTooltip disabled, with a
   consumer-owned legend built from the same `data` array sitting next to
   it. */

export const AllVariants: Story = {
  name: "AllVariants",
  render: () => (
    <div className="flex flex-wrap gap-10">
      <div className="flex flex-col items-center gap-2">
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">Default ring</p>
        <div className="h-[140px] w-[140px]">
          <DonutChart data={ACTIVITY_DATA} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">Thinner ring</p>
        <div className="h-[140px] w-[140px]">
          <DonutChart data={ACTIVITY_DATA} innerRadius="80%" outerRadius="95%" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">Ring + external legend</p>
        <div className="flex items-center gap-4">
          <div className="h-[120px] w-[120px] shrink-0">
            <DonutChart data={ACTIVITY_DATA} showTooltip={false} />
          </div>
          <div className="flex flex-col gap-2">
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
      </div>
    </div>
  ),
};
