import { useState } from "react";
import {
  TabList,
  Tab,
  SearchInput,
  ListItem,
  ActionIconButton,
  CHANNEL_ACCENT,
  type ChannelType,
} from "@nicecxone/lyra-ui";
import { User, Headset, Route, UsersRound, ChevronLeft, Phone, Mail, MessageSquare, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DirectoryCustomer, DirectoryAgent, DirectorySkill, DirectoryTeam } from "@/data/directory";

/* ── Contact action buttons — one icon button per channel the record
 *  supports, colored via `CHANNEL_ACCENT` (the same lyra-ui map the
 *  channel chips/tiles elsewhere in the app use). ── */

const CONTACT_CHANNEL_ORDER: ChannelType[] = ["voice", "email", "chat", "whatsapp"];

const CONTACT_CHANNEL_ICON: Record<ChannelType, typeof Phone> = {
  voice: Phone,
  email: Mail,
  chat: MessageSquare,
  sms: MessageSquare,
  whatsapp: MessageCircle,
};

const CONTACT_CHANNEL_LABEL: Record<ChannelType, string> = {
  voice: "Call",
  email: "Email",
  chat: "Chat",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

export function ContactActionButtons({
  channels,
  onAction,
}: {
  channels: ChannelType[];
  /** `event` carries the click's screen position — used by callers that
   *  need to open a floating window near the agent's mouse (see New
   *  Outbound's Agents-group "chat" icon → Internal Chat float). */
  onAction: (channel: ChannelType, event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const visible = CONTACT_CHANNEL_ORDER.filter((type) => channels.includes(type));
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {visible.map((type) => {
        const Icon = CONTACT_CHANNEL_ICON[type];
        const accent = CHANNEL_ACCENT[type];
        return (
          <ActionIconButton key={type} size="sm" title={CONTACT_CHANNEL_LABEL[type]} onClick={(e) => onAction(type, e)}>
            <Icon className={cn("h-4 w-4", accent.text)} strokeWidth={1.5} />
          </ActionIconButton>
        );
      })}
    </div>
  );
}

/* ── Avatar helper — matches the initials-circle pattern already
 *  established elsewhere in this app (CustomerInteractionPanel's
 *  MessageAvatar). ── */

function DirectoryAvatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full lyra-body-sm-emphasis", className)}>
      {initials}
    </div>
  );
}

/* ── DirectoryPage ── */

type DirectoryTab = "customers" | "agents" | "skills" | "teams";
type DrillDown = { kind: "skill" | "team"; id: string } | null;

export interface DirectoryPageProps {
  customers: DirectoryCustomer[];
  agents: DirectoryAgent[];
  skills: DirectorySkill[];
  teams: DirectoryTeam[];
  onContactAction: (contact: DirectoryCustomer | DirectoryAgent, channel: ChannelType) => void;
}

export function DirectoryPage({ customers, agents, skills, teams, onContactAction }: DirectoryPageProps) {
  const [activeTab, setActiveTab] = useState<DirectoryTab>("customers");
  const [search, setSearch] = useState("");
  const [drillDown, setDrillDown] = useState<DrillDown>(null);

  const handleTabChange = (tab: DirectoryTab) => {
    setActiveTab(tab);
    setSearch("");
    setDrillDown(null);
  };

  const query = search.trim().toLowerCase();
  const filteredCustomers = customers.filter((c) => c.name.toLowerCase().includes(query));
  const filteredAgents = agents.filter((a) => a.name.toLowerCase().includes(query));
  const filteredSkills = skills.filter((s) => s.name.toLowerCase().includes(query));
  const filteredTeams = teams.filter((t) => t.name.toLowerCase().includes(query));

  function renderContactRow(contact: DirectoryCustomer | DirectoryAgent) {
    return (
      <ListItem
        key={contact.id}
        leading={<DirectoryAvatar initials={contact.initials} className={contact.avatarClassName} />}
        title={contact.name}
        subtitle={contact.subtitle}
        trailing={<ContactActionButtons channels={contact.channels} onAction={(channel) => onContactAction(contact, channel)} />}
      />
    );
  }

  function renderBackRow(label: string) {
    return (
      <button
        type="button"
        onClick={() => setDrillDown(null)}
        className="flex items-center gap-1.5 px-4 py-3 lyra-body-sm text-lyra-fg-action transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        {label}
      </button>
    );
  }

  // Skill drill-down
  if (drillDown?.kind === "skill") {
    const skill = skills.find((s) => s.id === drillDown.id);
    const members = agents.filter((a) => skill?.memberAgentIds.includes(a.id));
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {renderBackRow("Back to Skills")}
        <div className="border-b border-lyra-border-subtle px-4 pb-3">
          <p className="lyra-heading-sm text-lyra-fg-default">{skill?.name}</p>
          {skill?.description && <p className="lyra-body-sm text-lyra-fg-secondary">{skill.description}</p>}
        </div>
        <div className="flex-1 overflow-y-auto">{members.map(renderContactRow)}</div>
      </div>
    );
  }

  // Team drill-down
  if (drillDown?.kind === "team") {
    const team = teams.find((t) => t.id === drillDown.id);
    const members = agents.filter((a) => team?.memberAgentIds.includes(a.id));
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {renderBackRow("Back to Teams")}
        <div className="border-b border-lyra-border-subtle px-4 pb-3">
          <p className="lyra-heading-sm text-lyra-fg-default">{team?.name}</p>
          {team?.description && <p className="lyra-body-sm text-lyra-fg-secondary">{team.description}</p>}
        </div>
        <div className="flex-1 overflow-y-auto">{members.map(renderContactRow)}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TabList className="px-2">
        <Tab active={activeTab === "customers"} onClick={() => handleTabChange("customers")} icon={<User className="h-4 w-4" strokeWidth={1.5} />}>
          Customers
        </Tab>
        <Tab active={activeTab === "agents"} onClick={() => handleTabChange("agents")} icon={<Headset className="h-4 w-4" strokeWidth={1.5} />}>
          Agents
        </Tab>
        <Tab active={activeTab === "skills"} onClick={() => handleTabChange("skills")} icon={<Route className="h-4 w-4" strokeWidth={1.5} />}>
          Skills
        </Tab>
        <Tab active={activeTab === "teams"} onClick={() => handleTabChange("teams")} icon={<UsersRound className="h-4 w-4" strokeWidth={1.5} />}>
          Teams
        </Tab>
      </TabList>

      <div className="px-4 py-3">
        <SearchInput value={search} onValueChange={setSearch} placeholder={`Search ${activeTab}`} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "customers" && filteredCustomers.map(renderContactRow)}
        {activeTab === "agents" && filteredAgents.map(renderContactRow)}

        {activeTab === "skills" && filteredSkills.map((skill) => {
          const accent = CHANNEL_ACCENT[skill.channelType];
          return (
            <ListItem
              key={skill.id}
              onClick={() => setDrillDown({ kind: "skill", id: skill.id })}
              leading={
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lyra-sm", accent.bg)}>
                  <Route className={cn("h-4 w-4", accent.text)} strokeWidth={1.5} />
                </div>
              }
              title={skill.name}
              subtitle={skill.description}
              meta={`${skill.memberAgentIds.length} agents`}
            />
          );
        })}

        {activeTab === "teams" && filteredTeams.map((team) => (
          <ListItem
            key={team.id}
            onClick={() => setDrillDown({ kind: "team", id: team.id })}
            leading={
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lyra-sm bg-lyra-bg-surface-container-subtle">
                <UsersRound className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />
              </div>
            }
            title={team.name}
            subtitle={team.description}
            meta={`${team.memberAgentIds.length} agents`}
          />
        ))}
      </div>
    </div>
  );
}
