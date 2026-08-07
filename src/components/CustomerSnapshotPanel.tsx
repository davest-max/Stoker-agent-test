import { useState } from "react";
import { Chip, Select, SearchInput, Input, Label, Button, ActionIconButton, Tooltip, TabList, Tab, type ChannelType } from "@nicecxone/lyra-ui";
import { Clock, ChevronDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContactActionButtons } from "@/components/DirectoryPage";
import { TranscriptThread } from "@/components/CustomerInteractionPanel";
import type { DirectoryCustomer, CustomerNote, CustomerInteractionHistoryEntry, CustomerTicket } from "@/data/directory";

const CHANNEL_LABEL: Record<ChannelType, string> = {
  voice: "Call",
  email: "Email",
  chat: "Chat",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

const TICKET_STATUS_COLOR: Record<CustomerTicket["status"], "green" | "orange" | "slate"> = {
  Open: "orange",
  Pending: "slate",
  Resolved: "green",
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className="lyra-body-xs-emphasis uppercase tracking-wide text-lyra-fg-secondary">{children}</p>;
}

const ACCOUNT_STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

/** One CRM field's read-only display — label caption (the real `Label`
 *  component, not `SectionHeading`, so it matches the edit-mode `Input`/
 *  `Select` it swaps places with exactly) + plain value text. Every field
 *  renders this way by default now, Address included — see
 *  `OverviewSection`'s own class doc comment on why the earlier
 *  always-an-Input treatment got walked back. */
function FieldDisplay({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <Label label={label} />
      <span className="lyra-body-md text-lyra-fg-default">{value}</span>
    </div>
  );
}

/** The CRM fields' editable shape while `OverviewSection`'s edit mode is
 *  active — always strings (even Status, which is really a fixed-value
 *  Select) so a single flat draft object can back every field's
 *  `value`/`onChange` uniformly. Cast back to `DirectoryCustomer`'s real
 *  types on save (see `handleSave` below). */
interface EditableCustomerFields {
  address: string;
  customerSince: string;
  company: string;
  accountOwner: string;
  language: string;
  timezone: string;
  accountStatus: string;
}

function toEditableFields(customer: DirectoryCustomer): EditableCustomerFields {
  return {
    address: customer.address ?? "",
    customerSince: customer.customerSince ?? "",
    company: customer.company ?? "",
    accountOwner: customer.accountOwner ?? "",
    language: customer.language ?? "",
    timezone: customer.timezone ?? "",
    accountStatus: customer.accountStatus ?? "Active",
  };
}

/* ── Overview ──
 * Profile card (avatar/name + CRM-style field grid + contact icons), then
 * the latest agent note and the last interaction as two separate recap
 * cards. The freeform "about" blurb, the "Customer since… past
 * interactions" caption, and the "Prefers {channel}" pill this used to show
 * are gone — customerSince now lives in the field grid like any other CRM
 * field, and preferredChannel/about have no replacement (removed from the
 * data model too, see directory.ts). "Latest Note" is `notes[0]` — this app
 * has no separate AI-generated summary concept, so the most recent agent
 * note doubles as the closest thing to one.
 *
 * The field grid itself has two modes, toggled by the pencil/Cancel+Save
 * control row above it:
 *   - Default: every field (Address included) is `FieldDisplay` — a plain
 *     label + value, no input chrome at all. An earlier version of this
 *     rendered every field except Address as a real, `readonly` lyra-ui
 *     `Input`/`Select` specifically to look like the edit field it might
 *     become — now that editing is real (see below), that bordered-box
 *     treatment only shows up when a field is actually editable, not as a
 *     permanent, inert decoration on a view a lot of interactions never
 *     touch.
 *   - Editing: every field becomes a real `Input` (or `Select` for
 *     Status — a fixed set of values, not freeform text, same distinction
 *     a real edit form would make), backed by local `draft` state so
 *     Cancel can discard changes without touching the customer record.
 *     Save calls `onUpdateCustomer`, which lives in AgentNextGenPage next
 *     to `customerNotes` — same "session-persisted, not on
 *     DIRECTORY_CUSTOMERS itself" reasoning a note already uses. */
function OverviewSection({
  customer,
  notes,
  onContactAction,
  onUpdateCustomer,
}: {
  customer: DirectoryCustomer;
  notes: CustomerNote[];
  onContactAction: (channel: ChannelType) => void;
  onUpdateCustomer: (fields: Partial<DirectoryCustomer>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditableCustomerFields>(() => toEditableFields(customer));

  const displayFieldCandidates: { label: string; value?: string; span?: boolean }[] = [
    { label: "Address", value: customer.address, span: true },
    { label: "Customer Since", value: customer.customerSince },
    { label: "Company", value: customer.company },
    { label: "Account Owner", value: customer.accountOwner },
    { label: "Status", value: customer.accountStatus },
    { label: "Language", value: customer.language },
    { label: "Timezone", value: customer.timezone },
  ];
  const displayFields = displayFieldCandidates.filter(
    (field): field is { label: string; value: string; span?: boolean } => Boolean(field.value)
  );

  const handleStartEdit = () => {
    setDraft(toEditableFields(customer));
    setEditing(true);
  };
  const handleCancel = () => setEditing(false);
  const handleSave = () => {
    onUpdateCustomer({
      address: draft.address.trim() || undefined,
      customerSince: draft.customerSince.trim() || undefined,
      company: draft.company.trim() || undefined,
      accountOwner: draft.accountOwner.trim() || undefined,
      language: draft.language.trim() || undefined,
      timezone: draft.timezone.trim() || undefined,
      accountStatus: draft.accountStatus === "Inactive" ? "Inactive" : "Active",
    });
    setEditing(false);
  };
  const updateDraft = (field: keyof EditableCustomerFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-lyra-lg bg-lyra-bg-surface-shell p-4">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-full lyra-body-md-emphasis", customer.avatarClassName)}>
              {customer.initials}
            </div>
            {customer.tier === "VIP" && (
              <Chip
                color="orange"
                variant="solid"
                className="absolute -right-1 -top-1 h-4 px-1.5 lyra-body-sm-emphasis leading-none"
              >
                VIP
              </Chip>
            )}
            {/* Account status dot — every customer gets this (unlike the VIP
             *  chip above, which only shows for VIP tier), same bottom-right
             *  presence-dot placement/border-notch treatment as Slack/Teams
             *  avatars use. The border color matches this card's own
             *  background (bg-lyra-bg-surface-shell) so it reads as a cutout
             *  rather than a hard-edged circle sitting on top of the avatar. */}
            {customer.accountStatus && (
              <Tooltip content={`Account status: ${customer.accountStatus}`} placement="bottom">
                <span
                  role="img"
                  aria-label={`Account status: ${customer.accountStatus}`}
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-lyra-bg-surface-shell",
                    customer.accountStatus === "Active" ? "bg-lyra-status-success-strong" : "bg-lyra-fg-disabled"
                  )}
                />
              </Tooltip>
            )}
          </div>
          <p className="lyra-heading-sm min-w-0 flex-1 truncate text-lyra-fg-default">{customer.name}</p>
          <div className="shrink-0">
            <ContactActionButtons channels={customer.channels} onAction={onContactAction} />
          </div>
        </div>

        {/* Edit toggle — same spot whether it's the pencil or Cancel/Save,
         *  so the agent never has to look somewhere else once editing starts. */}
        <div className="flex items-center justify-end gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
              <Button size="sm" onClick={handleSave}>Save</Button>
            </>
          ) : (
            <ActionIconButton title="Edit customer info" size="sm" onClick={handleStartEdit}>
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            </ActionIconButton>
          )}
        </div>

        {editing ? (
          <div className="grid grid-cols-2 gap-3">
            <Input className="col-span-2" label="Address" value={draft.address} onChange={updateDraft("address")} />
            <Input label="Customer Since" value={draft.customerSince} onChange={updateDraft("customerSince")} />
            <Input label="Company" value={draft.company} onChange={updateDraft("company")} />
            <Input label="Account Owner" value={draft.accountOwner} onChange={updateDraft("accountOwner")} />
            <Select
              label="Status"
              value={draft.accountStatus}
              onValueChange={(v) => setDraft((prev) => ({ ...prev, accountStatus: v }))}
              options={ACCOUNT_STATUS_OPTIONS}
            />
            <Input label="Language" value={draft.language} onChange={updateDraft("language")} />
            <Input label="Timezone" value={draft.timezone} onChange={updateDraft("timezone")} />
          </div>
        ) : (
          displayFields.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {displayFields.map((field) => (
                <FieldDisplay key={field.label} label={field.label} value={field.value} className={field.span ? "col-span-2" : undefined} />
              ))}
            </div>
          )
        )}
      </div>

      <div className="border-t border-lyra-border-subtle" />

      <div className="flex flex-col gap-2">
        <SectionHeading>Latest Note</SectionHeading>
        {notes.length > 0 ? (
          <div className="flex flex-col gap-1 rounded-lyra-md bg-lyra-bg-surface-container-subtle p-3">
            <p className="lyra-body-xs-emphasis text-lyra-fg-secondary">
              {notes[0].author} · {notes[0].timestamp}
            </p>
            <p className="lyra-body-sm text-lyra-fg-default">&quot;{notes[0].text}&quot;</p>
          </div>
        ) : (
          <p className="lyra-body-sm text-lyra-fg-secondary">No notes on record.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeading>Last Interaction</SectionHeading>
        {customer.lastInteraction ? (
          <HistoryEntryCard entry={customer.lastInteraction} />
        ) : (
          <p className="lyra-body-sm text-lyra-fg-secondary">No prior interactions on record.</p>
        )}
      </div>
    </div>
  );
}

/** One past-interaction card — shared by Overview's "Last Interaction" and
 *  the History tab's full list, so the two never drift out of sync on
 *  what a single entry actually shows. */
function HistoryEntryCard({ entry }: { entry: CustomerInteractionHistoryEntry }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lyra-md bg-lyra-bg-surface-container-subtle p-3">
      <div className="flex items-center gap-2 lyra-body-xs text-lyra-fg-secondary">
        <Clock className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
        {entry.date} · {CHANNEL_LABEL[entry.channel]}
        {entry.outcome && (
          <Chip color="green" variant="subtle" className="ml-auto h-5 px-1.5 lyra-body-xs">
            {entry.outcome}
          </Chip>
        )}
      </div>
      <p className="lyra-body-sm text-lyra-fg-default">{entry.summary}</p>
      {(entry.caseId || entry.handledBy) && (
        <p className="lyra-body-xs text-lyra-fg-secondary">
          {entry.caseId}
          {entry.caseId && entry.handledBy && " · "}
          {entry.handledBy && <>Handled by {entry.handledBy}</>}
        </p>
      )}
    </div>
  );
}

/* ── History ──
 * Plain chronological list — every entry in `history`, most recent first
 * (seed data is already ordered that way). */
function HistorySection({ history }: { history: CustomerInteractionHistoryEntry[] }) {
  if (history.length === 0) {
    return <p className="lyra-body-sm text-lyra-fg-secondary">No prior interactions on record.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {history.map((entry, i) => (
        <HistoryEntryCard key={i} entry={entry} />
      ))}
    </div>
  );
}

/* ── Interactions ──
 * Same `history` records as the History tab above — deliberately not a
 * second, divergent data source (nothing in this app tracks "interactions"
 * as something distinct from "history" yet). Where History is a plain,
 * static recap list, Interactions is the working view: sortable (by date or
 * channel type), searchable, and — where `entry.transcript` exists — each
 * row expands in place into the real chat/email thread or voice transcript,
 * via the same `TranscriptThread` renderer the live interaction panel uses
 * (see CustomerInteractionPanel.tsx), rather than a second transcript
 * viewer built just for history. */

type InteractionSort = "date" | "channel";

/** Channel-sort order — arbitrary but fixed, so re-sorting by channel
 *  doesn't reshuffle on every render; matches CHANNEL_LABEL's own voice-
 *  first ordering above. */
const CHANNEL_SORT_ORDER: ChannelType[] = ["voice", "chat", "email", "sms", "whatsapp"];

/** A stable per-entry key for expand-state tracking — history entries have
 *  no id of their own, but caseId is unique in practice across the seed
 *  data; falls back to a date+channel+index composite for an entry that
 *  somehow lacks one, so expand state never collides across rows. */
function interactionKey(entry: CustomerInteractionHistoryEntry, index: number): string {
  return entry.caseId ?? `${entry.date}-${entry.channel}-${index}`;
}

function InteractionRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: CustomerInteractionHistoryEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasTranscript = Boolean(entry.transcript);
  return (
    <div className="overflow-hidden rounded-lyra-md bg-lyra-bg-surface-container-subtle">
      <button
        type="button"
        onClick={onToggle}
        disabled={!hasTranscript}
        className="flex w-full items-start gap-2 p-3 text-left disabled:cursor-default"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2 lyra-body-xs text-lyra-fg-secondary">
            <Clock className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
            {entry.date} · {CHANNEL_LABEL[entry.channel]}
            {entry.outcome && (
              <Chip color="green" variant="subtle" className="ml-auto h-5 px-1.5 lyra-body-xs">
                {entry.outcome}
              </Chip>
            )}
          </div>
          <p className="lyra-body-sm text-lyra-fg-default">{entry.summary}</p>
          {(entry.caseId || entry.handledBy) && (
            <p className="lyra-body-xs text-lyra-fg-secondary">
              {entry.caseId}
              {entry.caseId && entry.handledBy && " · "}
              {entry.handledBy && <>Handled by {entry.handledBy}</>}
            </p>
          )}
        </div>
        {hasTranscript && (
          <ChevronDown
            className={cn("mt-0.5 h-4 w-4 shrink-0 text-lyra-fg-secondary transition-transform", expanded && "rotate-180")}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        )}
      </button>
      {expanded && entry.transcript && (
        <div className="border-t border-lyra-border-subtle bg-lyra-bg-surface-base px-3 py-3">
          <div className="flex max-h-80 flex-col gap-4 overflow-y-auto">
            <TranscriptThread
              messages={entry.transcript.messages}
              isVoiceCall={entry.channel === "voice"}
              isEmailChannel={entry.channel === "email"}
              callEvents={entry.transcript.callEvents}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InteractionsSection({ history }: { history: CustomerInteractionHistoryEntry[] }) {
  const [sortBy, setSortBy] = useState<InteractionSort>("date");
  const [search, setSearch] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  if (history.length === 0) {
    return <p className="lyra-body-sm text-lyra-fg-secondary">No prior interactions on record.</p>;
  }

  const query = search.trim().toLowerCase();
  const filtered = query
    ? history.filter((entry) =>
        [entry.summary, entry.caseId, entry.handledBy, CHANNEL_LABEL[entry.channel]]
          .some((field) => field?.toLowerCase().includes(query))
      )
    : history;

  // "date": seed data is already ordered most-recent-first, same as History
  // above — nothing to re-sort. "channel": grouped by CHANNEL_SORT_ORDER,
  // most-recent-first within each channel (filter/sort both run against the
  // already-ordered array, so that relative order survives the re-sort).
  const sorted = sortBy === "channel"
    ? [...filtered].sort((a, b) => CHANNEL_SORT_ORDER.indexOf(a.channel) - CHANNEL_SORT_ORDER.indexOf(b.channel))
    : filtered;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search interactions…"
          aria-label="Search interactions"
          className="flex-1"
        />
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as InteractionSort)}
          options={[
            { value: "date", label: "Sort: Date" },
            { value: "channel", label: "Sort: Channel" },
          ]}
          className="w-36 shrink-0"
        />
      </div>
      {sorted.length === 0 ? (
        <p className="lyra-body-sm text-lyra-fg-secondary">No interactions match your search.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((entry, i) => {
            const key = interactionKey(entry, i);
            return (
              <InteractionRow
                key={key}
                entry={entry}
                expanded={expandedKey === key}
                onToggle={() => setExpandedKey((prev) => (prev === key ? null : key))}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Notes ──
 * Unchanged from the original single-view panel — just its own tab now
 * instead of sharing space with the profile card. */
function NotesSection({
  notes,
  onAddNote,
}: {
  notes: CustomerNote[];
  onAddNote: (text: string) => void;
}) {
  const [draftNote, setDraftNote] = useState("");
  const handleAddNote = () => {
    const text = draftNote.trim();
    if (!text) return;
    onAddNote(text);
    setDraftNote("");
  };
  return (
    <div className="flex flex-col gap-3">
      {notes.length > 0 && (
        <div className="flex flex-col gap-2">
          {notes.map((note) => (
            <div key={note.id} className="flex flex-col gap-0.5">
              <p className="lyra-body-xs-emphasis text-lyra-fg-secondary">
                {note.author} · {note.timestamp}
              </p>
              <p className="lyra-body-sm text-lyra-fg-default">&quot;{note.text}&quot;</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <textarea
          value={draftNote}
          onChange={(e) => setDraftNote(e.target.value)}
          placeholder="Add a note about this customer…"
          rows={2}
          className="w-full resize-none rounded-lyra-sm border border-lyra-border-default bg-lyra-bg-control px-2.5 py-2 lyra-body-sm text-lyra-fg-default placeholder:text-lyra-fg-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
        />
        <button
          type="button"
          onClick={handleAddNote}
          disabled={!draftNote.trim()}
          className="self-end rounded-lyra-sm px-2.5 py-1 lyra-body-sm-emphasis text-lyra-fg-action transition-colors hover:bg-lyra-state-hover disabled:pointer-events-none disabled:opacity-40"
        >
          Add note
        </button>
      </div>
    </div>
  );
}

/* ── Tickets ──
 * New concept — nothing else in this app tracks support tickets yet, so
 * `CustomerTicket` (directory.ts) is placeholder seed data rather than
 * derived from something already modeled, same as History/Interactions
 * above lean on `lastInteraction`. */
function TicketsSection({ tickets }: { tickets: CustomerTicket[] }) {
  if (tickets.length === 0) {
    return <p className="lyra-body-sm text-lyra-fg-secondary">No tickets on record.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="flex flex-col gap-1.5 rounded-lyra-md bg-lyra-bg-surface-container-subtle p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="lyra-body-sm-emphasis text-lyra-fg-default">{ticket.subject}</span>
            <Chip color={TICKET_STATUS_COLOR[ticket.status]} variant="subtle" className="h-5 shrink-0 px-1.5 lyra-body-xs">
              {ticket.status}
            </Chip>
          </div>
          <p className="lyra-body-xs text-lyra-fg-secondary">{ticket.caseId} · {ticket.date}</p>
        </div>
      ))}
    </div>
  );
}

/* ── CustomerProfilePanel ──
 * The Customer Profile panel's real content — five tabs (Overview/History/
 * Interactions/Notes/Tickets) instead of the one scrolling view this used
 * to be. `collapsed` switches how the tab switcher itself renders (not the
 * tab content, which is identical either way):
 *   - `collapsed` (the default slid-out width, docked beside the
 *     conversation) — a `Select` dropdown, since a full 5-tab row doesn't
 *     fit a panel that narrow without wrapping or truncating labels.
 *   - not collapsed (maximized — the panel takes over the whole center
 *     column) — a real `TabList`/`Tab` row, since there's finally room for
 *     one and it reads better as primary navigation once this is the main
 *     thing on screen. */
export interface CustomerProfilePanelProps {
  customer?: DirectoryCustomer;
  notes: CustomerNote[];
  onAddNote: (text: string) => void;
  onContactAction: (channel: ChannelType) => void;
  /** Saves an edit made in the Overview tab's edit mode — see
   *  `OverviewSection`'s own class doc comment. */
  onUpdateCustomer: (fields: Partial<DirectoryCustomer>) => void;
  /** See the class doc comment above. */
  collapsed: boolean;
}

type ProfileTabId = "overview" | "history" | "interactions" | "notes" | "tickets";

const PROFILE_TABS: { id: ProfileTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "history", label: "History" },
  { id: "interactions", label: "Interactions" },
  { id: "notes", label: "Notes" },
  { id: "tickets", label: "Tickets" },
];

export function CustomerProfilePanel({ customer, notes, onAddNote, onContactAction, onUpdateCustomer, collapsed }: CustomerProfilePanelProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabId>("overview");

  if (!customer) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center lyra-body-sm text-lyra-fg-secondary">
        No customer profile linked to this interaction.
      </div>
    );
  }

  const history = customer.history ?? (customer.lastInteraction ? [customer.lastInteraction] : []);
  const tickets = customer.tickets ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-lyra-border-subtle px-4 py-2">
        {collapsed ? (
          <Select
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ProfileTabId)}
            options={PROFILE_TABS.map((tab) => ({ value: tab.id, label: tab.label }))}
          />
        ) : (
          <TabList className="border-b-0">
            {PROFILE_TABS.map((tab) => (
              <Tab
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Tab>
            ))}
          </TabList>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "overview" && (
          <OverviewSection customer={customer} notes={notes} onContactAction={onContactAction} onUpdateCustomer={onUpdateCustomer} />
        )}
        {activeTab === "history" && <HistorySection history={history} />}
        {activeTab === "interactions" && <InteractionsSection history={history} />}
        {activeTab === "notes" && <NotesSection notes={notes} onAddNote={onAddNote} />}
        {activeTab === "tickets" && <TicketsSection tickets={tickets} />}
      </div>
    </div>
  );
}
