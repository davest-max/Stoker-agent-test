import type { Meta, StoryObj } from "@storybook/react";
import { TreeMenu } from "../tree-menu";
import type { TreeMenuItem } from "../tree-menu";
import {
  Monitor,
  LayoutDashboard,
  Settings,
  Scissors,
  FileText,
  FilePlus2,
} from "lucide-react";

const meta: Meta<typeof TreeMenu> = {
  title: "Atoms/TreeMenu",
  component: TreeMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  decorators: [
    (Story) => (
      <div className="w-[256px] bg-lyra-bg-surface-shell rounded-lyra-lg p-2">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TreeMenu>;

/* ── Default ── */

const defaultItems: TreeMenuItem[] = [
  {
    icon: <Monitor className="h-[18px] w-[18px]" strokeWidth={1.5} />,
    label: "Monitor",
  },
  {
    icon: <LayoutDashboard className="h-[18px] w-[18px]" strokeWidth={1.5} />,
    label: "Dashboard",
  },
  {
    icon: <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />,
    label: "Configure",
    children: [
      { label: "General" },
      { label: "Permissions" },
      { label: "Integrations" },
    ],
  },
  {
    icon: <Scissors className="h-[18px] w-[18px]" strokeWidth={1.5} />,
    label: "Designer",
    defaultOpen: true,
    children: [
      { label: "Desktop Library", active: true },
      { label: "Templates" },
      { label: "Components" },
    ],
  },
  {
    icon: <FileText className="h-[18px] w-[18px]" strokeWidth={1.5} />,
    label: "Examples",
  },
  {
    icon: <FilePlus2 className="h-[18px] w-[18px]" strokeWidth={1.5} />,
    label: "Product Mockups",
  },
];

export const Default: Story = {
  name: "Default",
  args: {
    items: defaultItems,
  },
};

/* ── All Collapsed ── */

const collapsedItems: TreeMenuItem[] = [
  {
    icon: <Monitor className="h-[18px] w-[18px]" strokeWidth={1.5} />,
    label: "Monitor",
  },
  {
    icon: <LayoutDashboard className="h-[18px] w-[18px]" strokeWidth={1.5} />,
    label: "Dashboard",
  },
  {
    icon: <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />,
    label: "Configure",
    children: [
      { label: "General" },
      { label: "Permissions" },
    ],
  },
  {
    icon: <Scissors className="h-[18px] w-[18px]" strokeWidth={1.5} />,
    label: "Designer",
    children: [
      { label: "Desktop Library" },
      { label: "Templates" },
      { label: "Components" },
    ],
  },
];

export const AllCollapsed: Story = {
  name: "All Collapsed",
  args: {
    items: collapsedItems,
  },
};

/* ── No Icons ── */

const noIconItems: TreeMenuItem[] = [
  { label: "Getting Started" },
  {
    label: "Components",
    defaultOpen: true,
    children: [
      { label: "Button" },
      { label: "Checkbox", active: true },
      { label: "Input" },
    ],
  },
  {
    label: "Patterns",
    children: [
      { label: "Forms" },
      { label: "Navigation" },
    ],
  },
];

export const NoIcons: Story = {
  name: "No Icons",
  args: {
    items: noIconItems,
  },
};
