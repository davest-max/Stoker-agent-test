import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { User } from "lucide-react";
import { PageHeader } from "../page-header";
import { SidePanel } from "../side-panel";
import { InteriorPanel } from "../interior-panel";
import { Button } from "../button";
import { AiIcon } from "../icons/ai-icon";

const meta: Meta<typeof PageHeader> = {
  title: "UI/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

const defaultActions = (
  <>
    <Button variant="outline">Secondary</Button>
    <Button>Primary</Button>
    <div className="mx-1 h-6 w-px bg-lyra-border-subtle" />
    <Button variant="outline">
      <AiIcon className="h-4 w-4" />
      Ask AI
    </Button>
  </>
);

export const Default: Story = {
  name: "Default",
  args: {
    title: "Desktop Designs",
    actions: defaultActions,
  },
};

export const WithChip: Story = {
  name: "With Chip",
  args: {
    title: "Desktop Designs",
    chip: "Active",
    chipColor: "green",
    chipVariant: "subtle",
    actions: defaultActions,
  },
};

export const TitleOnly: Story = {
  name: "Title Only",
  args: {
    title: "Settings",
  },
};

export const WithSingleAction: Story = {
  name: "Single Action",
  args: {
    title: "User Management",
    actions: <Button>Add User</Button>,
  },
};

export const WithPanelToggle: Story = {
  name: "With Panel Toggle",
  args: {
    title: "Desktop Designs",
    panelToggle: "left",
    actions: defaultActions,
  },
};

export const RecordHeader: Story = {
  name: "Record Header (Icon + Subtitle)",
  args: {
    icon: <User className="h-5 w-5" strokeWidth={1.5} />,
    title: "Jamie Torres",
    subtitle: "CS-1239930",
    actions: (
      <Button variant="outline">
        <AiIcon className="h-4 w-4" />
        Ask AI
      </Button>
    ),
  },
};

export const WithBreadcrumb: Story = {
  name: "With Breadcrumb",
  args: {
    title: "Page Title",
    breadcrumb: { label: "ParentName" },
    actions: defaultActions,
  },
};

export const WithTogglePinned: Story = {
  name: "Panel Toggle (Pinned)",
  render: () => {
    const [panelOpen, setPanelOpen] = useState(true);

    return (
      <div className="flex h-[600px] rounded-lyra-lg border border-lyra-border-subtle overflow-hidden">
        <SidePanel side="left" open={panelOpen} pinned headerTitle="Designer" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <PageHeader
            title="Page Title"
            panelToggle="left"
            panelPinned
            onPanelToggle={() => setPanelOpen((v) => !v)}
            breadcrumb={{ label: "ParentName" }}
            actions={defaultActions}
          />
          <div className="flex-1 bg-lyra-bg-surface-base" />
        </div>
      </div>
    );
  },
};

export const WithToggleOverlay: Story = {
  name: "Panel Toggle (Overlay on Hover)",
  render: () => {
    const [panelOpen, setPanelOpen] = useState(false);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

    const onHoverStart = () => {
      clearTimeout(timeoutRef.current);
      setPanelOpen(true);
    };
    const onHoverEnd = () => {
      timeoutRef.current = setTimeout(() => setPanelOpen(false), 300);
    };

    return (
      <div className="relative flex h-[600px] rounded-lyra-lg border border-lyra-border-subtle overflow-hidden">
        <SidePanel
          side="left"
          open={panelOpen}
          pinned={false}
          headerTitle="Designer"
          onMouseEnter={onHoverStart}
          onMouseLeave={onHoverEnd}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <PageHeader
            title="Page Title"
            panelToggle="left"
            panelPinned={false}
            onPanelHoverStart={onHoverStart}
            onPanelHoverEnd={onHoverEnd}
            breadcrumb={{ label: "ParentName" }}
            actions={defaultActions}
          />
          <div className="flex-1 bg-lyra-bg-surface-base" />
        </div>
      </div>
    );
  },
};

export const WithInnerPanelToggle: Story = {
  name: "Interior Panel Toggle",
  render: () => {
    const [panelOpen, setPanelOpen] = useState(false);

    return (
      <div className="flex h-[600px] rounded-lyra-lg border border-lyra-border-subtle overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <PageHeader
            title="Page Title"
            panelToggle="right"
            onInnerPanelToggle={() => setPanelOpen((v) => !v)}
            actions={defaultActions}
          />
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 bg-lyra-bg-surface-base" />
            <InteriorPanel
              side="right"
              open={panelOpen}
              headerTitle="Details"
              onClose={() => setPanelOpen(false)}
            >
              <div className="p-4">
                <p className="lyra-body-md text-lyra-fg-secondary">Panel content goes here.</p>
              </div>
            </InteriorPanel>
          </div>
        </div>
      </div>
    );
  },
};
