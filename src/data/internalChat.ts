/** One message in an internal (agent/supervisor/employee) chat thread —
 *  distinct from the customer-interaction `Message` type in
 *  CustomerInteractionPanel.tsx (that one has channel/customer semantics
 *  this doesn't need). */
export interface InternalChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  timestamp: string;
}

/** Employee ids favorited by default — shown pinned at the top of the
 *  Internal Chat popover's list view. */
export const INITIAL_FAVORITE_EMPLOYEE_IDS: string[] = ["amara", "priya-shah"];

/** Seed threads keyed by employee id. Employees with no entry here just
 *  start with an empty thread (no prior history). */
export const INITIAL_CHAT_THREADS: Record<string, InternalChatMessage[]> = {
  amara: [
    { id: "m1", fromMe: false, text: "Hey, do you have a sec to double check a billing case for me?", timestamp: "9:12 AM" },
    { id: "m2", fromMe: true, text: "Sure, send it over.", timestamp: "9:13 AM" },
    { id: "m3", fromMe: false, text: "CASE-47821 — customer's asking about a refund timeline.", timestamp: "9:14 AM" },
  ],
  "priya-shah": [
    { id: "m1", fromMe: true, text: "Do you have a minute to review an escalation?", timestamp: "8:45 AM" },
    { id: "m2", fromMe: false, text: "Yep, walk me through it.", timestamp: "8:47 AM" },
  ],
};
