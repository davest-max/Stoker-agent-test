import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "../checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Atoms/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    checked: {
      control: "select",
      options: [true, false, "indeterminate"],
    },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

/* ── Individual states ── */

export const Default: Story = {
  render: () => (
    <label className="flex items-center gap-2 cursor-pointer">
      <Checkbox />
      <span className="lyra-body-md text-lyra-fg-default">Checkbox label</span>
    </label>
  ),
};

export const Checked: Story = {
  render: () => (
    <label className="flex items-center gap-2 cursor-pointer">
      <Checkbox defaultChecked />
      <span className="lyra-body-md text-lyra-fg-default">Checkbox label</span>
    </label>
  ),
};

export const Indeterminate: Story = {
  render: () => (
    <label className="flex items-center gap-2 cursor-pointer">
      <Checkbox checked="indeterminate" />
      <span className="lyra-body-md text-lyra-fg-default">Checkbox label</span>
    </label>
  ),
};

export const Required: Story = {
  name: "Required",
  render: () => (
    <div className="flex flex-col gap-3">
      <Checkbox label="Accept terms and conditions" required />
      <Checkbox label="Subscribe to newsletter" required checked />
    </div>
  ),
};

export const Readonly: Story = {
  name: "Readonly",
  render: () => (
    <div className="flex flex-col gap-3">
      <Checkbox
        label="Unchecked (read-only)"
        readonly
        labelHelpText="This value cannot be changed."
      />
      <Checkbox
        label="Checked (read-only)"
        readonly
        checked
        labelHelpText="This value cannot be changed."
      />
      <Checkbox
        label="Indeterminate (read-only)"
        readonly
        checked="indeterminate"
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <label className="flex items-center gap-2 cursor-not-allowed">
      <Checkbox disabled />
      <span className="lyra-body-md text-lyra-fg-disabled">Checkbox label</span>
    </label>
  ),
};

export const DisabledChecked: Story = {
  render: () => (
    <label className="flex items-center gap-2 cursor-not-allowed">
      <Checkbox disabled checked />
      <span className="lyra-body-md text-lyra-fg-disabled">Checkbox label</span>
    </label>
  ),
};

export const DisabledIndeterminate: Story = {
  render: () => (
    <label className="flex items-center gap-2 cursor-not-allowed">
      <Checkbox disabled checked="indeterminate" />
      <span className="lyra-body-md text-lyra-fg-disabled">Checkbox label</span>
    </label>
  ),
};

/* ── State Matrix (matches Figma) ── */

export const StateMatrix: Story = {
  name: "State Matrix",
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-4">
          All States (hover and click to see interactive states)
        </h3>
        <div className="grid grid-cols-4 gap-x-8 gap-y-4 items-center">
          {/* Headers */}
          <span className="lyra-body-sm text-lyra-fg-secondary">State</span>
          <span className="lyra-body-sm text-lyra-fg-secondary">Unchecked</span>
          <span className="lyra-body-sm text-lyra-fg-secondary">Checked</span>
          <span className="lyra-body-sm text-lyra-fg-secondary">Indeterminate</span>

          {/* Default */}
          <span className="lyra-body-sm text-lyra-fg-secondary">Default</span>
          <div className="flex items-center gap-2">
            <Checkbox id="d-unc" />
            <label htmlFor="d-unc" className="lyra-body-md text-lyra-fg-default">Checkbox label</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="d-chk" defaultChecked />
            <label htmlFor="d-chk" className="lyra-body-md text-lyra-fg-default">Checkbox label</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="d-ind" checked="indeterminate" />
            <label htmlFor="d-ind" className="lyra-body-md text-lyra-fg-default">Checkbox label</label>
          </div>

          {/* Disabled */}
          <span className="lyra-body-sm text-lyra-fg-secondary">Disabled</span>
          <div className="flex items-center gap-2">
            <Checkbox id="dis-unc" disabled />
            <label htmlFor="dis-unc" className="lyra-body-md text-lyra-fg-disabled">Checkbox label</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="dis-chk" disabled checked />
            <label htmlFor="dis-chk" className="lyra-body-md text-lyra-fg-disabled">Checkbox label</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="dis-ind" disabled checked="indeterminate" />
            <label htmlFor="dis-ind" className="lyra-body-md text-lyra-fg-disabled">Checkbox label</label>
          </div>
        </div>
      </div>
    </div>
  ),
};

/* ── Interactive Demo ── */

export const Interactive: Story = {
  name: "Interactive",
  render: () => {
    const [items, setItems] = useState([
      { id: "a", label: "Option A", checked: false },
      { id: "b", label: "Option B", checked: true },
      { id: "c", label: "Option C", checked: false },
    ]);

    const allChecked = items.every((i) => i.checked);
    const someChecked = !allChecked && items.some((i) => i.checked);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={allChecked ? true : someChecked ? "indeterminate" : false}
            onCheckedChange={(checked) =>
              setItems((prev) => prev.map((i) => ({ ...i, checked: !!checked })))
            }
          />
          <label htmlFor="select-all" className="lyra-body-md-emphasis text-lyra-fg-default">
            Select all
          </label>
        </div>
        <div className="ml-6 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <Checkbox
                id={item.id}
                checked={item.checked}
                onCheckedChange={(checked) =>
                  setItems((prev) =>
                    prev.map((i) =>
                      i.id === item.id ? { ...i, checked: !!checked } : i
                    )
                  )
                }
              />
              <label htmlFor={item.id} className="lyra-body-md text-lyra-fg-default">
                {item.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// Group stories moved to Atoms/Checkbox Group

/* ── With Secondary Text ── */

export const WithSecondaryText: Story = {
  name: "With Secondary Text",
  render: () => (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <Checkbox id="sec-1" className="mt-0.5" />
        <label htmlFor="sec-1">
          <span className="lyra-body-md text-lyra-fg-default block">Checkbox label</span>
        </label>
      </div>
      <div className="flex items-start gap-2">
        <Checkbox id="sec-2" className="mt-0.5" />
        <label htmlFor="sec-2">
          <span className="lyra-body-md text-lyra-fg-default block">Checkbox label</span>
          <span className="lyra-body-sm text-lyra-fg-secondary block">Secondary Text</span>
        </label>
      </div>
    </div>
  ),
};
