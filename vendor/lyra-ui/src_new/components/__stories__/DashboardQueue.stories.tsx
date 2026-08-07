import type { Meta, StoryObj } from "@storybook/react";
import { MessageSquare, PhoneIncoming, Voicemail, ClipboardList } from "lucide-react";
import { DashboardQueue, type DashboardQueueItem } from "../dashboard-queue";

const meta = {
  title: "UI/DashboardQueue",
  component: DashboardQueue,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    items: { table: { disable: true } },
  },
} satisfies Meta<typeof DashboardQueue>;

export default meta;
type Story = StoryObj<typeof meta>;

/* Reference-screenshot data — same four queues, same Contacts/Agents/wait
   values (HH:MM:SS, per that screenshot) as the actual reference screenshot
   for "QueueCards" below. `skillsCount` (unused by "cards" since the
   Contacts/Agents redesign, still shown by "accordion") kept at its own
   prior reference-screenshot values since no accordion-specific screenshot
   changed. */
const QUEUE_ITEMS: DashboardQueueItem[] = [
  { id: "1", name: "Digital",       icon: MessageSquare, wait: "00:02:34", skillsCount: 3, contactsCount: 8, agentsCount: 3 },
  { id: "2", name: "Inbound Voice", icon: PhoneIncoming, wait: "00:00:00", skillsCount: 1, contactsCount: 0, agentsCount: 2 },
  { id: "3", name: "Voicemail",     icon: Voicemail,     wait: "00:02:00", skillsCount: 3, contactsCount: 3, agentsCount: 3 },
  { id: "4", name: "Work Item",     icon: ClipboardList, wait: "00:00:24", skillsCount: 5, contactsCount: 5, agentsCount: 11 },
];

/* ── QueueCards ──
   Row of queue widgets, each its own DashboardCard with "contained"
   Contacts/Agents metrics — the "cards" variant. */

export const QueueCards: Story = {
  name: "QueueCards",
  render: () => <DashboardQueue variant="cards" items={QUEUE_ITEMS} />,
};

/* ── QueueAccordion ──
   The same four queues as expandable Accordion rows instead — the
   "accordion" variant. No `content` supplied per item here (nothing to
   expand into in this story), so each row just shows its chevron. */

export const QueueAccordion: Story = {
  name: "QueueAccordion",
  render: () => <DashboardQueue variant="accordion" items={QUEUE_ITEMS} />,
};
