import type { Meta, StoryObj } from "@storybook/react";
import { useState, useEffect } from "react";
import { Progress } from "../progress";

const meta: Meta<typeof Progress> = {
  title: "Atoms/Progress",
  component: Progress,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  argTypes: {
    value:     { control: { type: "range", min: 0, max: 100, step: 1 } },
    variant:   { control: "select", options: ["default", "success", "warning", "critical", "neutral"] },
    size:      { control: "select", options: ["sm", "md", "lg"] },
    showLabel: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

/* ── Interactive ── */
export const Default: Story = {
  args: { value: 60, variant: "default", size: "md", showLabel: true },
};

/* ── All variants ── */
export const Variants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-col gap-5 w-full max-w-md">
      {(["default", "success", "warning", "critical", "neutral"] as const).map((v) => (
        <div key={v} className="flex flex-col gap-1">
          <span className="lyra-label text-lyra-fg-secondary capitalize">{v}</span>
          <Progress value={65} variant={v} showLabel />
        </div>
      ))}
    </div>
  ),
};

/* ── Sizes ── */
export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <div className="flex flex-col gap-5 w-full max-w-md">
      {(["sm", "md", "lg"] as const).map((s) => (
        <div key={s} className="flex flex-col gap-1">
          <span className="lyra-label text-lyra-fg-secondary">{s}</span>
          <Progress value={70} size={s} />
        </div>
      ))}
    </div>
  ),
};

/* ── States ── */
export const States: Story = {
  name: "States",
  render: () => (
    <div className="flex flex-col gap-5 w-full max-w-md">
      <div className="flex flex-col gap-1">
        <span className="lyra-label text-lyra-fg-secondary">Empty (0%)</span>
        <Progress value={0} showLabel />
      </div>
      <div className="flex flex-col gap-1">
        <span className="lyra-label text-lyra-fg-secondary">In progress (45%)</span>
        <Progress value={45} showLabel />
      </div>
      <div className="flex flex-col gap-1">
        <span className="lyra-label text-lyra-fg-secondary">Complete (100%)</span>
        <Progress value={100} variant="success" showLabel />
      </div>
      <div className="flex flex-col gap-1">
        <span className="lyra-label text-lyra-fg-secondary">Warning threshold (80%)</span>
        <Progress value={80} variant="warning" showLabel />
      </div>
      <div className="flex flex-col gap-1">
        <span className="lyra-label text-lyra-fg-secondary">Critical (95%)</span>
        <Progress value={95} variant="critical" showLabel />
      </div>
    </div>
  ),
};

/* ── Animated ── */
export const Animated: Story = {
  name: "Animated",
  render: () => {
    const [value, setValue] = useState(0);
    useEffect(() => {
      const id = setInterval(() => {
        setValue((v) => {
          if (v >= 100) { clearInterval(id); return 100; }
          return v + 2;
        });
      }, 80);
      return () => clearInterval(id);
    }, []);
    const variant = value >= 100 ? "success" : value >= 80 ? "warning" : "default";
    return (
      <div className="flex flex-col gap-2 w-full max-w-md">
        <span className="lyra-label text-lyra-fg-secondary">Loading…</span>
        <Progress value={value} variant={variant} size="md" showLabel />
      </div>
    );
  },
};

/* ── With custom label ── */
export const CustomLabel: Story = {
  name: "Custom Label",
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <Progress value={30} showLabel label="3 / 10 steps" />
      <Progress value={48} showLabel label="2,400 / 5,000 calls" />
    </div>
  ),
};
