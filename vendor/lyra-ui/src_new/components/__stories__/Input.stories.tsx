import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../input";

const meta: Meta<typeof Input> = {
  title: "Atoms/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  name: "Default",
  args: {
    label: "Input Label",
    placeholder: "Text",
  },
};

export const Filled: Story = {
  name: "Filled",
  args: {
    label: "Input Label",
    defaultValue: "Text",
  },
};

export const Disabled: Story = {
  name: "Disabled",
  args: {
    label: "Input Label",
    placeholder: "Text",
    disabled: true,
  },
};

export const Readonly: Story = {
  name: "Readonly",
  args: {
    label: "Input Label",
    value: "Read-only value",
    readonly: true,
  },
};

export const Error: Story = {
  name: "Error",
  args: {
    label: "Input Label",
    defaultValue: "Text",
    error: "Required",
  },
};

export const AllStates: Story = {
  name: "All States",
  render: () => (
    <div className="flex flex-col gap-6 max-w-[400px]">
      <Input label="Input Label" placeholder="Text" />
      <Input label="Input Label" defaultValue="Text" />
      <Input label="Input Label" disabled placeholder="Text" />
      <Input label="Input Label" defaultValue="Text" error="Required" />
    </div>
  ),
};
