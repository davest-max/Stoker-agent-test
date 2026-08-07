import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useCallback, useRef } from "react";
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
import type { ColumnToggleItem, SortDirection, ToolbarActionDef } from "../table";
import { PageHeader } from "../page-header";
import { SidePanel } from "../side-panel";
import { InteriorPanel } from "../interior-panel";
import { TabList, Tab } from "../tabs";
import { Button } from "../button";
import { Checkbox } from "../checkbox";
import { cn } from "../../lib/utils";

import { AiIcon } from "../icons/ai-icon";
import {
  Pencil,
  Copy,
  Trash2,
  RefreshCw,
  Plus,
  CircleCheck,
  Minus,
  MoreVertical,
} from "lucide-react";

/* ── Sample Data ── */

interface DesktopRow {
  id: number;
  name: string;
  published: boolean;
  description: string;
  createdBy: string;
  customerCard: string;
}

const sampleData: DesktopRow[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Agent Desktop #${i + 1}`,
  published: i % 3 !== 0,
  description: ["Back office", "Custom", "Knowledge Worker", "BPO", "Collections"][i % 5],
  createdBy: ["Jim Smith", "Alice Johnson", "Bob Lee", "Diana Park"][i % 4],
  customerCard: ["Default", "Premium", "Basic", "Enterprise"][i % 4],
}));

/* ── Column config ── */

type ColKey = "name" | "published" | "description" | "createdBy" | "customerCard";

const columnConfig: Record<ColKey, { label: string; flex: string }> = {
  name: { label: "Name", flex: "flex-[2]" },
  published: { label: "Published", flex: "flex-1" },
  description: { label: "Description", flex: "flex-[2]" },
  createdBy: { label: "Created By", flex: "flex-[1.3]" },
  customerCard: { label: "Customer Card", flex: "flex-[1.3]" },
};

const allColumnDefs: ColumnToggleItem[] = Object.entries(columnConfig).map(([key, val]) => ({
  key,
  label: val.label,
}));

const defaultVisibleKeys: ColKey[] = ["name", "published", "description", "createdBy"];

function nextDirection(current: SortDirection): SortDirection {
  if (current === null) return "asc";
  if (current === "asc") return "desc";
  return null;
}

/* ── Feature flags ── */

interface TableFeatures {
  sortable: boolean;
  reorderable: boolean;
  groupable: boolean;
  autoFit: boolean;
  showTabs: boolean;
  showToolbar: boolean;
  showAskAI: boolean;
  showChip: boolean;
  headerPanelToggle: "none" | "left" | "right" | "both";
  toolbarPanelToggle: "none" | "left" | "right" | "both";
  showQuickSearch: boolean;
  showRefresh: boolean;
  showEdit: boolean;
  showCopy: boolean;
  showDelete: boolean;
  showColumns: boolean;
  showFilters: boolean;
  showTitle: boolean;
}

/* ── Template Component ── */

function DataManagementTemplate({ sortable, reorderable, groupable, autoFit, showTabs, showToolbar, showAskAI, showChip, headerPanelToggle, toolbarPanelToggle, showQuickSearch, showRefresh, showEdit, showCopy, showDelete, showColumns, showFilters, showTitle }: TableFeatures) {
  /* Interior panels (controlled by Toolbar toggle) */
  const [toolbarLeftOpen, setToolbarLeftOpen] = useState(false);
  const [toolbarRightOpen, setToolbarRightOpen] = useState(false);

  /* Left side panel — hover overlay + pin */
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [leftPanelPinned, setLeftPanelPinned] = useState(false);
  const leftHoverTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleLeftPanelToggle = useCallback(() => {
    if (leftPanelPinned) setLeftPanelOpen((v) => !v);
  }, [leftPanelPinned]);

  const handleLeftHoverStart = useCallback(() => {
    if (!leftPanelPinned) { clearTimeout(leftHoverTimeout.current); setLeftPanelOpen(true); }
  }, [leftPanelPinned]);

  const handleLeftHoverEnd = useCallback(() => {
    if (!leftPanelPinned) { leftHoverTimeout.current = setTimeout(() => setLeftPanelOpen(false), 300); }
  }, [leftPanelPinned]);

  const handleLeftPinToggle = useCallback(() => {
    setLeftPanelPinned((prev) => { const next = !prev; setLeftPanelOpen(next); return next; });
  }, []);

  /* Right side panel — hover overlay + pin (independent from left) */
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelPinned, setRightPanelPinned] = useState(false);
  const rightHoverTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleRightHoverStart = useCallback(() => {
    if (!rightPanelPinned) { clearTimeout(rightHoverTimeout.current); setRightPanelOpen(true); }
  }, [rightPanelPinned]);

  const handleRightHoverEnd = useCallback(() => {
    if (!rightPanelPinned) { rightHoverTimeout.current = setTimeout(() => setRightPanelOpen(false), 300); }
  }, [rightPanelPinned]);

  const handleRightPinToggle = useCallback(() => {
    setRightPanelPinned((prev) => { const next = !prev; setRightPanelOpen(next); return next; });
  }, []);

  /* Unpin side panels when screen < 1024px, prevent pinning below that */
  const [canPin, setCanPin] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);

  React.useEffect(() => {
    const check = () => {
      const wide = window.innerWidth >= 1024;
      setCanPin(wide);
      if (!wide) {
        setLeftPanelPinned(false);
        setRightPanelPinned(false);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const guardedLeftPinToggle = useCallback(() => {
    if (!canPin) return;
    setLeftPanelPinned((prev) => { const next = !prev; setLeftPanelOpen(next); return next; });
  }, [canPin]);

  const guardedRightPinToggle = useCallback(() => {
    if (!canPin) return;
    setRightPanelPinned((prev) => { const next = !prev; setRightPanelOpen(next); return next; });
  }, [canPin]);

  /* Tabs */
  const [activeTab, setActiveTab] = useState("all");

  /* Search + Column visibility */
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(defaultVisibleKeys));

  /* Filters */
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({
    description: [],
    createdBy: [],
    published: [],
  });

  const filterDefs = [
    {
      key: "description",
      label: "Description",
      options: [
        { value: "Back office", label: "Back office" },
        { value: "Custom", label: "Custom" },
        { value: "Knowledge Worker", label: "Knowledge Worker" },
        { value: "BPO", label: "BPO" },
        { value: "Collections", label: "Collections" },
      ],
    },
    {
      key: "createdBy",
      label: "Created By",
      options: [
        { value: "Jim Smith", label: "Jim Smith" },
        { value: "Alice Johnson", label: "Alice Johnson" },
        { value: "Bob Lee", label: "Bob Lee" },
        { value: "Diana Park", label: "Diana Park" },
      ],
    },
    {
      key: "published",
      label: "Published",
      options: [
        { value: "true", label: "Published" },
        { value: "false", label: "Unpublished" },
      ],
    },
  ];

  const handleFilterChange = (key: string, values: string[]) => {
    setFilterValues((prev) => ({ ...prev, [key]: values }));
  };

  const clearAllFilters = () => {
    setFilterValues({ description: [], createdBy: [], published: [] });
  };

  /* Pre-filter data (needed before grouping) */
  const filtered = sampleData.filter((row) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !row.name.toLowerCase().includes(q) &&
        !row.description.toLowerCase().includes(q) &&
        !row.createdBy.toLowerCase().includes(q)
      ) return false;
    }
    if (filterValues.description.length > 0 && !filterValues.description.includes(row.description)) return false;
    if (filterValues.createdBy.length > 0 && !filterValues.createdBy.includes(row.createdBy)) return false;
    if (filterValues.published.length > 0 && !filterValues.published.includes(String(row.published))) return false;
    return true;
  });

  /* Sorting */
  const [sortKey, setSortKey] = useState<ColKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  /* Column reorder */
  const { columnOrder: allColumnOrder, dragOverKey, dragHandlers } = useColumnReorder<ColKey>(
    Object.keys(columnConfig) as ColKey[]
  );
  const columnOrder = allColumnOrder.filter((k) => visibleCols.has(k));

  /* Grouping */
  const getValueForKey = useCallback(
    (row: DesktopRow, key: string) =>
      (row as Record<string, unknown>)[key]?.toString() ?? "",
    []
  );
  const { groupByKey, groups, toggleGroup, collapsedGroups, setGroupByKey } =
    useTableGrouping(filtered, getValueForKey);

  /* Context menu */
  const [contextMenuKey, setContextMenuKey] = useState<string | null>(null);

  /* Row selection */
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const allSelected = selectedRows.size === sampleData.length && sampleData.length > 0;
  const someSelected = selectedRows.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected || someSelected) setSelectedRows(new Set());
    else setSelectedRows(new Set(sampleData.map((r) => r.id)));
  };
  const toggleRow = (id: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* AutoFit */
  const { containerRef, rowsPerPage: autoFitRows } = useAutoFitRows(40, 40, 3);
  const effectiveRowsPerPage = autoFit ? autoFitRows : rowsPerPage;

  /* Sort + filter */
  const handleSort = (key: ColKey) => {
    if (sortKey === key) {
      const next = nextDirection(sortDir);
      setSortDir(next);
      if (next === null) setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const aVal = String((a as Record<string, unknown>)[sortKey]).toLowerCase();
    const bVal = String((b as Record<string, unknown>)[sortKey]).toLowerCase();
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  /* Pagination calcs */
  const totalRecords = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / effectiveRowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * effectiveRowsPerPage;
  const pageRows = sorted.slice(startIdx, startIdx + effectiveRowsPerPage);
  const displayStart = totalRecords === 0 ? 0 : startIdx + 1;
  const displayEnd = Math.min(startIdx + effectiveRowsPerPage, totalRecords);

  const dirFor = (key: ColKey): SortDirection => (sortKey === key ? sortDir : null);

  /* Reset page when rows-per-page changes (autofit) */
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [effectiveRowsPerPage, totalPages, currentPage]);

  /* Render cell value */
  const renderCell = (row: DesktopRow, key: ColKey) => {
    if (key === "name") {
      return (
        <span className="text-lyra-fg-link cursor-pointer hover:underline">{row.name}</span>
      );
    }
    if (key === "published") {
      return row.published ? (
        <CircleCheck className="h-5 w-5 text-lyra-status-success-strong" strokeWidth={1.5} />
      ) : (
        <Minus className="h-5 w-5 text-lyra-fg-disabled" strokeWidth={1.5} />
      );
    }
    return String((row as Record<string, unknown>)[key] ?? "");
  };

  const colCount = columnOrder.length + 2;

  /* ── Header row ── */
  const renderHeaderRow = () => (
    <TableRow className="hover:bg-transparent">
      <TableHead className="w-[40px] shrink-0">
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={toggleSelectAll}
          aria-label="Select all rows"
        />
      </TableHead>
      {columnOrder.map((key) => {
        const col = columnConfig[key];

        /* Plain header when sorting is off */
        if (!sortable) {
          return (
            <TableHead key={key} className={col.flex}>
              {col.label}
            </TableHead>
          );
        }

        /* Sortable header (optionally reorderable + groupable) */
        return (
          <SortableTableHead
            key={key}
            className={cn(col.flex, "relative")}
            sortDirection={dirFor(key)}
            onSort={() => handleSort(key)}
            columnKey={reorderable ? key : undefined}
            dragHandlers={reorderable ? dragHandlers : undefined}
            isDragOver={reorderable ? dragOverKey === key : undefined}
            onContextMenu={
              groupable
                ? (e) => {
                    e.preventDefault();
                    setContextMenuKey(key);
                  }
                : undefined
            }
          >
            {col.label}
            {groupable && contextMenuKey === key && (
              <ColumnHeaderContextMenu
                columnKey={key}
                columnLabel={col.label}
                currentGroupBy={groupByKey}
                onGroupBy={(k) => {
                  setGroupByKey(k);
                  setContextMenuKey(null);
                }}
                onClose={() => setContextMenuKey(null)}
              />
            )}
          </SortableTableHead>
        );
      })}
      <TableHead className="w-[48px] shrink-0 sticky right-0 bg-lyra-bg-surface-base">
        <span className="sr-only">Actions</span>
      </TableHead>
    </TableRow>
  );

  /* ── Data row ── */
  const renderDataRow = (row: DesktopRow) => (
    <TableRow key={row.id} data-state={selectedRows.has(row.id) ? "selected" : undefined}>
      <TableCell className="w-[40px] shrink-0">
        <Checkbox
          checked={selectedRows.has(row.id)}
          onCheckedChange={() => toggleRow(row.id)}
          aria-label={`Select ${row.name}`}
        />
      </TableCell>
      {columnOrder.map((key) => (
        <TableCell key={key} className={columnConfig[key].flex}>
          {renderCell(row, key)}
        </TableCell>
      ))}
      <TableCell className="w-[48px] shrink-0 sticky right-0 bg-lyra-bg-surface-base">
        <button
          aria-label="More options"
          className="flex h-7 w-7 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-bg-surface-shell transition-colors"
        >
          <MoreVertical className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </TableCell>
    </TableRow>
  );

  /* ── Grouped body ── */
  const renderGroupedBody = () => {
    if (!groupByKey || !groups) return null;
    return groups.map((group) => (
      <React.Fragment key={group.label}>
        <TableGroupRow
          label={group.label}
          count={group.rows.length}
          expanded={!collapsedGroups.has(group.label)}
          onToggle={() => toggleGroup(group.label)}
          colSpan={colCount}
        />
        {!collapsedGroups.has(group.label) &&
          (group.rows as DesktopRow[]).map((row) => renderDataRow(row))}
      </React.Fragment>
    ));
  };

  /* ── Flat body ── */
  const renderFlatBody = () => pageRows.map((row) => renderDataRow(row));

  return (
    <div className="flex h-full bg-lyra-bg-surface-base rounded-lyra-lg border border-lyra-border-subtle overflow-hidden relative">

      {/* Left side panel — wraps PageHeader too */}
      {(headerPanelToggle === "left" || headerPanelToggle === "both") && (
        <SidePanel
          side="left"
          open={leftPanelOpen}
          pinned={leftPanelPinned}
          headerTitle="Designer"
          onPinToggle={canPin ? guardedLeftPinToggle : undefined}
          onMouseEnter={!leftPanelPinned ? handleLeftHoverStart : undefined}
          onMouseLeave={!leftPanelPinned ? handleLeftHoverEnd : undefined}
        >
          <div className="p-4">
            <p className="lyra-body-md text-lyra-fg-secondary">Side panel content.</p>
          </div>
        </SidePanel>
      )}

      {/* Main content column — flex-col inside the outer flex row */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Page Header */}
      <PageHeader
        title="Desktop Designs"
        chip={showChip ? "Active" : undefined}
        panelToggle={headerPanelToggle === "none" ? undefined : headerPanelToggle}
        panelPinned={leftPanelPinned}
        onPanelToggle={handleLeftPanelToggle}
        onPanelHoverStart={handleLeftHoverStart}
        onPanelHoverEnd={handleLeftHoverEnd}
        onInnerPanelToggle={rightPanelPinned ? () => setRightPanelOpen((v) => !v) : undefined}
        onInnerPanelHoverStart={!rightPanelPinned ? handleRightHoverStart : undefined}
        onInnerPanelHoverEnd={!rightPanelPinned ? handleRightHoverEnd : undefined}
        actions={
          <>
            <Button variant="outline">Secondary</Button>
            <Button>
              <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
              New Desktop
            </Button>
            {showAskAI && (
              <>
                <div className="mx-1 h-6 w-px bg-lyra-border-subtle" />
                <Button variant="outline">
                  <AiIcon className="h-4 w-4" />
                  Ask AI
                </Button>
              </>
            )}
          </>
        }
      />

      {/* Centre column: tabs + interior panel row */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Tabs */}
      {showTabs && (
        <TabList overflowMenu className="px-6">
          <Tab active={activeTab === "all"} onClick={() => setActiveTab("all")}>All Desktops</Tab>
          <Tab active={activeTab === "published"} onClick={() => setActiveTab("published")}>Published</Tab>
          <Tab active={activeTab === "drafts"} onClick={() => setActiveTab("drafts")}>Drafts</Tab>
        </TabList>
      )}

      {/* Interior panels row (toolbar toggles only push toolbar + table) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* Left interior panel (Toolbar toggle) */}
      {(toolbarPanelToggle === "left" || toolbarPanelToggle === "both") && (
        <InteriorPanel
          side="left"
          open={toolbarLeftOpen}
          headerTitle="Details"
          onClose={() => setToolbarLeftOpen(false)}
        >
          <div className="p-4">
            <p className="lyra-body-md text-lyra-fg-secondary">Left panel content.</p>
          </div>
        </InteriorPanel>
      )}

      {/* Main content column (toolbar + table + footer) */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Toolbar */}
      {showToolbar && (
        <TableToolbar
          className="px-6"
          title={showTitle ? "Title" : undefined}
          searchQuery={showQuickSearch ? searchQuery : undefined}
          onSearchChange={showQuickSearch ? setSearchQuery : undefined}
          searchPlaceholder="Quick Search"
          actionDefs={[
            ...(showRefresh ? [{ key: "refresh", label: "Refresh", icon: <RefreshCw className="h-4 w-4" strokeWidth={1.5} /> }] : []),
            ...(showEdit ? [{ key: "edit", label: "Edit", icon: <Pencil className="h-4 w-4" strokeWidth={1.5} />, disabled: selectedRows.size === 0 }] : []),
            ...(showCopy ? [{ key: "copy", label: "Copy", icon: <Copy className="h-4 w-4" strokeWidth={1.5} />, disabled: selectedRows.size === 0 }] : []),
            ...(showDelete ? [{ key: "delete", label: "Delete", icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} />, disabled: selectedRows.size === 0 }] : []),
          ]}
          actions={
            showColumns ? (
              <ColumnToggle
                columns={allColumnDefs}
                visibleColumns={visibleCols}
                onVisibilityChange={setVisibleCols}
              />
            ) : undefined
          }
          filterDefs={showFilters ? filterDefs : undefined}
          filterValues={showFilters ? filterValues : undefined}
          onFilterChange={showFilters ? handleFilterChange : undefined}
          onFilterClear={showFilters ? clearAllFilters : undefined}
          toolbarPanelToggle={toolbarPanelToggle === "none" ? undefined : toolbarPanelToggle}
          onLeftPanelToggle={() => setToolbarLeftOpen((v) => !v)}
          onRightPanelToggle={() => setToolbarRightOpen((v) => !v)}
        />
      )}

      {/* Table */}
      <div
        ref={autoFit ? containerRef : undefined}
        className={cn("flex-1 min-h-0 px-6", !autoFit && "overflow-auto")}
      >
        <Table>
          <TableHeader>{renderHeaderRow()}</TableHeader>
          <TableBody>
            {groupable && groupByKey ? renderGroupedBody() : renderFlatBody()}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <TableFooter
        className="px-6 shrink-0"
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        rowsPerPage={effectiveRowsPerPage}
        onRowsPerPageChange={
          autoFit
            ? undefined
            : (val) => {
                setRowsPerPage(val);
                setCurrentPage(1);
              }
        }
        totalRecords={totalRecords}
        displayStart={displayStart}
        displayEnd={displayEnd}
      />

      </div>{/* end main content column */}

      {/* Right interior panel (Toolbar toggle) */}
      {(toolbarPanelToggle === "right" || toolbarPanelToggle === "both") && (
        <InteriorPanel
          side="right"
          open={toolbarRightOpen}
          headerTitle="Details"
          onClose={() => setToolbarRightOpen(false)}
        >
          <div className="p-4">
            <p className="lyra-body-md text-lyra-fg-secondary">Right panel content.</p>
          </div>
        </InteriorPanel>
      )}

      </div>{/* end interior panels row */}
      </div>{/* end centre inner column */}
      </div>{/* end centre column wrapper */}

      </div>{/* end main content column */}

      {/* Right side panel — sibling of main content column, pushes PageHeader too */}
      {(headerPanelToggle === "right" || headerPanelToggle === "both") && (
        <SidePanel
          side="right"
          open={rightPanelOpen}
          pinned={rightPanelPinned}
          headerTitle="Designer"
          onPinToggle={canPin ? guardedRightPinToggle : undefined}
          onMouseEnter={!rightPanelPinned ? handleRightHoverStart : undefined}
          onMouseLeave={!rightPanelPinned ? handleRightHoverEnd : undefined}
        >
          <div className="p-4">
            <p className="lyra-body-md text-lyra-fg-secondary">Side panel content.</p>
          </div>
        </SidePanel>
      )}

    </div>
  );
}

/* ── Storybook Meta ── */

const meta: Meta = {
  title: "Templates/Data Management",
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    sortable: { control: "boolean", description: "Enable column sorting" },
    reorderable: { control: "boolean", description: "Enable column drag-to-reorder" },
    groupable: { control: "boolean", description: "Enable right-click column grouping" },
    showTabs: { control: "boolean", description: "Show tab navigation" },
    showToolbar: { control: "boolean", description: "Show table toolbar" },
    showAskAI: { control: "boolean", description: "Show Ask AI button" },
    showChip: { control: "boolean", description: "Show chip next to page title" },
    headerPanelToggle: { control: "select", options: ["none", "left", "right", "both"], description: "PageHeader panel toggle → opens side panels" },
    toolbarPanelToggle: { control: "select", options: ["none", "left", "right", "both"], description: "Toolbar panel toggle → opens interior panels" },
    showQuickSearch: { control: "boolean", description: "Show quick search input" },
    showRefresh: { control: "boolean", description: "Show refresh button" },
    showEdit: { control: "boolean", description: "Show edit button" },
    showCopy: { control: "boolean", description: "Show copy button" },
    showDelete: { control: "boolean", description: "Show delete button" },
    showColumns: { control: "boolean", description: "Show column toggle" },
    showFilters: { control: "boolean", description: "Show filter chips" },
    showTitle: { control: "boolean", description: "Show title above search row" },
  },
  args: {
    sortable: true,
    reorderable: true,
    groupable: true,
    showTabs: true,
    showToolbar: true,
    showAskAI: true,
    showChip: false,
    headerPanelToggle: "none",
    toolbarPanelToggle: "none",
    showQuickSearch: true,
    showRefresh: true,
    showEdit: true,
    showCopy: true,
    showDelete: true,
    showColumns: true,
    showFilters: true,
    showTitle: false,
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  name: "Data Management",
  render: (args) => (
    <div className="h-screen">
      <DataManagementTemplate
        sortable={args.sortable as boolean}
        reorderable={args.reorderable as boolean}
        groupable={args.groupable as boolean}
        showTabs={args.showTabs as boolean}
        showToolbar={args.showToolbar as boolean}
        showAskAI={args.showAskAI as boolean}
        showChip={args.showChip as boolean}
        headerPanelToggle={args.headerPanelToggle as "none" | "left" | "right" | "both"}
        toolbarPanelToggle={args.toolbarPanelToggle as "none" | "left" | "right" | "both"}
        showQuickSearch={args.showQuickSearch as boolean}
        showRefresh={args.showRefresh as boolean}
        showEdit={args.showEdit as boolean}
        showCopy={args.showCopy as boolean}
        showDelete={args.showDelete as boolean}
        showColumns={args.showColumns as boolean}
        showFilters={args.showFilters as boolean}
        showTitle={args.showTitle as boolean}
        autoFit={false}
      />
    </div>
  ),
};

export const AutoFit: Story = {
  name: "Data Management (AutoFit)",
  args: {
    sortable: true,
    reorderable: false,
    groupable: false,
  },
  render: (args) => (
    <div className="h-screen">
      <DataManagementTemplate
        sortable={args.sortable as boolean}
        reorderable={args.reorderable as boolean}
        groupable={args.groupable as boolean}
        showTabs={args.showTabs as boolean}
        showToolbar={args.showToolbar as boolean}
        showAskAI={args.showAskAI as boolean}
        showChip={args.showChip as boolean}
        headerPanelToggle={args.headerPanelToggle as "none" | "left" | "right" | "both"}
        toolbarPanelToggle={args.toolbarPanelToggle as "none" | "left" | "right" | "both"}
        showQuickSearch={args.showQuickSearch as boolean}
        showRefresh={args.showRefresh as boolean}
        showEdit={args.showEdit as boolean}
        showCopy={args.showCopy as boolean}
        showDelete={args.showDelete as boolean}
        showColumns={args.showColumns as boolean}
        showFilters={args.showFilters as boolean}
        showTitle={args.showTitle as boolean}
        autoFit={true}
      />
    </div>
  ),
};
