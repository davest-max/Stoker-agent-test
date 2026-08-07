import type { Meta, StoryObj } from "@storybook/react";
import { useState, useEffect, useRef } from "react";
import * as ReactDOM from "react-dom";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { AppHeader } from "../app-header";
import { AppName } from "../app-name";
import { AppMenu, type AppMenuGroup } from "../app-menu";
import { AiPanel } from "../ai-panel";
import { CXoneLogo } from "../cxone-logo";
import { ActionIconButton } from "../actions";
import { Tooltip } from "../tooltip";
import { ProfileMenu, defaultProfileMenuGroups } from "../profile-menu";
import { AgentProfile, type AgentStatus } from "../agent-profile";
import { NotificationsBell } from "../notifications-bell";
import { DashboardIcon } from "../icons/dashboard-icon";
import { AiSparkleIcon } from "../icons/ai-sparkle-icon";
import { CircleHelp, Bell, Settings, Search } from "lucide-react";
import appIcon from "../../assets/app-icon.svg";

const meta: Meta<typeof AppHeader> = {
  title: "UI/AppHeader",
  component: AppHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof AppHeader>;

/* ── Shared app menu data + trigger — same groups/footer used by the
   "Agent Next Gen Header" story below, reused here so every story with a
   real AppName actually opens the AppMenu on click instead of just
   displaying a static, non-interactive label. ── */
const APP_MENU_GROUPS: AppMenuGroup[] = [
  {
    items: [
      { label: "Admin" },
      { label: "Supervisor" },
      { label: "Agent", active: true },
      { label: "Conginity AI" },
    ],
  },
  {
    items: [
      { label: "Workforce Management" },
      { label: "Quality Management" },
      { label: "Interaction Hub" },
      { label: "My Zone" },
    ],
  },
  {
    items: [
      { label: "Dashboard" },
      { label: "Analytics" },
    ],
  },
];

function AppNameWithMenu({ name, alt }: { name: string; alt: string }) {
  const [open, setOpen] = useState(false);
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <AppName
          icon={<img src={appIcon} alt={alt} className="h-6 w-6" />}
          name={name}
          aria-expanded={open}
        />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-[9999] animate-in fade-in-0 slide-in-from-top-2 duration-150 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-100"
        >
          <AppMenu groups={APP_MENU_GROUPS} footer={<CXoneLogo />} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/* ── Default ── */

export const Default: Story = {
  render: () => (
    <AppHeader
      appName={<AppNameWithMenu name="Agent Workspace Premium" alt="Desk" />}
      actions={
        <>
          <ActionIconButton size="xl" title="Help">
            <CircleHelp className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
          <ActionIconButton size="xl" title="Dashboards">
            <DashboardIcon className="text-lyra-fg-default" />
          </ActionIconButton>
          <ActionIconButton size="xl" title="Notifications" badge={4}>
            <Bell className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
          <ProfileMenu
            initials="JS"
            avatarColor="#5d6a79"
            groups={defaultProfileMenuGroups}
            className="ml-1"
          />
        </>
      }
    />
  ),
};

/* ── Agent Next Gen ── */

const INITIAL_NOTIFICATIONS = [
  { id: "1", type: "new-case"    as const, title: "New Case",    subtitle: "Noah Patel",    timestamp: "13m ago", read: false },
  { id: "2", type: "new-chat"    as const, title: "New Chat",    subtitle: "Sarah Miller",  timestamp: "18m ago", read: false },
  { id: "3", type: "escalation"  as const, title: "Escalation",  subtitle: "Lauren Kim",    timestamp: "24m ago", read: false },
  { id: "4", type: "new-case"    as const, title: "New Case",    subtitle: "Ethan Zhang",   timestamp: "37m ago", read: true  },
  { id: "5", type: "new-chat"    as const, title: "New Chat",    subtitle: "Olivia Reed",   timestamp: "51m ago", read: true  },
  { id: "6", type: "missed-call" as const, title: "Missed Call", subtitle: "David Brown",   timestamp: "1h ago",  read: true  },
  { id: "7", type: "escalation"  as const, title: "Escalation",  subtitle: "Sarah Johnson", timestamp: "1h ago",  read: true  },
  { id: "8", type: "new-case"    as const, title: "New Case",    subtitle: "James Carter",  timestamp: "2h ago",  read: true  },
];

export const AgentNextGen: Story = {
  name: "Agent Next Gen Header",
  render: () => {
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
    const [agentStatus, setAgentStatus] = useState<AgentStatus>("available");
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [appMenuOpen, setAppMenuOpen] = useState(false);
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [aiPanelPos, setAiPanelPos] = useState({ top: 0, left: 0 });
    const [aiPanelHeight, setAiPanelHeight] = useState(700);
    const aiBtnRef = useRef<HTMLButtonElement>(null);
    const AI_PANEL_WIDTH = 420;
    const MAX_PANEL_HEIGHT = 860;
    const BOTTOM_PADDING = 8;

    const computeAiHeight = (top: number) =>
      Math.min(window.innerHeight - top - BOTTOM_PADDING, MAX_PANEL_HEIGHT);

    const handleAiButtonClick = () => {
      if (aiBtnRef.current) {
        const rect = aiBtnRef.current.getBoundingClientRect();
        const top = rect.bottom + 6;
        setAiPanelPos({ top, left: rect.right - AI_PANEL_WIDTH });
        setAiPanelHeight(computeAiHeight(top));
      }
      setAiPanelOpen((v) => !v);
    };

    // Update AI panel height on viewport resize while open
    useEffect(() => {
      if (!aiPanelOpen) return;
      const onResize = () => setAiPanelHeight(computeAiHeight(aiPanelPos.top));
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [aiPanelOpen, aiPanelPos.top]);

    useEffect(() => {
      const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
      return () => clearInterval(interval);
    }, []);

    const h = Math.floor(elapsedSeconds / 3600);
    const m = Math.floor((elapsedSeconds % 3600) / 60);
    const s = elapsedSeconds % 60;
    const formattedTimer = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

    const handleStatusChange = (status: AgentStatus) => {
      setAgentStatus(status);
      setElapsedSeconds(0);
    };

    return (
      <>
      <AppHeader
        appName={
          <PopoverPrimitive.Root open={appMenuOpen} onOpenChange={setAppMenuOpen}>
            <PopoverPrimitive.Trigger asChild>
              <AppName
                icon={<img src={appIcon} alt="Agent Next Gen" className="h-6 w-6" />}
                name="Agent Next Gen"
                aria-expanded={appMenuOpen}
              />
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Content
                side="bottom"
                align="start"
                sideOffset={6}
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="z-[9999] animate-in fade-in-0 slide-in-from-top-2 duration-150 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-100"
              >
                <AppMenu groups={APP_MENU_GROUPS} footer={<CXoneLogo />} />
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>
        }
        actions={
          <>
            <NotificationsBell
              notifications={notifications}
              onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
              onClearAll={() => setNotifications([])}
              onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
              onNotificationClick={(n) => setNotifications((prev) => prev.map((i) => i.id === n.id ? { ...i, read: true } : i))}
            />
            <Tooltip content="Ask AI" placement="bottom" asLabel>
              <button
                ref={aiBtnRef}
                type="button"
                aria-label="Ask AI"
                aria-expanded={aiPanelOpen}
                onClick={handleAiButtonClick}
                className={`relative flex h-10 w-10 items-center justify-center rounded-lyra-lg text-lyra-fg-default transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus ${aiPanelOpen ? "bg-lyra-state-hover" : ""}`}
              >
                <AiSparkleIcon />
              </button>
            </Tooltip>
            <AgentProfile
              name="John Smith"
              initials="JS"
              status={agentStatus}
              onStatusChange={handleStatusChange}
              timer={formattedTimer}
              className="ml-1"
            />
          </>
        }
      />
      {aiPanelOpen && ReactDOM.createPortal(
        <div
          style={{ position: "fixed", top: aiPanelPos.top, left: aiPanelPos.left, zIndex: 9999 }}
          className="animate-in fade-in-0 slide-in-from-top-2 duration-150"
        >
          <AiPanel
            draggable
            draggableVariant="float"
            defaultDraggableWidth={AI_PANEL_WIDTH}
            defaultDraggableHeight={aiPanelHeight}
            userName="John"
            suggestions={[
              { id: "1", label: "Summarise this contact's history" },
              { id: "2", label: "Suggest a response to the customer" },
              { id: "3", label: "What changed since yesterday?" },
            ]}
            onClose={() => setAiPanelOpen(false)}
          />
        </div>,
        document.body
      )}
      </>
    );
  },
};

/* ── AppName Only ── */

export const AppNameOnly: Story = {
  name: "AppName Only",
  render: () => (
    <AppHeader appName={<AppNameWithMenu name="Agent Workspace Premium" alt="Desk" />} />
  ),
};

/* ── Actions Only ── */

export const ActionsOnly: Story = {
  name: "Actions Only",
  render: () => (
    <AppHeader
      appName={<div />}
      actions={
        <>
          <ActionIconButton size="xl" title="Search">
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
          <ActionIconButton size="xl" title="Settings">
            <Settings className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
          <ActionIconButton size="xl" title="Help">
            <CircleHelp className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
          <ActionIconButton size="xl" title="Dashboards">
            <DashboardIcon className="text-lyra-fg-default" />
          </ActionIconButton>
          <ActionIconButton size="xl" title="Notifications" badge={12}>
            <Bell className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
          <ProfileMenu
            initials="DB"
            avatarColor="#5d6a79"
            groups={defaultProfileMenuGroups}
            className="ml-1"
          />
        </>
      }
    />
  ),
};

/* ── With Background ── */

export const WithBackground: Story = {
  name: "With Background",
  render: () => (
    <AppHeader
      className="bg-lyra-bg-surface-base border-b border-lyra-border-subtle"
      appName={<AppNameWithMenu name="Agent Workspace Premium" alt="Desk" />}
      actions={
        <>
          <ActionIconButton size="xl" title="Help">
            <CircleHelp className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
          <ActionIconButton size="xl" title="Dashboards">
            <DashboardIcon className="text-lyra-fg-default" />
          </ActionIconButton>
          <ActionIconButton size="xl" title="Notifications" badge={4}>
            <Bell className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
          <ProfileMenu
            initials="JS"
            avatarColor="#5d6a79"
            groups={defaultProfileMenuGroups}
            className="ml-1"
          />
        </>
      }
    />
  ),
};
