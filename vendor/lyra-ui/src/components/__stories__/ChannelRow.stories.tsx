import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  ChatChannelRow,
  EmailChannelRow,
  SmsChannelRow,
  WhatsAppChannelRow,
  VoiceChannelRow,
  ChannelTab,
} from "../channel-row";
import { TabList } from "../tabs";

/** Card-like frame matching how these rows actually appear inside an
 *  `InteractionNavItem` expanded card (bordered, rounded, clipped). */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[360px] overflow-hidden rounded-lyra-sm border border-lyra-border-subtle bg-lyra-bg-surface-base">
      {children}
    </div>
  );
}

const meta: Meta = {
  title: "UI/ChannelRow",
  parameters: {
    backgrounds: { default: "lyra-shell" },
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

/* ── One row per channel type ── */

export const Chat: Story = {
  render: () => (
    <Frame>
      <ChatChannelRow elapsed="08:27" preview="Chat_General" isFirst />
    </Frame>
  ),
};

export const Email: Story = {
  render: () => (
    <Frame>
      <EmailChannelRow elapsed="Now" preview="CXi SME Email" isFirst />
    </Frame>
  ),
};

export const Sms: Story = {
  name: "SMS",
  render: () => (
    <Frame>
      <SmsChannelRow elapsed="Now" preview="CXoneSMS_1-833-457-2672" isFirst />
    </Frame>
  ),
};

export const WhatsApp: Story = {
  render: () => (
    <Frame>
      <WhatsAppChannelRow elapsed="Now" preview="CXoneSMS_1-833-457-2672" isFirst />
    </Frame>
  ),
};

export const Voice: Story = {
  render: () => (
    <Frame>
      <VoiceChannelRow elapsed="01:12" preview="Chat_General" isFirst />
    </Frame>
  ),
};

/* ── States ── */

export const AwaitingResponse: Story = {
  name: "Chat — Awaiting Response (red chip + red time)",
  render: () => (
    <Frame>
      <ChatChannelRow elapsed="08:27" preview="Chat_General" awaitingResponse isFirst />
    </Frame>
  ),
};

export const Highlighted: Story = {
  name: "WhatsApp — Highlighted (current + active card)",
  render: () => (
    <Frame>
      <WhatsAppChannelRow elapsed="Now" preview="CXoneSMS_1-833-457-2672" highlighted isFirst />
    </Frame>
  ),
};

export const NoKebabMenu: Story = {
  name: "Email — No Kebab Menu (removable=false)",
  render: () => (
    <Frame>
      <EmailChannelRow elapsed="Now" preview="CXi SME Email" removable={false} isFirst />
    </Frame>
  ),
};

export const VoiceMenuDiffersFromDigital: Story = {
  name: "Voice — Different Default Menu (Listen/Download Recording)",
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="lyra-body-sm text-lyra-fg-secondary mb-2">
          Chat/Email/SMS/WhatsApp share one default kebab menu (Send/Download Transcript, Translate Messages).
          Voice swaps those for recording-appropriate actions instead — open each kebab to compare.
        </p>
      </div>
      <Frame>
        <ChatChannelRow elapsed="08:27" preview="Chat_General" isFirst />
      </Frame>
      <Frame>
        <VoiceChannelRow elapsed="01:12" preview="Chat_General" isFirst />
      </Frame>
    </div>
  ),
};

/* ── ChannelTab ──
 * One open channel rendered as a `Tab` — the "active conversation area" bar
 * a consumer renders under a record-header `PageHeader` (one tab per open
 * channel, e.g. `AgentNextGenTemplate.stories.tsx`'s `activeInteraction`
 * block), kept in sync with the matching `InteractionNavItem` card's
 * `currentChannelKey`/`onCurrentChannelChange` props via shared parent
 * state. Not a full "tab list" wrapper — the consumer still renders its own
 * `<TabList>` around these, same as any other set of `Tab`s. */

export const ChannelTabBar: Story = {
  name: "ChannelTab — Bar (SMS icon + label + address, kebab)",
  render: () => {
    const [active, setActive] = useState("sms:1");
    return (
      <TabList>
        <ChannelTab
          type="sms"
          address="(456) 383-3329"
          messageCount={16}
          interactionId="707535188548"
          active={active === "sms:1"}
          onClick={() => setActive("sms:1")}
        />
        <ChannelTab
          type="sms"
          address="(456) 555-9981"
          messageCount={4}
          interactionId="707535188611"
          active={active === "sms:2"}
          onClick={() => setActive("sms:2")}
        />
      </TabList>
    );
  },
};

export const ChannelTabNoAddress: Story = {
  name: "ChannelTab — No Address (redialed voice call)",
  render: () => (
    // No `address` and no `messageCount` — a redialed voice call has no
    // stored number, and voice has no message concept at all, so its
    // Tooltip's second line shows only "#{interactionId}", no address on
    // the face or first Tooltip line, no "Messages" segment either.
    <TabList>
      <ChannelTab type="voice" interactionId="707535188720" active onClick={() => {}} />
    </TabList>
  ),
};

export const ChannelTabNewOutbound: Story = {
  name: "ChannelTab — New Outbound (0 messages)",
  render: () => (
    // A freshly started outbound channel — `messageCount={0}` renders "0
    // Messages" on the Tooltip's second line, not a blank/missing segment.
    <TabList>
      <ChannelTab type="whatsapp" address="@Jamie Torres" messageCount={0} interactionId="707535188799" active onClick={() => {}} />
    </TabList>
  ),
};

export const ChannelTabResponsive: Story = {
  name: "ChannelTab — Responsive Collapse (narrow container)",
  render: () => {
    const [active, setActive] = useState("sms:1");
    return (
      <div className="flex flex-col gap-4">
        <p className="lyra-body-sm text-lyra-fg-secondary">
          Drag the dashed box's right edge narrower — each tab sheds its
          address first (≤480px), then its type label too (≤320px), down to
          icon + kebab only. Hover any tab at any width — its Tooltip always
          shows the full "Label address" plus message count/conversation id.
        </p>
        <div className="w-[420px] resize-x overflow-auto border border-dashed border-lyra-border-subtle p-2">
          <TabList className="lyra-channel-tab-list-wrap">
            <ChannelTab
              type="sms"
              address="(456) 383-3329"
              messageCount={16}
              interactionId="707535188548"
              active={active === "sms:1"}
              onClick={() => setActive("sms:1")}
            />
            <ChannelTab
              type="whatsapp"
              address="@Jamie Torres"
              messageCount={4}
              interactionId="707535188611"
              active={active === "sms:2"}
              onClick={() => setActive("sms:2")}
            />
          </TabList>
        </div>
      </div>
    );
  },
};

/* ── All types stacked in one card ── */

export const AllTypesStacked: Story = {
  name: "All Types — Stacked in One Card",
  render: () => (
    <Frame>
      <ChatChannelRow elapsed="08:00" preview="Chat_General" awaitingResponse isFirst />
      <EmailChannelRow elapsed="Now" preview="CXi SME Email" />
      <SmsChannelRow elapsed="Now" preview="CXoneSMS_1-833-457-2672" />
      <WhatsAppChannelRow elapsed="Now" preview="CXoneSMS_1-833-457-2672" highlighted />
      <VoiceChannelRow elapsed="01:12" preview="Chat_General" />
    </Frame>
  ),
};
