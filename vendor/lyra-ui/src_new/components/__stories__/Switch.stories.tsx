import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "../switch";

const meta: Meta<typeof Switch> = {
  title: "Atoms/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    checked: {
      control: "select",
      options: [true, false, "indeterminate", "checked"],
    },
    disabled: { control: "boolean" },
    size: { control: "radio", options: ["lg", "sm"] },
    label: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

/* ── Interactive (playground) ── */

function InteractiveDemo() {
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <Switch checked={checked} onCheckedChange={setChecked} label="Switch Label" size="lg" />
      <Switch checked={checked} onCheckedChange={setChecked} label="Switch Label" size="sm" />
    </div>
  );
}

export const Interactive: Story = {
  name: "Interactive",
  render: () => <InteractiveDemo />,
};

/* ── All States — Large ── */

function AllStatesRow({ size }: { size: "lg" | "sm" }) {
  return (
    <div className="grid grid-cols-2 gap-x-12 gap-y-4">
      {/* On */}
      <Switch checked={true} size={size} label="Switch Label" />
      <div data-theme="dark" className="bg-lyra-bg-surface-base rounded-lyra-md p-3">
        <Switch checked={true} size={size} label="Switch Label" />
      </div>

      {/* On — simulated hover (static preview) */}
      <Switch checked={true} size={size} label="Switch Label" />
      <div data-theme="dark" className="bg-lyra-bg-surface-base rounded-lyra-md p-3">
        <Switch checked={true} size={size} label="Switch Label" />
      </div>

      {/* On — simulated pressed (static preview) */}
      <Switch checked={true} size={size} label="Switch Label" />
      <div data-theme="dark" className="bg-lyra-bg-surface-base rounded-lyra-md p-3">
        <Switch checked={true} size={size} label="Switch Label" />
      </div>

      {/* Off */}
      <Switch checked={false} size={size} label="Switch Label" />
      <div data-theme="dark" className="bg-lyra-bg-surface-base rounded-lyra-md p-3">
        <Switch checked={false} size={size} label="Switch Label" />
      </div>

      {/* Off — hover */}
      <Switch checked={false} size={size} label="Switch Label" />
      <div data-theme="dark" className="bg-lyra-bg-surface-base rounded-lyra-md p-3">
        <Switch checked={false} size={size} label="Switch Label" />
      </div>

      {/* Off — pressed */}
      <Switch checked={false} size={size} label="Switch Label" />
      <div data-theme="dark" className="bg-lyra-bg-surface-base rounded-lyra-md p-3">
        <Switch checked={false} size={size} label="Switch Label" />
      </div>

      {/* Disabled off */}
      <Switch checked={false} disabled size={size} label="Switch Label" />
      <div data-theme="dark" className="bg-lyra-bg-surface-base rounded-lyra-md p-3">
        <Switch checked={false} disabled size={size} label="Switch Label" />
      </div>

      {/* Disabled on */}
      <Switch checked={true} disabled size={size} label="Switch Label" />
      <div data-theme="dark" className="bg-lyra-bg-surface-base rounded-lyra-md p-3">
        <Switch checked={true} disabled size={size} label="Switch Label" />
      </div>

      {/* Indeterminate */}
      <Switch checked="indeterminate" size={size} label="Switch Label" />
      <div data-theme="dark" className="bg-lyra-bg-surface-base rounded-lyra-md p-3">
        <Switch checked="indeterminate" size={size} label="Switch Label" />
      </div>

      {/* Checked (off with checkmark) */}
      <Switch checked="checked" size={size} label="Switch Label" />
      <div data-theme="dark" className="bg-lyra-bg-surface-base rounded-lyra-md p-3">
        <Switch checked="checked" size={size} label="Switch Label" />
      </div>
    </div>
  );
}

export const Large: Story = {
  name: "Large — All States",
  render: () => (
    <div>
      <div className="flex gap-12 mb-3">
        <span className="lyra-body-sm text-lyra-fg-secondary font-medium w-[200px]">Light</span>
        <span className="lyra-body-sm text-lyra-fg-secondary font-medium">Dark</span>
      </div>
      <AllStatesRow size="lg" />
    </div>
  ),
};

export const Small: Story = {
  name: "Small — All States",
  render: () => (
    <div>
      <div className="flex gap-12 mb-3">
        <span className="lyra-body-sm text-lyra-fg-secondary font-medium w-[200px]">Light</span>
        <span className="lyra-body-sm text-lyra-fg-secondary font-medium">Dark</span>
      </div>
      <AllStatesRow size="sm" />
    </div>
  ),
};

export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-col gap-8">
      {(["lg", "sm"] as const).map((size) => (
        <div key={size}>
          <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-3">
            Size: {size === "lg" ? "Large" : "Small"}
          </p>
          <div className="grid grid-cols-4 gap-x-8 gap-y-4">
            <div className="flex flex-col items-start gap-2">
              <span className="lyra-body-sm text-lyra-fg-secondary">Checked</span>
              <Switch checked={true} size={size} label="Switch Label" />
            </div>
            <div className="flex flex-col items-start gap-2">
              <span className="lyra-body-sm text-lyra-fg-secondary">Unchecked</span>
              <Switch checked={false} size={size} label="Switch Label" />
            </div>
            <div className="flex flex-col items-start gap-2">
              <span className="lyra-body-sm text-lyra-fg-secondary">Indeterminate</span>
              <Switch checked="indeterminate" size={size} label="Switch Label" />
            </div>
            <div className="flex flex-col items-start gap-2">
              <span className="lyra-body-sm text-lyra-fg-secondary">Checked variant</span>
              <Switch checked="checked" size={size} label="Switch Label" />
            </div>
            <div className="flex flex-col items-start gap-2">
              <span className="lyra-body-sm text-lyra-fg-secondary">Disabled off</span>
              <Switch checked={false} disabled size={size} label="Switch Label" />
            </div>
            <div className="flex flex-col items-start gap-2">
              <span className="lyra-body-sm text-lyra-fg-secondary">Disabled on</span>
              <Switch checked={true} disabled size={size} label="Switch Label" />
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
};
