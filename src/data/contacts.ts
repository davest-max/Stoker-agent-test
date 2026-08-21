import type { ChannelType } from "@nicecxone/lyra-ui";
import type { Message, CallTranscriptEvent } from "@/components/CustomerInteractionPanel";

/* ── Interaction Search ──
 * Backing data for the "Interaction Search" page (AgentNextGenPage's
 * `contacts` nav destination) — a distinct dataset from `directory.ts`'s
 * DIRECTORY_CUSTOMERS/DIRECTORY_AGENTS. Those model people (a customer's
 * full CRM profile, an agent's presence); this models CONTACTS — one row
 * per historical interaction across the whole app, any status, not just the
 * ones currently assigned to the signed-in agent. A contact may or may not
 * resolve to a known customer (`customerName` is sometimes a raw
 * system-generated label like "#livechat-02" or "via_spam_email_v2.0.1",
 * same as a real queue shows for not-yet-identified contacts) — that's
 * deliberate, matching the reference screenshot this page is modeled on. */

export type ContactStatus = "New" | "Pending" | "Resolved" | "Escalated" | "Closed";

export type ContactDirection = "inbound" | "outbound";

export interface Contact {
  id: string;
  channel: ChannelType;
  direction: ContactDirection;
  /** Display string, e.g. "06/24/25 7:14 AM" — a plain string (not a real
   *  Date) since nothing here needs to parse or reformat it, same reasoning
   *  as `CustomerInteractionHistoryEntry.date` in directory.ts. */
  dateCreated: string;
  /** Real timestamp backing `dateCreated`, used only for sorting/date-range
   *  filtering — kept separate so the display string can stay exactly the
   *  legacy "MM/DD/YY H:MM AM" format shown in the reference screenshot. */
  dateCreatedAt: number;
  status: ContactStatus;
  /** Either a real customer's name (see directory.ts) or a raw
   *  system-generated label for a not-yet-identified contact. */
  customerName: string;
  skill: string;
  /** Agent name, or undefined for an unassigned contact (shows as "—" in
   *  the table). This is the *inbox* assignee — whoever currently has the
   *  contact in their queue — as distinct from `ownerAssignee` below.
   *  Doubles as the Query Builder's "author" field — see
   *  SearchContactsPage.tsx's own doc comment on why. */
  assignee?: string;
  /** The contact's owning agent — a separate, more permanent assignment
   *  than `assignee`/inbox-assignee (e.g. an owner stays on a case across
   *  re-queues even as the inbox assignee changes). Generated
   *  independently of `assignee`, so the two agree sometimes and differ
   *  other times, same as in a real system. Backs the "Assigned Owner"
   *  filter and the Query Builder's `ownerAssignee` field. */
  ownerAssignee?: string;
  tags?: string[];
  /** Case number — a second, human-facing identifier alongside `id`.
   *  Backs the Query Builder's "Case ID" criterion (see
   *  SearchContactsPage.tsx); `id` itself doubles as "Thread ID"/"Thread ID
   *  (External Platform)" since this mock model doesn't distinguish those
   *  three concepts the way the real backend query grammar does. */
  caseId: string;
  /** Full message/call thread for this interaction — every contact gets
   *  one (per an explicit follow-up: the row-expand accordion on
   *  SearchContactsPage should never dead-end on a "no thread available"
   *  demo record) so every row is actually reviewable. Reuses the exact
   *  `Message`/`CallTranscriptEvent` shape
   *  `CustomerInteractionHistoryEntry.transcript` already uses in
   *  directory.ts, and renders through the same read-only
   *  `TranscriptThread` component — see SearchContactsPage.tsx's
   *  row-expand section. Synthetic/templated (see `generateTranscript`
   *  below), not hand-written per contact — 103 rows is too many to
   *  author individually, so content is assembled from a small bank of
   *  skill-appropriate opener/response lines instead. */
  transcript: {
    messages: Message[];
    /** Voice-only hold/resume events — undefined for every other channel
     *  (and only generated for a minority of voice contacts, same as a
     *  real call log — most calls never go on hold). */
    callEvents?: CallTranscriptEvent[];
  };
}

/** Every skill/team a contact can be queued against — reuses this app's own
 *  DIRECTORY_SKILLS/DIRECTORY_TEAMS names (General Support, VIP Support,
 *  Escalations Team, etc.) plus a couple of legacy-style pool names from
 *  the reference screenshot ("Support Pool") so the Skill filter has enough
 *  variety to actually demonstrate filtering. */
export const CONTACT_SKILLS = [
  "General Support",
  "Technical Support",
  "Billing",
  "VIP Support",
  "Tier 1 Support",
  "Escalations Team",
  "Billing Team",
  "Support Pool",
] as const;

export const CONTACT_ASSIGNEES = ["John Smith", "Amara Okafor", "Diego Fernandez", "Lena Kowalski", "Tomás Ibáñez", "Priya Shah"] as const;

export const CONTACT_STATUSES: ContactStatus[] = ["New", "Pending", "Resolved", "Escalated", "Closed"];

export const CONTACT_TAGS = ["VIP", "Escalation Risk", "Callback Requested", "Spam", "Duplicate", "Billing Dispute"] as const;

export const CONTACT_CHANNELS: ChannelType[] = ["voice", "chat", "email", "sms", "whatsapp"];

/** A handful of real, identified customers (from directory.ts) mixed with
 *  raw not-yet-identified labels — see this module's own doc comment above
 *  for why both kinds show up here. */
const CONTACT_NAME_POOL = [
  "Sofia Martinez",
  "Ray Torres",
  "Priya Nair",
  "Marcus Webb",
  "Jordan Lee",
  "Dominique Simmons-Davis",
  "Yolanda Andrews",
  "Yolanda Lawrence",
  "Yolanda Geneva",
  "Yolanda Sanora",
  "#livechat-02",
  "#livechat-07",
  "#webchat-14",
  "via_spam_email_v2.0.1",
  "via_SPAM_v0.21.2",
  "unknown_caller_4471",
];

/** Small seeded PRNG (mulberry32) — deterministic so the generated dataset
 *  doesn't reshuffle on every reload/build, same reasoning most seed-data
 *  generators use a fixed seed. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(48213);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

/* ── Synthetic transcript generation ──
 * See `Contact.transcript`'s own doc comment for why this is templated
 * rather than hand-authored. Loosely topical (an opener drawn from a
 * skill-appropriate bucket, a resolution line drawn from a status-
 * appropriate bucket) so threads read as plausible for the row they're
 * attached to, without needing 103 bespoke conversations. */

type SkillBucket = "billing" | "technical" | "vip" | "escalation" | "general";

function skillBucket(skill: string): SkillBucket {
  if (skill === "Billing" || skill === "Billing Team") return "billing";
  if (skill === "Technical Support" || skill === "Tier 1 Support") return "technical";
  if (skill === "VIP Support") return "vip";
  if (skill === "Escalations Team") return "escalation";
  return "general";
}

const OPENERS: Record<SkillBucket, string[]> = {
  billing: [
    "Hi, I was charged twice on my last invoice and I'm not sure why.",
    "I need help understanding a charge on my account.",
    "Can someone walk me through my current billing cycle?",
    "I'd like to update my payment method before the next renewal.",
  ],
  technical: [
    "The app keeps crashing every time I try to log in.",
    "I'm getting an error message I don't understand.",
    "My integration stopped syncing yesterday and I can't figure out why.",
    "Something's broken on my end and I need it fixed today.",
  ],
  vip: [
    "Hi, I wanted a status update on the request I sent over last week.",
    "Can you make sure this gets handled quickly? It's time-sensitive.",
    "I'd like to speak with someone about my account directly.",
  ],
  escalation: [
    "I've contacted support about this twice already with no resolution.",
    "This is my third time reaching out about the same issue.",
    "I need to speak with a supervisor about how this has been handled.",
  ],
  general: [
    "Hi, I have a quick question about my account.",
    "I need some help with something.",
    "Can you help me with an issue I'm having?",
    "I wanted to follow up on something from earlier.",
  ],
};

const OUTBOUND_OPENERS = [
  "Hi, following up on your recent request — do you have a moment?",
  "Reaching out to check in on your account.",
  "Hi, I wanted to give you an update on your case.",
];

const OUTBOUND_CUSTOMER_REPLIES = [
  "Yes, go ahead.",
  "Sure, what's up?",
  "Thanks for reaching out — what do you have?",
];

const ACK_LINES = [
  "Thanks for reaching out — let me take a look at that for you.",
  "I appreciate you flagging this. Give me just a moment to check.",
  "Happy to help with that. Let me pull up your account.",
  "Sorry for the trouble — let's get this sorted out.",
];

const FOLLOWUP_LINES = [
  "Okay, thank you. How long do you think that will take?",
  "Got it, that makes sense. What's the next step?",
  "I appreciate the quick response.",
  "Sure, here's some more detail on what happened.",
];

const CLARIFYING_QUESTIONS = [
  "Just to confirm, when did you first notice this happening?",
  "Can you tell me a bit more about what you were doing when this occurred?",
  "Do you have the account or order number handy so I can pull that up?",
  "Is this happening every time, or only occasionally?",
];

const CUSTOMER_DETAILS = [
  "It started yesterday afternoon, out of nowhere.",
  "I was just trying to log in like normal when it happened.",
  "Sure, let me grab that for you — one second.",
  "It happens pretty much every time I try now.",
];

const WORKING_LINES = [
  "Thanks, that helps. Let me dig into this a bit further.",
  "Okay, I see what's going on here — give me just a moment.",
  "Got it, I'm pulling up the details on our end now.",
  "Thanks for confirming. Let me check a couple of things.",
];

const CLOSING_THANKS = [
  "Thank you so much for your help with this.",
  "I really appreciate you taking care of it.",
  "Perfect, thanks again for the quick turnaround.",
  "Great, thank you!",
];

const RESOLUTION_LINES: Partial<Record<ContactStatus, string[]>> = {
  Resolved: [
    "I've gone ahead and taken care of that for you — you're all set.",
    "That's fixed on our end now. Let me know if anything else comes up.",
  ],
  Closed: [
    "This has been resolved and I'm closing out the case on our end.",
    "Glad we could get this sorted — closing this out now.",
  ],
  Escalated: [
    "I'm going to loop in our specialist team to take a closer look at this.",
    "I've escalated this to get you a faster resolution.",
  ],
  Pending: [
    "I'll need to check on that internally and follow up with you shortly.",
    "Let me confirm a few details on our end and I'll circle back.",
  ],
  // "New" intentionally has no resolution bank — the thread just ends
  // after the opening exchange, since nothing's been worked yet.
};

function formatRelativeAgo(daysAgo: number): string {
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "1 day ago";
  if (daysAgo < 14) return `${daysAgo} days ago`;
  const weeks = Math.round(daysAgo / 7);
  if (weeks < 9) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.max(1, Math.round(daysAgo / 30));
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function formatClockTime(date: Date): string {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function generateTranscript(
  channel: ChannelType,
  direction: ContactDirection,
  status: ContactStatus,
  skill: string,
  customerName: string,
  assignee: string | undefined,
  created: Date,
  daysAgo: number
): Contact["transcript"] {
  const agentName = assignee ?? "Support Agent";
  const messages: Message[] = [];
  let minuteOffset = 0;
  // Each message lands a few minutes after the last, same day as `created`
  // — real relative-time strings ("3 weeks ago, 9:12 AM") like
  // directory.ts's own example transcripts use, not the table's own
  // "MM/DD/YY H:MM AM" display format.
  const nextTimestamp = () => {
    minuteOffset += 2 + Math.floor(rand() * 6);
    const t = new Date(created.getTime() + minuteOffset * 60 * 1000);
    return `${formatRelativeAgo(daysAgo)}, ${formatClockTime(t)}`;
  };
  let msgId = 0;
  const push = (variant: Message["variant"], text: string) => {
    msgId += 1;
    messages.push({
      id: `m${msgId}`,
      variant,
      senderName: variant === "customer" ? customerName : agentName,
      text,
      timestamp: nextTimestamp(),
    });
  };

  const resolutionPool = RESOLUTION_LINES[status];
  const resolution = resolutionPool ? pick(resolutionPool) : undefined;

  // Longer than a minimal 2-3 line exchange on purpose — per an explicit
  // follow-up, the accordion's fixed-height thread pane (see
  // SearchContactsPage.tsx) needs enough real content to actually justify
  // its size and require scrolling, not just a couple of short bubbles
  // floating in a mostly-empty box. A full arc (opener → ack → clarifying
  // question → answer → working → resolution → closing thanks) runs
  // 6-8 messages instead of 2-4.
  if (direction === "inbound") {
    push("customer", pick(OPENERS[skillBucket(skill)]));
    push("support-agent", pick(ACK_LINES));
    push("support-agent", pick(CLARIFYING_QUESTIONS));
    push("customer", pick(CUSTOMER_DETAILS));
    push("support-agent", pick(WORKING_LINES));
    // Email threads can read fine a touch shorter (EmailThread auto-
    // collapses every row but the last anyway) — skip the follow-up
    // sometimes so not every email is a uniform length.
    if (channel !== "email" || rand() < 0.7) push("customer", pick(FOLLOWUP_LINES));
    if (resolution) {
      push("support-agent", resolution);
      if (rand() < 0.6) push("customer", pick(CLOSING_THANKS));
    }
  } else {
    push("support-agent", pick(OUTBOUND_OPENERS));
    push("customer", pick(OUTBOUND_CUSTOMER_REPLIES));
    push("support-agent", pick(CLARIFYING_QUESTIONS));
    push("customer", pick(CUSTOMER_DETAILS));
    push("support-agent", pick(WORKING_LINES));
    if (resolution) {
      push("support-agent", resolution);
      if (rand() < 0.6) push("customer", pick(CLOSING_THANKS));
    }
  }

  // Hold/resume — voice only, and only a minority of calls, matching a
  // real call log (most calls never go on hold).
  let callEvents: CallTranscriptEvent[] | undefined;
  if (channel === "voice" && messages.length >= 2 && rand() < 0.3) {
    const anchor = messages[Math.floor(messages.length / 2)];
    callEvents = [
      { id: `evt-${anchor.id}-hold`, afterMessageId: anchor.id, kind: "hold", label: "Placed on hold", timestamp: nextTimestamp() },
      { id: `evt-${anchor.id}-resume`, afterMessageId: anchor.id, kind: "resume", label: "Resumed from hold", timestamp: nextTimestamp() },
    ];
  }

  return { messages, callEvents };
}

function generateContacts(count: number): Contact[] {
  const contacts: Contact[] = [];
  const now = new Date("2025-06-24T09:00:00");
  for (let i = 0; i < count; i++) {
    const channel = pick(CONTACT_CHANNELS);
    const direction: ContactDirection = rand() < 0.55 ? "inbound" : "outbound";
    const status = pick(CONTACT_STATUSES);
    // Older contacts skew toward Resolved/Closed, newer ones toward
    // New/Pending — a flat random status on every row read as unrealistic
    // (a two-month-old contact still sitting "New" doesn't happen in
    // practice), so bias it a little rather than leaving it pure noise.
    const daysAgo = status === "New" || status === "Pending" ? Math.floor(rand() * 2) : Math.floor(rand() * 60);
    const created = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.floor(rand() * 12 * 60 * 60 * 1000));
    const hasAssignee = status !== "New" || rand() < 0.3;
    // Independent of `hasAssignee`/`assignee` — an owner is a separate,
    // longer-lived assignment (see the `ownerAssignee` field doc comment),
    // so it's drawn on its own rather than mirroring the inbox assignee.
    const hasOwner = status !== "New" || rand() < 0.4;
    const tagCount = rand() < 0.7 ? 0 : rand() < 0.9 ? 1 : 2;
    const tags = Array.from(new Set(Array.from({ length: tagCount }, () => pick(CONTACT_TAGS))));
    const customerName = pick(CONTACT_NAME_POOL);
    const skill = pick(CONTACT_SKILLS);
    const assignee = hasAssignee ? pick(CONTACT_ASSIGNEES) : undefined;
    contacts.push({
      id: `contact-${i + 1}`,
      channel,
      direction,
      dateCreated: formatContactDate(created),
      dateCreatedAt: created.getTime(),
      status,
      customerName,
      skill,
      assignee,
      ownerAssignee: hasOwner ? pick(CONTACT_ASSIGNEES) : undefined,
      tags: tags.length ? tags : undefined,
      caseId: `CASE-${40000 + Math.floor(rand() * 9999)}`,
      transcript: generateTranscript(channel, direction, status, skill, customerName, assignee, created, daysAgo),
    });
  }
  // Newest first — matches how a real contact search's default sort reads.
  return contacts.sort((a, b) => b.dateCreatedAt - a.dateCreatedAt);
}

function formatContactDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${mm}/${dd}/${yy} ${hours}:${minutes} ${ampm}`;
}

/** 103 to match the reference screenshot's own "51-100 of 103" footer. */
export const CONTACTS: Contact[] = generateContacts(103);
