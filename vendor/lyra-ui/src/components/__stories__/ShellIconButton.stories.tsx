import type { Meta, StoryObj } from "@storybook/react";
import { ActionIconButton } from "../actions";
import { CircleHelp, Bell, Settings, Search } from "lucide-react";

const meta: Meta<typeof ActionIconButton> = {
  title: "UI/AppHeader/IconButton",
  component: ActionIconButton,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  argTypes: {
    badge: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof ActionIconButton>;

export const Default: Story = {
  args: {
    title: "Help",
    children: <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.5} />,
  },
};

export const WithBadge: Story = {
  name: "With Badge",
  args: {
    title: "Help",
    badge: 5,
    children: <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.5} />,
  },
};

export const States: Story = {
  name: "States (Default / Hover / Pressed)",
  render: () => (
    <div className="space-y-6">
      <div>
        <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
          Default
        </span>
        <ActionIconButton title="Help" badge={5}>
          <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </ActionIconButton>
      </div>
      <div>
        <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
          Hover (hover to see)
        </span>
        <ActionIconButton title="Help" badge={5}>
          <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </ActionIconButton>
      </div>
      <div>
        <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
          Pressed (click and hold)
        </span>
        <ActionIconButton title="Help" badge={5}>
          <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </ActionIconButton>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <ActionIconButton size="sm" title="Help">
          <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </ActionIconButton>
        <span className="lyra-body-sm text-lyra-fg-secondary">32px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ActionIconButton size="default" title="Help">
          <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </ActionIconButton>
        <span className="lyra-body-sm text-lyra-fg-secondary">36px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ActionIconButton size="lg" title="Help">
          <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </ActionIconButton>
        <span className="lyra-body-sm text-lyra-fg-secondary">40px</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ActionIconButton size="xl" title="Help">
          <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </ActionIconButton>
        <span className="lyra-body-sm text-lyra-fg-secondary">44px</span>
      </div>
    </div>
  ),
};

export const AllIcons: Story = {
  name: "Icon Variations",
  render: () => (
    <div className="flex items-center gap-2">
      <ActionIconButton title="Help">
        <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.5} />
      </ActionIconButton>
      <ActionIconButton title="Notifications" badge={4}>
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
      </ActionIconButton>
      <ActionIconButton title="Settings">
        <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
      </ActionIconButton>
      <ActionIconButton title="Search">
        <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
      </ActionIconButton>
    </div>
  ),
};

export const BadgeVariants: Story = {
  name: "Badge Variants",
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <ActionIconButton size="xl" title="No badge">
          <Bell className="h-5 w-5" strokeWidth={1.5} />
        </ActionIconButton>
        <span className="lyra-body-sm text-lyra-fg-secondary">No badge</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ActionIconButton size="xl" title="Badge 1" badge={1}>
          <Bell className="h-5 w-5" strokeWidth={1.5} />
        </ActionIconButton>
        <span className="lyra-body-sm text-lyra-fg-secondary">1</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ActionIconButton size="xl" title="Badge 4" badge={4}>
          <Bell className="h-5 w-5" strokeWidth={1.5} />
        </ActionIconButton>
        <span className="lyra-body-sm text-lyra-fg-secondary">4</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ActionIconButton size="xl" title="Badge 12" badge={12}>
          <Bell className="h-5 w-5" strokeWidth={1.5} />
        </ActionIconButton>
        <span className="lyra-body-sm text-lyra-fg-secondary">12</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ActionIconButton size="xl" title="Badge 99+" badge={100}>
          <Bell className="h-5 w-5" strokeWidth={1.5} />
        </ActionIconButton>
        <span className="lyra-body-sm text-lyra-fg-secondary">100</span>
      </div>
    </div>
  ),
};
