import { useState } from "react";
import {
  ActionIconButton,
  Button,
  Popover,
  Menu,
  TabList,
  Tab,
  Tooltip,
  Chip,
  ConversationMessage,
  ConversationDateStamp,
  type MenuEntry,
  type ConversationVariant,
  type ChipColor,
} from "@nicecxone/lyra-ui";
import {
  MessageSquare,
  Clock,
  Plus,
  User,
  MoreVertical,
  ChevronDown,
  Pause,
  MicOff,
  AudioLines,
  Disc,
  Grip,
  PhoneOff,
  ArrowUpRight,
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

/* ── Header kebab menu — plain button (not ActionIconButton) so it isn't
 *  auto-wrapped in a Tooltip, which would sit between it and Popover's own
 *  `asChild` trigger wiring. ── */

function HeaderKebabMenu({ onCloseInteraction }: { onCloseInteraction?: () => void }) {
  const [open, setOpen] = useState(false);
  const items: MenuEntry[] = [
    { id: "close", label: "Unassign & Dismiss", onClick: onCloseInteraction },
    { id: "print", label: "Print conversation" },
    { id: "export", label: "Export transcript" },
  ];
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom"
      align="end"
      content={<Menu items={items} aria-label="More options" className="border-0 shadow-none bg-transparent min-w-[180px]" />}
    >
      <button
        type="button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
      >
        <MoreVertical className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
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
        <User className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
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
export type SlideInDestination = "contacts" | "directory" | "schedule";
/** Icons that instead take over the whole content column (no slide-in) —
 *  see the `takeover` prop below. */
export type FullPageDestination = "settings" | "dashboard";
export type NavDestination = SlideInDestination | FullPageDestination;

export interface InteractionHeaderProps {
  customerName?: string;
  activeTab?: "chat" | "history";
  onTabChange?: (tab: "chat" | "history") => void;
  /** Unassigns/dismisses the current interaction — clears the active
   *  interaction entirely so any open slide-in page (e.g. Directory) takes
   *  over the content column. */
  onCloseInteraction?: () => void;
  panelToggle?: "left";
  onPanelToggle?: () => void;
  /** Settings/Dashboard take over the whole content column instead of
   *  sliding in — this hides everything specific to the customer contact
   *  (the Customer Snapshot toggle, name, History/Chat tabs, add-tab
   *  button, Customer profile, kebab menu), showing just `takeoverTitle`
   *  instead. The Contacts/Directory/Schedule/Dashboard nav row that used to
   *  live here regardless of `takeover` now lives in `AppHeader` instead
   *  (see AgentNextGenPage.tsx) — it's global navigation, not something
   *  specific to one interaction, so it reads better as part of the
   *  always-present app header than duplicated into every content-column
   *  header state. */
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
}

export function InteractionHeader({
  customerName,
  activeTab,
  onTabChange,
  onCloseInteraction,
  panelToggle,
  onPanelToggle,
  takeover,
  takeoverTitle,
  aiPanelOpen,
  onAskAiClick,
}: InteractionHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b border-lyra-border-subtle px-6 py-4">
      {takeover && takeoverTitle && (
        <h1 className="lyra-heading-lg shrink-0 pr-2 text-lyra-fg-default">{takeoverTitle}</h1>
      )}

      {!takeover && (
        <>
          {panelToggle === "left" && (
            <>
              <LeftPanelToggle onToggle={onPanelToggle} />
              <div className="h-5 w-px bg-lyra-border-subtle" />
            </>
          )}

          <h1 className="lyra-heading-lg shrink-0 pr-2 text-lyra-fg-default">{customerName || "Customer"}</h1>

          <TabList className="border-b-0">
            <Tab active={activeTab === "history"} onClick={() => onTabChange?.("history")} icon={<Clock className="h-4 w-4" strokeWidth={1.5} />}>
              Customer History
            </Tab>
            <Tab active={activeTab === "chat"} onClick={() => onTabChange?.("chat")} icon={<MessageSquare className="h-4 w-4" strokeWidth={1.5} />}>
              Chat
            </Tab>
          </TabList>
          <button
            type="button"
            aria-label="Add tab"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>

          {/* Kebab acts on the currently-selected customer, so it sits right
           *  next to the interaction (name/tabs) — a divider marks that
           *  boundary. Customer profile used to have its own icon here too,
           *  but that's now the LeftPanelToggle at the far left (see its own
           *  comment). */}
          <div className="h-5 w-px bg-lyra-border-subtle" />
          <HeaderKebabMenu onCloseInteraction={onCloseInteraction} />

          <span className="flex-1" />

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

/** Person + redirect-arrow composite — no single Lucide icon covers
 *  "transfer". Not a lyra-ui export (it's a private helper local to
 *  channel-row.tsx there), so mirrored here rather than imported. Exported
 *  so ConsultTransferPopover.tsx (the "Transfer" button's popup content)
 *  can reuse this exact glyph for its own per-row "Transfer" actions
 *  instead of a third copy. */
export function ConsultTransferIcon({ strokeWidth = 1.5 }: { strokeWidth?: number }) {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center" aria-hidden="true">
      <User className="h-4 w-4" strokeWidth={strokeWidth} />
      <ArrowUpRight className="absolute -right-1 -top-1 h-2.5 w-2.5" strokeWidth={strokeWidth + 1} />
    </span>
  );
}

/** AudioLines with a diagonal slash — Lucide has no ready "off" variant for
 *  it, so composite one the same way `ConsultTransferIcon` above composites
 *  User + ArrowUpRight: the base icon plus an overlaid line, drawn
 *  corner-to-corner the same way Lucide's own `-Off` icons (e.g. MicOff)
 *  draw their slash. */
function MutedAudioLinesIcon({ strokeWidth = 2 }: { strokeWidth?: number }) {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center" aria-hidden="true">
      <AudioLines className="h-4 w-4" strokeWidth={strokeWidth} />
      <svg className="absolute inset-0 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
        <line x1="2" x2="22" y1="2" y2="22" />
      </svg>
    </span>
  );
}

/* ── InteractionActionsBar ──
 * Sits directly under InteractionInfoBar, left-aligned: Transfer/Outcome
 * icon buttons, same treatment as the assignment card's own Transfer/Outcome
 * buttons (interaction-nav-item.tsx). No longer a floating overlay — a plain
 * in-flow row. For a voice call, the same floating card expands to include
 * call controls (hold, mute, etc).
 * "Outcome" used to be an inert icon button (no popup) — now opens the
 * wrap-up form in OutcomePanel.tsx, hence the added `customerName` prop
 * (seeds the panel's title and AI-suggested summary). Same reasoning for
 * `issueSummary`/`caseId`, added for ConsultTransferButton's own AI-
 * suggested handoff summary — `issueSummary` specifically (not `subject`,
 * the short header text) since the handoff note needs the fuller
 * description of what's actually going on. */

export interface InteractionActionsBarProps {
  isVoiceCall?: boolean;
  /** Optional, matching InteractionHeader's own `customerName?` — not every
   *  assignment has one on record. OutcomeButton/ConsultTransferButton each
   *  fall back to generic phrasing when omitted. */
  customerName?: string;
  issueSummary?: string;
  caseId?: string;
}

export function InteractionActionsBar({ isVoiceCall = false, customerName, issueSummary, caseId }: InteractionActionsBarProps) {
  return (
    <div className="px-6 py-2">
      <div className="inline-flex items-center gap-1 rounded-lyra-lg border-[1.5px] border-lyra-border-medium bg-lyra-bg-surface-overlay p-1 shadow-md">
        {isVoiceCall && (
          <>
            <ActionIconButton size="sm" title="Hold">
              <Pause className="h-4 w-4" strokeWidth={2} />
            </ActionIconButton>
            <ActionIconButton size="sm" title="Mute">
              <MicOff className="h-4 w-4" strokeWidth={2} />
            </ActionIconButton>
            <ActionIconButton size="sm" title="Mute Speaker">
              <MutedAudioLinesIcon strokeWidth={2} />
            </ActionIconButton>
            <ActionIconButton size="sm" title="Record">
              <Disc className="h-4 w-4" strokeWidth={2} />
            </ActionIconButton>
            <ActionIconButton size="sm" title="Dialpad">
              <Grip className="h-4 w-4" strokeWidth={2} />
            </ActionIconButton>
            <ActionIconButton size="sm" title="Hang Up">
              <PhoneOff className="h-4 w-4 text-lyra-status-critical-strong" strokeWidth={2} />
            </ActionIconButton>
            <div className="mx-0.5 h-5 w-px bg-lyra-border-subtle" />
          </>
        )}
        <ConsultTransferButton customerName={customerName} issueSummary={issueSummary} caseId={caseId} />
        <OutcomeButton customerName={customerName ?? "this customer"} />
      </div>
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

/* ── CustomerInteractionPanel ──
 * The body below InteractionHeader: action bar + message thread (or a
 * Customer History placeholder), driven entirely by props — the active
 * assignment's data lives in AgentNextGenPage so switching the selected
 * assignment swaps this panel's content. */

export interface CustomerInteractionPanelProps {
  activeTab: "chat" | "history";
  messages: Message[];
}

export function CustomerInteractionPanel({ activeTab, messages }: CustomerInteractionPanelProps) {
  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-lyra-bg-surface-base">
      {/* ── Message thread ── */}
      {activeTab === "chat" ? (
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <ConversationDateStamp label="Today" />
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
                {m.text}
              </ConversationMessage>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-lyra-fg-secondary lyra-body-md">
          Customer history isn't wired up yet.
        </div>
      )}
    </div>
  );
}
