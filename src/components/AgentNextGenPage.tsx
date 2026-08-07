import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  AppHeader,
  AppName,
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
  type AgentNotification,
  type DraggableVariant,
  type InteractionChannel,
  type ChannelType,
  type CreateNewOutboundContact,
  type AgentDashboardContactHistoryEntry,
  CHANNEL_TYPE_META,
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
  type CallTranscriptEvent,
  type CallScriptSection,
  type SlideInDestination,
  type FullPageDestination,
  type NavDestination,
} from "@/components/CustomerInteractionPanel";
import { SlideInPage, SlideInPlaceholder } from "@/components/SlideInPage";
import { NewOutboundPopover, AddOutboundButton, type NewOutboundConfig } from "@/components/NewOutboundPopover";
import { InternalChatTrigger, InternalChatDockedPanel, InternalChatFloatPanel, InternalChatMaximizedPanel, type ChatView } from "@/components/InternalChatPopover";
import { INITIAL_FAVORITE_EMPLOYEE_IDS, INITIAL_CHAT_THREADS, type InternalChatMessage } from "@/data/internalChat";
import { DirectoryPage } from "@/components/DirectoryPage";
import { CustomerProfilePanel } from "@/components/CustomerSnapshotPanel";
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
  Headset,
  X,
  Maximize2,
  Minimize2,
  Monitor,
} from "lucide-react";

/** Title + icon for each right-side slide-in destination — Directory has
 *  real content (DirectoryPage below); Custom Workspace embeds a
 *  third-party URL (see `renderSlideInContent`); the rest render
 *  SlideInPlaceholder. Settings/Dashboard aren't here — they take over the
 *  content column instead of sliding in (see FULL_PAGE_META below). */
const SLIDE_IN_META: Record<SlideInDestination, { title: string; icon: React.ReactNode }> = {
  contacts: { title: "Contacts", icon: <Users className="h-4 w-4" strokeWidth={1.5} /> },
  directory: { title: "Directory", icon: <BookUser className="h-4 w-4" strokeWidth={1.5} /> },
  schedule: { title: "Schedule", icon: <CalendarDays className="h-4 w-4" strokeWidth={1.5} /> },
  customWorkspace: { title: "Custom Workspace", icon: <Monitor className="h-4 w-4" strokeWidth={1.5} /> },
};

/** Third-party URL embedded in the Custom Workspace slide-in (see
 *  `renderSlideInContent`) — a real destination outside this app, framed
 *  in an `<iframe>` sized to fill whatever container it's rendered in
 *  (panel or full-page). Demo value from Dave; swap for whatever URL this
 *  workspace should actually point to. Sites that set `X-Frame-Options`/
 *  `frame-ancestors` to block embedding will still refuse to render here —
 *  that's the third-party site's own header, not something fixable from
 *  this end. */
const CUSTOM_WORKSPACE_URL = "https://www.poetryfoundation.org/poems/1618844/love-poem-with-apologies-for-my-appearance";

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

/** Adds this app's own per-channel case data on top of lyra-ui's generic
 *  `InteractionChannel` (which only knows about elapsed/preview/current —
 *  UI state, not business data). Once a card is elevated, its open channels
 *  can genuinely be different cases — e.g. the customer emails about a
 *  second, unrelated issue while a voice call is already live — so subject/
 *  case ID/status need to live per-channel, not just once per assignment:
 *  each open channel's status dropdown (row 3) is independent and changes
 *  on its own, the same way its subject/case ID already do. All optional: a
 *  channel that doesn't set its own falls back to the assignment-level
 *  value (see `activeSubject`/`activeCaseId`/`activeEscalationStatus`
 *  below), which covers every single-channel card without any extra data. */
interface AssignmentChannel extends InteractionChannel {
  subject?: string;
  caseId?: string;
  escalationStatus?: EscalationStatus;
  /** The address this channel was opened with (an email address for an
   *  email channel, phone number for voice/SMS, etc. — same "address"
   *  value `NewOutboundPopover`/`AddOutboundButton` already collect when
   *  starting a channel, just kept around afterward instead of being
   *  discarded). Used to default the email composer's own "To" field to
   *  the actual recipient instead of leaving it blank. */
  address?: string;
}

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
  /** Default subject/case ID — used directly on a single-channel card, and
   *  as the fallback for any open channel that doesn't carry its own (see
   *  `AssignmentChannel` above). */
  subject: string;
  caseId: string;
  channels: AssignmentChannel[];
  /** Which of `channels` is "current" (shown in the chat/transcript pane,
   *  highlighted on this card) — the single source of truth shared by
   *  `InteractionNavItem`'s own `currentChannelKey`/`onCurrentChannelChange`
   *  props and `InteractionHeader`'s new per-channel `ChannelTab` bar, so
   *  clicking either stays in sync with the other. Keyed the same way both
   *  of those already key channels: `channel.id ?? channel.type`. Falls
   *  back to whichever channel is flagged `current` (or the last channel)
   *  via `resolveCurrentChannelKey` below until the agent actually picks
   *  one — every seeded `INITIAL_ASSIGNMENTS` entry below only has one
   *  channel anyway, so that fallback is all they ever need. */
  currentChannelKey?: string;
  /** Default status — used directly on a single-channel card, and as the
   *  fallback for any open channel that doesn't carry its own (see
   *  `AssignmentChannel` above). */
  escalationStatus: EscalationStatus;
  messages: Message[];
  /** Hold/resume/etc. moments shown interleaved into the voice transcript —
   *  see CustomerInteractionPanel's own CallTranscriptEvent doc comment.
   *  Only meaningful for a voice interaction; ignored otherwise. */
  callEvents?: CallTranscriptEvent[];
  /** Company-authored script for this call — see CustomerInteractionPanel's
   *  own CallScriptSection doc comment. Only meaningful for a voice
   *  interaction, and only shows the Live Transcript/Script toggle at all
   *  when present — most calls have none. */
  script?: CallScriptSection[];
  /** True for an internal agent-to-agent voice call (created from New
   *  Outbound's Agents group — see `handleStartOutboundCall`) rather than a
   *  customer interaction. Swaps the compact tile's initials avatar for a
   *  headset glyph (`InteractionNavItem`'s `avatarIcon`) so it doesn't read
   *  as a customer card — there's no `customerId`/`DIRECTORY_CUSTOMERS`
   *  record backing it, and `customerName` here is the *other agent's*
   *  name, not a customer's. */
  isInternalAgentCall?: boolean;
}

/** The logged-in agent (matches the AgentProfile name in the top app header)
 *  — used as the senderName for every support-agent message below. */
const CURRENT_AGENT_NAME = "John Smith";

/** New 5-digit case id for a freshly-created assignment tile (New Outbound
 *  → `handleStartOutboundCall`) — same "CASE-#####" shape as the seeded
 *  `INITIAL_ASSIGNMENTS`, just generated instead of hand-picked. */
function generateCaseId(): string {
  return `CASE-${Math.floor(10000 + Math.random() * 90000)}`;
}

/** A generic "Outbound {Email}" subject reads like a placeholder, not a real
 *  case — outbound email specifically gets a plausible subject line picked
 *  from this pool instead, since (with skill selection currently hidden —
 *  see `SHOW_SKILL_SELECTION` in NewOutboundPopover.tsx — `skillLabel` is
 *  rarely available to fall back on anymore). Voice/SMS/WhatsApp keep the
 *  existing "Outbound {Channel}" pattern; only email asked for this. */
const OUTBOUND_EMAIL_SUBJECTS = [
  "Following up on your recent inquiry",
  "Checking in on your account",
  "Your upcoming subscription renewal",
  "Update on your support request",
  "Quick follow-up from our team",
];

function fakeOutboundEmailSubject(): string {
  return OUTBOUND_EMAIL_SUBJECTS[Math.floor(Math.random() * OUTBOUND_EMAIL_SUBJECTS.length)];
}

/** Same rough "is this actually a name, or just a raw address" judgment
 *  call `NewOutboundPopover`'s own `looksLikeEmail` heuristic makes (not
 *  imported from there — that one's private to its own file, and this
 *  needs the opposite answer: true for a real name, not true for an
 *  email/phone). Used only to decide whether a demo transcript's opening
 *  line can address the customer by name ("Hi Sofia,") or has to stay
 *  generic ("Hi,") — an unmatched outbound's `contactName` is whatever the
 *  agent typed into search, which is exactly a phone number or email, not
 *  a name. */
function isLikelyPersonName(value: string): boolean {
  return !value.includes("@") && !/^[+\d\s().-]+$/.test(value);
}

/** Generic outbound issueSummary — replaces the old "Outbound {Channel} to
 *  {Name}." text, which just restated the channel type and a name already
 *  shown right next to it everywhere this renders (the tile, the action
 *  bar, and the Consult/Transfer handoff note — see `buildHandoffSummary`
 *  in ConsultTransferPopover.tsx, which is what actually prompted this: it
 *  quotes `issueSummary` verbatim as "the customer's issue", so a generic
 *  "type + name" string there just repeated information the receiving
 *  agent already had). There's no real customer-reported issue for a call
 *  the agent just dialed, so this leans on the selected skill/queue as the
 *  closest available stand-in for one — same `topic` idea
 *  `scheduleOutboundVoiceDemoTranscript` below already uses — falling back
 *  to a generic account check-in when no skill was selected (skill
 *  selection is currently hidden — see `SHOW_SKILL_SELECTION` in
 *  NewOutboundPopover.tsx, so this fallback is the common case today). */
function buildOutboundIssueSummary(skillLabel?: string): string {
  return skillLabel
    ? `Reaching out regarding ${skillLabel.toLowerCase()}.`
    : "Reaching out to check in on their account.";
}

/** Company script offered on every outbound voice call — matched contact,
 *  unmatched phone number, or a voice channel added onto an existing card
 *  (see the three `script:` call sites below). For demo purposes this is
 *  deliberately broader than the one seeded inbound call
 *  (`INITIAL_ASSIGNMENTS`'s "call" entry above, which has its own
 *  topic-specific script): there's no real per-call "topic" for a freshly
 *  dialed demo call the way that seeded one has, so this stays a generic
 *  outbound-intro script, parameterized by contact name/skill the same way
 *  `scheduleOutboundVoiceDemoTranscript`'s own fake transcript already is.
 *  Never offered on the agent-to-agent internal call branch — that's a
 *  real colleague, not a scripted customer (same exclusion
 *  `scheduleOutboundDemoTranscript`'s own doc comment explains). */
function buildOutboundVoiceScript(contactName: string, skillLabel?: string): CallScriptSection[] {
  const agentFirstName = CURRENT_AGENT_NAME.split(" ")[0];
  const topic = skillLabel ?? "your account";
  return [
    {
      heading: "Opening",
      lines: [`Hi, this is ${agentFirstName} calling from support — is now an okay time to chat?`],
    },
    {
      heading: "Purpose",
      lines: [`I'm calling about ${topic}. I just wanted to check in and see how everything's going.`],
    },
    {
      heading: "Closing",
      lines: [
        "Is there anything else I can help with before we wrap up?",
        "Great, take care! Goodbye.",
      ],
    },
  ];
}

/** Non-voice counterpart to `scheduleOutboundVoiceDemoTranscript` below —
 *  same "believable opening exchange, not the real conversation" idea, one
 *  script per channel so each reads in that channel's own voice: chat/SMS/
 *  WhatsApp as quick, casual messages; email as a couple of complete
 *  sentences with a little more room to breathe. `variant`/`senderName`
 *  match `Message`'s own shape so these lines can go straight through
 *  `appendMessageToAssignment` exactly like the voice version's do. */
function buildOutboundChannelDemoLines(
  channel: Exclude<ChannelType, "voice">,
  contactName: string,
  skillLabel: string | undefined
): { variant: Message["variant"]; senderName: string; text: string; delayMs: number }[] {
  const agentFirstName = CURRENT_AGENT_NAME.split(" ")[0];
  const topic = skillLabel ?? "your account";
  const greeting = isLikelyPersonName(contactName) ? `Hi ${contactName.split(" ")[0]},` : "Hi,";

  switch (channel) {
    case "email":
      return [
        { variant: "support-agent", senderName: CURRENT_AGENT_NAME, delayMs: 1500,
          text: `${greeting} I wanted to follow up regarding ${topic}. Let me know if you have any questions or concerns.` },
        { variant: "customer", senderName: contactName, delayMs: 4200,
          text: "Thanks for checking in — everything's been working well on my end." },
        { variant: "support-agent", senderName: CURRENT_AGENT_NAME, delayMs: 6800,
          text: "Great to hear! Please don't hesitate to reach out if anything comes up." },
      ];
    case "sms":
      return [
        { variant: "support-agent", senderName: CURRENT_AGENT_NAME, delayMs: 1200,
          text: `${greeting} this is ${agentFirstName} from support, reaching out about ${topic}. Got a sec?` },
        { variant: "customer", senderName: contactName, delayMs: 2600,
          text: "Hey yeah, what's up?" },
        { variant: "support-agent", senderName: CURRENT_AGENT_NAME, delayMs: 4400,
          text: "Just wanted to check in and make sure everything's going okay on our end." },
        { variant: "customer", senderName: contactName, delayMs: 6200,
          text: "All good so far, thanks for checking!" },
      ];
    case "whatsapp":
      return [
        { variant: "support-agent", senderName: CURRENT_AGENT_NAME, delayMs: 1200,
          text: `${greeting} this is ${agentFirstName} from support, reaching out about ${topic}.` },
        { variant: "customer", senderName: contactName, delayMs: 2800,
          text: "Hi! Sure, go ahead." },
        { variant: "support-agent", senderName: CURRENT_AGENT_NAME, delayMs: 4800,
          text: "Just checking in to see how things are going — any issues on your end?" },
        { variant: "customer", senderName: contactName, delayMs: 7000,
          text: "Nope, all good! Appreciate you checking in." },
      ];
    case "chat":
    default:
      return [
        { variant: "support-agent", senderName: CURRENT_AGENT_NAME, delayMs: 1200,
          text: `${greeting} this is ${agentFirstName} from support — reaching out about ${topic}.` },
        { variant: "customer", senderName: contactName, delayMs: 3000,
          text: "Oh hi, thanks for reaching out!" },
        { variant: "support-agent", senderName: CURRENT_AGENT_NAME, delayMs: 5200,
          text: "Just wanted to check in and see how things are going on our end." },
        { variant: "customer", senderName: contactName, delayMs: 7400,
          text: "Things have been good so far, no complaints!" },
      ];
  }
}

/** Same identity lyra-ui's own `InteractionNavItem`/`ChannelTab` use
 *  internally for a channel — `id` when set, else `type`. Mirrored here
 *  (rather than imported — it's a private helper local to
 *  interaction-nav-item.tsx there) so this file's own current-channel state
 *  keys channels exactly the same way both of those components do. */
function channelKey(ch: InteractionChannel): string {
  return ch.id ?? ch.type;
}

/** Resolves which of an assignment's channels is actually "current" —
 *  `currentChannelKey` when it still matches an open channel, else
 *  whichever channel is flagged `current` (last one, if more than one
 *  incorrectly is), else just the last channel. Same fallback order
 *  `InteractionNavItem` computes internally for its own uncontrolled case,
 *  kept in sync here so this file's derived `activeChannelType` (and
 *  anything else reading "the" current channel) never disagrees with what
 *  the card/tab bar actually show. */
function resolveCurrentChannelKey(a: Assignment): string | undefined {
  if (a.currentChannelKey && a.channels.some((c) => channelKey(c) === a.currentChannelKey)) {
    return a.currentChannelKey;
  }
  const fallback = [...a.channels].reverse().find((c) => c.current) ?? a.channels[a.channels.length - 1];
  return fallback ? channelKey(fallback) : undefined;
}

/** Demo seed data — kept around for manual testing (e.g. temporarily
 *  swapping the `useState<Assignment[]>([])` call below back to
 *  `useState<Assignment[]>(INITIAL_ASSIGNMENTS)`), but not loaded by
 *  default: the app now starts with an empty rail and Control Center as
 *  the landing page, per this repo's own product decision to demo a clean
 *  first-load state. */
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
    channels: [{ type: "email", elapsed: "06:12", current: true, preview: "CXi SME Email", address: "ray.torres@outlook.com" }],
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
    channels: [{ type: "voice", elapsed: "02:05", current: true, preview: "Support_Voice_1-833-457-2672" }],
    escalationStatus: "resolved",
    // Full call transcript (this is the demo voice interaction — its "Chat"
    // tab renders as "Transcript" instead, see InteractionHeader's
    // isVoiceCall prop) — a complete greeting-to-resolution arc rather than
    // the shorter exchange the digital channels above use, since a real
    // call transcript reads as one continuous conversation rather than
    // discrete back-and-forth chat turns.
    messages: [
      { id: "1", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 01:58AM · Voice", text: "Thanks for calling in — can I get your name and the order number for the package you're asking about?" },
      { id: "2", variant: "customer", senderName: "Customer", timestamp: "Today, 01:58AM · Voice", text: "It's Jordan Lee, order number 48213-B. It was supposed to arrive three days ago." },
      { id: "3", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 01:59AM · Voice", text: "Thanks, Jordan — give me just a moment while I pull up the tracking details." },
      { id: "4", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 02:00AM · Voice", text: "I can see your package has been sitting at the regional facility for 5 days with no scan movement — that's not typical for this carrier, and it's on us to fix." },
      { id: "5", variant: "customer", senderName: "Customer", timestamp: "Today, 02:02AM · Voice", text: "This is really frustrating, I needed this for a trip this weekend.", alert: { message: "Critical sentiment detected", severity: "critical" } },
      { id: "6", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 02:03AM · Voice", text: "I completely understand, and I'm sorry for the inconvenience. I'm filing a lost-package claim with the carrier right now and having a replacement shipped overnight at no cost to you." },
      { id: "7", variant: "customer", senderName: "Customer", timestamp: "Today, 02:04AM · Voice", text: "Okay, thank you for taking care of this. Will I get a new tracking number?" },
      { id: "8", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 02:04AM · Voice", text: "Yes — you'll get a confirmation email with the new tracking number within the hour, and the replacement should arrive by tomorrow afternoon." },
      { id: "9", variant: "customer", senderName: "Customer", timestamp: "Today, 02:05AM · Voice", text: "That works, thank you for your help." },
      { id: "10", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 02:05AM · Voice", text: "You're very welcome, Jordan. Is there anything else I can help with today?" },
      { id: "11", variant: "customer", senderName: "Customer", timestamp: "Today, 02:05AM · Voice", text: "No, that's everything." },
      { id: "12", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 02:05AM · Voice", text: "Great — take care, and again, sorry for the delay. Goodbye!" },
    ],
    callEvents: [
      { id: "ev1", afterMessageId: "3", kind: "hold", label: "Call on hold", timestamp: "Today, 01:59AM" },
      { id: "ev2", afterMessageId: "3", kind: "resume", label: "Call resumed", timestamp: "Today, 02:00AM" },
      { id: "ev3", afterMessageId: "12", kind: "ended", label: "Call ended", timestamp: "Today, 02:05AM" },
    ],
    // Demo content for the Live Transcript/Script toggle (see
    // CustomerInteractionPanel's own CallScriptSection doc comment) — a
    // "lost/delayed shipment" script that lines up with how this call
    // actually plays out above, so switching to Script mid-demo still reads
    // as plausible guidance for the same call.
    script: [
      {
        heading: "Greeting",
        lines: [
          "Thanks for calling in — can I get your name and the order number for the package you're asking about?",
        ],
      },
      {
        heading: "Verify & Acknowledge",
        lines: [
          "Thanks, [Customer Name] — give me just a moment while I pull up the tracking details.",
          "I can see your package has been sitting at the regional facility for [X] days with no scan movement — that's not typical for this carrier, and it's on us to fix.",
        ],
      },
      {
        heading: "Resolution",
        lines: [
          "I completely understand, and I'm sorry for the inconvenience. I'm filing a lost-package claim with the carrier right now and having a replacement shipped overnight at no cost to you.",
          "You'll get a confirmation email with the new tracking number within the hour, and the replacement should arrive by tomorrow afternoon.",
        ],
      },
      {
        heading: "Closing",
        lines: [
          "Is there anything else I can help with today?",
          "You're very welcome. Take care, and again, sorry for the delay. Goodbye!",
        ],
      },
    ],
  },
  {
    // The 4th demo channel (chat/email/voice already covered above) — links
    // to Priya Nair's real DIRECTORY_CUSTOMERS record (customerId: "priya"),
    // same as sofia/ray, and reuses her actual phoneNumbers entry as the
    // channel's address. Short, casual back-and-forth (SMS reads as quick
    // texts, not the longer chat/email exchanges above) and fully resolved
    // by the end, unlike sofia/ray's still-open threads — one demo case
    // that isn't mid-conversation.
    id: "priya",
    customerName: "Priya Nair",
    customerId: "priya",
    elapsed: "04:12",
    issueSummary: "Got two order confirmation texts for the same order and worried she'd been charged twice.",
    subject: "Duplicate order confirmation text",
    caseId: "CASE-48462",
    channels: [{ type: "sms", elapsed: "04:12", current: true, preview: "CXi SME SMS", address: "+14565559981" }],
    escalationStatus: "resolved",
    messages: [
      { id: "1", variant: "customer", senderName: "Priya Nair", timestamp: "Today, 09:10AM · SMS", text: "Hi, I got two order confirmation texts for order 55210 today. Was I charged twice?" },
      { id: "2", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 09:10AM · SMS", text: "Hi Priya, let me take a look — one sec" },
      { id: "3", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 09:12AM · SMS", text: "Good news — the second text was just a shipping update, not a new order. Only one charge went through." },
      { id: "4", variant: "customer", senderName: "Priya Nair", timestamp: "Today, 09:12AM · SMS", text: "Oh good, that definitely had me worried lol" },
      { id: "5", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 09:13AM · SMS", text: "Totally get it! I'll flag it with our notifications team so that message reads clearer next time." },
      { id: "6", variant: "customer", senderName: "Priya Nair", timestamp: "Today, 09:13AM · SMS", text: "Appreciate it, thank you!" },
      { id: "7", variant: "support-agent", senderName: CURRENT_AGENT_NAME, timestamp: "Today, 09:14AM · SMS", text: "Anytime! Anything else I can help with today?" },
      { id: "8", variant: "customer", senderName: "Priya Nair", timestamp: "Today, 09:14AM · SMS", text: "Nope that's it, thanks again!" },
    ],
  },
];

/* ── Notifications ── (no mock records — starts empty) */

const INITIAL_NOTIFICATIONS: AgentNotification[] = [];

/* ── AgentNextGenPage ── */

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
}: {
  showPageHeader?: boolean;
  showPanelToggle?: boolean;
}) {
  // Expanded by default — unless the viewport is already too narrow at
  // mount, in which case starting expanded would just auto-collapse a tick
  // later (see the isNavNarrow effect below), producing a visible flash.
  const [navOpen, setNavOpen] = useState(() => window.innerWidth >= NAV_NARROW_BREAKPOINT);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | undefined>(undefined);
  // The Outcome popup's open state (`InteractionActionsBar`'s
  // `OutcomeButton`) — lifted up here (rather than left as that button's own
  // internal state) so a future consumer of this same interaction could
  // coordinate against it if needed; currently just passed straight through.
  const [outcomeButtonOpen, setOutcomeButtonOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("available");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
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

  /* Internal chat state — defaults docked, same as the Contacts/Directory/
   *  Schedule slide-in (`slideInVariant` below). AI Assistant and Chat are
   *  meant to dock side by side (AI left, Chat right — see the docked-panel
   *  render order further down), so they're exempt from each other's
   *  single-dock rule; docking AI no longer touches this at all, which is
   *  also what keeps this defaulting to docked in practice — it used to
   *  get silently flipped to false the moment AI was docked, even before
   *  Chat was ever opened. Notifications is still the odd one out: docking
   *  Notifications forces both AI and Chat to undock, and docking either
   *  one still forces Notifications to float (see handleAiVariantChange/
   *  handleChatVariantChange/handleNotifVariantChange).
   *
   *  Not docked means a real floating `Draggable` window
   *  (`InternalChatFloatPanel`), not an anchored popover — there's no third
   *  presentation. `chatFloatPosition` is only ever an explicit override:
   *  set by `openInternalChatWith` (New Outbound's Agents chat icon) so
   *  that entry point opens right where it was clicked; `null` otherwise,
   *  in which case `getChatFloatPosition` computes a generic default. See
   *  `InternalChatFloatPanel`'s own class doc comment for the full picture. */
  const [chatOpen,        setChatOpen]        = useState(false);
  const [chatDocked,      setChatDocked]      = useState(true);
  /** "Maximize" on chat — approved as "Auto-dock, then maximize" (chat has
   *  no fixed content-column spot to take over while floating, unlike the
   *  SlideInPage-based destinations, which already have a "full" variant —
   *  see `slideInMaximized`'s own doc comment). `handleChatMaximize` below
   *  docks first if currently floating, then sets this. Checked directly at
   *  the render-branch call site (`chatOpen && chatMaximized`) rather than
   *  folded into `isFullPageActive`, since that flag also drives
   *  `slideInOpen` and has no reason to know about chat. Reset on close. */
  const [chatMaximized,   setChatMaximized]   = useState(false);
  const [chatFloatPosition, setChatFloatPosition] = useState<{ top: number; left: number } | null>(null);
  const [chatWidth,       setChatWidth]       = useState(380);
  const [chatIsResizing,  setChatIsResizing]  = useState(false);
  const [chatView,        setChatView]        = useState<ChatView>({ kind: "list" });
  const [chatSearch,      setChatSearch]      = useState("");
  const [chatFavoriteIds, setChatFavoriteIds] = useState<string[]>(INITIAL_FAVORITE_EMPLOYEE_IDS);
  const [chatThreads,     setChatThreads]     = useState<Record<string, InternalChatMessage[]>>(INITIAL_CHAT_THREADS);
  const [chatDraft,       setChatDraft]       = useState("");

  // Shared by every "close chat" path (header trigger's onOpenChange(false),
  // the docked panel's own close button, and handleNavClick below when
  // Contacts/Directory/Schedule takes over) so they all reset the same
  // fields rather than each open-coding a subset.
  const closeInternalChat = () => {
    setChatOpen(false);
    setChatFloatPosition(null);
    setChatView({ kind: "list" });
    setChatSearch("");
    setChatMaximized(false);
  };

  /** Maximize handler passed to both `InternalChatDockedPanel` and
   *  `InternalChatFloatPanel` — see `chatMaximized`'s own doc comment for
   *  why chat auto-docks first instead of maximizing straight from float. */
  const handleChatMaximize = () => {
    if (!chatDocked) setChatDocked(true);
    setChatMaximized(true);
  };

  /* Right-side nav destinations — one per header nav icon. Most slide in
   *  beside the interaction; Settings/Dashboard instead take over the whole
   *  content column (see FULL_PAGE_DESTINATIONS/isFullPageActive below).
   *  `lastSlideIn` lags behind `openSlideInPage` on close so a slide-in's
   *  title/icon/content don't blank out mid-way through the width-collapse
   *  animation — only relevant for the slide-in destinations, so it's never
   *  updated for a full-page one. Defaults to "dashboard" (Control
   *  Center) — with the rail starting empty (see `assignments` above),
   *  that's the landing page rather than the "No active interaction
   *  selected" empty state. */
  const [openSlideInPage, setOpenSlideInPage] = useState<NavDestination | null>("dashboard");
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
   *  do among themselves.
   *
   *  Separately, Contacts/Directory/Schedule/Internal Chat *are* mutually
   *  exclusive with each other — one replaces the other. That's a different
   *  axis than the float/dock single-dock-rule above (it's about whether
   *  the panel is open at all, not where it docks) — see handleNavClick
   *  and closeInternalChat above. */
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
  /** "Maximize" on a docked/floating slide-in (Contacts/Directory/Schedule/
   *  Custom Workspace) — takes the same content over the whole content
   *  column, same idea as `customerProfileMaximized` above (see its own
   *  doc comment) but folded into `isFullPageActive` below instead of a
   *  separate body-row-level branch, since "take over all panels" here
   *  means the same content-column takeover Settings/Dashboard already do,
   *  not just this row. Only ever meaningful while `activeAssignment`
   *  exists and the panel would otherwise render docked/floating — with no
   *  active interaction, a slide-in destination already renders full (see
   *  the no-`activeAssignment` branch below), so there's nothing to
   *  maximize there and no button is shown. Reset on close and on
   *  switching which slide-in destination is open (see the effects below)
   *  so reopening — or switching to — a destination never surprises the
   *  agent by starting already maximized. */
  const [slideInMaximized, setSlideInMaximized] = useState(false);

  /* Control Center (dashboard) — queue widget drill-down selection, mirrors
   *  lyra-ui's own Templates/Dashboards story exactly (AgentDashboard +
   *  InteriorPanel + AgentDashboardQueueDrilldown). */
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const handleNavClick = (item: NavDestination) => {
    setOpenSlideInPage((v) => {
      const next = v === item ? null : item;
      if (next && !FULL_PAGE_DESTINATIONS.has(next)) {
        setLastSlideIn(next as SlideInDestination);
        // Contacts/Directory/Schedule/Internal Chat are mutually exclusive
        // (see slideInVariant's doc comment above) — opening one of these
        // three closes chat if it's currently open, in any presentation.
        if (chatOpen) closeInternalChat();
      }
      return next;
    });
  };
  /** True for Settings/Dashboard (always full-page) and for a maximized
   *  slide-in destination while an interaction is active (see
   *  `slideInMaximized`'s own doc comment) — both take over the whole
   *  content column the same way, just for different reasons, so every
   *  existing consumer of this flag (the render branch below, `slideInOpen`)
   *  already does the right thing for both without needing to know which
   *  case it is. */
  const isFullPageActive =
    openSlideInPage !== null && (FULL_PAGE_DESTINATIONS.has(openSlideInPage) || slideInMaximized);
  // Reset whenever the slide-in closes entirely, or the agent switches to a
  // *different* destination while one was maximized — otherwise reopening
  // Contacts after minimizing Directory (say) would start already maximized,
  // and switching straight from a maximized Directory to Contacts would
  // carry the maximized state over to a destination that never asked for it.
  useEffect(() => {
    if (openSlideInPage === null) setSlideInMaximized(false);
  }, [openSlideInPage]);
  useEffect(() => {
    setSlideInMaximized(false);
  }, [lastSlideIn]);
  const handleDirectoryContactAction = (contact: DirectoryCustomer | DirectoryAgent, channel: ChannelType) => {
    // eslint-disable-next-line no-console
    console.log("Directory contact action:", channel, contact.name);
  };

  /** Dispatches a `SlideInDestination` to its actual content — shared by
   *  every place this needs rendering (the docked/float `slideInPanel`
   *  instance below, the no-interaction "full" branch, and the maximized-
   *  with-an-interaction "full" branch), so the three don't drift out of
   *  sync the way three independent copies of this same ternary would.
   *  Custom Workspace's `<iframe>` fills whatever container it's placed in
   *  (`h-full w-full`) — same content regardless of panel vs. full variant. */
  const renderSlideInContent = (destination: SlideInDestination): React.ReactNode => {
    switch (destination) {
      case "directory":
        return (
          <DirectoryPage
            customers={DIRECTORY_CUSTOMERS}
            agents={DIRECTORY_AGENTS}
            skills={DIRECTORY_SKILLS}
            teams={DIRECTORY_TEAMS}
            onContactAction={handleDirectoryContactAction}
          />
        );
      case "customWorkspace":
        return (
          <iframe
            src={CUSTOM_WORKSPACE_URL}
            title="Custom Workspace"
            className="h-full w-full flex-1 border-0"
          />
        );
      default:
        return <SlideInPlaceholder />;
    }
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

  /** Overview tab's CRM field edits (Address/Customer Since/Company/Account
   *  Owner/Language/Timezone/Status) — same "live state here, not on
   *  DIRECTORY_CUSTOMERS itself" reasoning as `customerNotes` above, keyed
   *  by customer id so editing one customer's record never bleeds into
   *  another's. Only ever holds the fields the agent has actually saved —
   *  merged onto the seed record at the render site below, so an
   *  unedited field just falls through to its original seed value. */
  const [customerFieldOverrides, setCustomerFieldOverrides] = useState<Record<string, Partial<DirectoryCustomer>>>({});
  const handleUpdateCustomerFields = (customerId: string, fields: Partial<DirectoryCustomer>) => {
    setCustomerFieldOverrides((prev) => ({ ...prev, [customerId]: { ...prev[customerId], ...fields } }));
  };

  /* Customer Profile panel — lyra-ui's CreateNew no longer supports a "view
   *  customer card" action from an outbound search result (dropped along
   *  with the flat-search API this app used to build OUTBOUND_CONFIG
   *  against — see the comment above it), so this panel now only ever
   *  shows the active interaction's own customer. Docks to the right of
   *  the conversation (inside the body row, below the header rows — see
   *  the render site below) rather than the left of the whole content
   *  column like it used to; defaults open (not closed) since it's meant
   *  to be there by default now, not an occasional lookup. */
  const [sidePanelOpen,      setSidePanelOpen]      = useState(true);
  const [sidePanelWidth,     setSidePanelWidth]     = useState(320);
  /** Takes over the whole body row (conversation hidden) instead of
   *  sharing it with `CustomerInteractionPanel` — same "swap the tab
   *  switcher for a real TabList once there's room" idea `CustomerProfilePanel`'s
   *  own `collapsed` prop describes; this is what drives that prop.
   *  Reset whenever the panel itself closes, so re-opening it never comes
   *  back maximized by surprise. */
  const [customerProfileMaximized, setCustomerProfileMaximized] = useState(false);
  /** The body row's own container — measured below so the auto-maximize
   *  effect can tell how much width the conversation actually has left,
   *  independent of window resize alone (dragging the panel wider, or the
   *  left nav expanding/collapsing, both change this without firing a
   *  window resize event). */
  const bodyRowRef = useRef<HTMLDivElement>(null);

  // See customerProfileMaximized's doc comment above — closing the panel
  // always drops it out of the maximized takeover too.
  useEffect(() => {
    if (!sidePanelOpen) setCustomerProfileMaximized(false);
  }, [sidePanelOpen]);

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

  /** Below this, chat bubbles/email rows/voice transcript rows all start
   *  wrapping badly — matches `chatWidth`'s own default float width (380)
   *  as a "comfortably narrow panel" benchmark already used elsewhere in
   *  this file, rather than inventing a new number. */
  const MIN_CONVERSATION_WIDTH = 380;

  // Auto-maximize Customer Profile once its own docked width is squeezing
  // the conversation below MIN_CONVERSATION_WIDTH. Within a single
  // interaction this is one-way: it takes over but doesn't automatically
  // restore itself once space frees up again (e.g. the agent drags the
  // panel narrower, or widens the window), so sitting right at the
  // threshold doesn't flicker back and forth — the Minimize2 button in the
  // maximized header is still there to go back manually. Switching to a
  // *different* interaction, though, re-evaluates from scratch (per-
  // interaction, not session-sticky) — a roomy interaction never inherits
  // maximized state left over from a squeezed one.
  //
  // Re-checked three different ways, because the row can get squeezed (or
  // its squeeze can become irrelevant) for different reasons:
  //  1. A different interaction becomes active — reset and re-measure fresh
  //     for it, per the per-interaction behavior above.
  //  2. The row's own box shrinks for a reason other than switching
  //     interactions — window resize, nav collapsing/expanding, or another
  //     docked panel (AI Assistant/Notifications/Internal Chat) appearing
  //     alongside this one. A `ResizeObserver` on the row catches all of
  //     these for free, instead of hand-listing every possible cause as a
  //     dependency (the previous version only listed `windowWidth` and
  //     `navOpen`, so docking another panel never re-ran the check at all).
  //  3. The row stays the same size but the split *within* it changes —
  //     dragging this panel's own resize handle wider. That doesn't resize
  //     the row, so the observer alone wouldn't see it; re-run on
  //     `sidePanelWidth` changes to cover it.
  const checkSqueezeRef = useRef<() => void>(() => {});
  checkSqueezeRef.current = () => {
    if (!sidePanelOpen || customerProfileMaximized) return;
    const row = bodyRowRef.current;
    if (!row) return;
    const conversationWidth = row.getBoundingClientRect().width - sidePanelWidth;
    if (conversationWidth < MIN_CONVERSATION_WIDTH) setCustomerProfileMaximized(true);
  };

  // Reset-and-recompute fresh for the newly active interaction — computed
  // directly (not via checkSqueezeRef, which only ever flips false→true)
  // since this specific case can go either direction.
  useEffect(() => {
    if (!sidePanelOpen) { setCustomerProfileMaximized(false); return; }
    const row = bodyRowRef.current;
    if (!row) { setCustomerProfileMaximized(false); return; }
    const conversationWidth = row.getBoundingClientRect().width - sidePanelWidth;
    setCustomerProfileMaximized(conversationWidth < MIN_CONVERSATION_WIDTH);
    // Only meant to fire on interaction switch — sidePanelWidth/sidePanelOpen
    // changes are handled by the other effects below.
  }, [activeAssignmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const row = bodyRowRef.current;
    if (!row) return;
    const observer = new ResizeObserver(() => checkSqueezeRef.current());
    observer.observe(row);
    return () => observer.disconnect();
  }, [activeAssignmentId]);

  useEffect(() => {
    checkSqueezeRef.current();
  }, [sidePanelWidth, sidePanelOpen]);

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
  const activeCurrentChannelKey = activeAssignment ? resolveCurrentChannelKey(activeAssignment) : undefined;
  const activeChannel = activeAssignment?.channels.find((c) => channelKey(c) === activeCurrentChannelKey);
  const activeChannelType = activeChannel?.type;
  const isActiveAssignmentVoiceCall = activeChannelType === "voice";
  // Row 3 (`InteractionInfoBar`) follows whichever channel is current, not a
  // fixed assignment-level value — see `AssignmentChannel`'s own doc
  // comment for why (e.g. an elevated card's Email channel can be a
  // genuinely different case than its Voice channel).
  // Trailing `?? ""` only matters when there's no active assignment at all
  // (nothing renders `InteractionInfoBar` in that case anyway) — keeps these
  // plain `string`, matching that prop's required type, without a third
  // fallback layer that never actually shows.
  const activeSubject = activeChannel?.subject ?? activeAssignment?.subject ?? "";
  const activeCaseId = activeChannel?.caseId ?? activeAssignment?.caseId ?? "";
  const activeEscalationStatus = activeChannel?.escalationStatus ?? activeAssignment?.escalationStatus;
  // Merges any saved Overview-tab edits (see `customerFieldOverrides` above)
  // onto the seed record — the panel itself only ever sees this merged
  // view, never DIRECTORY_CUSTOMERS directly, so an edited field survives
  // switching tabs/interactions same as a note does.
  const baseActiveCustomer = DIRECTORY_CUSTOMERS.find((c) => c.id === activeAssignment?.customerId);
  const activeCustomer = baseActiveCustomer
    ? { ...baseActiveCustomer, ...customerFieldOverrides[baseActiveCustomer.id] }
    : undefined;
  /** The outbound-contact record backing a given assignment's customer, if
   *  any — feeds each card's own `AddOutboundButton` (name/avatar/channels
   *  it supports), rendered as `InteractionNavItem.headerAction` now (see
   *  the assignment-card render below) rather than just the active
   *  assignment's header, since every card gets its own "+" next to the
   *  customer name. `undefined` (internal agent calls, a not-yet-identified
   *  caller) just means no "+" renders for that card. */
  const getOutboundContact = (customerId?: string): CreateNewOutboundContact | undefined =>
    DIRECTORY_CUSTOMERS.find((c) => c.id === customerId);

  // Shared by the composer's real Send action and the fake outbound-call
  // transcript below — appends one message to a specific assignment
  // (not necessarily the active one, though in practice it always is for
  // Send; the outbound demo below fires on a timer and the agent could in
  // theory have switched away by the time it lands). Timestamp/channel
  // label mirror this file's own seeded mock messages' format
  // ("Today, H:MMAM · Chat") so an appended message reads identically to
  // the scripted ones already in the thread. `prev.map` naturally no-ops
  // if the assignment's since been dismissed, so no extra guard is needed
  // for that case.
  const appendMessageToAssignment = (
    assignmentId: string,
    message: Pick<Message, "variant" | "senderName" | "text">,
    channelLabel: string
  ) => {
    const newMessage: Message = {
      ...message,
      id: `${assignmentId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: `Today, ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ${channelLabel}`,
    };
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, messages: [...a.messages, newMessage] } : a))
    );
  };

  // Composer's Send button (CustomerInteractionPanel → MessageComposer) —
  // appends a real outgoing message to whichever assignment is active.
  const handleSendMessage = (text: string) => {
    if (!activeAssignmentId) return;
    // CHANNEL_TYPE_META (lyra-ui) over a hand-rolled ternary — covers every
    // channel type's real label (e.g. "SMS", not "Chat") instead of just
    // the two this previously special-cased.
    const channelLabel = activeChannelType ? CHANNEL_TYPE_META[activeChannelType].label : "Chat";
    appendMessageToAssignment(activeAssignmentId, { variant: "support-agent", senderName: CURRENT_AGENT_NAME, text }, channelLabel);
  };

  // Fake, staggered transcript for a brand-new outbound voice call — a
  // generic opening exchange (the call has no real content yet, it was
  // just dialed from New Outbound) that arrives a line at a time on a
  // timer, mimicking live transcription rather than the whole thing
  // appearing at once. Each `TranscriptMessageRow` animates in on mount
  // (see its own `animate-in` classes), so this reads as the transcript
  // actively building rather than just intermittently updating.
  const scheduleOutboundVoiceDemoTranscript = (assignmentId: string, contactName: string, skillLabel?: string) => {
    const agentFirstName = CURRENT_AGENT_NAME.split(" ")[0];
    const topic = skillLabel ?? "your account";
    const lines: { variant: Message["variant"]; senderName: string; text: string; delayMs: number }[] = [
      { variant: "support-agent", senderName: CURRENT_AGENT_NAME, delayMs: 1200,
        text: `Hi, this is ${agentFirstName} calling from support — is now an okay time to chat?` },
      { variant: "customer", senderName: contactName, delayMs: 3200,
        text: "Sure, go ahead." },
      { variant: "support-agent", senderName: CURRENT_AGENT_NAME, delayMs: 5600,
        text: `Great — I'm calling about ${topic}. I just wanted to check in and see how everything's going.` },
      { variant: "customer", senderName: contactName, delayMs: 8000,
        text: "Oh, thanks for reaching out — things have been fine so far." },
    ];
    lines.forEach(({ delayMs, ...message }) => {
      setTimeout(() => appendMessageToAssignment(assignmentId, message, "Voice"), delayMs);
    });
  };

  /** Every customer-facing outbound channel gets a fake, staggered opening
   *  exchange now, not just voice — starting an outbound chat/email/SMS/
   *  WhatsApp should never leave the agent looking at a blank thread any
   *  more than an outbound call would. Voice keeps its own dedicated
   *  function above (transcript-specific copy); every other channel routes
   *  through `buildOutboundChannelDemoLines`'s per-channel script. Called
   *  from all three customer-facing outbound paths — a brand-new New
   *  Outbound pick, adding a channel to an already-open card, and an
   *  unmatched phone/email — but deliberately NOT from the agent-to-agent
   *  internal call branch in `handleStartOutboundCall`: that's a real
   *  colleague, not a scripted customer, so it stays empty/live. */
  const scheduleOutboundDemoTranscript = (
    assignmentId: string,
    channel: ChannelType,
    contactName: string,
    skillLabel?: string
  ) => {
    if (channel === "voice") {
      scheduleOutboundVoiceDemoTranscript(assignmentId, contactName, skillLabel);
      return;
    }
    const channelLabel = CHANNEL_TYPE_META[channel].label;
    const lines = buildOutboundChannelDemoLines(channel, contactName, skillLabel);
    lines.forEach(({ delayMs, ...message }) => {
      setTimeout(() => appendMessageToAssignment(assignmentId, message, channelLabel), delayMs);
    });
  };

  // On an elevated (2+ channel) card, each open channel's own status
  // dropdown is independent — changing one leaves the others exactly as
  // they were, same as their subject/case ID already behave (see
  // `AssignmentChannel`'s own doc comment). A single-channel card keeps the
  // simpler assignment-level status it always had.
  const handleEscalationStatusChange = (assignmentId: string, status: EscalationStatus) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== assignmentId) return a;
        if (a.channels.length > 1) {
          const currentKey = resolveCurrentChannelKey(a);
          return {
            ...a,
            channels: a.channels.map((c) => (channelKey(c) === currentKey ? { ...c, escalationStatus: status } : c)),
          };
        }
        return { ...a, escalationStatus: status };
      })
    );
  };

  // Switching interactions always lands back on the Chat tab — seeing a
  // different customer's history tab still open after switching would be odd.
  const handleSelectAssignment = (id: string) => {
    setActiveAssignmentId(id);
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

  // Unassign & Dismiss from a tile's own per-channel kebab menu (see
  // `channel-row.tsx`'s `buildVoiceMenuItems`/`buildDigitalMenuItems` —
  // every channel type's default menu already wires this action to
  // `InteractionNavItem`'s `onDismiss`/`onDismissChannel`; this app just
  // wasn't passing either prop down yet, so the action fired but did
  // nothing). Most assignments here only ever have one open channel, so in
  // practice `onDismiss` (whole-card removal) is the one that usually
  // fires — `onDismissChannel` handles the case where "Add Outbound" (see
  // `handleAddOutboundChannel` below) has put a second channel on the same
  // card. Clearing `activeAssignmentId` only when the dismissed card was
  // the active one — matches `handleCloseInteraction` above rather than
  // auto-selecting another tile, so dismissing a background tile never
  // disturbs whatever the agent is currently looking at.
  const handleDismissAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setActiveAssignmentId((prev) => (prev === id ? undefined : prev));
  };

  const handleDismissChannel = (assignmentId: string, channel: InteractionChannel) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? { ...a, channels: a.channels.filter((c) => (c.id ?? c.type) !== (channel.id ?? channel.type)) }
          : a
      )
    );
  };

  // Shared by `InteractionNavItem`'s own `onCurrentChannelChange` (clicking
  // a channel row on the card) and `InteractionActionsBar`'s channel-type
  // segment (its kebab's "Unassign & Dismiss" aside, selecting a different
  // channel now only happens on the card itself) — both read this same
  // piece of state (see `Assignment.currentChannelKey`'s own doc comment).
  const handleChannelSelect = (assignmentId: string, key: string) => {
    setAssignments((prev) => prev.map((a) => (a.id === assignmentId ? { ...a, currentChannelKey: key } : a)));
  };

  /** The card's own "+" (`AddOutboundButton`, `InteractionNavItem
   *  .headerAction`) — starts another channel with the customer already on
   *  this interaction. Unlike `handleStartOutboundCall` below (always
   *  creates a brand-new assignment tile), this appends to the *existing*
   *  assignment's own `channels` array and makes the new channel current,
   *  so the agent sees one card with two live channels instead of two
   *  separate cards for the same customer — each channel gets its own full
   *  row on that card (see `InteractionNavItem`'s own doc comment), stacked
   *  under the first. */
  const handleAddOutboundChannel = (assignmentId: string, channel: ChannelType, address: string, skillId: string) => {
    const skillLabel = OUTBOUND_CONFIG.skillOptions.find((o) => o.value === skillId)?.label;
    const channelLabel = OUTBOUND_CONFIG.channelOptions.find((o) => o.id === channel)?.label ?? channel;
    const newChannel: AssignmentChannel = {
      id: `${channel}-${Date.now()}`,
      type: channel,
      elapsed: "00:00",
      current: true,
      preview: skillLabel,
      address,
      // Its own subject/case ID — this is a new, separate case being opened
      // on the same customer's card (see `AssignmentChannel`'s own doc
      // comment), not a continuation of whatever the card's other channel(s)
      // are already about.
      subject:
        channel === "email"
          ? fakeOutboundEmailSubject()
          : `Outbound ${channelLabel}${skillLabel ? ` — ${skillLabel}` : ""}`,
      caseId: generateCaseId(),
    };
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              channels: [...a.channels, newChannel],
              currentChannelKey: channelKey(newChannel),
              // Same "every outbound voice call gets a script" rule as
              // handleStartOutboundCall/handleStartUnmatchedOutbound above —
              // this is a customer-facing card (never reached for the
              // agent-to-agent internal call, which has its own branch),
              // just adding voice as a second channel rather than starting
              // the whole card fresh.
              script: channel === "voice" ? buildOutboundVoiceScript(a.customerName ?? "the customer", skillLabel) : a.script,
            }
          : a
      )
    );
    const assignment = assignments.find((a) => a.id === assignmentId);
    scheduleOutboundDemoTranscript(assignmentId, channel, assignment?.customerName ?? "the customer", skillLabel);
  };

  /** New Outbound's `onStartCall` — fired for every matched-contact outbound
   *  attempt except the Agents-group "chat" icon (that's intercepted
   *  earlier by `onOpenInternalChat`, straight into Internal Chat, and
   *  never reaches here). Two cases actually create an assignment tile:
   *   - Customer-kind contact, any channel — a genuine new customer
   *     interaction, so it gets a real tile (linked to its
   *     `DIRECTORY_CUSTOMERS` record via `customerId`) and becomes active,
   *     same as picking any other assignment card.
   *   - Agent-kind contact, voice channel only — an internal agent-to-agent
   *     call. Still gets a tile (so the call shows up in the same
   *     assignment rail every other interaction does, and the agent doesn't
   *     lose track of it while working something else), but flagged
   *     `isInternalAgentCall` so the tile reads as internal (headset icon,
   *     no customer identity) rather than as a customer card. Every other
   *     agent-kind channel is a no-op here — agents only ever offer
   *     "chat"/"voice" (see `DIRECTORY_AGENTS`), and chat never reaches this
   *     handler in the first place.
   *  Skill/Team/External-kind contacts are left as a console log only for
   *  now — nothing asked for a tile in those cases yet. */
  const handleStartOutboundCall = (selection: {
    contact: CreateNewOutboundContact;
    channel: ChannelType;
    phone: string;
    skillId: string;
  }) => {
    const { contact, channel, phone, skillId } = selection;
    const skillLabel = OUTBOUND_CONFIG.skillOptions.find((o) => o.value === skillId)?.label;
    const channelLabel = OUTBOUND_CONFIG.channelOptions.find((o) => o.id === channel)?.label ?? channel;

    if (contact.kind === "agent") {
      if (channel !== "voice") {
        // eslint-disable-next-line no-console
        console.log("Start call:", channel, "→", contact.name, `(phone: ${phone}, skill: ${skillId})`);
        return;
      }
      const id = `agent-call-${contact.id}-${Date.now()}`;
      const newAssignment: Assignment = {
        id,
        customerName: contact.name,
        elapsed: "00:00",
        issueSummary: `Internal voice call with ${contact.name}.`,
        subject: `Internal call — ${contact.name}`,
        caseId: generateCaseId(),
        channels: [{ type: "voice", elapsed: "00:00", current: true, preview: skillLabel }],
        escalationStatus: "in-progress",
        messages: [],
        isInternalAgentCall: true,
      };
      setAssignments((prev) => [newAssignment, ...prev]);
      setActiveAssignmentId(id);
        // Starting this call always surfaces the interaction panel — if
      // Control Center/Settings currently has the whole content column
      // (see `isFullPageActive`), close it so `activeAssignment` takes over
      // there instead of leaving the agent on the page they started from.
      // Matches `handleSelectAssignment`'s own full-page-dismiss behavior;
      // other slide-ins (Directory, etc.) already yield to `activeAssignment`
      // without needing this since they're not full-page.
      setOpenSlideInPage((v) => (v !== null && FULL_PAGE_DESTINATIONS.has(v) ? null : v));
      return;
    }

    if (contact.kind === "customer") {
      const id = `outbound-${contact.id}-${Date.now()}`;
      const newAssignment: Assignment = {
        id,
        customerName: contact.name,
        customerId: contact.id,
        elapsed: "00:00",
        issueSummary: buildOutboundIssueSummary(skillLabel),
        subject: channel === "email" ? fakeOutboundEmailSubject() : `Outbound ${channelLabel}`,
        caseId: generateCaseId(),
        channels: [{ type: channel, elapsed: "00:00", current: true, preview: skillLabel, address: phone }],
        escalationStatus: "in-progress",
        messages: [],
        script: channel === "voice" ? buildOutboundVoiceScript(contact.name, skillLabel) : undefined,
      };
      setAssignments((prev) => [newAssignment, ...prev]);
      setActiveAssignmentId(id);
        // Same full-page dismiss as the internal-agent-call branch above.
      setOpenSlideInPage((v) => (v !== null && FULL_PAGE_DESTINATIONS.has(v) ? null : v));
      scheduleOutboundDemoTranscript(id, channel, contact.name, skillLabel);
      return;
    }

    // eslint-disable-next-line no-console
    console.log("Start call:", channel, "→", contact.name, `(phone: ${phone}, skill: ${skillId})`);
  };

  /** New Outbound's `onStartUnmatchedOutbound` — fired when the agent
   *  completes the flow for a phone number/email typed into search that
   *  didn't match anyone in the directory (`OutboundDetailScreen`'s
   *  `!contact` branch, "No match found in directory"). Mirrors
   *  `handleStartOutboundCall`'s customer-kind branch above — new tile,
   *  made active, full-page slide-in dismissed, fake demo transcript
   *  scheduled — just without a `customerId`/directory record to link,
   *  since there isn't one. There's no name either, so the typed address
   *  itself becomes `customerName`: more useful to the agent on the tile
   *  than falling back to `InteractionNavItem`'s generic "Customer" label
   *  (`scheduleOutboundDemoTranscript`'s own `isLikelyPersonName` check
   *  keeps the demo script itself from addressing a phone number as if it
   *  were a name). */
  const handleStartUnmatchedOutbound = (input: { channel: ChannelType; value: string; skillId: string }) => {
    const { channel, value, skillId } = input;
    const skillLabel = OUTBOUND_CONFIG.skillOptions.find((o) => o.value === skillId)?.label;
    const channelLabel = OUTBOUND_CONFIG.channelOptions.find((o) => o.id === channel)?.label ?? channel;
    const id = `outbound-unmatched-${Date.now()}`;
    const newAssignment: Assignment = {
      id,
      customerName: value,
      elapsed: "00:00",
      issueSummary: buildOutboundIssueSummary(skillLabel),
      subject: channel === "email" ? fakeOutboundEmailSubject() : `Outbound ${channelLabel}`,
      caseId: generateCaseId(),
      channels: [{ type: channel, elapsed: "00:00", current: true, preview: skillLabel, address: value }],
      escalationStatus: "in-progress",
      messages: [],
      // isLikelyPersonName guards the fake transcript's own opening line
      // above (never addresses a raw phone/email as if it were a name);
      // the script's "Hi, this is..." intro only ever names the agent, so
      // it doesn't need that same guard.
      script: channel === "voice" ? buildOutboundVoiceScript(value, skillLabel) : undefined,
    };
    setAssignments((prev) => [newAssignment, ...prev]);
    setActiveAssignmentId(id);
    // Same full-page dismiss as handleStartOutboundCall's branches above.
    setOpenSlideInPage((v) => (v !== null && FULL_PAGE_DESTINATIONS.has(v) ? null : v));
    scheduleOutboundDemoTranscript(id, channel, value, skillLabel);
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
    // Single-dock rule: undock chat rather than forcing a float position —
    // getChatFloatPosition computes one on render instead.
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
    // AI and Chat are deliberately exempt from the single-dock rule between
    // each other — they're meant to dock side by side (AI left, Chat right,
    // see the docked-panel render order below), so docking AI here no
    // longer touches `chatDocked` at all. Notifications stays the odd one
    // out, still exclusive against both (the block above, and the mirrored
    // one in handleChatVariantChange/handleNotifVariantChange below).
    setAiVariant(v);
  };

  /* Chat: docking here undocks Notifications if it's currently docked (still
   *  exclusive — see handleAiVariantChange's own comment on why AI/Chat are
   *  exempt from that rule between each other, just not against
   *  Notifications); chat itself only ever toggles `chatDocked` (see
   *  InternalChatDockedPanel's "Undock" button, which fires v === "float",
   *  and InternalChatFloatPanel's own "Dock to side" button, which fires
   *  v === "docked"). Undocking clears any explicit `chatFloatPosition` so
   *  it lands via `getChatFloatPosition`'s computed default rather than a
   *  stale one-off position from an earlier `openInternalChatWith` call. */
  const handleChatVariantChange = (v: DraggableVariant) => {
    if (v === "float") {
      setChatFloatPosition(null);
      setChatDocked(false);
      return;
    }
    if (notifVariant === "docked" && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      notifFloatLeft.current = r.left + containerRef.current.offsetWidth - notifWidth - 16;
      notifFloatTop.current  = null;
      setNotifVariant("float");
    }
    setChatDocked(true);
  };

  /** Default float position for the header-opened case (no explicit
   *  `chatFloatPosition` from `openInternalChatWith`) — near the top-right
   *  of the interaction area, same fallback formula AI/Notifications use
   *  for their own float defaults (see `getAiFloatStyle`/`getNotifFloatStyle`
   *  above). */
  const getChatFloatPosition = (): { top: number; left: number } => {
    if (chatFloatPosition) return chatFloatPosition;
    const rect = containerRef.current?.getBoundingClientRect();
    return {
      top: (rect?.top ?? 0) + 16,
      left: containerRef.current ? (rect?.left ?? 0) + containerRef.current.offsetWidth - CHAT_FLOAT_WIDTH - 16 : 16,
    };
  };

  const handleChatOpenChange = (next: boolean) => {
    if (!next) {
      closeInternalChat();
      return;
    }
    setChatOpen(true);
    // The header trigger only ever drives the float or docked presentation
    // — clear any leftover explicit position so a stray earlier float
    // (opened via openInternalChatWith) doesn't linger behind it; the float
    // block falls back to getChatFloatPosition's computed default instead.
    setChatFloatPosition(null);
    // Contacts/Directory/Schedule/Internal Chat are mutually exclusive — see
    // handleNavClick's own comment on this. Only clears a slide-in, never a
    // full-page destination (Settings/Dashboard), which chat can coexist with.
    setOpenSlideInPage((v) => (v !== null && !FULL_PAGE_DESTINATIONS.has(v) ? null : v));
  };

  /** Opens Internal Chat straight into a thread with one employee — used
   *  by the New Outbound popover's Agents-group "chat" row icon, so
   *  clicking it lands in the exact same chat window/thread the header's
   *  Internal Chat icon opens. If chat isn't already open in any
   *  presentation, it opens as a floating window near `clickPosition` (the
   *  icon click's viewport coordinates) instead of `getChatFloatPosition`'s
   *  generic header-relative default, so the window lands near the agent's
   *  mouse/focus rather than across the screen at the header. If chat is
   *  already open somewhere (float or docked), this just switches the
   *  thread in place without moving or re-presenting it. */
  const openInternalChatWith = (employeeId: string, clickPosition?: { x: number; y: number }) => {
    if (!chatOpen && clickPosition) {
      setChatFloatPosition({
        top: Math.min(Math.max(clickPosition.y - 24, 16), window.innerHeight - CHAT_FLOAT_HEIGHT - 16),
        left: Math.min(Math.max(clickPosition.x + 16, 16), window.innerWidth - CHAT_FLOAT_WIDTH - 16),
      });
    }
    setChatView({ kind: "chat", employeeId });
    setChatOpen(true);
    // Same Contacts/Directory/Schedule/Internal Chat exclusivity as
    // handleChatOpenChange above — this is just a second entry point into
    // the same "chat is now open" state.
    setOpenSlideInPage((v) => (v !== null && !FULL_PAGE_DESTINATIONS.has(v) ? null : v));
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
      headerActions={
        <ActionIconButton
          title="Maximize"
          onClick={() => {
            // Auto-dock, then maximize — same policy approved for Internal
            // Chat's own maximize (see chatMaximized), applied here too for
            // consistency: maximizing takes over the whole content column,
            // so there's no reason to stay floating first.
            if (slideInVariant !== "docked") handleSlideInVariantChange("docked");
            setSlideInMaximized(true);
          }}
        >
          <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
        </ActionIconButton>
      }
    >
      {renderSlideInContent(lastSlideIn)}
    </SlideInPage>
  ) : null;

  return (
    <div className="flex flex-col h-screen bg-lyra-bg-surface-shell overflow-hidden animate-in fade-in-0 duration-500">

      {/* ── App Header ── */}
      <AppHeader
        appName={
          <AppName
            // Hidden for user testing — restore by putting this back:
            // icon={<img src={appIcon} alt="Agent Workspace" className="h-6 w-6" />}
            name="Agent Workspace"
            compact={isCompactHeader}
            // Plain heading now — no app-switcher menu behind it at all
            // (see AppName's own `interactive` doc comment in app-name.tsx).
            interactive={false}
          />
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
             *  InternalChatTrigger's MessageSquareText icon just below — both
             *  lyra-ui/app components with no size prop of their own, so
             *  matching them means sizing up from NavIconButton's own h-4 w-4
             *  default rather than shrinking those two down. strokeWidth 1.5
             *  already matches across all of them (NavIconButton hardcodes
             *  it), so size was the only inconsistency. */}
            <NavIconButton item="customWorkspace" title="Custom Workspace" icon={Monitor} activeNav={openSlideInPage} onNavClick={handleNavClick} iconClassName="h-5 w-5" />
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
              // Just toggles chatOpen now — the float/docked panel that
              // actually renders is a separate mount point below (see
              // "Internal Chat — docked"/"Internal Chat — floating" further
              // down), same as the AI Assistant/Notifications triggers.
              open={chatOpen}
              onOpenChange={handleChatOpenChange}
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
                outbound={{
                  ...OUTBOUND_CONFIG,
                  onStartCall: handleStartOutboundCall,
                  onStartUnmatchedOutbound: handleStartUnmatchedOutbound,
                  onOpenInternalChat: openInternalChatWith,
                }}
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
              {assignments.map((a) => {
                const outboundContact = getOutboundContact(a.customerId);
                return (
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
                    currentChannelKey={resolveCurrentChannelKey(a)}
                    onCurrentChannelChange={(key) => handleChannelSelect(a.id, key)}
                    // "+" now lives on the card itself, top-right next to the
                    // customer name — matches the new assignment-card design;
                    // used to live in `InteractionHeader`'s Row 1, scoped to
                    // just the active assignment (see `getOutboundContact`'s
                    // own doc comment above). `undefined` contact (no
                    // matching directory record) renders nothing here, same
                    // as before.
                    headerAction={
                      outboundContact ? (
                        <AddOutboundButton
                          contact={outboundContact}
                          channelOptions={OUTBOUND_CONFIG.channelOptions}
                          phoneOptions={OUTBOUND_CONFIG.phoneOptions}
                          skillOptions={OUTBOUND_CONFIG.skillOptions}
                          openChannelTypes={a.channels.map((c) => c.type)}
                          onStart={(channel, address, skillId) => handleAddOutboundChannel(a.id, channel, address, skillId)}
                        />
                      ) : undefined
                    }
                    avatarIcon={a.isInternalAgentCall ? <Headset className="h-4 w-4" strokeWidth={1.5} /> : undefined}
                    onDismiss={() => handleDismissAssignment(a.id)}
                    onDismissChannel={(channel) => handleDismissChannel(a.id, channel)}
                  />
                );
              })}
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

          {/* Main Container — Customer Profile now docks inside the body row
              below (right side, pushes the conversation narrower) instead of
              sitting here as a flex sibling of the whole content column —
              see the body row further down for the actual panel. */}
          <Container className="flex flex-1 overflow-hidden relative">

            {/* Content column: PageHeader + page body */}
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
              {chatOpen && chatMaximized ? (
                /* Internal Chat, maximized — checked ahead of
                 *  `isFullPageActive` (and independent of it, see
                 *  `chatMaximized`'s own doc comment) so this wins the
                 *  content column even in the one edge case where both
                 *  could technically be true at once: Settings/Dashboard
                 *  stays open underneath (chat can coexist with a full-page
                 *  destination, per handleChatOpenChange/openInternalChatWith),
                 *  and the agent then maximizes chat on top of it. */
                <InternalChatMaximizedPanel
                  onMinimize={() => setChatMaximized(false)}
                  onClose={closeInternalChat}
                  {...chatSharedProps}
                />
              ) : isFullPageActive ? (
                FULL_PAGE_DESTINATIONS.has(openSlideInPage as NavDestination) ? (
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
                ) : (
                  /* A slide-in destination (Contacts/Directory/Schedule/
                   *  Custom Workspace), maximized while an interaction is
                   *  active — see `slideInMaximized`'s own doc comment.
                   *  Same "full" variant the no-`activeAssignment` branch
                   *  below already uses, just reachable with an interaction
                   *  live underneath too now, plus a Minimize button to
                   *  return to it. */
                  <SlideInPage
                    variant="full"
                    open
                    title={SLIDE_IN_META[lastSlideIn].title}
                    icon={SLIDE_IN_META[lastSlideIn].icon}
                    onClose={() => setOpenSlideInPage(null)}
                    headerActions={
                      <ActionIconButton title="Minimize" onClick={() => setSlideInMaximized(false)}>
                        <Minimize2 className="h-4 w-4" strokeWidth={1.5} />
                      </ActionIconButton>
                    }
                  >
                    {renderSlideInContent(lastSlideIn)}
                  </SlideInPage>
                )
              ) : activeAssignment ? (
                <>
                  {showPageHeader && (
                    <InteractionHeader
                      customerName={activeAssignment.customerName}
                      onCloseInteraction={handleCloseInteraction}
                      panelToggle={showPanelToggle ? "left" : undefined}
                      onPanelToggle={() => setSidePanelOpen((v) => !v)}
                      aiPanelOpen={aiPanelOpen}
                      onAskAiClick={() => setAiPanelOpen((v) => !v)}
                      // Now sits right next to the customer name, in this same
                      // row — moved out of `AppHeader`'s `center` slot (see
                      // that component's own history in app-header.tsx's doc
                      // comment) back to living with the interaction it
                      // controls. Trade-off worth knowing: unlike the
                      // AppHeader placement, this disappears whenever this
                      // header itself isn't on screen (Control Center,
                      // Settings, Directory, etc. all replace it) — Dave
                      // asked for it here regardless, so no `center`-slot
                      // fallback is kept.
                      actionsBar={
                        <InteractionActionsBar
                          isVoiceCall={isActiveAssignmentVoiceCall}
                          customerName={activeAssignment.customerName}
                          issueSummary={activeAssignment.issueSummary}
                          currentChannelType={activeChannelType}
                          outcomeOpen={outcomeButtonOpen}
                          onOutcomeOpenChange={setOutcomeButtonOpen}
                          // Same "dismiss just this channel vs. the whole
                          // card" split `InteractionNavItem`'s own row
                          // kebabs already use (see
                          // `handleDismissChannel`/`handleDismissAssignment`
                          // above).
                          onDismissCurrentChannel={
                            activeChannel
                              ? () => {
                                  if (activeAssignment.channels.length > 1) handleDismissChannel(activeAssignment.id, activeChannel);
                                  else handleDismissAssignment(activeAssignment.id);
                                }
                              : undefined
                          }
                        />
                      }
                    />
                  )}
                  {showPageHeader && (
                    <InteractionInfoBar
                      subject={activeSubject}
                      caseId={activeCaseId}
                      escalationStatus={activeEscalationStatus ?? activeAssignment.escalationStatus}
                      onEscalationStatusChange={(status) => activeAssignmentId && handleEscalationStatusChange(activeAssignmentId, status)}
                    />
                  )}
                  {/* Body row: main content + Customer Profile. Slide-in
                   *  panel, when docked, renders outside this Container
                   *  entirely (sibling of containerRef, alongside
                   *  Notifications/AI/Chat) rather than inside the
                   *  interaction's own card — see that block below for why.
                   *  Customer Profile is different: it's part of this
                   *  interaction's own layout (right-docked, pushes the
                   *  conversation narrower), so it lives in here instead. */}
                  <div ref={bodyRowRef} className="relative flex flex-1 overflow-hidden">
                    {customerProfileMaximized ? (
                      /* Full takeover — same idea as the Settings/Dashboard
                       * takeover above (isFullPageActive), just scoped to
                       * this row: header rows above stay put, only the
                       * conversation/panel split underneath is replaced. */
                      <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-lyra-bg-surface-container-subtle">
                        <div className="flex shrink-0 items-center justify-between border-b border-lyra-border-subtle px-4 py-2.5">
                          <span className="lyra-heading-sm text-lyra-fg-default">Customer Profile</span>
                          <div className="flex items-center gap-1">
                            <ActionIconButton title="Restore" onClick={() => setCustomerProfileMaximized(false)}>
                              <Minimize2 className="h-4 w-4" strokeWidth={1.5} />
                            </ActionIconButton>
                            <ActionIconButton title="Close" onClick={() => setSidePanelOpen(false)}>
                              <X className="h-4 w-4" strokeWidth={1.5} />
                            </ActionIconButton>
                          </div>
                        </div>
                        <CustomerProfilePanel
                          customer={activeCustomer}
                          notes={activeCustomer ? customerNotes[activeCustomer.id] ?? [] : []}
                          onAddNote={(text) => activeCustomer && handleAddCustomerNote(activeCustomer.id, text)}
                          onContactAction={handleSnapshotContactAction}
                          onUpdateCustomer={(fields) => activeCustomer && handleUpdateCustomerFields(activeCustomer.id, fields)}
                          collapsed={false}
                        />
                      </div>
                    ) : (
                      <>
                        <CustomerInteractionPanel
                          messages={activeAssignment.messages}
                          isVoiceCall={isActiveAssignmentVoiceCall}
                          callEvents={activeAssignment.callEvents}
                          script={activeAssignment.script}
                          onSendMessage={handleSendMessage}
                          sendOnEnter={activeChannelType !== "email"}
                          isEmailChannel={activeChannelType === "email"}
                          toAddress={activeChannel?.address}
                        />
                        {showPanelToggle && (
                          <SidePanel
                            side="right"
                            open={sidePanelOpen}
                            pinned
                            headerTitle="Customer Profile"
                            headerActions={
                              <>
                                <ActionIconButton title="Maximize" onClick={() => setCustomerProfileMaximized(true)}>
                                  <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
                                </ActionIconButton>
                                <ActionIconButton title="Close" onClick={() => setSidePanelOpen(false)}>
                                  <X className="h-4 w-4" strokeWidth={1.5} />
                                </ActionIconButton>
                              </>
                            }
                            width={sidePanelWidth}
                            onWidthChange={setSidePanelWidth}
                          >
                            <CustomerProfilePanel
                              customer={activeCustomer}
                              notes={activeCustomer ? customerNotes[activeCustomer.id] ?? [] : []}
                              onAddNote={(text) => activeCustomer && handleAddCustomerNote(activeCustomer.id, text)}
                              onContactAction={handleSnapshotContactAction}
                              onUpdateCustomer={(fields) => activeCustomer && handleUpdateCustomerFields(activeCustomer.id, fields)}
                              collapsed
                            />
                          </SidePanel>
                        )}
                      </>
                    )}
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
                  {renderSlideInContent(lastSlideIn)}
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

        {/* AI Panel — docked (sibling of containerRef so flex layout keeps it in-bounds).
         *  Rendered first among the docked extras — regardless of which of
         *  Notifications/Slide-in/Chat is also docked, AI always lands
         *  immediately to the right of the interaction and to the left of
         *  every other docked panel, never the other way around. */}
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

        {/* Slide-in panel — docked (sibling of containerRef, same as
         *  Notifications/AI/Chat below — NOT nested inside the interaction's
         *  own Container/card, so it always sits outside the interaction
         *  panel with a real gap between the two, rather than reading as
         *  one merged surface. Rendered right after AI (see AI's own comment
         *  above on why AI always leads) so it's still the next thing to the
         *  right of the interaction whenever AI isn't docked.
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

        {/* Internal Chat — docked (sibling of containerRef so flex layout keeps it in-bounds).
         *  `chatDocked`/`!chatDocked` below are the only gate now — float and
         *  docked are strictly either/or, however chat got opened. Also
         *  collapses to width 0 while maximized (same idea as `chatOpen`'s
         *  own width-0 collapse) — the maximized takeover below is the only
         *  thing visible then, this docked slot has nothing to show. */}
        {chatDocked && (
          <div className="pb-3" style={{
            width: chatOpen && !chatMaximized ? chatWidth : 0,
            marginRight: chatOpen && !chatMaximized ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: chatIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{
                width: chatWidth,
                display: chatOpen && !chatMaximized ? "block" : "none",
              }}
            >
              <InternalChatDockedPanel
                open={chatOpen}
                onClose={closeInternalChat}
                onVariantChange={handleChatVariantChange}
                onWidthChange={setChatWidth}
                onResizeStateChange={setChatIsResizing}
                onMaximize={handleChatMaximize}
                defaultWidth={chatWidth}
                {...chatSharedProps}
              />
            </div>
          </div>
        )}

        {/* Internal Chat — floating (default undocked presentation, opened
         *  from the header icon or from openInternalChatWith, e.g. New
         *  Outbound's Agents-group chat icon — see getChatFloatPosition and
         *  InternalChatFloatPanel's own class doc comment). Portals to
         *  document.body, so it renders outside this flex row entirely —
         *  position is fixed viewport coordinates set at open time.
         *  `!chatMaximized` isn't strictly needed here (`handleChatMaximize`
         *  docks before maximizing, so this branch is moot by the time
         *  `chatMaximized` is true) but kept for symmetry/defensiveness with
         *  the docked branch above. */}
        {chatOpen && !chatDocked && !chatMaximized && (
          <InternalChatFloatPanel
            position={getChatFloatPosition()}
            onClose={closeInternalChat}
            onDock={() => handleChatVariantChange("docked")}
            onMaximize={handleChatMaximize}
            {...chatSharedProps}
          />
        )}

      </div>
    </div>
  );
}
