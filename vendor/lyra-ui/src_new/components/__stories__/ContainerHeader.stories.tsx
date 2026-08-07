import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ContainerHeader } from "../container-header";
import { Button } from "../button";
import { StatusBadge } from "../status-badge";
import { Settings, Maximize2, Minimize2 } from "lucide-react";
import { InfoIcon } from "../icons/info-icon";
import { Tooltip } from "../tooltip";

const meta: Meta<typeof ContainerHeader> = {
  title: "Atoms/ContainerHeader",
  component: ContainerHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  argTypes: {
    title:    { control: "text" },
    bordered: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof ContainerHeader>;

export const Default: Story = {
  args: { title: "Container Title", bordered: false },
};

export const WithClose: Story = {
  name: "With close button",
  render: () => <ContainerHeader title="Dialog Title" bordered={false} onClose={() => {}} />,
};

export const WithIcon: Story = {
  name: "With icon",
  render: () => (
    <ContainerHeader
      title="Important notice"
      icon={<InfoIcon className="h-5 w-5" />}
      bordered={false}
      onClose={() => {}}
    />
  ),
};

export const WithActions: Story = {
  name: "With actions",
  render: () => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    return (
      <ContainerHeader
        title="Query Builder"
        bordered={false}
        actions={
          <>
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <Tooltip content={isFullscreen ? "Restore" : "Fullscreen"} placement="bottom" asLabel>
              <button
                aria-label={isFullscreen ? "Restore" : "Fullscreen"}
                onClick={() => setIsFullscreen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
              >
                {isFullscreen
                  ? <Minimize2 className="h-4 w-4" strokeWidth={1.5} />
                  : <Maximize2 className="h-4 w-4" strokeWidth={1.5} />}
              </button>
            </Tooltip>
          </>
        }
        onClose={() => {}}
      />
    );
  },
};

export const WithBadge: Story = {
  name: "With badge",
  render: () => (
    <ContainerHeader
      title="Notifications"
      titleBadge={<StatusBadge count={5} variant="critical" size="sm" />}
      bordered={false}
      onClose={() => {}}
    />
  ),
};

export const WithSubhead: Story = {
  name: "With subhead",
  render: () => (
    <ContainerHeader
      title="Query Builder"
      subhead="Filter and search across all records"
      bordered={false}
      onClose={() => {}}
    />
  ),
};

export const AllVariants: Story = {
  name: "All variants",
  render: () => (
    <div className="flex flex-col divide-y divide-lyra-border-subtle border border-lyra-border-subtle rounded-lyra-lg overflow-hidden bg-lyra-bg-surface-base">
      <ContainerHeader title="Title only" bordered={false} />
      <ContainerHeader title="With close" bordered={false} onClose={() => {}} />
      <ContainerHeader title="With icon" icon={<InfoIcon className="h-5 w-5" />} bordered={false} onClose={() => {}} />
      <ContainerHeader title="With actions" bordered={false} onClose={() => {}}
        actions={<Button variant="outline" size="sm">Action</Button>} />
      <ContainerHeader title="With badge" bordered={false} onClose={() => {}}
        titleBadge={<StatusBadge count={3} variant="default" size="sm" />} />
      <ContainerHeader title="With subhead" subhead="Secondary description text" bordered={false} onClose={() => {}} />
    </div>
  ),
};
