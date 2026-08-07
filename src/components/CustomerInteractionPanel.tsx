import { useState, useRef, useLayoutEffect, useEffect, Fragment } from "react";
import {
  ActionIconButton,
  Button,
  Popover,
  Menu,
  Tooltip,
  Chip,
  ConversationMessage,
  ConversationDateStamp,
  Textarea,
  Divider,
  CHANNEL_TYPE_META,
  KebabMenuButton,
  buildDigitalMenuItems,
  buildVoiceMenuItems,
  ToggleGroup,
  type MenuEntry,
  type ConversationVariant,
  type ChipColor,
  type ChannelType,
} from "@nicecxone/lyra-ui";
import {
  User,
  IdCard,
  ChevronDown,
  Pause,
  MicOff,
  Mic,
  AudioLines,
  Disc,
  Grip,
  Phone,
  PhoneOff,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  ArrowRight,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  Type,
  Send,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OutcomeButton } from "@/components/OutcomePanel";
import { ConsultTransferButton } from "@/components/ConsultTransferPopover";

/* ── Shared types ── */

export type EscalationStatus = "escalated" | "in-progress" | "resolved" | "new";

/** One message in an interaction's transcript. `variant` is this app's own
 *  domain vocabulary, not lyra-ui's — translated to lyra-ui's
 *  ConversationVariant ("agent" (left) / "user" (right)) at the render
 *  call site below. lyra-ui's own "customer"/"support-agent" variants
 *  (with their own green/purple styling built for exactly this
 *  customer-support case) don't exist in its published version — only
 *  "user" | "ai" | "agent" | "dark" — so this app keeps its own clearer
 *  names locally and maps them at the boundary instead. */
export interface Message {
  id: string;
  variant: "customer" | "support-agent";
  senderName: string;
  text: string;
  timestamp: string;
  alert?: { message: string; severity: "warning" | "critical" };
}

/** support-agent (our own agent) reads as the "right side" role lyra-ui
 *  calls "user" elsewhere in this app (see InternalChatPopover's
 *  `fromMe ? "user" : "agent"`); customer is the other party, "agent". */
function toConversationVariant(variant: Message["variant"]): ConversationVariant {
  return variant === "support-agent" ? "user" : "agent";
}

/* ── Formatted message text (mini markup → React nodes) ──
 * MessageComposer's toolbar (below) writes a tiny local markup into
 * `Message.text` — **bold**, *italic*, __underline__, [label](url) links,
 * "- " bullet lines, "1. " numbered lines — parsed back into real
 * <strong>/<em>/<u>/<a>/<ul>/<ol> elements wherever a message renders (chat
 * bubbles and the voice transcript rows alike). Deliberately not full
 * Markdown or real HTML: this app owns both ends of the format (the only
 * thing that ever writes it is MessageComposer's own toolbar), so there's
 * no need for a general-purpose parser, sanitizer, or dangerouslySetInnerHTML
 * — plain text just passes through untouched. */

const INLINE_FORMAT_PATTERN = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*/g;

function renderInlineFormatting(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let i = 0;
  INLINE_FORMAT_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = INLINE_FORMAT_PATTERN.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const [, linkText, linkUrl, boldText, underlineText, italicText] = match;
    if (linkText !== undefined) {
      nodes.push(
        <a key={`${keyPrefix}-${i++}`} href={linkUrl} target="_blank" rel="noreferrer" className="text-lyra-fg-link underline">
          {linkText}
        </a>
      );
    } else if (boldText !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${i++}`}>{boldText}</strong>);
    } else if (underlineText !== undefined) {
      nodes.push(<u key={`${keyPrefix}-${i++}`}>{underlineText}</u>);
    } else if (italicText !== undefined) {
      nodes.push(<em key={`${keyPrefix}-${i++}`}>{italicText}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

const BULLET_LINE = /^\s*-\s+(.*)$/;
const NUMBERED_LINE = /^\s*\d+\.\s+(.*)$/;
/** Written/stripped by MessageComposer's alignment buttons — "left" is
 *  never actually written (it's the unmarked default), so this only ever
 *  matches center/right/justify. */
const ALIGN_MARKER = /^\[align:(center|right|justify)\]/;

interface ParsedLine {
  text: string;
  align?: "center" | "right" | "justify";
  /** One level per leading tab MessageComposer's Indent button wrote. */
  indent: number;
}

/** Strips a line's leading indent tabs and alignment marker (both written
 *  by MessageComposer's second toolbar row) off the front, returning the
 *  plain displayable text plus the metadata to style its wrapping block
 *  with — same "this app owns both ends of the format" reasoning as the
 *  inline bold/italic/etc. markup above. */
function parseLine(line: string): ParsedLine {
  let text = line;
  let indent = 0;
  while (text.startsWith("\t")) {
    indent++;
    text = text.slice(1);
  }
  const alignMatch = ALIGN_MARKER.exec(text);
  const align = alignMatch ? (alignMatch[1] as ParsedLine["align"]) : undefined;
  if (alignMatch) text = text.slice(alignMatch[0].length);
  return { text, align, indent };
}

function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split("\n").map(parseLine);
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const bulletMatch = BULLET_LINE.exec(lines[i]!.text);
    const numberedMatch = !bulletMatch && NUMBERED_LINE.exec(lines[i]!.text);

    if (bulletMatch || numberedMatch) {
      const pattern = bulletMatch ? BULLET_LINE : NUMBERED_LINE;
      const items: string[] = [];
      while (i < lines.length) {
        const m = pattern.exec(lines[i]!.text);
        if (!m) break;
        items.push(m[1]!);
        i++;
      }
      const key = blockKey++;
      const ListTag = bulletMatch ? "ul" : "ol";
      blocks.push(
        <ListTag key={`list-${key}`} className={bulletMatch ? "list-disc pl-5" : "list-decimal pl-5"}>
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineFormatting(item, `list-${key}-${idx}`)}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    // Group consecutive plain lines sharing the same alignment + indent
    // into one wrapping block, so a multi-line aligned/indented paragraph
    // gets styled once rather than one wrapper per line — matches how the
    // list branch above already groups its own consecutive matching lines.
    const { align, indent } = lines[i]!;
    const groupLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i]!;
      if (BULLET_LINE.test(current.text) || NUMBERED_LINE.test(current.text)) break;
      if (current.align !== align || current.indent !== indent) break;
      groupLines.push(current.text);
      i++;
    }
    const key = blockKey++;
    const hasBlockStyle = align !== undefined || indent > 0;
    blocks.push(
      <div key={`para-${key}`} style={hasBlockStyle ? { textAlign: align, paddingLeft: indent * 20 } : undefined}>
        {groupLines.map((lineText, idx) => (
          <Fragment key={idx}>
            {renderInlineFormatting(lineText, `para-${key}-${idx}`)}
            {idx < groupLines.length - 1 && <br />}
          </Fragment>
        ))}
      </div>
    );
  }
  return blocks;
}

/* ── Voice call transcript ──
 * A "Live Transcription"-style read-out for voice calls — modeled on
 * Figma's Live Transcription file (node 4198:13595: plain speaker rows with
 * a small colored initials circle, name+timestamp, and message text below,
 * plus inline call-event rows like "Call on hold"/"Call resumed" — no chat
 * bubbles, no left/right split, everything reads top-to-bottom as one
 * continuous record). Deliberately NOT built as a lyra-ui component yet —
 * this is a local, single-app exploration of the pattern; promoting it to
 * `@nicecxone/lyra-ui` (alongside `ConversationMessage`) is a follow-up
 * decision, not part of this pass. Reuses this app's existing `Message`
 * shape and lyra-ui's own color tokens rather than inventing either. */

export type CallTranscriptEventKind =
  | "hold"
  | "resume"
  | "mute"
  | "unmute"
  | "poor-connection"
  | "connection-restored"
  | "ended";

/** One non-speech moment in a call — rendered as its own icon+label+timestamp
 *  row, anchored to appear immediately after a specific message via
 *  `afterMessageId` (rather than carrying its own absolute position in the
 *  list) so event rows can't drift out of order relative to the dialogue
 *  they interrupt. */
export interface CallTranscriptEvent {
  id: string;
  afterMessageId: string;
  kind: CallTranscriptEventKind;
  label: string;
  timestamp: string;
}

/** One grouped block of a company-authored call script — e.g. "Greeting",
 *  "Verify identity", "Resolution", "Closing" — each with the line(s) the
 *  agent should read (near-)verbatim. Static/read-only content, seeded
 *  per-assignment same as `callEvents` above; a voice call with no `script`
 *  simply never shows the Live Transcript/Script toggle (see
 *  `CustomerInteractionPanel`'s own render below) rather than showing an
 *  empty or disabled Script option. */
export interface CallScriptSection {
  heading: string;
  lines: string[];
}

/** Read-only script view — swapped in for `VoiceTranscriptThread` when the
 *  agent picks "Script" from the Live Transcript/Script toggle. Deliberately
 *  static (no read-aloud tracking/checkboxes yet) — the goal for now is
 *  just giving the agent a stable place to find the pre-written lines
 *  without losing the live transcript underneath (switching back is one
 *  click away). */
function CallScriptView({ sections }: { sections: CallScriptSection[] }) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section, i) => (
        <div key={i} className="flex flex-col gap-2">
          <p className="lyra-body-xs-emphasis uppercase tracking-wide text-lyra-fg-secondary">
            {section.heading}
          </p>
          <div className="flex flex-col gap-2">
            {section.lines.map((line, j) => (
              <div
                key={j}
                className="rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-shell px-3.5 py-3"
              >
                <p className="lyra-body-md text-lyra-fg-default">{line}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const CALL_TRANSCRIPT_EVENT_META: Record<CallTranscriptEventKind, { icon: LucideIcon; tone: "default" | "error" | "success" }> = {
  hold:                 { icon: Pause,         tone: "default" },
  resume:               { icon: Phone,         tone: "default" },
  mute:                 { icon: MicOff,        tone: "default" },
  unmute:               { icon: Mic,           tone: "default" },
  "poor-connection":    { icon: AlertTriangle, tone: "error" },
  "connection-restored":{ icon: CheckCircle2,  tone: "success" },
  ended:                { icon: PhoneOff,      tone: "default" },
};

/** Pulls just the clock-time back out of this app's own richer timestamp
 *  strings (e.g. "Today, 01:58AM · Voice") — the transcript's own rows read
 *  closer to the Figma reference's plain "9:10 AM" than this app's fuller
 *  chat-timestamp format. Falls back to the original string if nothing
 *  matches, so an unexpected format degrades instead of disappearing. */
function extractTimeOfDay(timestamp: string): string {
  const match = timestamp.match(/\d{1,2}:\d{2}\s?[AP]M/i);
  return match ? match[0] : timestamp;
}

function TranscriptMessageRow({ message }: { message: Message }) {
  const isAgent = message.variant === "support-agent";
  return (
    // Every row is a freshly-mounted DOM node the moment its message is
    // appended (keyed by message.id in VoiceTranscriptThread's .map), so
    // an unconditional mount-in animation is enough to make a transcript
    // that's actively being appended to (e.g. the outbound-call demo
    // transcript in AgentNextGenPage) read as building line-by-line rather
    // than popping in — no separate "is this new" tracking needed.
    <div className="flex w-full items-start gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div
        className={cn(
          "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full lyra-body-xs-emphasis",
          isAgent
            ? "bg-lyra-status-info-subtle text-lyra-status-info-strong"
            : "bg-lyra-accent-pink-soft text-lyra-accent-pink-strong"
        )}
        aria-hidden="true"
      >
        {getInitials(message.senderName)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-end gap-3">
          <span className="lyra-body-sm-emphasis text-lyra-fg-default">{message.senderName}</span>
          <span className="lyra-body-sm text-lyra-fg-secondary">{extractTimeOfDay(message.timestamp)}</span>
        </div>
        <div className="lyra-body-sm text-lyra-fg-default">{renderFormattedText(message.text)}</div>
      </div>
    </div>
  );
}

function TranscriptEventRow({ event }: { event: CallTranscriptEvent }) {
  const meta = CALL_TRANSCRIPT_EVENT_META[event.kind];
  const Icon = meta.icon;
  return (
    <div className="flex w-full items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div
        className={cn(
          "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-lyra-status-info-subtle",
          meta.tone === "error" && "text-lyra-status-critical-strong",
          meta.tone === "success" && "text-lyra-status-success-strong",
          meta.tone === "default" && "text-lyra-fg-secondary"
        )}
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
      </div>
      <div className="flex flex-1 items-end gap-3">
        <span className="lyra-body-sm text-lyra-fg-secondary">{event.label}</span>
        <span className="lyra-body-sm text-lyra-fg-secondary">{extractTimeOfDay(event.timestamp)}</span>
      </div>
    </div>
  );
}

type TranscriptBlock =
  | { type: "message"; message: Message }
  | { type: "events"; events: CallTranscriptEvent[] };

/** Groups the flat message+event lists into render blocks — consecutive
 *  event rows collapse into one tightly-spaced (12px) sub-stack (matching
 *  the Figma reference's own grouping of e.g. "Call masked"/"Call
 *  unmasked"/"Call muted" back to back), while every message keeps the
 *  thread's normal looser (24px) spacing from whatever comes before/after
 *  it. */
function buildTranscriptBlocks(messages: Message[], events: CallTranscriptEvent[]): TranscriptBlock[] {
  const eventsByAnchor = new Map<string, CallTranscriptEvent[]>();
  for (const event of events) {
    const list = eventsByAnchor.get(event.afterMessageId) ?? [];
    list.push(event);
    eventsByAnchor.set(event.afterMessageId, list);
  }
  const blocks: TranscriptBlock[] = [];
  for (const message of messages) {
    blocks.push({ type: "message", message });
    const anchored = eventsByAnchor.get(message.id);
    if (anchored?.length) blocks.push({ type: "events", events: anchored });
  }
  return blocks;
}

function VoiceTranscriptThread({ messages, events = [] }: { messages: Message[]; events?: CallTranscriptEvent[] }) {
  const blocks = buildTranscriptBlocks(messages, events);
  return (
    <>
      {blocks.map((block, i) =>
        block.type === "message" ? (
          <TranscriptMessageRow key={block.message.id} message={block.message} />
        ) : (
          <div key={`events-${i}`} className="flex w-full flex-col gap-3">
            {block.events.map((event) => (
              <TranscriptEventRow key={event.id} event={event} />
            ))}
          </div>
        )
      )}
    </>
  );
}

/* ── EmailThread ──
 * Realistic email-client conversation view for the Email channel —
 * replaces lyra-ui's chat-bubble `ConversationMessage` the same way
 * `VoiceTranscriptThread` above replaces it for voice: an email reads as a
 * stack of individual messages (sender → recipient, timestamp, hairline
 * dividers between them), not a back-and-forth chat. Modeled on the
 * "AgentWorkspace into Lyra" Figma reference (node 2207:7459) — the most
 * recent message starts expanded (full body), every earlier one starts
 * collapsed to a single-line preview; clicking any row (or its trailing
 * chevron) toggles that one message's own expanded state, same as a real
 * inbox thread. Not built as a lyra-ui component yet, same reasoning
 * `VoiceTranscriptThread` gives for itself — a local, single-app
 * exploration of the pattern. */

/** Generic company inbox address — the "to" side of every customer-sent
 *  message, and the "from" side of every agent-sent one (paired with
 *  `customerEmail` below). This app has no real routing-address model yet,
 *  just this one stand-in constant, same fidelity level as this file's
 *  other placeholder identifiers (e.g. `CURRENT_AGENT_NAME` in
 *  AgentNextGenPage.tsx). */
const SUPPORT_EMAIL_ADDRESS = "support@ourcompany.com";

/** Which address a message reads as being sent *to* — the other party from
 *  whoever sent it. `customerEmail` is the channel's own recorded address
 *  (see `AssignmentChannel.address` in AgentNextGenPage.tsx) — falls back
 *  to a generic phrase when this particular channel doesn't have one on
 *  file. */
function emailRecipient(message: Message, customerEmail?: string): string {
  return message.variant === "support-agent" ? customerEmail ?? "the customer" : SUPPORT_EMAIL_ADDRESS;
}

/** Collapsed row's one-line preview — plain-ish text (still runs inline
 *  formatting so a bolded word etc. still reads correctly), truncated by
 *  its parent's own `truncate` class rather than sliced by character count,
 *  so it always breaks at the container's actual width. Only ever looks at
 *  the message's first line — a real preview wouldn't jump ahead to a later
 *  paragraph, same as Gmail's own collapsed-row preview never does. */
function EmailPreviewLine({ text }: { text: string }) {
  const firstLine = parseLine(text.split("\n")[0] ?? "");
  return (
    <p className="truncate lyra-body-sm text-lyra-fg-secondary">
      {renderInlineFormatting(firstLine.text, "email-preview")}
    </p>
  );
}

function EmailMessageRow({
  message,
  customerEmail,
  expanded,
  onToggle,
}: {
  message: Message;
  customerEmail?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isAgent = message.variant === "support-agent";
  const recipient = emailRecipient(message, customerEmail);
  return (
    <button type="button" onClick={onToggle} className="flex w-full items-start gap-4 p-4 text-left">
      {isAgent ? (
        <MessageAvatar icon={<User className="h-4 w-4" strokeWidth={1.5} />} className="h-8 w-8 shrink-0 bg-lyra-bg-primary text-lyra-fg-on-primary" />
      ) : (
        <MessageAvatar initials={getInitials(message.senderName)} className="h-8 w-8 shrink-0 bg-lyra-accent-blue-soft text-lyra-accent-blue-strong" />
      )}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 lyra-body-md-emphasis text-lyra-fg-default">{message.senderName}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />
            <Tooltip content={`To: ${recipient}`} placement="top" delayMs={400}>
              <span className="flex min-w-0 items-center gap-1">
                <span className="truncate lyra-body-sm text-lyra-fg-default">{recipient}</span>
                <ChevronDown className="h-3 w-3 shrink-0 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </Tooltip>
          </div>
          <span className="shrink-0 lyra-body-sm text-lyra-fg-secondary">{message.timestamp}</span>
        </div>
        {expanded ? (
          <div className="w-full lyra-body-sm text-lyra-fg-default">{renderFormattedText(message.text)}</div>
        ) : (
          <EmailPreviewLine text={message.text} />
        )}
      </div>
      <ChevronDown
        className={cn("mt-1 h-4 w-4 shrink-0 text-lyra-fg-secondary transition-transform", expanded && "rotate-180")}
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </button>
  );
}

function EmailThread({ messages, customerEmail }: { messages: Message[]; customerEmail?: string }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const lastMessageId = messages.length ? messages[messages.length - 1]!.id : undefined;

  // A newly-arrived message always opens expanded, collapsing whichever one
  // used to be "latest" — matches a real inbox thread, where sending or
  // receiving a new reply is what changes the default, not anything the
  // agent did themselves. Doesn't touch `expandedIds` otherwise, so an
  // agent manually expanding an older message to re-read it stays expanded
  // right up until the next new message resets things.
  useEffect(() => {
    if (lastMessageId) setExpandedIds(new Set([lastMessageId]));
  }, [lastMessageId]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex w-full flex-col">
      {messages.map((message, i) => (
        <div key={message.id}>
          {i > 0 && <Divider />}
          <EmailMessageRow
            message={message}
            customerEmail={customerEmail}
            expanded={expandedIds.has(message.id)}
            onToggle={() => toggleExpanded(message.id)}
          />
        </div>
      ))}
    </div>
  );
}

/** Which of the three transcript layouts (voice/email/chat-style) a channel's
 *  message thread renders as — the same three-way switch the live chat tab
 *  below (`activeTab === "chat"`) already makes, pulled out so a second,
 *  read-only context (the Customer Profile panel's Interactions tab) can
 *  reuse the exact same VoiceTranscriptThread/EmailThread/ConversationMessage
 *  rendering instead of re-deciding it. No send affordance here — that's
 *  MessageComposer's job, left to callers that actually need one. */
export function TranscriptThread({
  messages,
  isVoiceCall = false,
  isEmailChannel = false,
  callEvents,
  customerEmail,
}: {
  messages: Message[];
  isVoiceCall?: boolean;
  isEmailChannel?: boolean;
  callEvents?: CallTranscriptEvent[];
  customerEmail?: string;
}) {
  if (isVoiceCall) return <VoiceTranscriptThread messages={messages} events={callEvents} />;
  if (isEmailChannel) return <EmailThread messages={messages} customerEmail={customerEmail} />;
  return (
    <>
      {messages.map((m) => (
        <ConversationMessage
          key={m.id}
          variant={toConversationVariant(m.variant)}
          avatar={m.variant === "support-agent" ? AGENT_AVATAR : (
            <MessageAvatar initials={getInitials(m.senderName)} className="bg-lyra-accent-blue-soft text-lyra-accent-blue-strong" />
          )}
          senderName={m.senderName}
          timestamp={m.timestamp}
          alert={m.alert}
        >
          {renderFormattedText(m.text)}
        </ConversationMessage>
      ))}
    </>
  );
}

/* ── Escalation status pill (Popover + Menu, mirrors lyra-ui's own
 *  "Menu Popover" story pattern; visual pill is lyra-ui's own Chip
 *  component, wrapped in a plain button for keyboard/focus semantics
 *  since Chip itself is a presentational span) ── */

const STATUS_CONFIG: Record<EscalationStatus, { label: string; dot: string; chipColor: ChipColor }> = {
  escalated:     { label: "Escalated",    dot: "bg-lyra-status-critical-strong", chipColor: "red" },
  "in-progress": { label: "In Progress",  dot: "bg-lyra-status-info-strong",     chipColor: "blue" },
  resolved:      { label: "Resolved",     dot: "bg-lyra-status-success-strong",  chipColor: "green" },
  new:           { label: "New",          dot: "bg-lyra-fg-secondary",           chipColor: "slate" },
};

function EscalationStatusPill({
  status,
  onStatusChange,
}: {
  status: EscalationStatus;
  onStatusChange: (status: EscalationStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const config = STATUS_CONFIG[status];

  const items: MenuEntry[] = (Object.keys(STATUS_CONFIG) as EscalationStatus[]).map((key) => ({
    id: key,
    label: STATUS_CONFIG[key].label,
    icon: <span className={cn("h-2 w-2 rounded-full", STATUS_CONFIG[key].dot)} aria-hidden="true" />,
    selected: key === status,
    onClick: () => {
      onStatusChange(key);
      setOpen(false);
    },
  }));

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom"
      align="end"
      content={<Menu items={items} aria-label="Change interaction status" className="border-0 shadow-none bg-transparent min-w-[160px]" />}
    >
      <button type="button" aria-haspopup="menu" aria-expanded={open} className="cursor-pointer">
        <Chip color={config.chipColor} variant="subtle" className="gap-1">
          {config.label}
          <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")} strokeWidth={2} aria-hidden="true" />
        </Chip>
      </button>
    </Popover>
  );
}

/* ── Panel toggle buttons — same left/right toggles PageHeader offered,
 *  copied verbatim (icon, tooltip, hover/click wiring) so this header keeps
 *  that behavior when it replaces PageHeader in the page's own header slot. ── */

function LeftPanelToggle({ onToggle }: { onToggle?: () => void }) {
  return (
    <Tooltip content="Customer Profile" placement="right" asLabel>
      <button
        onClick={onToggle}
        aria-label="Customer Profile"
        className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
      >
        <IdCard className="h-[25px] w-[25px]" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

/* ── Sparkle icon (Ask AI) — moved here from AgentNextGenPage.tsx along with
 *  the "Ask AI" trigger itself (see `InteractionHeader`'s own Button below);
 *  not exported since nothing else in this app used it directly, only the
 *  trigger that owned it. `className` (default: none, falls back to the
 *  intrinsic 20x20 `width`/`height` attributes below) lets a consumer
 *  resize it via CSS the same way any other inline icon in this codebase
 *  does — a `className` height/width always overrides an SVG's own
 *  `width`/`height` attributes. ── */
function AiSparkleIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M17 10C17 9.94181 16.9795 9.88562 16.9424 9.84082C16.9051 9.79597 16.8532 9.76559 16.7959 9.75488L16.7949 9.75391L12.6279 8.96582C12.2329 8.89119 11.8693 8.69934 11.585 8.41504C11.3007 8.13074 11.1088 7.76715 11.0342 7.37207L10.2461 3.20508L10.2451 3.2041C10.2344 3.14679 10.204 3.09487 10.1592 3.05762C10.1144 3.02051 10.0582 3 10 3C9.94182 3 9.88563 3.02051 9.84082 3.05762C9.79597 3.09486 9.76559 3.14679 9.75488 3.2041L9.75391 3.20508L8.96582 7.37207C8.89119 7.76715 8.69934 8.13074 8.41504 8.41504C8.13074 8.69934 7.76715 8.89119 7.37207 8.96582L3.20508 9.75391L3.2041 9.75488C3.14679 9.76559 3.09486 9.79597 3.05762 9.84082C3.02051 9.88563 3 9.94182 3 10C3 10.0582 3.02051 10.1144 3.05762 10.1592C3.07625 10.1816 3.09828 10.2013 3.12305 10.2158L3.2041 10.2451L3.20508 10.2461L7.37207 11.0342C7.76715 11.1088 8.13074 11.3007 8.41504 11.585C8.69934 11.8693 8.89119 12.2329 8.96582 12.6279L9.75391 16.7949L9.75488 16.7959C9.76559 16.8532 9.79597 16.9051 9.84082 16.9424C9.88562 16.9795 9.94181 17 10 17C10.0582 17 10.1144 16.9795 10.1592 16.9424C10.204 16.9051 10.2344 16.8532 10.2451 16.7959L10.2461 16.7949L11.0342 12.6279C11.1088 12.2329 11.3007 11.8693 11.585 11.585C11.8693 11.3007 12.2329 11.1088 12.6279 11.0342L16.7949 10.2461L16.7959 10.2451C16.8532 10.2344 16.9051 10.204 16.9424 10.1592C16.9795 10.1144 17 10.0582 17 10ZM5.00098 15.999C5.00098 15.4469 4.55306 14.999 4.00098 14.999C3.4491 14.9993 3.00195 15.4471 3.00195 15.999C3.0022 16.5507 3.44925 16.9978 4.00098 16.998C4.55291 16.998 5.00073 16.5509 5.00098 15.999ZM6.00098 15.999C6.00073 17.1032 5.1052 17.998 4.00098 17.998C2.89697 17.9978 2.0022 17.103 2.00195 15.999C2.00195 14.8948 2.89682 13.9993 4.00098 13.999C5.10535 13.999 6.00098 14.8947 6.00098 15.999ZM18 10C18 10.2917 17.8983 10.5745 17.7119 10.7988C17.5256 11.0232 17.2662 11.174 16.9795 11.2275L16.9805 11.2285L12.8135 12.0166C12.616 12.0539 12.4341 12.1499 12.292 12.292C12.1499 12.4341 12.0539 12.616 12.0166 12.8135L11.2285 16.9805C11.1748 17.2668 11.023 17.5257 10.7988 17.7119C10.5745 17.8983 10.2917 18 10 18C9.70834 18 9.42555 17.8983 9.20117 17.7119C8.97704 17.5257 8.82516 17.2668 8.77148 16.9805L7.9834 12.8135C7.94609 12.616 7.85013 12.4341 7.70801 12.292C7.56588 12.1499 7.38403 12.0539 7.18652 12.0166L3.01953 11.2285V11.2275C2.73324 11.1738 2.47421 11.0229 2.28809 10.7988C2.10174 10.5745 2 10.2917 2 10C2 9.70834 2.10174 9.42554 2.28809 9.20117C2.47425 8.97704 2.73317 8.82516 3.01953 8.77148L7.18652 7.9834C7.38403 7.94609 7.56588 7.85013 7.70801 7.70801C7.85013 7.56588 7.94609 7.38403 7.9834 7.18652L8.77148 3.01953C8.82516 2.73317 8.97704 2.47425 9.20117 2.28809C9.42554 2.10174 9.70834 2 10 2C10.2917 2 10.5745 2.10174 10.7988 2.28809C11.023 2.47425 11.1748 2.73317 11.2285 3.01953L12.0166 7.18652C12.0539 7.38403 12.1499 7.56588 12.292 7.70801C12.4341 7.85013 12.616 7.94609 12.8135 7.9834L16.9805 8.77148H16.9795C17.2662 8.82503 17.5256 8.97683 17.7119 9.20117C17.8983 9.42555 18 9.70834 18 10ZM17.8271 4.0791C17.8271 4.22843 17.775 4.37334 17.6797 4.48828C17.5842 4.60329 17.4507 4.68056 17.3037 4.70801L17.3047 4.70898L16.6699 4.82812L16.5498 5.46191C16.5224 5.60887 16.4451 5.74238 16.3301 5.83789C16.2151 5.93334 16.0703 5.98532 15.9209 5.98535C15.7715 5.98535 15.6267 5.93328 15.5117 5.83789C15.3971 5.74266 15.3187 5.6103 15.291 5.46387L15.1709 4.82812L14.5361 4.70898V4.70801C14.3898 4.68032 14.2573 4.6029 14.1621 4.48828C14.0907 4.40218 14.0436 4.29937 14.0244 4.19043L14.0146 4.0791L14.0244 3.96875C14.0436 3.85949 14.0904 3.75624 14.1621 3.66992C14.2576 3.55499 14.3903 3.47672 14.5371 3.44922L15.1709 3.3291L15.291 2.69531C15.3186 2.54862 15.3969 2.41569 15.5117 2.32031L15.6025 2.25781C15.6989 2.20264 15.8086 2.17285 15.9209 2.17285L16.0312 2.18262C16.1041 2.19538 16.174 2.22111 16.2383 2.25781L16.3301 2.32031L16.4092 2.39941C16.4808 2.48388 16.5302 2.58618 16.5508 2.69629H16.5498L16.6699 3.3291L17.3027 3.44922H17.3037C17.4138 3.46978 17.5161 3.5192 17.6006 3.59082L17.6797 3.66992L17.7422 3.76172C17.7971 3.85791 17.8271 3.96706 17.8271 4.0791Z" fill="currentColor"/>
    </svg>
  );
}

/* ── InteractionHeader ──
 * Replaces the page's own PageHeader while an interaction is open — same
 * panel-toggle affordances, but the title slot becomes the customer's name
 * (still an <h1>, matching PageHeader's own lyra-heading-lg) plus tabs and
 * interaction-specific actions instead of a generic page title. */

/** Icons that open a right-side slide-in beside the interaction. Directory
 *  has real content; the rest render a "Design coming" placeholder. */
export type SlideInDestination = "contacts" | "directory" | "schedule" | "customWorkspace";
/** Icons that instead take over the whole content column (no slide-in) —
 *  see the `takeover` prop below. */
export type FullPageDestination = "settings" | "dashboard";
export type NavDestination = SlideInDestination | FullPageDestination;

export interface InteractionHeaderProps {
  customerName?: string;
  /** Unassigns/dismisses the current interaction — clears the active
   *  interaction entirely so any open slide-in page (e.g. Directory) takes
   *  over the content column. */
  onCloseInteraction?: () => void;
  panelToggle?: "left";
  onPanelToggle?: () => void;
  /** Settings/Dashboard take over the whole content column instead of
   *  sliding in — this hides everything specific to the customer contact
   *  (the Customer Snapshot toggle, name, Customer profile, kebab menu),
   *  showing just `takeoverTitle` instead. The Contacts/Directory/Schedule/
   *  Dashboard nav row that used to live here regardless of `takeover` now
   *  lives in `AppHeader` instead (see AgentNextGenPage.tsx) — it's global
   *  navigation, not something specific to one interaction, so it reads
   *  better as part of the always-present app header than duplicated into
   *  every content-column header state. */
  takeover?: boolean;
  /** Page title shown when `takeover` is true (e.g. "Settings"/"Control Center")
   *  — takes the same left-aligned <h1> slot the customer name uses
   *  otherwise, since the two are mutually exclusive. */
  takeoverTitle?: string;
  /** Drives the "Ask AI" button's pressed/expanded look — mirrors whatever
   *  boolean state controls the AI panel itself (see AgentNextGenPage.tsx's
   *  `aiPanelOpen`). Unlike the global nav row above, this button is scoped
   *  to an actual interaction (asking AI needs something to ask about), so
   *  it only ever renders in the non-`takeover` branch below rather than
   *  living in the always-present `AppHeader`. */
  aiPanelOpen?: boolean;
  onAskAiClick?: () => void;
  /** The active interaction's call/transfer/outcome controls
   *  (`InteractionActionsBar`), rendered right after the customer name —
   *  e.g. this app's own `InteractionActionsBar` instance (see
   *  AgentNextGenPage.tsx). Kept as a generic slot (not a dedicated prop
   *  per control) so this component has no direct dependency on
   *  `CustomerInteractionPanel`'s own `InteractionActionsBar` type, same
   *  reasoning `headerAction`/`addOutboundAction` used elsewhere in this
   *  app. Used to live in `AppHeader`'s `center` slot instead (see that
   *  component's own doc comment in app-header.tsx for the full history) so
   *  it stayed reachable even when this header wasn't on screen — moved
   *  back here, next to the customer name, per an explicit follow-up; that
   *  always-reachable property is gone now, this only shows while this
   *  header itself is on screen. */
  actionsBar?: React.ReactNode;
}

export function InteractionHeader({
  customerName,
  onCloseInteraction,
  panelToggle,
  onPanelToggle,
  takeover,
  takeoverTitle,
  aiPanelOpen,
  onAskAiClick,
  actionsBar,
}: InteractionHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b border-lyra-border-subtle px-6 py-4">
      {takeover && takeoverTitle && (
        <h1 className="lyra-heading-lg shrink-0 pr-2 text-lyra-fg-default">{takeoverTitle}</h1>
      )}

      {!takeover && (
        <>
          <h1 className="lyra-heading-lg shrink-0 pr-2 text-lyra-fg-default">{customerName || "Customer"}</h1>

          {actionsBar}

          <span className="flex-1" />

          {/* Customer Profile toggle — moved here (next to Ask AI) from
           *  the row's far left, now that the panel it opens docks to the
           *  right instead of the left (see AgentNextGenPage.tsx). Still
           *  the same `LeftPanelToggle`/`onPanelToggle` plumbing under the
           *  hood — just relocated, not renamed, since "Customer Profile"
           *  (the tooltip/aria-label) never said which side it opened on
           *  anyway. */}
          {panelToggle === "left" && (
            <>
              <LeftPanelToggle onToggle={onPanelToggle} />
              <div className="h-5 w-px bg-lyra-border-subtle" />
            </>
          )}

          {/* Moved here from AppHeader's own action row — see
           *  `aiPanelOpen`'s doc comment above for why. A real
           *  icon+text Button (not the icon-only/Tooltip treatment the
           *  other header actions use) so it reads as its own inline
           *  action rather than blending into the icon row. */}
          <Button
            variant="outline"
            size="md"
            aria-expanded={aiPanelOpen}
            onClick={onAskAiClick}
            className={cn(aiPanelOpen && "bg-lyra-state-hover")}
          >
            <AiSparkleIcon className="h-4 w-4" />
            Ask AI
          </Button>
        </>
      )}
    </div>
  );
}

/** Exported so AgentNextGenPage can reuse the exact same active-state
 *  styling and click wiring for the Settings icon in the LeftNav rail's
 *  footer — Settings moved there from this header's own nav row. */
export function NavIconButton({
  item,
  title,
  icon: Icon,
  activeNav,
  onNavClick,
  className,
  iconClassName,
}: {
  item: NavDestination;
  title: string;
  icon: typeof User;
  activeNav?: NavDestination | null;
  onNavClick?: (item: NavDestination) => void;
  /** Escape hatch for one-off size/spacing overrides (e.g. the LeftNav
   *  rail's footer Settings button is larger than the header row's
   *  icons) without changing every other caller. */
  className?: string;
  /** Same idea as `className`, but for the icon glyph itself (default
   *  h-4 w-4) rather than the button's own hit area. */
  iconClassName?: string;
}) {
  const active = activeNav === item;
  return (
    <ActionIconButton
      title={title}
      aria-expanded={active}
      onClick={() => onNavClick?.(item)}
      className={cn(active && "bg-lyra-state-hover", className)}
    >
      <Icon className={iconClassName ?? "h-4 w-4"} strokeWidth={1.5} />
    </ActionIconButton>
  );
}

/* ── InteractionInfoBar ──
 * Sits directly under InteractionHeader: subject, case ID, and the
 * escalation status pill (moved here from the header row). */

export interface InteractionInfoBarProps {
  subject: string;
  caseId: string;
  escalationStatus: EscalationStatus;
  onEscalationStatusChange: (status: EscalationStatus) => void;
}

export function InteractionInfoBar({ subject, caseId, escalationStatus, onEscalationStatusChange }: InteractionInfoBarProps) {
  return (
    <div className="flex items-center gap-3 border-b border-lyra-border-subtle px-6 py-2.5 lyra-body-sm">
      <span className="text-lyra-fg-default">{subject}</span>
      <div className="h-4 w-px bg-lyra-border-subtle" />
      <span className="text-lyra-fg-default">{caseId}</span>
      <div className="h-4 w-px bg-lyra-border-subtle" />
      <EscalationStatusPill status={escalationStatus} onStatusChange={onEscalationStatusChange} />
    </div>
  );
}

/** Lucide's own two-way-arrow glyph for "transfer" — replaces the old
 *  person + redirect-arrow composite (no single icon covered it before).
 *  Mirrors the same swap in channel-row.tsx's own (private) copy of this
 *  icon. Exported so ConsultTransferPopover.tsx (the "Transfer" button's
 *  popup content) can reuse this exact glyph for its own per-row "Transfer"
 *  actions instead of a second copy. */
export function ConsultTransferIcon({ strokeWidth = 1.5 }: { strokeWidth?: number }) {
  return <ArrowRightLeft className="h-4 w-4" strokeWidth={strokeWidth} aria-hidden="true" />;
}

/** AudioLines with a diagonal slash — Lucide has no ready "off" variant for
 *  it, so composite one: the base icon plus an overlaid line, drawn
 *  corner-to-corner the same way Lucide's own `-Off` icons (e.g. MicOff)
 *  draw their slash. */
function MutedAudioLinesIcon({ strokeWidth = 2 }: { strokeWidth?: number }) {
  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center" aria-hidden="true">
      <AudioLines className="h-5 w-5" strokeWidth={strokeWidth} />
      <svg className="absolute inset-0 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
        <line x1="2" x2="22" y1="2" y2="22" />
      </svg>
    </span>
  );
}

/* ── InteractionActionsBar ──
 * Rendered in its own row above InteractionHeader's customer-name row (via
 * that component's `actionsBar` slot — see its own doc comment for the
 * layout history) — Transfer/Outcome icon buttons, same treatment as the
 * assignment card's own Transfer/Outcome buttons (interaction-nav-item.tsx).
 * For a voice call, the same pill expands to include call controls (hold,
 * mute, etc) too.
 * "Outcome" used to be an inert icon button (no popup) — now opens the
 * wrap-up form in OutcomePanel.tsx, hence the added `customerName` prop
 * (seeds the panel's title and AI-suggested summary). Same reasoning for
 * `issueSummary`, added for ConsultTransferButton's own AI-suggested
 * handoff summary — `issueSummary` specifically (not `subject`, the short
 * header text) since the handoff note needs the fuller description of
 * what's actually going on. No `caseId` here — a case reference number
 * isn't useful context for an agent deciding whether to pick up an
 * interaction, so the handoff note dropped it. */

export interface InteractionActionsBarProps {
  isVoiceCall?: boolean;
  /** Optional, matching InteractionHeader's own `customerName?` — not every
   *  assignment has one on record. OutcomeButton/ConsultTransferButton each
   *  fall back to generic phrasing when omitted. */
  customerName?: string;
  issueSummary?: string;
  /** This interaction's currently-active channel — drives the leading
   *  channel-type segment's icon/label/kebab below. */
  currentChannelType?: ChannelType;
  /** Controlled (lifted to `AgentNextGenPage`) rather than left as
   *  `OutcomeButton`'s own internal state — see that component's own
   *  `open`/`onOpenChange` doc comment. */
  outcomeOpen: boolean;
  onOutcomeOpenChange: (open: boolean) => void;
  /** Wired to the leading channel-type segment's kebab "Unassign & Dismiss"
   *  — the consumer decides (same split `InteractionNavItem`'s own
   *  `onDismiss`/`onDismissChannel` props use) whether that should end just
   *  `currentChannelType`'s channel or the whole interaction, based on how
   *  many channels are open. Omit to leave that menu item inert. */
  onDismissCurrentChannel?: () => void;
}

export function InteractionActionsBar({
  isVoiceCall = false,
  customerName,
  issueSummary,
  currentChannelType,
  outcomeOpen,
  onOutcomeOpenChange,
  onDismissCurrentChannel,
}: InteractionActionsBarProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-container-subtle p-1">
      {/* Channel-type indicator — replaces the old `ChannelTab` bar that used
       *  to live in `InteractionHeader`'s Row 1 (see that component's own
       *  doc comment). Swaps icon/label as the agent clicks a different
       *  channel row on the assignment card (`currentChannelType` follows
       *  the same `currentChannelKey` state that drives the card's
       *  highlighted row) — this is now the *only* place Row 1 shows which
       *  channel is on screen. The kebab carries the same default per-type
       *  menu (`buildDigitalMenuItems`/`buildVoiceMenuItems`) each channel
       *  row on the card already uses, so "Unassign & Dismiss" etc. stay
       *  reachable from here too, not just from the card. */}
      {currentChannelType && (
        <>
          <span className="flex items-center gap-1.5 px-2 text-lyra-fg-default lyra-body-sm-emphasis">
            <span className="shrink-0" aria-hidden="true">{CHANNEL_TYPE_META[currentChannelType].icon}</span>
            {CHANNEL_TYPE_META[currentChannelType].label}
          </span>
          <KebabMenuButton
            items={
              currentChannelType === "voice"
                ? buildVoiceMenuItems(onDismissCurrentChannel)
                : buildDigitalMenuItems(onDismissCurrentChannel)
            }
            ariaLabel={`More options for ${CHANNEL_TYPE_META[currentChannelType].label}`}
          />
          <div className="mx-0.5 h-6 w-px bg-lyra-border-subtle" />
        </>
      )}
      {isVoiceCall && (
        <>
          <ActionIconButton size="default" title="Hold">
            <Pause className="h-5 w-5" strokeWidth={2} />
          </ActionIconButton>
          <ActionIconButton size="default" title="Mute">
            <MicOff className="h-5 w-5" strokeWidth={2} />
          </ActionIconButton>
          <ActionIconButton size="default" title="Mute Speaker">
            <MutedAudioLinesIcon strokeWidth={2} />
          </ActionIconButton>
          <ActionIconButton size="default" title="Record">
            <Disc className="h-5 w-5" strokeWidth={2} />
          </ActionIconButton>
          <ActionIconButton size="default" title="Dialpad">
            <Grip className="h-5 w-5" strokeWidth={2} />
          </ActionIconButton>
          <ActionIconButton size="default" title="Hang Up">
            <PhoneOff className="h-5 w-5 text-lyra-status-critical-strong" strokeWidth={2} />
          </ActionIconButton>
          <div className="mx-0.5 h-6 w-px bg-lyra-border-subtle" />
        </>
      )}
      <ConsultTransferButton customerName={customerName} issueSummary={issueSummary} />
      <OutcomeButton
        customerName={customerName ?? "this customer"}
        open={outcomeOpen}
        onOpenChange={onOutcomeOpenChange}
      />
    </div>
  );
}

/* ── Message avatars ── */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function MessageAvatar({ initials, icon, className }: { initials?: string; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full lyra-body-xs-emphasis", className)}>
      {icon ?? initials}
    </div>
  );
}

const AGENT_AVATAR = <MessageAvatar icon={<User className="h-4 w-4" strokeWidth={1.5} />} className="bg-lyra-bg-primary text-lyra-fg-on-primary" />;

/* ── MessageComposer ──
 * The reply box for chat and email (never shown for voice — see
 * `CustomerInteractionPanel`'s own `isVoiceCall` gating above). Two
 * deliberate choices worth calling out:
 *
 * 1. Auto-grow + still manually resizable. lyra-ui's own `Textarea` already
 *    ships a native `resize-y` drag handle; on top of that, `growToFit`
 *    below grows the box as content overflows it, but — on purpose — never
 *    shrinks it back down. That means typing a long reply grows the box
 *    automatically, and a manual drag (to make room, or to compact it back
 *    down) is never immediately fought by the next keystroke's auto-grow,
 *    since auto-grow only ever pushes height up when content genuinely
 *    doesn't fit, never resets it from scratch.
 * 2. Formatting stays hidden until asked for. Rather than a permanent row
 *    of Bold/Italic/etc. icons next to every composer, a single "Aa" toggle
 *    (the `Type` icon) reveals a small toolbar above the field on demand —
 *    collapsed by default so the composer's default state stays as plain
 *    and uncluttered as a bare text field, and the option to keep it open
 *    for a longer draft is still one click away, not buried behind a menu.
 */

type InlineFormatAction = "bold" | "italic" | "underline" | "bulletList" | "numberedList" | "link";
type BlockFormatAction = "alignLeft" | "alignCenter" | "alignRight" | "alignJustify" | "indent" | "outdent";
type FormatAction = InlineFormatAction | BlockFormatAction;

const BLOCK_FORMAT_ACTIONS = new Set<FormatAction>(["alignLeft", "alignCenter", "alignRight", "alignJustify", "indent", "outdent"]);

/** Tier 1 — always what's revealed first by the "Aa" toggle: the formatting
 *  used constantly (matches the "3 essentials" instinct, just applied to a
 *  slightly bigger essential set since this composer already covers lists
 *  and links, not just bold/italic). */
const FORMAT_TOOLBAR_PRIMARY: { action: FormatAction; icon: LucideIcon; title: string }[] = [
  { action: "bold", icon: Bold, title: "Bold" },
  { action: "italic", icon: Italic, title: "Italic" },
  { action: "underline", icon: Underline, title: "Underline" },
  { action: "bulletList", icon: List, title: "Bulleted list" },
  { action: "numberedList", icon: ListOrdered, title: "Numbered list" },
  { action: "link", icon: Link2, title: "Link" },
];

/** Tier 2 — tucked one level deeper behind its own "More formatting"
 *  toggle at the end of the primary row, rather than always shown
 *  alongside it. Reached for less often than bold/italic/lists, so it
 *  costs one extra click instead of permanently taking up toolbar space. */
const FORMAT_TOOLBAR_SECONDARY: { action: FormatAction; icon: LucideIcon; title: string }[] = [
  { action: "alignLeft", icon: AlignLeft, title: "Align left" },
  { action: "alignCenter", icon: AlignCenter, title: "Align center" },
  { action: "alignRight", icon: AlignRight, title: "Align right" },
  { action: "alignJustify", icon: AlignJustify, title: "Justify" },
  { action: "indent", icon: Indent, title: "Increase indent" },
  { action: "outdent", icon: Outdent, title: "Decrease indent" },
];

const COMPOSER_MIN_HEIGHT = 120;
const COMPOSER_MAX_HEIGHT = 320;

export interface MessageComposerProps {
  onSend: (text: string) => void;
  /** See `CustomerInteractionPanelProps.sendOnEnter`'s doc comment. */
  sendOnEnter?: boolean;
  placeholder?: string;
  /** See `CustomerInteractionPanelProps.isEmailChannel`'s doc comment. */
  isEmailChannel?: boolean;
  /** Seeds the To field once, when it (re)mounts against a new email
   *  channel — see `CustomerInteractionPanelProps.toAddress`'s own doc
   *  comment for where this comes from. */
  defaultTo?: string;
}

/** Extends a selection out to the full line(s) it touches — block actions
 *  (alignment, indent) apply to whole paragraphs, not an arbitrary
 *  mid-line substring, so a partial selection still affects the complete
 *  line(s) it's part of. A collapsed cursor (no selection) affects just
 *  the line it's on. */
function expandToLineRange(value: string, start: number, end: number): { lineStart: number; lineEnd: number } {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const nextNewline = value.indexOf("\n", end);
  const lineEnd = nextNewline === -1 ? value.length : nextNewline;
  return { lineStart, lineEnd };
}

function MessageComposer({
  onSend,
  sendOnEnter = true,
  placeholder = "Type a message…",
  isEmailChannel = false,
  defaultTo,
}: MessageComposerProps) {
  const [value, setValue] = useState("");
  const [showFormatting, setShowFormatting] = useState(false);
  const [showMoreFormatting, setShowMoreFormatting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Email header fields — To/Cc/Bcc, typical email-client pattern: To is
  // always visible (seeded from `defaultTo`, still editable — an agent
  // replying to a different address than the one on file isn't unusual);
  // Cc/Bcc start collapsed behind their own toggle and, once revealed, stay
  // revealed rather than re-collapsing on their own (same one-way "asked
  // for, then stays available" shape `showFormatting` above already uses).
  const [to, setTo] = useState(defaultTo ?? "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Re-seed (and drop any Cc/Bcc left over from a previous email) whenever
  // this composer starts representing a different email — e.g. switching
  // to a different channel/tab, or a different assignment entirely.
  useEffect(() => {
    setTo(defaultTo ?? "");
    setCc("");
    setBcc("");
    setShowCc(false);
    setShowBcc(false);
  }, [defaultTo]);

  // Grow-only: only ever raises the height when content no longer fits, so
  // it never undoes a manual resize-y drag on the next keystroke. Runs as a
  // layout effect (not inside the onChange handler) so it reads the
  // textarea's post-render scrollHeight and applies before paint — no
  // one-frame flash at the old height.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (el.scrollHeight > el.clientHeight) {
      el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
    }
  }, [value]);

  // Alignment/indent are block-level — they restyle whichever whole
  // line(s) the selection touches by rewriting each line's leading
  // metadata (an `[align:x]` marker and/or leading tabs — see
  // `renderFormattedText`'s `parseLine`), rather than inserting/wrapping
  // text at the cursor the way the inline actions below do. Handled as an
  // early branch since the "wrap the selection, then re-select it" flow
  // the inline actions share afterward doesn't apply here.
  const applyBlockFormat = (action: BlockFormatAction, el: HTMLTextAreaElement, selectionStart: number, selectionEnd: number) => {
    const { lineStart, lineEnd } = expandToLineRange(value, selectionStart, selectionEnd);
    const block = value.slice(lineStart, lineEnd);
    const updatedBlock = block
      .split("\n")
      .map((line) => {
        if (action === "indent") return `\t${line}`;
        if (action === "outdent") return line.startsWith("\t") ? line.slice(1) : line;
        // Alignment: strip any existing marker (and leading tabs stay
        // untouched — alignment and indent are independent knobs), then
        // write the new one. "alignLeft" writes nothing back — it's the
        // unmarked default, so choosing it just clears whatever was there.
        const withoutTabs = line.replace(/^\t+/, "");
        const tabs = line.slice(0, line.length - withoutTabs.length);
        const withoutAlign = withoutTabs.replace(ALIGN_MARKER, "");
        const alignKey = action === "alignCenter" ? "center" : action === "alignRight" ? "right" : action === "alignJustify" ? "justify" : null;
        return `${tabs}${alignKey ? `[align:${alignKey}]` : ""}${withoutAlign}`;
      })
      .join("\n");

    const next = value.slice(0, lineStart) + updatedBlock + value.slice(lineEnd);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(lineStart, lineStart + updatedBlock.length);
    });
  };

  const applyFormat = (action: FormatAction) => {
    const el = textareaRef.current;
    if (!el) return;
    const selectionStart = el.selectionStart ?? value.length;
    const selectionEnd = el.selectionEnd ?? value.length;

    if (BLOCK_FORMAT_ACTIONS.has(action)) {
      applyBlockFormat(action as BlockFormatAction, el, selectionStart, selectionEnd);
      return;
    }

    const selected = value.slice(selectionStart, selectionEnd);
    let insertion = selected;
    let cursorOffset = insertion.length;

    switch (action as InlineFormatAction) {
      case "bold":
        insertion = `**${selected || "bold text"}**`;
        break;
      case "italic":
        insertion = `*${selected || "italic text"}*`;
        break;
      case "underline":
        insertion = `__${selected || "underlined text"}__`;
        break;
      case "link":
        insertion = `[${selected || "link text"}](https://)`;
        break;
      case "bulletList":
        insertion = (selected || "List item")
          .split("\n")
          .map((line) => `- ${line}`)
          .join("\n");
        break;
      case "numberedList":
        insertion = (selected || "List item")
          .split("\n")
          .map((line, i) => `${i + 1}. ${line}`)
          .join("\n");
        break;
    }
    cursorOffset = insertion.length;

    const next = value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);
    setValue(next);
    // Selection restore has to wait a frame — the textarea's value hasn't
    // actually updated to `next` yet (React re-renders after this handler
    // returns), so setting the range synchronously here would apply against
    // the *old* value and land in the wrong place.
    requestAnimationFrame(() => {
      el.focus();
      const pos = selectionStart + cursorOffset;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    setShowFormatting(false);
    setShowMoreFormatting(false);
    if (textareaRef.current) textareaRef.current.style.height = `${COMPOSER_MIN_HEIGHT}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (sendOnEnter && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-lyra-border-subtle bg-lyra-bg-surface-base px-6 py-3">
      {isEmailChannel && (
        <div className="mb-2 flex flex-col border-b border-lyra-border-subtle">
          <div className="flex items-center gap-2 border-t border-lyra-border-subtle py-1.5">
            <span className="w-9 shrink-0 lyra-body-sm text-lyra-fg-secondary">To</span>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipients"
              className="min-w-0 flex-1 bg-transparent lyra-body-sm text-lyra-fg-default outline-none placeholder:text-lyra-fg-disabled"
            />
            <div className="flex shrink-0 items-center gap-2.5 pr-1">
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="lyra-body-sm text-lyra-fg-secondary transition-colors hover:text-lyra-fg-default"
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  type="button"
                  onClick={() => setShowBcc(true)}
                  className="lyra-body-sm text-lyra-fg-secondary transition-colors hover:text-lyra-fg-default"
                >
                  Bcc
                </button>
              )}
            </div>
          </div>
          {showCc && (
            <div className="flex items-center gap-2 border-t border-lyra-border-subtle py-1.5">
              <span className="w-9 shrink-0 lyra-body-sm text-lyra-fg-secondary">Cc</span>
              <input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="min-w-0 flex-1 bg-transparent lyra-body-sm text-lyra-fg-default outline-none"
              />
            </div>
          )}
          {showBcc && (
            <div className="flex items-center gap-2 border-t border-lyra-border-subtle py-1.5">
              <span className="w-9 shrink-0 lyra-body-sm text-lyra-fg-secondary">Bcc</span>
              <input
                type="email"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="min-w-0 flex-1 bg-transparent lyra-body-sm text-lyra-fg-default outline-none"
              />
            </div>
          )}
        </div>
      )}
      {showFormatting && (
        <div className="mb-2 flex flex-col gap-1">
          <div className="inline-flex w-fit items-center gap-0.5 rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-canvas p-1">
            {FORMAT_TOOLBAR_PRIMARY.map(({ action, icon: Icon, title }) => (
              <ActionIconButton key={action} size="sm" title={title} onClick={() => applyFormat(action)}>
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </ActionIconButton>
            ))}
            <div className="mx-0.5 h-4 w-px bg-lyra-border-subtle" />
            <ActionIconButton
              size="sm"
              title={showMoreFormatting ? "Fewer formatting options" : "More formatting options"}
              onClick={() => setShowMoreFormatting((v) => !v)}
              className={cn(showMoreFormatting && "bg-lyra-state-hover")}
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", showMoreFormatting && "rotate-180")} strokeWidth={1.5} />
            </ActionIconButton>
          </div>
          {showMoreFormatting && (
            <div className="inline-flex w-fit items-center gap-0.5 rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-canvas p-1">
              {FORMAT_TOOLBAR_SECONDARY.map(({ action, icon: Icon, title }) => (
                <ActionIconButton key={action} size="sm" title={title} onClick={() => applyFormat(action)}>
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </ActionIconButton>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          style={{ height: COMPOSER_MIN_HEIGHT }}
          className="flex-1"
          aria-label={placeholder}
        />
        <div className="flex shrink-0 items-center gap-1 pb-0.5">
          <ActionIconButton
            title="Formatting"
            onClick={() => setShowFormatting((v) => !v)}
            className={cn(showFormatting && "bg-lyra-state-hover")}
          >
            <Type className="h-4 w-4" strokeWidth={1.5} />
          </ActionIconButton>
          <Button variant="default" size="md" onClick={handleSend} disabled={!value.trim()}>
            <Send className="h-4 w-4" strokeWidth={1.5} />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── CustomerInteractionPanel ──
 * The body below InteractionHeader: action bar + message thread, driven
 * entirely by props — the active assignment's data lives in
 * AgentNextGenPage so switching the selected assignment swaps this panel's
 * content. Used to also have a "Customer History" placeholder view here
 * (toggled by an `activeTab` prop) — removed along with InteractionHeader's
 * own Customer History tab, since the Customer Profile panel's Interactions
 * tab covers that now and this one never had real content behind it. */

export interface CustomerInteractionPanelProps {
  messages: Message[];
  /** Same flag InteractionHeader takes — swaps the date stamp's caption
   *  from "Today" to "Today · Call Transcript" AND swaps the thread's own
   *  rendering from lyra-ui's chat-bubble `ConversationMessage` to the
   *  plain-row `VoiceTranscriptThread` (see its own doc comment above) — a
   *  live transcription reads as one continuous record, not a back-and-forth
   *  chat, so it gets a genuinely different layout rather than just a label
   *  change. */
  isVoiceCall?: boolean;
  /** Hold/resume/mute/etc. moments interleaved into the voice transcript.
   *  Ignored when `isVoiceCall` is false. */
  callEvents?: CallTranscriptEvent[];
  /** Company-authored script for this call — when present (and
   *  `isVoiceCall`), shows a "Live Transcript"/"Script" `ToggleGroup` above
   *  the thread so the agent can flip to the pre-written lines without
   *  losing their place (switching back to Live Transcript is one click).
   *  Omitted entirely (not just empty) hides the toggle — most calls have
   *  no script, so there's nothing to choose between. See `CallScriptView`
   *  above for the read-only rendering. */
  script?: CallScriptSection[];
  /** Appends a new outgoing message — omitted (rather than defaulted to a
   *  no-op) hides the composer entirely, e.g. for a read-only view. Voice
   *  calls never show a composer regardless of this prop (see
   *  `isVoiceCall` above) since there's no live call to type into. */
  onSendMessage?: (text: string) => void;
  /** Enter sends (Shift+Enter for a newline) when true; when false Enter
   *  always inserts a newline and sending requires the Send button — email's
   *  convention, since an accidental Enter-to-send would be surprising
   *  there in a way it isn't for chat. Default true. */
  sendOnEnter?: boolean;
  /** Shows the composer's email header (To, with Cc/Bcc toggles — see
   *  `MessageComposer`'s own doc comment) above the reply field. Kept
   *  separate from `sendOnEnter` even though both happen to be true only
   *  for email today — they're different concerns (send convention vs.
   *  which fields render), and a future channel could need one without the
   *  other. */
  isEmailChannel?: boolean;
  /** Seeds the composer's "To" field — the email channel's own recorded
   *  address (see `AssignmentChannel.address` in AgentNextGenPage.tsx),
   *  when there is one. Ignored unless `isEmailChannel` is true. */
  toAddress?: string;
}

export function CustomerInteractionPanel({
  messages,
  isVoiceCall = false,
  callEvents,
  script,
  onSendMessage,
  sendOnEnter = true,
  isEmailChannel = false,
  toAddress,
}: CustomerInteractionPanelProps) {
  const hasScript = isVoiceCall && Boolean(script?.length);
  const [voiceView, setVoiceView] = useState<"live" | "script">("live");
  // CustomerInteractionPanel isn't remounted when the active assignment
  // changes (no `key` at its call site — see AgentNextGenPage.tsx), so this
  // local view choice would otherwise leak from one call into the next.
  // `messages` is a fresh array per assignment, so it doubles as the "which
  // call is this" signal without needing a dedicated id prop just for this.
  useEffect(() => {
    setVoiceView("live");
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-lyra-bg-surface-base">
      {/* ── Message thread ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {hasScript && (
            <div className="flex justify-end">
              <ToggleGroup
                items={[
                  { value: "live", label: "Live Transcript" },
                  { value: "script", label: "Script" },
                ]}
                value={voiceView}
                // ToggleGroup's own single-select mode deselects (empty
                // string) on re-clicking the already-active item — ignored
                // here since this is meant to read as a true segmented
                // control, always exactly one of the two selected.
                onValueChange={(v) => v && setVoiceView(v as "live" | "script")}
              />
            </div>
          )}
          {hasScript && voiceView === "script" ? (
            <CallScriptView sections={script!} />
          ) : (
            <>
              {/* Email skips this — each row already carries its own
               *  timestamp (see EmailThread), so a "Today" divider above the
               *  whole thread would just be redundant, not something a real
               *  inbox thread shows either. */}
              {!isEmailChannel && <ConversationDateStamp label={isVoiceCall ? "Today · Call Transcript" : "Today"} />}
              <TranscriptThread
                messages={messages}
                isVoiceCall={isVoiceCall}
                isEmailChannel={isEmailChannel}
                callEvents={callEvents}
                customerEmail={toAddress}
              />
            </>
          )}
        </div>
      </div>
      {!isVoiceCall && onSendMessage && (
        <MessageComposer
          onSend={onSendMessage}
          sendOnEnter={sendOnEnter}
          isEmailChannel={isEmailChannel}
          defaultTo={toAddress}
        />
      )}
    </div>
  );
}
