import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Spinner } from "../spinner";
import { Button } from "../button";

const meta: Meta<typeof Spinner> = {
  title: "Atoms/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  parameters: { layout: "centered", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    variant: { control: "select", options: ["bar", "circle"] },
    size:    { control: "select", options: ["sm", "md", "lg"] },
    color:   { control: "select", options: ["primary", "inverse"] },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

/* ── SOL-matched stories ── */

export const SpinnerBar: Story = {
  name: "Spinner Bar",
  render: () => (
    <div className="flex items-center gap-8">
      <Spinner variant="bar" size="sm" />
      <Spinner variant="bar" size="md" />
      <Spinner variant="bar" size="lg" />
    </div>
  ),
};

export const SpinnerCircle: Story = {
  name: "Spinner Circle",
  render: () => (
    <div className="flex items-center gap-8">
      <Spinner variant="circle" size="sm" />
      <Spinner variant="circle" size="md" />
      <Spinner variant="circle" size="lg" />
    </div>
  ),
};

export const MultipleSpinner: Story = {
  name: "Multiple Spinner",
  render: () => {
    const [active, setActive] = useState<Record<number, boolean>>({ 1: true, 2: true });
    const toggle = (id: number) => setActive(prev => ({ ...prev, [id]: !prev[id] }));
    return (
      <div className="flex flex-col gap-6">
        <div className="flex gap-3">
          {[1, 2, 3, 4].map(id => (
            <Button
              key={id}
              variant={active[id] ? "primary" : "outline"}
              size="sm"
              onClick={() => toggle(id)}
            >
              Toggle {id}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-8 h-10">
          {[1, 2, 3, 4].map(id =>
            active[id] ? (
              <Spinner key={id} variant="bar" size="md" label={`Loading ${id}`} />
            ) : null
          )}
        </div>
      </div>
    );
  },
};

/* ── Additional lyra stories ── */

export const OnDarkBackground: Story = {
  name: "On Dark Background",
  parameters: { backgrounds: { default: "lyra-shell" } },
  render: () => (
    <div className="flex items-center gap-8 p-6 rounded-lyra-md bg-lyra-bg-surface-inverse">
      <Spinner variant="bar"    color="inverse" size="md" />
      <Spinner variant="circle" color="inverse" size="md" />
    </div>
  ),
};

export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-col gap-6">
      {(["sm", "md", "lg"] as const).map(size => (
        <div key={size} className="flex items-center gap-8">
          <span className="lyra-body-sm text-lyra-fg-secondary w-6">{size}</span>
          <Spinner variant="bar"    size={size} />
          <Spinner variant="circle" size={size} />
        </div>
      ))}
    </div>
  ),
};
