import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "../tooltip";
import { Button } from "../button";

const meta: Meta<typeof Tooltip> = {
  title: "Atoms/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <div className="pt-16">
      <Tooltip content="Tooltip text in here" placement="top">
        <Button variant="outline" size="sm">Hover me (top)</Button>
      </Tooltip>
    </div>
  ),
};

export const Placements: Story = {
  name: "All Placements",
  render: () => (
    <div className="flex flex-col items-center gap-16 py-20">
      <Tooltip content="Tooltip text in here" placement="top">
        <Button variant="outline" size="sm">Top</Button>
      </Tooltip>
      <Tooltip content="Tooltip text in here" placement="bottom">
        <Button variant="outline" size="sm">Bottom</Button>
      </Tooltip>
      <div className="flex items-center gap-32">
        <Tooltip content="Tooltip text in here" placement="left">
          <Button variant="outline" size="sm">Left</Button>
        </Tooltip>
        <Tooltip content="Tooltip text in here" placement="right">
          <Button variant="outline" size="sm">Right</Button>
        </Tooltip>
      </div>
    </div>
  ),
};

export const LongContent: Story = {
  name: "Long Content",
  render: () => (
    <div className="pt-20">
      <Tooltip
        content="This is a longer tooltip message that wraps across multiple lines to show how the component handles it."
        placement="top"
      >
        <Button variant="outline" size="sm">Hover for long tooltip</Button>
      </Tooltip>
    </div>
  ),
};

export const StaticPreview: Story = {
  name: "Static Preview",
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid grid-cols-2 gap-20 p-16">
      {(["top", "bottom", "left", "right"] as const).map((placement) => (
        <div key={placement} className="flex items-center justify-center">
          <Tooltip content="Tooltip text in here" placement={placement} delayMs={0}>
            <Button variant="outline" className="capitalize">{placement}</Button>
          </Tooltip>
        </div>
      ))}
    </div>
  ),
};

export const AllVariants: Story = {
  name: "All Variants",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-col gap-12 p-8">
      {/* All placements */}
      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-6">All Placements</p>
        <div className="grid grid-cols-2 gap-16">
          {(["top", "bottom", "left", "right"] as const).map((placement) => (
            <div key={placement} className="flex items-center justify-center py-6">
              <Tooltip content="Tooltip text in here" placement={placement} delayMs={0}>
                <Button variant="outline" className="capitalize">{placement}</Button>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>

      {/* Short vs long content */}
      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-6">Content Length</p>
        <div className="flex items-center gap-8">
          <Tooltip content="Short tip" placement="top" delayMs={0}>
            <Button variant="outline">Short content</Button>
          </Tooltip>
          <Tooltip
            content="This is a longer tooltip that wraps across multiple lines to demonstrate how the component handles extended text content."
            placement="top"
            delayMs={0}
          >
            <Button variant="outline">Long content</Button>
          </Tooltip>
        </div>
      </div>
    </div>
  ),
};
