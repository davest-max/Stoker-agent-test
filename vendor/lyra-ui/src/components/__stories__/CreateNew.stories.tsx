import type { Meta, StoryObj } from "@storybook/react";
import { CreateNew } from "../create-new";
import { OUTBOUND_CONFIG } from "./create-new-outbound-mock";

/* ── Outbound flow demo data (Create New → Outbound) ──
   Shared with LeftNav.stories.tsx and AgentNextGenTemplate.stories.tsx —
   see create-new-outbound-mock.tsx so all three stay in sync. */

const meta: Meta<typeof CreateNew> = {
  title: "UI/CreateNew",
  component: CreateNew,
  parameters: {
    layout: "centered",
    backgrounds: { default: "lyra-shell" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CreateNew>;

/* Compact icon-only trigger — used when the left nav rail is collapsed.
   See the `outbound` prop on CreateNew for the group picker → call-setup
   flow this button opens. */
export const IconButton: Story = {
  name: "Icon Button",
  args: {
    title: "New Outbound",
    outbound: OUTBOUND_CONFIG,
    expanded: false,
  },
};

/* Full-width secondary button with visible label — used when the left nav
   rail is expanded (open). */
export const Expanded: Story = {
  name: "Expanded (Full Button)",
  args: {
    title: "New Outbound",
    outbound: OUTBOUND_CONFIG,
    expanded: true,
  },
};
