import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Overlay, OverlayBackdrop } from "../overlay";
import { Container } from "../container";
import { Button } from "../button";
import { X } from "lucide-react";
import { Tooltip } from "../tooltip";

const meta: Meta = {
  title: "Atoms/Overlay",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj;

/* ── Shared close button ── */
function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip content="Close" placement="bottom" asLabel>
      <button
        aria-label="Close"
        onClick={onClick}
        className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
      >
        <X className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </Tooltip>
  );
}

/* ── Shared modal ── */
function SampleModal({ onClose }: { onClose: () => void }) {
  return (
    <Container
      variant="modal"
      headerTitle="Dialog Title"
      headerActions={<CloseButton onClick={onClose} />}
      className="w-[480px] max-w-[calc(100vw-2rem)]"
    >
      <div className="flex flex-col gap-4 px-5 pb-5 pt-2">
        <p className="lyra-body-md text-lyra-fg-default">
          This modal appears above the overlay. Press <kbd className="lyra-body-sm bg-lyra-bg-surface-canvas border border-lyra-border-subtle rounded px-1">Esc</kbd> or click outside to dismiss.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Confirm</Button>
        </div>
      </div>
    </Container>
  );
}

/* ══════════════════════════════════
   Dark overlay (default)
══════════════════════════════════ */
export const Dark: Story = {
  name: "Dark overlay",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex items-center justify-center h-64 bg-lyra-bg-surface-base rounded-lyra-lg border border-lyra-border-subtle">
        <Button onClick={() => setOpen(true)}>Open with Dark Overlay</Button>

        <Overlay open={open} variant="dark" onClose={() => setOpen(false)}>
          <SampleModal onClose={() => setOpen(false)} />
        </Overlay>
      </div>
    );
  },
};

/* ══════════════════════════════════
   Light overlay
══════════════════════════════════ */
export const Light: Story = {
  name: "Light overlay",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex items-center justify-center h-64 bg-lyra-bg-surface-base rounded-lyra-lg border border-lyra-border-subtle">
        <Button onClick={() => setOpen(true)}>Open with Light Overlay</Button>

        <Overlay open={open} variant="light" onClose={() => setOpen(false)}>
          <SampleModal onClose={() => setOpen(false)} />
        </Overlay>
      </div>
    );
  },
};

/* ══════════════════════════════════
   Both side by side
══════════════════════════════════ */
export const BothVariants: Story = {
  name: "Both Variants",
  render: () => {
    const [which, setWhich] = useState<"dark" | "light" | null>(null);
    return (
      <div className="flex gap-4 items-center justify-center h-64 bg-lyra-bg-surface-base rounded-lyra-lg border border-lyra-border-subtle">
        <Button onClick={() => setWhich("dark")}>Dark</Button>
        <Button variant="outline" onClick={() => setWhich("light")}>Light</Button>

        {which && (
          <Overlay open variant={which} onClose={() => setWhich(null)}>
            <SampleModal onClose={() => setWhich(null)} />
          </Overlay>
        )}
      </div>
    );
  },
};

/* ══════════════════════════════════
   Dismiss on backdrop click
══════════════════════════════════ */
export const DismissOnClick: Story = {
  name: "Dismiss on backdrop click",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex items-center justify-center h-64 bg-lyra-bg-surface-base rounded-lyra-lg border border-lyra-border-subtle">
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Overlay open={open} variant="dark" closeOnBackdropClick onClose={() => setOpen(false)}>
          <SampleModal onClose={() => setOpen(false)} />
        </Overlay>
      </div>
    );
  },
};

/* ══════════════════════════════════
   OverlayBackdrop (no portal)
══════════════════════════════════ */
export const BackdropOnly: Story = {
  name: "Backdrop only (no portal)",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative flex items-center justify-center h-64 bg-lyra-bg-surface-base rounded-lyra-lg border border-lyra-border-subtle overflow-hidden">
        <p className="lyra-body-md text-lyra-fg-default">Page content behind the overlay</p>

        <Button className="absolute bottom-4 right-4" onClick={() => setOpen(true)}>
          Show backdrop
        </Button>

        {open && (
          <>
            <OverlayBackdrop
              variant="dark"
              className="absolute rounded-lyra-lg"
              onClick={() => setOpen(false)}
            />
            <div className="absolute z-50">
              <Button variant="outline" onClick={() => setOpen(false)}>Dismiss</Button>
            </div>
          </>
        )}
      </div>
    );
  },
};
