import { CHANNEL_ACCENT, type ChannelType, type CreateNewOutboundContact } from "@nicecxone/lyra-ui";

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
    avatarClassName: "bg-lyra-accent-green-soft text-lyra-accent-green-strong",
    channels: ["voice", "sms", "email", "whatsapp"],
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
    avatarClassName: "bg-lyra-accent-pink-soft text-lyra-accent-pink-strong",
    channels: ["voice", "sms", "email"],
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
    avatarClassName: "bg-lyra-accent-blue-soft text-lyra-accent-blue-strong",
    channels: ["voice", "sms", "email"],
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
    avatarClassName: "bg-lyra-accent-purple-soft text-lyra-accent-purple-strong",
    channels: ["email", "whatsapp"],
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
    avatarClassName: "bg-lyra-accent-blue-soft text-lyra-accent-blue-strong",
    channels: ["chat", "voice", "sms"],
  },
  {
    id: "amara",
    name: "Amara Okafor",
    initials: "AO",
    subtitle: "Support Agent · Available",
    avatarClassName: "bg-lyra-accent-teal-soft text-lyra-accent-teal-strong",
    channels: ["chat", "voice", "sms"],
  },
  {
    id: "diego",
    name: "Diego Fernandez",
    initials: "DF",
    subtitle: "Support Agent · Available",
    avatarClassName: "bg-lyra-accent-purple-soft text-lyra-accent-purple-strong",
    channels: ["chat", "voice", "sms"],
  },
  {
    id: "lena",
    name: "Lena Kowalski",
    initials: "LK",
    subtitle: "Support Agent · Offline",
    avatarClassName: "bg-lyra-accent-pink-soft text-lyra-accent-pink-strong",
    channels: ["chat"],
  },
  {
    id: "tomas",
    name: "Tomás Ibáñez",
    initials: "TI",
    subtitle: "Support Agent · Available",
    avatarClassName: "bg-lyra-accent-lime-soft text-lyra-accent-lime-strong",
    channels: ["chat", "voice", "sms"],
  },
  {
    id: "priya-shah",
    name: "Priya Shah",
    initials: "PS",
    subtitle: "Team Supervisor · Available",
    avatarClassName: "bg-lyra-accent-slate-soft text-lyra-accent-slate-strong",
    channels: ["chat", "voice", "sms"],
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

/* ── New Outbound unified search ──
 * CreateNew's "New Outbound" flyout searches one flat list spanning every
 * Directory record type (Customers/Agents/Teams/Skills) rather than a
 * per-category picker — see CreateNewOutboundContact.resultGroupLabel.
 * Customers/Agents already match that shape natively; Teams/Skills don't
 * carry initials/avatarClassName/channels of their own (they're routing
 * concepts, not contactable people), so those are synthesized here. */

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
  avatarClassName: "bg-lyra-accent-slate-soft text-lyra-accent-slate-strong",
  channels: ["voice", "sms", "email"],
  resultGroupLabel: "Teams",
}));

const OUTBOUND_SKILL_CONTACTS: CreateNewOutboundContact[] = DIRECTORY_SKILLS.map((skill) => {
  const accent = CHANNEL_ACCENT[skill.channelType];
  return {
    id: skill.id,
    name: skill.name,
    initials: initialsFor(skill.name),
    subtitle: skill.description,
    avatarClassName: `${accent.bg} ${accent.text}`,
    channels: [skill.channelType],
    resultGroupLabel: "Skills",
  };
});

/** Every contact/agent/team/skill searchable from CreateNew's unified
 *  Outbound search field. */
export const OUTBOUND_SEARCH_CONTACTS: CreateNewOutboundContact[] = [
  ...DIRECTORY_AGENTS.map((agent): CreateNewOutboundContact => ({ ...agent, resultGroupLabel: "Agents" })),
  ...DIRECTORY_CUSTOMERS.map((customer): CreateNewOutboundContact => ({ ...customer, resultGroupLabel: "Customers" })),
  ...OUTBOUND_TEAM_CONTACTS,
  ...OUTBOUND_SKILL_CONTACTS,
];

/** Shown under "Favorites" before the user types anything in New Outbound. */
export const OUTBOUND_FAVORITE_CONTACT_IDS: string[] = ["sofia", "amara", "tier-1"];
