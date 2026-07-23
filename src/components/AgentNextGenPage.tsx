import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  AppHeader,
  AppName,
  AppMenu,
  CXoneLogo,
  AiPanel,
  NotificationsBell,
  AgentNotifications,
  AgentProfile,
  Container,
  SidePanel,
  ActionIconButton,
  LeftNav,
  InteractionNavItem,
  InteriorPanel,
  AgentDashboard,
  AgentDashboardQueueDrilldown,
  AGENT_DASHBOARD_QUEUE_ITEMS,
  AGENT_DASHBOARD_QUEUE_SUB_ITEMS,
  type AgentStatus,
  type AppMenuGroup,
  type AgentNotification,
  type DraggableVariant,
  type InteractionChannel,
  type ChannelType,
  type AgentDashboardContactHistoryEntry,
} from "@nicecxone/lyra-ui";
import appIcon from "@/assets/app-icon.svg";
import {
  CustomerInteractionPanel,
  InteractionHeader,
  InteractionInfoBar,
  InteractionActionsBar,
  NavIconButton,
  type EscalationStatus,
  type Message,
  type SlideInDestination,
  type FullPageDestination,
  type NavDestination,
} from "@/components/CustomerInteractionPanel";
import { SlideInPage, SlideInPlaceholder } from "@/components/SlideInPage";
import { NewOutboundPopover, type NewOutboundConfig } from "@/components/NewOutboundPopover";
import { InternalChatTrigger, InternalChatDockedPanel, InternalChatFloatPanel, type ChatView } from "@/components/InternalChatPopover";
import { INITIAL_FAVORITE_EMPLOYEE_IDS, INITIAL_CHAT_THREADS, type InternalChatMessage } from "@/data/internalChat";
import { DirectoryPage } from "@/components/DirectoryPage";
import { CustomerSnapshotPanel } from "@/components/CustomerSnapshotPanel";
import {
  DIRECTORY_CUSTOMERS,
  DIRECTORY_AGENTS,
  DIRECTORY_SKILLS,
  DIRECTORY_TEAMS,
  OUTBOUND_GROUPS,
  type DirectoryCustomer,
  type DirectoryAgent,
  type CustomerNote,
} from "@/data/directory";
import {
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  BookUser,
  Users,
  CalendarDays,
  LayoutGrid,
  Settings,
  X,
} from "lucide-react";

/** Title + icon for each right-side slide-in destination — Directory has
 *  real content (DirectoryPage below); the rest render SlideInPlaceholder.
 *  Settings/Dashboard aren't here — they take over the content column
 *  instead of sliding in (see FULL_PAGE_META below). */
const SLIDE_IN_META: Record<SlideInDestination, { title: string; icon: React.ReactNode }> = {
  contacts: { title: "Contacts", icon: <Users className="h-4 w-4" strokeWidth={1.5} /> },
  directory: { title: "Directory", icon: <BookUser className="h-4 w-4" strokeWidth={1.5} /> },
  schedule: { title: "Schedule", icon: <CalendarDays className="h-4 w-4" strokeWidth={1.5} /> },
};

/** Title for each full-page takeover destination — shown as the header's h1. */
const FULL_PAGE_META: Record<FullPageDestination, { title: string }> = {
  settings: { title: "Settings" },
  dashboard: { title: "Control Center" },
};

const FULL_PAGE_DESTINATIONS = new Set<NavDestination>(["settings", "dashboard"]);

/** Shared shape for a pinned rail nav row — used for both Control Center
 *  (in `header`, just under "New Outbound") and Settings (in `footer`,
 *  pinned bottom-left — same spot it's always occupied, just recreated
 *  here instead of the plain icon-only `NavIconButton` it used to be, so
 *  it now matches Control Center's icon size and expand/collapse
 *  behavior instead of its own larger, always-icon-only treatment).
 *  Collapses to an icon-only square button when the rail is collapsed and
 *  expands to icon + label text when the rail is expanded, animating the
 *  label open the same way `NewOutboundPopover`'s own trigger button does
 *  — but styled as a regular nav destination (neutral, not primary/CTA-
 *  colored) and using `TreeMenuRow`'s leaf-active treatment (moderate bg +
 *  left accent bar) when active, for visual consistency with the rail's
 *  other expanded-state nav rows. */
function RailNavButton({
  icon: Icon,
  label,
  expanded,
  active,
  onClick,
  className,
}: {
  icon: typeof Settings;
  label: string;
  expanded?: boolean;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "relative flex h-9 flex-shrink-0 items-center gap-2.5 overflow-hidden rounded-lyra-sm transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
        expanded ? "w-full px-2.5" : "w-9 justify-center px-0",
        active
          ? "bg-lyra-bg-active-moderate text-lyra-fg-active-strong lyra-body-md-emphasis hover:bg-lyra-bg-active-moderate active:bg-lyra-bg-active-subtle"
          : "text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
        className
      )}
    >
      {active && expanded && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-lyra-border-active"
        />
      )}
      <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span
        aria-hidden={!expanded}
        className={cn(
          "lyra-body-md truncate overflow-hidden whitespace-nowrap transition-all duration-200",
          expanded ? "max-w-[180px] opacity-100" : "max-w-0 opacity-0"
        )}
      >
        {label}
      </span>
    </button>
  );
}

/* ── App menu builder (needs onNavigate so built inside the component) ── */

function buildAppMenuGroups(onNavigate?: (page: Page) => void): AppMenuGroup[] {
  return [
    {
      items: [
        { label: "My New Project", active: true },
        { label: "Agent Workspace Premium", onClick: () => onNavigate?.("agent-workspace") },
        { label: "Outbound Engagement", onClick: () => onNavigate?.("outbound") },
      ],
    },
  ];
}

/* ── New Outbound config ──
   Feeds `NewOutboundPopover` (src/components/NewOutboundPopover.tsx) — a
   local replacement for lyra-ui's `CreateNew` outbound flow, built to add
   back the one thing the `groups`-based CreateNewOutboundConfig has no
   equivalent for: a "no match found in directory" screen for an unmatched
   phone/email typed into search (`onStartUnmatchedOutbound` below). Groups
   are built from directory.ts, reused rather than a parallel fixture. */

const OUTBOUND_CONFIG: NewOutboundConfig = {
  groups: OUTBOUND_GROUPS,
  channelOptions: [
    { id: "voice",    label: "Call",     selectLabel: "Voice", icon: <Phone         className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "sms",      label: "SMS",                            icon: <MessageSquare className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "whatsapp", label: "WhatsApp",                       icon: <MessageCircle className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "email",    label: "Email",                          icon: <Mail          className="h-5 w-5" strokeWidth={1.5} /> },
  ],
  phoneOptions: [
    { value: "+14563833329", label: "(456) 383-3329" },
    { value: "+14565559981", label: "(456) 555-9981" },
    { value: "+14565550147", label: "(456) 555-0147" },
  ],
  skillOptions: [
    { value: "general", label: "General Support" },
    { value: "technical", label: "Technical Support" },
    { value: "billing", label: "Billing" },
    { value: "sales", label: "Sales" },
    { value: "escalations", label: "Escalations" },
    { value: "vip", label: "VIP Support" },
  ],
  onStartCall: (selection) => {
    // eslint-disable-next-line no-console
    console.log(
      "Start call:",
      selection.channel,
      "→",
      selection.contact.name,
      `(phone: ${selection.phone}, skill: ${selection.skillId})`
    );
  },
  onStartUnmatchedOutbound: (input) => {
    // eslint-disable-next-line no-console
    console.log("Start unmatched outbound:", input.channel, "→", input.value, `(skill: ${input.skillId})`);
  },
};

/* ── Assignment cards (LeftNav header, below CreateNew) ──
   Mirrors lyra-ui's own "Agent Next Gen Left Nav" story — a list of
   InteractionNavItem cards representing the agent's current interaction
   assignments. `channels[].preview` carries the routing skill name (same
   convention documented in InteractionNavItem's own stories), not a message
   preview. */

interface Assignment {
  id: string;
  customerName?: string;
  /** Links to a DIRECTORY_CUSTOMERS record for the Customer Snapshot panel —
   *  undefined when the caller/customer isn't identified (e.g. the voice
   *  assignment below). */
  customerId?: string;
  elapsed: string;
  awaitingResponse?: boolean;
  issueSummary: string;
  subject: string;
  caseId: string;
  channels: InteractionChannel[];
  escalationStatus: EscalationStatus;
  messages: Message[];
}

/** The logged-in agent (matches the AgentProfile name in the top app header)
 *  — used as the senderName for every support-agent message below. */
const CURRENT_AGENT_NAME = "John Smith";

const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: "sofia",
    customerName: "Sofia Martinez",
    customerId: "sofia",
    elapsed: "08:27",
    awaitingResponse: true,
    issueSummary: "Mobile app crashes every time she tries to upload a receipt photo for an expense report.",
    subject: "Receipt photo upload crashes app",
    caseId: "CASE-48213",
    channels: [{ type: "chat", elapsed: "08:27", current: true, awaitingResponse: true, preview: "Chat_General" }],
    escalationStatus: "escalated",
    messages: [
      { id: "1", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 08:19AM · Chat", text: "Hi Sofia — I understand you're having trouble uploading a receipt photo. What's happening exactly?" },
      { id: "2", variant: "customer", senderName: "Sofia Martinez", timestamp: "Today, 08:20AM · Chat", text: "Every time I try to attach a photo for an expense report, the app just crashes.", alert: { message: "Frustrated sentiment detected", severity: "warning" } },
      { id: "3", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 08:21AM · Chat", text: "Sorry about that. Can you tell me your phone model and the app version under Settings → About?" },
      { id: "4", variant: "customer", senderName: "Sofia Martinez", timestamp: "Today, 08:23AM · Chat", text: "iPhone 14, and the app says version 4.2.1." },
      { id: "5", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 08:25AM · Chat", text: "That's a known issue in 4.2.1 with large images — updating to 4.2.3 should fix it. I'm also filing a ticket so our team adds better error handling for this." },
      { id: "6", variant: "customer", senderName: "Sofia Martinez", timestamp: "Today, 08:26AM · Chat", text: "Okay, updating now. I really need to submit this report today though.", alert: { message: "Frustrated sentiment detected", severity: "warning" } },
      { id: "7", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 08:27AM · Chat", text: "Understood — I'll stay on the line while you update, just in case." },
    ],
  },
  {
    id: "ray",
    customerName: "Ray Torres",
    customerId: "ray",
    elapsed: "06:12",
    awaitingResponse: true,
    issueSummary: "Disputing a duplicate charge that appeared twice on last month's invoice.",
    subject: "Duplicate subscription charge",
    caseId: "CASE-48097",
    channels: [{ type: "email", elapsed: "06:12", current: true, preview: "CXi SME Email" }],
    escalationStatus: "in-progress",
    messages: [
      { id: "1", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 06:05AM · Email", text: "Hi Ray, thanks for reaching out about the duplicate charge on your invoice." },
      { id: "2", variant: "customer", senderName: "Ray Torres", timestamp: "Today, 06:07AM · Email", text: "Yes, I was charged twice for my subscription this month — $49.99 each time.", alert: { message: "Frustrated sentiment detected", severity: "warning" } },
      { id: "3", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 06:10AM · Email", text: "I can confirm there are two identical charges on 6/2. I've issued a refund for the duplicate — it should post within 3-5 business days." },
      { id: "4", variant: "customer", senderName: "Ray Torres", timestamp: "Today, 06:11AM · Email", text: "Thank you, I appreciate the quick help." },
      { id: "5", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 06:12AM · Email", text: "Of course — I've also flagged your account to prevent this from happening again." },
    ],
  },
  {
    id: "call",
    elapsed: "02:05",
    issueSummary: "Calling about a shipment that hasn't arrived — tracking shows no movement in 5 days.",
    subject: "Shipment tracking shows no movement",
    caseId: "CASE-48350",
    channels: [{ type: "voice", elapsed: "02:05", current: true, preview: "CXoneSMS_1-833-457-2672" }],
    escalationStatus: "resolved",
    messages: [
      { id: "1", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 02:00AM · Voice", text: "Thanks for calling — I can see your package has been in transit for 5 days with no movement. Let me look into this." },
      { id: "2", variant: "customer", senderName: "Customer", timestamp: "Today, 02:02AM · Voice", text: "This is really frustrating, I needed this for a trip this weekend.", alert: { message: "Critical sentiment detected", severity: "critical" } },
      { id: "3", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 02:04AM · Voice", text: "I completely understand. I'm filing a lost-package claim with the carrier right now and will overnight a replacement at no cost." },
      { id: "4", variant: "customer", senderName: "Customer", timestamp: "Today, 02:05AM · Voice", text: "Okay, thank you for taking care of this." },
      { id: "5", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 02:05AM · Voice", text: "You're welcome — you'll get a confirmation email with tracking within the hour." },
    ],
  },
];

/* ── Notifications ── (no mock records — starts empty) */

const INITIAL_NOTIFICATIONS: AgentNotification[] = [];

/* ── AgentNextGenPage ── */

type Page = "agent-workspace" | "agent" | "outbound";

const AI_PANEL_DEFAULT_WIDTH = 360;
/** Matches `InternalChatFloatPanel`'s own default size — used here only to
 *  clamp the float's initial position to the viewport before it mounts. */
const CHAT_FLOAT_WIDTH = 380;
const CHAT_FLOAT_HEIGHT = 560;
/** Below this viewport width the nav rail can't stay expanded — used both
 *  to pick navOpen's initial state and to auto-collapse it on resize. */
const NAV_NARROW_BREAKPOINT = 1280;

export function AgentNextGenPage({
  showPageHeader = false,
  showPanelToggle = false,
  onNavigate,
}: {
  showPageHeader?: boolean;
  showPanelToggle?: boolean;
  onNavigate?: (page: Page) => void;
}) {
  // Expanded by default — unless the viewport is already too narrow at
  // mount, in which case starting expanded would just auto-collapse a tick
  // later (see the isNavNarrow effect below), producing a visible flash.
  const [navOpen, setNavOpen] = useState(() => window.innerWidth >= NAV_NARROW_BREAKPOINT);
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | undefined>(INITIAL_ASSIGNMENTS[0]?.id);
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("available");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.getAttribute("data-theme") === "dark"
  );

  const handleDarkModeToggle = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
      return next;
    });
  };

  const appMenuGroups = buildAppMenuGroups((page) => {
    setAppMenuOpen(false);
    onNavigate?.(page);
  });

  /* Panel animation state machine — see AgentNextGenTemplate.stories.tsx for full comment */
  type PanelState = "closed" | "open" | "closing";

  /* AI panel state */
  const [aiPanelOpen,  setAiPanelOpen]  = useState(false);
  const [aiMounted,    setAiMounted]    = useState(false);
  const [aiState,      setAiState]      = useState<PanelState>("closed");
  const [aiVariant,    setAiVariant]    = useState<DraggableVariant>("float");
  const [aiWidth,      setAiWidth]      = useState(AI_PANEL_DEFAULT_WIDTH);
  const [aiHeight,     setAiHeight]     = useState(860);
  const [aiIsResizing, setAiIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const aiFloatLeft  = useRef<number | null>(null);
  const aiFloatTop   = useRef<number | null>(null);
  const aiPanelRef   = useRef<HTMLDivElement>(null);
  const aiAnimTimer  = useRef<ReturnType<typeof setTimeout>>();

  /* Notifications panel state */
  const [notifOpen,       setNotifOpen]       = useState(false);
  const [notifMounted,    setNotifMounted]    = useState(false);
  const [notifState,      setNotifState]      = useState<PanelState>("closed");
  const [notifVariant,    setNotifVariant]    = useState<DraggableVariant>("float");
  const [notifWidth,      setNotifWidth]      = useState(360);
  const [notifHeight,     setNotifHeight]     = useState(860);
  const [notifIsResizing, setNotifIsResizing] = useState(false);
  const [topPanel,        setTopPanel]        = useState<"ai" | "notif" | null>(null);
  const notifFloatLeft = useRef<number | null>(null);
  const notifFloatTop  = useRef<number | null>(null);
  const notifPanelRef  = useRef<HTMLDivElement>(null);
  const notifAnimTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Internal chat state — popover by default; can dock to the side like AI
   *  Assistant/Notifications (single-dock rule applies across all three).
   *  The header's own "Undock" toggle still has no floating step in
   *  between (pops straight back to the anchored popover) — but a separate
   *  entry point (New Outbound's Agents chat icon) can open a genuine
   *  floating window near wherever it was clicked; see `chatFloatPosition`
   *  and `openInternalChatWith` below. */
  const [chatOpen,        setChatOpen]        = useState(false);
  const [chatDocked,      setChatDocked]      = useState(false);
  const [chatFloatPosition, setChatFloatPosition] = useState<{ top: number; left: number } | null>(null);
  const [chatWidth,       setChatWidth]       = useState(380);
  const [chatIsResizing,  setChatIsResizing]  = useState(false);
  const [chatView,        setChatView]        = useState<ChatView>({ kind: "list" });
  const [chatSearch,      setChatSearch]      = useState("");
  const [chatFavoriteIds, setChatFavoriteIds] = useState<string[]>(INITIAL_FAVORITE_EMPLOYEE_IDS);
  const [chatThreads,     setChatThreads]     = useState<Record<string, InternalChatMessage[]>>(INITIAL_CHAT_THREADS);
  const [chatDraft,       setChatDraft]       = useState("");

  /* Right-side nav destinations — one per header nav icon. Most slide in
   *  beside the interaction; Settings/Dashboard instead take over the whole
   *  content column (see FULL_PAGE_DESTINATIONS/isFullPageActive below).
   *  `lastSlideIn` lags behind `openSlideInPage` on close so a slide-in's
   *  title/icon/content don't blank out mid-way through the width-collapse
   *  animation — only relevant for the slide-in destinations, so it's never
   *  updated for a full-page one. */
  const [openSlideInPage, setOpenSlideInPage] = useState<NavDestination | null>(null);
  const [lastSlideIn, setLastSlideIn] = useState<SlideInDestination>("directory");

  /* Slide-in panel (Contacts/Directory/Schedule) — same float/dock state
   *  machine as the AI panel/Notifications above, built on `SlideInPage`'s
   *  own `DraggablePanel` shell. Deliberately NOT wired into those two's
   *  single-dock-rule/`topPanel` z-index coordination: this panel docks
   *  *inside* the interaction's own content column (next to
   *  CustomerInteractionPanel), not at the outer app-shell edge the way
   *  AI/Notifications/Chat do, so a docked slide-in and a docked AI panel
   *  don't actually compete for the same screen real estate — nothing
   *  forces them to stay mutually exclusive the way AI/Notifications/Chat
   *  do among themselves. */
  const [slideInVariant,    setSlideInVariant]    = useState<DraggableVariant>("docked");
  const [slideInMounted,    setSlideInMounted]    = useState(false);
  const [slideInState,      setSlideInState]      = useState<PanelState>("closed");
  const [slideInWidth,      setSlideInWidth]      = useState(600);
  const [slideInHeight,     setSlideInHeight]     = useState(860);
  const [slideInIsResizing, setSlideInIsResizing] = useState(false);
  const slideInFloatLeft = useRef<number | null>(null);
  const slideInFloatTop  = useRef<number | null>(null);
  const slideInPanelRef  = useRef<HTMLDivElement>(null);
  const slideInAnimTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Control Center (dashboard) — queue widget drill-down selection, mirrors
   *  lyra-ui's own Templates/Dashboards story exactly (AgentDashboard +
   *  InteriorPanel + AgentDashboardQueueDrilldown). */
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const handleNavClick = (item: NavDestination) => {
    setOpenSlideInPage((v) => {
      const next = v === item ? null : item;
      if (next && !FULL_PAGE_DESTINATIONS.has(next)) setLastSlideIn(next as SlideInDestination);
      return next;
    });
  };
  const isFullPageActive = openSlideInPage !== null && FULL_PAGE_DESTINATIONS.has(openSlideInPage);
  const handleDirectoryContactAction = (contact: DirectoryCustomer | DirectoryAgent, channel: ChannelType) => {
    // eslint-disable-next-line no-console
    console.log("Directory contact action:", channel, contact.name);
  };

  /* Customer Snapshot (left "Designer" panel) — notes live here (not in the
   *  panel component) so they're a single source of truth regardless of
   *  which Panel instance (pinned/unpinned) is currently rendering it. */
  const [customerNotes, setCustomerNotes] = useState<Record<string, CustomerNote[]>>(() =>
    Object.fromEntries(DIRECTORY_CUSTOMERS.map((c) => [c.id, c.notes ?? []]))
  );
  const handleAddCustomerNote = (customerId: string, text: string) => {
    setCustomerNotes((prev) => ({
      ...prev,
      [customerId]: [{ id: `n${Date.now()}`, author: CURRENT_AGENT_NAME, timestamp: "Just now", text }, ...(prev[customerId] ?? [])],
    }));
  };
  const handleSnapshotContactAction = (channel: ChannelType) => {
    // eslint-disable-next-line no-console
    console.log("Customer snapshot contact action:", channel);
  };

  /* Side panel — lyra-ui's CreateNew no longer supports a "view customer
   *  card" action from an outbound search result (dropped along with the
   *  flat-search API this app used to build OUTBOUND_CONFIG against — see
   *  the comment above it), so this panel now only ever shows the active
   *  interaction's own customer. */
  const [sidePanelOpen,      setSidePanelOpen]      = useState(false);
  const [sidePanelWidth,     setSidePanelWidth]     = useState(256);

  // Clear any open queue drill-down once Control Center isn't on screen, so
  // reopening it later doesn't resurrect a stale InteriorPanel selection.
  useEffect(() => {
    if (openSlideInPage !== "dashboard") setSelectedQueueId(null);
  }, [openSlideInPage]);

  // Track window width for nav overlay breakpoint
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isNavNarrow = windowWidth < NAV_NARROW_BREAKPOINT;
  const isCompactHeader = windowWidth < 760;

  // Auto-collapse the expanded nav when viewport drops below NAV_NARROW_BREAKPOINT
  useEffect(() => {
    if (isNavNarrow && navOpen) setNavOpen(false);
  }, [isNavNarrow]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close and undock any docked panels when viewport drops below 1280px
  useEffect(() => {
    if (isNavNarrow) {
      if (aiVariant === "docked") {
        setAiVariant("float");
        setAiPanelOpen(false);
      }
      if (notifVariant === "docked") {
        setNotifVariant("float");
        setNotifOpen(false);
      }
      if (chatDocked) {
        setChatDocked(false);
        setChatOpen(false);
      }
    }
  }, [isNavNarrow]); // eslint-disable-line react-hooks/exhaustive-deps

  const MAX_PANEL_HEIGHT = 860;
  const BOTTOM_PADDING   = 8;

  const computePanelHeight = () => {
    if (!containerRef.current) return MAX_PANEL_HEIGHT;
    const top = containerRef.current.getBoundingClientRect().top;
    return Math.min(window.innerHeight - top - BOTTOM_PADDING, MAX_PANEL_HEIGHT);
  };

  /* Timer */
  useEffect(() => {
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(elapsedSeconds / 3600);
  const m = Math.floor((elapsedSeconds % 3600) / 60);
  const s = elapsedSeconds % 60;
  const formattedTimer = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  const handleStatusChange = (status: AgentStatus) => {
    setAgentStatus(status);
    setElapsedSeconds(0);
  };

  const activeAssignment = assignments.find((a) => a.id === activeAssignmentId);
  const isActiveAssignmentVoiceCall = activeAssignment?.channels.some((c) => c.current && c.type === "voice") ?? false;
  const activeCustomer = DIRECTORY_CUSTOMERS.find((c) => c.id === activeAssignment?.customerId);

  const handleEscalationStatusChange = (assignmentId: string, status: EscalationStatus) => {
    setAssignments((prev) => prev.map((a) => (a.id === assignmentId ? { ...a, escalationStatus: status } : a)));
  };

  // Switching interactions always lands back on the Chat tab — seeing a
  // different customer's history tab still open after switching would be odd.
  const handleSelectAssignment = (id: string) => {
    setActiveAssignmentId(id);
    setActiveTab("chat");
    setCustomerCardOverrideId(undefined);
    // Selecting an assignment card always returns to the interaction view —
    // if Settings/Dashboard currently has the screen, close it. Other
    // slide-ins (Directory, etc.) are left alone since they can coexist
    // beside an interaction.
    setOpenSlideInPage((v) => (v !== null && FULL_PAGE_DESTINATIONS.has(v) ? null : v));
  };

  // Unassign & Dismiss (header kebab menu) — clears the active interaction
  // entirely; any open slide-in page (e.g. Directory) then fills the
  // content column since there's no interaction left to dock beside.
  const handleCloseInteraction = () => {
    setActiveAssignmentId(undefined);
  };

  /* AI panel show/hide */
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
      setTopPanel("ai");
    } else {
      setAiState("closing");
      aiAnimTimer.current = setTimeout(() => setAiState("closed"), 150);
    }
    return () => clearTimeout(aiAnimTimer.current);
  }, [aiPanelOpen]);

  /* Shrink panel height with viewport when open */
  useEffect(() => {
    if (!aiPanelOpen) return;
    const onResize = () => setAiHeight(computePanelHeight());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [aiPanelOpen]);

  /* Notifications panel show/hide — same state machine as AI panel */
  useEffect(() => {
    clearTimeout(notifAnimTimer.current);
    if (notifOpen) {
      if (containerRef.current && notifFloatLeft.current === null) {
        const r = containerRef.current.getBoundingClientRect();
        notifFloatLeft.current = r.left + containerRef.current.offsetWidth - notifWidth - 16;
      }
      setNotifHeight(computePanelHeight());
      setNotifMounted(true);
      setNotifState("open");
      setTopPanel("notif");
    } else {
      setNotifState("closing");
      notifAnimTimer.current = setTimeout(() => setNotifState("closed"), 150);
    }
    return () => clearTimeout(notifAnimTimer.current);
  }, [notifOpen]);

  useEffect(() => {
    if (!notifOpen) return;
    const onResize = () => setNotifHeight(computePanelHeight());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [notifOpen]);

  /* Slide-in panel show/hide — same state machine as the AI panel/
   *  Notifications above, keyed off whether a slide-in destination
   *  (Contacts/Directory/Schedule) is open beside an active interaction —
   *  `isFullPageActive` destinations (Settings/Dashboard) use the "full"
   *  variant instead, which has no dock/float state of its own. */
  const slideInOpen = openSlideInPage !== null && !isFullPageActive;
  useEffect(() => {
    clearTimeout(slideInAnimTimer.current);
    if (slideInOpen) {
      if (containerRef.current && slideInFloatLeft.current === null) {
        const r = containerRef.current.getBoundingClientRect();
        slideInFloatLeft.current = r.left + containerRef.current.offsetWidth - slideInWidth - 16;
      }
      setSlideInHeight(computePanelHeight());
      setSlideInMounted(true);
      setSlideInState("open");
    } else {
      setSlideInState("closing");
      slideInAnimTimer.current = setTimeout(() => setSlideInState("closed"), 150);
    }
    return () => clearTimeout(slideInAnimTimer.current);
  }, [slideInOpen]);

  useEffect(() => {
    if (!slideInOpen) return;
    const onResize = () => setSlideInHeight(computePanelHeight());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [slideInOpen]);

  // Capture rendered float position before docking, mirroring
  // handleNotifVariantChange/handleAiVariantChange below — but with no
  // single-dock-rule cross-checks against those two (see the state's own
  // doc comment above for why).
  const handleSlideInVariantChange = (v: DraggableVariant) => {
    if (v === "docked" && slideInPanelRef.current) {
      const r = slideInPanelRef.current.getBoundingClientRect();
      slideInFloatLeft.current = r.left;
      slideInFloatTop.current  = r.top;
    }
    setSlideInVariant(v);
  };

  const getSlideInFloatStyle = (): React.CSSProperties => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = slideInFloatLeft.current !== null
      ? slideInFloatLeft.current
      : containerRef.current
        ? (rect?.left ?? 0) + containerRef.current.offsetWidth - slideInWidth - 16
        : 0;
    const top = slideInFloatTop.current !== null
      ? slideInFloatTop.current
      : (rect?.top ?? 0);
    return { position: "fixed", top, left, zIndex: 9999 };
  };

  const handleNotifVariantChange = (v: DraggableVariant) => {
    // When docking: capture actual rendered position (includes CSS transform drag offset)
    // before the float wrapper unmounts. This is restored when undocking.
    if (v === "docked" && notifPanelRef.current) {
      const r = notifPanelRef.current.getBoundingClientRect();
      notifFloatLeft.current = r.left;
      notifFloatTop.current  = r.top;
    }
    // Single-dock rule: if docking and AI panel is already docked, force AI to float.
    // AI has no float wrapper right now so fall back to a computed default position.
    if (v === "docked" && aiVariant === "docked" && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      aiFloatLeft.current = r.left + containerRef.current.offsetWidth - aiWidth - 16;
      aiFloatTop.current  = null; // use computed default top
      setAiVariant("float");
    }
    // Single-dock rule: chat has no float mode, so docking here just undocks it
    // (pops back into its own anchored popover) rather than forcing a float position.
    if (v === "docked" && chatDocked) setChatDocked(false);
    setNotifVariant(v);
  };

  const getNotifFloatStyle = (): React.CSSProperties => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = notifFloatLeft.current !== null
      ? notifFloatLeft.current
      : containerRef.current
        ? (rect?.left ?? 0) + containerRef.current.offsetWidth - notifWidth - 16
        : 0;
    const top = notifFloatTop.current !== null
      ? notifFloatTop.current
      : (rect?.top ?? 0);
    return {
      position: "fixed",
      top,
      left,
      zIndex: topPanel === "notif" ? 10000 : 9999,
    };
  };

  const notifPanel = notifMounted ? (
    <AgentNotifications
      ref={notifPanelRef}
      notifications={notifications}
      draggableVariant={notifVariant}
      onVariantChange={handleNotifVariantChange}
      onWidthChange={setNotifWidth}
      onResizeStateChange={setNotifIsResizing}
      onInteract={() => setTopPanel("notif")}
      onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
      onClearAll={() => setNotifications([])}
      onDismiss={(id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      onNotificationClick={(n: AgentNotification) =>
        setNotifications((prev) => prev.map((i) => i.id === n.id ? { ...i, read: true } : i))
      }
      onClose={() => setNotifOpen(false)}
      defaultWidth={notifWidth}
      maxWidth={600}
      height={notifHeight}
    />
  ) : null;

  const handleAiVariantChange = (v: DraggableVariant) => {
    // When docking: capture actual rendered position (includes CSS transform drag offset)
    // before the float wrapper unmounts. This is restored when undocking.
    if (v === "docked" && aiPanelRef.current) {
      const r = aiPanelRef.current.getBoundingClientRect();
      aiFloatLeft.current = r.left;
      aiFloatTop.current  = r.top;
    }
    // Single-dock rule: if docking and notif panel is already docked, force notif to float.
    // Notif has no float wrapper right now so fall back to a computed default position.
    if (v === "docked" && notifVariant === "docked" && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      notifFloatLeft.current = r.left + containerRef.current.offsetWidth - notifWidth - 16;
      notifFloatTop.current  = null; // use computed default top
      setNotifVariant("float");
    }
    // Single-dock rule: chat has no float mode, so docking here just undocks it.
    if (v === "docked" && chatDocked) setChatDocked(false);
    setAiVariant(v);
  };

  /* Chat: docking here undocks AI/Notifications if either is currently docked
   *  (single-dock rule); chat itself has no float mode, so its own
   *  onVariantChange just toggles chatDocked (see InternalChatDockedPanel's
   *  "Undock" button, which fires v === "float"). */
  const handleChatVariantChange = (v: DraggableVariant) => {
    if (v === "float") {
      setChatDocked(false);
      return;
    }
    if (aiVariant === "docked" && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      aiFloatLeft.current = r.left + containerRef.current.offsetWidth - aiWidth - 16;
      aiFloatTop.current  = null;
      setAiVariant("float");
    }
    if (notifVariant === "docked" && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      notifFloatLeft.current = r.left + containerRef.current.offsetWidth - notifWidth - 16;
      notifFloatTop.current  = null;
      setNotifVariant("float");
    }
    setChatDocked(true);
  };

  const handleChatOpenChange = (next: boolean) => {
    setChatOpen(next);
    // The header trigger only ever drives the anchored popover or the
    // docked panel — clear any leftover float position so a stray earlier
    // float (opened via openInternalChatWith) doesn't linger behind it.
    setChatFloatPosition(null);
    if (!next) {
      setChatView({ kind: "list" });
      setChatSearch("");
    }
  };

  /** Opens Internal Chat straight into a thread with one employee — used
   *  by the New Outbound popover's Agents-group "chat" row icon, so
   *  clicking it lands in the exact same chat window/thread the header's
   *  Internal Chat icon opens. If chat isn't already open in any
   *  presentation, it opens as a floating window near `clickPosition`
   *  (the icon click's viewport coordinates) instead of the header-
   *  anchored popover, so the window lands near the agent's mouse/focus
   *  rather than across the screen at the header. If chat is already open
   *  somewhere (popover, docked, or an earlier float), this just switches
   *  the thread in place without moving or re-presenting it. */
  const openInternalChatWith = (employeeId: string, clickPosition?: { x: number; y: number }) => {
    if (!chatOpen && clickPosition) {
      setChatFloatPosition({
        top: Math.min(Math.max(clickPosition.y - 24, 16), window.innerHeight - CHAT_FLOAT_HEIGHT - 16),
        left: Math.min(Math.max(clickPosition.x + 16, 16), window.innerWidth - CHAT_FLOAT_WIDTH - 16),
      });
    }
    setChatView({ kind: "chat", employeeId });
    setChatOpen(true);
  };

  const toggleChatFavorite = (id: string) => {
    setChatFavoriteIds((prev) => (prev.includes(id) ? prev.filter((existingId) => existingId !== id) : [...prev, id]));
  };

  const handleChatSend = () => {
    if (chatView.kind !== "chat") return;
    const text = chatDraft.trim();
    if (!text) return;
    const employeeId = chatView.employeeId;
    setChatThreads((prev) => ({
      ...prev,
      [employeeId]: [...(prev[employeeId] ?? []), { id: `m${(prev[employeeId]?.length ?? 0) + 1}`, fromMe: true, text, timestamp: "Just now" }],
    }));
    setChatDraft("");
  };

  const handleChatCall = (employee: DirectoryAgent) => {
    // eslint-disable-next-line no-console
    console.log("Call employee:", employee.name);
  };

  const chatSharedProps = {
    view: chatView,
    onViewChange: setChatView,
    search: chatSearch,
    onSearchChange: setChatSearch,
    favoriteIds: chatFavoriteIds,
    onToggleFavorite: toggleChatFavorite,
    threads: chatThreads,
    draft: chatDraft,
    onDraftChange: setChatDraft,
    onSend: handleChatSend,
    onCall: handleChatCall,
  };

  const getAiFloatStyle = (): React.CSSProperties => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = aiFloatLeft.current !== null
      ? aiFloatLeft.current
      : containerRef.current
        ? (rect?.left ?? 0) + containerRef.current.offsetWidth - aiWidth - 16
        : 0;
    const top = aiFloatTop.current !== null
      ? aiFloatTop.current
      : (rect?.top ?? 0);
    return {
      position: "fixed",
      top,
      left,
      zIndex: topPanel === "ai" ? 10000 : 9999,
    };
  };

  const aiPanel = aiMounted ? (
    <AiPanel
      ref={aiPanelRef}
      draggable
      draggableVariant={aiVariant}
      defaultDraggableWidth={aiWidth}
      maxDraggableWidth={600}
      defaultDraggableHeight={aiHeight}
      onVariantChange={handleAiVariantChange}
      onWidthChange={setAiWidth}
      onResizeStateChange={setAiIsResizing}
      onInteract={() => setTopPanel("ai")}
      userName="John"
      suggestions={[
        { id: "1", label: "Summarise this contact's history" },
        { id: "2", label: "Suggest a response to the customer" },
        { id: "3", label: "What changed since yesterday?" },
      ]}
      onClose={() => setAiPanelOpen(false)}
      className={aiVariant === "docked" ? "h-full" : undefined}
    />
  ) : null;

  /* Slide-in panel (Contacts/Directory/Schedule) — same "one element, two
   *  possible wrapper placements" approach as aiPanel/notifPanel above, so
   *  the panel instance (and whatever DraggablePanel/Draggable internal
   *  state survives a remount via the float-position refs) carries across
   *  a dock ↔ float toggle rather than resetting. Only ever used for the
   *  "panel" variant (docked beside an interaction, or floating) — the
   *  "full" takeover variant below is a separate, simpler render. */
  const slideInPanel = slideInMounted ? (
    <SlideInPage
      ref={slideInPanelRef}
      variant="panel"
      open
      title={SLIDE_IN_META[lastSlideIn].title}
      icon={SLIDE_IN_META[lastSlideIn].icon}
      onClose={() => setOpenSlideInPage(null)}
      width={slideInWidth}
      height={slideInHeight}
      draggableVariant={slideInVariant}
      onVariantChange={handleSlideInVariantChange}
      onWidthChange={setSlideInWidth}
      onResizeStateChange={setSlideInIsResizing}
    >
      {lastSlideIn === "directory" ? (
        <DirectoryPage
          customers={DIRECTORY_CUSTOMERS}
          agents={DIRECTORY_AGENTS}
          skills={DIRECTORY_SKILLS}
          teams={DIRECTORY_TEAMS}
          onContactAction={handleDirectoryContactAction}
        />
      ) : (
        <SlideInPlaceholder />
      )}
    </SlideInPage>
  ) : null;

  return (
    <div className="flex flex-col h-screen bg-lyra-bg-surface-shell overflow-hidden animate-in fade-in-0 duration-500">

      {/* ── App Header ── */}
      <AppHeader
        appName={
          <PopoverPrimitive.Root open={appMenuOpen} onOpenChange={setAppMenuOpen}>
            <PopoverPrimitive.Trigger asChild>
              <AppName
                // Hidden for user testing — restore by putting this back:
                // icon={<img src={appIcon} alt="My New Project" className="h-6 w-6" />}
                name="My New Project"
                compact={isCompactHeader}
                aria-expanded={appMenuOpen}
              />
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Content
                side="bottom"
                align="start"
                sideOffset={6}
                onOpenAutoFocus={(e: Event) => e.preventDefault()}
                className="z-[9999] animate-in fade-in-0 slide-in-from-top-2 duration-150 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-100"
              >
                <AppMenu
                  groups={appMenuGroups}
                  footer={<CXoneLogo />}
                  header={isCompactHeader ? "My New Project" : undefined}
                />
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>
        }
        actions={
          <>
            {/* Global navigation — moved here from InteractionHeader (see its
             *  own comment on the `takeover` prop), which only ever existed
             *  while an interaction or full-page destination was on screen.
             *  Living in the always-present AppHeader instead means Contacts/
             *  Directory/Schedule stay reachable even with no active
             *  interaction, and sit next to the other global actions
             *  (Notifications, Chat) rather than duplicated per content
             *  state. Control Center moved out of here into the left rail
             *  (see ControlCenterNavButton, rendered in LeftNav's `header`
             *  slot just under "New Outbound") — it's a full-page takeover
             *  destination like a primary section of the app, not a
             *  transient slide-in, so it reads better as a rail nav item. */}
            {/* iconClassName="h-5 w-5" matches NotificationsBell's Bell icon and
             *  InternalChatTrigger's MessagesSquare icon just below — both
             *  lyra-ui/app components with no size prop of their own, so
             *  matching them means sizing up from NavIconButton's own h-4 w-4
             *  default rather than shrinking those two down. strokeWidth 1.5
             *  already matches across all of them (NavIconButton hardcodes
             *  it), so size was the only inconsistency. */}
            <NavIconButton item="contacts" title="Contacts" icon={Users} activeNav={openSlideInPage} onNavClick={handleNavClick} iconClassName="h-5 w-5" />
            <NavIconButton item="directory" title="Directory" icon={BookUser} activeNav={openSlideInPage} onNavClick={handleNavClick} iconClassName="h-5 w-5" />
            <NavIconButton item="schedule" title="Schedule" icon={CalendarDays} activeNav={openSlideInPage} onNavClick={handleNavClick} iconClassName="h-5 w-5" />
            <div className="mx-1 h-5 w-px bg-lyra-border-subtle" />
            <NotificationsBell
              notifications={notifications}
              open={notifOpen}
              onOpenChange={setNotifOpen}
              renderPanel={false}
            />
            <InternalChatTrigger
              // Floating (opened via openInternalChatWith) takes over the
              // shared open/view state entirely — the header's own anchored
              // popover stays closed while it's up, so the two don't render
              // on top of each other.
              open={chatOpen && !chatFloatPosition}
              onOpenChange={handleChatOpenChange}
              docked={chatDocked}
              onDock={() => handleChatVariantChange("docked")}
              {...chatSharedProps}
            />
            <AgentProfile
              name="John Smith"
              initials="JS"
              status={agentStatus}
              onStatusChange={handleStatusChange}
              onDarkModeToggle={handleDarkModeToggle}
              isDarkMode={darkMode}
              timer={formattedTimer}
              className="ml-1"
            />
          </>
        }
      />

      {/* ── Body: LeftNav + Content ── */}
      {/* overflow-hidden ensures docked panels never push layout past the viewport */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        <LeftNav
          items={[]}
          open={navOpen}
          onToggle={() => setNavOpen((v) => !v)}
          overlay={isNavNarrow}
          header={
            <>
              <NewOutboundPopover
                title="New Outbound"
                outbound={{ ...OUTBOUND_CONFIG, onOpenInternalChat: openInternalChatWith }}
                expanded={navOpen}
              />
              <RailNavButton
                icon={LayoutGrid}
                label="Control Center"
                expanded={navOpen}
                active={openSlideInPage === "dashboard"}
                onClick={() => handleNavClick("dashboard")}
                className="mb-2"
              />
              {assignments.map((a) => (
                <InteractionNavItem
                  key={a.id}
                  customerName={a.customerName}
                  active={activeAssignmentId === a.id}
                  onClick={() => handleSelectAssignment(a.id)}
                  awaitingResponse={a.awaitingResponse}
                  elapsed={a.elapsed}
                  expanded={navOpen}
                  issueSummary={a.issueSummary}
                  channels={a.channels}
                />
              ))}
            </>
          }
          footer={
            <RailNavButton
              icon={Settings}
              label="Settings"
              expanded={navOpen}
              active={openSlideInPage === "settings"}
              onClick={() => handleNavClick("settings")}
            />
          }
        />

        {/* Content area — flex-1 shrinks to give space to docked panels.
            ref used to position float panels. */}
        <div ref={containerRef} className="relative flex flex-1 min-w-0 overflow-hidden pr-3 pb-3">

          {/* Main Container — flex row so pinned Panel sits left of PageHeader + content.
              relative so unpinned Panel can overlay the full surface. */}
          <Container className="flex flex-1 overflow-hidden relative">

            {/* Customer Snapshot — flex sibling, pushes everything (incl. PageHeader) to
                the right. Click to open/close only — no hover-to-preview, no pin toggle.
                Hidden during a Settings/Dashboard takeover — see isFullPageActive below. */}
            {showPanelToggle && !isFullPageActive && (
              <SidePanel
                side="left"
                open={sidePanelOpen}
                pinned
                headerTitle="Customer Profile"
                headerActions={
                  <ActionIconButton title="Close" onClick={() => setSidePanelOpen(false)}>
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </ActionIconButton>
                }
                width={sidePanelWidth}
                onWidthChange={setSidePanelWidth}
              >
                <CustomerSnapshotPanel
                  customer={activeCustomer}
                  notes={activeCustomer ? customerNotes[activeCustomer.id] ?? [] : []}
                  onAddNote={(text) => activeCustomer && handleAddCustomerNote(activeCustomer.id, text)}
                  onContactAction={handleSnapshotContactAction}
                />
              </SidePanel>
            )}

            {/* Content column: PageHeader + page body */}
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
              {isFullPageActive ? (
                <>
                  {showPageHeader && (
                    <InteractionHeader
                      takeover
                      takeoverTitle={FULL_PAGE_META[openSlideInPage as FullPageDestination].title}
                    />
                  )}
                  {openSlideInPage === "dashboard" ? (
                    <div className="relative flex flex-1 overflow-hidden">
                      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto px-6 py-6">
                        <AgentDashboard
                          agentFirstName={CURRENT_AGENT_NAME.split(" ")[0]}
                          onRedial={(entry: AgentDashboardContactHistoryEntry) => {
                            // eslint-disable-next-line no-console
                            console.log("Redial:", entry.name);
                          }}
                          selectedQueueId={selectedQueueId}
                          onSelectQueueId={setSelectedQueueId}
                        />
                      </div>
                      <InteriorPanel
                        side="right"
                        open={Boolean(selectedQueueId)}
                        headerTitle={
                          selectedQueueId
                            ? AGENT_DASHBOARD_QUEUE_ITEMS.find((item) => item.id === selectedQueueId)?.name ?? "Queue"
                            : "Queue"
                        }
                        headerSubhead={
                          selectedQueueId
                            ? `${(AGENT_DASHBOARD_QUEUE_SUB_ITEMS[selectedQueueId] ?? []).length} Skills`
                            : undefined
                        }
                        onClose={() => setSelectedQueueId(null)}
                      >
                        {selectedQueueId && <AgentDashboardQueueDrilldown queueId={selectedQueueId} />}
                      </InteriorPanel>
                    </div>
                  ) : (
                    <div className="flex flex-1 overflow-hidden">
                      <SlideInPlaceholder />
                    </div>
                  )}
                </>
              ) : activeAssignment ? (
                <>
                  {showPageHeader && (
                    <InteractionHeader
                      customerName={activeAssignment.customerName}
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                      onCloseInteraction={handleCloseInteraction}
                      panelToggle={showPanelToggle ? "left" : undefined}
                      onPanelToggle={() => setSidePanelOpen((v) => !v)}
                      aiPanelOpen={aiPanelOpen}
                      onAskAiClick={() => setAiPanelOpen((v) => !v)}
                    />
                  )}
                  {showPageHeader && (
                    <InteractionInfoBar
                      subject={activeAssignment.subject}
                      caseId={activeAssignment.caseId}
                      escalationStatus={activeAssignment.escalationStatus}
                      onEscalationStatusChange={(status) => activeAssignmentId && handleEscalationStatusChange(activeAssignmentId, status)}
                    />
                  )}
                  {showPageHeader && (
                    <InteractionActionsBar
                      isVoiceCall={isActiveAssignmentVoiceCall}
                      customerName={activeAssignment.customerName}
                      issueSummary={activeAssignment.issueSummary}
                      caseId={activeAssignment.caseId}
                    />
                  )}
                  {/* Body row: main content. Slide-in panel, when docked,
                   *  renders outside this Container entirely (sibling of
                   *  containerRef, alongside Notifications/AI/Chat) rather
                   *  than inside the interaction's own card — see that
                   *  block below for why. */}
                  <div className="relative flex flex-1 overflow-hidden">
                    <CustomerInteractionPanel activeTab={activeTab} messages={activeAssignment.messages} />
                  </div>
                </>
              ) : openSlideInPage !== null && slideInVariant !== "float" ? (
                // slideInVariant === "float" is deliberately excluded here — the
                // floating panel (rendered independently of activeAssignment,
                // just below) already shows this same content in that case, so
                // taking over the content column too would render it twice.
                <SlideInPage
                  variant="full"
                  open
                  title={SLIDE_IN_META[lastSlideIn].title}
                  icon={SLIDE_IN_META[lastSlideIn].icon}
                  onClose={() => setOpenSlideInPage(null)}
                >
                  {lastSlideIn === "directory" ? (
                    <DirectoryPage
                      customers={DIRECTORY_CUSTOMERS}
                      agents={DIRECTORY_AGENTS}
                      skills={DIRECTORY_SKILLS}
                      teams={DIRECTORY_TEAMS}
                      onContactAction={handleDirectoryContactAction}
                    />
                  ) : (
                    <SlideInPlaceholder />
                  )}
                </SlideInPage>
              ) : openSlideInPage !== null ? null : (
                <div className="flex flex-1 items-center justify-center text-lyra-fg-secondary lyra-body-md">
                  No active interaction selected.
                </div>
              )}
            </div>

          </Container>

          {/* Notifications — float (CSS transitions, not keyframe animations — avoids compositor fill-mode flash) */}
          {notifVariant === "float" && notifMounted && (
            <div
              style={{
                ...getNotifFloatStyle(),
                pointerEvents: "none",
                visibility: notifState === "closed" ? "hidden" : "visible",
                opacity: notifState === "open" ? 1 : 0,
                transform: notifState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: notifState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {notifPanel}
            </div>
          )}

          {/* AI Panel — float (same CSS transition pattern as Notifications) */}
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
              {aiPanel}
            </div>
          )}

          {/* Slide-in panel — float (same CSS transition pattern as Notifications/AI,
           *  but no single-dock-rule tie-in to either — see slideInVariant's own doc
           *  comment on why this panel doesn't compete with them for a docked slot). */}
          {slideInVariant === "float" && slideInMounted && (
            <div
              style={{
                ...getSlideInFloatStyle(),
                pointerEvents: "none",
                visibility: slideInState === "closed" ? "hidden" : "visible",
                opacity: slideInState === "open" ? 1 : 0,
                transform: slideInState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: slideInState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {slideInPanel}
            </div>
          )}

        </div>

        {/* Slide-in panel — docked (sibling of containerRef, same as
         *  Notifications/AI/Chat below — NOT nested inside the interaction's
         *  own Container/card, so it always sits outside the interaction
         *  panel with a real gap between the two, rather than reading as
         *  one merged surface. Rendered first among the docked extras so it
         *  lands immediately to the right of the interaction, matching
         *  where it appeared before this was moved out of the Container.
         *  No single-dock-rule tie-in to Notifications/AI/Chat — see
         *  slideInVariant's own doc comment. */}
        {slideInVariant === "docked" && (
          <div className="pb-3" style={{
            width: slideInState === "open" ? slideInWidth : 0,
            marginRight: slideInState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: slideInIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: slideInWidth,
                display: slideInState === "open" ? "block" : "none",
              }}
            >
              {slideInPanel}
            </div>
          </div>
        )}

        {/* Notifications — docked (sibling of containerRef so flex layout keeps it in-bounds) */}
        {notifVariant === "docked" && (
          <div className="pb-3" style={{
            width: notifState === "open" ? notifWidth : 0,
            marginRight: notifState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: notifIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: notifWidth,
                display: notifState === "open" ? "block" : "none",
              }}
            >
              {notifPanel}
            </div>
          </div>
        )}

        {/* AI Panel — docked (sibling of containerRef so flex layout keeps it in-bounds) */}
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
              style={{
                width: aiWidth,
                display: aiState === "open" ? "block" : "none",
              }}
            >
              {aiPanel}
            </div>
          </div>
        )}

        {/* Internal Chat — docked (sibling of containerRef so flex layout keeps it in-bounds).
         *  Suppressed while floating (see InternalChatTrigger's `open` prop comment above) —
         *  a stale `chatDocked` from an earlier session shouldn't render its row underneath
         *  the float window just because both happen to be true at once. */}
        {chatDocked && !chatFloatPosition && (
          <div className="pb-3" style={{
            width: chatOpen ? chatWidth : 0,
            marginRight: chatOpen ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: chatIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: chatWidth,
                display: chatOpen ? "block" : "none",
              }}
            >
              <InternalChatDockedPanel
                open={chatOpen}
                onClose={() => setChatOpen(false)}
                onVariantChange={handleChatVariantChange}
                onWidthChange={setChatWidth}
                onResizeStateChange={setChatIsResizing}
                defaultWidth={chatWidth}
                {...chatSharedProps}
              />
            </div>
          </div>
        )}

        {/* Internal Chat — floating (opened via openInternalChatWith, e.g. New
         *  Outbound's Agents-group chat icon). Portals to document.body, so it
         *  renders outside this flex row entirely — position is fixed viewport
         *  coordinates set at open time. */}
        {chatOpen && chatFloatPosition && (
          <InternalChatFloatPanel
            position={chatFloatPosition}
            onClose={() => {
              setChatOpen(false);
              setChatFloatPosition(null);
              setChatView({ kind: "list" });
              setChatSearch("");
            }}
            {...chatSharedProps}
          />
        )}

      </div>
    </div>
  );
}
