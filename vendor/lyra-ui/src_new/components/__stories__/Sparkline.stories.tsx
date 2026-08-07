import type { Meta, StoryObj } from "@storybook/react";
import { Sparkline } from "../sparkline";

const meta = {
  title: "Atoms/Sparkline",
  component: Sparkline,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    data: { table: { disable: true } },
  },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

/* Same shape of series a "vs last week" metric trend would plot — jagged
   but generally trending up, matching the reference screenshot. */
const TREND_UP = [4, 6, 5, 8, 7, 10, 9, 12, 11, 14, 13, 16];
const TREND_DOWN = [16, 14, 15, 12, 13, 10, 11, 8, 9, 6, 7, 4];
const TREND_FLAT = [8, 9, 8, 7, 8, 9, 8, 8, 9, 8, 7, 8];

/* ── Default ── */

export const Default: Story = {
  render: () => (
    <div className="h-[60px] w-[160px]">
      <Sparkline data={TREND_UP} />
    </div>
  ),
};

/* ── AllVariants ──
   The three trend directions `DashboardCard`'s metric trend arrow also
   uses (success/warning/critical) — Sparkline itself has no notion of
   "trend direction," it just plots whatever `colorVar` it's given, but
   these are the three colors a consumer pairs it with in practice. */

export const AllVariants: Story = {
  name: "AllVariants",
  render: () => (
    <div className="flex flex-wrap gap-10">
      <div className="flex flex-col items-center gap-2">
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">Up (success)</p>
        <div className="h-[60px] w-[160px]">
          <Sparkline data={TREND_UP} colorVar="var(--lyra-color-status-success-strong)" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">Flat (warning)</p>
        <div className="h-[60px] w-[160px]">
          <Sparkline data={TREND_FLAT} colorVar="var(--lyra-color-status-warning-strong)" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">Down (critical)</p>
        <div className="h-[60px] w-[160px]">
          <Sparkline data={TREND_DOWN} colorVar="var(--lyra-color-status-critical-strong)" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">Default (active blue)</p>
        <div className="h-[60px] w-[160px]">
          <Sparkline data={TREND_UP} />
        </div>
      </div>
    </div>
  ),
};
