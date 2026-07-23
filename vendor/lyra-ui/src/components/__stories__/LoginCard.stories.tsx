import type { Meta, StoryObj } from "@storybook/react";
import { LoginCard } from "../login-card";

const meta = {
  title: "UI/LoginCard",
  component: LoginCard,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    defaultPhoneSetup: {
      control: "select",
      options: ["soft-phone", "phone-number", "work-station"],
    },
    defaultLaunching: { control: "boolean" },
  },
} satisfies Meta<typeof LoginCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Phone setup selection ── */

export const IntegratedSoftPhone: Story = {
  name: "Phone Setup / Integrated Soft Phone",
  render: () => (
    <div className="flex justify-center">
      <LoginCard defaultPhoneSetup="soft-phone" />
    </div>
  ),
};

export const PhoneNumber: Story = {
  name: "Phone Setup / Phone Number",
  render: () => (
    <div className="flex justify-center">
      <LoginCard defaultPhoneSetup="phone-number" />
    </div>
  ),
};

export const StationId: Story = {
  name: "Phone Setup / Station ID",
  render: () => (
    <div className="flex justify-center">
      <LoginCard defaultPhoneSetup="work-station" />
    </div>
  ),
};

/* ── Launching state ── */

export const Launching: Story = {
  name: "Launching",
  render: () => (
    <div className="flex justify-center">
      <LoginCard defaultLaunching />
    </div>
  ),
};
