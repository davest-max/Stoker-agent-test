import type { Meta, StoryObj } from "@storybook/react";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { KebabMenuButton } from "../kebab-menu-button";
import type { MenuEntry } from "../menu";

const GENERIC_ITEMS: MenuEntry[] = [
  { id: "edit", label: "Edit", icon: <Pencil className="h-4 w-4" strokeWidth={1.5} /> },
  { id: "refresh", label: "Refresh", icon: <RefreshCw className="h-4 w-4" strokeWidth={1.5} /> },
  { id: "remove", label: "Remove", icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} /> },
];

const meta = {
  title: "Atoms/KebabMenuButton",
  component: KebabMenuButton,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    items: { table: { disable: true } },
  },
} satisfies Meta<typeof KebabMenuButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Default ──
   Extracted from `ChannelRow`'s per-row kebab (see `channel-row.tsx`) into
   its own atom — this is the same trigger+portal+positioning behavior,
   just with a generic Edit/Refresh/Remove menu instead of channel-specific
   actions. `DashboardCard`'s header kebab (see `Atoms/Dashboard Card`)
   uses this exact component. */

export const Default: Story = {
  render: () => (
    <div className="flex items-center justify-end rounded-lyra-md border border-lyra-border-subtle p-2 w-72">
      <span className="lyra-body-md text-lyra-fg-default mr-auto">Card header</span>
      <KebabMenuButton items={GENERIC_ITEMS} ariaLabel="More options" />
    </div>
  ),
};

/* ── AllVariants ──
   The default state next to an "open" example (menu pinned open via a
   wider container so both the trigger and its dropdown are visible in one
   frame, since the real dropdown only opens on click). */

export const AllVariants: Story = {
  name: "AllVariants",
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-2">Trigger</p>
        <div className="flex items-center justify-end rounded-lyra-md border border-lyra-border-subtle p-2 w-72">
          <span className="lyra-body-md text-lyra-fg-default mr-auto">Card header</span>
          <KebabMenuButton items={GENERIC_ITEMS} ariaLabel="More options" />
        </div>
      </div>
      <p className="lyra-body-sm text-lyra-fg-secondary">Click the trigger above to open the dropdown — it renders via a portal to `document.body`, so it isn't clipped by this frame.</p>
    </div>
  ),
};
