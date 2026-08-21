import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableToolbar,
  TableFooter,
  FilterChip,
  filterChipVariants,
  Checkbox,
  Select,
  SearchInput,
  TagsInput,
  Button,
  ActionIconButton,
  Textarea,
  DateRangePicker,
  ToggleGroup,
  Popover,
  Menu,
  StatusBadge,
  KebabMenuButton,
  CHANNEL_ACCENT,
  type DateRange,
  type FilterChipOption,
  type MenuEntry,
} from "@nicecxone/lyra-ui";
import {
  RefreshCw,
  RotateCcw,
  FileSearch,
  ArrowDownLeft,
  ArrowUpRight,
  UserCheck,
  UserPlus,
  CircleCheck,
  Send,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT_CHANNEL_ICON, CONTACT_CHANNEL_LABEL } from "@/components/DirectoryPage";
import { TranscriptThread } from "@/components/CustomerInteractionPanel";
import {
  CONTACTS,
  CONTACT_SKILLS,
  CONTACT_ASSIGNEES,
  CONTACT_STATUSES,
  CONTACT_TAGS,
  CONTACT_CHANNELS,
  type Contact,
  type ContactStatus,
} from "@/data/contacts";

/* ── Interaction Search ──
 * (Named "Search Contacts" during development — renamed per an explicit
 * follow-up; the underlying `Contact`/`contacts.ts` data model and this
 * component's own file/export name are unchanged, since neither is
 * user-facing.)
 * A new nav destination (see AgentNextGenPage's `contacts` case in
 * renderSlideInContent) for finding ANY past contact across the whole app,
 * any status — distinct from the assignment rail, which only ever shows
 * the signed-in agent's own current work. Modeled on a reference legacy
 * "Search App" screenshot Dave shared, rebuilt with real lyra-ui pieces
 * rather than approximating the screenshot's own markup:
 *   - `TableToolbar` already has a built-in AND/OR/NOT "Query Builder"
 *     popover (`showAdvancedSearch`/`advancedSearchContent` — see its own
 *     "Toolbar — Query Builder" story in Table.stories.tsx) and declarative
 *     `filterDefs` that render as `FilterChip`s automatically. Both are used
 *     here rather than hand-rolling either.
 *   - `Table`/`TableFooter` provide the flex-based grid + pagination.
 *   - Row selection is plain `Checkbox` (lyra-ui has no built-in table
 *     selection API — see the `WithSelectedRows` story for the same
 *     indeterminate-header pattern used below).
 *
 * Per an explicit product discussion with Dave (three decisions, each with
 * options/trade-offs presented first):
 *   1. Nothing loads on page mount — no query runs until the agent either
 *      searches or applies a filter (`hasSearched` below). Cheapest, and
 *      matches what a page literally named "Interaction Search" implies.
 *   2. The toolbar offers BOTH a quick type+value search (name/ID/date/etc,
 *      see `SEARCH_TYPES`) AND the full Query Builder — not an either/or.
 *   3. Each bulk action (Assign to Me/Others, Change Status, Send Message)
 *      reveals an inline expanding row directly under the toolbar, matching
 *      the attached reference screenshot's own "Assign to Others" example —
 *      all four share one row shape (`BulkActionRow` below) even though
 *      their actual controls differ quite a bit in width/complexity.
 *
 * Scope note (flagged, not silently dropped): free-text fields like
 * Customer Name are deliberately left to the quick search instead of the
 * filter chips or Query Builder, since neither `FilterChip` nor the
 * standing toolbar filters (Status/Skill/Channel/Inbox Assignee/Assigned
 * Owner/Tags) handle freeform text — they need a fixed option list. Date
 * Created gets its own always-visible range control instead of living
 * inside the builder, since "between two dates" doesn't fit FilterChip's
 * value-list shape either. */

/* ── Query Builder ──
 * Originally scoped to a handful of invented enum-ish fields (Skill/Status/
 * Assignee/Tags/Channel), all shaped identically (one fixed picklist, one
 * implicit operator) so a plain `FilterChip` covered every one of them. Per
 * Dave's own list of the real backend query terms this product's search API
 * actually supports, replaced with that real field set instead — which
 * isn't uniformly shaped the way the placeholder set was:
 *   - `ownerAssignee`/`inboxAssignee` — two operators (IS/=) over the same
 *     agent picklist; per the grammar shown, IS reads as "is any of these"
 *     (multi-select) and = as "is exactly this one" (single-select) —
 *     both still just an agent picklist, so both still render as a real
 *     `FilterChip` (using its own built-in `operators` prop), just clamped
 *     to one selection when the operator is "=".
 *   - `caseId`/`threadId`/`threadIdOnExternalPlatform`/`content`/`title`/
 *     `author` — plain free-text equality, one operator, no fixed option
 *     list — `FilterChip` can't do freeform text, so these render through
 *     `TextConditionChip` below (styled to match `FilterChip` via the
 *     exported `filterChipVariants`, not a from-scratch look).
 *   - `status` — same shape as the assignee fields' "=" (one operator,
 *     single-select picklist) — stays a real `FilterChip`.
 *   - `customField[ident]` — the one genuinely dynamic field: an
 *     agent-typed identifier plus SIX operators (=, !=, IN, NOT IN, <, >)
 *     whose value control changes shape per operator (text / a tag list for
 *     IN·NOT IN / a number for < ·>). No lyra-ui primitive does "value
 *     control depends on the selected operator", so this is the one
 *     fully bespoke chip (`CustomFieldConditionChip` below) — still styled
 *     via `filterChipVariants` for visual consistency with its neighbors.
 *
 * Known gap, flagged rather than silently faked: this app's mock `Contact`
 * model doesn't track arbitrary custom fields per contact, so a
 * `customField[ident]` condition can't actually filter the demo dataset —
 * it renders and builds its criteria-description string correctly, it just
 * always matches. Real Case ID/Thread ID/Content/Title/Author values ARE
 * backed by real (if approximate) `Contact` fields — see `chipMatchesContact`
 * below for exactly which field each maps to. */

type QbLogic = "and" | "or" | "not";
type QbOperator = "is" | "=" | "!=" | "in" | "notIn" | "<" | ">";

interface QbChip {
  uid: string;
  fieldId: string;
  /** Only meaningful for the `customField` chip — the agent-typed field
   *  key (the "[ident]" part of `customField[ident]`). */
  ident?: string;
  operator: QbOperator;
  values: string[];
}

interface QbGroup {
  id: string;
  logicOperator: QbLogic;
  chips: QbChip[];
}

const QB_LOGIC_ITEMS = [
  { value: "and", label: "AND" },
  { value: "or", label: "OR" },
  { value: "not", label: "NOT" },
];

let qbUidCounter = 100;
const qbNextUid = () => String(++qbUidCounter);

const CUSTOM_FIELD_OPERATORS: { value: QbOperator; label: string }[] = [
  { value: "=", label: "Equals" },
  { value: "!=", label: "Not Equals" },
  { value: "in", label: "Is Any Of" },
  { value: "notIn", label: "Is None Of" },
  { value: "<", label: "Less Than" },
  { value: ">", label: "Greater Than" },
];

interface QbPicklistField {
  kind: "picklist";
  id: string;
  label: string;
  options: FilterChipOption[];
  operators: { value: QbOperator; label: string }[];
  /** Which of `operators` allow selecting more than one value — an
   *  operator not in this list clamps to a single selection (see
   *  `PicklistConditionChip`'s own `onSelectionChange`). */
  multiOperators: QbOperator[];
}

interface QbTextField {
  kind: "text";
  id: string;
  label: string;
}

interface QbCustomField {
  kind: "customField";
  id: "customField";
  label: string;
}

type QbFieldDef = QbPicklistField | QbTextField | QbCustomField;

function qbFields(): QbFieldDef[] {
  const assigneeOptions: FilterChipOption[] = CONTACT_ASSIGNEES.map((a) => ({ value: a, label: a }));
  return [
    { kind: "picklist", id: "ownerAssignee", label: "Owner Assignee", options: assigneeOptions, operators: [{ value: "is", label: "IS" }, { value: "=", label: "=" }], multiOperators: ["is"] },
    { kind: "picklist", id: "inboxAssignee", label: "Inbox Assignee", options: assigneeOptions, operators: [{ value: "is", label: "IS" }, { value: "=", label: "=" }], multiOperators: ["is"] },
    { kind: "text", id: "caseId", label: "Case ID" },
    { kind: "text", id: "threadId", label: "Thread ID" },
    { kind: "text", id: "threadIdOnExternalPlatform", label: "Thread ID (External Platform)" },
    { kind: "text", id: "content", label: "Content" },
    { kind: "text", id: "title", label: "Title" },
    { kind: "picklist", id: "status", label: "Status", options: CONTACT_STATUSES.map((s) => ({ value: s, label: s })), operators: [{ value: "=", label: "=" }], multiOperators: [] },
    { kind: "text", id: "author", label: "Author" },
    { kind: "customField", id: "customField", label: "Custom Field" },
  ];
}

function qbFieldMap(): Record<string, QbFieldDef> {
  return Object.fromEntries(qbFields().map((f) => [f.id, f]));
}

function qbBuildString(g: QbGroup): string {
  const fields = qbFieldMap();
  const joiner = g.logicOperator === "not" ? " AND " : ` ${g.logicOperator.toUpperCase()} `;
  const parts = g.chips.map((chip) => {
    const field = fields[chip.fieldId];
    if (!field) return "";
    if (field.kind === "customField") {
      const opLabel = CUSTOM_FIELD_OPERATORS.find((o) => o.value === chip.operator)?.label ?? chip.operator;
      const valStr = chip.operator === "in" || chip.operator === "notIn" ? `[${chip.values.join(", ")}]` : chip.values[0] ?? "";
      return `customField[${chip.ident || "?"}] ${opLabel} ${valStr || "''"}`;
    }
    if (field.kind === "text") {
      return `${field.label} = '${chip.values[0] ?? ""}'`;
    }
    const opLabel = field.operators.find((o) => o.value === chip.operator)?.label ?? chip.operator;
    const labels = chip.values.map((v) => field.options.find((o) => o.value === v)?.label ?? v);
    return `${field.label} ${opLabel} ${labels.length ? labels.map((l) => `'${l}'`).join(", ") : "''"}`;
  }).filter(Boolean);
  if (!parts.length) return "";
  const inner = parts.join(joiner);
  return g.logicOperator === "not" ? `NOT (${inner})` : parts.length === 1 ? inner : `(${inner})`;
}

/** Which real `Contact` field each text/picklist criterion actually checks
 *  — see this section's own doc comment for the "known gap" on
 *  `customField`, which always matches instead. */
function chipMatchesContact(contact: Contact, chip: QbChip, field: QbFieldDef): boolean {
  if (field.kind === "customField") return true;
  if (field.kind === "text") {
    const query = chip.values[0]?.trim().toLowerCase();
    if (!query) return true;
    const raw: Record<string, string | undefined> = {
      caseId: contact.caseId,
      threadId: contact.id,
      threadIdOnExternalPlatform: contact.id,
      content: contact.customerName,
      title: contact.customerName,
      author: contact.assignee,
    };
    return (raw[chip.fieldId] ?? "").toLowerCase().includes(query);
  }
  if (chip.values.length === 0) return true;
  if (chip.fieldId === "status") return chip.values.includes(contact.status);
  if (chip.fieldId === "ownerAssignee") {
    return contact.ownerAssignee !== undefined && chip.values.includes(contact.ownerAssignee);
  }
  if (chip.fieldId === "inboxAssignee") {
    return contact.assignee !== undefined && chip.values.includes(contact.assignee);
  }
  return true;
}

function qbMatches(contact: Contact, g: QbGroup): boolean {
  if (g.chips.length === 0) return true;
  const fields = qbFieldMap();
  const chipMatches = g.chips.map((chip) => {
    const field = fields[chip.fieldId];
    return field ? chipMatchesContact(contact, chip, field) : true;
  });
  if (g.logicOperator === "and") return chipMatches.every(Boolean);
  if (g.logicOperator === "or") return chipMatches.some(Boolean);
  return !chipMatches.every(Boolean); // "not" — same AND-then-negate shape qbBuildString uses
}

/* ── Chip renderers — one real `FilterChip` for picklist fields, two
 *  bespoke-but-`filterChipVariants`-styled chips for the shapes FilterChip
 *  can't do on its own (freeform text; a value control that changes shape
 *  per operator). ── */

function PicklistConditionChip({ field, chip, onUpdate, onRemove }: { field: QbPicklistField; chip: QbChip; onUpdate: (patch: Partial<QbChip>) => void; onRemove: () => void }) {
  const isMulti = field.multiOperators.includes(chip.operator);
  return (
    <FilterChip
      label={field.label}
      options={field.options}
      operators={field.operators.length > 1 ? field.operators : undefined}
      selectedOperator={chip.operator}
      onOperatorChange={(op) => {
        const nextMulti = field.multiOperators.includes(op as QbOperator);
        onUpdate({ operator: op as QbOperator, values: nextMulti ? chip.values : chip.values.slice(-1) });
      }}
      selectedValues={chip.values}
      onSelectionChange={(vals) => onUpdate({ values: isMulti ? vals : vals.slice(-1) })}
      onRemove={onRemove}
    />
  );
}

function TextConditionChip({ field, chip, onUpdate, onRemove }: { field: QbTextField; chip: QbChip; onUpdate: (patch: Partial<QbChip>) => void; onRemove: () => void }) {
  return (
    <div className={cn(filterChipVariants({ variant: "default" }), "h-auto gap-1.5 rounded-lyra-md py-1")}>
      <span className="lyra-body-sm-emphasis shrink-0">{field.label}</span>
      <span className="lyra-body-sm text-lyra-fg-secondary shrink-0">=</span>
      <input
        value={chip.values[0] ?? ""}
        onChange={(e) => onUpdate({ values: [e.target.value] })}
        placeholder="value"
        className="h-6 w-[140px] rounded-lyra-xs border border-lyra-border-default bg-lyra-bg-field px-1.5 lyra-body-sm text-lyra-fg-default focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lyra-border-focus"
      />
      <button type="button" onClick={onRemove} aria-label={`Remove ${field.label} condition`} className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lyra-xs text-lyra-fg-secondary hover:bg-lyra-state-hover">
        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

function CustomFieldConditionChip({ chip, onUpdate, onRemove }: { chip: QbChip; onUpdate: (patch: Partial<QbChip>) => void; onRemove: () => void }) {
  const isTags = chip.operator === "in" || chip.operator === "notIn";
  const isNumber = chip.operator === "<" || chip.operator === ">";
  return (
    <div className={cn(filterChipVariants({ variant: "default" }), "h-auto flex-wrap gap-1.5 rounded-lyra-md py-1")}>
      <span className="lyra-body-sm-emphasis shrink-0">Custom Field</span>
      <input
        value={chip.ident ?? ""}
        onChange={(e) => onUpdate({ ident: e.target.value })}
        placeholder="field key"
        className="h-6 w-[100px] rounded-lyra-xs border border-lyra-border-default bg-lyra-bg-field px-1.5 lyra-body-sm text-lyra-fg-default focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lyra-border-focus"
      />
      <Select
        value={chip.operator}
        onValueChange={(op) => onUpdate({ operator: op as QbOperator, values: [] })}
        options={CUSTOM_FIELD_OPERATORS.map((o) => ({ value: o.value, label: o.label }))}
        className="w-[130px]"
      />
      {isTags ? (
        <TagsInput value={chip.values} onChange={(vals) => onUpdate({ values: vals })} placeholder="Add value…" className="w-[180px]" />
      ) : (
        <input
          type={isNumber ? "number" : "text"}
          value={chip.values[0] ?? ""}
          onChange={(e) => onUpdate({ values: [e.target.value] })}
          placeholder={isNumber ? "0" : "value"}
          className="h-6 w-[110px] rounded-lyra-xs border border-lyra-border-default bg-lyra-bg-field px-1.5 lyra-body-sm text-lyra-fg-default focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lyra-border-focus"
        />
      )}
      <button type="button" onClick={onRemove} aria-label="Remove Custom Field condition" className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lyra-xs text-lyra-fg-secondary hover:bg-lyra-state-hover">
        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

function QbCriteriaMenu({ onSelect, usedIds }: { onSelect: (field: QbFieldDef) => void; usedIds: string[] }) {
  const [open, setOpen] = useState(false);
  const fields = qbFields();
  // Every field except `customField` can only be added once — a second
  // "Case ID" condition ANDed with the first would just be unsatisfiable
  // (equals two different values at once). `customField` is the one
  // exception (different `ident`s are different fields entirely), so it
  // stays available for repeated use.
  const available = fields.filter((f) => f.kind === "customField" || !usedIds.includes(f.id));
  const items: MenuEntry[] = available.map((f) => ({ id: f.id, label: f.label, onClick: () => onSelect(f) }));
  return (
    <Popover open={open} onOpenChange={setOpen} content={<Menu aria-label="Add criteria" items={items} />}>
      <Button variant="outline" size="md" disabled={available.length === 0}>
        <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Criteria
      </Button>
    </Popover>
  );
}

function QbGroupRow({ group, onUpdate }: { group: QbGroup; onUpdate: (g: QbGroup) => void }) {
  const addChip = (field: QbFieldDef) =>
    onUpdate({
      ...group,
      chips: [...group.chips, { uid: qbNextUid(), fieldId: field.id, operator: field.kind === "customField" ? "=" : field.operators[0].value, values: [] }],
    });
  const removeChip = (uid: string) => onUpdate({ ...group, chips: group.chips.filter((c) => c.uid !== uid) });
  const updateChip = (uid: string, patch: Partial<QbChip>) => onUpdate({ ...group, chips: group.chips.map((c) => (c.uid === uid ? { ...c, ...patch } : c)) });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <ToggleGroup items={QB_LOGIC_ITEMS} value={group.logicOperator} onValueChange={(v) => v && onUpdate({ ...group, logicOperator: v as QbLogic })} />
        <span className="lyra-body-sm text-lyra-fg-secondary">
          {group.logicOperator === "and" ? "All conditions must match" : group.logicOperator === "or" ? "Any one condition must match" : "No conditions must match"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {group.chips.map((chip) => {
          const field = qbFieldMap()[chip.fieldId];
          if (!field) return null;
          const onUpdateChip = (patch: Partial<QbChip>) => updateChip(chip.uid, patch);
          const onRemoveChip = () => removeChip(chip.uid);
          if (field.kind === "picklist") return <PicklistConditionChip key={chip.uid} field={field} chip={chip} onUpdate={onUpdateChip} onRemove={onRemoveChip} />;
          if (field.kind === "text") return <TextConditionChip key={chip.uid} field={field} chip={chip} onUpdate={onUpdateChip} onRemove={onRemoveChip} />;
          return <CustomFieldConditionChip key={chip.uid} chip={chip} onUpdate={onUpdateChip} onRemove={onRemoveChip} />;
        })}
        <QbCriteriaMenu onSelect={addChip} usedIds={group.chips.map((c) => c.fieldId)} />
      </div>
    </div>
  );
}

function QueryBuilderContent({ root, onUpdate }: { root: QbGroup; onUpdate: (g: QbGroup) => void }) {
  const description = qbBuildString(root) || "No criteria defined";
  return (
    <div className="flex w-[480px] flex-col gap-4 p-4">
      <QbGroupRow group={root} onUpdate={onUpdate} />
      <div className="flex flex-col gap-1.5">
        <span className="lyra-label text-lyra-fg-default">Criteria Description</span>
        <p className="lyra-body-sm text-lyra-fg-secondary rounded-lyra-sm border border-lyra-border-subtle bg-lyra-bg-surface-canvas px-3 py-2">{description}</p>
      </div>
    </div>
  );
}

/* ── Quick search types ── */

const SEARCH_TYPES: { value: string; label: string; placeholder: string }[] = [
  { value: "name", label: "Customer Name", placeholder: "Search by customer name…" },
  { value: "id", label: "Interaction ID", placeholder: "Search by interaction ID…" },
  { value: "date", label: "Date Created", placeholder: "Search by date (MM/DD/YY)…" },
];

/* ── Status → StatusBadge variant ── */

const STATUS_VARIANT: Record<ContactStatus, "warning" | "info" | "success" | "critical" | "neutral"> = {
  New: "warning",
  Pending: "info",
  Resolved: "success",
  Escalated: "critical",
  Closed: "neutral",
};

const ROWS_PER_PAGE = 25;

type BulkAction = "assign-me" | "assign-others" | "change-status" | "send-message";

const BULK_ACTIONS: { id: BulkAction; label: string; icon: typeof UserCheck }[] = [
  { id: "assign-me", label: "Assign to Me", icon: UserCheck },
  { id: "assign-others", label: "Assign to Others", icon: UserPlus },
  { id: "change-status", label: "Change Status", icon: CircleCheck },
  { id: "send-message", label: "Send Message", icon: Send },
];

export function SearchContactsPage() {
  /* Quick search */
  const [searchType, setSearchType] = useState("name");
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  /* Filters */
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  /* Query Builder */
  const [qbRoot, setQbRoot] = useState<QbGroup>({ id: "qb-root", logicOperator: "and", chips: [] });
  const [qbApplied, setQbApplied] = useState<QbGroup | null>(null);

  /* Has the agent actually searched or filtered yet? Nothing loads until
   * one of these happens — see this file's own doc comment, decision 1. */
  const hasSearched =
    searchQuery.trim().length > 0 ||
    Object.values(filterValues).some((v) => v.length > 0) ||
    dateRange !== undefined ||
    qbApplied !== null;

  /* Selection + pagination */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [activeBulkAction, setActiveBulkAction] = useState<BulkAction | null>(null);

  /* Row-expand accordion — clicking anywhere on a row (other than the
   *  checkbox/kebab, which stop propagation) expands it in place to show
   *  fields not in the table plus the full conversation thread, for
   *  review. True accordion, not independent per-row toggles — per an
   *  explicit follow-up, opening a row auto-collapses whichever one was
   *  already open, so `expandedId` is a single id rather than a Set.
   *  Reset whenever the page changes so a stale expanded row from page 1
   *  doesn't silently carry over and "expand" a different contact that
   *  happens to land in the same row position on page 2. */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  useEffect(() => {
    setExpandedId(null);
  }, [currentPage]);

  /* Bulk action inline-row fields */
  const [assignOthersType, setAssignOthersType] = useState<"Agent" | "Team">("Agent");
  const [assignOthersTarget, setAssignOthersTarget] = useState("");
  const [newStatus, setNewStatus] = useState<ContactStatus>("Pending");
  const [messageText, setMessageText] = useState("");

  const filteredContacts = useMemo(() => {
    if (!hasSearched) return [];
    return CONTACTS.filter((contact) => {
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (searchType === "name" && !contact.customerName.toLowerCase().includes(q)) return false;
        if (searchType === "id" && !contact.id.toLowerCase().includes(q)) return false;
        if (searchType === "date" && !contact.dateCreated.toLowerCase().includes(q)) return false;
      }
      for (const [key, values] of Object.entries(filterValues)) {
        if (values.length === 0) continue;
        if (key === "status" && !values.includes(contact.status)) return false;
        if (key === "skill" && !values.includes(contact.skill)) return false;
        if (key === "channel" && !values.includes(contact.channel)) return false;
        if (key === "inboxAssignee" && !(contact.assignee && values.includes(contact.assignee))) return false;
        if (key === "ownerAssignee" && !(contact.ownerAssignee && values.includes(contact.ownerAssignee))) return false;
        if (key === "tags" && !(contact.tags ?? []).some((t) => values.includes(t))) return false;
      }
      if (dateRange?.from) {
        // `Date.prototype.setHours` mutates in place — clone before calling
        // it so this never mutates `dateRange.from`/`.to` themselves (both
        // live in this component's own state, shared with the
        // `DateRangePicker` that renders them).
        const from = new Date(dateRange.from).setHours(0, 0, 0, 0);
        const to = new Date(dateRange.to ?? dateRange.from).setHours(23, 59, 59, 999);
        if (contact.dateCreatedAt < from || contact.dateCreatedAt > to) return false;
      }
      if (qbApplied && !qbMatches(contact, qbApplied)) return false;
      return true;
    });
  }, [hasSearched, searchQuery, searchType, filterValues, dateRange, qbApplied]);

  const totalRecords = filteredContacts.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / ROWS_PER_PAGE));
  const pageStart = (currentPage - 1) * ROWS_PER_PAGE;
  const pageContacts = filteredContacts.slice(pageStart, pageStart + ROWS_PER_PAGE);

  const runSearch = () => {
    setSearchQuery(searchDraft);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchDraft("");
    setSearchQuery("");
    setFilterValues({});
    setDateRange(undefined);
    setQbRoot({ id: "qb-root", logicOperator: "and", chips: [] });
    setQbApplied(null);
    setSelectedIds(new Set());
    setActiveBulkAction(null);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    // Static mock data — nothing to actually re-fetch, but a real refresh
    // re-runs the current query and drops back to page 1, so this mirrors
    // that rather than being a pure no-op.
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOnPageSelected = pageContacts.length > 0 && pageContacts.every((c) => selectedIds.has(c.id));
  const someOnPageSelected = pageContacts.some((c) => selectedIds.has(c.id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageContacts.forEach((c) => next.delete(c.id));
      else pageContacts.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const filterDefs = [
    { key: "status", label: "Status", options: CONTACT_STATUSES.map((s) => ({ value: s, label: s })) },
    { key: "skill", label: "Skill", options: CONTACT_SKILLS.map((s) => ({ value: s, label: s })) },
    { key: "channel", label: "Channel", options: CONTACT_CHANNELS.map((c) => ({ value: c, label: CONTACT_CHANNEL_LABEL[c] })) },
    { key: "inboxAssignee", label: "Inbox Assignee", options: CONTACT_ASSIGNEES.map((a) => ({ value: a, label: a })) },
    { key: "ownerAssignee", label: "Assigned Owner", options: CONTACT_ASSIGNEES.map((a) => ({ value: a, label: a })) },
    { key: "tags", label: "Tags", options: CONTACT_TAGS.map((t) => ({ value: t, label: t })) },
  ];

  const selectedCount = selectedIds.size;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Row 1: Quick search — type dropdown + input + Refresh/Reset.
       *  Kept as its own row, separate from TableToolbar's built-in search
       *  slot, specifically so Refresh/Reset can "persist always" right
       *  next to it (per an explicit follow-up) rather than living inside
       *  TableToolbar's own responsive/collapsible action area. Also where
       *  the "quick search is one field, Query Builder is compound
       *  conditions" split actually lives — see this file's own doc
       *  comment, decision 2. */}
      <div className="border-b border-lyra-border-subtle px-4 py-3">
        {/* Capped at 1200px (same ceiling agent-dashboard.tsx uses for its own
         *  content width — see that component) so the field doesn't stretch
         *  edge-to-edge on very wide screens; the row's own border/background
         *  above still runs full-bleed. */}
        <div className="flex max-w-[1200px] items-center gap-2">
          <Select
            value={searchType}
            onValueChange={setSearchType}
            options={SEARCH_TYPES.map(({ value, label }) => ({ value, label }))}
            className="w-[180px] shrink-0"
          />
          <SearchInput
            value={searchDraft}
            onValueChange={setSearchDraft}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder={SEARCH_TYPES.find((t) => t.value === searchType)?.placeholder}
            className="flex-1"
          />
          <Button variant="outline" size="lg" onClick={runSearch}>
            Search
          </Button>
          <div className="mx-1 h-6 w-px bg-lyra-border-subtle" />
          <ActionIconButton title="Refresh" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
          </ActionIconButton>
          <ActionIconButton title="Reset" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
          </ActionIconButton>
        </div>
      </div>

      {/* ── Row 2: TableToolbar — filter chips (Status/Skill/Channel/Inbox
       *  Assignee/Assigned Owner/Tags), a Date Range control (via the
       *  `filters` slot — doesn't fit FilterChip's fixed-option-list shape),
       *  and the native Query Builder popover. Always visible, same as row 1
       *  — filtering is one of the two ways to trigger `hasSearched`, so it
       *  can't be gated behind having already searched. */}
      <TableToolbar
        recordCount={hasSearched ? totalRecords : undefined}
        recordLabel="Interactions"
        // Per an explicit follow-up — keep these filter chips
        // listed and wrapping across as many lines as needed, and only
        // collapse them into the "Filters" dropdown once the panel gets
        // genuinely narrow (~360px), rather than lyra-ui's own default
        // 991px breakpoint (still used for the action-buttons/panel-toggle
        // side of this same toolbar, unaffected by this).
        filtersCollapseWidth={360}
        // Compact ("sm") sizing for the whole filter row — per an explicit
        // follow-up, the filter chips/date range/Query Builder button were
        // reading at the same visual weight as the primary search row
        // above, with nothing signaling "these are secondary." lyra-ui's
        // FilterChip/DateRangePicker/TableToolbar all gained a `size="sm"`
        // option for exactly this (see their own doc comments) — this is
        // the first consumer to use it.
        filterChipSize="sm"
        advancedSearchButtonSize="sm"
        filterDefs={filterDefs}
        filterValues={filterValues}
        onFilterChange={(key, values) => {
          setFilterValues((prev) => ({ ...prev, [key]: values }));
          setCurrentPage(1);
        }}
        onFilterClear={() => {
          setFilterValues({});
          setDateRange(undefined);
          setCurrentPage(1);
        }}
        filters={
          <DateRangePicker value={dateRange} onChange={(range) => { setDateRange(range); setCurrentPage(1); }} placeholder="Date Created" className="w-[220px]" size="sm" />
        }
        showAdvancedSearch
        advancedSearchContent={<QueryBuilderContent root={qbRoot} onUpdate={setQbRoot} />}
        advancedSearchApplied={qbApplied !== null}
        advancedSearchDescription={qbApplied ? qbBuildString(qbApplied) || undefined : undefined}
        onAdvancedSearchApply={() => {
          setQbApplied(qbRoot);
          setCurrentPage(1);
        }}
        onAdvancedSearchCancel={() => {}}
        className="border-b border-lyra-border-subtle px-4 py-3"
      />

      {/* ── Row 3 (conditional): bulk actions + their inline reveal row —
       *  only meaningful once there are selected rows, which only exist
       *  once there are results at all. Same row shape for all four
       *  actions per an explicit follow-up, even though their actual
       *  content differs (see BulkActionRow below for each). */}
      {hasSearched && selectedCount > 0 && (
        <div className="flex flex-col border-b border-lyra-border-subtle bg-lyra-bg-active-subtle">
          <div className="flex items-center gap-3 px-4 py-2">
            <span className="lyra-body-sm-emphasis text-lyra-fg-active-strong">{selectedCount} selected</span>
            <div className="mx-1 h-5 w-px bg-lyra-border-subtle" />
            {BULK_ACTIONS.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeBulkAction === id ? "outline" : "ghost"}
                size="md"
                onClick={() => setActiveBulkAction((prev) => (prev === id ? null : id))}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {label}
              </Button>
            ))}
          </div>

          {activeBulkAction === "assign-me" && (
            <div className="flex items-center gap-2 border-t border-lyra-border-subtle px-4 py-3">
              <span className="lyra-body-sm text-lyra-fg-secondary">Assign {selectedCount} selected contact{selectedCount === 1 ? "" : "s"} to yourself?</span>
              <Button
                variant="default"
                size="md"
                onClick={() => {
                  // eslint-disable-next-line no-console
                  console.log("Assign to me:", Array.from(selectedIds));
                  setActiveBulkAction(null);
                  setSelectedIds(new Set());
                }}
              >
                Confirm
              </Button>
              <Button variant="ghost" size="md" onClick={() => setActiveBulkAction(null)}>
                Cancel
              </Button>
            </div>
          )}

          {activeBulkAction === "assign-others" && (
            <div className="flex items-center gap-2 border-t border-lyra-border-subtle px-4 py-3">
              <Select
                value={assignOthersType}
                onValueChange={(v) => { setAssignOthersType(v as "Agent" | "Team"); setAssignOthersTarget(""); }}
                options={[{ value: "Agent", label: "Agent" }, { value: "Team", label: "Team" }]}
                className="w-[140px]"
              />
              <Select
                value={assignOthersTarget}
                onValueChange={setAssignOthersTarget}
                placeholder="Select…"
                options={
                  assignOthersType === "Agent"
                    ? CONTACT_ASSIGNEES.map((a) => ({ value: a, label: a }))
                    : [{ value: "tier-1", label: "Tier 1 Support" }, { value: "escalations", label: "Escalations Team" }, { value: "billing-team", label: "Billing Team" }]
                }
                className="w-[220px]"
              />
              <Button
                variant="default"
                size="md"
                disabled={!assignOthersTarget}
                onClick={() => {
                  // eslint-disable-next-line no-console
                  console.log("Assign to", assignOthersType, assignOthersTarget, ":", Array.from(selectedIds));
                  setActiveBulkAction(null);
                  setSelectedIds(new Set());
                  setAssignOthersTarget("");
                }}
              >
                Assign
              </Button>
              <Button variant="ghost" size="md" onClick={() => setActiveBulkAction(null)}>
                Cancel
              </Button>
            </div>
          )}

          {activeBulkAction === "change-status" && (
            <div className="flex items-center gap-2 border-t border-lyra-border-subtle px-4 py-3">
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ContactStatus)} options={CONTACT_STATUSES.map((s) => ({ value: s, label: s }))} className="w-[180px]" />
              <Button
                variant="default"
                size="md"
                onClick={() => {
                  // eslint-disable-next-line no-console
                  console.log("Change status to", newStatus, ":", Array.from(selectedIds));
                  setActiveBulkAction(null);
                  setSelectedIds(new Set());
                }}
              >
                Apply
              </Button>
              <Button variant="ghost" size="md" onClick={() => setActiveBulkAction(null)}>
                Cancel
              </Button>
            </div>
          )}

          {activeBulkAction === "send-message" && (
            <div className="flex items-start gap-2 border-t border-lyra-border-subtle px-4 py-3">
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Message to send to ${selectedCount} selected contact${selectedCount === 1 ? "" : "s"}…`}
                className="flex-1"
                rows={2}
              />
              <Button
                variant="default"
                size="md"
                disabled={!messageText.trim()}
                onClick={() => {
                  // eslint-disable-next-line no-console
                  console.log("Send message:", messageText, "to", Array.from(selectedIds));
                  setActiveBulkAction(null);
                  setSelectedIds(new Set());
                  setMessageText("");
                }}
              >
                Send
              </Button>
              <Button variant="ghost" size="md" onClick={() => setActiveBulkAction(null)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Results ── */}
      {!hasSearched ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <FileSearch className="h-8 w-8 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />
          <p className="lyra-body-md-emphasis text-lyra-fg-default">Search or filter to see contacts</p>
          <p className="lyra-body-sm text-lyra-fg-secondary">Nothing loads until you search a name/ID/date, apply a filter, or run the Query Builder.</p>
        </div>
      ) : totalRecords === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="lyra-body-md-emphasis text-lyra-fg-default">No contacts match</p>
          <p className="lyra-body-sm text-lyra-fg-secondary">Try a different search, or clear a filter.</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden px-4 pt-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40px] shrink-0">
                    <Checkbox checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false} onCheckedChange={toggleAllOnPage} aria-label="Select all rows on this page" />
                  </TableHead>
                  <TableHead className="w-[56px] shrink-0">Channel</TableHead>
                  <TableHead className="flex-[1.2]">Date Created</TableHead>
                  <TableHead className="flex-1">Status</TableHead>
                  <TableHead className="flex-[2]">Customer Name</TableHead>
                  <TableHead className="flex-[1.5]">Skill</TableHead>
                  <TableHead className="w-[40px] shrink-0"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageContacts.map((contact) => {
                  const ChannelIcon = CONTACT_CHANNEL_ICON[contact.channel];
                  const accent = CHANNEL_ACCENT[contact.channel];
                  const DirectionIcon = contact.direction === "inbound" ? ArrowDownLeft : ArrowUpRight;
                  const isExpanded = expandedId === contact.id;
                  return (
                    <Fragment key={contact.id}>
                      {/* Clicking anywhere on the row toggles the accordion below it
                       *  — checkbox/kebab cells stop propagation so selecting a row
                       *  or opening its menu doesn't also expand/collapse it. */}
                      <TableRow
                        className="cursor-pointer"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedId((prev) => (prev === contact.id ? null : contact.id))}
                      >
                        <TableCell className="w-[40px] shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={selectedIds.has(contact.id)} onCheckedChange={() => toggleRow(contact.id)} aria-label={`Select ${contact.customerName}`} />
                        </TableCell>
                        <TableCell className="w-[56px] shrink-0">
                          <span className="flex items-center gap-0.5" title={`${contact.direction === "inbound" ? "Inbound" : "Outbound"} ${CONTACT_CHANNEL_LABEL[contact.channel]}`}>
                            <DirectionIcon className={cn("h-3.5 w-3.5", accent.text)} strokeWidth={2} aria-hidden="true" />
                            <ChannelIcon className={cn("h-4 w-4", accent.text)} strokeWidth={1.5} aria-hidden="true" />
                          </span>
                        </TableCell>
                        <TableCell className="flex-[1.2] lyra-body-sm text-lyra-fg-secondary">{contact.dateCreated}</TableCell>
                        <TableCell className="flex-1">
                          <span className="inline-flex items-center gap-1.5">
                            <StatusBadge variant={STATUS_VARIANT[contact.status]} size="sm" dot />
                            {contact.status}
                          </span>
                        </TableCell>
                        <TableCell className="flex-[2]">{contact.customerName}</TableCell>
                        <TableCell className="flex-[1.5] lyra-body-sm text-lyra-fg-secondary">{contact.skill}</TableCell>
                        <TableCell className="w-[40px] shrink-0" onClick={(e) => e.stopPropagation()}>
                          <KebabMenuButton
                            items={[
                              { id: "view", label: "View Interaction", onClick: () => {} },
                              { id: "assign", label: "Assign to Me", onClick: () => {} },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="cursor-default hover:bg-transparent active:bg-transparent">
                          {/* `block` — the default TableCell force-wraps children in a
                           *  truncating single-line <span>, which breaks this multi-line
                           *  detail-fields + thread content. colSpan matches the 7
                           *  TableHead columns above. */}
                          <TableCell block colSpan={7} className="bg-lyra-bg-surface-canvas px-6 py-4">
                            <div className="flex flex-col gap-3">
                              {/* Fields not already shown as their own table column. */}
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 lyra-body-sm">
                                <span><span className="text-lyra-fg-secondary">Case ID:</span> {contact.caseId}</span>
                                <span><span className="text-lyra-fg-secondary">Direction:</span> {contact.direction === "inbound" ? "Inbound" : "Outbound"}</span>
                                <span><span className="text-lyra-fg-secondary">Inbox Assignee:</span> {contact.assignee ?? "—"}</span>
                                <span><span className="text-lyra-fg-secondary">Assigned Owner:</span> {contact.ownerAssignee ?? "—"}</span>
                                <span><span className="text-lyra-fg-secondary">Tags:</span> {contact.tags?.length ? contact.tags.join(", ") : "—"}</span>
                              </div>
                              <div className="border-t border-lyra-border-subtle" />
                              {/* Full thread for review — chat/SMS/voice transcript/email,
                               *  same read-only renderer the Customer Profile's own past-
                               *  interaction history uses (see CustomerSnapshotPanel). Fixed
                               *  `h-` (not `max-h-`) per an explicit follow-up — a real,
                               *  generously-sized scrollable pane rather than one that
                               *  shrinks to fit whatever a short thread happens to need;
                               *  a longer thread scrolls inside it instead of growing the
                               *  row (and the whole table) taller. */}
                              <div className="h-[420px] overflow-y-auto">
                                <TranscriptThread
                                  messages={contact.transcript.messages}
                                  isVoiceCall={contact.channel === "voice"}
                                  isEmailChannel={contact.channel === "email"}
                                  callEvents={contact.transcript.callEvents}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <TableFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            rowsPerPage={ROWS_PER_PAGE}
            totalRecords={totalRecords}
            displayStart={pageStart + 1}
            displayEnd={Math.min(pageStart + ROWS_PER_PAGE, totalRecords)}
            showDisplayCount
            className="border-t border-lyra-border-subtle px-4"
          />
        </>
      )}
    </div>
  );
}
