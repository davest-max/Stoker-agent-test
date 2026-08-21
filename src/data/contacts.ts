import type { ChannelType } from "@nicecxone/lyra-ui";

/* ── Search Contacts ──
 * Backing data for the "Search Contacts" page (AgentNextGenPage's `contacts`
 * nav destination) — a distinct dataset from `directory.ts`'s
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
    contacts.push({
      id: `contact-${i + 1}`,
      channel,
      direction,
      dateCreated: formatContactDate(created),
      dateCreatedAt: created.getTime(),
      status,
      customerName: pick(CONTACT_NAME_POOL),
      skill: pick(CONTACT_SKILLS),
      assignee: hasAssignee ? pick(CONTACT_ASSIGNEES) : undefined,
      ownerAssignee: hasOwner ? pick(CONTACT_ASSIGNEES) : undefined,
      tags: tags.length ? tags : undefined,
      caseId: `CASE-${40000 + Math.floor(rand() * 9999)}`,
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
