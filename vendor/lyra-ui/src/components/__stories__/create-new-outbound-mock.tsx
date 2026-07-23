/**
 * Shared "Create New → Outbound" mock config for the `outbound` prop on
 * `CreateNew`. Used by CreateNew.stories.tsx (the component's own story)
 * and by every story/template that composes CreateNew as a LeftNav footer
 * (LeftNav.stories.tsx's "Agent Next Gen Left Nav", AgentNextGenTemplate.
 * stories.tsx) — kept in one place so all of them stay in sync instead of
 * three copies of the same 100-agent config quietly drifting apart.
 */
import { Phone, Mail, MessageSquare } from "lucide-react";
import type {
  CreateNewOutboundConfig,
  CreateNewOutboundContact,
  CreateNewOutboundGroup,
} from "../create-new";
import { CREATE_NEW_AGENTS } from "./create-new-agents-data";
import { CREATE_NEW_CUSTOMERS } from "./create-new-customers-data";

/* ── WhatsApp icon (not in lucide) ── */
export const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const OUTBOUND_AGENTS: CreateNewOutboundContact[] = CREATE_NEW_AGENTS.map((a) => ({
  id: a.id,
  name: a.name,
  initials: initialsFor(a.name),
  subtitle: a.agentId,
  avatarClassName: a.avatarClassName,
  channels: a.channels,
  status: a.status,
}));

const OUTBOUND_CUSTOMERS: CreateNewOutboundContact[] = CREATE_NEW_CUSTOMERS.map((c) => ({
  id: c.id,
  name: c.name,
  initials: initialsFor(c.name),
  subtitle: c.customerId,
  avatarClassName: c.avatarClassName,
  channels: c.channels,
}));

const OUTBOUND_TEAMS: CreateNewOutboundContact[] = [
  { id: "t1", name: "Billing Support",    initials: "BS", subtitle: "TEAM-04", avatarClassName: "bg-lyra-accent-purple-soft text-lyra-accent-purple-strong", channels: ["voice", "email"] },
  { id: "t2", name: "Tier 2 Escalations", initials: "T2", subtitle: "TEAM-07", avatarClassName: "bg-lyra-accent-red-soft text-lyra-accent-red-strong",       channels: ["voice", "email"] },
];

const OUTBOUND_SKILLS: CreateNewOutboundContact[] = [
  { id: "s1", name: "Spanish Language",  initials: "ES", subtitle: "SKL-12", avatarClassName: "bg-lyra-accent-green-soft text-lyra-accent-green-strong", channels: ["voice", "email"], status: "available", queueCount: 4, waitTimeSeconds: 200 },
  { id: "s2", name: "Technical Support", initials: "TS", subtitle: "SKL-03", avatarClassName: "bg-lyra-accent-blue-soft text-lyra-accent-blue-strong",   channels: ["voice", "email"], status: "busy",      queueCount: 7, waitTimeSeconds: 95 },
];

const OUTBOUND_GROUPS: CreateNewOutboundGroup[] = [
  { id: "favorites", label: "Favorites", kind: "favorites", emptyMessage: "No favorites yet" },
  { id: "agents", label: "Agents", searchPlaceholder: "Search Agents", contacts: OUTBOUND_AGENTS },
  { id: "teams", label: "Teams", searchPlaceholder: "Search teams", contacts: OUTBOUND_TEAMS },
  { id: "skills", label: "Skills", searchPlaceholder: "Search skills", contacts: OUTBOUND_SKILLS },
  { id: "customers", label: "Customers", searchPlaceholder: "Search customers", contacts: OUTBOUND_CUSTOMERS },
  { id: "dialpad", label: "Dial Pad", kind: "dialpad" },
];

const OUTBOUND_SKILL_OPTIONS = [
  { value: "general", label: "General Support" },
  { value: "technical", label: "Technical Support" },
  { value: "billing", label: "Billing" },
  { value: "sales", label: "Sales" },
  { value: "escalations", label: "Escalations" },
  { value: "vip", label: "VIP Support" },
  { value: "spanish", label: "Spanish Language" },
  { value: "retention", label: "Retention" },
];

const OUTBOUND_PHONE_OPTIONS = [
  { value: "+14563833329", label: "(456) 383-3329" },
  { value: "+14565559981", label: "(456) 555-9981" },
  { value: "+14565550147", label: "(456) 555-0147" },
];

export const OUTBOUND_CONFIG: CreateNewOutboundConfig = {
  outboundTitle: "New Outbound",
  groups: OUTBOUND_GROUPS,
  defaultGroupId: "agents",
  channelOptions: [
    { id: "voice",    label: "Call",     selectLabel: "Voice", icon: <Phone         className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "email",    label: "Email",                          icon: <Mail          className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "sms",      label: "SMS",                            icon: <MessageSquare className="h-5 w-5" strokeWidth={1.5} /> },
    { id: "whatsapp", label: "WhatsApp",                       icon: <WhatsAppIcon /> },
  ],
  phoneOptions: OUTBOUND_PHONE_OPTIONS,
  skillOptions: OUTBOUND_SKILL_OPTIONS,
  onQuickDial: (phoneNumber) => {
    // eslint-disable-next-line no-console
    console.log("Quick dial:", phoneNumber);
  },
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
  pageSize: 10,
};
