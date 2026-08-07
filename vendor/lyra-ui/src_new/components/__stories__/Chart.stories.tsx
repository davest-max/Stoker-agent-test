import type { Meta, StoryObj } from "@storybook/react";
import { Chart } from "../chart";

const meta = {
  title: "Atoms/Chart",
  component: Chart,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    option: { table: { disable: true } },
  },
} satisfies Meta<typeof Chart>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Default ──
   Chart is a deliberately generic ECharts wrapper — any valid ECharts
   `option` object renders as-is. Chart-type-specific components (see
   DonutChart) build that option and own any lyra-token color resolution;
   this story just proves the wrapper itself works with a plain bar chart,
   the simplest possible option shape. */

export const Default: Story = {
  render: () => (
    <div className="h-[280px] w-[420px]">
      <Chart
        option={{
          xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
          yAxis: { type: "value" },
          series: [{ type: "bar", data: [12, 19, 8, 15, 11] }],
        }}
      />
    </div>
  ),
};

/* ── AllVariants ──
   Same wrapper, a different ECharts series type (line instead of bar) —
   demonstrates Chart makes no assumptions about chart type. */

export const AllVariants: Story = {
  name: "AllVariants",
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-2">Bar</p>
        <div className="h-[220px] w-[420px]">
          <Chart
            option={{
              xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
              yAxis: { type: "value" },
              series: [{ type: "bar", data: [12, 19, 8, 15, 11] }],
            }}
          />
        </div>
      </div>
      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-2">Line</p>
        <div className="h-[220px] w-[420px]">
          <Chart
            option={{
              xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
              yAxis: { type: "value" },
              series: [{ type: "line", data: [12, 19, 8, 15, 11], smooth: true }],
            }}
          />
        </div>
      </div>
    </div>
  ),
};
