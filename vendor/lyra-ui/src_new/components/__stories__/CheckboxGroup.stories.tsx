import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CheckboxGroup } from "../checkbox-group";

const meta: Meta<typeof CheckboxGroup> = {
  title: "Atoms/Checkbox Group",
  component: CheckboxGroup,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
};

export default meta;
type Story = StoryObj<typeof CheckboxGroup>;

const baseOptions = [
  { value: "option-1", label: "Checkbox label" },
  { value: "option-2", label: "Checkbox label" },
  { value: "option-3", label: "Checkbox label" },
];

/* ── SOL-matched stories ── */

export const GroupCheckbox: Story = {
  name: "Group Checkbox",
  render: () => (
    <CheckboxGroup
      label="Input Label"
      options={baseOptions}
    />
  ),
};

export const GroupSelectedCheckbox: Story = {
  name: "Group Selected Checkbox",
  render: () => (
    <CheckboxGroup
      label="Input Label"
      options={baseOptions}
      defaultValues={["option-1", "option-3"]}
    />
  ),
};

export const GroupReadonlyCheckbox: Story = {
  name: "Group Readonly Checkbox",
  render: () => (
    <CheckboxGroup
      label="Input Label"
      options={baseOptions}
      defaultValues={["option-1"]}
      readonly
      labelHelpText="These values cannot be changed."
    />
  ),
};

export const GroupDisabledCheckbox: Story = {
  name: "Group Disabled Checkbox",
  render: () => (
    <CheckboxGroup
      label="Input Label"
      options={baseOptions}
      defaultValues={["option-2"]}
      disabled
    />
  ),
};

export const GroupRequiredCheckbox: Story = {
  name: "Group Required Checkbox",
  render: () => {
    const [values, setValues] = useState<string[]>([]);
    const showError = values.length === 0;
    return (
      <CheckboxGroup
        label="Input Label"
        options={baseOptions}
        values={values}
        onChange={setValues}
        required
        error={showError ? "At least one option is required" : undefined}
      />
    );
  },
};

/* ── Additional lyra stories ── */

export const CheckboxGroupWithOptions: Story = {
  name: "Checkbox Group With Options",
  render: () => (
    <CheckboxGroup
      label="Desktop Types"
      labelHelpText="Select all desktop types that apply to this role."
      required
      options={[
        { value: "back-office",      label: "Back Office" },
        { value: "knowledge-worker", label: "Knowledge Worker" },
        { value: "bpo",              label: "BPO" },
        { value: "collections",      label: "Collections" },
        { value: "retail",           label: "Retail Agents" },
      ]}
      defaultValues={["back-office"]}
    />
  ),
};

export const HorizontalGroup: Story = {
  name: "Horizontal Group",
  render: () => (
    <CheckboxGroup
      label="Notifications"
      options={[
        { value: "email", label: "Email" },
        { value: "sms",   label: "SMS" },
        { value: "push",  label: "Push" },
      ]}
      direction="horizontal"
      defaultValues={["email"]}
    />
  ),
};

export const AllStates: Story = {
  name: "All States",
  render: () => (
    <div className="flex flex-col gap-8">
      <CheckboxGroup
        label="Default"
        options={baseOptions}
      />
      <CheckboxGroup
        label="With Selection"
        options={baseOptions}
        defaultValues={["option-1", "option-2"]}
      />
      <CheckboxGroup
        label="Required"
        options={baseOptions}
        required
      />
      <CheckboxGroup
        label="Readonly"
        options={baseOptions}
        defaultValues={["option-2"]}
        readonly
        labelHelpText="These values cannot be changed."
      />
      <CheckboxGroup
        label="Disabled"
        options={baseOptions}
        defaultValues={["option-1"]}
        disabled
      />
      <CheckboxGroup
        label="Error"
        options={baseOptions}
        error="At least one option is required"
      />
    </div>
  ),
};
