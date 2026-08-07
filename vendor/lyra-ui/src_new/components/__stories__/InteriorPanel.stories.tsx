import type { Meta, StoryObj } from "@storybook/react";
import { InteriorPanel } from "../interior-panel";
import { Button } from "../button";
import { Input } from "../input";

/* ── InteriorPanel stories ──
   Split out of the old unified `Panel.stories.tsx` — see side-panel.tsx and
   interior-panel.tsx doc comments for why `SidePanel` and `InteriorPanel`
   are two separate components rather than one `variant` prop. Exactly two
   stories here: one per side (`side="left"` / `side="right"`), named with
   an explicit "— Left"/"— Right" suffix on both so neither reads as an
   unlabeled/ambiguous default — see `SidePanel.stories.tsx` for the
   matching pair on the other panel type. */

const meta: Meta<typeof InteriorPanel> = {
  title: "Atoms/InteriorPanel",
  component: InteriorPanel,
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof InteriorPanel>;

export const Right: Story = {
  name: "Interior Panel — Right",
  render: () => (
    <div className="h-[500px] flex overflow-hidden rounded-lyra-lg border border-lyra-border-subtle">
      <div className="flex-1 bg-lyra-bg-surface-base" />
      <InteriorPanel
        side="right"
        open
        headerTitle="Dialog Title"
        onClose={() => {}}
        footer={<><Button variant="outline">Cancel</Button><Button>Save</Button></>}
      >
        <div className="flex flex-col gap-4 px-4 py-4">
          <Input label="Name" placeholder="Enter name" />
          <Input label="Description" placeholder="Enter description" />
          <Input label="Value" placeholder="Enter value" />
        </div>
      </InteriorPanel>
    </div>
  ),
};

export const Left: Story = {
  name: "Interior Panel — Left",
  render: () => (
    <div className="h-[500px] flex overflow-hidden rounded-lyra-lg border border-lyra-border-subtle">
      <InteriorPanel
        side="left"
        open
        headerTitle="Filters"
        onClose={() => {}}
        footer={<><Button variant="outline">Reset</Button><Button>Apply</Button></>}
      >
        <div className="flex flex-col gap-4 px-4 py-4">
          <Input label="Search" placeholder="Filter by name..." />
          <Input label="Category" placeholder="Select category..." />
        </div>
      </InteriorPanel>
      <div className="flex-1 bg-lyra-bg-surface-base" />
    </div>
  ),
};
