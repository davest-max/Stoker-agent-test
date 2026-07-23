import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { RadioButtonGroup } from "../radio-button-group";

const meta: Meta<typeof RadioButtonGroup> = {
  title: "Atoms/Radio Button Group",
  component: RadioButtonGroup,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
};

export default meta;
type Story = StoryObj<typeof RadioButtonGroup>;

const baseOptions = [
  { value: "option1", label: "Radio label" },
  { value: "option2", label: "Radio label" },
  { value: "option3", label: "Radio label" },
];

/* ── SOL-matched stories ── */

export const BasicRadioButtonGroup: Story = {
  name: "Basic Radio Button Group",
  render: () => (
    <RadioButtonGroup
      label="Input Label"
      name="basic"
      options={baseOptions}
      defaultValue="option1"
    />
  ),
};

export const FullyDisabledGroup: Story = {
  name: "Fully Disabled Group",
  render: () => (
    <RadioButtonGroup
      label="Input Label"
      name="fully-disabled"
      options={baseOptions}
      defaultValue="option1"
      disabled
    />
  ),
};

export const SelectivelyDisabledItems: Story = {
  name: "Selectively Disabled Items",
  render: () => (
    <RadioButtonGroup
      label="Input Label"
      name="selective"
      options={[
        { value: "option1", label: "Radio label" },
        { value: "option2", label: "Radio label (disabled)", disabled: true },
        { value: "option3", label: "Radio label" },
        { value: "option4", label: "Radio label (disabled)", disabled: true },
      ]}
      defaultValue="option1"
    />
  ),
};

export const VerticalRadioButton: Story = {
  name: "Vertical Radio Button",
  render: () => (
    <RadioButtonGroup
      label="Input Label"
      name="vertical"
      options={baseOptions}
      orientation="vertical"
      defaultValue="option1"
    />
  ),
};

export const HorizontalRadioButton: Story = {
  name: "Horizontal Radio Button",
  render: () => (
    <RadioButtonGroup
      label="Input Label"
      name="horizontal"
      options={baseOptions}
      orientation="horizontal"
      defaultValue="option1"
    />
  ),
};

export const WithErrorMessage: Story = {
  name: "With Error Message",
  render: () => {
    const [value, setValue] = useState("");
    return (
      <RadioButtonGroup
        label="Input Label"
        name="with-error"
        options={baseOptions}
        value={value}
        onValueChange={setValue}
        error={!value ? "Please select an option" : undefined}
      />
    );
  },
};

export const HorizontalResponsive: Story = {
  name: "Horizontal Responsive",
  render: () => (
    <div className="max-w-sm">
      <RadioButtonGroup
        label="Input Label"
        name="responsive"
        options={[
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
          { value: "option3", label: "Option 3" },
          { value: "option4", label: "Option 4" },
        ]}
        orientation="horizontal"
        defaultValue="option1"
        className="[&_.flex-row]:flex-wrap"
      />
    </div>
  ),
};

/* ── Additional lyra stories ── */

export const ReadonlyGroup: Story = {
  name: "Readonly Group",
  render: () => (
    <RadioButtonGroup
      label="Input Label"
      name="readonly"
      options={baseOptions}
      defaultValue="option2"
      readonly
      labelHelpText="This selection cannot be changed."
    />
  ),
};

export const RequiredGroup: Story = {
  name: "Required Group",
  render: () => (
    <RadioButtonGroup
      label="Input Label"
      name="required"
      options={baseOptions}
      required
    />
  ),
};

export const AllStates: Story = {
  name: "All States",
  render: () => (
    <div className="flex flex-col gap-8">
      <RadioButtonGroup label="Default" name="s-default" options={baseOptions} />
      <RadioButtonGroup label="Selected" name="s-selected" options={baseOptions} defaultValue="option2" />
      <RadioButtonGroup label="Required" name="s-required" options={baseOptions} required />
      <RadioButtonGroup
        label="Readonly"
        name="s-readonly"
        options={baseOptions}
        defaultValue="option1"
        readonly
        labelHelpText="Cannot be changed."
      />
      <RadioButtonGroup label="Disabled" name="s-disabled" options={baseOptions} defaultValue="option1" disabled />
      <RadioButtonGroup
        label="Error"
        name="s-error"
        options={baseOptions}
        error="Please select an option"
      />
    </div>
  ),
};
