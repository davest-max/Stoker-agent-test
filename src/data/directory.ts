import { CHANNEL_ACCENT, type AgentStatus, type ChannelType, type CreateNewOutboundContact, type CreateNewOutboundGroup } from "@nicecxone/lyra-ui";
import type { Message, CallTranscriptEvent } from "@/components/CustomerInteractionPanel";

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

/** One past, closed interaction — same shape `lastInteraction` below already
 *  uses for its single most-recent entry, just plural. Backs both the
 *  Customer Profile panel's "History" tab (a plain chronological list) and
 *  its "Interactions" tab (the same records, grouped by channel instead —
 *  see CustomerSnapshotPanel.tsx's own doc comment on why these two tabs
 *  intentionally share one data source rather than needing two). */
export interface CustomerInteractionHistoryEntry {
  date: string;
  channel: ChannelType;
  summary: string;
  caseId?: string;
  handledBy?: string;
  outcome?: string;
  /** The actual conversation behind `summary` — lets the Customer Profile
   *  panel's Interactions tab expand a past interaction into its real
   *  chat/email/voice transcript instead of just the one-line recap, using
   *  the exact same `TranscriptThread` renderer the live interaction panel
   *  does (see CustomerInteractionPanel.tsx). Optional: an entry with no
   *  `transcript` still shows in History/Interactions, just without
   *  anything to expand into. `callEvents` only ever applies to a `channel:
   *  "voice"` entry, same as `AssignmentChannel.callEvents` in
   *  AgentNextGenPage.tsx. */
  transcript?: {
    messages: Message[];
    callEvents?: CallTranscriptEvent[];
  };
}

/** A support ticket on this customer's record — a new concept this app
 *  hasn't modeled before (unlike history/notes, there's no existing ticket
 *  system anywhere else to reuse), so this is placeholder seed data rather
 *  than derived from something already tracked. */
export interface CustomerTicket {
  id: string;
  subject: string;
  status: "Open" | "Pending" | "Resolved";
  caseId: string;
  date: string;
}

export interface DirectoryCustomer extends CreateNewOutboundContact {
  /** Year the customer relationship started — one line item among the
   *  Overview tab's CRM-style field list below (company/address/language/
   *  timezone/accountOwner/accountStatus), not its own separate caption
   *  the way it used to render. */
  customerSince?: string;
  tier?: "VIP" | "Standard";
  /** Total interactions on record — a quick sense of how often they reach out. */
  totalInteractions?: number;
  /** Full mailing address on file — one of the "typical CRM contact card"
   *  fields (Salesforce Contact/Account, etc.) the Overview tab now
   *  surfaces. A single string (street, city, state, zip) rather than a
   *  structured address object — nothing else in this app needs to parse
   *  or edit the pieces individually. */
  address?: string;
  /** Company/account name — populated for a contact that reads as
   *  business-related (e.g. has a work email domain); left blank for a
   *  purely personal account, same as a real CRM contact card shows
   *  nothing here rather than a placeholder. */
  company?: string;
  /** Preferred language — standard CRM contact field, shown alongside
   *  `timezone` below. */
  language?: string;
  /** Display string (e.g. "America/Chicago (CST)") — shown as-is next to
   *  `language`, never parsed. */
  timezone?: string;
  /** Internal rep this account is assigned to — distinct from `handledBy`
   *  on a `CustomerInteractionHistoryEntry` (whoever worked one specific
   *  past interaction); this is the account-level owner, the same
   *  "assigned agent" concept a Salesforce Account/Contact carries. */
  accountOwner?: string;
  /** Simple CRM-style account status pill. */
  accountStatus?: "Active" | "Inactive";
  /** Most recent interaction BEFORE whichever one is currently open — a
   *  callback for context, not a recap of the live conversation. Shown on
   *  the Customer Profile panel's "Overview" tab specifically — the
   *  History/Interactions tabs use `history` below instead, which is the
   *  fuller list this is itself drawn from (typically `history[0]`). */
  lastInteraction?: CustomerInteractionHistoryEntry;
  /** Full past-interaction list — "History"/"Interactions" tabs. Optional:
   *  a customer with only `lastInteraction` and no `history` array just
   *  shows that one entry and nothing more (e.g. a newer customer). */
  history?: CustomerInteractionHistoryEntry[];
  /** "Tickets" tab — see `CustomerTicket`'s own doc comment. */
  tickets?: CustomerTicket[];
  /** Seed notes — copied into AgentNextGenPage's own live state on mount so
   *  adding a note doesn't mutate this module-level constant. Newest-first
   *  (see `handleAddCustomerNote`'s prepend) — the Overview tab surfaces
   *  `notes[0]` under "Latest Note" as the closest thing this app has to an
   *  AI-generated customer summary, rather than a separate field. */
  notes?: CustomerNote[];
}

export interface DirectoryAgent extends CreateNewOutboundContact {
  /** Reuses lyra-ui's own `AgentStatus` (the same type/labels its
   *  `AgentProfile` status menu uses: Available/Unavailable/Offline) rather
   *  than inventing a parallel enum — New Outbound's contact rows show it
   *  as a small corner dot on the avatar, same idiom `AgentProfile` itself
   *  already uses (see that component's own `StatusIcon`/`Avatar`). */
  availability: AgentStatus;
}

export interface DirectorySkill {
  id: string;
  name: string;
  description?: string;
  /** Routing channel this skill queues on — drives the row's leading icon
   *  color via CHANNEL_ACCENT[channelType]. */
  channelType: ChannelType;
  memberAgentIds: string[];
  /** A skill/queue's own availability — per an explicit follow-up asking
   *  for availability on skills too, not just agents. Same three-value
   *  status as `DirectoryAgent.availability`, set independently here rather
   *  than derived from member agents' own statuses (this app has no live
   *  queue/routing engine to compute that from). */
  availability: AgentStatus;
}

export interface DirectoryTeam {
  id: string;
  name: string;
  description?: string;
  memberAgentIds: string[];
  /** Which member is this team's supervisor — surfaced in New Outbound's
   *  "My Team" group (see `OUTBOUND_MY_TEAM_CONTACTS` below), which shows
   *  the logged-in agent's own teammates with the supervisor denoted.
   *  Must be one of `memberAgentIds`. */
  supervisorAgentId?: string;
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
    // Includes every channel type the New Outbound flyout can show
    // (CONTACT_CHANNEL_ORDER in DirectoryPage.tsx: voice/email/chat/
    // whatsapp) — per an explicit follow-up, the favorited customer should
    // demonstrate all of them at once rather than the usual 3-of-4 mix
    // every other customer record has.
    channels: ["voice", "sms", "email", "chat", "whatsapp"],
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
    address: "482 Willow Creek Dr, Austin, TX 78704",
    company: "Northstar Co.",
    language: "English",
    timezone: "America/Chicago (CST)",
    accountOwner: "Amara Okafor",
    accountStatus: "Active",
    lastInteraction: {
      date: "3 weeks ago",
      channel: "email",
      summary: "Asked about upgrading her plan to the Pro tier for additional storage. Walked her through the upgrade flow and confirmed the new billing amount.",
      caseId: "CASE-47821",
      handledBy: "Amara Okafor",
      outcome: "Resolved",
    },
    history: [
      {
        date: "3 weeks ago",
        channel: "email",
        summary: "Asked about upgrading her plan to the Pro tier for additional storage. Walked her through the upgrade flow and confirmed the new billing amount.",
        caseId: "CASE-47821",
        handledBy: "Amara Okafor",
        outcome: "Resolved",
        transcript: {
          messages: [
            { id: "m1", variant: "customer", senderName: "Sofia Martinez", text: "Hi, I'd like to upgrade to the Pro tier for more storage. Can you tell me the cost difference?", timestamp: "3 weeks ago, 9:12 AM" },
            { id: "m2", variant: "support-agent", senderName: "Amara Okafor", text: "Hi Sofia, happy to help! Pro adds 500GB and runs $12/mo more than your current plan. Want me to apply the upgrade now?", timestamp: "3 weeks ago, 9:47 AM" },
            { id: "m3", variant: "customer", senderName: "Sofia Martinez", text: "Yes please, that works for me.", timestamp: "3 weeks ago, 10:02 AM" },
            { id: "m4", variant: "support-agent", senderName: "Amara Okafor", text: "All set — you're on Pro now, and the new amount will show on your next billing cycle. Let me know if anything looks off!", timestamp: "3 weeks ago, 10:05 AM" },
          ],
        },
      },
      {
        date: "6 weeks ago",
        channel: "chat",
        summary: "Couldn't find where to download an old invoice for expensing. Pointed her to Billing → History.",
        caseId: "CASE-46988",
        handledBy: "John Smith",
        outcome: "Resolved",
        transcript: {
          messages: [
            { id: "m1", variant: "customer", senderName: "Sofia Martinez", text: "Hey, I'm trying to download an old invoice for an expense report but I can't find it anywhere.", timestamp: "6 weeks ago, 2:14 PM" },
            { id: "m2", variant: "support-agent", senderName: "John Smith", text: "No problem — head to Billing → History and you'll see a download icon next to every past invoice.", timestamp: "6 weeks ago, 2:16 PM" },
            { id: "m3", variant: "customer", senderName: "Sofia Martinez", text: "Found it, thank you!", timestamp: "6 weeks ago, 2:17 PM" },
          ],
        },
      },
      {
        date: "2 months ago",
        channel: "voice",
        summary: "Called in a panic after a large expense report failed to submit before a deadline — walked through a manual workaround while the app issue was filed.",
        caseId: "CASE-46512",
        handledBy: "Diego Fernandez",
        outcome: "Resolved",
        transcript: {
          messages: [
            { id: "m1", variant: "customer", senderName: "Sofia Martinez", text: "Hi, I'm so sorry to call in a panic but my expense report won't submit and it's due in twenty minutes!", timestamp: "2 months ago, 4:02 PM" },
            { id: "m2", variant: "support-agent", senderName: "Diego Fernandez", text: "Take a breath, we'll get this sorted. What error do you see when you hit submit?", timestamp: "2 months ago, 4:03 PM" },
            { id: "m3", variant: "customer", senderName: "Sofia Martinez", text: "It just says \"Something went wrong\" with no other details.", timestamp: "2 months ago, 4:07 PM" },
            { id: "m4", variant: "support-agent", senderName: "Diego Fernandez", text: "That's a known issue we're tracking. Let's export the report as a PDF and email it to your manager directly so you don't miss the deadline.", timestamp: "2 months ago, 4:08 PM" },
            { id: "m5", variant: "customer", senderName: "Sofia Martinez", text: "Okay, doing that now… it worked, thank you so much.", timestamp: "2 months ago, 4:11 PM" },
          ],
          callEvents: [
            { id: "e1", afterMessageId: "m2", kind: "hold", label: "Call held", timestamp: "2 months ago, 4:04 PM" },
            { id: "e2", afterMessageId: "m2", kind: "resume", label: "Call resumed", timestamp: "2 months ago, 4:06 PM" },
          ],
        },
      },
    ],
    tickets: [
      { id: "t1", subject: "Receipt photo upload crashes app", status: "Open", caseId: "CASE-48213", date: "Today" },
      { id: "t2", subject: "Large images fail to attach on 4.2.1", status: "Pending", caseId: "CASE-46512", date: "2 months ago" },
    ],
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
    id: "jordan",
    name: "Jordan Lee",
    initials: "JL",
    subtitle: "CST-10145",
    kind: "customer",
    avatarClassName: "bg-lyra-accent-lime-soft text-lyra-accent-lime-strong",
    // A second customer with every channel type the New Outbound flyout can
    // show (voice/email/chat/whatsapp — same reasoning as Sofia's own
    // `channels` above) — per an explicit follow-up, favorited right below
    // her so Favorites demonstrates this on more than just one contact.
    channels: ["voice", "sms", "email", "chat", "whatsapp"],
    // Two labeled numbers (not just one) — per an explicit follow-up, this
    // is the demo case for the "Select Phone" dropdown actually appearing as
    // a real dropdown (a contact with only one number/address on file gets
    // a plain read-only field instead — see OutboundDetailScreen's own
    // `addressOptions.length <= 1` branch in NewOutboundPopover.tsx).
    phoneNumbers: [
      { value: "+15557734410", label: "Mobile · (555) 773-4410" },
      { value: "+15557732298", label: "Home · (555) 773-2298" },
    ],
    emailAddresses: [{ value: "jordan.lee@brightloop.io", label: "Work · jordan.lee@brightloop.io" }],
    customerSince: "2023",
    tier: "Standard",
    totalInteractions: 4,
    address: "58 Prospect Ave, Portland, OR 97205",
    company: "Brightloop",
    language: "English",
    timezone: "America/Los_Angeles (PST)",
    accountOwner: "Tomas Rivera",
    accountStatus: "Active",
    lastInteraction: {
      date: "1 week ago",
      channel: "chat",
      summary: "Asked how to switch her team's billing contact to a new admin. Walked her through the account settings change and confirmed the new contact received the invoice.",
      caseId: "CASE-48630",
      handledBy: "Amara Okafor",
      outcome: "Resolved",
    },
    history: [
      {
        date: "1 week ago",
        channel: "chat",
        summary: "Asked how to switch her team's billing contact to a new admin. Walked her through the account settings change and confirmed the new contact received the invoice.",
        caseId: "CASE-48630",
        handledBy: "Amara Okafor",
        outcome: "Resolved",
        transcript: {
          messages: [
            { id: "m1", variant: "customer", senderName: "Jordan Lee", text: "Hi, our billing admin left the company — how do I switch invoices over to a new contact?", timestamp: "1 week ago, 1:04 PM" },
            { id: "m2", variant: "support-agent", senderName: "Amara Okafor", text: "No problem — head to Settings → Billing → Contacts and add the new admin's email, then you can remove the old one.", timestamp: "1 week ago, 1:06 PM" },
            { id: "m3", variant: "customer", senderName: "Jordan Lee", text: "Done, thanks!", timestamp: "1 week ago, 1:09 PM" },
          ],
        },
      },
    ],
    tickets: [],
    notes: [],
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
    address: "119 Harbor View Rd, Tampa, FL 33602",
    language: "English",
    timezone: "America/New_York (EST)",
    accountOwner: "John Smith",
    accountStatus: "Active",
    lastInteraction: {
      date: "1 month ago",
      channel: "voice",
      summary: "Called about a failed payment on his subscription renewal. Diagnosed an expired card on file, updated it, and reprocessed the charge successfully.",
      caseId: "CASE-46390",
      handledBy: "John Smith",
      outcome: "Resolved",
    },
    history: [
      {
        date: "1 month ago",
        channel: "voice",
        summary: "Called about a failed payment on his subscription renewal. Diagnosed an expired card on file, updated it, and reprocessed the charge successfully.",
        caseId: "CASE-46390",
        handledBy: "John Smith",
        outcome: "Resolved",
        transcript: {
          messages: [
            { id: "m1", variant: "customer", senderName: "Ray Torres", text: "Hi, my subscription renewal payment failed and I'm not sure why — my card should still be good.", timestamp: "1 month ago, 11:20 AM" },
            { id: "m2", variant: "support-agent", senderName: "John Smith", text: "Let's take a look — I'm seeing the card on file expired last month. Do you have an updated card handy?", timestamp: "1 month ago, 11:21 AM" },
            { id: "m3", variant: "customer", senderName: "Ray Torres", text: "Yeah, one sec… okay, it's a Visa ending in 4471, expires 03/27.", timestamp: "1 month ago, 11:23 AM" },
            { id: "m4", variant: "support-agent", senderName: "John Smith", text: "Got it, updated. I've reprocessed the renewal charge and it went through successfully.", timestamp: "1 month ago, 11:25 AM" },
            { id: "m5", variant: "customer", senderName: "Ray Torres", text: "Perfect, thank you for the quick fix.", timestamp: "1 month ago, 11:25 AM" },
          ],
        },
      },
      {
        date: "3 months ago",
        channel: "sms",
        summary: "Texted asking why his renewal date moved up a week. Explained the mid-cycle plan change was the cause.",
        caseId: "CASE-45021",
        handledBy: "Amara Okafor",
        outcome: "Resolved",
        transcript: {
          messages: [
            { id: "m1", variant: "customer", senderName: "Ray Torres", text: "Hey, why did my renewal date move up a week? Wasn't expecting that.", timestamp: "3 months ago, 1:05 PM" },
            { id: "m2", variant: "support-agent", senderName: "Amara Okafor", text: "Good catch — that shifted because of the plan change you made mid-cycle. Your next renewal lands back on the original date after this one.", timestamp: "3 months ago, 1:19 PM" },
            { id: "m3", variant: "customer", senderName: "Ray Torres", text: "Ah, that makes sense. Thanks for clearing it up.", timestamp: "3 months ago, 1:20 PM" },
          ],
        },
      },
    ],
    tickets: [
      { id: "t1", subject: "Duplicate subscription charge", status: "Open", caseId: "CASE-48097", date: "Today" },
    ],
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
    phoneNumbers: [{ value: "+14565559981", label: "Mobile · (456) 555-9981" }],
    emailAddresses: [
      { value: "priya.nair@vantiq.io", label: "Work · priya.nair@vantiq.io" },
      { value: "priya.nair@gmail.com", label: "Personal · priya.nair@gmail.com" },
    ],
    customerSince: "2021",
    tier: "Standard",
    totalInteractions: 3,
    address: "27 Cedar Grove Ln, Seattle, WA 98109",
    company: "Vantiq",
    language: "English",
    timezone: "America/Los_Angeles (PST)",
    accountOwner: "Diego Fernandez",
    accountStatus: "Active",
    lastInteraction: {
      date: "2 months ago",
      channel: "voice",
      summary: "Asked how to add a second user to her account. Walked her through the multi-user settings and confirmed the invite was sent.",
      caseId: "CASE-44215",
      handledBy: "Diego Fernandez",
      outcome: "Resolved",
    },
    history: [
      {
        date: "2 months ago",
        channel: "voice",
        summary: "Asked how to add a second user to her account. Walked her through the multi-user settings and confirmed the invite was sent.",
        caseId: "CASE-44215",
        handledBy: "Diego Fernandez",
        outcome: "Resolved",
        transcript: {
          messages: [
            { id: "m1", variant: "customer", senderName: "Priya Nair", text: "Hi, I want to add a second user to my account so my coworker can access it too. How do I do that?", timestamp: "2 months ago, 3:30 PM" },
            { id: "m2", variant: "support-agent", senderName: "Diego Fernandez", text: "Sure thing — go to Settings → Users → Invite and enter their email. I can also send it for you right now if you'd like.", timestamp: "2 months ago, 3:31 PM" },
            { id: "m3", variant: "customer", senderName: "Priya Nair", text: "Yes please, go ahead.", timestamp: "2 months ago, 3:32 PM" },
            { id: "m4", variant: "support-agent", senderName: "Diego Fernandez", text: "Done — invite sent. They'll just need to accept it to get access.", timestamp: "2 months ago, 3:34 PM" },
          ],
        },
      },
    ],
    tickets: [
      { id: "t1", subject: "Duplicate order confirmation text", status: "Resolved", caseId: "CASE-48462", date: "Today" },
    ],
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
    address: "804 Elm Terrace, Denver, CO 80203",
    language: "English",
    timezone: "America/Denver (MST)",
    accountOwner: "John Smith",
    accountStatus: "Active",
    lastInteraction: {
      date: "2 weeks ago",
      channel: "whatsapp",
      summary: "Reported a late shipment that hadn't arrived. Filed a lost-package claim with the carrier and sent a replacement at no cost.",
      caseId: "CASE-48044",
      handledBy: "John Smith",
      outcome: "Resolved",
    },
    history: [
      {
        date: "2 weeks ago",
        channel: "whatsapp",
        summary: "Reported a late shipment that hadn't arrived. Filed a lost-package claim with the carrier and sent a replacement at no cost.",
        caseId: "CASE-48044",
        handledBy: "John Smith",
        outcome: "Resolved",
        transcript: {
          messages: [
            { id: "m1", variant: "customer", senderName: "Marcus Webb", text: "Hi, my package still hasn't arrived and it's over a week past the delivery date. Can you check on it?", timestamp: "2 weeks ago, 10:02 AM" },
            { id: "m2", variant: "support-agent", senderName: "John Smith", text: "Sorry about that, Marcus — the carrier shows it lost in transit. I've filed a claim and I'm sending you a free replacement.", timestamp: "2 weeks ago, 10:15 AM" },
            { id: "m3", variant: "customer", senderName: "Marcus Webb", text: "Oh wow, thank you, I appreciate that.", timestamp: "2 weeks ago, 10:16 AM" },
            { id: "m4", variant: "support-agent", senderName: "John Smith", text: "Of course — you'll get a shipping confirmation for the replacement within the day.", timestamp: "2 weeks ago, 10:17 AM" },
          ],
        },
      },
    ],
    tickets: [],
    notes: [],
  },
];

/** Extra agents beyond the original six — added per an explicit follow-up
 *  sizing requirement: My Team (Tier 1 Support) needs exactly 12 members,
 *  and every skill needs 6-20. The first 8 below join Tier 1 (bringing it
 *  to 12 alongside John/Amara/Tomás/Priya above); the rest are skill-only
 *  — staffing one or more skills without also being one of John's own
 *  teammates, so the skill rosters read as their own varied pool rather
 *  than just "the whole team again" under a different label. See
 *  `DIRECTORY_TEAMS`/`DIRECTORY_SKILLS` below for exactly who's on what. */
const EXTRA_DIRECTORY_AGENTS: DirectoryAgent[] = [
  // Tier 1 Support teammates (8) — with John/Amara/Tomás/Priya, brings the
  // team to 12.
  { id: "naomi-chen", name: "Naomi Chen", initials: "NC", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-green-soft text-lyra-accent-green-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140101", label: "Direct · (555) 814-0101" }], availability: "available" },
  { id: "carlos-reyes", name: "Carlos Reyes", initials: "CR", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-orange-soft text-lyra-accent-orange-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140102", label: "Direct · (555) 814-0102" }], availability: "available" },
  { id: "grace-kim", name: "Grace Kim", initials: "GK", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-red-soft text-lyra-accent-red-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140103", label: "Direct · (555) 814-0103" }], availability: "unavailable" },
  { id: "owen-bailey", name: "Owen Bailey", initials: "OB", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-yellow-soft text-lyra-accent-yellow-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140104", label: "Direct · (555) 814-0104" }], availability: "available" },
  { id: "fatima-haidari", name: "Fatima Haidari", initials: "FH", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-purple-soft text-lyra-accent-purple-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140105", label: "Direct · (555) 814-0105" }], availability: "offline" },
  { id: "marcus-chen", name: "Marcus Chen", initials: "MC", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-teal-soft text-lyra-accent-teal-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140106", label: "Direct · (555) 814-0106" }], availability: "available" },
  { id: "sofia-delgado", name: "Sofia Delgado", initials: "SD", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-pink-soft text-lyra-accent-pink-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140107", label: "Direct · (555) 814-0107" }], availability: "unavailable" },
  { id: "ibrahim-yusuf", name: "Ibrahim Yusuf", initials: "IY", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-slate-soft text-lyra-accent-slate-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140108", label: "Direct · (555) 814-0108" }], availability: "offline" },
  // Skill-only agents (9) — not on Tier 1, staff one or more skills below.
  { id: "isabel-ortiz", name: "Isabel Ortiz", initials: "IO", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-blue-soft text-lyra-accent-blue-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140109", label: "Direct · (555) 814-0109" }], availability: "available" },
  { id: "malik-davis", name: "Malik Davis", initials: "MD", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-lime-soft text-lyra-accent-lime-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140110", label: "Direct · (555) 814-0110" }], availability: "available" },
  { id: "sana-verma", name: "Sana Verma", initials: "SV", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-orange-soft text-lyra-accent-orange-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140111", label: "Direct · (555) 814-0111" }], availability: "unavailable" },
  { id: "theo-laurent", name: "Théo Laurent", initials: "TL", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-green-soft text-lyra-accent-green-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140112", label: "Direct · (555) 814-0112" }], availability: "available" },
  { id: "renee-dupont", name: "Renee Dupont", initials: "RD", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-red-soft text-lyra-accent-red-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140113", label: "Direct · (555) 814-0113" }], availability: "offline" },
  { id: "hiro-tanaka", name: "Hiro Tanaka", initials: "HT", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-yellow-soft text-lyra-accent-yellow-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140114", label: "Direct · (555) 814-0114" }], availability: "available" },
  { id: "aisha-bello", name: "Aisha Bello", initials: "AB", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-purple-soft text-lyra-accent-purple-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140115", label: "Direct · (555) 814-0115" }], availability: "unavailable" },
  { id: "ben-whitfield", name: "Ben Whitfield", initials: "BW", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-teal-soft text-lyra-accent-teal-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140116", label: "Direct · (555) 814-0116" }], availability: "available" },
  { id: "noah-fischer", name: "Noah Fischer", initials: "NF", subtitle: "Support Agent", kind: "agent", avatarClassName: "bg-lyra-accent-pink-soft text-lyra-accent-pink-strong", channels: ["chat", "voice"], phoneNumbers: [{ value: "+15558140117", label: "Direct · (555) 814-0117" }], availability: "offline" },
];

export const DIRECTORY_AGENTS: DirectoryAgent[] = [
  {
    id: "john-smith",
    name: "John Smith",
    initials: "JS",
    subtitle: "Support Agent",
    kind: "agent",
    avatarClassName: "bg-lyra-accent-blue-soft text-lyra-accent-blue-strong",
    channels: ["chat", "voice"],
    phoneNumbers: [{ value: "+15558140021", label: "Direct · (555) 814-0021" }],
    availability: "available",
  },
  {
    id: "amara",
    name: "Amara Okafor",
    initials: "AO",
    subtitle: "Support Agent",
    kind: "agent",
    avatarClassName: "bg-lyra-accent-teal-soft text-lyra-accent-teal-strong",
    channels: ["chat", "voice"],
    phoneNumbers: [{ value: "+15558140034", label: "Direct · (555) 814-0034" }],
    availability: "available",
  },
  {
    id: "diego",
    name: "Diego Fernandez",
    initials: "DF",
    subtitle: "Support Agent",
    kind: "agent",
    avatarClassName: "bg-lyra-accent-purple-soft text-lyra-accent-purple-strong",
    channels: ["chat", "voice"],
    phoneNumbers: [{ value: "+15558140047", label: "Direct · (555) 814-0047" }],
    availability: "unavailable",
  },
  {
    id: "lena",
    name: "Lena Kowalski",
    initials: "LK",
    subtitle: "Support Agent",
    kind: "agent",
    avatarClassName: "bg-lyra-accent-pink-soft text-lyra-accent-pink-strong",
    channels: ["chat"],
    phoneNumbers: [{ value: "+15558140058", label: "Direct · (555) 814-0058" }],
    availability: "offline",
  },
  {
    id: "tomas",
    name: "Tomás Ibáñez",
    initials: "TI",
    subtitle: "Support Agent",
    kind: "agent",
    avatarClassName: "bg-lyra-accent-lime-soft text-lyra-accent-lime-strong",
    channels: ["chat", "voice"],
    phoneNumbers: [{ value: "+15558140062", label: "Direct · (555) 814-0062" }],
    availability: "available",
  },
  {
    id: "priya-shah",
    name: "Priya Shah",
    initials: "PS",
    subtitle: "Team Supervisor",
    kind: "agent",
    avatarClassName: "bg-lyra-accent-slate-soft text-lyra-accent-slate-strong",
    channels: ["chat", "voice"],
    phoneNumbers: [{ value: "+15558140075", label: "Direct · (555) 814-0075" }],
    availability: "available",
  },
  // ── Additional teammates/skill agents — see the block right after this
  // array closes for why these exist (My Team needs exactly 12 members;
  // every skill needs 6-20) and for the shared helper that builds them. ──
  ...EXTRA_DIRECTORY_AGENTS,
];

/* ── Search ──
 * Shared by every contact-search box in the app (Directory, New Outbound's
 * contact picker, the Internal Chat/Consult-Transfer agent pickers) so
 * phone-number search works identically everywhere instead of each call
 * site growing its own slightly different matching rule. */

/** Matches a contact against a free-text query by name OR phone number.
 *  Phone matching compares digits only, so punctuation/spacing differences
 *  between the query and however a number happens to be stored ("+1 456
 *  555 9981" vs "456-555-9981" vs "4565559981") never prevent a match —
 *  checked against both `value` (the dialable E.164 string) and `label`
 *  (the "{Type} · (456) 555-9981" display string) so a search matches
 *  regardless of which one a caller happens to have handy. An empty query
 *  always matches, mirroring every existing call site's own "no query ->
 *  show everything" behavior. */
export function contactMatchesQuery(
  contact: { name: string; phoneNumbers?: { value: string; label: string }[] },
  query: string
): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  if (contact.name.toLowerCase().includes(trimmed)) return true;

  const queryDigits = trimmed.replace(/\D/g, "");
  if (!queryDigits) return false;
  return (contact.phoneNumbers ?? []).some((phone) => {
    const numberDigits = `${phone.value}${phone.label}`.replace(/\D/g, "");
    return numberDigits.includes(queryDigits);
  });
}

// Every skill's roster below is sized to 6-20 members per an explicit
// follow-up (previously 2-3 each) — a mix of Tier 1 teammates and the
// skill-only agents from EXTRA_DIRECTORY_AGENTS above, overlapping across
// skills the way real staffing usually does (the same agent can easily
// cover more than one queue) rather than each skill getting its own
// fully-separate pool.
export const DIRECTORY_SKILLS: DirectorySkill[] = [
  {
    id: "general-support",
    name: "General Support",
    description: "First-line chat support for general account questions.",
    channelType: "chat",
    memberAgentIds: ["john-smith", "amara", "tomas", "naomi-chen", "carlos-reyes", "isabel-ortiz", "malik-davis", "sana-verma", "theo-laurent", "renee-dupont"],
    availability: "available",
  },
  {
    id: "technical-support",
    name: "Technical Support",
    description: "App crashes, bugs, and troubleshooting.",
    channelType: "chat",
    memberAgentIds: ["diego", "tomas", "owen-bailey", "fatima-haidari", "hiro-tanaka", "aisha-bello", "ben-whitfield", "noah-fischer"],
    availability: "unavailable",
  },
  {
    id: "billing",
    name: "Billing",
    description: "Charges, refunds, and subscription questions.",
    channelType: "email",
    memberAgentIds: ["amara", "lena", "grace-kim", "ibrahim-yusuf", "marcus-chen", "sofia-delgado"],
    availability: "offline",
  },
  {
    id: "vip-support",
    name: "VIP Support",
    description: "Priority phone support for VIP customers.",
    channelType: "voice",
    memberAgentIds: ["john-smith", "diego", "priya-shah", "carlos-reyes", "naomi-chen", "owen-bailey", "isabel-ortiz", "sana-verma", "theo-laurent", "hiro-tanaka", "ben-whitfield", "noah-fischer"],
    availability: "available",
  },
];

export const DIRECTORY_TEAMS: DirectoryTeam[] = [
  {
    id: "tier-1",
    name: "Tier 1 Support",
    description: "Front-line support team.",
    // "priya-shah" added specifically as this team's supervisor — she was
    // already seeded in DIRECTORY_AGENTS with a "Team Supervisor" subtitle
    // but had never actually been placed on a team until New Outbound's
    // "My Team" group (below) needed a real supervisor to denote. The other
    // 8 (naomi-chen...ibrahim-yusuf, see EXTRA_DIRECTORY_AGENTS above) were
    // added specifically to bring this team to exactly 12 members, per an
    // explicit follow-up sizing requirement.
    memberAgentIds: [
      "john-smith", "amara", "tomas", "priya-shah",
      "naomi-chen", "carlos-reyes", "grace-kim", "owen-bailey",
      "fatima-haidari", "marcus-chen", "sofia-delgado", "ibrahim-yusuf",
    ],
    supervisorAgentId: "priya-shah",
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

// The logged-in agent, for "My Team" below — must refer to the same person
// as `CURRENT_AGENT_NAME` in AgentNextGenPage.tsx (that constant drives chat
// sender names; this one drives which team/teammates count as "mine").
// Kept as a separate constant here rather than importing across that
// boundary — components import from data, not the other way around.
export const CURRENT_AGENT_ID = "john-smith";

/** New Outbound's "My Team" group (see `OUTBOUND_GROUPS` below) shows the
 *  logged-in agent's own teammates as individual, callable/chattable agent
 *  rows — NOT one row per team the way this group used to work (a flat list
 *  of every `DirectoryTeam` as its own single contact). Reuses the real
 *  `DIRECTORY_AGENTS` records directly (rather than synthesizing new ones)
 *  so a teammate's row here is indistinguishable from the same person's row
 *  in the Agents group — same avatar, subtitle, channels, chat/call
 *  behavior. Excludes the agent themselves (you can't call or chat
 *  yourself); the team's own `supervisorAgentId` (Priya Shah, currently)
 *  already carries a "Team Supervisor" subtitle in `DIRECTORY_AGENTS`, so
 *  no extra labeling is needed here to denote her — reusing her real record
 *  handles it for free. `[]` if the current agent isn't on any team. */
const myTeam = DIRECTORY_TEAMS.find((team) => team.memberAgentIds.includes(CURRENT_AGENT_ID));
const OUTBOUND_MY_TEAM_CONTACTS: CreateNewOutboundContact[] = (myTeam?.memberAgentIds ?? [])
  .filter((id) => id !== CURRENT_AGENT_ID)
  .map((id) => DIRECTORY_AGENTS.find((a) => a.id === id))
  .filter((a): a is DirectoryAgent => !!a);

/** Every skill now supports a phone call in New Outbound regardless of
 *  which channel it actually routes on day-to-day (`channelType` below
 *  still drives the row's own accent color) — a real contact center skill/
 *  queue can always be rung by phone even if its native routing channel is
 *  chat or email, so `voice` is added unconditionally rather than only for
 *  skills already routed on it (`Set` dedupes `vip-support`, which is
 *  already voice-routed). */
const OUTBOUND_SKILL_CONTACTS: (CreateNewOutboundContact & { availability: AgentStatus })[] = DIRECTORY_SKILLS.map((skill) => {
  const accent = CHANNEL_ACCENT[skill.channelType];
  return {
    id: skill.id,
    name: skill.name,
    initials: initialsFor(skill.name),
    subtitle: skill.description,
    kind: "skill",
    avatarClassName: `${accent.bg} ${accent.text}`,
    channels: Array.from(new Set([skill.channelType, "voice" as ChannelType])),
    availability: skill.availability,
  };
});

/** Skill id → the real `DIRECTORY_AGENTS` records staffing it — backs the
 *  "view agents in this skill" screen a skill row's chevron now opens (see
 *  `NewOutboundPopover`'s own `skillAgents` screen) instead of the generic
 *  single-channel flyout every other contact kind's chevron still shows.
 *  Reuses the real agent records directly, same reasoning as
 *  `OUTBOUND_MY_TEAM_CONTACTS` above — an agent's row reads identically
 *  whether reached via Agents, My Team, or a Skill's own roster. */
export const OUTBOUND_SKILL_MEMBER_CONTACTS: Record<string, CreateNewOutboundContact[]> = Object.fromEntries(
  DIRECTORY_SKILLS.map((skill) => [
    skill.id,
    skill.memberAgentIds.map((id) => DIRECTORY_AGENTS.find((a) => a.id === id)).filter((a): a is DirectoryAgent => !!a),
  ])
);

/** Three separate external, customer-managed address books — per an
 *  explicit follow-up asking for multiple distinct external directories
 *  (previously just one placeholder "Partner Directory" group). Still
 *  placeholder content (no real external-directory source was given), just
 *  split into three illustrative books instead of one, in the same style
 *  as the contacts they replace — rename/restock whenever a real source is
 *  wired up. */
const OUTBOUND_PARTNER_CONTACTS: CreateNewOutboundContact[] = [
  { id: "ext-partner-1", name: "Northwind Logistics", initials: "NL", subtitle: "Partner Network", kind: "external", avatarClassName: "bg-lyra-accent-slate-soft text-lyra-accent-slate-strong", channels: ["voice", "email"] },
  { id: "ext-partner-2", name: "Fabrikam Support", initials: "FS", subtitle: "Partner Network", kind: "external", avatarClassName: "bg-lyra-accent-slate-soft text-lyra-accent-slate-strong", channels: ["voice", "email", "sms"] },
];
const OUTBOUND_VENDOR_CONTACTS: CreateNewOutboundContact[] = [
  { id: "ext-vendor-1", name: "Contoso Shipping", initials: "CS", subtitle: "Vendor Directory", kind: "external", avatarClassName: "bg-lyra-accent-orange-soft text-lyra-accent-orange-strong", channels: ["voice", "email"] },
  { id: "ext-vendor-2", name: "Adatum Payments", initials: "AP", subtitle: "Vendor Directory", kind: "external", avatarClassName: "bg-lyra-accent-orange-soft text-lyra-accent-orange-strong", channels: ["voice", "email"] },
];
const OUTBOUND_REGIONAL_CONTACTS: CreateNewOutboundContact[] = [
  { id: "ext-regional-1", name: "EMEA Regional Office", initials: "EO", subtitle: "Regional Offices", kind: "external", avatarClassName: "bg-lyra-accent-teal-soft text-lyra-accent-teal-strong", channels: ["voice", "email"] },
  { id: "ext-regional-2", name: "APAC Regional Office", initials: "AO", subtitle: "Regional Offices", kind: "external", avatarClassName: "bg-lyra-accent-teal-soft text-lyra-accent-teal-strong", channels: ["voice", "email"] },
];

/** Groups for CreateNew's outbound picker dropdown. */
/** Shared placeholder across every contact-search group in the local
 *  NewOutboundPopover — that component's search box also doubles as the
 *  entry point for an unmatched phone number or email (see its "no match
 *  found" screen), so the placeholder says so rather than just "Search
 *  {group}". */
const OUTBOUND_SEARCH_PLACEHOLDER = "Enter phone, email or search term";

// "Customers" removed entirely per an explicit follow-up — New Outbound no
// longer offers a way to browse/search customer records at all (DIRECTORY_
// CUSTOMERS itself is untouched; it still backs the Customer Profile panel,
// Directory page, etc., just no longer feeds this popover).
export const OUTBOUND_GROUPS: CreateNewOutboundGroup[] = [
  { id: "favorites", label: "Favorites", kind: "favorites", emptyMessage: "No favorites yet" },
  { id: "agents", label: "Agents", searchPlaceholder: OUTBOUND_SEARCH_PLACEHOLDER, contacts: DIRECTORY_AGENTS },
  { id: "skills", label: "Skills", searchPlaceholder: OUTBOUND_SEARCH_PLACEHOLDER, contacts: OUTBOUND_SKILL_CONTACTS },
  // "Teams" → "My Team": now the logged-in agent's own teammates (see
  // `OUTBOUND_MY_TEAM_CONTACTS` above), not a flat list of every team.
  { id: "teams", label: "My Team", searchPlaceholder: "Search your teammates", contacts: OUTBOUND_MY_TEAM_CONTACTS, emptyMessage: "You're not on a team yet" },
  { id: "partner-directory", label: "Partner Network", searchPlaceholder: OUTBOUND_SEARCH_PLACEHOLDER, contacts: OUTBOUND_PARTNER_CONTACTS },
  { id: "vendor-directory", label: "Vendor Directory", searchPlaceholder: OUTBOUND_SEARCH_PLACEHOLDER, contacts: OUTBOUND_VENDOR_CONTACTS },
  { id: "regional-offices", label: "Regional Offices", searchPlaceholder: OUTBOUND_SEARCH_PLACEHOLDER, contacts: OUTBOUND_REGIONAL_CONTACTS },
];
