import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Container } from "../container";
import { Button } from "../button";
import { Input } from "../input";
import { Select } from "../select";
import { RadioGroup, RadioGroupItem } from "../radio";
import { Tooltip } from "../tooltip";
import { WarningIcon } from "../icons/warning-icon";
import { ErrorIcon } from "../icons/error-icon";
import { InfoIcon } from "../icons/info-icon";
import { SuccessIcon } from "../icons/success-icon";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "../../lib/utils";

const meta: Meta<typeof Container> = {
  title: "Atoms/Modal",
  component: Container,
  parameters: {
    layout: "centered",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof Container>;

/* ── Shared close button ── */
function CloseButton({ label = "Close dialog" }: { label?: string }) {
  return (
    <Tooltip content={label} placement="bottom" asLabel>
      <button
        aria-label={label}
        className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
      >
        <X className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

/* ── Width helpers ── */
const widths = { sm: "w-[360px]", md: "w-[480px]", lg: "w-[640px]" } as const;
type ModalWidth = keyof typeof widths;

/* ── Standard form content ── */
function FormContent() {
  return (
    <>
      <div className="flex flex-col gap-5 px-5">
        <Input label="Input Label" placeholder="Text" />
        <Select label="Input Label" options={[
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
          { value: "c", label: "Option C" },
        ]} />
        <RadioGroup label="Input Label" defaultValue="option1" name="modal-radio">
          <RadioGroupItem value="option1" label="Radio label" />
          <RadioGroupItem value="option2" label="Radio label" />
          <RadioGroupItem value="option3" label="Radio label" />
        </RadioGroup>
      </div>
      <div className="flex justify-end gap-2 px-5 pb-5 mt-6">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </div>
    </>
  );
}

/* ══════════════════════════════════
   Width variants
══════════════════════════════════ */

export const Small: Story = {
  name: "Small (360px)",
  render: () => (
    <Container variant="modal" headerTitle="Dialog Title"
      headerActions={<CloseButton />} className={widths.sm}>
      <FormContent />
    </Container>
  ),
};

export const Medium: Story = {
  name: "Medium (480px)",
  render: () => (
    <Container variant="modal" headerTitle="Dialog Title"
      headerActions={<CloseButton />} className={widths.md}>
      <FormContent />
    </Container>
  ),
};

export const Large: Story = {
  name: "Large (640px)",
  render: () => (
    <Container variant="modal" headerTitle="Dialog Title"
      headerActions={<CloseButton />} className={widths.lg}>
      <FormContent />
    </Container>
  ),
};

/* ══════════════════════════════════
   Semantic variants
══════════════════════════════════ */

export const Warning: Story = {
  render: () => (
    <Container variant="modal"
      headerTitle="Exit without saving?"
      headerIcon={<WarningIcon className="h-5 w-5" />}
      headerActions={<CloseButton />}
      className={widths.md}>
      <div className="flex flex-col gap-4 px-5">
        <p className="lyra-body-md text-lyra-fg-default">
          Use a warning modal whenever an action might have permanent implications.
          Clearly describe what will happen if they proceed, and always offer a safe way to exit.
        </p>
      </div>
      <div className="flex justify-end gap-2 px-5 pb-5 mt-6">
        <Button variant="outline">Cancel</Button>
        <Button>Continue</Button>
      </div>
    </Container>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Container variant="modal"
      headerTitle="Delete Policy?"
      headerIcon={<WarningIcon className="h-5 w-5" />}
      headerActions={<CloseButton />}
      className={widths.md}>
      <div className="flex flex-col gap-2 px-5">
        <p className="lyra-body-md text-lyra-fg-default">
          Use a destructive modal for irreversible actions with high impact on the system.
          This action cannot be undone.
        </p>
      </div>
      <div className="flex justify-end gap-2 px-5 pb-5 mt-6">
        <Button variant="outline">Cancel</Button>
        <Button variant="destructive">Delete</Button>
      </div>
    </Container>
  ),
};

export const Error: Story = {
  render: () => (
    <Container variant="modal"
      headerTitle="Action failed"
      headerIcon={<ErrorIcon className="h-5 w-5" />}
      headerActions={<CloseButton />}
      className={widths.md}>
      <div className="flex flex-col gap-2 px-5">
        <p className="lyra-body-md text-lyra-fg-default">
          The action could not be completed. Review the errors below and try again.
        </p>
      </div>
      <div className="flex justify-end gap-2 px-5 pb-5 mt-6">
        <Button variant="outline">Cancel</Button>
        <Button variant="outline">Retry</Button>
        <Button>OK</Button>
      </div>
    </Container>
  ),
};

export const Info: Story = {
  render: () => (
    <Container variant="modal"
      headerTitle="Important notice!"
      headerIcon={<InfoIcon className="h-5 w-5" />}
      headerActions={<CloseButton />}
      className={widths.md}>
      <div className="px-5">
        <p className="lyra-body-md text-lyra-fg-default">
          Use an info modal only when the message is important enough to interrupt the user's workflow.
        </p>
      </div>
      <div className="flex justify-end gap-2 px-5 pb-5 mt-6">
        <Button>OK</Button>
      </div>
    </Container>
  ),
};

export const Success: Story = {
  render: () => (
    <Container variant="modal"
      headerTitle="Action Completed"
      headerIcon={<SuccessIcon className="h-5 w-5" />}
      headerActions={<CloseButton />}
      className={widths.md}>
      <div className="flex flex-col gap-2 px-5">
        <p className="lyra-body-md text-lyra-fg-default">
          Your changes have been saved successfully.
        </p>
      </div>
      <div className="flex justify-end gap-2 px-5 pb-5 mt-6">
        <Button variant="outline">View Details</Button>
        <Button>Done</Button>
      </div>
    </Container>
  ),
};

/* ══════════════════════════════════
   Fullscreen modal — toggleable expand/collapse
══════════════════════════════════ */

export const Fullscreen: Story = {
  name: "Fullscreen (toggleable)",
  parameters: { layout: "fullscreen" },
  render: () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const headerActions = (
      <div className="flex items-center gap-1">
        <Tooltip content={isFullscreen ? "Restore" : "Fullscreen"} placement="bottom" asLabel>
          <button
            aria-label={isFullscreen ? "Restore modal size" : "Expand to fullscreen"}
            onClick={() => setIsFullscreen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
          >
            {isFullscreen
              ? <Minimize2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              : <Maximize2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            }
          </button>
        </Tooltip>
        <Tooltip content="Close dialog" placement="bottom" asLabel>
          <button
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
          >
            <X className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </Tooltip>
      </div>
    );

    return (
      <div className={cn(
        "flex items-center justify-center w-screen h-screen bg-lyra-bg-surface-canvas",
        isFullscreen && "bg-black/40"
      )}>
        <Container
          variant="modal"
          headerTitle="Query Builder"
          headerActions={headerActions}
          className={cn(
            "flex flex-col transition-all duration-200",
            isFullscreen
              ? "w-screen h-screen rounded-none"
              : "w-[1024px] max-w-[calc(100vw-2rem)] h-[768px] max-h-[calc(100vh-2rem)] rounded-lyra-lg"
          )}
        >
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4">
            <div className="flex flex-col gap-4">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="p-3 rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-canvas">
                  <p className="lyra-body-md text-lyra-fg-default">Row {i + 1} — scrollable content area</p>
                  <div className="flex gap-3 mt-2">
                    <Input placeholder="Condition..." className="flex-1" />
                    <Select options={[
                      { value: "eq", label: "Equals" },
                      { value: "ne", label: "Not Equals" },
                    ]} className="w-40" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fixed footer */}
          <div className="flex-shrink-0 flex justify-end gap-2 px-5 py-4">
            <Button variant="outline">Save Search</Button>
            <div className="flex-1" />
            <Button variant="outline">Cancel</Button>
            <Button>Apply</Button>
          </div>
        </Container>
      </div>
    );
  },
};

/* ══════════════════════════════════
   Overflow modal — fixed header + footer, scrollable body
══════════════════════════════════ */

export const Overflow: Story = {
  name: "Overflow (fixed header + footer)",
  render: () => (
    <Container variant="modal"
      headerTitle="Query Builder"
      headerActions={<CloseButton label="Close Query Builder" />}
      className={cn(widths.lg, "flex flex-col max-h-[80vh]")}
    >
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="p-3 rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-canvas">
              <p className="lyra-body-md text-lyra-fg-default">Row {i + 1} — scrollable content area</p>
              <div className="flex gap-3 mt-2">
                <Input placeholder="Condition..." className="flex-1" />
                <Select options={[
                  { value: "eq", label: "Equals" },
                  { value: "ne", label: "Not Equals" },
                ]} className="w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed footer */}
      <div className="flex-shrink-0 flex justify-end gap-2 px-5 py-4">
        <Button variant="outline">Save Search</Button>
        <div className="flex-1" />
        <Button variant="outline">Cancel</Button>
        <Button>Apply</Button>
      </div>
    </Container>
  ),
};
