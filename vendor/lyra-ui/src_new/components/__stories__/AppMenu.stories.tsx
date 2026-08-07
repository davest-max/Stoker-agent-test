import type { Meta, StoryObj } from "@storybook/react";
import { AppMenu, type AppMenuGroup } from "../app-menu";
import { CXoneLogo } from "../cxone-logo";

const sampleGroups: AppMenuGroup[] = [
  {
    items: [
      { label: "Admin" },
      { label: "Supervisor" },
      { label: "Agent" },
      { label: "Congingy AI" },
    ],
  },
  {
    items: [
      { label: "Workforce Management" },
      { label: "Quality Management" },
      { label: "interaction Hub" },
      { label: "My Zone" },
    ],
  },
  {
    items: [
      { label: "Dashboard" },
      { label: "Analytics" },
    ],
  },
];

const meta: Meta<typeof AppMenu> = {
  title: "UI/AppHeader/AppMenu",
  component: AppMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof AppMenu>;

/* ── Default ── */

export const Default: Story = {
  render: () => (
    <AppMenu groups={sampleGroups} footer={<CXoneLogo />} />
  ),
};

/* ── With Active Item ── */

export const WithActiveItem: Story = {
  name: "With Active Item",
  render: () => {
    const groups: AppMenuGroup[] = [
      {
        items: [
          { label: "Admin" },
          { label: "Supervisor" },
          { label: "Agent", active: true },
          { label: "Congingy AI" },
        ],
      },
      {
        items: [
          { label: "Workforce Management" },
          { label: "Quality Management" },
          { label: "interaction Hub" },
          { label: "My Zone" },
        ],
      },
      {
        items: [
          { label: "Dashboard" },
          { label: "Analytics" },
        ],
      },
    ];
    return <AppMenu groups={groups} footer={<CXoneLogo />} />;
  },
};

/* ── States ── */

export const States: Story = {
  name: "Item States",
  render: () => (
    <div className="space-y-6">
      <p className="lyra-body-sm text-lyra-fg-secondary">
        Hover and click items to see interactive states. The "Agent" item below is shown in the selected/active state.
      </p>
      <AppMenu
        groups={[
          {
            items: [
              { label: "Admin" },
              { label: "Agent", active: true },
              { label: "Congingy AI" },
            ],
          },
        ]}
        footer={<CXoneLogo />}
      />
    </div>
  ),
};

/* ── Without Footer ── */

export const WithoutFooter: Story = {
  name: "Without Footer",
  render: () => <AppMenu groups={sampleGroups} />,
};
