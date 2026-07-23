import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "../label";
import { Input } from "../input";
import { Select } from "../select";

const meta = {
  title: "Atoms/Label",
  component: Label,
  tags: ["autodocs"],
  parameters: { layout: "centered", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    readonly: { control: "boolean" },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── SOL-matched stories ── */

export const BasicLabel: Story = {
  name: "Basic Label",
  args: {
    label: "Field label",
    labelFor: "basic-input",
  },
  render: (args) => (
    <div className="flex flex-col gap-1 w-72">
      <Label {...args} />
      <Input id="basic-input" placeholder="Enter value..." />
    </div>
  ),
};

export const LabelWithHelpText: Story = {
  name: "Label With Help Text",
  args: {
    label: "API Key",
    labelFor: "help-input",
    labelHelpText: "Your API key can be found in your account settings under Security.",
  },
  render: (args) => (
    <div className="flex flex-col gap-1 w-72">
      <Label {...args} />
      <Input id="help-input" placeholder="sk-••••••••" />
    </div>
  ),
};

export const RequiredLabel: Story = {
  name: "Required Label",
  args: {
    label: "Email address",
    labelFor: "required-input",
    required: true,
  },
  render: (args) => (
    <div className="flex flex-col gap-1 w-72">
      <Label {...args} />
      <Input id="required-input" placeholder="you@example.com" required />
    </div>
  ),
};

export const DisabledLabel: Story = {
  name: "Disabled Label",
  args: {
    label: "Username",
    labelFor: "disabled-input",
    required: true,
    labelHelpText: "This field is currently unavailable.",
    disabled: true,
  },
  render: (args) => (
    <div className="flex flex-col gap-1 w-72">
      <Label {...args} />
      <Input id="disabled-input" placeholder="Enter username" disabled />
    </div>
  ),
};

export const ReadonlyLabel: Story = {
  name: "Readonly Label",
  args: {
    label: "Account ID",
    labelFor: "readonly-input",
    required: true,
    labelHelpText: "Your account ID cannot be changed.",
    readonly: true,
  },
  render: (args) => (
    <div className="flex flex-col gap-1 w-72">
      <Label {...args} />
      <Input id="readonly-input" value="acc-00123" readonly />
    </div>
  ),
};

export const Default: Story = {
  args: {
    label: "Default Label",
    labelFor: "default-input",
    required: true,
    labelHelpText: "Helpful context about this field.",
  },
  render: (args) => (
    <div className="flex flex-col gap-1 w-72">
      <Label {...args} />
      <Input id="default-input" placeholder="Enter value..." />
    </div>
  ),
};

/* ── Lyra-specific: Label with Select ── */

export const WithSelect: Story = {
  name: "With Select",
  render: () => (
    <div className="flex flex-col gap-4 w-72">
      <Select
        label="Desktop type"
        labelHelpText="Choose the desktop layout for this role."
        required
        placeholder="Select a type..."
        options={[
          { value: "back-office", label: "Back office" },
          { value: "knowledge-worker", label: "Knowledge Worker" },
          { value: "bpo", label: "BPO" },
        ]}
      />
      <Select
        label="Status"
        disabled
        placeholder="Select status..."
        options={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
      />
      <Select
        label="Region"
        readonly
        placeholder="Select region..."
        options={[
          { value: "na1", label: "North America 1" },
          { value: "eu1", label: "Europe 1" },
        ]}
      />
    </div>
  ),
};

/* ── All states overview ── */

export const AllStates: Story = {
  name: "All States",
  render: () => (
    <div className="flex flex-col gap-5 w-80">
      {/* Default */}
      <div className="flex flex-col gap-1">
        <Label label="Default" labelFor="s-default" />
        <Input id="s-default" placeholder="Default state" />
      </div>

      {/* With help text */}
      <div className="flex flex-col gap-1">
        <Label
          label="With help text"
          labelFor="s-help"
          labelHelpText="Additional context about this field."
        />
        <Input id="s-help" placeholder="With help text" />
      </div>

      {/* Required */}
      <div className="flex flex-col gap-1">
        <Label label="Required" labelFor="s-required" required />
        <Input id="s-required" placeholder="Required field" required />
      </div>

      {/* Required + help */}
      <div className="flex flex-col gap-1">
        <Label
          label="Required with help"
          labelFor="s-req-help"
          required
          labelHelpText="This field is required and has additional context."
        />
        <Input id="s-req-help" placeholder="Required with help" required />
      </div>

      {/* Disabled */}
      <div className="flex flex-col gap-1">
        <Label label="Disabled" labelFor="s-disabled" required disabled />
        <Input id="s-disabled" placeholder="Disabled" disabled />
      </div>

      {/* Readonly */}
      <div className="flex flex-col gap-1">
        <Label
          label="Readonly"
          labelFor="s-readonly"
          required
          labelHelpText="This value cannot be edited."
          readonly
        />
        <Input id="s-readonly" value="Read-only value" readonly />
      </div>
    </div>
  ),
};
