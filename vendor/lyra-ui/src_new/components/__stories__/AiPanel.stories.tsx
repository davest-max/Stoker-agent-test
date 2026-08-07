import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AiPanel } from "../ai-panel";
import { ConversationMessage, ConversationDateStamp } from "../conversation-message";
import { AIProcess } from "../ai-process";

const meta: Meta<typeof AiPanel> = {
  title: "UI/AiPanel",
  component: AiPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof AiPanel>;

const SUGGESTIONS = [
  { id: "1", label: "Create an AI Agent" },
  { id: "2", label: "See what has changed since yesterday" },
  { id: "3", label: "How can I manually configure AI Agents?" },
];

/* ── Empty / welcome state ── */
export const Welcome: Story = {
  name: "Welcome (empty state)",
  render: () => (
    <div style={{ height: 700, display: "flex", justifyContent: "flex-end" }}>
      <AiPanel
        userName="John"
        suggestions={SUGGESTIONS}
        historyContent={<HistoryList />}
        onSuggestion={(s) => alert(`Selected: ${s.label}`)}
        onClose={() => alert("Close")}
      />
    </div>
  ),
};

/* ── Active conversation ── */
export const WithConversation: Story = {
  name: "Active conversation",
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div style={{ width: 380, height: 700 }}>
        <AiPanel
          userName="John"
          inputProps={{ value, onChange: setValue, onSubmit: (v) => { setValue(""); alert(`Sent: ${v}`); } }}
        >
          <ConversationDateStamp label="Today" />
          <ConversationMessage variant="user" timestamp="9:31 AM">
            How do I create an AI Agent?
          </ConversationMessage>
          <ConversationMessage
            variant="ai"
            process={[
              { id: "1", label: "Searching documentation",     status: "done" },
              { id: "2", label: "Reviewing agent configuration", status: "done" },
              { id: "3", label: "Composing response",            status: "done" },
            ]}
          >
            To create an AI Agent, go to <strong>Admin → AI Agents → New Agent</strong>. Define the agent's name, select a model, and configure the skills and routing rules. Once saved, it will be available for assignment.
          </ConversationMessage>
          <ConversationMessage variant="user" timestamp="9:33 AM">
            What models are supported?
          </ConversationMessage>
          <ConversationMessage variant="ai">
            Currently supported models include GPT-4o, Claude 3.5, and Gemini 1.5 Pro. You can select the model per agent in the configuration panel.
          </ConversationMessage>
        </AiPanel>
      </div>
    );
  },
};

/* ── History ── */

const HISTORY = [
  { id: "h1",  title: "Create an AI Agent",                    date: "4:59 pm",  preview: "To create an AI Agent, go to Admin → AI Agents…" },
  { id: "h2",  title: "Configure routing rules",               date: "Tue",      preview: "Routing rules determine how contacts are distributed…" },
  { id: "h3",  title: "What changed since yesterday?",         date: "Tue",      preview: "There were 3 configuration changes and 1 new agent…" },
  { id: "h4",  title: "How to set up skills-based routing",    date: "Tue",      preview: "Skills-based routing matches contacts to agents…" },
  { id: "h5",  title: "Agent availability reporting",          date: "Mon",      preview: "To view availability reports, navigate to Analytics…" },
  { id: "h6",  title: "Escalation policy configuration",       date: "Fri",      preview: "Escalation policies define when and how contacts…" },
  { id: "h7",  title: "AI Agent sentiment thresholds",         date: "May 20",   preview: "You can adjust sentiment detection thresholds in…" },
  { id: "h8",  title: "Workforce management overview",         date: "May 6",    preview: "Workforce management helps you forecast and schedule…" },
  { id: "h9",  title: "Setting up outbound campaigns",         date: "May 6",    preview: "Outbound campaigns allow proactive customer outreach…" },
  { id: "h10", title: "Contact flow design best practices",    date: "Apr 3",    preview: "When designing contact flows, keep routing logic simple…" },
];

const HistoryList = () => (
  <>
    {HISTORY.map((item) => (
      <button
        key={item.id}
        type="button"
        className="text-left w-full px-3 py-2.5 rounded-lyra-md hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
      >
        <div className="flex items-baseline justify-between gap-2">
          <p className="lyra-body-md text-lyra-fg-default truncate">{item.title}</p>
          <span className="lyra-body-sm text-lyra-fg-secondary shrink-0">{item.date}</span>
        </div>
        <p className="lyra-body-sm text-lyra-fg-secondary truncate">{item.preview}</p>
      </button>
    ))}
  </>
);

export const History: Story = {
  name: "History",
  render: () => (
    <div style={{ width: 380, height: 700 }}>
      <AiPanel
        defaultView="history"
        historyContent={<HistoryList />}
        onClose={() => alert("Close")}
      />
    </div>
  ),
};

export const WithHistory: Story = {
  name: "With history toggle",
  render: () => (
    <div style={{ width: 380, height: 700 }}>
      <AiPanel
        userName="John"
        suggestions={SUGGESTIONS}
        historyContent={<HistoryList />}
        onClose={() => alert("Close")}
      />
    </div>
  ),
};
