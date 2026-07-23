import * as React from "react";
import {
  CheckCircle2,
  CircleDot,
  MinusCircle,
  MessageSquare,
  Mail,
  MessageCircle,
  PhoneIncoming,
  PhoneOutgoing,
  Phone,
  Voicemail,
  ClipboardList,
  Share2,
  Inbox,
  Gauge,
  TrendingUp,
  Info,
  ChevronDown,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { DashboardCard } from "./dashboard-card";
import { DashboardQueue, type DashboardQueueItem } from "./dashboard-queue";
import { Icon } from "./icon";
import { Tag } from "./tag";
import { Button } from "./button";
import { Divider } from "./divider";
import { DonutChart } from "./donut-chart";
import { Popover } from "./popover";
import { RadioGroup, RadioGroupItem } from "./radio";
import { DateRangePicker, type DateRangePickerProps } from "./date-picker";
import { filterChipVariants } from "./filter-chip";
import { Tooltip } from "./tooltip";

/* ── AgentDashboard ──
   The "Home" tab of the Agent Next Gen experience — a greeting, a row of
   queue widgets, a Contact History list, and Performance/Productivity
   summary cards. Promoted here (Templates/Dashboards) from
   agent-next-gen-v1's own hand-built Home tab so every "Agent Next Gen"
   consumer (that app, `lyra-ux-templates`, and this library's own
   `Templates/Agent Next Gen` story) can render the exact same composition
   from one real component instead of three hand-copied ones — the same
   motivation as `useOutboundAddButton` (create-new.tsx): identical demo
   content living in more than one place is exactly the kind of thing that
   quietly drifts. See CONTRIBUTING.md §"Composition over reimplementation" —
   every piece below is built from existing lyra-ui atoms (`DashboardCard`,
   `DashboardQueue`, `Tag`, `Icon`, `DonutChart`, `Divider`, `Popover` +
   `RadioGroup`), nothing hand-rolled.

   All of the demo data (queue counts, contact history rows, performance/
   productivity numbers) is bundled in as sensible defaults — none of it is
   real business data, it's the same illustrative content the reference
   screenshots this was built from show, so there's nothing for a consumer
   to configure to get a faithful "Agent Next Gen" home screen out of the
   box. `onRedial` is the one true integration point (a consumer app
   presumably wants to actually place a call), and `selectedQueueId`/
   `onSelectQueueId` are exposed so a consumer can drive its own side/
   interior panel from the queue row a user clicked — that panel itself
   stays the consumer's concern (its shell, placement, and any other tabs
   sharing the same panel differ per app), so `AgentDashboard` only reports
   the selection, the same "report, don't own" split `DashboardQueue` itself
   already follows for its own `selectedId`/`onSelect`. Use
   `AGENT_DASHBOARD_QUEUE_SUB_ITEMS` (exported below) to render that
   drill-down content — see `Templates/Dashboards`' story for a full
   worked example including the side panel. */

export interface AgentDashboardQueueSubItem {
  id: string;
  label: string;
  icon: LucideIcon;
  inQueueCount: number;
  wait: string;
  available: number;
  working: number;
  unavailable: number;
}

/** Per-queue drill-down rows — keyed by the same ids as
 *  `AGENT_DASHBOARD_QUEUE_ITEMS`. Exported so a consumer's own side/interior
 *  panel can render the same "click a queue card → see its skills" content
 *  agent-next-gen-v1's Home tab does. */
export const AGENT_DASHBOARD_QUEUE_SUB_ITEMS: Record<string, AgentDashboardQueueSubItem[]> = {
  "1": [
    { id: "d1", label: "UX Chat",        icon: MessageSquare, inQueueCount: 2, wait: "3m 5s", available: 3, working: 1, unavailable: 0 },
    { id: "d2", label: "UX Email",       icon: Mail,          inQueueCount: 2, wait: "3m 5s", available: 3, working: 1, unavailable: 0 },
    { id: "d3", label: "UX SMS",         icon: MessageCircle, inQueueCount: 2, wait: "3m 5s", available: 3, working: 1, unavailable: 0 },
    { id: "d4", label: "Social Support", icon: Share2,        inQueueCount: 2, wait: "3m 5s", available: 3, working: 1, unavailable: 0 },
  ],
  "2": [
    { id: "v1", label: "AKR_Phone_IB",               icon: PhoneIncoming, inQueueCount: 0, wait: "0s", available: 0, working: 0, unavailable: 1 },
    { id: "v2", label: "AKR_Phone_IB_Sales",         icon: PhoneIncoming, inQueueCount: 0, wait: "0s", available: 0, working: 0, unavailable: 1 },
    { id: "v3", label: "Auto Attendant",             icon: PhoneIncoming, inQueueCount: 0, wait: "0s", available: 0, working: 0, unavailable: 1 },
    { id: "v4", label: "Auto Inbound",                icon: PhoneIncoming, inQueueCount: 0, wait: "0s", available: 0, working: 0, unavailable: 1 },
    { id: "v5", label: "KJ_Inbound_Phone",           icon: PhoneIncoming, inQueueCount: 0, wait: "0s", available: 1, working: 0, unavailable: 1 },
    { id: "v6", label: "mojo_finance_voice_support", icon: PhoneIncoming, inQueueCount: 0, wait: "0s", available: 0, working: 0, unavailable: 1 },
  ],
  "3": [
    { id: "vm1", label: "UX Voicemail",   icon: Voicemail, inQueueCount: 3, wait: "15m", available: 1, working: 0, unavailable: 1 },
    { id: "vm2", label: "After-Hours VM", icon: Voicemail, inQueueCount: 0, wait: "0s",  available: 0, working: 0, unavailable: 0 },
  ],
  "4": [
    { id: "w1", label: "Case Management", icon: ClipboardList, inQueueCount: 4, wait: "30m", available: 2, working: 3, unavailable: 0 },
    { id: "w2", label: "Escalations",     icon: ClipboardList, inQueueCount: 1, wait: "10m", available: 1, working: 1, unavailable: 0 },
    { id: "w3", label: "Billing Review",  icon: ClipboardList, inQueueCount: 0, wait: "0s",  available: 1, working: 0, unavailable: 0 },
  ],
};

function sumInQueue(id: string): number {
  return AGENT_DASHBOARD_QUEUE_SUB_ITEMS[id].reduce((total, item) => total + item.inQueueCount, 0);
}

/** Default queue-widget row — same 4 queues (Digital / Inbound Voice /
 *  Voicemail / Work Item) as the reference Home tab, with `contactsCount`/
 *  `skillsCount` derived from `AGENT_DASHBOARD_QUEUE_SUB_ITEMS` so the two
 *  can never drift apart (the bug this pattern was originally fixed for in
 *  agent-next-gen-v1 — see that file's own comment on `sumInQueue`).
 *  `wait` (HH:MM:SS) and `agentsCount` are static, matching the latest
 *  reference screenshot's Contacts/Agents card redesign — unlike
 *  `contactsCount`, this promoted template doesn't run agent-next-gen-v1's
 *  own live-ticking/simulated-update behavior (that's specific to that
 *  app's Home tab; nothing here needed it). */
export const AGENT_DASHBOARD_QUEUE_ITEMS: DashboardQueueItem[] = [
  { id: "1", name: "Digital",       icon: MessageSquare, wait: "00:02:34", skillsCount: AGENT_DASHBOARD_QUEUE_SUB_ITEMS["1"].length, contactsCount: sumInQueue("1"), agentsCount: 3 },
  { id: "2", name: "Inbound Voice", icon: PhoneIncoming, wait: "00:00:00", skillsCount: AGENT_DASHBOARD_QUEUE_SUB_ITEMS["2"].length, contactsCount: sumInQueue("2"), agentsCount: 2 },
  { id: "3", name: "Voicemail",     icon: Voicemail,     wait: "00:02:00", skillsCount: AGENT_DASHBOARD_QUEUE_SUB_ITEMS["3"].length, contactsCount: sumInQueue("3"), agentsCount: 3 },
  { id: "4", name: "Work Item",     icon: ClipboardList, wait: "00:00:24", skillsCount: AGENT_DASHBOARD_QUEUE_SUB_ITEMS["4"].length, contactsCount: sumInQueue("4"), agentsCount: 11 },
];

/** Renders one queue's skill/channel breakdown — the content a consumer's
 *  side/interior panel shows once a user clicks a queue widget. Exposed as
 *  its own component (rather than folded into `AgentDashboard` itself)
 *  since the panel it lives inside is the consumer's own — see the class
 *  doc comment above. */
export function AgentDashboardQueueDrilldown({ queueId }: { queueId: string }) {
  const items = AGENT_DASHBOARD_QUEUE_SUB_ITEMS[queueId] ?? [];
  return (
    <div className="flex flex-col">
      {items.map((item, i) => (
        <div
          key={item.id}
          className={cn("flex flex-col gap-2 px-4 py-4", i > 0 && "border-t border-lyra-border-subtle")}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 lyra-body-md-emphasis text-lyra-fg-default">
              <item.icon className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />
              {item.label}
            </span>
            <span className="lyra-body-sm text-lyra-fg-secondary whitespace-nowrap">
              {item.inQueueCount} In Queue
            </span>
          </div>
          <span className="inline-flex items-center gap-1 lyra-body-sm text-lyra-fg-secondary">
            <Clock className="h-3 w-3" strokeWidth={1.5} />
            Longest Wait Time: {item.wait}
          </span>
          {/* Each badge gets a hover tooltip spelling out what the count
              means, since the color/icon alone doesn't say "agents". */}
          <div className="flex items-center gap-3">
            <Tooltip content="Available Agents" placement="top">
              <span className="inline-flex items-center gap-1.5">
                <Icon icon={CheckCircle2} size="sm" background="success" shape="circle" decorative />
                <span className="lyra-body-sm-emphasis text-lyra-fg-default">{item.available}</span>
              </span>
            </Tooltip>
            <Tooltip content="Working Agents" placement="top">
              <span className="inline-flex items-center gap-1.5">
                <Icon icon={CircleDot} size="sm" background="warning" shape="circle" decorative />
                <span className="lyra-body-sm-emphasis text-lyra-fg-default">{item.working}</span>
              </span>
            </Tooltip>
            <Tooltip content="Unavailable Agents" placement="top">
              <span className="inline-flex items-center gap-1.5">
                <Icon icon={MinusCircle} size="sm" background="critical" shape="circle" decorative />
                <span className="lyra-body-sm-emphasis text-lyra-fg-default">{item.unavailable}</span>
              </span>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Shared date-range filter chip ──
   One control, reused by every card below (Contact History / Performance /
   Productivity) — a single-select popover (RadioGroup, since only one
   range applies at a time), styled as `filterChipVariants({ variant:
   "default" })` so it reads as a neutral control rather than a permanently-
   "active" filter. Picking "Custom" reveals a `DateRangePicker`. */

export type AgentDashboardDateRange = "today" | "yesterday" | "last7" | "custom";

const DATE_FILTER_OPTIONS: { value: AgentDashboardDateRange; label: string }[] = [
  { value: "today",     label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7",     label: "Last 7 days" },
  { value: "custom",    label: "Custom" },
];

function DateFilterChip({ onValueChange }: { onValueChange?: (value: AgentDashboardDateRange) => void }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<AgentDashboardDateRange>("today");
  const [customRange, setCustomRange] = React.useState<DateRangePickerProps["value"]>(undefined);

  const selectedLabel = DATE_FILTER_OPTIONS.find((o) => o.value === value)?.label ?? "";

  const handleValueChange = (v: AgentDashboardDateRange) => {
    setValue(v);
    onValueChange?.(v);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom"
      content={
        <div className="flex flex-col gap-3 p-3 w-[260px]">
          <RadioGroup value={value} onValueChange={(v) => handleValueChange(v as AgentDashboardDateRange)}>
            {DATE_FILTER_OPTIONS.map((option) => (
              <RadioGroupItem key={option.value} value={option.value} label={option.label} />
            ))}
          </RadioGroup>
          {value === "custom" && (
            <DateRangePicker value={customRange} onChange={setCustomRange} placeholder="Select date range" />
          )}
        </div>
      }
    >
      <button type="button" className={cn(filterChipVariants({ variant: "default" }), "rounded-lyra-md")}>
        <span className="inline-flex items-baseline gap-1">
          <span className="lyra-body-md-emphasis whitespace-nowrap">Date:</span>
          <span className="lyra-body-md truncate">{selectedLabel}</span>
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 flex-shrink-0 transition-transform", open && "rotate-180")} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </Popover>
  );
}

/* ── Productivity (agent state duration bars + ring chart) ── */

type ProductivityStatusId = "available" | "working" | "unavailable";

interface ProductivityStatusMeta {
  id: ProductivityStatusId;
  label: string;
  icon: LucideIcon;
  iconColorClassName: string;
  dotClassName: string;
  colorVar: string;
}

const PRODUCTIVITY_STATUS_META: ProductivityStatusMeta[] = [
  { id: "available",   label: "Available",   icon: CheckCircle2, iconColorClassName: "text-lyra-status-success-strong",  dotClassName: "bg-lyra-status-success-strong",  colorVar: "var(--lyra-color-status-success-strong)" },
  { id: "working",     label: "Working",     icon: CircleDot,    iconColorClassName: "text-lyra-status-warning-strong",  dotClassName: "bg-lyra-status-warning-strong",  colorVar: "var(--lyra-color-status-warning-strong)" },
  { id: "unavailable", label: "Unavailable", icon: MinusCircle,  iconColorClassName: "text-lyra-status-critical-strong", dotClassName: "bg-lyra-status-critical-strong", colorVar: "var(--lyra-color-status-critical-strong)" },
];

interface ProductivityStatusValue {
  percent: number;
  teamPercent: number;
  time: string;
  teamTime: string;
}

const PRODUCTIVITY_DATA_BY_RANGE: Record<AgentDashboardDateRange, Record<ProductivityStatusId, ProductivityStatusValue>> = {
  today: {
    available:   { percent: 22, teamPercent: 28, time: "01:45:12", teamTime: "02:14:40" },
    working:     { percent: 61, teamPercent: 55, time: "04:53:08", teamTime: "04:24:00" },
    unavailable: { percent: 17, teamPercent: 17, time: "01:21:40", teamTime: "01:21:20" },
  },
  yesterday: {
    available:   { percent: 18, teamPercent: 24, time: "01:26:24", teamTime: "01:55:12" },
    working:     { percent: 67, teamPercent: 58, time: "05:21:36", teamTime: "04:38:24" },
    unavailable: { percent: 15, teamPercent: 18, time: "01:12:00", teamTime: "01:26:24" },
  },
  last7: {
    available:   { percent: 24, teamPercent: 27, time: "13:26:00", teamTime: "15:07:20" },
    working:     { percent: 58, teamPercent: 54, time: "32:26:24", teamTime: "30:14:24" },
    unavailable: { percent: 18, teamPercent: 19, time: "10:04:48", teamTime: "10:38:16" },
  },
  custom: {
    available:   { percent: 0, teamPercent: 0, time: "00:00:00", teamTime: "00:00:00" },
    working:     { percent: 0, teamPercent: 0, time: "00:00:00", teamTime: "00:00:00" },
    unavailable: { percent: 0, teamPercent: 0, time: "00:00:00", teamTime: "00:00:00" },
  },
};

const UNAVAILABLE_STATE_BREAKDOWN: { label: string; percent: number }[] = [
  { label: "Bio Break", percent: 100 },
  { label: "Break",     percent: 0 },
  { label: "Meeting",   percent: 0 },
  { label: "Team",      percent: 100 },
];

function PerformanceBreakdownCard() {
  const [dateFilter, setDateFilter] = React.useState<AgentDashboardDateRange>("today");
  const values = PRODUCTIVITY_DATA_BY_RANGE[dateFilter];

  return (
    <DashboardCard
      variant="neutral-subtle"
      headerTitle="Productivity"
      headerIcon={<Icon icon={Gauge} size="md" background="info" shape="rounded" decorative />}
      headerActions={<DateFilterChip onValueChange={setDateFilter} />}
    >
      <div className="flex flex-col gap-4 px-4 pb-4">
        {PRODUCTIVITY_STATUS_META.map((meta) => {
          const row = values[meta.id];
          return (
            <div key={meta.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 lyra-body-md-emphasis text-lyra-fg-default">
                  <meta.icon className={cn("h-4 w-4", meta.iconColorClassName)} strokeWidth={1.5} />
                  {meta.label}
                  <span className="lyra-body-sm text-lyra-fg-secondary font-normal">({row.percent}%)</span>
                  {meta.id === "unavailable" && (
                    <Tooltip
                      placement="right"
                      content={
                        <div className="flex flex-col gap-1">
                          {UNAVAILABLE_STATE_BREAKDOWN.map((state) => (
                            <span key={state.label} className="lyra-body-sm text-lyra-fg-default whitespace-nowrap">
                              {state.label} ({state.percent}%)
                            </span>
                          ))}
                        </div>
                      }
                    >
                      <span className="inline-flex items-center text-lyra-fg-secondary hover:text-lyra-fg-action transition-colors cursor-default">
                        <Info className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        <span className="sr-only">
                          Unavailable breakdown: {UNAVAILABLE_STATE_BREAKDOWN.map((s) => `${s.label} (${s.percent}%)`).join(", ")}
                        </span>
                      </span>
                    </Tooltip>
                  )}
                </span>
                <span className="lyra-body-md-emphasis tabular-nums text-lyra-fg-default">{row.time}</span>
              </div>
              <div className="flex items-center justify-between gap-3 pl-6">
                <span className="lyra-body-sm text-lyra-fg-secondary">Team ({row.teamPercent}%)</span>
                <span className="lyra-body-sm tabular-nums text-lyra-fg-secondary">{row.teamTime}</span>
              </div>
            </div>
          );
        })}

        <Divider />

        <div className="flex items-center gap-6">
          <div className="h-[120px] w-[120px] shrink-0">
            <DonutChart
              data={PRODUCTIVITY_STATUS_META.map((meta) => ({
                label: meta.label,
                value: values[meta.id].percent,
                colorVar: meta.colorVar,
              }))}
            />
          </div>
          <div className="flex flex-1 flex-col gap-2.5">
            {PRODUCTIVITY_STATUS_META.map((meta) => (
              <div key={meta.id} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 lyra-body-md text-lyra-fg-secondary">
                  <span className={cn("h-2.5 w-2.5 rounded-full", meta.dotClassName)} aria-hidden="true" />
                  {meta.label}
                </span>
                <span className="lyra-heading-sm text-lyra-fg-default">{values[meta.id].percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

/* ── Performance (Cases Resolved / CSAT + Channel Type breakdown) ── */

type ChannelTypeId = "inbound" | "outbound";

interface ChannelTypeMeta {
  id: ChannelTypeId;
  label: string;
  icon: LucideIcon;
}

const CHANNEL_TYPE_META: ChannelTypeMeta[] = [
  { id: "inbound",  label: "Inbound",  icon: PhoneIncoming },
  { id: "outbound", label: "Outbound", icon: PhoneOutgoing },
];

interface ChannelTypeValue {
  you: number;
  team: number;
}

const CHANNEL_TYPE_DATA_BY_RANGE: Record<AgentDashboardDateRange, Record<ChannelTypeId, ChannelTypeValue>> = {
  today: {
    inbound:  { you: 0, team: 0 },
    outbound: { you: 0, team: 0 },
  },
  yesterday: {
    inbound:  { you: 14, team: 162 },
    outbound: { you: 9,  team: 98  },
  },
  last7: {
    inbound:  { you: 88, team: 1024 },
    outbound: { you: 52, team: 640  },
  },
  custom: {
    inbound:  { you: 0, team: 0 },
    outbound: { you: 0, team: 0 },
  },
};

const PERFORMANCE_DATA_BY_RANGE: Record<AgentDashboardDateRange, { casesResolved: string; csat: string }> = {
  today:     { casesResolved: "12",  csat: "4.8" },
  yesterday: { casesResolved: "19",  csat: "4.6" },
  last7:     { casesResolved: "104", csat: "4.7" },
  custom:    { casesResolved: "—",   csat: "—"   },
};

function percentOfTeam(you: number, team: number): number {
  return team > 0 ? Math.round((you / team) * 100) : 0;
}

function PerformanceSummaryCard() {
  const [dateFilter, setDateFilter] = React.useState<AgentDashboardDateRange>("today");
  const data = PERFORMANCE_DATA_BY_RANGE[dateFilter];
  const channelData = CHANNEL_TYPE_DATA_BY_RANGE[dateFilter];
  const overallYou = CHANNEL_TYPE_META.reduce((sum, meta) => sum + channelData[meta.id].you, 0);
  const overallTeam = CHANNEL_TYPE_META.reduce((sum, meta) => sum + channelData[meta.id].team, 0);

  return (
    <DashboardCard
      variant="neutral-subtle"
      headerTitle="Performance"
      headerIcon={<Icon icon={TrendingUp} size="md" background="success" shape="rounded" decorative />}
      headerActions={<DateFilterChip onValueChange={setDateFilter} />}
    >
      <div className="flex flex-col gap-3 px-4 pb-4">
        <div className="flex items-center justify-between">
          <span className="lyra-body-md text-lyra-fg-secondary">Cases Resolved</span>
          <span className="lyra-heading-sm text-lyra-fg-default">{data.casesResolved}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="lyra-body-md text-lyra-fg-secondary">CSAT Score</span>
          <span className="lyra-heading-sm text-lyra-status-success-strong">{data.csat}</span>
        </div>
        <Divider />

        <span className="lyra-body-sm-emphasis text-lyra-fg-secondary">Channel Type</span>
        <div className="flex flex-col gap-4">
          {CHANNEL_TYPE_META.map((meta) => {
            const row = channelData[meta.id];
            const pct = percentOfTeam(row.you, row.team);
            return (
              <div key={meta.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 lyra-body-md-emphasis text-lyra-fg-default">
                    <meta.icon className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />
                    {meta.label}
                  </span>
                  <span className="lyra-body-md-emphasis tabular-nums text-lyra-fg-default">{row.you}</span>
                </div>
                <div className="flex items-center justify-between gap-3 pl-6">
                  <span className="lyra-body-sm text-lyra-fg-secondary">Team ({pct}% of Team)</span>
                  <span className="lyra-body-sm tabular-nums text-lyra-fg-secondary">{row.team}</span>
                </div>
              </div>
            );
          })}

          <Divider />

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="lyra-body-md-emphasis text-lyra-fg-default">Overall</span>
              <span className="lyra-body-md-emphasis tabular-nums text-lyra-fg-default">{overallYou}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="lyra-body-sm text-lyra-fg-secondary">Team ({percentOfTeam(overallYou, overallTeam)}% of Team)</span>
              <span className="lyra-body-sm tabular-nums text-lyra-fg-secondary">{overallTeam}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

/* ── Contact History ── */

export interface AgentDashboardContactHistoryEntry {
  id: string;
  name: string;
  statusLabel: string;
  statusVariant: "success" | "warning";
  /** Voice contacts only — shows a "Redial" action next to the status tag. */
  redial: boolean;
  description: string;
  caseId: string;
  channelType: "voice" | "chat" | "email";
  channelLabel: string;
  timeAgo: string;
  duration: string;
}

const CONTACT_HISTORY_CHANNEL_ICON: Record<AgentDashboardContactHistoryEntry["channelType"], LucideIcon> = {
  voice: Phone,
  chat:  MessageCircle,
  email: Mail,
};

const CONTACT_HISTORY: AgentDashboardContactHistoryEntry[] = [
  {
    id: "ch1", name: "Nathan Cole", statusLabel: "Resolved", statusVariant: "success", redial: true,
    description: "Customer was locked out after 5 failed attempts. Verified identity via KBA, reset credentials, and confirmed access restored.",
    caseId: "CST-22841", channelType: "voice", channelLabel: "Voice", timeAgo: "8m ago", duration: "8m 14s",
  },
  {
    id: "ch2", name: "Priya Shah", statusLabel: "Resolved", statusVariant: "success", redial: false,
    description: "Duplicate charge dispute — $89.99 refund issued",
    caseId: "CST-30164", channelType: "chat", channelLabel: "Chat", timeAgo: "34m ago", duration: "12m 02s",
  },
  {
    id: "ch3", name: "Omar Farooq", statusLabel: "Resolved", statusVariant: "success", redial: false,
    description: "Plan upgrade confirmation & feature overview",
    caseId: "CST-16823", channelType: "email", channelLabel: "Email", timeAgo: "2h ago", duration: "6m 30s",
  },
  {
    id: "ch4", name: "Lauren Briggs", statusLabel: "Transferred", statusVariant: "warning", redial: true,
    description: "Escalated fraud investigation — 4 suspicious transactions",
    caseId: "CST-27760", channelType: "voice", channelLabel: "Voice", timeAgo: "5h ago", duration: "22m 47s",
  },
  {
    id: "ch5", name: "Mei Tanaka", statusLabel: "Resolved", statusVariant: "success", redial: false,
    description: "Shipping delay — expedited replacement dispatched",
    caseId: "CST-31045", channelType: "chat", channelLabel: "Chat", timeAgo: "1d ago", duration: "9m 15s",
  },
];

const EXTENDED_CONTACT_HISTORY: AgentDashboardContactHistoryEntry[] = [
  {
    id: "ch-ext-1", name: "Grace Whitfield", statusLabel: "Resolved", statusVariant: "success", redial: false,
    description: "Password reset — identity verified via KBA, access restored",
    caseId: "CST-40512", channelType: "email", channelLabel: "Email", timeAgo: "1d ago", duration: "7m 40s",
  },
  {
    id: "ch-ext-2", name: "Marcus Delgado", statusLabel: "Resolved", statusVariant: "success", redial: false,
    description: "Billing question — walked through recent charges, no refund needed",
    caseId: "CST-40733", channelType: "chat", channelLabel: "Chat", timeAgo: "1d ago", duration: "5m 18s",
  },
  {
    id: "ch-ext-3", name: "Sofia Alvarez", statusLabel: "Transferred", statusVariant: "warning", redial: true,
    description: "Product setup issue escalated to Tier 2 for configuration support",
    caseId: "CST-41021", channelType: "voice", channelLabel: "Voice", timeAgo: "2d ago", duration: "14m 05s",
  },
  {
    id: "ch-ext-4", name: "Owen Bennett", statusLabel: "Resolved", statusVariant: "success", redial: false,
    description: "Subscription cancellation request — retention offer accepted",
    caseId: "CST-41288", channelType: "chat", channelLabel: "Chat", timeAgo: "3d ago", duration: "10m 52s",
  },
  {
    id: "ch-ext-5", name: "Ines Novak", statusLabel: "Resolved", statusVariant: "success", redial: false,
    description: "Shipping delay follow-up — updated delivery window provided",
    caseId: "CST-41530", channelType: "email", channelLabel: "Email", timeAgo: "4d ago", duration: "4m 27s",
  },
];

const CONTACT_HISTORY_BY_RANGE: Record<AgentDashboardDateRange, AgentDashboardContactHistoryEntry[]> = {
  today: [],
  yesterday: CONTACT_HISTORY,
  last7: [...CONTACT_HISTORY, ...EXTENDED_CONTACT_HISTORY],
  custom: [],
};

export interface ContactHistoryCardProps {
  /** Called when the agent clicks "Redial" on a voice entry. Left unhandled by default. */
  onRedial?: (entry: AgentDashboardContactHistoryEntry) => void;
}

function ContactHistoryCard({ onRedial }: ContactHistoryCardProps) {
  const [dateFilter, setDateFilter] = React.useState<AgentDashboardDateRange>("today");
  const entries = CONTACT_HISTORY_BY_RANGE[dateFilter];

  return (
    <DashboardCard
      variant="neutral-subtle"
      headerTitle="Contact History"
      headerActions={<DateFilterChip onValueChange={setDateFilter} />}
    >
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <Inbox className="h-6 w-6 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />
          <span className="lyra-body-md text-lyra-fg-secondary">Nothing to Display</span>
        </div>
      ) : (
        <div className="flex flex-col">
          {entries.map((entry, i) => {
            const ChannelIcon = CONTACT_HISTORY_CHANNEL_ICON[entry.channelType];
            return (
              <div
                key={entry.id}
                className={cn("flex items-start justify-between gap-4 px-4 py-4", i > 0 && "border-t border-lyra-border-subtle")}
              >
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="lyra-body-md-emphasis text-lyra-fg-default">{entry.name}</span>
                    <Tag label={entry.statusLabel} variant={entry.statusVariant} />
                    {entry.redial && (
                      <Button variant="outline" size="sm" onClick={() => onRedial?.(entry)}>
                        <PhoneOutgoing className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Redial
                      </Button>
                    )}
                  </div>
                  <span className="lyra-body-md text-lyra-fg-secondary">{entry.description}</span>
                  <span className="lyra-body-sm text-lyra-fg-secondary">{entry.caseId}</span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="inline-flex items-center gap-1.5 lyra-body-sm text-lyra-fg-secondary whitespace-nowrap">
                    <ChannelIcon className="h-4 w-4" strokeWidth={1.5} />
                    {entry.channelLabel} · {entry.timeAgo}
                  </span>
                  <span className="lyra-body-md-emphasis tabular-nums text-lyra-fg-default whitespace-nowrap">{entry.duration}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}

/* ── AgentDashboard ── */

function getGreetingPeriod(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export interface AgentDashboardProps {
  /** Shown in the "Good {morning/afternoon/evening}, {name}" greeting. Default "there". */
  agentFirstName?: string;
  /** Called when the agent clicks "Redial" in Contact History. */
  onRedial?: (entry: AgentDashboardContactHistoryEntry) => void;
  /**
   * Which `AGENT_DASHBOARD_QUEUE_ITEMS` row is selected — uncontrolled by
   * default; pass alongside `onSelectQueueId` to control it from outside
   * (e.g. to keep a side/interior panel showing that queue's
   * `AgentDashboardQueueDrilldown` in sync). `null`/`undefined` means
   * nothing selected.
   */
  selectedQueueId?: string | null;
  /** Called with the resolved next selection — same click-to-toggle behavior as `DashboardQueue`'s own `onSelect`. */
  onSelectQueueId?: (id: string | null) => void;
  className?: string;
}

/** The Agent Next Gen "Home" tab — greeting, queue widgets, Contact History,
 *  and Performance/Productivity summary cards. See the class doc comment
 *  above for the full rationale and integration points. */
export function AgentDashboard({
  agentFirstName = "there",
  onRedial,
  selectedQueueId,
  onSelectQueueId,
  className,
}: AgentDashboardProps) {
  return (
    <div className={cn("w-full max-w-[1200px] mx-auto lyra-container-grid-wrap", className)}>
      <h1 className="lyra-heading-2xl text-lyra-fg-default">
        Good {getGreetingPeriod()}, {agentFirstName}
      </h1>
      <p className="mt-1 lyra-body-md text-lyra-fg-secondary">Below is your team's queue for the day:</p>

      <DashboardQueue
        className="mt-6"
        items={AGENT_DASHBOARD_QUEUE_ITEMS}
        selectedId={selectedQueueId}
        onSelect={onSelectQueueId}
      />

      <div className="mt-6">
        <ContactHistoryCard onRedial={onRedial} />
      </div>

      <div className="mt-6 lyra-container-grid">
        <PerformanceSummaryCard />
        <PerformanceBreakdownCard />
      </div>
    </div>
  );
}
