import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CustomerInformationPanel } from "../customer-information-panel";
import { Button } from "../button";

const meta: Meta<typeof CustomerInformationPanel> = {
  title: "Atoms/CustomerInformationPanel",
  component: CustomerInformationPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof CustomerInformationPanel>;

/* ── Side Panel ──
   Same `Panel` "side" variant/pin/hover/resize/animation as the plain
   `Panel` "Side Panel" story — this is the record-header panel opened by
   the `PanelPinButton` "User" trigger, specialized with a fixed "Customer
   Information" title and a "{name} · {id}" subhead computed from `person`. */
export const Side: Story = {
  name: "Side Panel",
  render: () => {
    const [open, setOpen] = useState(true);
    const [pinned, setPinned] = useState(true);
    return (
      <div className="relative h-[500px] flex overflow-hidden rounded-lyra-lg border border-lyra-border-subtle">
        <CustomerInformationPanel
          open={open}
          pinned={pinned}
          person={{ name: "Sarah Miller", id: "CST-10591" }}
          onPinToggle={() => setPinned((v) => !v)}
        >
          <div className="px-4 py-4">
            <p className="lyra-body-md text-lyra-fg-secondary">Customer details go here.</p>
          </div>
        </CustomerInformationPanel>
        <div className="flex flex-1 flex-col bg-lyra-bg-surface-base p-4 gap-2">
          <Button onClick={() => setOpen((v) => !v)} variant="outline">
            {open ? "Close Panel" : "Open Panel"}
          </Button>
          <p className="lyra-body-sm text-lyra-fg-secondary">
            {pinned ? "Pinned — pushes content" : "Unpinned — hovers as overlay"}
          </p>
        </div>
      </div>
    );
  },
};

/* ── Agent subject ──
   `person` isn't customer-only — an agent-to-agent consult/transfer
   interaction passes the agent's own name + id the same way. */
export const AgentSubject: Story = {
  name: "Agent Subject",
  render: () => (
    <div className="relative h-[400px] flex overflow-hidden rounded-lyra-lg border border-lyra-border-subtle">
      <CustomerInformationPanel
        open
        pinned
        person={{ name: "Alex Kowalski", id: "AGT-2003" }}
      >
        <div className="px-4 py-4">
          <p className="lyra-body-md text-lyra-fg-secondary">Customer details go here.</p>
        </div>
      </CustomerInformationPanel>
      <div className="flex flex-1 bg-lyra-bg-surface-base" />
    </div>
  ),
};
