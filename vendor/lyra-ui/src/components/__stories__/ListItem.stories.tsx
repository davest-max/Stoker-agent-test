import type { Meta, StoryObj } from "@storybook/react";
import { ListItem } from "../list-item";
import { UserPlus, MessageSquare, Bell } from "lucide-react";
import { StatusBadge } from "../status-badge";

const meta: Meta<typeof ListItem> = {
  title: "Atoms/ListItem",
  component: ListItem,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
};
export default meta;
type Story = StoryObj<typeof ListItem>;

export const Default: Story = {
  args: { title: "New Case", subtitle: "Noah Patel", meta: "51m ago" },
};

export const WithLeading: Story = {
  name: "With leading icon",
  render: () => (
    <div className="w-80 border border-lyra-border-subtle rounded-lyra-lg overflow-hidden">
      <ListItem
        leading={<div className="h-9 w-9 rounded-full bg-lyra-bg-active-subtle flex items-center justify-center text-lyra-fg-active-strong"><UserPlus className="h-4 w-4" strokeWidth={1.5} /></div>}
        title="New Case"
        subtitle="Noah Patel"
        meta="51m ago"
      />
      <ListItem
        leading={<div className="h-9 w-9 rounded-full bg-lyra-status-success-subtle flex items-center justify-center text-lyra-status-success-strong"><MessageSquare className="h-4 w-4" strokeWidth={1.5} /></div>}
        title="New Chat"
        subtitle="Sarah Miller"
        meta="56m ago"
      />
      <ListItem
        leading={<div className="h-9 w-9 rounded-full bg-lyra-bg-surface-shell flex items-center justify-center text-lyra-fg-secondary"><Bell className="h-4 w-4" strokeWidth={1.5} /></div>}
        title="System Update"
        subtitle="Maintenance window at midnight"
        meta="2h ago"
        trailing={<StatusBadge variant="info" size="sm">New</StatusBadge>}
      />
    </div>
  ),
};
