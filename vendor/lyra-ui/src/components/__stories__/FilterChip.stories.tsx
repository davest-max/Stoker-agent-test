import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { FilterChip, filterChipVariants } from "../filter-chip";
import { Button } from "../button";
import { Input } from "../input";
import { ToggleGroup } from "../toggle-group";
import { Select } from "../select";
import { Popover } from "../popover";
import { RadioGroup, RadioGroupItem } from "../radio";
import { DateRangePicker } from "../date-picker";
import type { DateRange } from "../calendar";
import { Plus, Copy, Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

const addFilterOptions = Array.from({ length: 50 }, (_, i) => ({
  value: `filter-${i + 1}`,
  label: `Filter ${i + 1}`,
}));

const meta: Meta<typeof FilterChip> = {
  title: "Atoms/FilterChip",
  component: FilterChip,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof FilterChip>;

const sampleOptions = Array.from({ length: 50 }, (_, i) => ({
  value: `option-${i + 1}`,
  label: `Option ${i + 1}`,
}));

/* ── Empty (default) ── */

function EmptyDemo() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <FilterChip
      label="Filter"
      options={sampleOptions}
      selectedValues={selected}
      onSelectionChange={setSelected}
    />
  );
}

export const Default: Story = {
  name: "Empty",
  render: () => <EmptyDemo />,
};

/* ── Active (with values) ── */

function ActiveDemo() {
  const [selected, setSelected] = useState<string[]>([
    "back-office",
    "custom",
    "bpo",
    "collections",
  ]);
  return (
    <FilterChip
      label="Filter"
      options={sampleOptions}
      selectedValues={selected}
      onSelectionChange={setSelected}
    />
  );
}

export const Active: Story = {
  name: "Active (with values)",
  render: () => <ActiveDemo />,
};

/* ── Error ── */

function ErrorDemo() {
  const [selected, setSelected] = useState<string[]>([
    "back-office",
    "custom",
    "bpo",
    "collections",
  ]);
  return (
    <FilterChip
      label="Filter"
      options={sampleOptions}
      selectedValues={selected}
      onSelectionChange={setSelected}
      error
    />
  );
}

export const Error: Story = {
  name: "Error",
  render: () => <ErrorDemo />,
};

/* ── Disabled ── */

export const Disabled: Story = {
  name: "Disabled (empty)",
  render: () => (
    <FilterChip
      label="Filter"
      options={sampleOptions}
      selectedValues={[]}
      disabled
    />
  ),
};

export const DisabledWithValues: Story = {
  name: "Disabled (with values)",
  render: () => (
    <FilterChip
      label="Filter"
      options={sampleOptions}
      selectedValues={["back-office", "custom", "bpo", "collections"]}
      disabled
    />
  ),
};

/* ── Removable ── */

interface ActiveFilter {
  id: string;
  label: string;
  selectedValues: string[];
}

function RemovableDemo() {
  const [filters, setFilters] = useState<ActiveFilter[]>([
    { id: "filter-1", label: "Filter 1", selectedValues: ["option-2", "option-3", "option-4"] },
    { id: "filter-2", label: "Filter 2", selectedValues: ["option-1"] },
  ]);
  const [addedFilters, setAddedFilters] = useState<string[]>(["filter-1", "filter-2"]);
  const [visibleCount, setVisibleCount] = useState<number>(Infinity);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);

  const removeFilter = (id: string) => {
    setFilters((f) => f.filter((item) => item.id !== id));
    setAddedFilters((v) => v.filter((v2) => v2 !== id));
  };

  const updateFilterValues = (id: string, values: string[]) => {
    setFilters((f) => f.map((item) => item.id === id ? { ...item, selectedValues: values } : item));
  };

  const handleAddFilters = (values: string[]) => {
    setAddedFilters(values);
    const existing = new Set(filters.map((f) => f.id));
    const toAdd = values.filter((v) => !existing.has(v));
    if (toAdd.length > 0) {
      setFilters((f) => [
        ...f,
        ...toAdd.map((v) => ({
          id: v,
          label: addFilterOptions.find((o) => o.value === v)?.label ?? v,
          selectedValues: [],
        })),
      ]);
    }
    const keep = new Set(values);
    setFilters((f) => f.filter((item) => keep.has(item.id)));
  };

  const sortedFilters = filters.sort((a, b) => addedFilters.indexOf(a.id) - addedFilters.indexOf(b.id));

  /* Measure which chips fit */
  const measureOverflow = useCallback(() => {
    const container = containerRef.current;
    const chips = chipsRef.current;
    if (!container || !chips) return;

    const containerWidth = container.offsetWidth;
    // Reserve space for +N button, + Filter button, and Clear button (~220px)
    const reserved = 220;
    const maxWidth = containerWidth - reserved;

    const children = Array.from(chips.children) as HTMLElement[];
    let usedWidth = 0;
    let count = 0;

    for (const child of children) {
      usedWidth += child.offsetWidth + 12; // 12px = gap-3
      if (usedWidth > maxWidth && count > 0) break;
      count++;
    }

    setVisibleCount(count);
  }, []);

  useEffect(() => {
    measureOverflow();
    const ro = new ResizeObserver(measureOverflow);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measureOverflow, filters.length]);

  // Re-measure when filters change
  useEffect(() => {
    measureOverflow();
  }, [filters, measureOverflow]);

  /* Close overflow on outside click */
  useEffect(() => {
    if (!overflowOpen) return;
    function handleClick(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [overflowOpen]);

  const visibleFilters = sortedFilters.slice(0, visibleCount);
  const overflowFilters = sortedFilters.slice(visibleCount);

  return (
    <div ref={containerRef} className="flex items-center gap-3 w-full">
      {/* Hidden measurement container */}
      <div ref={chipsRef} className="absolute invisible flex items-center gap-3" aria-hidden="true">
        {sortedFilters.map((f) => (
          <FilterChip
            key={`measure-${f.id}`}
            label={f.label}
            options={sampleOptions}
            selectedValues={f.selectedValues}
            onRemove={() => {}}
          />
        ))}
      </div>

      {/* Visible chips */}
      {visibleFilters.map((f) => (
        <FilterChip
          key={f.id}
          label={f.label}
          options={sampleOptions}
          selectedValues={f.selectedValues}
          onSelectionChange={(vals) => updateFilterValues(f.id, vals)}
          onRemove={() => removeFilter(f.id)}
        />
      ))}

      {/* +N overflow button */}
      {overflowFilters.length > 0 && (
        <div ref={overflowRef} className="relative inline-flex">
          <button
            type="button"
            onClick={() => setOverflowOpen((v) => !v)}
            className="inline-flex items-center justify-center h-8 px-3 rounded-lyra-md border border-lyra-border-default bg-lyra-bg-control-subtle text-lyra-fg-action lyra-body-md-emphasis hover:bg-lyra-state-hover active:bg-lyra-state-pressed transition-colors"
          >
            +{overflowFilters.length}
          </button>
          {overflowOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[280px] rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg">
              <div className="max-h-[320px] overflow-y-auto p-3 flex flex-col gap-2">
                {overflowFilters.map((f) => (
                  <div key={f.id} className="relative">
                    <FilterChip
                      label={f.label}
                      options={sampleOptions}
                      selectedValues={f.selectedValues}
                      onSelectionChange={(vals) => updateFilterValues(f.id, vals)}
                      onRemove={() => removeFilter(f.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Select
        options={addFilterOptions}
        multiple
        searchable
        showSelectAll
        dropdownAlign="left"
        values={addedFilters}
        onValuesChange={handleAddFilters}
        trigger={
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lyra-sm lyra-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2 border border-lyra-border-default bg-lyra-bg-control text-lyra-fg-action hover:bg-lyra-state-hover active:bg-lyra-state-pressed h-8 px-3"
          >
            <Plus className="h-4 w-4" />Filter
          </button>
        }
        className="inline-flex relative"
      />
      <Button variant="ghost" size="sm" onClick={() => { setFilters([]); setAddedFilters([]); }}>Clear</Button>
    </div>
  );
}

export const Removable: Story = {
  name: "Removable",
  render: () => <RemovableDemo />,
};

/* ── All States ── */

function AllStatesDemo() {
  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Empty chips in sizes */}
      <div className="flex items-center gap-3">
        <FilterChip label="Filter" options={sampleOptions} selectedValues={[]} />
        <FilterChip label="Filter" options={sampleOptions} selectedValues={[]} />
        <FilterChip label="Filter" options={sampleOptions} selectedValues={[]} />
        <FilterChip label="Filter" options={sampleOptions} selectedValues={[]} />
        <Select
          options={addFilterOptions}
          multiple
          searchable
          showSelectAll
          dropdownAlign="left"
          trigger={
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lyra-sm lyra-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2 border border-lyra-border-default bg-lyra-bg-control text-lyra-fg-action hover:bg-lyra-state-hover active:bg-lyra-state-pressed h-8 px-3"
            >
              <Plus className="h-4 w-4" />Filter
            </button>
          }
          className="inline-flex relative"
        />
        <Button variant="ghost" size="sm">Clear</Button>
      </div>

      {/* Row 2: Active chips */}
      <div className="flex items-center gap-3">
        <FilterChip
          label="Filter"
          options={sampleOptions}
          selectedValues={["back-office", "custom", "bpo", "collections"]}
        />
        <FilterChip
          label="Filter"
          options={sampleOptions}
          selectedValues={["back-office", "custom", "bpo", "collections"]}
        />
        <FilterChip
          label="Filter"
          options={sampleOptions}
          selectedValues={["back-office", "custom", "bpo", "collections"]}
        />
      </div>

      {/* Row 3: Error chips */}
      <div className="flex items-center gap-3">
        <FilterChip
          label="Filter"
          options={sampleOptions}
          selectedValues={["back-office", "custom", "bpo", "collections"]}
          error
        />
        <FilterChip
          label="Filter"
          options={sampleOptions}
          selectedValues={["back-office", "custom", "bpo", "collections"]}
          error
        />
        <FilterChip
          label="Filter"
          options={sampleOptions}
          selectedValues={["back-office", "custom", "bpo", "collections"]}
          error
        />
      </div>

      {/* Row 4: Disabled */}
      <div className="flex items-center gap-3">
        <FilterChip
          label="Filter"
          options={sampleOptions}
          selectedValues={["back-office", "custom", "bpo", "collections"]}
          disabled
        />
      </div>
    </div>
  );
}

export const AllStates: Story = {
  name: "All States",
  render: () => <AllStatesDemo />,
};

/* ── Shared operators and options per criteria field ── */

const TEXT_OPERATORS = [
  { value: "contains",         label: "Contains" },
  { value: "does-not-contain", label: "Does Not Contain" },
  { value: "equals",           label: "Equals" },
  { value: "not-equals",       label: "Not Equals" },
  { value: "starts-with",      label: "Starts With" },
  { value: "ends-with",        label: "Ends With" },
];

const NUMBER_OPERATORS = [
  { value: "equals",        label: "Equals" },
  { value: "not-equals",    label: "Not Equals" },
  { value: "greater-than",  label: "Greater Than" },
  { value: "less-than",     label: "Less Than" },
];

const CRITERIA_DEFS: Record<string, {
  label: string;
  operators: typeof TEXT_OPERATORS;
  options: { value: string; label: string }[];
}> = {
  "first-name": {
    label: "First Name",
    operators: TEXT_OPERATORS,
    options: [
      { value: "jane", label: "Jane" }, { value: "john", label: "John" },
      { value: "alice", label: "Alice" }, { value: "bob", label: "Bob" },
      { value: "carol", label: "Carol" }, { value: "dave", label: "Dave" },
    ],
  },
  "last-name": {
    label: "Last Name",
    operators: TEXT_OPERATORS,
    options: [
      { value: "smith", label: "Smith" }, { value: "jones", label: "Jones" },
      { value: "brown", label: "Brown" }, { value: "davis", label: "Davis" },
    ],
  },
  "age": {
    label: "Age",
    operators: NUMBER_OPERATORS,
    options: [
      { value: "18", label: "18" }, { value: "25", label: "25" },
      { value: "30", label: "30" }, { value: "40", label: "40" },
      { value: "50", label: "50" },
    ],
  },
  "gender": {
    label: "Gender",
    operators: [
      { value: "equals",     label: "Equals" },
      { value: "not-equals", label: "Not Equals" },
    ],
    options: [
      { value: "male", label: "Male" }, { value: "female", label: "Female" },
      { value: "non-binary", label: "Non-binary" }, { value: "prefer-not", label: "Prefer not to say" },
    ],
  },
  "department": {
    label: "Department",
    operators: TEXT_OPERATORS,
    options: [
      { value: "engineering", label: "Engineering" }, { value: "design", label: "Design" },
      { value: "sales", label: "Sales" }, { value: "support", label: "Support" },
      { value: "hr", label: "HR" },
    ],
  },
  "status": {
    label: "Status",
    operators: [
      { value: "equals",     label: "Equals" },
      { value: "not-equals", label: "Not Equals" },
    ],
    options: [
      { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" },
      { value: "pending", label: "Pending" },
    ],
  },
};

/* ── Filter builder types ── */

interface ChipState {
  uid: string;
  criteriaId: string;
  operator: string;
  values: string[];
}

type LogicOperator = "and" | "or" | "not";

interface FilterGroupState {
  id: string;
  logicOperator: LogicOperator;
  chips: ChipState[];
  subGroups: FilterGroupState[];
}

let _uid = 0;
const nextUid = () => String(++_uid);

function makeChip(criteriaId: string): ChipState {
  const def = CRITERIA_DEFS[criteriaId];
  return { uid: nextUid(), criteriaId, operator: def.operators[0].value, values: [] };
}

function makeGroup(): FilterGroupState {
  return { id: nextUid(), logicOperator: "and", chips: [], subGroups: [] };
}

const LOGIC_ITEMS = [
  { value: "and", label: "And" },
  { value: "or",  label: "Or"  },
  { value: "not", label: "Not" },
];

/* ── Criteria dropdown (shared) ── */

function CriteriaMenu({ onSelect, items }: {
  onSelect: (id: string) => void;
  items?: Record<string, { label: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const source = items ?? CRITERIA_DEFS;

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen(v => !v);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <Button ref={btnRef} variant="outline" size="md" onClick={handleOpen}>
        <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
        Criteria
      </Button>
      {open && ReactDOM.createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="min-w-[180px] rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg p-2"
        >
          {Object.entries(source).map(([id, def]) => (
            <button
              key={id}
              type="button"
              onClick={() => { onSelect(id); setOpen(false); }}
              className="w-full flex items-center px-3 py-2 lyra-body-md text-lyra-fg-default rounded-lyra-sm text-left hover:bg-lyra-state-hover active:bg-lyra-state-pressed transition-colors"
            >
              {def.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>

  );
}

/* ── Recursive FilterGroup row ── */

function FilterGroupRow({
  group,
  isRoot,
  onUpdate,
  onDelete,
}: {
  group: FilterGroupState;
  isRoot?: boolean;
  onUpdate: (updated: FilterGroupState) => void;
  onDelete?: () => void;
}) {
  const addChip = (criteriaId: string) =>
    onUpdate({ ...group, chips: [...group.chips, makeChip(criteriaId)] });

  const removeChip = (uid: string) =>
    onUpdate({ ...group, chips: group.chips.filter(c => c.uid !== uid) });

  const updateChip = (uid: string, patch: Partial<ChipState>) =>
    onUpdate({ ...group, chips: group.chips.map(c => c.uid === uid ? { ...c, ...patch } : c) });

  const addSubGroup = () =>
    onUpdate({ ...group, subGroups: [...group.subGroups, makeGroup()] });

  const updateSubGroup = (id: string, updated: FilterGroupState) =>
    onUpdate({ ...group, subGroups: group.subGroups.map(g => g.id === id ? updated : g) });

  const removeSubGroup = (id: string) =>
    onUpdate({ ...group, subGroups: group.subGroups.filter(g => g.id !== id) });

  return (
    <div className={!isRoot ? "w-full border border-lyra-border-subtle rounded-lyra-md p-3 bg-lyra-bg-surface-canvas" : "w-full"}>
      {/* Logic operator toggle */}
      <div className="flex items-center gap-2 mb-2">
        <ToggleGroup
          items={LOGIC_ITEMS}
          value={group.logicOperator}
          onValueChange={(v) => v && onUpdate({ ...group, logicOperator: v as LogicOperator })}
        />
        <span className="lyra-body-sm text-lyra-fg-secondary">
          {group.logicOperator === "and" ? "All conditions must match" :
           group.logicOperator === "or"  ? "Any one condition must match" :
                                           "No conditions must match"}
        </span>
      </div>

      {/* Chips row + action buttons */}
      <div className="flex flex-wrap items-center gap-2 w-full">
        {group.chips.map(chip => {
          const def = CRITERIA_DEFS[chip.criteriaId];
          return (
            <FilterChip
              key={chip.uid}
              label={def.label}
              operators={def.operators}
              selectedOperator={chip.operator}
              onOperatorChange={op => updateChip(chip.uid, { operator: op })}
              options={def.options}
              selectedValues={chip.values}
              onSelectionChange={vals => updateChip(chip.uid, { values: vals })}
              onRemove={() => removeChip(chip.uid)}
            />
          );
        })}

        {/* + Criteria */}
        <CriteriaMenu onSelect={addChip} />

        {/* + Group */}
        <Button variant="outline" size="md" onClick={addSubGroup}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          Group
        </Button>

        {/* Delete — only on sub-groups */}
        {!isRoot && onDelete && (
          <Button variant="ghost" size="md" onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>

      {/* Sub-groups */}
      {group.subGroups.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {group.subGroups.map(sub => (
            <FilterGroupRow
              key={sub.id}
              group={sub}
              onUpdate={updated => updateSubGroup(sub.id, updated)}
              onDelete={() => removeSubGroup(sub.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Criteria description builder ── */

const OPERATOR_LABELS: Record<string, string> = {
  "contains":         "Contains",
  "does-not-contain": "Does Not Contain",
  "equals":           "Equals",
  "not-equals":       "Not Equals",
  "starts-with":      "Starts With",
  "ends-with":        "Ends With",
  "greater-than":     "Greater Than",
  "less-than":        "Less Than",
};

const LOGIC_LABELS: Record<string, string> = {
  and: "AND",
  or:  "OR",
  not: "NOT",
};

function chipToString(chip: ChipState): string {
  const def = CRITERIA_DEFS[chip.criteriaId];
  const opLabel = OPERATOR_LABELS[chip.operator] ?? chip.operator;
  const valLabel = chip.values.length > 0
    ? chip.values.map(v => `'${def.options.find(o => o.value === v)?.label ?? v}'`).join(", ")
    : "''";
  return `${def.label} ${opLabel} ${valLabel}`;
}

function groupToString(group: FilterGroupState, depth = 0): string {
  const logic = group.logicOperator;
  const joiner = ` ${LOGIC_LABELS[logic] === "NOT" ? "AND" : LOGIC_LABELS[logic]} `;

  const parts: string[] = [
    ...group.chips.map(chipToString),
    ...group.subGroups.map(g => groupToString(g, depth + 1)),
  ];

  if (parts.length === 0) return "";
  const inner = parts.filter(Boolean).join(joiner);

  if (logic === "not") return depth === 0 ? `NOT (${inner})` : `NOT (${inner})`;
  return depth === 0 && parts.length === 1 ? inner : `(${inner})`;
}

/* ── Demo wrapper ── */

function WithOperatorsDemo() {
  const [root, setRoot] = useState<FilterGroupState>({
    id: "root",
    logicOperator: "and",
    chips: [
      { uid: "1", criteriaId: "first-name", operator: "does-not-contain", values: ["jane"] },
      { uid: "2", criteriaId: "age",        operator: "equals",           values: ["30"]  },
    ],
    subGroups: [],
  });

  const [copied, setCopied] = useState(false);
  const description = groupToString(root) || "No criteria defined";

  const handleCopy = () => {
    navigator.clipboard.writeText(description).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 w-full">
      {/* Builder */}
      <FilterGroupRow group={root} isRoot onUpdate={setRoot} />

      {/* Criteria description */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="lyra-label text-lyra-fg-default">Criteria Description</span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 lyra-body-sm text-lyra-fg-secondary hover:text-lyra-fg-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus rounded-lyra-xs px-1"
            aria-label="Copy criteria description"
          >
            {copied
              ? <><Check className="h-3.5 w-3.5 text-lyra-status-success-strong" strokeWidth={2} />Copied</>
              : <><Copy className="h-3.5 w-3.5" strokeWidth={1.5} />Copy</>
            }
          </button>
        </div>
        <Input value={description} readonly className="w-full" />
      </div>
    </div>
  );
}

export const WithOperators: Story = {
  name: "With Operators",
  render: () => <WithOperatorsDemo />,
};

/* ── Custom content (Popover) ──
   FilterChip's own dropdown is always `Select` under the hood (checkbox
   list, optional search/operators) — its `options`/`selectedValues` API has
   no way to swap in different content like a single-select RadioGroup or a
   date-range calendar. When a filter-chip-styled trigger needs content
   `Select`/`Menu` can't hold, the supported pattern is: reuse
   `filterChipVariants` to style a plain trigger `<button>` so it still
   looks like a FilterChip, then open literally anything under it via
   `Popover` (which — unlike `Select`/`Menu` — takes arbitrary `content`).
   This is exactly how `agent-next-gen-v1`'s home tab date-range filter
   ("Date: Today", Performance/Productivity cards) is built: a RadioGroup
   for Today/Yesterday/Last 7 days/Custom, with a `DateRangePicker` revealed
   only when "Custom" is selected — content no `Menu`/`Select` items array
   could represent. */

type DateFilterValue = "today" | "yesterday" | "last7" | "custom";

const DATE_FILTER_OPTIONS: { value: DateFilterValue; label: string }[] = [
  { value: "today",     label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7",     label: "Last 7 days" },
  { value: "custom",    label: "Custom" },
];

function PopoverContentDemo() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<DateFilterValue>("today");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  const selectedLabel = DATE_FILTER_OPTIONS.find((o) => o.value === value)?.label ?? "";

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom"
      content={
        <div className="flex flex-col gap-3 p-3 w-[260px]">
          <RadioGroup value={value} onValueChange={(v) => setValue(v as DateFilterValue)}>
            {DATE_FILTER_OPTIONS.map((option) => (
              <RadioGroupItem key={option.value} value={option.value} label={option.label} />
            ))}
          </RadioGroup>
          {value === "custom" && (
            <DateRangePicker
              value={customRange}
              onChange={setCustomRange}
              placeholder="Select date range"
            />
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

export const CustomContentPopover: Story = {
  name: "Custom Content (Popover)",
  render: () => <PopoverContentDemo />,
};

/* ── All Variants ── */

export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="lyra-body-sm-emphasis text-lyra-fg-secondary">Default (empty, no selection)</span>
        <FilterChip
          label="Filter"
          options={sampleOptions}
          selectedValues={[]}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="lyra-body-sm-emphasis text-lyra-fg-secondary">Active (with selected values)</span>
        <FilterChip
          label="Filter"
          options={sampleOptions}
          selectedValues={["option-1", "option-2", "option-3"]}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="lyra-body-sm-emphasis text-lyra-fg-secondary">Error</span>
        <FilterChip
          label="Filter"
          options={sampleOptions}
          selectedValues={["option-1", "option-2"]}
          error
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="lyra-body-sm-emphasis text-lyra-fg-secondary">Disabled (empty)</span>
        <FilterChip
          label="Filter"
          options={sampleOptions}
          selectedValues={[]}
          disabled
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="lyra-body-sm-emphasis text-lyra-fg-secondary">Disabled (with values)</span>
        <FilterChip
          label="Filter"
          options={sampleOptions}
          selectedValues={["option-1", "option-2"]}
          disabled
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="lyra-body-sm-emphasis text-lyra-fg-secondary">Removable (with remove button)</span>
        <FilterChip
          label="Filter"
          options={sampleOptions}
          selectedValues={["option-1", "option-2"]}
          onRemove={() => {}}
        />
      </div>
    </div>
  ),
};
