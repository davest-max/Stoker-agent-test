import React, { useState, useEffect, useRef } from "react";
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
  Panel,
  LeftNav,
  CreateNew,
  Tooltip,
  InteractionNavItem,
  type CreateNewOutboundConfig,
  type CreateNewOutboundContact,
  type AgentStatus,
  type AppMenuGroup,
  type AgentNotification,
  type DraggableVariant,
  type InteractionChannel,
  type ChannelType,
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
import { InternalChatTrigger, InternalChatDockedPanel, type ChatView } from "@/components/InternalChatPopover";
import { INITIAL_FAVORITE_EMPLOYEE_IDS, INITIAL_CHAT_THREADS, type InternalChatMessage } from "@/data/internalChat";
import { DirectoryPage } from "@/components/DirectoryPage";
import { CustomerSnapshotPanel } from "@/components/CustomerSnapshotPanel";
import {
  DIRECTORY_CUSTOMERS,
  DIRECTORY_AGENTS,
  DIRECTORY_SKILLS,
  DIRECTORY_TEAMS,
  OUTBOUND_SEARCH_CONTACTS,
  OUTBOUND_FAVORITE_CONTACT_IDS,
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
  Settings,
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

/* ── Create New → Outbound config ──
   Mirrors lyra-ui's CreateNew "Create New → Outbound" story (see
   lyra-ui/src/components/__stories__/create-new-outbound-mock.tsx). Search
   spans OUTBOUND_SEARCH_CONTACTS — every Customer/Agent/Team/Skill from
   directory.ts, reused rather than a parallel fixture. Matching phone
   numbers/emails isn't modeled (no such values are stored on a contact
   today), so typing one always falls through to the no-match Call/Email
   path below — which is the point of this demo flow. */

const OUTBOUND_CONFIG: CreateNewOutboundConfig = {
  outboundTitle: "New Outbound",
  searchContacts: OUTBOUND_SEARCH_CONTACTS,
  favoriteContactIds: OUTBOUND_FAVORITE_CONTACT_IDS,
  // Stand-ins for directories this app doesn't have real data for yet —
  // selecting one in the filter dropdown always shows its own "not
  // connected" message instead of search results.
  externalDirectories: [
    { id: "company-directory", label: "Company Directory" },
    { id: "partner-network", label: "Partner Network" },
  ],
  channelOptions: [
    { id: "voice",    label: "Call",     selectLabel: "Voice", icon: <Phone         className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "sms",      label: "SMS",                            icon: <MessageSquare className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "whatsapp", label: "WhatsApp",                       icon: <MessageCircle className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "email",    label: "Email",                          icon: <Mail          className="h-5 w-5" strokeWidth={1.5} /> },
  ],
  phoneOptions: [
    { value: "+14563833329", type: "Mobile", number: "(456) 383-3329" },
    { value: "+14565559981", type: "Home", number: "(456) 555-9981" },
    { value: "+14565550147", type: "Work", number: "(456) 555-0147" },
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

/* ── Sparkle icon (Ask AI) ── */

function AiSparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 10C17 9.94181 16.9795 9.88562 16.9424 9.84082C16.9051 9.79597 16.8532 9.76559 16.7959 9.75488L16.7949 9.75391L12.6279 8.96582C12.2329 8.89119 11.8693 8.69934 11.585 8.41504C11.3007 8.13074 11.1088 7.76715 11.0342 7.37207L10.2461 3.20508L10.2451 3.2041C10.2344 3.14679 10.204 3.09487 10.1592 3.05762C10.1144 3.02051 10.0582 3 10 3C9.94182 3 9.88563 3.02051 9.84082 3.05762C9.79597 3.09486 9.76559 3.14679 9.75488 3.2041L9.75391 3.20508L8.96582 7.37207C8.89119 7.76715 8.69934 8.13074 8.41504 8.41504C8.13074 8.69934 7.76715 8.89119 7.37207 8.96582L3.20508 9.75391L3.2041 9.75488C3.14679 9.76559 3.09486 9.79597 3.05762 9.84082C3.02051 9.88563 3 9.94182 3 10C3 10.0582 3.02051 10.1144 3.05762 10.1592C3.07625 10.1816 3.09828 10.2013 3.12305 10.2158L3.2041 10.2451L3.20508 10.2461L7.37207 11.0342C7.76715 11.1088 8.13074 11.3007 8.41504 11.585C8.69934 11.8693 8.89119 12.2329 8.96582 12.6279L9.75391 16.7949L9.75488 16.7959C9.76559 16.8532 9.79597 16.9051 9.84082 16.9424C9.88562 16.9795 9.94181 17 10 17C10.0582 17 10.1144 16.9795 10.1592 16.9424C10.204 16.9051 10.2344 16.8532 10.2451 16.7959L10.2461 16.7949L11.0342 12.6279C11.1088 12.2329 11.3007 11.8693 11.585 11.585C11.8693 11.3007 12.2329 11.1088 12.6279 11.0342L16.7949 10.2461L16.7959 10.2451C16.8532 10.2344 16.9051 10.204 16.9424 10.1592C16.9795 10.1144 17 10.0582 17 10ZM5.00098 15.999C5.00098 15.4469 4.55306 14.999 4.00098 14.999C3.4491 14.9993 3.00195 15.4471 3.00195 15.999C3.0022 16.5507 3.44925 16.9978 4.00098 16.998C4.55291 16.998 5.00073 16.5509 5.00098 15.999ZM6.00098 15.999C6.00073 17.1032 5.1052 17.998 4.00098 17.998C2.89697 17.9978 2.0022 17.103 2.00195 15.999C2.00195 14.8948 2.89682 13.9993 4.00098 13.999C5.10535 13.999 6.00098 14.8947 6.00098 15.999ZM18 10C18 10.2917 17.8983 10.5745 17.7119 10.7988C17.5256 11.0232 17.2662 11.174 16.9795 11.2275L16.9805 11.2285L12.8135 12.0166C12.616 12.0539 12.4341 12.1499 12.292 12.292C12.1499 12.4341 12.0539 12.616 12.0166 12.8135L11.2285 16.9805C11.1748 17.2668 11.023 17.5257 10.7988 17.7119C10.5745 17.8983 10.2917 18 10 18C9.70834 18 9.42555 17.8983 9.20117 17.7119C8.97704 17.5257 8.82516 17.2668 8.77148 16.9805L7.9834 12.8135C7.94609 12.616 7.85013 12.4341 7.70801 12.292C7.56588 12.1499 7.38403 12.0539 7.18652 12.0166L3.01953 11.2285V11.2275C2.73324 11.1738 2.47421 11.0229 2.28809 10.7988C2.10174 10.5745 2 10.2917 2 10C2 9.70834 2.10174 9.42554 2.28809 9.20117C2.47425 8.97704 2.73317 8.82516 3.01953 8.77148L7.18652 7.9834C7.38403 7.94609 7.56588 7.85013 7.70801 7.70801C7.85013 7.56588 7.94609 7.38403 7.9834 7.18652L8.77148 3.01953C8.82516 2.73317 8.97704 2.47425 9.20117 2.28809C9.42554 2.10174 9.70834 2 10 2C10.2917 2 10.5745 2.10174 10.7988 2.28809C11.023 2.47425 11.1748 2.73317 11.2285 3.01953L12.0166 7.18652C12.0539 7.38403 12.1499 7.56588 12.292 7.70801C12.4341 7.85013 12.616 7.94609 12.8135 7.9834L16.9805 8.77148H16.9795C17.2662 8.82503 17.5256 8.97683 17.7119 9.20117C17.8983 9.42555 18 9.70834 18 10ZM17.8271 4.0791C17.8271 4.22843 17.775 4.37334 17.6797 4.48828C17.5842 4.60329 17.4507 4.68056 17.3037 4.70801L17.3047 4.70898L16.6699 4.82812L16.5498 5.46191C16.5224 5.60887 16.4451 5.74238 16.3301 5.83789C16.2151 5.93334 16.0703 5.98532 15.9209 5.98535C15.7715 5.98535 15.6267 5.93328 15.5117 5.83789C15.3971 5.74266 15.3187 5.6103 15.291 5.46387L15.1709 4.82812L14.5361 4.70898V4.70801C14.3898 4.68032 14.2573 4.6029 14.1621 4.48828C14.0907 4.40218 14.0436 4.29937 14.0244 4.19043L14.0146 4.0791L14.0244 3.96875C14.0436 3.85949 14.0904 3.75624 14.1621 3.66992C14.2576 3.55499 14.3903 3.47672 14.5371 3.44922L15.1709 3.3291L15.291 2.69531C15.3186 2.54862 15.3969 2.41569 15.5117 2.32031L15.6025 2.25781C15.6989 2.20264 15.8086 2.17285 15.9209 2.17285L16.0312 2.18262C16.1041 2.19538 16.174 2.22111 16.2383 2.25781L16.3301 2.32031L16.4092 2.39941C16.4808 2.48388 16.5302 2.58618 16.5508 2.69629H16.5498L16.6699 3.3291L17.3027 3.44922H17.3037C17.4138 3.46978 17.5161 3.5192 17.6006 3.59082L17.6797 3.66992L17.7422 3.76172C17.7971 3.85791 17.8271 3.96706 17.8271 4.0791Z" fill="currentColor"/>
    </svg>
  );
}

/* ── AgentNextGenPage ── */

type Page = "agent-workspace" | "agent" | "outbound";

const AI_PANEL_DEFAULT_WIDTH = 360;
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
   *  No free-floating mode: chat doesn't need one, so "Undock" just pops it
   *  back into the anchored popover instead of a floating window. */
  const [chatOpen,        setChatOpen]        = useState(false);
  const [chatDocked,      setChatDocked]      = useState(false);
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

  // "New Outbound"'s trailing person-icon button (customers only) — opens
  // the Customer Profile panel for whichever customer was searched, even
  // if a different customer's interaction is currently active.
  const handleViewCustomerCard = (contact: CreateNewOutboundContact) => {
    setCustomerCardOverrideId(contact.id);
    setSidePanelOpen(true);
  };

  /* Side panel */
  const [sidePanelOpen,      setSidePanelOpen]      = useState(false);
  const [sidePanelWidth,     setSidePanelWidth]     = useState(256);
  // Set when "New Outbound"'s trailing person-icon button opens the
  // Customer Profile panel for a searched customer rather than the active
  // interaction's own — takes priority over activeAssignment.customerId
  // until cleared (panel closed, or the active assignment changes).
  const [customerCardOverrideId, setCustomerCardOverrideId] = useState<string | undefined>(undefined);

  // Whichever way the panel closes (header click, toggle button, etc.), the
  // override shouldn't outlive that close — otherwise reopening the panel
  // later (e.g. via the header toggle) would still show the searched
  // customer instead of the active interaction's own.
  useEffect(() => {
    if (!sidePanelOpen) setCustomerCardOverrideId(undefined);
  }, [sidePanelOpen]);

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
  const activeCustomer = DIRECTORY_CUSTOMERS.find((c) => c.id === (customerCardOverrideId ?? activeAssignment?.customerId));

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
    if (!next) {
      setChatView({ kind: "list" });
      setChatSearch("");
    }
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

  return (
    <div className="flex flex-col h-screen bg-lyra-bg-surface-shell overflow-hidden animate-in fade-in-0 duration-500">

      {/* ── App Header ── */}
      <AppHeader
        appName={
          <PopoverPrimitive.Root open={appMenuOpen} onOpenChange={setAppMenuOpen}>
            <PopoverPrimitive.Trigger asChild>
              <AppName
                icon={<img src={appIcon} alt="My New Project" className="h-6 w-6" />}
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
            <NotificationsBell
              notifications={notifications}
              open={notifOpen}
              onOpenChange={setNotifOpen}
              renderPanel={false}
            />
            <InternalChatTrigger
              open={chatOpen}
              onOpenChange={handleChatOpenChange}
              docked={chatDocked}
              onDock={() => handleChatVariantChange("docked")}
              {...chatSharedProps}
            />
            <Tooltip content="Ask AI" placement="bottom" asLabel>
              <button
                type="button"
                aria-label="Ask AI"
                aria-expanded={aiPanelOpen}
                onClick={() => setAiPanelOpen((v) => !v)}
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
              <CreateNew
                title="New Outbound"
                outbound={{ ...OUTBOUND_CONFIG, onViewCustomerCard: handleViewCustomerCard }}
                expanded={navOpen}
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
            <NavIconButton
              item="settings"
              title="Settings"
              icon={Settings}
              activeNav={openSlideInPage}
              onNavClick={handleNavClick}
              className="h-[38px] w-[38px]"
              iconClassName="h-6 w-6"
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
              <Panel
                variant="side"
                side="left"
                open={sidePanelOpen}
                pinned
                headerTitle="Customer Profile"
                onHeaderClick={() => setSidePanelOpen(false)}
                width={sidePanelWidth}
                onWidthChange={setSidePanelWidth}
              >
                <CustomerSnapshotPanel
                  customer={activeCustomer}
                  notes={activeCustomer ? customerNotes[activeCustomer.id] ?? [] : []}
                  onAddNote={(text) => activeCustomer && handleAddCustomerNote(activeCustomer.id, text)}
                  onContactAction={handleSnapshotContactAction}
                />
              </Panel>
            )}

            {/* Content column: PageHeader + page body */}
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
              {isFullPageActive ? (
                <>
                  {showPageHeader && (
                    <InteractionHeader
                      activeNav={openSlideInPage}
                      onNavClick={handleNavClick}
                      takeover
                      takeoverTitle={FULL_PAGE_META[openSlideInPage as FullPageDestination].title}
                    />
                  )}
                  <div className="flex flex-1 overflow-hidden">
                    <SlideInPlaceholder />
                  </div>
                </>
              ) : activeAssignment ? (
                <>
                  {showPageHeader && (
                    <InteractionHeader
                      customerName={activeAssignment.customerName}
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                      activeNav={openSlideInPage}
                      onNavClick={handleNavClick}
                      onCloseInteraction={handleCloseInteraction}
                      panelToggle={showPanelToggle ? "left" : undefined}
                      onPanelToggle={() => setSidePanelOpen((v) => !v)}
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
                  {showPageHeader && <InteractionActionsBar isVoiceCall={isActiveAssignmentVoiceCall} />}
                  {/* Body row: main content + slide-in pages */}
                  <div className="relative flex flex-1 overflow-hidden">
                    <CustomerInteractionPanel activeTab={activeTab} messages={activeAssignment.messages} />
                    <SlideInPage
                      variant="panel"
                      open={openSlideInPage !== null}
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
                  </div>
                </>
              ) : openSlideInPage !== null ? (
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
              ) : (
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

        </div>

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

        {/* Internal Chat — docked (sibling of containerRef so flex layout keeps it in-bounds) */}
        {chatDocked && (
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

      </div>
    </div>
  );
}
