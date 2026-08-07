import type { Meta, StoryObj } from "@storybook/react";
import { InteractionNavItem, type InteractionChannel } from "../interaction-nav-item";
import { CreateNew, useOutboundAddButton, type CreateNewOutboundConfig } from "../create-new";
import { OUTBOUND_CONFIG } from "./create-new-outbound-mock";

/** Body copy below each channel chip shows the routing skill, not a message
 *  preview — randomized per channel from this pool of sample skill names. */
const SKILL_NAMES = ["Chat_General", "CXi SME Email", "CXoneSMS_1-833-457-2672"];
function randomSkill(): string {
  return SKILL_NAMES[Math.floor(Math.random() * SKILL_NAMES.length)];
}

const meta: Meta<typeof InteractionNavItem> = {
  title: "UI/InteractionNavItem",
  component: InteractionNavItem,
  parameters: {
    backgrounds: { default: "lyra-shell" },
  },
  tags: ["autodocs"],
  argTypes: {
    expanded: { control: "boolean" },
    active: { control: "boolean" },
    awaitingResponse: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof InteractionNavItem>;

/* ── Compact (rail collapsed) ── */

export const Compact: Story = {
  name: "Compact — Active, Awaiting Response",
  args: {
    customerName: "Sofia Martinez",
    active: true,
    awaitingResponse: true,
    elapsed: "08:27",
    expanded: false,
    channels: [{ type: "chat", elapsed: "08:27", current: true }],
  },
};

export const CompactInactive: Story = {
  name: "Compact — Inactive, Awaiting Response",
  args: {
    customerName: "Ray Torres",
    active: false,
    awaitingResponse: true,
    elapsed: "06:12",
    expanded: false,
    channels: [{ type: "chat", elapsed: "06:12", current: true }],
  },
};

export const CompactNoCustomer: Story = {
  name: "Compact — No Customer (not awaiting)",
  args: {
    active: false,
    awaitingResponse: false,
    elapsed: "02:05",
    expanded: false,
    channels: [{ type: "voice", elapsed: "02:05", current: true }],
  },
};

export const CompactMultiChannel: Story = {
  name: "Compact — Multiple Channels Open",
  args: {
    customerName: "Sofia Martinez",
    active: true,
    awaitingResponse: true,
    elapsed: "08:27",
    expanded: false,
    channels: [
      { type: "chat", elapsed: "08:00" },
      { type: "email", elapsed: "Now" },
      { type: "sms", elapsed: "Now" },
      { type: "whatsapp", elapsed: "Now", current: true },
    ],
  },
};

export const CompactStack: Story = {
  name: "Compact — Stacked (rail collapsed)",
  render: () => (
    <div className="flex flex-col items-center gap-1 rounded-lyra-lg bg-lyra-bg-surface-shell p-2">
      <InteractionNavItem
        customerName="Sofia Martinez"
        active
        awaitingResponse
        elapsed="08:27"
        channels={[
          { type: "chat", elapsed: "08:00" },
          { type: "email", elapsed: "Now" },
          { type: "sms", elapsed: "Now" },
          { type: "whatsapp", elapsed: "Now", current: true },
        ]}
      />
      <InteractionNavItem
        customerName="Ray Torres"
        awaitingResponse
        elapsed="06:12"
        channels={[{ type: "chat", elapsed: "06:12", current: true }]}
      />
      <InteractionNavItem
        elapsed="02:05"
        channels={[{ type: "voice", elapsed: "02:05", current: true }]}
      />
    </div>
  ),
};

/* ── Expanded (rail open) ── */

const SOFIA_CHANNELS: InteractionChannel[] = [
  {
    type: "chat",
    elapsed: "08:00",
    preview: randomSkill(),
    awaitingResponse: true,
  },
  { type: "email", elapsed: "Now", preview: randomSkill(), removable: true },
  { type: "sms", elapsed: "Now", preview: randomSkill(), removable: true },
  {
    type: "whatsapp",
    elapsed: "Now",
    preview: randomSkill(),
    current: true,
    removable: true,
  },
];

const RAY_CHANNELS: InteractionChannel[] = [
  {
    type: "whatsapp",
    elapsed: "4m",
    preview: randomSkill(),
    current: true,
    awaitingResponse: true,
  },
  { type: "sms", elapsed: "Now", preview: randomSkill(), removable: true },
];

export const Expanded: Story = {
  name: "Expanded — Active, Awaiting Response",
  args: {
    customerName: "Sofia Martinez",
    active: true,
    awaitingResponse: true,
    elapsed: "08:27",
    expanded: true,
    channels: [{
      type: "chat",
      elapsed: "08:27",
      current: true,
      awaitingResponse: true,
      preview: randomSkill(),
    }],
  },
  parameters: { layout: "padded" },
};

export const ExpandedActiveNotAwaiting: Story = {
  name: "Expanded — Active, Not Awaiting Response",
  args: {
    customerName: "Priya Nair",
    active: true,
    awaitingResponse: false,
    elapsed: "03:41",
    expanded: true,
    channels: [{
      type: "chat",
      elapsed: "03:41",
      current: true,
      preview: randomSkill(),
    }],
  },
  parameters: { layout: "padded" },
};

export const ExpandedInactive: Story = {
  name: "Expanded — Inactive, Awaiting Response",
  args: {
    customerName: "Ray Torres",
    active: false,
    awaitingResponse: true,
    elapsed: "06:12",
    expanded: true,
    channels: [{
      type: "chat",
      elapsed: "06:12",
      current: true,
      awaitingResponse: true,
      preview: randomSkill(),
    }],
  },
  parameters: { layout: "padded" },
};

export const ExpandedNoCustomer: Story = {
  name: "Expanded — No Customer (not awaiting)",
  args: {
    active: false,
    awaitingResponse: false,
    elapsed: "02:05",
    expanded: true,
    channels: [{
      type: "voice",
      elapsed: "02:05",
      current: true,
      preview: randomSkill(),
    }],
  },
  parameters: { layout: "padded" },
};

export const ExpandedMultiChannelActive: Story = {
  name: "Expanded — Multiple Channels (Active Card)",
  args: {
    customerName: "Sofia Martinez",
    active: true,
    awaitingResponse: true,
    elapsed: "08:27",
    expanded: true,
    channels: SOFIA_CHANNELS,
  },
  parameters: { layout: "padded" },
};

export const ExpandedMultiChannelInactive: Story = {
  name: "Expanded — Multiple Channels (Inactive Card)",
  args: {
    customerName: "Ray Torres",
    active: false,
    awaitingResponse: true,
    elapsed: "04:00",
    expanded: true,
    channels: RAY_CHANNELS,
  },
  parameters: { layout: "padded" },
};

export const ExpandedVoice: Story = {
  name: "Expanded — Voice Channel",
  args: {
    customerName: "Marcus Webb",
    active: true,
    awaitingResponse: false,
    elapsed: "01:12",
    expanded: true,
    channels: [{
      type: "voice",
      elapsed: "01:12",
      current: true,
      preview: randomSkill(),
    }],
  },
  parameters: { layout: "padded" },
};

export const ExpandedStack: Story = {
  name: "Expanded — Stacked (rail open)",
  render: () => (
    <div className="flex w-[320px] flex-col gap-2 rounded-lyra-lg bg-lyra-bg-surface-shell p-3">
      <InteractionNavItem
        customerName="Sofia Martinez"
        active
        awaitingResponse
        elapsed="08:27"
        expanded
        channels={SOFIA_CHANNELS}
      />
      <InteractionNavItem
        customerName="Ray Torres"
        awaitingResponse
        elapsed="04:00"
        expanded
        channels={RAY_CHANNELS}
      />
      <InteractionNavItem
        elapsed="02:05"
        expanded
        channels={[{ type: "voice", elapsed: "02:05", current: true, preview: randomSkill() }]}
      />
    </div>
  ),
};

/* ── Header (headerAction slot) ──
   `headerAction` is a generic `React.ReactNode` slot in the card's header
   row (see interaction-nav-item.tsx), and the "Add Outbound" flow it's
   demonstrating here is a two-step handoff: clicking the "+" opens
   `OutboundAddButton`'s own small channel-picker flyout, and picking a
   channel there is supposed to hand off into `CreateNew`'s own "Select
   Channel / Select Phone / Outbound Skill → Start Interaction" screen —
   the same screen a real click from `CreateNew`'s own "New Outbound"
   button lands on. An earlier version of this story only wired the first
   step (`onSelect` just logged to the console) on the theory that there
   was "no outbound flow to hand off to" in a standalone story — which
   made the second screen look broken/missing when it was actually just
   never wired up. Fixed by giving this story its own small, self-contained
   `CreateNewOutboundConfig` (below) and using the real `useOutboundAddButton`
   hook (create-new.tsx) — the exact same hook every production consumer
   (AgentNextGenPage.tsx, AgentNextGenTemplate.stories.tsx, LeftNav.stories.tsx)
   uses — so selecting a channel here now opens the real second screen, not
   a stand-in. `CreateNew` itself is rendered (its "New Outbound" trigger
   button included, same as every real consumer) purely so there's
   somewhere for that popover to mount; `getHeaderAction` doesn't need the
   trigger to be clicked to open it. See "Compact — Hover Popover" further
   below for the same `headerAction` rendered in compact mode instead —
   there's no header row on the compact tile itself, but hovering it opens
   a popover previewing the full expanded card, header row included. */

const NAV_ITEM_HEADER_OUTBOUND_CONFIG: CreateNewOutboundConfig = {
  outboundTitle: "New Outbound",
  groups: [
    {
      id: "contacts",
      label: "Contacts",
      contacts: [
        { id: "sofia-martinez", name: "Sofia Martinez", initials: "SM", channels: ["voice", "email", "sms", "whatsapp"] },
        { id: "ray-torres", name: "Ray Torres", initials: "RT", channels: ["voice", "sms", "whatsapp"] },
      ],
    },
  ],
  channelOptions: OUTBOUND_CONFIG.channelOptions,
  phoneOptions: OUTBOUND_CONFIG.phoneOptions,
  skillOptions: OUTBOUND_CONFIG.skillOptions,
  onStartCall: (selection) => {
    // eslint-disable-next-line no-console
    console.log("Start call:", selection.channel, "→", selection.contact.name);
  },
};

export const NavItemHeader: Story = {
  name: "Header — Add Outbound Button",
  render: () => {
    const { launchRequest, onLaunchRequestHandled, getHeaderAction } = useOutboundAddButton(
      NAV_ITEM_HEADER_OUTBOUND_CONFIG
    );
    return (
      <div className="flex w-[320px] flex-col gap-2 rounded-lyra-lg bg-lyra-bg-surface-shell p-3">
        <CreateNew
          title="New Outbound"
          outbound={{ ...NAV_ITEM_HEADER_OUTBOUND_CONFIG, launchRequest, onLaunchRequestHandled }}
          // Every card below renders in expanded mode (full header row,
          // name + headerAction) — CreateNew's own trigger needs the same
          // `expanded` flag or it falls back to its default collapsed,
          // icon-only square button (see create-new.tsx's own `expanded`
          // doc comment), which looks disconnected from the fully-expanded
          // rail this story is otherwise depicting.
          expanded
        />
        <InteractionNavItem
          customerName="Sofia Martinez"
          active
          awaitingResponse
          elapsed="08:27"
          expanded
          channels={SOFIA_CHANNELS}
          headerAction={getHeaderAction("sofia-martinez")}
        />
        <InteractionNavItem
          customerName="Ray Torres"
          awaitingResponse
          elapsed="04:00"
          expanded
          channels={RAY_CHANNELS}
          headerAction={getHeaderAction("ray-torres")}
        />
        {/* No matching contact for this one (same as a quick-dialed number
            in the real app) — demonstrates getHeaderAction's fallback to
            the full unfiltered channel list instead of hiding the button. */}
        <InteractionNavItem
          elapsed="02:05"
          expanded
          channels={[{ type: "voice", elapsed: "02:05", current: true, preview: randomSkill() }]}
          headerAction={getHeaderAction("anonymous-voice")}
        />
      </div>
    );
  },
};

/* ── Compact hover popover ──
   Hover any compact tile below — it opens a popover previewing the full
   expanded card (name, `headerAction`, every channel row), fully
   interactive rather than a read-only tooltip: clicking a channel row
   makes it "current," the kebab menu's "Unassign & Dismiss" works, and
   `headerAction`'s own "+" opens its channel flyout and can hand off into
   `CreateNew`'s call-setup screen exactly like it does in expanded mode
   (see the "Header — Add Outbound Button" story above; this reuses the
   exact same `NAV_ITEM_HEADER_OUTBOUND_CONFIG`/`useOutboundAddButton`
   wiring, just with `expanded={false}` cards). Moving the pointer from the
   tile into the popover (to actually click something) doesn't close it —
   see interaction-nav-item.tsx's `openHoverCard`/`scheduleCloseHoverCard`
   for the hover-intent/delayed-close mechanics, mirrored from
   `OutboundContactRow`'s own hover flyout in create-new.tsx. */

export const CompactHoverCard: Story = {
  name: "Compact — Hover Popover",
  render: () => {
    const { launchRequest, onLaunchRequestHandled, getHeaderAction } = useOutboundAddButton(
      NAV_ITEM_HEADER_OUTBOUND_CONFIG
    );
    return (
      <div className="flex flex-col items-center gap-1 rounded-lyra-lg bg-lyra-bg-surface-shell p-2">
        <CreateNew
          title="New Outbound"
          outbound={{ ...NAV_ITEM_HEADER_OUTBOUND_CONFIG, launchRequest, onLaunchRequestHandled }}
        />
        <InteractionNavItem
          customerName="Sofia Martinez"
          active
          awaitingResponse
          elapsed="08:27"
          channels={SOFIA_CHANNELS}
          headerAction={getHeaderAction("sofia-martinez")}
        />
        <InteractionNavItem
          customerName="Ray Torres"
          awaitingResponse
          elapsed="04:00"
          channels={RAY_CHANNELS}
          headerAction={getHeaderAction("ray-torres")}
        />
        <InteractionNavItem
          elapsed="02:05"
          channels={[{ type: "voice", elapsed: "02:05", current: true, preview: randomSkill() }]}
          headerAction={getHeaderAction("anonymous-voice")}
        />
      </div>
    );
  },
};
