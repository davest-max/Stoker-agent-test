import { useState } from "react";
import {
  Popover,
  Tooltip,
  TabList,
  Tab,
  SearchInput,
  FavoriteButton,
  ListItem,
  ActionIconButton,
  ConversationMessage,
  Textarea,
  Button,
  AiSparkleIcon,
  CHANNEL_ACCENT,
} from "@nicecxone/lyra-ui";
import { Route, Phone, UserPlus, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIRECTORY_AGENTS, DIRECTORY_SKILLS, type DirectoryAgent, type DirectorySkill } from "@/data/directory";
import type { InternalChatMessage } from "@/data/internalChat";
import { ConsultTransferIcon } from "@/components/CustomerInteractionPanel";

/* ── ConsultTransferPopover ──
 * Wires up `InteractionActionsBar`'s "Transfer" button (previously a plain
 * inert icon, same as "Outcome" was before OutcomePanel.tsx) to an actual
 * consult/transfer picker: Favorites/Agents/Skills tabs, a searchable agent
 * list that opens into a per-agent chat (with Phone/Transfer/Add-to-
 * interaction actions), and a Skills list with Call/Transfer actions
 * inline on each row (no drill-down — a skill is a routing target, not
 * someone to chat with first).
 *
 * Self-contained, like NewOutboundPopover/OutcomePanel — unlike
 * InternalChatPopover (its sibling in spirit), this has no docked mode to
 * support, so its view/search/favorites/thread state doesn't need to be
 * lifted to AgentNextGenPage; it can just live here.
 *
 * Every action (call, transfer, add to interaction) is a stub for now —
 * there's no real transfer/conference backend to wire into yet — logged to
 * the console instead, the same placeholder pattern this app already uses
 * for InternalChatPopover's own onCall and OutcomePanel's onApprove. */

type Tab = "favorites" | "agents" | "skills";
type View = { kind: "list" } | { kind: "chat"; agentId: string };

const AVATAR_SIZE = "h-9 w-9";

function AgentAvatar({ agent, size = AVATAR_SIZE }: { agent: DirectoryAgent; size?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-full lyra-body-sm-emphasis", size, agent.avatarClassName)}>
      {agent.initials}
    </div>
  );
}

/* ── Agents tab ── */

function AgentRow({
  agent,
  favorited,
  onToggleFavorite,
  onOpenChat,
}: {
  agent: DirectoryAgent;
  favorited: boolean;
  onToggleFavorite: () => void;
  onOpenChat: () => void;
}) {
  return (
    <ListItem
      className="group/row"
      leading={<AgentAvatar agent={agent} />}
      title={agent.name}
      subtitle={agent.subtitle}
      onClick={onOpenChat}
      trailing={
        <div className="flex items-center gap-0.5">
          <FavoriteButton favorited={favorited} onClick={onToggleFavorite} label={agent.name} placement="left" />
          <ChevronRight className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />
        </div>
      }
    />
  );
}

/* ── Skills tab — Call/Transfer act directly on the row, no drill-down
 *  (matches DirectoryPage's own square-tile + CHANNEL_ACCENT convention
 *  for skills, reused here rather than re-invented). ── */

function SkillRow({
  skill,
  favorited,
  onToggleFavorite,
  onCall,
  onTransfer,
}: {
  skill: DirectorySkill;
  favorited: boolean;
  onToggleFavorite: () => void;
  onCall: () => void;
  onTransfer: () => void;
}) {
  const accent = CHANNEL_ACCENT[skill.channelType];
  return (
    <ListItem
      static
      className="group/row"
      leading={
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lyra-sm", accent.bg)}>
          <Route className={cn("h-4 w-4", accent.text)} strokeWidth={1.5} />
        </div>
      }
      title={skill.name}
      subtitle={skill.description}
      trailing={
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <FavoriteButton favorited={favorited} onClick={onToggleFavorite} label={skill.name} placement="left" />
          <ActionIconButton size="sm" title={`Call ${skill.name}`} onClick={onCall}>
            <Phone className="h-4 w-4" strokeWidth={1.5} />
          </ActionIconButton>
          <ActionIconButton size="sm" title={`Transfer to ${skill.name}`} onClick={onTransfer}>
            <ConsultTransferIcon strokeWidth={1.5} />
          </ActionIconButton>
        </div>
      }
    />
  );
}

/* ── Chat header — back / avatar+name / Phone, Transfer, Add-to-interaction ── */

function ChatHeader({
  agent,
  onBack,
  onCall,
  onTransfer,
  onAddToInteraction,
}: {
  agent: DirectoryAgent;
  onBack: () => void;
  onCall: () => void;
  onTransfer: () => void;
  onAddToInteraction: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-lyra-border-subtle px-3 py-2.5">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to list"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
      <AgentAvatar agent={agent} size="h-8 w-8" />
      <div className="min-w-0 flex-1">
        <p className="lyra-body-sm-emphasis truncate text-lyra-fg-default">{agent.name}</p>
        {agent.subtitle && <p className="lyra-body-xs truncate text-lyra-fg-secondary">{agent.subtitle}</p>}
      </div>
      <ActionIconButton title={`Call ${agent.name}`} onClick={onCall}>
        <Phone className="h-4 w-4" strokeWidth={1.5} />
      </ActionIconButton>
      <ActionIconButton title={`Transfer to ${agent.name}`} onClick={onTransfer}>
        <ConsultTransferIcon strokeWidth={1.5} />
      </ActionIconButton>
      <ActionIconButton title={`Add ${agent.name} to interaction`} onClick={onAddToInteraction}>
        <UserPlus className="h-4 w-4" strokeWidth={1.5} />
      </ActionIconButton>
    </div>
  );
}

/** Pre-loaded, editable handoff summary shown in place of the empty-chat
 *  placeholder — the point of a consult/transfer chat is usually to hand
 *  the case to someone else, so AI drafts that handoff note up front
 *  instead of leaving the agent to write one from scratch. Review-and-edit
 *  before sending, same "AI Suggested" framing as OutcomePanel's summary
 *  field (reusing lyra-ui's shared `AiSparkleIcon`, not a duplicate). Once
 *  sent, it becomes a normal message in the thread and this block doesn't
 *  reappear — `ChatMessages` only shows it while `messages.length === 0`. */
function HandoffSummaryDraft({
  agent,
  value,
  onChange,
  onSend,
}: {
  agent: DirectoryAgent;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 rounded-lyra-sm bg-lyra-bg-active-subtle px-3 py-2">
        <AiSparkleIcon className="h-4 w-4 shrink-0 text-lyra-fg-active-strong" />
        <p className="lyra-body-sm text-lyra-fg-active-strong">
          <span className="lyra-body-sm-emphasis">AI Suggested</span> handoff summary — review and edit before sending
        </p>
      </div>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} />
      <Button variant="default" className="w-full" disabled={!value.trim()} onClick={onSend}>
        Send to {agent.name.split(" ")[0]}
      </Button>
    </div>
  );
}

function ChatMessages({
  agent,
  messages,
  handoffSummary,
  onHandoffChange,
  onSendHandoff,
}: {
  agent: DirectoryAgent;
  messages: InternalChatMessage[];
  handoffSummary: string;
  onHandoffChange: (value: string) => void;
  onSendHandoff: () => void;
}) {
  if (messages.length === 0) {
    return (
      <HandoffSummaryDraft agent={agent} value={handoffSummary} onChange={onHandoffChange} onSend={onSendHandoff} />
    );
  }
  return (
    <div className="flex min-h-[220px] flex-col gap-2 px-3 py-3">
      {messages.map((message) => (
        <ConversationMessage key={message.id} variant={message.fromMe ? "user" : "agent"} timestamp={message.timestamp} showActions={false}>
          {message.text}
        </ConversationMessage>
      ))}
    </div>
  );
}

function ChatComposer({ draft, onDraftChange, onSend }: { draft: string; onDraftChange: (value: string) => void; onSend: () => void }) {
  return (
    <div className="flex items-center gap-2 border-t border-lyra-border-subtle p-2">
      <input
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="Message…"
        className="h-9 flex-1 rounded-lyra-sm border border-lyra-border-default bg-lyra-bg-control px-2.5 lyra-body-sm text-lyra-fg-default placeholder:text-lyra-fg-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={!draft.trim()}
        aria-label="Send message"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-action transition-colors hover:bg-lyra-state-hover disabled:pointer-events-none disabled:opacity-40"
      >
        <Send className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Seeded AI-suggested handoff note — a brief summary of the customer's
 *  issue (the fuller `issueSummary`, not the short header `subject`) plus
 *  an explicit ask of whether the receiving agent can take the interaction
 *  on, rather than a one-sided "here's what I did" recap. Falls back to
 *  generic phrasing when an assignment is missing a field, same tolerance
 *  as OutcomeButton's own `customerName` fallback. */
function buildHandoffSummary({
  customerName,
  issueSummary,
  caseId,
}: {
  customerName: string;
  issueSummary: string;
  caseId?: string;
}): string {
  const caseRef = caseId ? ` (${caseId})` : "";
  return `${customerName}${caseRef} — ${issueSummary} Would you be able to take this interaction on?`;
}

/* ── Root ── */

export interface ConsultTransferButtonProps {
  /** Seeds the AI-suggested handoff summary shown when a consult chat
   *  opens — all optional since not every assignment has a customer/case
   *  on record (matches OutcomeButton's own tolerance for a missing
   *  customerName). */
  customerName?: string;
  issueSummary?: string;
  caseId?: string;
}

export function ConsultTransferButton({ customerName, issueSummary, caseId }: ConsultTransferButtonProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("agents");
  const [view, setView] = useState<View>({ kind: "list" });
  const [search, setSearch] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [threads, setThreads] = useState<Record<string, InternalChatMessage[]>>({});
  const [draft, setDraft] = useState("");
  // Keyed by agent id so switching between two consults mid-popover-session
  // keeps each one's own edited draft. Undefined until the first time that
  // agent's chat opens — see `handoffSummaryFor` below, which computes the
  // AI-suggested default lazily instead of pre-seeding every agent up front.
  const [handoffDrafts, setHandoffDrafts] = useState<Record<string, string>>({});

  const resetAndClose = () => {
    setOpen(false);
    setView({ kind: "list" });
    setSearch("");
  };

  const handoffSummaryFor = (agent: DirectoryAgent): string =>
    handoffDrafts[agent.id] ??
    buildHandoffSummary({
      customerName: customerName ?? "this customer",
      issueSummary: issueSummary ?? "reviewing the open issue.",
      caseId,
    });

  const handleSendHandoff = (agent: DirectoryAgent) => {
    const text = handoffSummaryFor(agent).trim();
    if (!text) return;
    setThreads((prev) => ({
      ...prev,
      [agent.id]: [...(prev[agent.id] ?? []), { id: `m${(prev[agent.id]?.length ?? 0) + 1}`, fromMe: true, text, timestamp: "Just now" }],
    }));
    setHandoffDrafts((prev) => ({ ...prev, [agent.id]: "" }));
  };

  const toggleFavorite = (id: string) =>
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const log = (action: string, name: string) => {
    // eslint-disable-next-line no-console
    console.log(`${action}:`, name);
  };

  const handleSend = (agent: DirectoryAgent) => {
    if (!draft.trim()) return;
    setThreads((prev) => ({
      ...prev,
      [agent.id]: [...(prev[agent.id] ?? []), { id: `m${(prev[agent.id]?.length ?? 0) + 1}`, fromMe: true, text: draft.trim(), timestamp: "Just now" }],
    }));
    setDraft("");
  };

  const activeAgent = view.kind === "chat" ? DIRECTORY_AGENTS.find((a) => a.id === view.agentId) : undefined;

  const query = search.trim().toLowerCase();
  const filteredAgents = DIRECTORY_AGENTS.filter((a) => a.name.toLowerCase().includes(query));

  const favoriteAgents = DIRECTORY_AGENTS.filter((a) => favoriteIds.has(a.id));
  const favoriteSkills = DIRECTORY_SKILLS.filter((s) => favoriteIds.has(s.id));

  /* ── Header (fixed) ── */
  const header =
    view.kind === "chat" && activeAgent ? (
      <ChatHeader
        agent={activeAgent}
        onBack={() => setView({ kind: "list" })}
        onCall={() => log("Call", activeAgent.name)}
        onTransfer={() => { log("Transfer to", activeAgent.name); resetAndClose(); }}
        onAddToInteraction={() => log("Add to interaction", activeAgent.name)}
      />
    ) : (
      <div className="flex flex-col gap-2 px-3 pb-2 pt-3">
        <p className="lyra-heading-md text-lyra-fg-default">Consult / Transfer</p>
        <TabList>
          <Tab active={tab === "favorites"} onClick={() => setTab("favorites")}>Favorites</Tab>
          <Tab active={tab === "agents"} onClick={() => setTab("agents")}>Agents</Tab>
          <Tab active={tab === "skills"} onClick={() => setTab("skills")}>Skills</Tab>
        </TabList>
        {tab === "agents" && (
          <SearchInput value={search} onValueChange={setSearch} placeholder="Search agents" />
        )}
      </div>
    );

  /* ── Content (scrollable) ── */
  let content: React.ReactNode;
  if (view.kind === "chat" && activeAgent) {
    content = (
      <ChatMessages
        agent={activeAgent}
        messages={threads[activeAgent.id] ?? []}
        handoffSummary={handoffSummaryFor(activeAgent)}
        onHandoffChange={(value) => setHandoffDrafts((prev) => ({ ...prev, [activeAgent.id]: value }))}
        onSendHandoff={() => handleSendHandoff(activeAgent)}
      />
    );
  } else if (tab === "agents") {
    content = (
      <div className="flex flex-col pb-2">
        {filteredAgents.length === 0 ? (
          <p className="px-4 py-6 text-center lyra-body-sm text-lyra-fg-secondary">No agents found.</p>
        ) : (
          filteredAgents.map((agent) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              favorited={favoriteIds.has(agent.id)}
              onToggleFavorite={() => toggleFavorite(agent.id)}
              onOpenChat={() => setView({ kind: "chat", agentId: agent.id })}
            />
          ))
        )}
      </div>
    );
  } else if (tab === "skills") {
    content = (
      <div className="flex flex-col pb-2">
        {DIRECTORY_SKILLS.map((skill) => (
          <SkillRow
            key={skill.id}
            skill={skill}
            favorited={favoriteIds.has(skill.id)}
            onToggleFavorite={() => toggleFavorite(skill.id)}
            onCall={() => log("Call skill", skill.name)}
            onTransfer={() => { log("Transfer to skill", skill.name); resetAndClose(); }}
          />
        ))}
      </div>
    );
  } else {
    // Favorites — agents and skills can each be favorited from their own
    // tab; this aggregates both rather than picking one kind, since a
    // consult/transfer target can be either.
    content = (
      <div className="flex flex-col pb-2">
        {favoriteAgents.length === 0 && favoriteSkills.length === 0 && (
          <p className="px-4 py-6 text-center lyra-body-sm text-lyra-fg-secondary">No favorites yet.</p>
        )}
        {favoriteAgents.length > 0 && (
          <>
            {favoriteSkills.length > 0 && (
              <p className="px-4 pb-1 pt-2 lyra-body-xs-emphasis uppercase tracking-wide text-lyra-fg-secondary">Agents</p>
            )}
            {favoriteAgents.map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                favorited
                onToggleFavorite={() => toggleFavorite(agent.id)}
                onOpenChat={() => setView({ kind: "chat", agentId: agent.id })}
              />
            ))}
          </>
        )}
        {favoriteSkills.length > 0 && (
          <>
            {favoriteAgents.length > 0 && (
              <p className="px-4 pb-1 pt-3 lyra-body-xs-emphasis uppercase tracking-wide text-lyra-fg-secondary">Skills</p>
            )}
            {favoriteSkills.map((skill) => (
              <SkillRow
                key={skill.id}
                skill={skill}
                favorited
                onToggleFavorite={() => toggleFavorite(skill.id)}
                onCall={() => log("Call skill", skill.name)}
                onTransfer={() => { log("Transfer to skill", skill.name); resetAndClose(); }}
              />
            ))}
          </>
        )}
      </div>
    );
  }

  // No composer until the handoff summary itself has been sent — while
  // it's still showing (see HandoffSummaryDraft, content above), its own
  // "Send to {agent}" button is the only send affordance; a second input
  // row underneath would read as two ways to do the same thing.
  const footer =
    view.kind === "chat" && activeAgent && (threads[activeAgent.id]?.length ?? 0) > 0 ? (
      <ChatComposer draft={draft} onDraftChange={setDraft} onSend={() => handleSend(activeAgent)} />
    ) : undefined;

  // Tooltip wraps Popover from the *outside* (not the other way around) —
  // see popover.tsx's own comment on why: Popover.Content is portaled, and
  // a Tooltip wrapping just the trigger would have its open/close state
  // re-triggered by pointer events bubbling up from inside the portaled
  // content. Same pattern InternalChatPopover's trigger already uses.
  return (
    <Tooltip content="Consult / Transfer" placement="bottom" asLabel>
      <span className="inline-flex">
        <Popover
          open={open}
          onOpenChange={(next) => (next ? setOpen(true) : resetAndClose())}
          placement="bottom"
          align="start"
          sideOffset={10}
          avoidCollisions={false}
          maxWidth="360px"
          maxHeight="520px"
          className="w-[360px]"
          header={header}
          footer={footer}
          content={content}
        >
          <ActionIconButton
            size="sm"
            aria-label="Consult / Transfer"
            aria-expanded={open}
            className={cn(open && "bg-lyra-state-hover")}
          >
            <ConsultTransferIcon strokeWidth={2} />
          </ActionIconButton>
        </Popover>
      </span>
    </Tooltip>
  );
}
