import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AgentNotifications, type AgentNotification } from "../agent-notifications";

const meta: Meta<typeof AgentNotifications> = {
  title: "UI/AgentNotifications",
  component: AgentNotifications,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", backgrounds: { default: "lyra-shell" } },
};
export default meta;
type Story = StoryObj<typeof AgentNotifications>;

const SAMPLE: AgentNotification[] = [
  { id: "1", type: "new-case",    title: "New Case",     subtitle: "Noah Patel",    timestamp: "51m ago",  read: false },
  { id: "2", type: "new-chat",    title: "New Chat",     subtitle: "Sarah Miller",  timestamp: "56m ago",  read: false },
  { id: "3", type: "escalation",  title: "Escalation",   subtitle: "Lauren Kim",    timestamp: "1h ago",   read: false },
  { id: "4", type: "new-case",    title: "New Case",     subtitle: "Ethan Zhang",   timestamp: "1h ago",   read: true  },
  { id: "5", type: "new-chat",    title: "New Chat",     subtitle: "Olivia Reed",   timestamp: "1h ago",   read: true  },
  { id: "6", type: "missed-call", title: "Missed Call",  subtitle: "David Brown",   timestamp: "1h ago",   read: false },
  { id: "7", type: "new-case",    title: "New Case",     subtitle: "Mia Torres",    timestamp: "2h ago",   read: true  },
  { id: "8", type: "escalation",  title: "Escalation",   subtitle: "James Wilson",  timestamp: "2h ago",   read: true  },
];

export const Default: Story = {
  name: "Default",
  render: () => {
    const [items, setItems] = useState<AgentNotification[]>(SAMPLE);
    return (
      <div className="relative w-full h-screen">
      <div className="absolute top-4 left-4">
      <AgentNotifications
        notifications={items}
        onMarkAllRead={() => setItems((prev) => prev.map((i) => ({ ...i, read: true })))}
        onClearAll={() => setItems([])}
        onClose={() => alert("Close")}
        onDismiss={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        onNotificationClick={(n) => setItems((prev) => prev.map((i) => i.id === n.id ? { ...i, read: true } : i))}
      />
      </div>
      </div>
    );
  },
};

export const Empty: Story = {
  name: "Empty state",
  render: () => (
    <AgentNotifications notifications={[]} onClose={() => {}} />
  ),
};
