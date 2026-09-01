import { useState } from "react";
import {
  TabList,
  Tab,
  SearchInput,
  ListItem,
  ActionIconButton,
  CHANNEL_ACCENT,
  StatusIcon,
  type ChannelType,
  type AgentStatus,
  type CreateNewOutboundContact,
  type CreateNewChannelOption,
} from "@nicecxone/lyra-ui";
import { User, Headset, Route, UsersRound, ChevronLeft, Phone, Mail, MessageSquare, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { contactMatchesQuery, type DirectoryCustomer, type DirectoryAgent, type DirectorySkill, type DirectoryTeam } from "@/data/directory";
import { AddOutboundButton } from "@/components/NewOutboundPopover";

/* ── Contact action buttons — one icon button per channel the record
 *  supports, colored via `CHANNEL_ACCENT` (the same lyra-ui map the
 *  channel chips/tiles elsewhere in the app use). ── */

// Exported — NewOutboundPopover's own channel flyout menu reuses this exact
// order/icon/label mapping instead of a second copy (see its ContactRow).
export const CONTACT_CHANNEL_ORDER: ChannelType[] = ["voice", "email", "chat", "whatsapp"];

export const CONTACT_CHANNEL_ICON: Record<ChannelType, typeof Phone> = {
  voice: Phone,
  email: Mail,
  chat: MessageSquare,
  sms: MessageSquare,
  whatsapp: MessageCircle,
};

export const CONTACT_CHANNEL_LABEL: Record<ChannelType, string> = {
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

/** Customer rows' own trailing actions — per an explicit follow-up
 *  ("allow the user to start a voice call, email, chat, whatsapp with a
 *  customer [from the directory]. This would be an outbound interaction"),
 *  each icon now actually starts a real outbound interaction instead of
 *  firing the generic `onContactAction` stub `ContactActionButtons` above
 *  still uses for agent rows. Reuses `AddOutboundButton` (the interaction
 *  header's own "+" control) rather than a second, parallel "start an
 *  outbound thing" implementation — its `renderTrigger`/`preselectedChannel`
 *  props exist specifically for this caller, so each channel icon opens the
 *  exact same skill-selection screen New Outbound itself uses, just
 *  pre-selected to the channel that was clicked (the agent can still switch
 *  channels from that screen). Scoped to customers only, per the request's
 *  own wording — agent rows keep `ContactActionButtons`/`onContactAction`
 *  unchanged. */
function CustomerOutboundActionButtons({
  contact,
  channelOptions,
  phoneOptions,
  skillOptions,
  onStartOutbound,
}: {
  contact: DirectoryCustomer;
  channelOptions: CreateNewChannelOption[];
  phoneOptions: { value: string; label: string }[];
  skillOptions: { value: string; label: string }[];
  onStartOutbound: (selection: { contact: CreateNewOutboundContact; channel: ChannelType; phone: string; skillId: string }) => void;
}) {
  const visible = CONTACT_CHANNEL_ORDER.filter((type) => contact.channels.includes(type));
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {visible.map((type) => {
        const Icon = CONTACT_CHANNEL_ICON[type];
        const accent = CHANNEL_ACCENT[type];
        return (
          <AddOutboundButton
            key={type}
            contact={contact}
            preselectedChannel={type}
            channelOptions={channelOptions}
            phoneOptions={phoneOptions}
            skillOptions={skillOptions}
            onStart={(channel, addressValue, skillId) => onStartOutbound({ contact, channel, phone: addressValue, skillId })}
            renderTrigger={({ onClick, open }) => (
              <ActionIconButton size="sm" title={CONTACT_CHANNEL_LABEL[type]} aria-expanded={open} onClick={onClick}>
                <Icon className={cn("h-4 w-4", accent.text)} strokeWidth={1.5} />
              </ActionIconButton>
            )}
          />
        );
      })}
    </div>
  );
}

/* ── Avatar helper — matches the initials-circle pattern already
 *  established elsewhere in this app (CustomerInteractionPanel's
 *  MessageAvatar). ── */

/** `availability` is only ever set for agent rows (`DirectoryCustomer` has
 *  no such concept) — same `StatusIcon` corner-badge treatment New
 *  Outbound's own `ContactAvatar` uses (see that component's own doc
 *  comment), reused here per an explicit follow-up rather than a second,
 *  slightly different copy. */
function DirectoryAvatar({ initials, className, availability }: { initials: string; className?: string; availability?: AgentStatus }) {
  return (
    <div className="relative shrink-0">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full lyra-body-sm-emphasis", className)}>
        {initials}
      </div>
      {availability && (
        <StatusIcon
          status={availability}
          className="absolute bottom-[-2px] right-[-2px] px-0 border border-lyra-bg-surface-base"
        />
      )}
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
  /** Starts a real outbound interaction from a customer row's own channel
   *  icon (see `CustomerOutboundActionButtons` above) — same shape as
   *  `NewOutboundConfig.onStartCall`/`AgentNextGenPage`'s own
   *  `handleStartOutboundCall`, passed straight through rather than
   *  re-derived here. Customers only; agent rows still go through
   *  `onContactAction` above, unchanged. */
  onStartOutbound: (selection: { contact: CreateNewOutboundContact; channel: ChannelType; phone: string; skillId: string }) => void;
  outboundChannelOptions: CreateNewChannelOption[];
  outboundPhoneOptions: { value: string; label: string }[];
  outboundSkillOptions: { value: string; label: string }[];
}

export function DirectoryPage({
  customers,
  agents,
  skills,
  teams,
  onContactAction,
  onStartOutbound,
  outboundChannelOptions,
  outboundPhoneOptions,
  outboundSkillOptions,
}: DirectoryPageProps) {
  const [activeTab, setActiveTab] = useState<DirectoryTab>("customers");
  const [search, setSearch] = useState("");
  const [drillDown, setDrillDown] = useState<DrillDown>(null);

  const handleTabChange = (tab: DirectoryTab) => {
    setActiveTab(tab);
    setSearch("");
    setDrillDown(null);
  };

  // contactMatchesQuery also matches phone numbers (digits-only, so
  // formatting differences don't matter) — a genuine capability for
  // customers/agents, and a harmless no-op fallback to name-only matching
  // for skills/teams, which have no phone numbers to match against.
  const filteredCustomers = customers.filter((c) => contactMatchesQuery(c, search));
  const filteredAgents = agents.filter((a) => contactMatchesQuery(a, search));
  const filteredSkills = skills.filter((s) => contactMatchesQuery(s, search));
  const filteredTeams = teams.filter((t) => contactMatchesQuery(t, search));

  // Split by type (rather than one function branching on `contact.kind`) so
  // `CustomerOutboundActionButtons` gets a real `DirectoryCustomer`, not a
  // `DirectoryCustomer | DirectoryAgent` narrowed only by a runtime `kind`
  // check — `kind`'s type is identical across both interfaces (neither
  // narrows it to a literal), so TypeScript can't discriminate the union on
  // it alone. Every call site already knows which one it has (the customers
  // tab's list is always `DirectoryCustomer[]`; the agents tab and both
  // skill/team drill-down rosters are always `DirectoryAgent[]`), so this
  // is a plain, honestly-typed split, not a workaround.
  function renderCustomerRow(contact: DirectoryCustomer) {
    return (
      <ListItem
        key={contact.id}
        leading={<DirectoryAvatar initials={contact.initials} className={contact.avatarClassName} />}
        title={contact.name}
        subtitle={contact.subtitle}
        trailing={
          <CustomerOutboundActionButtons
            contact={contact}
            channelOptions={outboundChannelOptions}
            phoneOptions={outboundPhoneOptions}
            skillOptions={outboundSkillOptions}
            onStartOutbound={onStartOutbound}
          />
        }
      />
    );
  }

  function renderAgentRow(contact: DirectoryAgent) {
    return (
      <ListItem
        key={contact.id}
        leading={
          <DirectoryAvatar initials={contact.initials} className={contact.avatarClassName} availability={contact.availability} />
        }
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
        <div className="flex-1 overflow-y-auto">{members.map(renderAgentRow)}</div>
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
        <div className="flex-1 overflow-y-auto">{members.map(renderAgentRow)}</div>
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
        {activeTab === "customers" && filteredCustomers.map(renderCustomerRow)}
        {activeTab === "agents" && filteredAgents.map(renderAgentRow)}

        {activeTab === "skills" && filteredSkills.map((skill) => {
          const accent = CHANNEL_ACCENT[skill.channelType];
          return (
            <ListItem
              key={skill.id}
              onClick={() => setDrillDown({ kind: "skill", id: skill.id })}
              leading={
                <div className="relative shrink-0">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lyra-sm", accent.bg)}>
                    <Route className={cn("h-4 w-4", accent.text)} strokeWidth={1.5} />
                  </div>
                  <StatusIcon
                    status={skill.availability}
                    className="absolute bottom-[-2px] right-[-2px] px-0 border border-lyra-bg-surface-base"
                  />
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
