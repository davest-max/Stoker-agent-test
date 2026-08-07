import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Foundations/Spacing",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj;

const spacingScale = [
  { token: "space-0", cssVar: "lyra-spacing-0", tailwind: "p-0, m-0, gap-0", rem: "0px", px: "0px" },
  { token: "space-1", cssVar: "lyra-spacing-1", tailwind: "p-1, m-1, gap-1", rem: "0.25rem", px: "4px" },
  { token: "space-2", cssVar: "lyra-spacing-2", tailwind: "p-2, m-2, gap-2", rem: "0.5rem", px: "8px" },
  { token: "space-3", cssVar: "lyra-spacing-3", tailwind: "p-3, m-3, gap-3", rem: "0.75rem", px: "12px" },
  { token: "space-4", cssVar: "lyra-spacing-4", tailwind: "p-4, m-4, gap-4", rem: "1rem", px: "16px" },
  { token: "space-5", cssVar: "lyra-spacing-5", tailwind: "p-5, m-5, gap-5", rem: "1.25rem", px: "20px" },
  { token: "space-6", cssVar: "lyra-spacing-6", tailwind: "p-6, m-6, gap-6", rem: "1.5rem", px: "24px" },
  { token: "space-7", cssVar: "lyra-spacing-7", tailwind: "p-7, m-7, gap-7", rem: "1.75rem", px: "28px" },
  { token: "space-8", cssVar: "lyra-spacing-8", tailwind: "p-8, m-8, gap-8", rem: "2rem", px: "32px" },
  { token: "space-9", cssVar: "lyra-spacing-9", tailwind: "p-9, m-9, gap-9", rem: "2.25rem", px: "36px" },
];

export const Scale: Story = {
  name: "Scale",
  render: () => (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Spacing Table</h2>
        <p className="lyra-body-lg text-lyra-fg-secondary">
          Lyra spacing scale based on a 4px base unit. Use for padding, margins, and gaps.
        </p>
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-lyra-border-medium">
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Token</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">CSS Variable</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Class</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Value</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Pixels</th>
            <th className="py-2 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Preview</th>
          </tr>
        </thead>
        <tbody>
          {spacingScale.map((s) => (
            <tr key={s.token} className="border-b border-lyra-border-subtle">
              <td className="py-3 pr-4 lyra-body-md-emphasis text-lyra-fg-default whitespace-nowrap">{s.token}</td>
              <td className="py-3 pr-4 lyra-body-md text-lyra-fg-disabled font-mono whitespace-nowrap">{s.cssVar}</td>
              <td className="py-3 pr-4 lyra-body-md text-lyra-fg-action font-mono whitespace-nowrap">{s.tailwind}</td>
              <td className="py-3 pr-4 lyra-body-md text-lyra-fg-secondary font-mono whitespace-nowrap">{s.rem}</td>
              <td className="py-3 pr-4 lyra-body-md text-lyra-fg-secondary font-mono whitespace-nowrap">{s.px}</td>
              <td className="py-3">
                <div
                  className="h-4 rounded-lyra-xs bg-lyra-bg-primary"
                  style={{ width: s.px === "0px" ? "2px" : s.px }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};
