import type { Meta, StoryObj } from "@storybook/react";
import { useState, useEffect } from "react";
import { AgentProfile, type AgentStatus } from "../agent-profile";
import type { ConnectedApp } from "../connected-apps";

const APPS: ConnectedApp[] = [
  { id: "sf",   name: "Salesforce",     initial: "S", latencyMs: 42,  uptimePct: 99.9, status: "healthy" },
  { id: "adp",  name: "ADP Workforce",  initial: "A", latencyMs: 88,  uptimePct: 99.7, status: "healthy" },
  { id: "o365", name: "Outlook 365",    initial: "O", latencyMs: 31,  uptimePct: 100,  status: "healthy" },
  { id: "mst",  name: "MS Teams",       initial: "T", latencyMs: 29,  uptimePct: 100,  status: "healthy" },
  { id: "zd",   name: "Zendesk",        initial: "Z", latencyMs: 340, uptimePct: 97.2, status: "warning" },
  { id: "jira", name: "Jira Cloud",     initial: "J", latencyMs: 67,  uptimePct: 99.8, status: "healthy" },
  { id: "gh",   name: "GitHub",         initial: "G", latencyMs: 55,  uptimePct: 99.5, status: "healthy" },
  { id: "sf2",  name: "ServiceNow",     initial: "S", latencyMs: 120, uptimePct: 98.1, status: "healthy" },
];

const meta: Meta<typeof AgentProfile> = {
  title: "UI/AgentProfile",
  component: AgentProfile,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof AgentProfile>;

function useTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export const Interactive: Story = {
  name: "Interactive",
  render: () => {
    const [status, setStatus] = useState<AgentStatus>("offline");
    const timer = useTimer(status !== "offline");
    return (
      <div className="p-8">
        <AgentProfile
          name="Sarah Johnson"
          initials="SJ"
          status={status}
          onStatusChange={setStatus}
          timer={timer}
          connectedApps={APPS}
          onReconnect={(id) => alert(`Reconnecting ${id}…`)}
          onDarkModeToggle={() => alert("Dark mode toggled")}
          onHelpClick={() => alert("Help")}
          onLogOut={() => alert("Log out")}
        />
      </div>
    );
  },
};

export const AllStatuses: Story = {
  name: "All statuses",
  render: () => (
    <div className="flex flex-col gap-4 p-8">
      {(["available","unavailable","offline"] as AgentStatus[]).map((s) => (
        <AgentProfile
          key={s}
          name="Sarah Johnson"
          initials="SJ"
          status={s}
          timer="00:04:22"
          connectedAppsCount={1}
        />
      ))}
    </div>
  ),
};

export const WithAvatar: Story = {
  name: "With avatar photo",
  render: () => {
    const [status, setStatus] = useState<AgentStatus>("available");
    return (
      <div className="p-8">
        <AgentProfile
          name="Greg Martinez"
          initials="GM"
          avatarSrc="https://i.pravatar.cc/150?img=12"
          status={status}
          onStatusChange={setStatus}
          timer="00:00:11"
          connectedAppsCount={1}
          onLogOut={() => alert("Log out")}
        />
      </div>
    );
  },
};
