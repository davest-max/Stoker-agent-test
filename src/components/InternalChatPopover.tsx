import {
  Popover,
  SearchInput,
  FavoriteButton,
  ListItem,
  ActionIconButton,
  ConversationMessage,
  Tooltip,
  Draggable,
  type DraggableVariant,
  type DraggableHeaderControls,
} from "@nicecxone/lyra-ui";
import { MessagesSquare, ChevronLeft, ChevronRight, Phone, Send, PanelRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIRECTORY_AGENTS, type DirectoryAgent } from "@/data/directory";
import type { InternalChatMessage } from "@/data/internalChat";

/* ── InternalChatPopover ──
 * Agent-to-agent / agent-to-supervisor / employee-to-employee chat. The
 * trigger icon sits in the app header next to NotificationsBell (same h-10
 * w-10 rounded-lyra-lg styling so the two read as one icon group). Reuses
 * DIRECTORY_AGENTS as the employee roster rather than inventing a parallel
 * one (a supervisor entry was added there for the agent-to-supervisor case).
 *
 * Two presentations, toggled by "dock to side" (matching the AI Assistant
 * panel's own dock affordance, reusing lyra-ui's shared Draggable primitive
 * for the docked container):
 *   - Popover (default) — anchored dropdown under the trigger icon.
 *   - Docked — a panel in the layout's docked-panel row, same slot AI
 *     Assistant/Notifications use, via Draggable variant="docked".
 * Unlike AI Assistant, chat has no free-floating mode: "Undock" (Draggable's
 * own dock/undock toggle) just pops it back into the anchored popover
 * instead of a floating window, since nothing asked for drag-anywhere here.
 *
 * All state (open, docked, view-stack, favorites, threads, draft) is lifted
 * to AgentNextGenPage — the trigger (header) and the docked panel (layout
 * row) are two different mount points for the same data, so it can't live
 * locally in either one without losing state when switching between them
 * (same reasoning as the Customer Snapshot panel's lifted state). */

export type ChatView = { kind: "list" } | { kind: "chat"; employeeId: string };

export interface InternalChatSharedProps {
  view: ChatView;
  onViewChange: (view: ChatView) => void;
  search: string;
  onSearchChange: (value: string) => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  threads: Record<string, InternalChatMessage[]>;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onCall: (employee: DirectoryAgent) => void;
}

const AVATAR_SIZE = "h-9 w-9";

function EmployeeAvatar({ employee, size = AVATAR_SIZE }: { employee: DirectoryAgent; size?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-full lyra-body-sm-emphasis", size, employee.avatarClassName)}>
      {employee.initials}
    </div>
  );
}

function EmployeeRow({
  employee,
  favorited,
  onToggleFavorite,
  onOpenChat,
}: {
  employee: DirectoryAgent;
  favorited: boolean;
  onToggleFavorite: () => void;
  onOpenChat: () => void;
}) {
  return (
    <ListItem
      className="group/row"
      leading={<EmployeeAvatar employee={employee} />}
      title={employee.name}
      subtitle={employee.subtitle}
      onClick={onOpenChat}
      trailing={
        <div className="flex items-center gap-0.5">
          <FavoriteButton favorited={favorited} onClick={onToggleFavorite} label={employee.name} placement="left" />
          <ChevronRight className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />
        </div>
      }
    />
  );
}

/** Matches Draggable's own built-in dock-toggle button exactly (icon, size,
 *  classes) so the popover-mode affordance reads as the same control the
 *  docked panel shows via Draggable's `renderHeaderControls` — see the
 *  class-doc comment on Draggable's `BuiltInHeaderControls` in draggable.tsx. */
function DockToSideButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip content="Dock to side" placement="bottom">
      <button
        type="button"
        onClick={onClick}
        aria-label="Dock to side"
        className="flex h-6 w-6 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:text-lyra-fg-default hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
      >
        <PanelRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

function ListHeader({
  search,
  onSearchChange,
  dockButton,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  dockButton?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 px-3 pb-2 pt-3">
      <div className="flex items-center justify-between">
        <p className="lyra-heading-md text-lyra-fg-default">Chat</p>
        {dockButton}
      </div>
      <SearchInput value={search} onValueChange={onSearchChange} placeholder="Search employees" />
    </div>
  );
}

function ChatHeader({
  employee,
  onBack,
  onCall,
  dockButton,
}: {
  employee: DirectoryAgent;
  onBack: () => void;
  onCall: () => void;
  dockButton?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-lyra-border-subtle px-3 py-2.5">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to messages"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
      <EmployeeAvatar employee={employee} size="h-8 w-8" />
      <div className="min-w-0 flex-1">
        <p className="lyra-body-sm-emphasis truncate text-lyra-fg-default">{employee.name}</p>
        {employee.subtitle && <p className="lyra-body-xs truncate text-lyra-fg-secondary">{employee.subtitle}</p>}
      </div>
      <ActionIconButton title={`Call ${employee.name}`} onClick={onCall}>
        <Phone className="h-4 w-4" strokeWidth={1.5} />
      </ActionIconButton>
      {dockButton}
    </div>
  );
}

function ChatMessages({ employee, messages }: { employee: DirectoryAgent; messages: InternalChatMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center px-4 text-center lyra-body-sm text-lyra-fg-secondary">
        No messages yet with {employee.name.split(" ")[0]}. Say hello!
      </div>
    );
  }
  return (
    <div className="flex min-h-[240px] flex-col gap-2 px-3 py-3">
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

/** Shared list/chat body — the actual scrollable "content" area, same in
 *  both popover and docked presentations. */
function ChatBody({ view, search, favoriteIds, onToggleFavorite, onViewChange, threads }: InternalChatSharedProps) {
  const query = search.trim().toLowerCase();
  const filtered = DIRECTORY_AGENTS.filter((employee) => employee.name.toLowerCase().includes(query));
  const favorites = filtered.filter((employee) => favoriteIds.includes(employee.id));
  const others = filtered.filter((employee) => !favoriteIds.includes(employee.id));
  const activeEmployee = view.kind === "chat" ? DIRECTORY_AGENTS.find((employee) => employee.id === view.employeeId) : undefined;

  if (view.kind === "chat") {
    return activeEmployee ? <ChatMessages employee={activeEmployee} messages={threads[activeEmployee.id] ?? []} /> : null;
  }

  return (
    <div className="flex flex-col pb-2">
      {favorites.length > 0 && (
        <>
          <p className="px-4 pb-1 pt-2 lyra-body-xs-emphasis uppercase tracking-wide text-lyra-fg-secondary">Favorites</p>
          {favorites.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              favorited
              onToggleFavorite={() => onToggleFavorite(employee.id)}
              onOpenChat={() => onViewChange({ kind: "chat", employeeId: employee.id })}
            />
          ))}
        </>
      )}
      {others.length > 0 && (
        <>
          <p className="px-4 pb-1 pt-3 lyra-body-xs-emphasis uppercase tracking-wide text-lyra-fg-secondary">
            {favorites.length > 0 ? "All employees" : "Employees"}
          </p>
          {others.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              favorited={false}
              onToggleFavorite={() => onToggleFavorite(employee.id)}
              onOpenChat={() => onViewChange({ kind: "chat", employeeId: employee.id })}
            />
          ))}
        </>
      )}
      {favorites.length === 0 && others.length === 0 && (
        <p className="px-4 py-6 text-center lyra-body-sm text-lyra-fg-secondary">No employees found.</p>
      )}
    </div>
  );
}

/* ── Trigger + Popover (default, undocked presentation) ── */

export interface InternalChatTriggerProps extends InternalChatSharedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docked: boolean;
  onDock: () => void;
}

export function InternalChatTrigger({ open, onOpenChange, docked, onDock, ...shared }: InternalChatTriggerProps) {
  const { view, onViewChange, search, onSearchChange, draft, onDraftChange, onSend, onCall } = shared;
  const activeEmployee = view.kind === "chat" ? DIRECTORY_AGENTS.find((employee) => employee.id === view.employeeId) : undefined;

  const trigger = (
    <button
      type="button"
      aria-label="Internal Chat"
      aria-expanded={open}
      onClick={() => onOpenChange(!open)}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-lyra-lg text-lyra-fg-default transition-colors",
        "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
        open && "bg-lyra-state-hover"
      )}
    >
      <MessagesSquare className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );

  // Docked mode renders its own panel elsewhere in the layout (see
  // InternalChatDockedPanel) — this trigger just toggles that panel's
  // visibility, with no popover of its own.
  if (docked) {
    return (
      <Tooltip content="Internal Chat" placement="bottom" asLabel>
        {trigger}
      </Tooltip>
    );
  }

  return (
    <Tooltip content="Internal Chat" placement="bottom" asLabel>
      <span className="inline-flex">
        <Popover
          open={open}
          onOpenChange={onOpenChange}
          placement="bottom"
          align="end"
          sideOffset={10}
          maxWidth="380px"
          maxHeight="var(--radix-popper-available-height, 600px)"
          className="w-[380px]"
          header={
            view.kind === "list" ? (
              <ListHeader search={search} onSearchChange={onSearchChange} dockButton={<DockToSideButton onClick={onDock} />} />
            ) : activeEmployee ? (
              <ChatHeader
                employee={activeEmployee}
                onBack={() => onViewChange({ kind: "list" })}
                onCall={() => onCall(activeEmployee)}
                dockButton={<DockToSideButton onClick={onDock} />}
              />
            ) : undefined
          }
          footer={view.kind === "chat" ? <ChatComposer draft={draft} onDraftChange={onDraftChange} onSend={onSend} /> : undefined}
          content={<ChatBody {...shared} />}
        >
          {trigger}
        </Popover>
      </span>
    </Tooltip>
  );
}

/* ── Docked panel (right-docked layout row, alongside AI Assistant/Notifications) ── */

export interface InternalChatDockedPanelProps extends InternalChatSharedProps {
  open: boolean;
  onClose: () => void;
  onVariantChange: (variant: DraggableVariant) => void;
  onWidthChange: (width: number) => void;
  onResizeStateChange: (resizing: boolean) => void;
  defaultWidth: number;
}

export function InternalChatDockedPanel({
  open,
  onClose,
  onVariantChange,
  onWidthChange,
  onResizeStateChange,
  defaultWidth,
  ...shared
}: InternalChatDockedPanelProps) {
  const { view, onViewChange, onCall } = shared;
  const activeEmployee = view.kind === "chat" ? DIRECTORY_AGENTS.find((employee) => employee.id === view.employeeId) : undefined;

  return (
    <Draggable
      variant="docked"
      defaultWidth={defaultWidth}
      minWidth={320}
      maxWidth={560}
      onVariantChange={onVariantChange}
      onWidthChange={onWidthChange}
      onResizeStateChange={onResizeStateChange}
      className="h-full rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg"
      renderHeaderControls={(controls: DraggableHeaderControls) => (
        <div className="flex items-center justify-between px-3 pb-2 pt-3">
          {view.kind === "list" ? <p className="lyra-heading-md text-lyra-fg-default">Chat</p> : <span />}
          <div className="flex items-center gap-1">
            <DockButtonFromControls controls={controls} />
            <CloseButton onClick={onClose} />
          </div>
        </div>
      )}
    >
      {view.kind === "chat" && activeEmployee ? (
        <ChatHeader
          employee={activeEmployee}
          onBack={() => onViewChange({ kind: "list" })}
          onCall={() => onCall(activeEmployee)}
        />
      ) : (
        <div className="px-3 pb-2">
          <SearchInput value={shared.search} onValueChange={shared.onSearchChange} placeholder="Search employees" />
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ChatBody {...shared} />
      </div>
      {view.kind === "chat" && (
        <ChatComposer draft={shared.draft} onDraftChange={shared.onDraftChange} onSend={shared.onSend} />
      )}
    </Draggable>
  );
}

function DockButtonFromControls({ controls }: { controls: DraggableHeaderControls }) {
  return (
    <Tooltip content="Undock" placement="bottom">
      <button {...controls.dockButtonProps}>{controls.dockIcon}</button>
    </Tooltip>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close Chat"
      className="flex h-6 w-6 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:text-lyra-fg-default hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
    >
      <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
