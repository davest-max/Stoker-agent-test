import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ToggleGroup } from "../toggle-group";
import { cn } from "../../lib/utils";

const meta: Meta<typeof ToggleGroup> = {
  title: "Atoms/Toggle Group",
  component: ToggleGroup,
  tags: ["autodocs"],
  parameters: { layout: "centered", backgrounds: { default: "lyra-shell" } },
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

const threeItems = [
  { value: "a", label: "Toggle" },
  { value: "b", label: "Toggle" },
  { value: "c", label: "Toggle" },
];

/* ── Screenshot 1 — interactive group ── */

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("a");
    return (
      <ToggleGroup
        items={threeItems}
        value={value}
        onValueChange={setValue}
      />
    );
  },
};

export const MultipleSelection: Story = {
  name: "Multiple Selection",
  render: () => {
    const [values, setValues] = useState<string[]>(["a"]);
    return (
      <ToggleGroup
        type="multiple"
        items={threeItems}
        values={values}
        onValuesChange={setValues}
      />
    );
  },
};

/* ── Screenshot 2 — all 7 base states ── */

export const AllStates: Story = {
  name: "All States",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-col gap-6 w-48">
      {/* 1. Off */}
      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">Off</span>
        <ToggleGroup items={[{ value: "x", label: "Toggle" }]} />
      </div>

      {/* 2. Disabled */}
      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">Disabled</span>
        <ToggleGroup items={[{ value: "x", label: "Toggle" }]} disabled />
      </div>

      {/* 3. Hover — static preview */}
      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">Hover</span>
        <div className="inline-flex items-center rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-base p-0.5">
          <button
            type="button"
            className="px-3 py-1.5 lyra-body-md rounded-lyra-sm text-lyra-fg-default bg-lyra-bg-surface-shell border border-lyra-border-default transition-colors"
          >
            Toggle
          </button>
        </div>
      </div>

      {/* 4. Press — static preview */}
      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">Press</span>
        <div className="inline-flex items-center rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-base p-0.5">
          <button
            type="button"
            className="px-3 py-1.5 lyra-body-md rounded-lyra-sm text-lyra-fg-default bg-lyra-bg-disabled border border-lyra-border-default transition-colors"
          >
            Toggle
          </button>
        </div>
      </div>

      {/* 5. On / Selected */}
      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">On</span>
        <ToggleGroup
          items={[{ value: "x", label: "Toggle" }]}
          value="x"
          onValueChange={() => {}}
        />
      </div>

      {/* 6. Selected Hover — static preview */}
      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">Selected Hover</span>
        <div className="inline-flex items-center rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-base p-0.5">
          <button
            type="button"
            className={cn(
              "px-3 py-1.5 lyra-body-md rounded-lyra-sm font-medium transition-colors",
              "bg-lyra-state-hover-active-subtle border border-lyra-border-active text-lyra-fg-active-strong"
            )}
          >
            Toggle
          </button>
        </div>
      </div>

      {/* 7. Selected Press — static preview */}
      <div className="flex flex-col gap-1">
        <span className="lyra-body-sm text-lyra-fg-secondary">Selected Press</span>
        <div className="inline-flex items-center rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-base p-0.5">
          <button
            type="button"
            className={cn(
              "px-3 py-1.5 lyra-body-md rounded-lyra-sm font-medium transition-colors",
              "bg-lyra-state-pressed-active-subtle border border-lyra-border-active text-lyra-fg-active-strong"
            )}
          >
            Toggle
          </button>
        </div>
      </div>
    </div>
  ),
};

export const WithDisabledItem: Story = {
  name: "With Disabled Item",
  render: () => {
    const [value, setValue] = useState("a");
    return (
      <ToggleGroup
        items={[
          { value: "a", label: "Toggle" },
          { value: "b", label: "Toggle", disabled: true },
          { value: "c", label: "Toggle" },
        ]}
        value={value}
        onValueChange={setValue}
      />
    );
  },
};

export const FullyDisabled: Story = {
  name: "Fully Disabled",
  render: () => (
    <div className="flex flex-col gap-3">
      <ToggleGroup items={threeItems} disabled />
      <ToggleGroup items={threeItems} value="b" onValueChange={() => {}} disabled />
    </div>
  ),
};
