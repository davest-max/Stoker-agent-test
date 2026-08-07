import type { Meta, StoryObj } from "@storybook/react";
import { AgentWelcomeMessage } from "../agent-welcome-message";

const meta = {
  title: "UI/AgentWelcomeMessage",
  component: AgentWelcomeMessage,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
} satisfies Meta<typeof AgentWelcomeMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Default ── */

export const Default: Story = {
  render: () => (
    <div className="flex justify-center">
      <AgentWelcomeMessage title="Good morning, John Smith" lastLogin="Today at 8:42 AM">
        <p className="lyra-body-md text-lyra-fg-default">
          Your current skills are Outbound Collections, English and Escalations. 8 teammates are
          currently online.
        </p>
      </AgentWelcomeMessage>
    </div>
  ),
};

/* ── No last login / no info box ── */

export const MinimalContent: Story = {
  name: "No Last Login / No Info Box",
  render: () => (
    <div className="flex justify-center">
      <AgentWelcomeMessage title="Good morning, John Smith" />
    </div>
  ),
};

/* ── Custom button labels ── */

export const CustomActions: Story = {
  name: "Custom Button Labels",
  render: () => (
    <div className="flex justify-center">
      <AgentWelcomeMessage
        title="Good afternoon, John Smith"
        lastLogin="Yesterday at 5:12 PM"
        primaryLabel="Start Shift"
        secondaryLabel="Review Schedule"
      >
        <p className="lyra-body-md text-lyra-fg-default">3 escalations are waiting in your queue.</p>
      </AgentWelcomeMessage>
    </div>
  ),
};
