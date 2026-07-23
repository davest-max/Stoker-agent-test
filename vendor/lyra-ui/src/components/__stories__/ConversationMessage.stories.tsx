import type { Meta, StoryObj } from "@storybook/react";
import { ConversationMessage, ConversationDateStamp } from "../conversation-message";

const meta: Meta<typeof ConversationMessage> = {
  title: "Atoms/ConversationMessage",
  component: ConversationMessage,
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["user", "ai", "agent", "dark"] },
  },
};

export default meta;
type Story = StoryObj<typeof ConversationMessage>;

/* ── Avatar helper ── */
function Avatar({ initials, color = "bg-lyra-bg-active-subtle text-lyra-fg-active-strong" }: { initials: string; color?: string }) {
  return (
    <div className={`flex h-8 w-8 rounded-full items-center justify-center lyra-label shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

/* ── Variants ── */
export const Default: Story = {
  args: { variant: "user", children: "How can I reset my password?" },
};

export const AllVariants: Story = {
  name: "All variants",
  render: () => (
    <div className="flex flex-col gap-8 max-w-xl pt-10">
      <ConversationMessage variant="user">
        How can I reset my password?
      </ConversationMessage>
      <ConversationMessage
        variant="ai"
        process={[
          { id: "1", label: "Verifying identity requirements",  status: "done" },
          { id: "2", label: "Checking password policy",          status: "done" },
          { id: "3", label: "Preparing reset flow",              status: "done" },
        ]}
        processExpanded
      >
        Go to <strong>Settings → Security → Reset password</strong> and follow the steps.
      </ConversationMessage>
      <ConversationMessage variant="agent">
        Let me pull up your account details now.
      </ConversationMessage>
      <ConversationMessage variant="dark" senderName="Agent Name">
        Your verification code is <strong>482913</strong>. It expires in 10 minutes.
      </ConversationMessage>
    </div>
  ),
};

/* ── With avatars ── */
export const WithAvatars: Story = {
  name: "With avatars",
  render: () => (
    <div className="flex flex-col gap-6 max-w-xl pt-10">
      <ConversationMessage variant="user">
        I've been waiting for 20 minutes, this is frustrating.
      </ConversationMessage>
      <ConversationMessage variant="agent" avatar={<Avatar initials="SJ" />} senderName="Sarah J.">
        I sincerely apologize for the wait. Let me prioritize your case right now.
      </ConversationMessage>
      <ConversationMessage variant="ai" avatar={<Avatar initials="AI" color="bg-lyra-bg-active-subtle text-lyra-fg-active-strong" />} senderName="AI Assistant">
        Based on the account history, this customer has contacted us 3 times in the past week.
      </ConversationMessage>
    </div>
  ),
};

/* ── Timestamps and date stamps ── */
export const WithTimestamps: Story = {
  name: "Timestamps & date separator",
  render: () => (
    <div className="flex flex-col gap-6 max-w-xl pt-10">
      <ConversationDateStamp label="Yesterday" />
      <ConversationMessage variant="user" timestamp="4:12 PM">
        Can you check my order status?
      </ConversationMessage>
      <ConversationMessage variant="agent" timestamp="4:13 PM" senderName="Marcus T.">
        Of course! Your order #84721 is currently in transit.
      </ConversationMessage>
      <ConversationDateStamp label="Today" />
      <ConversationMessage variant="user" timestamp="9:04 AM">
        It still hasn't arrived. It was supposed to be here yesterday.
      </ConversationMessage>
      <ConversationMessage variant="agent" timestamp="9:06 AM" senderName="Marcus T.">
        I'm escalating this to our logistics team immediately.
      </ConversationMessage>
    </div>
  ),
};

/* ── Alert helper messages ── */
export const WithAlerts: Story = {
  name: "With alert helper messages",
  render: () => (
    <div className="flex flex-col gap-8 max-w-xl pt-10">
      <ConversationMessage
        variant="user"
        alert="Frustrated sentiment detected"
        timestamp="2:31 PM"
      >
        This is absolutely ridiculous, I've called 4 times already!
      </ConversationMessage>
      <ConversationMessage
        variant="user"
        alert={{ message: "Possible churn risk detected — consider retention offer", icon: <span className="text-sm">⚠️</span> }}
        timestamp="2:32 PM"
      >
        I'm considering switching providers at this point.
      </ConversationMessage>
      <ConversationMessage variant="agent" timestamp="2:33 PM" senderName="Lisa K.">
        I completely understand your frustration. Let me make this right.
      </ConversationMessage>
    </div>
  ),
};

/* ── Full thread ── */
export const FullThread: Story = {
  name: "Full conversation thread",
  render: () => (
    <div className="flex flex-col gap-5 max-w-xl pt-10">
      <ConversationDateStamp label="June 4, 2026" />
      {/* user = customer, no avatar — they're the only one on their side */}
      <ConversationMessage variant="user" timestamp="10:41 AM">
        Hi, I can't seem to access my account.
      </ConversationMessage>
      <ConversationMessage
        variant="ai"
        process={[
          { id: "1", label: "Reviewing account history",      status: "done" },
          { id: "2", label: "Checking recent login events",    status: "done" },
          { id: "3", label: "Identifying likely root cause",   status: "active", description: "Analysing device fingerprint…" },
          { id: "4", label: "Generating recommended action",   status: "pending" },
        ]}
        processExpanded
      >
        I can help with that. Could you tell me what error message you're seeing?
      </ConversationMessage>
      <ConversationMessage variant="user" timestamp="10:42 AM"
        alert="Frustrated sentiment detected">
        It just says "access denied" every single time. Very frustrating.
      </ConversationMessage>
      {/* agent/dark = multi-party chat, avatars distinguish speakers */}
      <ConversationMessage variant="agent" senderName="Rachel M." timestamp="10:43 AM"
        avatar={<Avatar initials="RM" />}>
        I'm taking over to help you directly. Let me look into this right away.
      </ConversationMessage>
      <ConversationMessage variant="dark" senderName="Rachel M." timestamp="10:44 AM"
        avatar={<Avatar initials="RM" />}>
        Your temporary access code is <strong>7829-XK</strong>. Valid for 15 minutes.
      </ConversationMessage>
      <ConversationMessage variant="user" timestamp="10:45 AM">
        That worked! Thank you so much.
      </ConversationMessage>
    </div>
  ),
};
