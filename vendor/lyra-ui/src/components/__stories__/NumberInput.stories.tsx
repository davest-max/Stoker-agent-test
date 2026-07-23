import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { NumberInput } from "../number-input";

const meta: Meta<typeof NumberInput> = {
  title: "Atoms/Number Input",
  component: NumberInput,
  tags: ["autodocs"],
  parameters: { layout: "centered", backgrounds: { default: "lyra-shell" } },
};

export default meta;
type Story = StoryObj<typeof NumberInput>;

export const Default: Story = {
  render: () => {
    const [v, setV] = useState(0);
    return <div className="w-40"><NumberInput label="Quantity" value={v} onChange={setV} /></div>;
  },
};

export const WithMinMax: Story = {
  name: "With Min / Max",
  render: () => {
    const [v, setV] = useState(5);
    return (
      <div className="w-40">
        <NumberInput label="Rating (1–10)" value={v} min={1} max={10} onChange={setV} />
      </div>
    );
  },
};

export const WithWrap: Story = {
  name: "Wrapping (0–59)",
  render: () => {
    const [v, setV] = useState(0);
    return (
      <div className="w-40">
        <NumberInput label="Minutes" value={v} min={0} max={59} wrap padWidth={2} onChange={setV} />
      </div>
    );
  },
};

export const WithStep: Story = {
  name: "Custom Step",
  render: () => {
    const [v, setV] = useState(0);
    return (
      <div className="w-40">
        <NumberInput label="Percentage" value={v} min={0} max={100} step={5} onChange={setV} />
      </div>
    );
  },
};

export const AllStates: Story = {
  name: "All States",
  render: () => (
    <div className="flex flex-col gap-4 w-48">
      <NumberInput label="Default"  defaultValue={42} />
      <NumberInput label="Disabled" defaultValue={42} disabled />
      <NumberInput label="Readonly" defaultValue={42} readonly />
      <NumberInput label="Error"    defaultValue={-1} min={0} error="Must be 0 or greater" />
    </div>
  ),
};
