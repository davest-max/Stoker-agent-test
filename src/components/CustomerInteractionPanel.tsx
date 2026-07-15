import { useState } from "react";
import {
  ActionIconButton,
  Popover,
  Menu,
  TabList,
  Tab,
  Tooltip,
  Chip,
  ConversationMessage,
  ConversationDateStamp,
  ConsultTransferIcon,
  type MenuEntry,
  type ConversationVariant,
  type ChipColor,
} from "@nicecxone/lyra-ui";
import {
  MessageSquare,
  Clock,
  Plus,
  LayoutGrid,
  User,
  MoreVertical,
  ChevronDown,
  CircleCheck,
  Users,
  BookUser,
  CalendarDays,
  Pause,
  MicOff,
  AudioLines,
  Disc,
  Grip,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Shared types ── */

export type EscalationStatus = "escalated" | "in-progress" | "resolved" | "new";

/** One message in an interaction's transcript. `variant` drives both the
 *  bubble color and which side it renders on — "customer" (green, left) or
 *  "support-agent" (purple, right), lyra-ui's ConversationMessage variants
 *  built for exactly this customer-support use case. */
export interface Message {
  id: string;
  variant: Extract<ConversationVariant, "customer" | "support-agent">;
  senderName: string;
  text: string;
  timestamp: string;
  alert?: { message: string; severity: "warning" | "critical" };
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
  /** Which nav destination is currently open, if any — drives each nav
   *  icon's active/highlighted state, slide-in or full-page alike. */
  activeNav?: NavDestination | null;
  onNavClick?: (item: NavDestination) => void;
  /** Unassigns/dismisses the current interaction — clears the active
   *  interaction entirely so any open slide-in page (e.g. Directory) takes
   *  over the content column. */
  onCloseInteraction?: () => void;
  panelToggle?: "left";
  onPanelToggle?: () => void;
  /** Settings/Dashboard take over the whole content column instead of
   *  sliding in — this hides everything specific to the customer contact
   *  (the Customer Snapshot toggle, name, History/Chat tabs, add-tab
   *  button, Customer profile, kebab menu) while keeping the nav icon row
   *  itself, so it reads as a distinct utility screen rather than an
   *  interaction. */
  takeover?: boolean;
  /** Page title shown when `takeover` is true (e.g. "Settings"/"Control Center")
   *  — takes the same left-aligned <h1> slot the customer name uses
   *  otherwise, since the two are mutually exclusive. */
  takeoverTitle?: string;
}

export function InteractionHeader({
  customerName,
  activeTab,
  onTabChange,
  activeNav,
  onNavClick,
  onCloseInteraction,
  panelToggle,
  onPanelToggle,
  takeover,
  takeoverTitle,
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
           *  next to the interaction (name/tabs) rather than with the
           *  generic nav icons — a divider marks that boundary. Customer
           *  profile used to have its own icon here too, but that's now the
           *  LeftPanelToggle at the far left (see its own comment). */}
          <div className="h-5 w-px bg-lyra-border-subtle" />
          <HeaderKebabMenu onCloseInteraction={onCloseInteraction} />
        </>
      )}

      <span className="flex-1" />

      {/* Moved from the LeftNav rail's icon-only nav list — same icon size
       *  and stroke weight (h-4 w-4, strokeWidth 1.5) as Dashboard below, so
       *  the whole row reads as one consistent icon-button group. This row
       *  persists even in takeover mode (see the `takeover` prop doc). */}
      <NavIconButton item="contacts" title="Contacts" icon={Users} activeNav={activeNav} onNavClick={onNavClick} />
      <NavIconButton item="directory" title="Directory" icon={BookUser} activeNav={activeNav} onNavClick={onNavClick} />
      <NavIconButton item="schedule" title="Schedule" icon={CalendarDays} activeNav={activeNav} onNavClick={onNavClick} />
      <div className="h-5 w-px bg-lyra-border-subtle" />
      <NavIconButton item="dashboard" title="Control Center" icon={LayoutGrid} activeNav={activeNav} onNavClick={onNavClick} />
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

/** AudioLines with a diagonal slash — Lucide has no ready "off" variant for
 *  it, so composite one the same way `ConsultTransferIcon` composites User +
 *  ArrowUpRight: the base icon plus an overlaid line, drawn corner-to-corner
 *  the same way Lucide's own `-Off` icons (e.g. MicOff) draw their slash. */
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
 * call controls (hold, mute, etc). */

export interface InteractionActionsBarProps {
  isVoiceCall?: boolean;
}

export function InteractionActionsBar({ isVoiceCall = false }: InteractionActionsBarProps) {
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
            <div className="mx-0.5 h-5 w-px bg-lyra-border-subtle" />
          </>
        )}
        <ActionIconButton size="sm" title="Transfer">
          <ConsultTransferIcon strokeWidth={2} />
        </ActionIconButton>
        <ActionIconButton size="sm" title="Outcome">
          <CircleCheck className="h-4 w-4 text-lyra-status-info-strong" strokeWidth={2} />
        </ActionIconButton>
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
                variant={m.variant}
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
