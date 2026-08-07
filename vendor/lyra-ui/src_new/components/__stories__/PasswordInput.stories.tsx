import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PasswordInput, ChangePassword } from "../password-input";

const meta: Meta = {
  title: "Atoms/PasswordInput",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  name: "Default",
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div className="w-80">
        <PasswordInput label="Password" value={value} onChange={setValue} />
      </div>
    );
  },
};

export const WithRequirements: Story = {
  name: "With requirements tooltip",
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div className="w-80">
        <PasswordInput
          label="New password"
          value={value}
          onChange={setValue}
          showRequirements
          required
        />
      </div>
    );
  },
};

export const WithError: Story = {
  name: "Error",
  render: () => (
    <div className="w-80">
      <PasswordInput
        label="Password"
        value="short"
        onChange={() => {}}
        error="Password does not meet requirements"
      />
    </div>
  ),
};

export const States: Story = {
  name: "States",
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <PasswordInput label="Default"   value="" onChange={() => {}} />
      <PasswordInput label="With value" value="mypassword123" onChange={() => {}} />
      <PasswordInput label="Required"  value="" onChange={() => {}} required />
      <PasswordInput label="Disabled"  value="hidden" onChange={() => {}} disabled />
      <PasswordInput label="Read only" value="readonly-pass" onChange={() => {}} readonly />
      <PasswordInput label="Error"     value="bad" onChange={() => {}}
        error="Password does not meet requirements" />
    </div>
  ),
};

export const ChangePasswordForm: Story = {
  name: "Change Password",
  render: () => (
    <div className="w-80">
      <ChangePassword
        onSubmit={({ current, next }) =>
          alert(`Current: ${current}\nNew: ${next}`)
        }
      />
    </div>
  ),
};
