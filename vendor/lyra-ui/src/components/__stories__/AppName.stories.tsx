import type { Meta, StoryObj } from "@storybook/react";
import { AppName } from "../app-name";
import appIcon from "../../assets/app-icon.svg";
import { LayoutGrid } from "lucide-react";

const meta: Meta<typeof AppName> = {
  title: "UI/AppHeader/AppName",
  component: AppName,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  argTypes: {
    name: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof AppName>;

/* ── Default ── */

export const Default: Story = {
  args: {
    icon: <img src={appIcon} alt="App" className="h-6 w-6" />,
    name: "Agent Workspace Premium",
  },
};

/* ── States ── */

export const States: Story = {
  name: "States (Default / Hover / Pressed)",
  render: () => (
    <div className="space-y-6">
      <div>
        <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
          Default
        </span>
        <AppName
          icon={<img src={appIcon} alt="App" className="h-6 w-6" />}
          name="Analytics"
        />
      </div>
      <div>
        <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
          Hover (hover to see)
        </span>
        <AppName
          icon={<img src={appIcon} alt="App" className="h-6 w-6" />}
          name="Analytics"
        />
      </div>
      <div>
        <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
          Pressed (click and hold to see)
        </span>
        <AppName
          icon={<img src={appIcon} alt="App" className="h-6 w-6" />}
          name="Analytics"
        />
      </div>
    </div>
  ),
};

/* ── With Lucide Icon ── */

export const WithLucideIcon: Story = {
  name: "With Lucide Icon",
  args: {
    icon: <LayoutGrid className="h-6 w-6 text-lyra-fg-action" strokeWidth={1.5} />,
    name: "Dashboard",
  },
};

/* ── Long Name ── */

export const LongName: Story = {
  name: "Long App Name",
  args: {
    icon: <img src={appIcon} alt="App" className="h-6 w-6" />,
    name: "Agent Workspace Premium Extended Edition",
  },
};
