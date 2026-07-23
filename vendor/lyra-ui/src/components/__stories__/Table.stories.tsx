import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SortableTableHead,
  TableToolbar,
  TableFooter,
  ColumnToggle,
  TableGroupRow,
  ColumnHeaderContextMenu,
  useColumnReorder,
  useTableGrouping,
  useAutoFitRows,
} from "../table";
import type { ColumnToggleItem } from "../table";
import type { SortDirection } from "../table";
import { Button } from "../button";
import { Input } from "../input";
import { FilterChip } from "../filter-chip";
import { ToggleGroup } from "../toggle-group";
import { Pencil, Copy, Trash2, RefreshCw, Check, Plus, SlidersHorizontal } from "lucide-react";
import { Checkbox } from "../checkbox";
import { cn } from "../../lib/utils";
import { CircleCheck, Minus, MoreVertical } from "lucide-react";

const meta: Meta<typeof Table> = {
  title: "Atoms/Table",
  component: Table,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

const sampleData = [
  { id: 1, name: "Agent Desktop #1", published: true, description: "Back office", createdBy: "Jim Smith" },
  { id: 2, name: "Agent Desktop #2", published: true, description: "Custom", createdBy: "Jim Smith" },
  { id: 3, name: "Agent Desktop #3", published: false, description: "Knowledge Worker", createdBy: "Jim Smith" },
  { id: 4, name: "Agent Desktop #4", published: true, description: "BPO", createdBy: "Jim Smith" },
  { id: 5, name: "Agent Desktop #5", published: true, description: "Collections", createdBy: "Jim Smith" },
];

export const Default: Story = {
  render: () => (
    <div className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px] shrink-0"><Checkbox aria-label="Select row" /></TableHead>
            <TableHead className="flex-[2]">Name</TableHead>
            <TableHead className="flex-1">Published</TableHead>
            <TableHead className="flex-[2]">Description</TableHead>
            <TableHead className="flex-[1.3]">Created By</TableHead>
            <TableHead className="w-[48px] shrink-0"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleData.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="w-[40px] shrink-0"><Checkbox aria-label="Select row" /></TableCell>
              <TableCell className="flex-[2] text-lyra-fg-link cursor-pointer hover:underline">{row.name}</TableCell>
              <TableCell className="flex-1">
                {row.published ? (
                  <CircleCheck className="h-5 w-5 text-lyra-status-success-strong" strokeWidth={1.5} />
                ) : (
                  <Minus className="h-5 w-5 text-lyra-fg-disabled" strokeWidth={1.5} />
                )}
              </TableCell>
              <TableCell className="flex-[2]">{row.description}</TableCell>
              <TableCell className="flex-[1.3]">{row.createdBy}</TableCell>
              <TableCell className="w-[48px] shrink-0">
                <button aria-label="More options" className="flex h-7 w-7 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-bg-surface-shell transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2">
                  <MoreVertical className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

export const WithSelectedRows: Story = {
  render: () => (
    <div className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px] shrink-0"><Checkbox checked="indeterminate" aria-label="Select all rows" /></TableHead>
            <TableHead className="flex-[2]">Name</TableHead>
            <TableHead className="flex-1">Published</TableHead>
            <TableHead className="flex-[2]">Description</TableHead>
            <TableHead className="flex-[1.3]">Created By</TableHead>
            <TableHead className="w-[48px] shrink-0"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleData.map((row) => (
            <TableRow key={row.id} data-state={row.id <= 2 ? "selected" : undefined}>
              <TableCell className="w-[40px] shrink-0"><Checkbox checked={row.id <= 2} aria-label="Select row" /></TableCell>
              <TableCell className="flex-[2] text-lyra-fg-link cursor-pointer hover:underline">{row.name}</TableCell>
              <TableCell className="flex-1">
                {row.published ? (
                  <CircleCheck className="h-5 w-5 text-lyra-status-success-strong" strokeWidth={1.5} />
                ) : (
                  <Minus className="h-5 w-5 text-lyra-fg-disabled" strokeWidth={1.5} />
                )}
              </TableCell>
              <TableCell className="flex-[2]">{row.description}</TableCell>
              <TableCell className="flex-[1.3]">{row.createdBy}</TableCell>
              <TableCell className="w-[48px] shrink-0">
                <button aria-label="More options" className="flex h-7 w-7 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-bg-surface-shell transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2">
                  <MoreVertical className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

/* ── Sortable ── */

const sortableData = [
  { id: 1, name: "Agent Desktop #1", description: "Back office", createdBy: "Alice Johnson" },
  { id: 2, name: "Agent Desktop #2", description: "Custom", createdBy: "Bob Smith" },
  { id: 3, name: "Agent Desktop #3", description: "Knowledge Worker", createdBy: "Charlie Lee" },
  { id: 4, name: "Agent Desktop #4", description: "BPO", createdBy: "Diana Park" },
  { id: 5, name: "Agent Desktop #5", description: "Collections", createdBy: "Eve Martinez" },
];

type SortKey = "name" | "description" | "createdBy";

function nextDirection(current: SortDirection): SortDirection {
  if (current === null) return "asc";
  if (current === "asc") return "desc";
  return null;
}

function SortableDemo() {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      const next = nextDirection(sortDir);
      setSortDir(next);
      if (next === null) setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...sortableData].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const aVal = a[sortKey].toLowerCase();
    const bVal = b[sortKey].toLowerCase();
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const dirFor = (key: SortKey): SortDirection =>
    sortKey === key ? sortDir : null;

  return (
    <div className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px] shrink-0"><Checkbox aria-label="Select row" /></TableHead>
            <SortableTableHead
              className="flex-[2]"
              sortDirection={dirFor("name")}
              onSort={() => handleSort("name")}
            >
              Name
            </SortableTableHead>
            <SortableTableHead
              className="flex-[2]"
              sortDirection={dirFor("description")}
              onSort={() => handleSort("description")}
            >
              Description
            </SortableTableHead>
            <SortableTableHead
              className="flex-[1.3]"
              sortDirection={dirFor("createdBy")}
              onSort={() => handleSort("createdBy")}
            >
              Created By
            </SortableTableHead>
            <TableHead className="w-[48px] shrink-0"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="w-[40px] shrink-0"><Checkbox aria-label="Select row" /></TableCell>
              <TableCell className="flex-[2] text-lyra-fg-link cursor-pointer hover:underline">{row.name}</TableCell>
              <TableCell className="flex-[2]">{row.description}</TableCell>
              <TableCell className="flex-[1.3]">{row.createdBy}</TableCell>
              <TableCell className="w-[48px] shrink-0">
                <button aria-label="More options" className="flex h-7 w-7 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-bg-surface-shell transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2">
                  <MoreVertical className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const Sortable: Story = {
  name: "Sortable",
  render: () => <SortableDemo />,
};

/* ── Reorderable + Sortable ── */

type ReorderColKey = "name" | "description" | "createdBy";

const reorderColumnConfig: Record<ReorderColKey, { label: string; flex: string }> = {
  name: { label: "Name", flex: "flex-[2]" },
  description: { label: "Description", flex: "flex-[2]" },
  createdBy: { label: "Created By", flex: "flex-[1.3]" },
};

const reorderData = [
  { id: 1, name: "Agent Desktop #1", description: "Back office", createdBy: "Alice Johnson" },
  { id: 2, name: "Agent Desktop #2", description: "Custom", createdBy: "Bob Smith" },
  { id: 3, name: "Agent Desktop #3", description: "Knowledge Worker", createdBy: "Charlie Lee" },
  { id: 4, name: "Agent Desktop #4", description: "BPO", createdBy: "Diana Park" },
  { id: 5, name: "Agent Desktop #5", description: "Collections", createdBy: "Eve Martinez" },
];

function ReorderableDemo() {
  const [sortKey, setSortKey] = useState<ReorderColKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const { columnOrder, dragOverKey, dragHandlers } = useColumnReorder<ReorderColKey>([
    "name",
    "description",
    "createdBy",
  ]);

  const handleSort = (key: ReorderColKey) => {
    if (sortKey === key) {
      const next: SortDirection = sortDir === null ? "asc" : sortDir === "asc" ? "desc" : null;
      setSortDir(next);
      if (next === null) setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...reorderData].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const aVal = a[sortKey].toLowerCase();
    const bVal = b[sortKey].toLowerCase();
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const dirFor = (key: ReorderColKey): SortDirection =>
    sortKey === key ? sortDir : null;

  return (
    <div className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px] shrink-0"><Checkbox aria-label="Select row" /></TableHead>
            {columnOrder.map((key) => {
              const col = reorderColumnConfig[key];
              return (
                <SortableTableHead
                  key={key}
                  className={col.flex}
                  sortDirection={dirFor(key)}
                  onSort={() => handleSort(key)}
                  columnKey={key}
                  dragHandlers={dragHandlers}
                  isDragOver={dragOverKey === key}
                >
                  {col.label}
                </SortableTableHead>
              );
            })}
            <TableHead className="w-[48px] shrink-0"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="w-[40px] shrink-0"><Checkbox aria-label="Select row" /></TableCell>
              {columnOrder.map((key) => {
                const col = reorderColumnConfig[key];
                return (
                  <TableCell
                    key={key}
                    className={cn(
                      col.flex,
                      key === "name" && "text-lyra-fg-link cursor-pointer hover:underline"
                    )}
                  >
                    {row[key]}
                  </TableCell>
                );
              })}
              <TableCell className="w-[48px] shrink-0">
                <button aria-label="More options" className="flex h-7 w-7 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-bg-surface-shell transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2">
                  <MoreVertical className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const Reorderable: Story = {
  name: "Reorderable",
  render: () => <ReorderableDemo />,
};

/* ── TableToolbar ── */

const toolbarColumns: ColumnToggleItem[] = [
  { key: "name", label: "Name" },
  { key: "published", label: "Published" },
  { key: "description", label: "Description" },
  { key: "createdBy", label: "Created By" },
  { key: "createdDate", label: "Created Date" },
];

const toolbarFilterDefs = [
  {
    key: "description",
    label: "Description",
    options: [
      { value: "Back office", label: "Back office" },
      { value: "Custom", label: "Custom" },
      { value: "Knowledge Worker", label: "Knowledge Worker" },
    ],
  },
  {
    key: "createdBy",
    label: "Created By",
    options: [
      { value: "Jim Smith", label: "Jim Smith" },
      { value: "Alice Johnson", label: "Alice Johnson" },
    ],
  },
];

interface ToolbarDemoProps {
  showSearch: boolean;
  showFilters: boolean;
  showColumns: boolean;
  showActions: boolean;
  showTitle: boolean;
  toolbarPanelToggle: string;
}

function ToolbarDemo({ showSearch, showFilters, showColumns, showActions, showTitle, toolbarPanelToggle }: ToolbarDemoProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({ description: [], createdBy: [] });
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(toolbarColumns.map((c) => c.key)));

  return (
    <div className="border border-lyra-border-subtle rounded-lyra-md overflow-hidden">
      <TableToolbar
        title={showTitle ? "Records" : undefined}
        searchQuery={showSearch ? searchQuery : undefined}
        onSearchChange={showSearch ? setSearchQuery : undefined}
        searchPlaceholder="Quick Search"
        filterDefs={showFilters ? toolbarFilterDefs : undefined}
        filterValues={showFilters ? filterValues : undefined}
        onFilterChange={showFilters ? (key, vals) => setFilterValues((p) => ({ ...p, [key]: vals })) : undefined}
        onFilterClear={showFilters ? () => setFilterValues({ description: [], createdBy: [] }) : undefined}
        actionDefs={showActions ? [
          { key: "refresh", label: "Refresh", icon: <RefreshCw className="h-4 w-4" strokeWidth={1.5} /> },
          { key: "edit",    label: "Edit",    icon: <Pencil   className="h-4 w-4" strokeWidth={1.5} /> },
          { key: "copy",    label: "Copy",    icon: <Copy     className="h-4 w-4" strokeWidth={1.5} /> },
          { key: "delete",  label: "Delete",  icon: <Trash2   className="h-4 w-4" strokeWidth={1.5} /> },
        ] : undefined}
        actions={showColumns ? (
          <ColumnToggle columns={toolbarColumns} visibleColumns={visibleCols} onVisibilityChange={setVisibleCols} />
        ) : undefined}
        toolbarPanelToggle={toolbarPanelToggle === "none" ? undefined : toolbarPanelToggle as "left" | "right" | "both"}
        onLeftPanelToggle={() => {}}
        onRightPanelToggle={() => {}}
      />
    </div>
  );
}

export const Toolbar: Story = {
  name: "Toolbar",
  parameters: {
    controls: {
      include: ["showSearch", "showFilters", "showColumns", "showActions", "showTitle", "toolbarPanelToggle"],
    },
  },
  args: {
    showSearch: true,
    showFilters: true,
    showColumns: true,
    showActions: true,
    showTitle: false,
    toolbarPanelToggle: "none",
  } as unknown as Record<string, unknown>,
  argTypes: {
    showSearch:         { control: "boolean", description: "Show quick search" },
    showFilters:        { control: "boolean", description: "Show filter chips" },
    showColumns:        { control: "boolean", description: "Show column toggle" },
    showActions:        { control: "boolean", description: "Show action icon buttons" },
    showTitle:          { control: "boolean", description: "Show title above search row" },
    toolbarPanelToggle: { control: "select", options: ["none", "left", "right", "both"], description: "Panel toggle button(s)" },
  } as unknown as Record<string, unknown>,
  render: (args) => <ToolbarDemo {...(args as unknown as ToolbarDemoProps)} />,
};

/* ── TableFooter (Pagination) ── */

interface FooterDemoProps {
  showDisplayCount: boolean;
  showRowsPerPage: boolean;
  showJumpButtons: boolean;
}

function FooterDemo({ showDisplayCount, showRowsPerPage, showJumpButtons }: FooterDemoProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const totalRecords = 53;
  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalRecords);

  return (
    <TableFooter
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }}
      totalRecords={totalRecords}
      displayStart={start}
      displayEnd={end}
      showDisplayCount={showDisplayCount}
      showRowsPerPage={showRowsPerPage}
      showJumpButtons={showJumpButtons}
    />
  );
}

export const Footer: Story = {
  name: "Footer (Pagination)",
  argTypes: {
    showDisplayCount: { control: "boolean", description: "Show display count (Displaying X-Y of Z)" },
    showRowsPerPage:  { control: "boolean", description: "Show rows per page selector" },
    showJumpButtons:  { control: "boolean", description: "Show jump to first/last page buttons" },
  } as unknown as Record<string, unknown>,
  args: {
    showDisplayCount: true,
    showRowsPerPage: true,
    showJumpButtons: true,
  } as unknown as Record<string, unknown>,
  render: (args) => <FooterDemo {...(args as unknown as FooterDemoProps)} />,
};

/* ── ColumnToggle ── */

const allColumns = [
  { key: "name", label: "Name" },
  { key: "published", label: "Published" },
  { key: "description", label: "Description" },
  { key: "createdBy", label: "Created By" },
  { key: "customerCard", label: "Customer Card" },
  { key: "createdDate", label: "Created Date" },
  { key: "modifiedDate", label: "Modified Date" },
  { key: "version", label: "Version" },
];

function ColumnToggleDemo() {
  const [visible, setVisible] = useState<Set<string>>(
    new Set(["name", "published", "description", "createdBy"])
  );

  return (
    <div className="flex items-center gap-4">
      <ColumnToggle
        columns={allColumns}
        visibleColumns={visible}
        onVisibilityChange={setVisible}
      />
      <span className="lyra-body-sm text-lyra-fg-secondary">
        {visible.size} of {allColumns.length} columns visible
      </span>
    </div>
  );
}

export const ColumnVisibility: Story = {
  name: "Column Toggle",
  render: () => <ColumnToggleDemo />,
};

/* ── Grouped Rows ── */

type GroupColKey = "description" | "createdBy";

const groupData = [
  { id: 1, name: "Agent Desktop #1", description: "Back office", createdBy: "Jim Smith" },
  { id: 2, name: "Agent Desktop #2", description: "Custom", createdBy: "Jim Smith" },
  { id: 3, name: "Agent Desktop #3", description: "Knowledge Worker", createdBy: "Alice Johnson" },
  { id: 4, name: "Agent Desktop #4", description: "BPO", createdBy: "Alice Johnson" },
  { id: 5, name: "Agent Desktop #5", description: "Collections", createdBy: "Jim Smith" },
  { id: 6, name: "Agent Desktop #6", description: "Back office", createdBy: "Bob Lee" },
  { id: 7, name: "Agent Desktop #7", description: "Custom", createdBy: "Bob Lee" },
  { id: 8, name: "Agent Desktop #8", description: "BPO", createdBy: "Alice Johnson" },
];

function GroupedDemo() {
  const getValueForKey = useCallback(
    (row: (typeof groupData)[number], key: string) => {
      if (key === "name") return row.name;
      if (key === "description") return row.description;
      if (key === "createdBy") return row.createdBy;
      return "";
    },
    []
  );

  const { groupByKey, groups, toggleGroup, collapsedGroups, setGroupByKey } =
    useTableGrouping(groupData, getValueForKey);

  const [contextMenuKey, setContextMenuKey] = useState<string | null>(null);

  const handleContextMenu = (
    e: React.MouseEvent,
    columnKey: string,
  ) => {
    e.preventDefault();
    setContextMenuKey(columnKey);
  };

  const colCount = 5;

  const headerColumns: { key: string; label: string; flex: string }[] = [
    { key: "name", label: "Name", flex: "flex-[2]" },
    { key: "description", label: "Description", flex: "flex-[2]" },
    { key: "createdBy", label: "Created By", flex: "flex-[1.3]" },
  ];

  return (
    <div className="h-[500px]">
      <p className="lyra-body-sm text-lyra-fg-secondary mb-3">
        Right-click any column header to group rows by that column.
      </p>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px] shrink-0">
              <Checkbox aria-label="Select all" />
            </TableHead>
            {headerColumns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(col.flex, "relative")}
                onContextMenu={(e) => handleContextMenu(e, col.key)}
              >
                {col.label}
                {contextMenuKey === col.key && (
                  <ColumnHeaderContextMenu
                    columnKey={col.key}
                    columnLabel={col.label}
                    currentGroupBy={groupByKey}
                    onGroupBy={(key) => {
                      setGroupByKey(key);
                      setContextMenuKey(null);
                    }}
                    onClose={() => setContextMenuKey(null)}
                  />
                )}
              </TableHead>
            ))}
            <TableHead className="w-[48px] shrink-0">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupByKey && groups
            ? groups.map((group) => (
                <React.Fragment key={group.label}>
                  <TableGroupRow
                    label={group.label}
                    count={group.rows.length}
                    expanded={!collapsedGroups.has(group.label)}
                    onToggle={() => toggleGroup(group.label)}
                    colSpan={colCount}
                  />
                  {!collapsedGroups.has(group.label) &&
                    group.rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="w-[40px] shrink-0">
                          <Checkbox aria-label="Select row" />
                        </TableCell>
                        <TableCell className="flex-[2] text-lyra-fg-link cursor-pointer hover:underline">
                          {row.name}
                        </TableCell>
                        <TableCell className="flex-[2]">
                          {row.description}
                        </TableCell>
                        <TableCell className="flex-[1.3]">
                          {row.createdBy}
                        </TableCell>
                        <TableCell className="w-[48px] shrink-0">
                          <button
                            aria-label="More options"
                            className="flex h-7 w-7 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-bg-surface-shell transition-colors"
                          >
                            <MoreVertical
                              className="h-4 w-4"
                              strokeWidth={1.5}
                            />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                </React.Fragment>
              ))
            : groupData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="w-[40px] shrink-0">
                    <Checkbox aria-label="Select row" />
                  </TableCell>
                  <TableCell className="flex-[2] text-lyra-fg-link cursor-pointer hover:underline">
                    {row.name}
                  </TableCell>
                  <TableCell className="flex-[2]">
                    {row.description}
                  </TableCell>
                  <TableCell className="flex-[1.3]">
                    {row.createdBy}
                  </TableCell>
                  <TableCell className="w-[48px] shrink-0">
                    <button
                      aria-label="More options"
                      className="flex h-7 w-7 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-bg-surface-shell transition-colors"
                    >
                      <MoreVertical
                        className="h-4 w-4"
                        strokeWidth={1.5}
                      />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

    </div>
  );
}

export const Grouped: Story = {
  name: "Grouped Rows",
  render: () => <GroupedDemo />,
};

/* ── Auto-Fit Rows (Dashboard) ── */

const autoFitData = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Agent Desktop #${i + 1}`,
  description: ["Back office", "Custom", "Knowledge Worker", "BPO", "Collections"][i % 5],
  createdBy: ["Jim Smith", "Alice Johnson", "Bob Lee"][i % 3],
}));

function AutoFitDemo() {
  const { containerRef, rowsPerPage } = useAutoFitRows(40, 40, 3);
  const [currentPage, setCurrentPage] = useState(1);

  const totalRecords = autoFitData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));

  // Reset to page 1 if rowsPerPage changes and current page is now out of range
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [rowsPerPage, totalPages, currentPage]);

  const start = (currentPage - 1) * rowsPerPage;
  const visibleRows = autoFitData.slice(start, start + rowsPerPage);
  const displayStart = start + 1;
  const displayEnd = Math.min(start + rowsPerPage, totalRecords);

  return (
    <div>
      <p className="lyra-body-sm text-lyra-fg-secondary mb-3">
        Dashboard variant — rows per page is automatically calculated from
        container height (resize your browser to see it adapt). Pagination
        adjusts dynamically.
      </p>
      <div
        ref={containerRef}
        className="border border-lyra-border-subtle rounded-lyra-lg overflow-hidden"
        style={{ height: 360 }}
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="flex-[2]">Name</TableHead>
              <TableHead className="flex-[2]">Description</TableHead>
              <TableHead className="flex-[1.3]">Created By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="flex-[2] text-lyra-fg-link cursor-pointer hover:underline">
                  {row.name}
                </TableCell>
                <TableCell className="flex-[2]">{row.description}</TableCell>
                <TableCell className="flex-[1.3]">{row.createdBy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TableFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        rowsPerPage={rowsPerPage}
        totalRecords={totalRecords}
        displayStart={displayStart}
        displayEnd={displayEnd}
      />
    </div>
  );
}

export const AutoFit: Story = {
  name: "Auto-Fit (Dashboard)",
  render: () => <AutoFitDemo />,
};

/* ── Advanced Search Toolbar story ── */

/* ── Full filter-builder shared with the Advanced Search popover ── */

const AS_TEXT_OPS = [
  { value: "contains", label: "Contains" }, { value: "does-not-contain", label: "Does Not Contain" },
  { value: "equals", label: "Equals" }, { value: "not-equals", label: "Not Equals" },
  { value: "starts-with", label: "Starts With" }, { value: "ends-with", label: "Ends With" },
];
const AS_NUM_OPS = [
  { value: "equals", label: "Equals" }, { value: "not-equals", label: "Not Equals" },
  { value: "greater-than", label: "Greater Than" }, { value: "less-than", label: "Less Than" },
];
const AS_CRITERIA_DEFS: Record<string, { label: string; operators: typeof AS_TEXT_OPS; options: {value:string;label:string}[] }> = {
  "first-name": { label: "First Name", operators: AS_TEXT_OPS, options: [{value:"jane",label:"Jane"},{value:"john",label:"John"},{value:"alice",label:"Alice"}] },
  "last-name":  { label: "Last Name",  operators: AS_TEXT_OPS, options: [{value:"smith",label:"Smith"},{value:"jones",label:"Jones"}] },
  "age":        { label: "Age",        operators: AS_NUM_OPS,  options: [{value:"25",label:"25"},{value:"30",label:"30"},{value:"40",label:"40"}] },
  "gender":     { label: "Gender",     operators: [{value:"equals",label:"Equals"},{value:"not-equals",label:"Not Equals"}], options: [{value:"male",label:"Male"},{value:"female",label:"Female"},{value:"non-binary",label:"Non-binary"}] },
  "department": { label: "Department", operators: AS_TEXT_OPS, options: [{value:"engineering",label:"Engineering"},{value:"design",label:"Design"},{value:"sales",label:"Sales"}] },
  "status":     { label: "Status",     operators: [{value:"equals",label:"Equals"},{value:"not-equals",label:"Not Equals"}], options: [{value:"active",label:"Active"},{value:"inactive",label:"Inactive"},{value:"pending",label:"Pending"}] },
};
const AS_LOGIC_ITEMS = [{value:"and",label:"And"},{value:"or",label:"Or"},{value:"not",label:"Not"}];
const AS_OP_LABELS: Record<string,string> = {
  "contains":"Contains","does-not-contain":"Does Not Contain","equals":"Equals","not-equals":"Not Equals",
  "starts-with":"Starts With","ends-with":"Ends With","greater-than":"Greater Than","less-than":"Less Than",
};

type AsLogic = "and"|"or"|"not";
interface AsChip { uid:string; criteriaId:string; operator:string; values:string[] }
interface AsGroup { id:string; logicOperator:AsLogic; chips:AsChip[]; subGroups:AsGroup[] }

let _asUid = 100;
const asNextUid = () => String(++_asUid);
const asMakeChip = (id:string): AsChip => ({ uid:asNextUid(), criteriaId:id, operator:AS_CRITERIA_DEFS[id].operators[0].value, values:[] });
const asMakeGroup = (): AsGroup => ({ id:asNextUid(), logicOperator:"and", chips:[], subGroups:[] });

function asBuildString(g: AsGroup, depth=0): string {
  const joiner = g.logicOperator==="not" ? " AND " : ` ${g.logicOperator.toUpperCase()} `;
  const parts = [
    ...g.chips.map(c => {
      const def = AS_CRITERIA_DEFS[c.criteriaId];
      const vals = c.values.length>0 ? c.values.map(v=>`'${def.options.find(o=>o.value===v)?.label??v}'`).join(", ") : "''";
      return `${def.label} ${AS_OP_LABELS[c.operator]??c.operator} ${vals}`;
    }),
    ...g.subGroups.map(s=>asBuildString(s,depth+1)),
  ].filter(Boolean);
  if (!parts.length) return "";
  const inner = parts.join(joiner);
  if (g.logicOperator==="not") return `NOT (${inner})`;
  return depth===0 && parts.length===1 ? inner : `(${inner})`;
}

// Portal-based criteria menu
function AsCriteriaMenu({ onSelect }: { onSelect:(id:string)=>void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({top:0,left:0});
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (btnRef.current) { const r=btnRef.current.getBoundingClientRect(); setPos({top:r.bottom+4,left:r.left}); }
    setOpen(v=>!v);
  };
  React.useEffect(() => {
    if (!open) return;
    const h=(e:MouseEvent)=>{
      if (menuRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[open]);

  return (
    <>
      <Button ref={btnRef} variant="outline" size="md" onClick={handleOpen}>
        <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Criteria
      </Button>
      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={{position:"fixed",top:pos.top,left:pos.left,zIndex:9999}}
          className="min-w-[180px] rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg p-2">
          {Object.entries(AS_CRITERIA_DEFS).map(([id,def])=>(
            <button key={id} type="button" onClick={()=>{onSelect(id);setOpen(false);}}
              className="w-full flex items-center px-3 py-2 lyra-body-md text-lyra-fg-default rounded-lyra-sm text-left hover:bg-lyra-state-hover transition-colors">
              {def.label}
            </button>
          ))}
        </div>, document.body
      )}
    </>
  );
}

function AsGroupRow({ group, isRoot, onUpdate, onDelete }: {
  group:AsGroup; isRoot?:boolean; onUpdate:(g:AsGroup)=>void; onDelete?:()=>void;
}) {
  const addChip=(id:string)=>onUpdate({...group,chips:[...group.chips,asMakeChip(id)]});
  const removeChip=(uid:string)=>onUpdate({...group,chips:group.chips.filter(c=>c.uid!==uid)});
  const updateChip=(uid:string,p:Partial<AsChip>)=>onUpdate({...group,chips:group.chips.map(c=>c.uid===uid?{...c,...p}:c)});
  const addSub=()=>onUpdate({...group,subGroups:[...group.subGroups,asMakeGroup()]});
  const updateSub=(id:string,g:AsGroup)=>onUpdate({...group,subGroups:group.subGroups.map(s=>s.id===id?g:s)});
  const removeSub=(id:string)=>onUpdate({...group,subGroups:group.subGroups.filter(s=>s.id!==id)});

  return (
    <div className={!isRoot?"w-full border border-lyra-border-subtle rounded-lyra-md p-3 bg-lyra-bg-surface-canvas":"w-full"}>
      <div className="flex items-center gap-2 mb-2">
        <ToggleGroup items={AS_LOGIC_ITEMS} value={group.logicOperator}
          onValueChange={v=>v&&onUpdate({...group,logicOperator:v as AsLogic})} />
        <span className="lyra-body-sm text-lyra-fg-secondary">
          {group.logicOperator==="and"?"All conditions must match":group.logicOperator==="or"?"Any one condition must match":"No conditions must match"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 w-full">
        {group.chips.map(chip=>{
          const def=AS_CRITERIA_DEFS[chip.criteriaId];
          return (
            <FilterChip key={chip.uid} label={def.label} operators={def.operators}
              selectedOperator={chip.operator} onOperatorChange={op=>updateChip(chip.uid,{operator:op})}
              options={def.options} selectedValues={chip.values}
              onSelectionChange={vals=>updateChip(chip.uid,{values:vals})}
              onRemove={()=>removeChip(chip.uid)} />
          );
        })}
        <AsCriteriaMenu onSelect={addChip} />
        <Button variant="outline" size="md" onClick={addSub}><Plus className="h-3.5 w-3.5" strokeWidth={2}/>Group</Button>
        {!isRoot && onDelete && <Button variant="ghost" size="md" onClick={onDelete}>Delete</Button>}
      </div>
      {group.subGroups.length>0 && (
        <div className="mt-3 flex flex-col gap-2">
          {group.subGroups.map(sub=>(
            <AsGroupRow key={sub.id} group={sub} onUpdate={g=>updateSub(sub.id,g)} onDelete={()=>removeSub(sub.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdvancedSearchContent({ root, onUpdate }: { root: AsGroup; onUpdate: (g: AsGroup) => void }) {
  const [copied, setCopied] = useState(false);
  const description = asBuildString(root) || "No criteria defined";

  const handleCopy = () => {
    navigator.clipboard.writeText(description).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };

  return (
    <div className="flex flex-col gap-4 p-4 w-full">
      <AsGroupRow group={root} isRoot onUpdate={onUpdate} />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="lyra-label text-lyra-fg-default">Criteria Description</span>
          <button type="button" onClick={handleCopy}
            className="inline-flex items-center gap-1.5 lyra-body-sm text-lyra-fg-secondary hover:text-lyra-fg-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus rounded-lyra-xs px-1"
            aria-label="Copy criteria description">
            {copied?<><Check className="h-3.5 w-3.5 text-lyra-status-success-strong" strokeWidth={2}/>Copied</>
                   :<><Copy className="h-3.5 w-3.5" strokeWidth={1.5}/>Copy</>}
          </button>
        </div>
        <Input value={description} readonly className="w-full" />
      </div>
    </div>
  );
}

export const AdvancedSearch: Story = {
  name: "Toolbar — Query Builder",
  render: () => {
    const [appliedRoot, setAppliedRoot] = useState<AsGroup | null>(null);
    const [root, setRoot] = useState<AsGroup>({ id:"as-root", logicOperator:"and", chips:[], subGroups:[] });
    const [savedSearchName, setSavedSearchName] = useState<string | undefined>(undefined);

    // Filters are "applied" only when Apply was last clicked AND root has actual chips/groups
    const hasAnyFilters = (g: AsGroup): boolean =>
      g.chips.length > 0 || g.subGroups.some(hasAnyFilters);

    const isApplied = appliedRoot !== null && hasAnyFilters(appliedRoot);

    const handleUpdate = (g: AsGroup) => {
      setRoot(g);
      // If applied filters exist but user removes all chips, auto-clear applied state
      if (appliedRoot !== null && !hasAnyFilters(g)) setAppliedRoot(null);
    };

    return (
      <div className="h-[400px] flex flex-col border border-lyra-border-subtle rounded-lyra-lg overflow-hidden">
        <TableToolbar
          searchQuery=""
          onSearchChange={() => {}}
          recordCount={320}
          showAdvancedSearch
          advancedSearchContent={<AdvancedSearchContent root={root} onUpdate={handleUpdate} />}
          advancedSearchApplied={isApplied}
          advancedSearchTitle={savedSearchName}
          advancedSearchDescription={isApplied && appliedRoot ? (asBuildString(appliedRoot) || undefined) : undefined}
          onAdvancedSearchApply={() => setAppliedRoot(root)}
          onAdvancedSearchCancel={() => {/* just closes — filters preserved */}}
          onSaveSearch={(name) => { setSavedSearchName(name); setAppliedRoot(root); }}
        />
      </div>
    );
  },
};
