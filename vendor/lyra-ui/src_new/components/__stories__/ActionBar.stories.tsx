import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ActionBar } from "../action-bar";
import { Button } from "../button";
import { StopCircle } from "lucide-react";

const meta: Meta<typeof ActionBar> = {
  title: "Atoms/ActionBar",
  component: ActionBar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "lyra-shell" },
  },
  argTypes: {
    variant: { control: "select", options: ["info", "warning", "error"] },
    title: { control: "text" },
    description: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof ActionBar>;

/* ── Info ── */
export const Info: Story = {
  name: "Info",
  render: () => (
    <ActionBar
      variant="info"
      title="Reviewing this conversation"
      description="You are reviewing the AI Agent's live conversation - immediate action is requested."
      actions={
        <>
          <Button variant="outline">Guide Conversation</Button>
          <Button variant="outline">Transfer</Button>
          <Button variant="destructive">Takeover</Button>
        </>
      }
    />
  ),
};

/* ── Warning ── */
export const Warning: Story = {
  name: "Warning",
  render: () => {
    const [guiding, setGuiding] = useState(true);
    return guiding ? (
      <ActionBar
        variant="warning"
        title="Guiding this conversation"
        description="You are guiding the AI agent in real time"
        actions={
          <>
            <Button variant="warning" className="gap-1.5" onClick={() => setGuiding(false)}>
              <StopCircle className="h-4 w-4" strokeWidth={1.5} />
              Stop Guiding
            </Button>
            <Button variant="outline">Transfer</Button>
            <Button variant="destructive">Takeover</Button>
          </>
        }
      />
    ) : (
      <ActionBar
        variant="info"
        title="Reviewing this conversation"
        description="You are reviewing the AI Agent's live conversation - immediate action is requested."
        actions={
          <>
            <Button variant="outline" onClick={() => setGuiding(true)}>Guide Conversation</Button>
            <Button variant="outline">Transfer</Button>
            <Button variant="destructive">Takeover</Button>
          </>
        }
      />
    );
  },
};

/* ── Error ── */
export const Error: Story = {
  name: "Error",
  render: () => (
    <ActionBar
      variant="error"
      title="Connection lost"
      description="The AI agent has disconnected. Immediate action is required."
      actions={
        <>
          <Button variant="outline">Retry</Button>
          <Button variant="destructive">Takeover</Button>
        </>
      }
    />
  ),
};

/* ── All states ── */
export const AllStates: Story = {
  name: "All States",
  render: () => (
    <div className="flex flex-col">
      <ActionBar
        variant="info"
        title="Reviewing this conversation"
        description="You are reviewing the AI Agent's live conversation - immediate action is requested."
        actions={
          <>
            <Button variant="outline">Guide Conversation</Button>
            <Button variant="outline">Transfer</Button>
            <Button variant="destructive">Takeover</Button>
          </>
        }
      />
      <ActionBar
        variant="warning"
        title="Guiding this conversation"
        description="You are guiding the AI agent in real time"
        actions={
          <>
            <Button variant="warning" className="gap-1.5">
              <StopCircle className="h-4 w-4" strokeWidth={1.5} />
              Stop Guiding
            </Button>
            <Button variant="outline">Transfer</Button>
            <Button variant="destructive">Takeover</Button>
          </>
        }
      />
      <ActionBar
        variant="error"
        title="Connection lost"
        description="The AI agent has disconnected. Immediate action is required."
        actions={
          <>
            <Button variant="outline">Retry</Button>
            <Button variant="destructive">Takeover</Button>
          </>
        }
      />
    </div>
  ),
};

/* ── All Variants ── */
export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-col">
      {/* Info — many actions */}
      <ActionBar
        variant="info"
        title="Reviewing this conversation"
        description="You are reviewing the AI Agent's live conversation - immediate action is requested."
        actions={
          <>
            <Button variant="outline">Guide Conversation</Button>
            <Button variant="outline">Transfer</Button>
            <Button variant="destructive">Takeover</Button>
          </>
        }
      />

      {/* Warning — stop action */}
      <ActionBar
        variant="warning"
        title="Guiding this conversation"
        description="You are guiding the AI agent in real time"
        actions={
          <>
            <Button variant="warning" className="gap-1.5">
              <StopCircle className="h-4 w-4" strokeWidth={1.5} />
              Stop Guiding
            </Button>
            <Button variant="outline">Transfer</Button>
            <Button variant="destructive">Takeover</Button>
          </>
        }
      />

      {/* Error — minimal actions */}
      <ActionBar
        variant="error"
        title="Connection lost"
        description="The AI agent has disconnected. Immediate action is required."
        actions={
          <>
            <Button variant="outline">Retry</Button>
            <Button variant="destructive">Takeover</Button>
          </>
        }
      />

      {/* Info — single action */}
      <ActionBar
        variant="info"
        title="Update available"
        description="A new version of the AI model is available."
        actions={<Button variant="outline">Update now</Button>}
      />

      {/* Warning — no description */}
      <ActionBar
        variant="warning"
        title="Session expiring soon"
        actions={<Button variant="warning">Extend session</Button>}
      />
    </div>
  ),
};

/* ── Interactive / controlled ── */
export const Interactive: Story = {
  name: "Interactive",
  render: () => {
    const [state, setState] = useState<"reviewing" | "guiding" | null>("reviewing");

    if (!state) return (
      <div className="p-8 flex justify-center">
        <Button onClick={() => setState("reviewing")}>Start review</Button>
      </div>
    );

    if (state === "reviewing") return (
      <ActionBar
        variant="info"
        title="Reviewing this conversation"
        description="You are reviewing the AI Agent's live conversation - immediate action is requested."
        actions={
          <>
            <Button variant="outline" onClick={() => setState("guiding")}>Guide Conversation</Button>
            <Button variant="outline" onClick={() => setState(null)}>Transfer</Button>
            <Button variant="destructive" onClick={() => setState(null)}>Takeover</Button>
          </>
        }
      />
    );

    return (
      <ActionBar
        variant="warning"
        title="Guiding this conversation"
        description="You are guiding the AI agent in real time"
        actions={
          <>
            <Button variant="warning" className="gap-1.5" onClick={() => setState("reviewing")}>
              <StopCircle className="h-4 w-4" strokeWidth={1.5} />
              Stop Guiding
            </Button>
            <Button variant="outline" onClick={() => setState(null)}>Transfer</Button>
            <Button variant="destructive" onClick={() => setState(null)}>Takeover</Button>
          </>
        }
      />
    );
  },
};
