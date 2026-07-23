import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DraggablePanel } from "../draggable-panel";
import type { DraggableVariant } from "../draggable";

const meta: Meta<typeof DraggablePanel> = {
  title: "UI/DraggablePanel",
  component: DraggablePanel,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof DraggablePanel>;

/* ── Blank (empty-state) ── */
export const Blank: Story = {
  name: "Blank (default)",
  render: () => (
    <div style={{ width: 320, height: 480 }}>
      <DraggablePanel title="Messages" onClose={() => alert("Close")} />
    </div>
  ),
};

/* ── With custom content ── */
export const WithContent: Story = {
  name: "With content",
  render: () => (
    <div style={{ width: 320, height: 480 }}>
      <DraggablePanel title="Schedule" onClose={() => alert("Close")}>
        <p className="lyra-body-md text-lyra-fg-default text-center">
          Any content can go here — this is just the shared draggable/dockable
          shell used by Notifications and Ask AI.
        </p>
      </DraggablePanel>
    </div>
  ),
};

/* ── Interactive (toggle float ↔ docked) ── */
export const Interactive: Story = {
  name: "Interactive (toggle float ↔ docked)",
  parameters: { layout: "fullscreen" },
  render: () => {
    const [variant, setVariant] = useState<DraggableVariant>("float");

    const panel = (
      <DraggablePanel
        title="Messages"
        draggableVariant={variant}
        onVariantChange={setVariant}
        defaultWidth={320}
        defaultHeight={420}
      />
    );

    return (
      <div className="flex h-screen overflow-hidden bg-lyra-bg-surface-shell">
        <div className="flex-1 flex items-center justify-center">
          <p className="lyra-body-md text-lyra-fg-secondary">
            Main content area — use the dock icon in the panel's header to toggle.
          </p>
        </div>
        {variant === "docked" ? (
          <div className="h-full pr-3 pb-3">{panel}</div>
        ) : (
          <div className="absolute top-16 left-16">{panel}</div>
        )}
      </div>
    );
  },
};
