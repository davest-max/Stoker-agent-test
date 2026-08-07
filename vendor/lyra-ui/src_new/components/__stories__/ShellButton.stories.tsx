import type { Meta, StoryObj } from "@storybook/react";
import { ActionIconButton, ActionAvatarButton } from "../actions";
import { CircleHelp, Bell, Settings, Search } from "lucide-react";

/* ══════════════════════════════════════════
   Action Avatar Button
   ══════════════════════════════════════════ */

const avatarMeta: Meta<typeof ActionAvatarButton> = {
  title: "UI/AppHeader/Avatar",
  component: ActionAvatarButton,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  argTypes: {
    initials: { control: "text" },
    avatarColor: { control: "color" },
  },
};

export default avatarMeta;
type AvatarStory = StoryObj<typeof ActionAvatarButton>;

export const Default: AvatarStory = {
  args: {
    initials: "JS",
    avatarColor: "#5d6a79",
  },
};

export const AvatarStates: AvatarStory = {
  name: "States (Default / Hover / Pressed)",
  render: () => (
    <div className="space-y-6">
      <div>
        <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
          Default
        </span>
        <ActionAvatarButton initials="JS" />
      </div>
      <div>
        <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
          Hover (hover to see)
        </span>
        <ActionAvatarButton initials="JS" />
      </div>
      <div>
        <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
          Pressed (click and hold)
        </span>
        <ActionAvatarButton initials="JS" />
      </div>
    </div>
  ),
};

export const CustomColor: AvatarStory = {
  args: {
    initials: "AB",
    avatarColor: "#166cca",
  },
};
