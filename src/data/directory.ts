import { CHANNEL_ACCENT, type ChannelType, type CreateNewOutboundContact, type CreateNewOutboundGroup } from "@nicecxone/lyra-ui";

// `CHANNEL_ACCENT` used to be stood in here as a placeholder — it's now a
// real `@nicecxone/lyra-ui` export (added alongside the channel-colored
// chip/border work in `channel-row.tsx`/`interaction-nav-item.tsx`), so
// every call site imports it from there directly instead.

/* ── Types ──
 * Customers/Agents reuse CreateNewOutboundContact's shape (the same one
 * the app's "New Outbound" contact picker uses) rather than inventing a
 * parallel one. Skills/Teams have no equivalent anywhere yet — they add a
 * membership list referencing Agent records by id. */

/** A single note left about a customer — persists across interactions
 *  (shown in the Customer Snapshot panel), not tied to one conversation. */
export interface CustomerNote {
  id: string;
  author: string;
  timestamp: string;
  text: string;
}

export interface DirectoryCustomer extends CreateNewOutboundContact {
  /** Year the customer relationship started — shown as "Customer since {year}". */
  customerSince?: string;
  tier?: "VIP" | "Standard";
  /** Total interactions on record — a quick sense of how often they reach out. */
  totalInteractions?: number;
  /** The channel they contact support on most often. */
  preferredChannel?: ChannelType;
  /** Short (1-2 sentence) freeform blurb — general behavior/preferences an
   *  agent should know at a glance. */
  about?: string;
  /** Most recent interaction BEFORE whichever one is currently open — a
   *  callback for context, not a recap of the live conversation. */
  lastInteraction?: {
    date: string;
    channel: ChannelType;
    summary: string;
    caseId?: string;
    handledBy?: string;
    outcome?: string;
  };
  /** Seed notes — copied into AgentNextGenPage's own live state on mount so
   *  adding a note doesn't mutate this module-level constant. */
  notes?: CustomerNote[];
}

export interface DirectoryAgent extends CreateNewOutboundContact {}

export interface DirectorySkill {
  id: string;
  name: string;
  description?: string;
  /** Routing channel this skill queues on — drives the row's leading icon
   *  color via CHANNEL_ACCENT[channelType]. */
  channelType: ChannelType;
  memberAgentIds: string[];
}

export interface DirectoryTeam {
  id: string;
  name: string;
  description?: string;
  memberAgentIds: string[];
}

/* ── Mock data ── */

export const DIRECTORY_CUSTOMERS: DirectoryCustomer[] = [
  {
    id: "sofia",
    name: "Sofia Martinez",
    initials: "SM",
    subtitle: "CST-10021",
    kind: "customer",
    avatarClassName: "bg-lyra-accent-green-soft text-lyra-accent-green-strong",
    channels: ["voice", "sms", "email", "whatsapp"],
    phoneNumbers: [
      { value: "+15552018842", label: "Mobile · (555) 201-8842" },
      { value: "+15552010091", label: "Home · (555) 201-0091" },
    ],
    emailAddresses: [
      { value: "sofia.martinez@gmail.com", label: "Personal · sofia.martinez@gmail.com" },
      { value: "sofia.martinez@northstarco.com", label: "Work · sofia.martinez@northstarco.com" },
    ],
    customerSince: "2022",
    tier: "VIP",
    totalInteractions: 14,
    preferredChannel: "chat",
    about: "Long-time customer who reaches out several times a year, almost always from her phone. Appreciates clear, step-by-step troubleshooting and quick follow-up.",
    lastInteraction: {
      date: "3 weeks ago",
      channel: "email",
      summary: "Asked about upgrading her plan to the Pro tier for additional storage. Walked her through the upgrade flow and confirmed the new billing amount.",
      caseId: "CASE-47821",
      handledBy: "Amara Okafor",
      outcome: "Resolved",
    },
    notes: [
      {
        id: "n1",
        author: "Amara Okafor",
        timestamp: "2 weeks ago",
        text: "Often on mobile — prioritize mobile-specific troubleshooting steps.",
      },
    ],
  },
  {
    id: "ray",
    name: "Ray Torres",
    initials: "RT",
    subtitle: "CST-10034",
    kind: "customer",
    avatarClassName: "bg-lyra-accent-pink-soft text-lyra-accent-pink-strong",
    channels: ["voice", "sms", "email"],
    phoneNumbers: [
      { value: "+15553407723", label: "Mobile · (555) 340-7723" },
      { value: "+15553401150", label: "Work · (555) 340-1150" },
    ],
    emailAddresses: [{ value: "ray.torres@outlook.com", label: "Personal · ray.torres@outlook.com" }],
    customerSince: "2023",
    tier: "Standard",
    totalInteractions: 5,
    preferredChannel: "voice",
    about: "Prefers to call rather than email or chat, especially for anything billing-related. Generally patient but appreciates a clear timeline for resolution.",
    lastInteraction: {
      date: "1 month ago",
      channel: "voice",
      summary: "Called about a failed payment on his subscription renewal. Diagnosed an expired card on file, updated it, and reprocessed the charge successfully.",
      caseId: "CASE-46390",
      handledBy: "John Smith",
      outcome: "Resolved",
    },
    notes: [
      {
        id: "n1",
        author: "John Smith",
        timestamp: "1 month ago",
        text: "Prefers phone calls over email for billing issues.",
      },
    ],
  },
  {
    id: "priya",
    name: "Priya Nair",
    initials: "PN",
    subtitle: "CST-10099",
    kind: "customer",
    avatarClassName: "bg-lyra-accent-blue-soft text-lyra-accent-blue-strong",
    channels: ["voice", "sms", "email"],
    phoneNumbers: [{ value: "+15558124407", label: "Mobile · (555) 812-4407" }],
    emailAddresses: [
      { value: "priya.nair@vantiq.io", label: "Work · priya.nair@vantiq.io" },
      { value: "priya.nair@gmail.com", label: "Personal · priya.nair@gmail.com" },
    ],
    customerSince: "2021",
    tier: "Standard",
    totalInteractions: 3,
    preferredChannel: "voice",
    about: "Infrequent contact — mostly account-management questions rather than issues. Straightforward interactions, usually resolved in one call.",
    lastInteraction: {
      date: "2 months ago",
      channel: "voice",
      summary: "Asked how to add a second user to her account. Walked her through the multi-user settings and confirmed the invite was sent.",
      caseId: "CASE-44215",
      handledBy: "Diego Fernandez",
      outcome: "Resolved",
    },
    notes: [],
  },
  {
    id: "marcus",
    name: "Marcus Webb",
    initials: "MW",
    subtitle: "CST-10112",
    kind: "customer",
    avatarClassName: "bg-lyra-accent-purple-soft text-lyra-accent-purple-strong",
    channels: ["email", "whatsapp"],
    emailAddresses: [{ value: "marcus.webb@icloud.com", label: "Personal · marcus.webb@icloud.com" }],
    customerSince: "2024",
    tier: "Standard",
    totalInteractions: 2,
    preferredChannel: "whatsapp",
    about: "New customer, still getting familiar with the product. Reaches out over WhatsApp almost exclusively.",
    lastInteraction: {
      date: "2 weeks ago",
      channel: "whatsapp",
      summary: "Reported a late shipment that hadn't arrived. Filed a lost-package claim with the carrier and sent a replacement at no cost.",
      caseId: "CASE-48044",
      handledBy: "John Smith",
      outcome: "Resolved",
    },
    notes: [],
  },
];

export const DIRECTORY_AGENTS: DirectoryAgent[] = [
  {
    id: "john-smith",
    name: "John Smith",
    initials: "JS",
    subtitle: "Support Agent · Available",
    kind: "agent",
    avatarClassName: "bg-lyra-accent-blue-soft text-lyra-accent-blue-strong",
    channels: ["chat", "voice"],
  },
  {
    id: "amara",
    name: "Amara Okafor",
    initials: "AO",
    subtitle: "Support Agent · Available",
    kind: "agent",
    avatarClassName: "bg-lyra-accent-teal-soft text-lyra-accent-teal-strong",
    channels: ["chat", "voice"],
  },
  {
    id: "diego",
    name: "Diego Fernandez",
    initials: "DF",
    subtitle: "Support Agent · Available",
    kind: "agent",
    avatarClassName: "bg-lyra-accent-purple-soft text-lyra-accent-purple-strong",
    channels: ["chat", "voice"],
  },
  {
    id: "lena",
    name: "Lena Kowalski",
    initials: "LK",
    subtitle: "Support Agent · Offline",
    kind: "agent",
    avatarClassName: "bg-lyra-accent-pink-soft text-lyra-accent-pink-strong",
    channels: ["chat"],
  },
  {
    id: "tomas",
    name: "Tomás Ibáñez",
    initials: "TI",
    subtitle: "Support Agent · Available",
    kind: "agent",
    avatarClassName: "bg-lyra-accent-lime-soft text-lyra-accent-lime-strong",
    channels: ["chat", "voice"],
  },
  {
    id: "priya-shah",
    name: "Priya Shah",
    initials: "PS",
    subtitle: "Team Supervisor · Available",
    kind: "agent",
    avatarClassName: "bg-lyra-accent-slate-soft text-lyra-accent-slate-strong",
    channels: ["chat", "voice"],
  },
];

export const DIRECTORY_SKILLS: DirectorySkill[] = [
  {
    id: "general-support",
    name: "General Support",
    description: "First-line chat support for general account questions.",
    channelType: "chat",
    memberAgentIds: ["john-smith", "amara", "tomas"],
  },
  {
    id: "technical-support",
    name: "Technical Support",
    description: "App crashes, bugs, and troubleshooting.",
    channelType: "chat",
    memberAgentIds: ["diego", "tomas"],
  },
  {
    id: "billing",
    name: "Billing",
    description: "Charges, refunds, and subscription questions.",
    channelType: "email",
    memberAgentIds: ["amara", "lena"],
  },
  {
    id: "vip-support",
    name: "VIP Support",
    description: "Priority phone support for VIP customers.",
    channelType: "voice",
    memberAgentIds: ["john-smith", "diego"],
  },
];

export const DIRECTORY_TEAMS: DirectoryTeam[] = [
  {
    id: "tier-1",
    name: "Tier 1 Support",
    description: "Front-line support team.",
    memberAgentIds: ["john-smith", "amara", "tomas"],
  },
  {
    id: "escalations",
    name: "Escalations Team",
    description: "Handles escalated and critical cases.",
    memberAgentIds: ["diego", "lena"],
  },
  {
    id: "billing-team",
    name: "Billing Team",
    description: "Handles billing and account disputes.",
    memberAgentIds: ["amara", "lena"],
  },
];

/* ── New Outbound groups ──
 * CreateNew's outbound picker (screen 1) is a dropdown of groups — Agents /
 * Teams / Skills / Customers / Partner Directory, plus a standing
 * Favorites group — each with its own search + contact list, matching
 * lyra-ui's own Templates/CreateNew "Outbound" mock
 * (create-new-outbound-mock.tsx). This replaces an older flat-list-plus-
 * resultGroupLabel search field lyra-ui no longer supports
 * (`CreateNewOutboundConfig.groups` is now required). One casualty of that
 * shape change, with no equivalent in the new API: the "view customer
 * card" action on a searched contact. (A "Dial Pad" group used to stand in
 * for the unmatched-number call/email fallback too, but was removed from
 * this dropdown — the unmatched-number detail screen in
 * NewOutboundPopover.tsx already covers that case directly.)
 * Customers/Agents already match CreateNewOutboundContact's shape
 * natively; Teams/Skills don't carry initials/avatarClassName/channels of
 * their own (they're routing concepts, not contactable people), so those
 * are synthesized here. */

function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const OUTBOUND_TEAM_CONTACTS: CreateNewOutboundContact[] = DIRECTORY_TEAMS.map((team) => ({
  id: team.id,
  name: team.name,
  initials: initialsFor(team.name),
  subtitle: team.description,
  kind: "team",
  avatarClassName: "bg-lyra-accent-slate-soft text-lyra-accent-slate-strong",
  channels: ["voice", "sms", "email"],
}));

const OUTBOUND_SKILL_CONTACTS: CreateNewOutboundContact[] = DIRECTORY_SKILLS.map((skill) => {
  const accent = CHANNEL_ACCENT[skill.channelType];
  return {
    id: skill.id,
    name: skill.name,
    initials: initialsFor(skill.name),
    subtitle: skill.description,
    kind: "skill",
    avatarClassName: `${accent.bg} ${accent.text}`,
    channels: [skill.channelType],
  };
});

/** Placeholder external-directory contacts — the New Outbound flow spec
 *  calls for "some additional external directory names" alongside the core
 *  Favorites/Customers/Agents/Skills/Teams groups (e.g. a partner network
 *  or vendor contact list synced in from outside this system), but no real
 *  source/name was given. Standing in with one illustrative group so the
 *  group dropdown + "All" search demonstrate the shape; rename/replace
 *  once a real external directory is wired up. */
const OUTBOUND_EXTERNAL_DIRECTORY_CONTACTS: CreateNewOutboundContact[] = [
  { id: "ext-1", name: "Northwind Logistics", initials: "NL", subtitle: "Partner Network", kind: "external", avatarClassName: "bg-lyra-accent-slate-soft text-lyra-accent-slate-strong", channels: ["voice", "email"] },
  { id: "ext-2", name: "Fabrikam Support", initials: "FS", subtitle: "Partner Network", kind: "external", avatarClassName: "bg-lyra-accent-slate-soft text-lyra-accent-slate-strong", channels: ["voice", "email", "sms"] },
];

/** Groups for CreateNew's outbound picker dropdown. */
/** Shared placeholder across every contact-search group in the local
 *  NewOutboundPopover — that component's search box also doubles as the
 *  entry point for an unmatched phone number or email (see its "no match
 *  found" screen), so the placeholder says so rather than just "Search
 *  {group}". */
const OUTBOUND_SEARCH_PLACEHOLDER = "Enter phone, email or search term";

export const OUTBOUND_GROUPS: CreateNewOutboundGroup[] = [
  { id: "favorites", label: "Favorites", kind: "favorites", emptyMessage: "No favorites yet" },
  { id: "customers", label: "Customers", searchPlaceholder: OUTBOUND_SEARCH_PLACEHOLDER, contacts: DIRECTORY_CUSTOMERS },
  { id: "agents", label: "Agents", searchPlaceholder: OUTBOUND_SEARCH_PLACEHOLDER, contacts: DIRECTORY_AGENTS },
  { id: "skills", label: "Skills", searchPlaceholder: OUTBOUND_SEARCH_PLACEHOLDER, contacts: OUTBOUND_SKILL_CONTACTS },
  { id: "teams", label: "Teams", searchPlaceholder: OUTBOUND_SEARCH_PLACEHOLDER, contacts: OUTBOUND_TEAM_CONTACTS },
  { id: "partner-directory", label: "Partner Directory", searchPlaceholder: OUTBOUND_SEARCH_PLACEHOLDER, contacts: OUTBOUND_EXTERNAL_DIRECTORY_CONTACTS },
];
