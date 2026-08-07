import { createPortal } from "react-dom";
import {
  SearchInput,
  FavoriteButton,
  ListItem,
  ActionIconButton,
  ConversationMessage,
  ContainerHeader,
  Tooltip,
  Draggable,
  type DraggableVariant,
  type DraggableHeaderControls,
} from "@nicecxone/lyra-ui";
import { MessageSquareText, ChevronLeft, ChevronRight, Phone, Send, GripVertical, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIRECTORY_AGENTS, contactMatchesQuery, type DirectoryAgent } from "@/data/directory";
import type { InternalChatMessage } from "@/data/internalChat";

/* ── InternalChatPopover ──
 * Agent-to-agent / agent-to-supervisor / employee-to-employee chat. The
 * trigger icon sits in the app header next to NotificationsBell (same h-10
 * w-10 rounded-lyra-lg styling so the two read as one icon group). Reuses
 * DIRECTORY_AGENTS as the employee roster rather than inventing a parallel
 * one (a supervisor entry was added there for the agent-to-supervisor case).
 *
 * Two presentations, sharing one lifted state (open/docked/view/etc. — see
 * below) — same two-state model as AI Assistant/Notifications, not a third
 * "anchored popover" state in between:
 *   - Float (`InternalChatFloatPanel`, default) — a real `Draggable
 *     variant="float"` window (same portal-to-body pattern as
 *     `OutcomePanel`), draggable anywhere via its own grip, with a
 *     "Dock to side" button in its header. Opened from the header icon, it
 *     starts near the top-right of the interaction area (see
 *     `AgentNextGenPage`'s `getChatFloatPosition`); opened via
 *     `openInternalChatWith` (New Outbound's Agents-group chat icon) it
 *     starts near wherever it was clicked instead. Either way it's the same
 *     component and the same dock/grip affordances — nothing about *how* it
 *     was opened changes what it can do once it's up.
 *   - Docked — a panel in the layout's docked-panel row, same slot AI
 *     Assistant/Notifications use, via Draggable variant="docked". Its own
 *     "Undock" button (Draggable's built-in dock toggle) pops it back into
 *     the float presentation above, landing wherever
 *     `getChatFloatPosition` computes rather than snapping back to a
 *     remembered spot — this app doesn't bother remembering exact float
 *     coordinates across a dock/undock cycle the way it might for a panel
 *     that's dragged around constantly.
 *
 * All state (open, docked, view-stack, favorites, threads, draft) is lifted
 * to AgentNextGenPage — the trigger (header) and the docked/float panels are
 * different mount points for the same data, so it can't live locally in any
 * one of them without losing state when switching between presentations
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
 *  both float and docked presentations. */
function ChatBody({ view, search, favoriteIds, onToggleFavorite, onViewChange, threads }: InternalChatSharedProps) {
  const filtered = DIRECTORY_AGENTS.filter((employee) => contactMatchesQuery(employee, search));
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

/* ── Trigger ──
 * Just the header icon button now — it no longer renders any panel content
 * of its own (see the class doc comment above on why the old anchored-
 * popover presentation is gone). Same "button toggles open state, a
 * separately-rendered float/docked block does the rest" pattern the AI
 * Assistant/Notifications header triggers already use. */

export interface InternalChatTriggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InternalChatTrigger({ open, onOpenChange }: InternalChatTriggerProps) {
  return (
    <Tooltip content="Internal Chat" placement="bottom" asLabel>
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
        <MessageSquareText className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
      </button>
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
  /** Takes chat over the whole content column — see `InternalChatMaximizedPanel`.
   *  Omit to hide the Maximize button entirely (not currently done anywhere,
   *  but keeps this panel usable stand-alone/in Storybook without it). */
  onMaximize?: () => void;
}

export function InternalChatDockedPanel({
  open,
  onClose,
  onVariantChange,
  onWidthChange,
  onResizeStateChange,
  defaultWidth,
  onMaximize,
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
        <ChatPanelHeader controls={controls} view={view} onClose={onClose} onMaximize={onMaximize} />
      )}
    >
      {view.kind === "chat" && activeEmployee ? (
        <ChatHeader
          employee={activeEmployee}
          onBack={() => onViewChange({ kind: "list" })}
          onCall={() => onCall(activeEmployee)}
        />
      ) : (
        <div className="px-4 py-3">
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

/* ── Float panel (the default undocked presentation — see the class doc
 *  comment above). Same `Draggable variant="float"` + portal-to-body
 *  pattern `OutcomePanel` already established. Draggable anywhere via its
 *  own grip, with a "Dock to side" button (via the shared
 *  `DockButtonFromControls` helper, also used by the docked panel below)
 *  so it's a genuine peer of the docked presentation, not a dead-end —
 *  opened from the header icon (default position, see
 *  `AgentNextGenPage`'s `getChatFloatPosition`) or from
 *  `openInternalChatWith` (New Outbound's Agents-group chat icon, opened
 *  near wherever it was clicked instead), either way it can still be
 *  dragged around or docked from here. ── */

export interface InternalChatFloatPanelProps extends InternalChatSharedProps {
  /** Viewport coordinates for the panel's top-left corner — the caller is
   *  responsible for clamping this to the viewport (see
   *  `AgentNextGenPage`'s `getChatFloatPosition`). */
  position: { top: number; left: number };
  onClose: () => void;
  onDock: () => void;
  /** See `InternalChatDockedPanelProps.onMaximize` — same "auto-dock, then
   *  maximize" handler is passed to both presentations; the caller (not
   *  this component) is responsible for docking first when invoked while
   *  floating. */
  onMaximize?: () => void;
}

const CHAT_FLOAT_WIDTH = 380;
const CHAT_FLOAT_HEIGHT = 560;

export function InternalChatFloatPanel({ position, onClose, onDock, onMaximize, ...shared }: InternalChatFloatPanelProps) {
  const { view, onViewChange, onCall } = shared;
  const activeEmployee = view.kind === "chat" ? DIRECTORY_AGENTS.find((employee) => employee.id === view.employeeId) : undefined;

  return createPortal(
    <div style={{ position: "fixed", top: position.top, left: position.left, zIndex: 10000 }}>
      <Draggable
        variant="float"
        onVariantChange={(v) => { if (v === "docked") onDock(); }}
        defaultWidth={CHAT_FLOAT_WIDTH}
        defaultHeight={CHAT_FLOAT_HEIGHT}
        minWidth={320}
        minHeight={420}
        className="rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg"
        renderHeaderControls={(controls) => (
          <ChatPanelHeader controls={controls} view={view} onClose={onClose} onMaximize={onMaximize} />
        )}
      >
        {view.kind === "chat" && activeEmployee ? (
          <ChatHeader employee={activeEmployee} onBack={() => onViewChange({ kind: "list" })} onCall={() => onCall(activeEmployee)} />
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
    </div>,
    document.body
  );
}

/** Header row for both presentations, built from real `ContainerHeader` —
 *  same composition `DraggablePanel` uses for Directory/Schedule (icon =
 *  grip in float mode / spacer in docked mode, actions = dock button,
 *  built-in close button via `onClose`, divider visible via `bordered`'s
 *  own default). Title is blanked in chat view since `ChatHeader` below
 *  already carries the active employee's name — matches the prior
 *  hand-rolled header's behavior, just via ContainerHeader's own "omit
 *  title if not provided" handling instead of a manual conditional. */
function ChatPanelHeader({
  controls,
  view,
  onClose,
  onMaximize,
}: {
  controls: DraggableHeaderControls;
  view: ChatView;
  onClose: () => void;
  /** See `InternalChatDockedPanelProps.onMaximize` — renders before the
   *  dock toggle, same ordering `DraggablePanel`'s own `headerActions` slot
   *  uses for the Directory/Schedule/Custom Workspace Maximize buttons. */
  onMaximize?: () => void;
}) {
  return (
    <ContainerHeader
      title={view.kind === "list" ? "Internal Chat" : undefined}
      icon={
        controls.variant === "float" ? (
          <div {...controls.gripProps}>
            <GripVertical className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </div>
        ) : (
          <div className="w-4" aria-hidden="true" />
        )
      }
      actions={
        <>
          {onMaximize && (
            <ActionIconButton title="Maximize" onClick={onMaximize}>
              <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
            </ActionIconButton>
          )}
          <DockButtonFromControls controls={controls} />
        </>
      }
      onClose={onClose}
    />
  );
}

/* ── Maximized (full content-column takeover) ──
 * Reached via "Auto-dock, then maximize" — the policy chosen for chat since
 * it has no fixed spot in the content column to take over while floating
 * (unlike Contacts/Directory/Schedule/Custom Workspace, which are
 * `SlideInPage`-based and already have a "full" variant for this). Chat's
 * docked/float split is a separate lifted-state system from `SlideInPage`
 * (see this file's class doc comment), so rather than force it through that
 * component, this is a small hand-rolled equivalent: the same
 * ContainerHeader + Minimize2/Close composition every other maximize target
 * uses, wrapping the same ChatHeader/ChatBody/ChatComposer content the
 * docked/float panels already render — no new chat logic, just a third
 * mount point for it. */
export interface InternalChatMaximizedPanelProps extends InternalChatSharedProps {
  onMinimize: () => void;
  onClose: () => void;
}

export function InternalChatMaximizedPanel({ onMinimize, onClose, ...shared }: InternalChatMaximizedPanelProps) {
  const { view, onViewChange, onCall } = shared;
  const activeEmployee = view.kind === "chat" ? DIRECTORY_AGENTS.find((employee) => employee.id === view.employeeId) : undefined;

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-lyra-bg-surface-base">
      <ContainerHeader
        title={view.kind === "list" ? "Internal Chat" : undefined}
        actions={
          <ActionIconButton title="Minimize" onClick={onMinimize}>
            <Minimize2 className="h-4 w-4" strokeWidth={1.5} />
          </ActionIconButton>
        }
        onClose={onClose}
      />
      {view.kind === "chat" && activeEmployee ? (
        <ChatHeader
          employee={activeEmployee}
          onBack={() => onViewChange({ kind: "list" })}
          onCall={() => onCall(activeEmployee)}
        />
      ) : (
        <div className="px-4 py-3">
          <SearchInput value={shared.search} onValueChange={shared.onSearchChange} placeholder="Search employees" />
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ChatBody {...shared} />
      </div>
      {view.kind === "chat" && (
        <ChatComposer draft={shared.draft} onDraftChange={shared.onDraftChange} onSend={shared.onSend} />
      )}
    </div>
  );
}

/** Matches `DraggablePanel`'s own dock-toggle button exactly (icon, size,
 *  classes, tooltip content sourced from `dockButtonProps`'s own
 *  aria-label) — reused by both the docked panel (reads "Undock") and the
 *  float panel (reads "Dock to side"). */
function DockButtonFromControls({ controls }: { controls: DraggableHeaderControls }) {
  return (
    <Tooltip content={controls.dockButtonProps["aria-label"]} placement="bottom" asLabel>
      <button
        {...controls.dockButtonProps}
        className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-state-hover hover:text-lyra-fg-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
      >
        {controls.dockIcon}
      </button>
    </Tooltip>
  );
}
