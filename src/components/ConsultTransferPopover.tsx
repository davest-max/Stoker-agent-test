import { useEffect, useState } from "react";
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
  StatusIcon,
  type ChannelType,
} from "@nicecxone/lyra-ui";
import { Route, Phone, UserPlus, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIRECTORY_AGENTS, DIRECTORY_SKILLS, contactMatchesQuery, type DirectoryAgent, type DirectorySkill } from "@/data/directory";
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
type View =
  | { kind: "list" }
  | { kind: "chat"; agentId: string }
  // Selecting Call on a SkillRow (see that component's own onCall) opens
  // this instead of the old console.log stub, per an explicit follow-up:
  // a skill has no single person to consult, so this drills into its own
  // ring→answer screen (see `SkillCallHeader`/`SkillCallContent`) rather
  // than reusing the agent chat view.
  | { kind: "callingSkill"; skillId: string };

const AVATAR_SIZE = "h-9 w-9";

/** Same `StatusIcon` corner-badge treatment New Outbound's `ContactAvatar`
 *  and the Directory page's `DirectoryAvatar` already use — per an explicit
 *  follow-up, an agent's availability should read the same way everywhere
 *  they show up, not just in the directory/outbound flows. */
function AgentAvatar({ agent, size = AVATAR_SIZE }: { agent: DirectoryAgent; size?: string }) {
  return (
    <div className="relative shrink-0">
      <div className={cn("flex items-center justify-center rounded-full lyra-body-sm-emphasis", size, agent.avatarClassName)}>
        {agent.initials}
      </div>
      <StatusIcon
        status={agent.availability}
        className="absolute bottom-[-2px] right-[-2px] px-0 border border-lyra-bg-surface-base"
      />
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
        <div className="relative shrink-0">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lyra-sm", accent.bg)}>
            <Route className={cn("h-4 w-4", accent.text)} strokeWidth={1.5} />
          </div>
          {/* Same `StatusIcon` corner-badge treatment agents get on this
           *  same row style — per an explicit follow-up, a skill's own
           *  availability should carry into the transfer popup too, not
           *  just the directory/outbound flows. */}
          <StatusIcon
            status={skill.availability}
            className="absolute bottom-[-2px] right-[-2px] px-0 border border-lyra-bg-surface-base"
          />
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

/** Channels "Add to interaction" actually makes sense for — deliberately
 *  just web chat, per an explicit follow-up. SMS and WhatsApp were
 *  considered and dropped: neither has a native multi-party concept (both
 *  are a 1:1 thread between the customer's number and the business
 *  number), so "adding" someone there wouldn't be visible to the customer
 *  at all without sending them a real message, raises message-window/
 *  template constraints (WhatsApp's 24-hour session rule), and introduces
 *  send-collision risk between two agents with no protocol-level signal to
 *  prevent it — real complexity with no matching payoff yet. Voice is
 *  excluded even without a live call: Phone already covers the voice case
 *  end to end (plain call with nothing live, consult/merge once there is —
 *  see `hasLiveCall` below), so a separate Add button next to it would
 *  just be a second way to do the same thing. Email is excluded because
 *  there's no "add a third party to this email" concept at all — unlike a
 *  call or a chat thread, an email has no live, join-able session to add
 *  anyone to. */
const CHANNELS_SUPPORTING_ADD_PERSON: ChannelType[] = ["chat"];

/* ── Chat header — back / avatar+name / Phone, Transfer, Add-to-interaction ──
 *  Transfer restored as its own standalone icon per an explicit follow-up
 *  reverting an intermediate design (it had briefly moved onto the handoff
 *  draft's own primary button — see that component's doc comment). Phone
 *  now does double duty depending on the ACTIVE INTERACTION (not this
 *  chat's own channel, which is always internal voice/text between
 *  agents): with a live voice call to consult into, it starts/continues
 *  the same consult-then-merge flow "Add to call" already does (see
 *  `hasLiveCall` below); otherwise it starts a brand-new internal
 *  agent-to-agent call as its own left-nav tile (see
 *  `ConsultTransferButtonProps.onStartAgentCall`) — either way, calling an
 *  agent always does *something* real now, never just a stub log. */

function ChatHeader({
  agent,
  onBack,
  onCall,
  onTransfer,
  onAddToInteraction,
  hasLiveCall,
  activeChannelType,
  isOnCall,
}: {
  agent: DirectoryAgent;
  onBack: () => void;
  onCall: () => void;
  onTransfer: () => void;
  onAddToInteraction: () => void;
  /** True when the active interaction has a live voice call Phone can
   *  actually consult into (see `ConsultTransferButtonProps.onAddToCall`'s
   *  own gating — same condition, passed straight through rather than
   *  re-derived here). Drives Phone's tooltip only now ("Call {name}" vs
   *  "Consult with {name}") — Add-to-interaction's own visibility is
   *  channel-based instead (see `activeChannelType` below), not derived
   *  from this. */
  hasLiveCall?: boolean;
  /** The active interaction's current channel — determines whether
   *  Add-to-interaction (UserPlus) renders at all. See
   *  `CHANNELS_SUPPORTING_ADD_PERSON`'s own doc comment for which channels
   *  qualify and why. */
  activeChannelType?: ChannelType;
  /** True once this agent is actually on the live call already — a pending
   *  consult or a merged colleague, see `ConsultTransferButtonProps`'s own
   *  `activeCallAgentIds` doc comment. Only meaningful now that the popup
   *  stays open through a consult instead of closing immediately: this is
   *  the "persistent on-a-call state" that gives the agent something to
   *  look at while it stays open, rather than the button just silently
   *  going back to its normal look. Swaps the subtitle line and gives
   *  Phone a persistent (not just hover) tint — clicking it again is still
   *  harmless (re-consulting the same colleague is a no-op), so it's left
   *  enabled rather than disabled. */
  isOnCall?: boolean;
}) {
  const canAddPerson = !!activeChannelType && CHANNELS_SUPPORTING_ADD_PERSON.includes(activeChannelType);
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
        {isOnCall ? (
          <p className="lyra-body-xs truncate text-lyra-fg-active-strong">On this call</p>
        ) : (
          agent.subtitle && <p className="lyra-body-xs truncate text-lyra-fg-secondary">{agent.subtitle}</p>
        )}
      </div>
      <ActionIconButton
        title={isOnCall ? `On this call — ${agent.name}` : hasLiveCall ? `Consult with ${agent.name}` : `Call ${agent.name}`}
        onClick={onCall}
        className={cn(isOnCall && "bg-lyra-bg-active-subtle text-lyra-fg-active-strong hover:bg-lyra-bg-active-subtle")}
      >
        <Phone className="h-4 w-4" strokeWidth={1.5} />
      </ActionIconButton>
      <ActionIconButton title={`Transfer to ${agent.name}`} onClick={onTransfer}>
        <ConsultTransferIcon strokeWidth={1.5} />
      </ActionIconButton>
      {canAddPerson && (
        <ActionIconButton title={`Add ${agent.name} to interaction`} onClick={onAddToInteraction}>
          <UserPlus className="h-4 w-4" strokeWidth={1.5} />
        </ActionIconButton>
      )}
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
 *  reappear — `ChatMessages` only shows it while `messages.length === 0`.
 *  Back to its original intent, per an explicit follow-up reverting an
 *  intermediate design: this button only sends the drafted note as a
 *  message — it has no transfer side effect. Transfer is its own
 *  standalone action again, back in `ChatHeader` (see that component's own
 *  doc comment). */
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

/* ── Calling a skill — consult/merge into a skill's queue ──
 * Per an explicit follow-up: calling a skill (rather than a specific named
 * agent) rings that skill's queue, and whichever available member of it
 * "answers" becomes the consult — same cancel/merge resolution an agent
 * consult already has (that part lives entirely in `LiveVoiceCallBar`'s
 * existing Cancel/Merge, untouched here), plus a Transfer icon once
 * connected that hands the customer straight to that specific agent
 * instead of blind-transferring to the skill itself (see `SkillRow`'s own
 * Transfer, which is unrelated/unchanged). The one new wrinkle a skill
 * introduces that a named agent doesn't: you don't know who you're
 * consulting until someone actually picks up, so this needs its own
 * ringing sub-state first — see the `phase` prop both pieces share. */

/** Header for the "calling a skill" screen — same back/leading/trailing
 *  row shape as `ChatHeader`, but the trailing action swaps between Cancel
 *  (while ringing, nothing live yet, so backing out is free) and Transfer
 *  (once connected, mirroring `ChatHeader`'s own Transfer icon but aimed at
 *  the specific agent who answered rather than the skill/agent this
 *  header's for). */
function SkillCallHeader({
  skill,
  phase,
  agent,
  onBack,
  onCancelRinging,
  onTransfer,
}: {
  skill: DirectorySkill;
  phase: "ringing" | "connected";
  agent?: DirectoryAgent;
  onBack: () => void;
  onCancelRinging: () => void;
  onTransfer: () => void;
}) {
  const accent = CHANNEL_ACCENT[skill.channelType];
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
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lyra-sm", accent.bg)}>
        <Route className={cn("h-4 w-4", accent.text)} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="lyra-body-sm-emphasis truncate text-lyra-fg-default">{skill.name}</p>
        {phase === "connected" ? (
          <p className="lyra-body-xs truncate text-lyra-fg-active-strong">On this call{agent ? ` — ${agent.name}` : ""}</p>
        ) : (
          <p className="lyra-body-xs truncate text-lyra-fg-secondary">Calling…</p>
        )}
      </div>
      {phase === "ringing" ? (
        <Button variant="outline" size="sm" onClick={onCancelRinging}>Cancel</Button>
      ) : (
        <ActionIconButton
          title={agent ? `Transfer to ${agent.name}` : "Transfer"}
          onClick={onTransfer}
          className="bg-lyra-bg-active-subtle text-lyra-fg-active-strong hover:bg-lyra-bg-active-subtle"
        >
          <ConsultTransferIcon strokeWidth={1.5} />
        </ActionIconButton>
      )}
    </div>
  );
}

/** Body for the "calling a skill" screen — no message thread here (this is
 *  a phone call, not a chat), just a centered status card: the skill's own
 *  accent-colored glyph while ringing (nobody to show an avatar for yet),
 *  swapped for the answered agent's real `AgentAvatar` once connected —
 *  reusing that component rather than a one-off initials treatment, same
 *  reuse-over-reinvention as everywhere else in this file. */
function SkillCallContent({
  skill,
  phase,
  agent,
}: {
  skill: DirectorySkill;
  phase: "ringing" | "connected";
  agent?: DirectoryAgent;
}) {
  const accent = CHANNEL_ACCENT[skill.channelType];
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      {phase === "connected" && agent ? (
        <AgentAvatar agent={agent} size="h-14 w-14" />
      ) : (
        <div className={cn("flex h-14 w-14 items-center justify-center rounded-full", accent.bg)}>
          <Route className={cn("h-6 w-6 animate-pulse", accent.text)} strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}
      {phase === "connected" && agent ? (
        <div>
          <p className="lyra-body-md-emphasis text-lyra-fg-default">Consulting with {agent.name}</p>
          <p className="lyra-body-sm text-lyra-fg-secondary">Routed from {skill.name}</p>
        </div>
      ) : (
        <div>
          <p className="lyra-body-md-emphasis text-lyra-fg-default">Calling {skill.name}…</p>
          <p className="lyra-body-sm text-lyra-fg-secondary">Waiting for an available agent to answer.</p>
        </div>
      )}
    </div>
  );
}

/** Seeded AI-suggested handoff note — written like an agent actually typing
 *  a quick heads-up to a colleague (greeting by name, "I have a customer,
 *  X" framing) rather than a terse data dump. Still built from the same
 *  fields as before: a brief summary of the customer's issue (the fuller
 *  `issueSummary`, not the short header `subject`) plus an explicit ask of
 *  whether the receiving agent can take the interaction on. Falls back to
 *  generic phrasing when an assignment is missing a field, same tolerance
 *  as OutcomeButton's own `customerName` fallback. No case # here — a
 *  case reference number isn't useful context for an agent deciding
 *  whether to pick up an interaction, just noise ahead of the actual
 *  summary. */
function buildHandoffSummary({
  agentName,
  customerName,
  issueSummary,
}: {
  /** The receiving agent's name (the one this note is addressed to, not
   *  the one sending it) — greets them by first name. */
  agentName: string;
  customerName?: string;
  issueSummary: string;
}): string {
  const agentFirstName = agentName.split(" ")[0];
  const customerClause = customerName ? `I have a customer, ${customerName}.` : "I have a customer on the line.";
  return `Hi ${agentFirstName}, ${customerClause} ${issueSummary} Would you be able to take this interaction on?`;
}

/* ── Root ── */

export interface ConsultTransferButtonProps {
  /** Seeds the AI-suggested handoff summary shown when a consult chat
   *  opens — all optional since not every assignment has a customer/case
   *  on record (matches OutcomeButton's own tolerance for a missing
   *  customerName). */
  customerName?: string;
  issueSummary?: string;
  /** Wires "Add to interaction" to actually start a consult on the current
   *  live voice call instead of the plain console.log stub — only passed
   *  from `AgentNextGenPage` while this interaction's own call is the live
   *  one (see `InteractionInfoBar`'s own `onAddColleagueToCall`). Omitted
   *  (not just undefined-checked at the call site) leaves the original stub
   *  behavior untouched for every other case — a digital interaction, or a
   *  voice interaction with no live call right now. */
  onAddToCall?: (colleague: { id: string; name: string; sourceSkillName?: string }) => void;
  /** The active interaction's current channel — passed straight through to
   *  `ChatHeader`'s own `activeChannelType` to gate Add-to-interaction's
   *  visibility (see `CHANNELS_SUPPORTING_ADD_PERSON`). */
  activeChannelType?: ChannelType;
  /** Fired from Phone when there's no live call to consult into (see
   *  `ChatHeader`'s own doc comment) — starts a brand-new internal
   *  agent-to-agent voice call as its own left-nav tile. Same shape/
   *  behavior as `AgentNextGenPage`'s own `handleStartOutboundCall`
   *  agent-kind branch; passed straight through rather than re-derived
   *  here. Optional with a console-log fallback, matching `onAddToCall`'s
   *  own tolerance for a caller that hasn't wired it up. */
  onStartAgentCall?: (agent: DirectoryAgent) => void;
  /** Agent ids currently on THIS assignment's live call — a pending consult
   *  (`voiceCallConsult[id]`) or an already-merged colleague
   *  (`voiceCallColleagues[id]`), computed together since both mean the
   *  same thing from this popup's point of view: "already on the call,
   *  don't offer to call them again." Only meaningful (and only ever
   *  passed) while this interaction's own call is live — same gating as
   *  `onAddToCall` — so `ChatHeader` never has to re-derive that condition
   *  itself, just check membership. Drives the persistent "on this call"
   *  treatment on Phone once the popup stays open after a consult (see
   *  `onCall`'s own doc comment below for why it stays open now). */
  activeCallAgentIds?: Set<string>;
}

export function ConsultTransferButton({ customerName, issueSummary, onAddToCall, activeChannelType, onStartAgentCall, activeCallAgentIds }: ConsultTransferButtonProps) {
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
  // Who (if anyone) has "answered" the current skill call — undefined means
  // still ringing. Reset by the effect below every time a *new* callingSkill
  // view opens (including re-calling the same skill after backing out), not
  // just on mount, since `view` gets a fresh object identity each time
  // `SkillRow`'s onCall fires.
  const [skillCallAgent, setSkillCallAgent] = useState<DirectoryAgent | undefined>(undefined);

  const resetAndClose = () => {
    setOpen(false);
    setView({ kind: "list" });
    setSearch("");
  };

  // Simulates a skill's ring→answer routing: picks a random currently-
  // available member of the skill (there's no real routing engine here —
  // see `DirectorySkill.memberAgentIds`' own doc comment) after a short
  // delay, then starts the exact same consult `onAddToCall` already runs
  // for a directly-picked agent, just with `sourceSkillName` set so the
  // Participants menu/strip can show where they came from. Staying ringing
  // forever if nobody on the skill is available is a deliberate (if rough)
  // edge case — Cancel is still reachable from `SkillCallHeader` either way.
  useEffect(() => {
    if (view.kind !== "callingSkill") return;
    setSkillCallAgent(undefined);
    const skill = DIRECTORY_SKILLS.find((s) => s.id === view.skillId);
    if (!skill) return;
    const available = DIRECTORY_AGENTS.filter((a) => skill.memberAgentIds.includes(a.id) && a.availability === "available");
    if (available.length === 0) return;
    const picked = available[Math.floor(Math.random() * available.length)];
    const timer = setTimeout(() => {
      setSkillCallAgent(picked);
      onAddToCall?.({ id: picked.id, name: picked.name, sourceSkillName: skill.name });
    }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const handoffSummaryFor = (agent: DirectoryAgent): string =>
    handoffDrafts[agent.id] ??
    buildHandoffSummary({
      agentName: agent.name,
      customerName,
      issueSummary: issueSummary ?? "reviewing the open issue.",
    });

  const log = (action: string, name: string) => {
    // eslint-disable-next-line no-console
    console.log(`${action}:`, name);
  };

  /** Back to its original, single-purpose behavior — per an explicit
   *  follow-up reverting an intermediate design where this also ran the
   *  transfer action. Just posts the drafted handoff note into the thread
   *  as a normal message; Transfer is its own separate trigger again (see
   *  `ChatHeader`'s own `onTransfer`, restored below). */
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

  const handleSend = (agent: DirectoryAgent) => {
    if (!draft.trim()) return;
    setThreads((prev) => ({
      ...prev,
      [agent.id]: [...(prev[agent.id] ?? []), { id: `m${(prev[agent.id]?.length ?? 0) + 1}`, fromMe: true, text: draft.trim(), timestamp: "Just now" }],
    }));
    setDraft("");
  };

  const activeAgent = view.kind === "chat" ? DIRECTORY_AGENTS.find((a) => a.id === view.agentId) : undefined;
  const activeSkillCall = view.kind === "callingSkill" ? DIRECTORY_SKILLS.find((s) => s.id === view.skillId) : undefined;

  const filteredAgents = DIRECTORY_AGENTS.filter((a) => contactMatchesQuery(a, search));

  const favoriteAgents = DIRECTORY_AGENTS.filter((a) => favoriteIds.has(a.id));
  const favoriteSkills = DIRECTORY_SKILLS.filter((s) => favoriteIds.has(s.id));

  /* ── Header (fixed) ── */
  const header =
    view.kind === "callingSkill" && activeSkillCall ? (
      <SkillCallHeader
        skill={activeSkillCall}
        phase={skillCallAgent ? "connected" : "ringing"}
        agent={skillCallAgent}
        onBack={() => setView({ kind: "list" })}
        // Ringing hasn't started any real consult yet (see the effect
        // above — `onAddToCall` only fires once someone "answers"), so
        // backing out here is free, same as Back.
        onCancelRinging={() => setView({ kind: "list" })}
        // Full transfer to whichever agent the skill routed to — distinct
        // from `SkillRow`'s own Transfer (a blind transfer to the skill
        // queue itself, unrelated to who's currently being consulted).
        // Same stub-log pattern as every other transfer action in this
        // file — there's no real transfer backend to wire into yet.
        onTransfer={() => {
          if (skillCallAgent) {
            log("Transfer to", skillCallAgent.name);
            resetAndClose();
          }
        }}
      />
    ) : view.kind === "chat" && activeAgent ? (
      <ChatHeader
        agent={activeAgent}
        onBack={() => setView({ kind: "list" })}
        // With a live call to consult into, Phone starts/joins that same
        // consult-then-merge flow "Add to call" already runs (identical
        // `onAddToCall` call+close). Otherwise — any non-voice active
        // interaction, or a voice one with no live call right now — it
        // starts a brand-new internal agent-to-agent call instead (see
        // `onStartAgentCall`'s own doc comment): calling an agent from here
        // always does something real, never just a stub log.
        onCall={() => {
          if (onAddToCall) {
            // Consulting into a call that's already live: per an explicit
            // follow-up, the popup stays open (and focus stays put on
            // whichever assignment card this was opened from) until the
            // agent closes it themselves — the whole point is to let them
            // watch the consult connect/merge without losing this chat.
            // Deliberately NOT calling `resetAndClose()` here, unlike the
            // `onStartAgentCall` branch right below, which still does.
            onAddToCall({ id: activeAgent.id, name: activeAgent.name });
          } else if (onStartAgentCall) {
            onStartAgentCall(activeAgent);
            resetAndClose();
          } else {
            log("Call", activeAgent.name);
          }
        }}
        onTransfer={() => { log("Transfer to", activeAgent.name); resetAndClose(); }}
        // Only ever rendered/reachable when `activeChannelType` doesn't
        // qualify for it (see `ChatHeader`'s own `canAddPerson`) — still
        // just a stub log, per the earlier critique that a real "group
        // chat" merge is its own separate, not-yet-built feature.
        onAddToInteraction={() => log("Add to interaction", activeAgent.name)}
        hasLiveCall={!!onAddToCall}
        activeChannelType={activeChannelType}
        isOnCall={!!activeCallAgentIds?.has(activeAgent.id)}
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
  if (view.kind === "callingSkill" && activeSkillCall) {
    content = (
      <SkillCallContent skill={activeSkillCall} phase={skillCallAgent ? "connected" : "ringing"} agent={skillCallAgent} />
    );
  } else if (view.kind === "chat" && activeAgent) {
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
            onCall={() => setView({ kind: "callingSkill", skillId: skill.id })}
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
                onCall={() => setView({ kind: "callingSkill", skillId: skill.id })}
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
