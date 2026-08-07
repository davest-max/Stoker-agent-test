import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { User } from "lucide-react";
import { PanelPinButton } from "../panel-pin-button";

const meta = {
  title: "Atoms/PanelPinButton",
  component: PanelPinButton,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
} satisfies Meta<typeof PanelPinButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Default ──
   Extracted from `Panel`'s own side-variant header (see `Atoms/Panel` →
   "Side Panel") into its own atom — same Tooltip/button/focus-ring and the
   pin-icon-rotates-45°-when-pinned animation, reusable anywhere a
   consumer needs to drive a `Panel`'s `pinned`/`open` state from outside
   the panel itself. */
export const Default: Story = {
  render: () => {
    const [pinned, setPinned] = useState(false);
    return (
      <div className="flex items-center gap-3 rounded-lyra-md border border-lyra-border-subtle p-3">
        <PanelPinButton pinned={pinned} onToggle={() => setPinned((v) => !v)} />
        <span className="lyra-body-sm text-lyra-fg-secondary">{pinned ? "Pinned" : "Unpinned"}</span>
      </div>
    );
  },
};

/* ── Custom icon ──
   agent-next-gen-v1's Designer-panel trigger sits on the interaction
   record header, next to the customer name — the `User` icon that's
   already there, not a separate `Pin` glyph. Passing `icon` swaps the
   glyph and switches the "pinned" indicator from the default's rotate-45°
   animation (a pin-specific metaphor that looks wrong on an arbitrary
   glyph) to a selected/pressed background instead — same Tooltip/aria
   behavior either way. */
export const CustomIcon: Story = {
  name: "Custom Icon (Designer panel trigger)",
  render: () => {
    const [pinned, setPinned] = useState(false);
    return (
      <div className="flex items-center gap-3 rounded-lyra-md border border-lyra-border-subtle p-3">
        <PanelPinButton
          pinned={pinned}
          onToggle={() => setPinned((v) => !v)}
          icon={<User className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />}
          pinnedLabel="Unpin Designer panel"
          unpinnedLabel="Pin Designer panel"
        />
        <span className="lyra-body-sm text-lyra-fg-secondary">{pinned ? "Pinned" : "Unpinned"}</span>
      </div>
    );
  },
};
