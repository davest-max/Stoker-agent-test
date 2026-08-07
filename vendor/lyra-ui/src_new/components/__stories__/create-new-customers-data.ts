/**
 * Mock "Customers" dataset for the CreateNew → Outbound flow story.
 *
 * Kept in its own file rather than inline in CreateNew.stories.tsx — same
 * reasoning as create-new-agents-data.ts.
 */
import type { ChannelType } from "../channel-row";

export interface CreateNewCustomerRecord {
  id: string;
  name: string;
  customerId: string;
  /** Which channels this customer can be reached on — drives the per-row
   *  hover flyout in the Outbound picker (only supported channels show). */
  channels: ChannelType[];
  avatarClassName: string;
}

const FIRST_NAMES = [
  "Alex", "Sarah", "David", "Priya", "Miguel", "Elena", "Omar", "Grace", "Noah", "Fatima",
  "Liam", "Sofia", "Kenji", "Amara", "Lucas", "Ingrid", "Diego", "Yuki", "Hannah", "Tariq",
];
const LAST_NAMES = [
  "Kowalski", "Miller", "Brown", "Nair", "Santos", "Petrov", "Haddad", "Okafor", "Bennett", "Rahman",
  "Sullivan", "Alvarez", "Tanaka", "Mensah", "Fontaine", "Larsen", "Reyes", "Mori", "Costa", "Ibrahim",
];
const AVATAR_COLORS = [
  "blue", "purple", "green", "orange", "teal", "red", "pink", "yellow", "lime", "slate",
];
// Customers skew toward email/sms — most don't take a direct "voice" agent
// line the way internal agents do, which also gives the flyout some
// realistic variety row to row.
const ALL_CHANNELS: ChannelType[] = ["email", "sms", "whatsapp", "voice"];

function buildCustomers(count: number): CreateNewCustomerRecord[] {
  const customers: CreateNewCustomerRecord[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i + Math.floor(i / FIRST_NAMES.length)) % LAST_NAMES.length];
    const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
    const extra = ALL_CHANNELS.slice(1).filter((_, idx) => (i + idx) % 3 !== 0);
    customers.push({
      id: `customer-${i + 1}`,
      name: `${first} ${last}`,
      customerId: `CST-${10000 + i * 37}`,
      channels: ["email", ...extra],
      avatarClassName: `bg-lyra-accent-${color}-soft text-lyra-accent-${color}-strong`,
    });
  }
  return customers;
}

export const CREATE_NEW_CUSTOMERS: CreateNewCustomerRecord[] = buildCustomers(60);
