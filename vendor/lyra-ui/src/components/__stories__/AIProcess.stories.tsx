import type { Meta, StoryObj } from "@storybook/react";
import { AIProcess } from "../ai-process";

const meta: Meta<typeof AIProcess> = {
  title: "Atoms/AIProcess",
  component: AIProcess,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof AIProcess>;

export const AllDone: Story = {
  name: "All steps done",
  render: () => (
    <div className="max-w-md">
      <AIProcess
        defaultExpanded
        steps={[
          { id: "1", label: "Reviewing account history",          status: "done" },
          { id: "2", label: "Checking recent login events",        status: "done" },
          { id: "3", label: "Verifying 2FA configuration",         status: "done" },
          { id: "4", label: "Identifying likely root cause",        status: "done" },
          { id: "5", label: "Generating recommended action",        status: "done" },
        ]}
      />
    </div>
  ),
};

export const InProgress: Story = {
  name: "In progress",
  render: () => (
    <div className="max-w-md">
      <AIProcess
        defaultExpanded
        steps={[
          { id: "1", label: "Reviewing account history",          status: "done" },
          { id: "2", label: "Checking recent login events",        status: "done" },
          { id: "3", label: "Verifying 2FA configuration",         status: "active", description: "Analysing device fingerprint…" },
          { id: "4", label: "Identifying likely root cause",        status: "pending" },
          { id: "5", label: "Generating recommended action",        status: "pending" },
        ]}
      />
    </div>
  ),
};

export const WithError: Story = {
  name: "With error",
  render: () => (
    <div className="max-w-md">
      <AIProcess
        defaultExpanded
        steps={[
          { id: "1", label: "Reviewing account history",          status: "done" },
          { id: "2", label: "Checking recent login events",        status: "error", description: "Unable to retrieve login logs — service timeout" },
          { id: "3", label: "Verifying 2FA configuration",         status: "pending" },
        ]}
      />
    </div>
  ),
};

export const WithDescriptions: Story = {
  name: "With step descriptions",
  render: () => (
    <div className="max-w-md">
      <AIProcess
        defaultExpanded
        steps={[
          { id: "1", label: "Analysing conversation sentiment",    status: "done",   description: "3 frustrated signals detected" },
          { id: "2", label: "Pulling CRM profile",                  status: "done",   description: "Customer since 2019 · Tier: Premium" },
          { id: "3", label: "Checking SLA status",                  status: "active", description: "Billing queue — projected breach in ~8 min" },
          { id: "4", label: "Drafting escalation recommendation",   status: "pending" },
        ]}
      />
    </div>
  ),
};

export const Collapsed: Story = {
  name: "Collapsed (default)",
  render: () => (
    <div className="max-w-md">
      <AIProcess
        steps={[
          { id: "1", label: "Step one",  status: "done" },
          { id: "2", label: "Step two",  status: "done" },
          { id: "3", label: "Step three", status: "active" },
        ]}
      />
    </div>
  ),
};
