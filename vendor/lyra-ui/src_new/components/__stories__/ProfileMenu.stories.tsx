import type { Meta, StoryObj } from "@storybook/react";
import { ProfileMenu, defaultProfileMenuGroups } from "../profile-menu";
import { LogOut, User, HelpCircle } from "lucide-react";

const meta: Meta<typeof ProfileMenu> = {
  title: "UI/AppHeader/ProfileMenu",
  component: ProfileMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof ProfileMenu>;

/* ── Default ── */

export const Default: Story = {
  render: () => (
    <div className="flex justify-end p-8">
      <ProfileMenu
        initials="JS"
        avatarColor="#5d6a79"
        groups={defaultProfileMenuGroups}
        showThemeToggle
      />
    </div>
  ),
};

/* ── Custom Groups ── */

export const CustomGroups: Story = {
  name: "Custom Groups",
  render: () => (
    <div className="flex justify-end p-8">
      <ProfileMenu
        initials="DB"
        avatarColor="#166cca"
        groups={[
          {
            items: [
              {
                label: "My Profile",
                icon: <User className="h-4 w-4" strokeWidth={1.5} />,
              },
            ],
          },
          {
            items: [
              {
                label: "Help Center",
                icon: <HelpCircle className="h-4 w-4" strokeWidth={1.5} />,
              },
              { label: "Support & Downloads" },
              { label: "Contact Us" },
            ],
          },
          {
            items: [
              {
                label: "Sign Out",
                icon: <LogOut className="h-4 w-4" strokeWidth={1.5} />,
              },
            ],
          },
        ]}
      />
    </div>
  ),
};
