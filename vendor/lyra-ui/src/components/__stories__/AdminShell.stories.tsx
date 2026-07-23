import type { Meta, StoryObj } from "@storybook/react";
import { useState, useRef, useEffect } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  Plus,
  Gauge,
  Settings,
  BarChart3,
  CircleHelp,
  Bell,
  PanelRight,
} from "lucide-react";
import type { DraggableVariant } from "../draggable";
import { AdminShell } from "../admin-shell";
import { Button } from "../button";
import { AiIcon } from "../icons/ai-icon";
import { AppHeader } from "../app-header";
import { AppName } from "../app-name";
import { AppMenu, type AppMenuGroup } from "../app-menu";
import { CXoneLogo } from "../cxone-logo";
import { LeftNav, type NavItem } from "../left-nav";
import { ContentArea } from "../content-area";
import { Container } from "../container";
import { ActionIconButton } from "../actions";
import { ProfileMenu, defaultProfileMenuGroups } from "../profile-menu";
import { DashboardIcon } from "../icons/dashboard-icon";
import { AiPanel, type AiPanelSuggestion } from "../ai-panel";
import appIcon from "../../assets/app-icon.svg";
import type { TreeMenuItem } from "../tree-menu";

/* ── Sample nav data (mirrors Outbound Engagement) ── */
const PANEL_ITEMS: TreeMenuItem[] = [
  { label: "Campaigns", active: true },
  { label: "Contact Lists" },
  { label: "Do Not Call" },
  { label: "Call Results" },
  { label: "Scripts" },
  { label: "Schedules" },
  { label: "Reports" },
  { label: "Settings" },
];

/* ── Sample left icon rail — same "Outbound Engagement Left Nav" set as
   LeftNav.stories.tsx (Monitor/Configure/Review, Monitor active), since
   this demo chrome's AppHeader already says "Outbound Engagement" too. ── */
const NAV_ITEMS: NavItem[] = [
  { icon: <Gauge className="h-4 w-4" strokeWidth={1.5} />, label: "Monitor", active: true },
  { icon: <Settings className="h-4 w-4" strokeWidth={1.5} />, label: "Configure" },
  { icon: <BarChart3 className="h-4 w-4" strokeWidth={1.5} />, label: "Review" },
];

/* ── App menu — same page-switcher content as lyra-ux-templates'
   Header.tsx (Agent Next Gen / Agent Workspace Premium / Outbound
   Engagement), with "Outbound Engagement" active since that's what this
   demo's AppHeader displays. Click-to-open wiring mirrors AppHeader.stories
   .tsx's AppNameWithMenu helper — duplicated locally rather than imported
   since story files don't import from one another. ── */
const APP_MENU_GROUPS: AppMenuGroup[] = [
  {
    items: [
      { label: "Agent Next Gen" },
      { label: "Agent Workspace Premium" },
      { label: "Outbound Engagement", active: true },
    ],
  },
];

function AppNameWithMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <AppName
          icon={<img src={appIcon} alt="" className="h-6 w-6" />}
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

const HEADER_ACTIONS = (
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
);

/**
 * Demo page chrome (top AppHeader + icon LeftNav + ContentArea/Container) so
 * the story shows what AdminShell looks like once dropped into a real app —
 * in production this outer chrome is supplied once by the app's own App.tsx
 * (see lyra-ux-templates' Header.tsx/Sidebar.tsx) and shared across every
 * page, so AdminShell itself only ever renders the inner page content.
 */
function AdminShellDemo({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader
        appName={<AppNameWithMenu name="Outbound Engagement" />}
        actions={HEADER_ACTIONS}
      />
      <div className="flex flex-1 overflow-hidden bg-lyra-bg-surface-shell">
        <LeftNav items={NAV_ITEMS} open={navOpen} onToggle={() => setNavOpen((v) => !v)} />
        <ContentArea className="min-w-0">
          <Container className="relative flex flex-1 overflow-hidden">
            {children}
          </Container>
        </ContentArea>
      </div>
    </div>
  );
}

const AI_PANEL_DEFAULT_WIDTH = 360;
const AI_SUGGESTIONS: AiPanelSuggestion[] = [
  { id: "1", label: "Summarise this campaign's performance" },
  { id: "2", label: "Draft a follow-up call script" },
  { id: "3", label: "What changed since yesterday?" },
];

/**
 * Same demo chrome as AdminShellDemo, plus a fully wired "Ask AI" panel using
 * the same docking/undocking + resize behavior as the Agent Next Gen
 * template (see AgentNextGenTemplate.stories.tsx) — draggable float mode by
 * default, dockable into the layout, resizable while docked.
 */
function AdminShellWithAiDemo({ children }: { children: (onAskAi: () => void) => React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  type PanelState = "closed" | "open" | "closing";

  const [aiPanelOpen,  setAiPanelOpen]  = useState(false);
  const [aiMounted,    setAiMounted]    = useState(false);
  const [aiState,      setAiState]      = useState<PanelState>("closed");
  const [aiVariant,    setAiVariant]    = useState<DraggableVariant>("docked");
  const [aiWidth,      setAiWidth]      = useState(AI_PANEL_DEFAULT_WIDTH);
  const [aiHeight,     setAiHeight]     = useState(860);
  const [aiIsResizing, setAiIsResizing] = useState(false);
  const aiFloatLeft = useRef<number | null>(null);
  const aiFloatTop  = useRef<number | null>(null);
  const aiPanelRef  = useRef<HTMLDivElement>(null);
  const aiAnimTimer = useRef<ReturnType<typeof setTimeout>>();

  const MAX_PANEL_HEIGHT = 860;
  const BOTTOM_PADDING   = 8;

  const computePanelHeight = () => {
    if (!containerRef.current) return MAX_PANEL_HEIGHT;
    const top = containerRef.current.getBoundingClientRect().top;
    return Math.min(window.innerHeight - top - BOTTOM_PADDING, MAX_PANEL_HEIGHT);
  };

  useEffect(() => {
    clearTimeout(aiAnimTimer.current);
    if (aiPanelOpen) {
      if (containerRef.current && aiFloatLeft.current === null) {
        const r = containerRef.current.getBoundingClientRect();
        aiFloatLeft.current = r.left + containerRef.current.offsetWidth - aiWidth - 16;
      }
      setAiHeight(computePanelHeight());
      setAiMounted(true);
      setAiState("open");
    } else {
      setAiState("closing");
      aiAnimTimer.current = setTimeout(() => setAiState("closed"), 150);
    }
    return () => clearTimeout(aiAnimTimer.current);
  }, [aiPanelOpen]);

  useEffect(() => {
    if (!aiPanelOpen) return;
    const onResize = () => setAiHeight(computePanelHeight());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [aiPanelOpen]);

  const handleAiVariantChange = (v: DraggableVariant) => {
    if (v === "docked" && aiPanelRef.current) {
      const r = aiPanelRef.current.getBoundingClientRect();
      aiFloatLeft.current = r.left;
      aiFloatTop.current  = r.top;
    }
    setAiVariant(v);
  };

  const getAiFloatStyle = (): React.CSSProperties => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = aiFloatLeft.current !== null
      ? aiFloatLeft.current
      : containerRef.current
        ? (rect?.left ?? 0) + containerRef.current.offsetWidth - aiWidth - 16
        : 0;
    const top = aiFloatTop.current !== null ? aiFloatTop.current : (rect?.top ?? 0);
    return { position: "fixed", top, left, zIndex: 9999 };
  };

  const aiPanel = aiMounted ? (
    <AiPanel
      ref={aiPanelRef}
      draggable
      draggableVariant={aiVariant}
      defaultDraggableWidth={aiWidth}
      defaultDraggableHeight={aiHeight}
      onVariantChange={handleAiVariantChange}
      onWidthChange={setAiWidth}
      onResizeStateChange={setAiIsResizing}
      userName="John"
      suggestions={AI_SUGGESTIONS}
      onClose={() => setAiPanelOpen(false)}
      className={aiVariant === "docked" ? "h-full" : undefined}
    />
  ) : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader
        appName={<AppNameWithMenu name="Outbound Engagement" />}
        actions={HEADER_ACTIONS}
      />
      <div className="flex flex-1 overflow-hidden bg-lyra-bg-surface-shell">
        <LeftNav items={NAV_ITEMS} open={navOpen} onToggle={() => setNavOpen((v) => !v)} />

        <ContentArea ref={containerRef} className="relative min-w-0">
          <Container className="relative flex flex-1 overflow-hidden">
            {children(() => setAiPanelOpen((v) => !v))}
          </Container>

          {/* AI panel — float (fixed position, doesn't take layout space) */}
          {aiVariant === "float" && aiMounted && (
            <div
              style={{
                ...getAiFloatStyle(),
                pointerEvents: "none",
                visibility: aiState === "closed" ? "hidden" : "visible",
                opacity: aiState === "open" ? 1 : 0,
                transform: aiState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: aiState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              <div style={{ pointerEvents: "auto" }}>{aiPanel}</div>
            </div>
          )}
        </ContentArea>

        {/* AI panel — docked (sibling of the content column so flex layout keeps it in-bounds) */}
        {aiVariant === "docked" && (
          <div className="pb-3" style={{
            width: aiState === "open" ? aiWidth : 0,
            marginRight: aiState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: aiIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{ width: aiWidth, display: aiState === "open" ? "block" : "none" }}
            >
              {aiPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Story ── */

const meta: Meta<typeof AdminShell> = {
  title: "Templates/Admin UIs",
  component: AdminShell,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof AdminShell>;

export const Default: Story = {
  name: "Admin UIs – Shell",
  render: () => (
    <AdminShellDemo>
      <AdminShell
        storageKeyPrefix="lyra_admin_shell_demo"
        navTitle="Outbound"
        navItems={PANEL_ITEMS}
        defaultLeftPinned
      >
        <div className="flex-1" />
      </AdminShell>
    </AdminShellDemo>
  ),
};

function WithPageHeaderStory() {
  const [interiorPanelOpen, setInteriorPanelOpen] = useState(false);

  return (
    <AdminShellWithAiDemo>
      {(onAskAi) => (
        <AdminShell
          storageKeyPrefix="lyra_admin_shell_demo"
          navTitle="Outbound"
          navItems={PANEL_ITEMS}
          defaultLeftPinned
          showPageHeader
          pageTitle="Campaigns"
          pageActions={
            <>
              <Button variant="outline">Secondary</Button>
              <Button>
                <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
                New Campaign
              </Button>
              <div className="mx-1 h-6 w-px bg-lyra-border-subtle" />
              <Button variant="outline" onClick={onAskAi}>
                <AiIcon className="h-4 w-4" />
                Ask AI
              </Button>
              <ActionIconButton
                title="Toggle details panel"
                onClick={() => setInteriorPanelOpen((v) => !v)}
              >
                <PanelRight className="h-5 w-5" strokeWidth={1.5} />
              </ActionIconButton>
            </>
          }
          interiorPanelOpen={interiorPanelOpen}
          onInteriorPanelClose={() => setInteriorPanelOpen(false)}
          interiorPanelContent={
            <div className="p-4">
              <p className="lyra-body-md text-lyra-fg-secondary">Panel content goes here.</p>
            </div>
          }
          rightPanelContent={
            <div className="p-4">
              <p className="lyra-body-md text-lyra-fg-secondary">Side panel content.</p>
            </div>
          }
        >
          <div className="flex-1" />
        </AdminShell>
      )}
    </AdminShellWithAiDemo>
  );
}

export const WithPageHeader: Story = {
  name: "Admin UIs – With Page Header",
  render: () => <WithPageHeaderStory />,
};
