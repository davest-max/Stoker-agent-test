import * as React from "react";
import {
  ChevronRight, ChevronLeft,
  ChevronsRight, ChevronsLeft,
  ChevronDown, ChevronUp,
  ChevronsDown, ChevronsUp,
} from "lucide-react";
import { Info } from "lucide-react";
import { cn } from "../lib/utils";
import { SearchInput } from "./search-input";
import { Label } from "./label";
import { Tooltip } from "./tooltip";
import { ErrorIcon } from "./icons/error-icon";
import { TableFooter } from "./table";

/* ── Types ── */

export interface TransferBoxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TransferBoxProps {
  options: TransferBoxOption[];
  value?: string[];
  onChange?: (selected: string[]) => void;
  availableLabel?: string;
  selectedLabel?: string;
  availableLabelTooltip?: string;
  selectedLabelTooltip?: string;
  pageSize?: number;
  /** Disables all interaction */
  disabled?: boolean;
  /** Read-only: shows selections but prevents changes */
  readonly?: boolean;
  /** Error message shown below the component */
  error?: string;
  /** Maximum number of items that can be selected */
  max?: number;
  className?: string;
}

/* ── Helpers ── */

const PAGE_SIZE = 10;

function paginate<T>(arr: T[], page: number, size: number): T[] {
  return arr.slice((page - 1) * size, page * size);
}

function totalPages(count: number, size: number) {
  return Math.max(1, Math.ceil(count / size));
}

/* ── Transfer button ── */
function TransferBtn({ onClick, disabled, children, title }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode; title: string;
}) {
  return (
    <button
      type="button" title={title} onClick={onClick} disabled={disabled}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lyra-sm border border-lyra-border-default",
        "text-lyra-fg-action bg-lyra-bg-control transition-colors",
        "hover:bg-lyra-state-hover hover:text-lyra-fg-default",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
        "disabled:opacity-40 disabled:pointer-events-none"
      )}
    >{children}</button>
  );
}

/* ── Pagination bar ── */
function PaginationBar({ page, total, onChange, readonly, itemCount }: {
  page: number; total: number; onChange: (p: number) => void; readonly?: boolean; itemCount: number;
}) {
  return (
    <TableFooter
      currentPage={page}
      totalPages={total}
      onPageChange={readonly ? () => {} : onChange}
      rowsPerPage={PAGE_SIZE}
      totalRecords={itemCount}
      displayStart={Math.min((page - 1) * PAGE_SIZE + 1, itemCount)}
      displayEnd={Math.min(page * PAGE_SIZE, itemCount)}
      showDisplayCount={false}
      showRowsPerPage={false}
      className={cn("px-3", readonly && "pointer-events-none opacity-70")}
    />
  );
}

/* ── Panel ── */
function Panel({ label, labelTooltip, items, highlighted, onToggle, onRangeToggle, search, onSearchChange,
  page, totalPages: tp, onPageChange, disabled, readonly, error, max, selectedCount, atMax, highlightLimitReached }: {
  label: string; labelTooltip?: string; items: TransferBoxOption[];
  highlighted: Set<string>;
  onToggle: (value: string) => void;
  onRangeToggle: (values: string[]) => void;
  search: string; onSearchChange: (v: string) => void;
  page: number; totalPages: number; onPageChange: (p: number) => void;
  disabled?: boolean; readonly?: boolean; error?: string | boolean;
  max?: number; selectedCount?: number; atMax?: boolean; highlightLimitReached?: boolean;
}) {
  const isInert = disabled || readonly;
  const filtered = items.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  const paged = paginate(filtered, page, PAGE_SIZE);

  // Track last clicked index within filtered list for shift+click range selection
  const lastClickedRef = React.useRef<number>(-1);

  const handleClick = (e: React.MouseEvent, opt: TransferBoxOption, filteredIndex: number) => {
    if (isInert || opt.disabled) return;

    if (e.shiftKey && lastClickedRef.current !== -1) {
      // Select range between last clicked and current
      const from = Math.min(lastClickedRef.current, filteredIndex);
      const to   = Math.max(lastClickedRef.current, filteredIndex);
      const rangeValues = filtered.slice(from, to + 1)
        .filter((o) => !o.disabled)
        .map((o) => o.value);
      onRangeToggle(rangeValues);
    } else {
      onToggle(opt.value);
    }
    lastClickedRef.current = filteredIndex;
  };

  return (
    <div className={cn(
      "flex flex-col flex-1 min-w-0 border rounded-lyra-lg overflow-hidden",
      (error || atMax) ? "border-lyra-status-critical-strong bg-lyra-bg-surface-base" :
      readonly         ? "border-lyra-border-subtle bg-lyra-bg-surface-canvas" :
      disabled         ? "border-lyra-border-subtle bg-lyra-bg-surface-base opacity-50" :
                         "border-lyra-border-subtle bg-lyra-bg-surface-base"
    )}>
      <div className="px-3 pt-3 pb-2 border-b border-lyra-border-subtle">
        <div className="flex items-center gap-1.5 mb-2">
          <Label label={label} disabled={disabled} readonly={readonly} />
          {labelTooltip && (
            <Tooltip content={labelTooltip} placement="top">
              <button type="button" className="flex items-center text-lyra-fg-secondary hover:text-lyra-fg-default transition-colors focus:outline-none">
                <Info className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </Tooltip>
          )}
        </div>
        <SearchInput value={search} onValueChange={isInert ? () => {} : onSearchChange} placeholder="Search" className="w-full"
          disabled={disabled} readonly={readonly} />
        {/* Error message — always visible below search */}
        {error && typeof error === "string" && (
          <p className="mt-2 lyra-body-sm text-lyra-status-critical-strong flex items-center gap-1">
            <ErrorIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        {max !== undefined && selectedCount !== undefined && (
          <div className={cn(
            "mt-2 flex items-center gap-1.5 lyra-body-sm font-medium",
            selectedCount >= max ? "text-lyra-status-critical-strong" : "text-lyra-fg-secondary"
          )}>
            {selectedCount >= max && (
              <ErrorIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            {selectedCount >= max
              ? `Maximum of ${max} items reached — remove items to add more`
              : `Select up to ${max - selectedCount} more item${max - selectedCount === 1 ? "" : "s"}`}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {paged.length === 0 ? (
          <p className="px-3 py-3 lyra-body-sm text-lyra-fg-disabled">No items</p>
        ) : (
          paged.map((opt, pageIdx) => {
            const filteredIndex = (page - 1) * PAGE_SIZE + pageIdx;
            const isHL = highlighted.has(opt.value);
            return (
              <div key={opt.value}
                onMouseDown={(e) => { if (e.shiftKey) e.preventDefault(); }} // prevent text selection on shift+click
                onClick={(e) => { if (!atMax) handleClick(e, opt, filteredIndex); }}
                className={cn(
                  "px-3 py-2.5 lyra-body-md transition-colors select-none border-b border-lyra-border-subtle/40 last:border-0",
                  (isInert || atMax) ? "cursor-default" : "cursor-pointer",
                  // Active highlight
                  isHL && "bg-lyra-bg-active-subtle text-lyra-fg-active-strong",
                  // Normal hoverable
                  !isHL && !isInert && !atMax && !highlightLimitReached && "text-lyra-fg-default hover:bg-lyra-state-hover",
                  // Greyed out — limit reached and this item is not highlighted
                  !isHL && (atMax || highlightLimitReached) && "text-lyra-fg-disabled cursor-default",
                  // Normal non-interactive
                  !isHL && isInert && "text-lyra-fg-default",
                  (disabled || opt.disabled) && "opacity-40"
                )}
              >{opt.label}</div>
            );
          })
        )}
      </div>
      <PaginationBar page={page} total={tp} onChange={onPageChange} readonly={isInert} itemCount={filtered.length} />
    </div>
  );
}

/* ── TransferBox ── */

const TransferBox = React.forwardRef<HTMLDivElement, TransferBoxProps>(
  ({
    options, value = [], onChange,
    availableLabel = "Available", selectedLabel = "Selected",
    availableLabelTooltip, selectedLabelTooltip,
    pageSize = PAGE_SIZE,
    disabled, readonly, error, max,
    className,
  }, ref) => {
    const isInert = disabled || readonly;
    const selectedValues = new Set(value);
    const available = options.filter((o) => !selectedValues.has(o.value));
    const selected  = options.filter((o) =>  selectedValues.has(o.value));

    const atMax = max !== undefined && selected.length >= max;

    const [availableHL, setAvailableHL] = React.useState<Set<string>>(new Set());
    const [selectedHL,  setSelectedHL]  = React.useState<Set<string>>(new Set());
    const [availableSearch, setAvailableSearch] = React.useState("");
    const [selectedSearch,  setSelectedSearch]  = React.useState("");
    const [availablePage, setAvailablePage] = React.useState(1);
    const [selectedPage,  setSelectedPage]  = React.useState(1);

    const filteredAvailable = available.filter((o) => o.label.toLowerCase().includes(availableSearch.toLowerCase()));
    const filteredSelected  = selected.filter((o) =>  o.label.toLowerCase().includes(selectedSearch.toLowerCase()));

    React.useEffect(() => { setAvailablePage(1); }, [availableSearch]);
    React.useEffect(() => { setSelectedPage(1);  }, [selectedSearch]);

    const toggleHL = (set: Set<string>, val: string): Set<string> => {
      const next = new Set(set);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    };

    const moveHighlighted = () => {
      if (isInert) return;
      const toAdd = [...availableHL].filter((v) => !selectedValues.has(v));
      const clipped = max !== undefined ? toAdd.slice(0, max - selected.length) : toAdd;
      onChange?.([...value, ...clipped]);
      setAvailableHL(new Set());
    };

    const moveAll = () => {
      if (isInert) return;
      const toAdd = available.map((o) => o.value);
      const clipped = max !== undefined ? toAdd.slice(0, max - selected.length) : toAdd;
      onChange?.([...value, ...clipped]);
      setAvailableHL(new Set());
    };

    const removeHighlighted = () => {
      if (isInert) return;
      onChange?.(value.filter((v) => !selectedHL.has(v)));
      setSelectedHL(new Set());
    };

    const removeAll = () => {
      if (isInert) return;
      onChange?.([]);
      setSelectedHL(new Set());
    };

    const avTP = totalPages(filteredAvailable.length, pageSize);
    const slTP = totalPages(filteredSelected.length,  pageSize);

    return (
      <div ref={ref} className={className}>
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <Panel
            label={availableLabel} labelTooltip={availableLabelTooltip}
            items={available} highlighted={availableHL}
            max={max} selectedCount={selected.length} atMax={atMax}
            highlightLimitReached={max !== undefined && availableHL.size >= max - selected.length}
            onToggle={(v) => {
              const remaining = max !== undefined ? max - selected.length : Infinity;
              if (!availableHL.has(v) && availableHL.size >= remaining) return;
              setAvailableHL(toggleHL(availableHL, v));
            }}
            onRangeToggle={(values) => {
              const remaining = max !== undefined ? max - selected.length : Infinity;
              setAvailableHL((prev) => {
                const next = new Set(prev);
                // Determine if majority are highlighted → deselect range, else select
                const newOnes = values.filter((v) => !prev.has(v));
                if (newOnes.length > 0) {
                  let added = 0;
                  for (const v of newOnes) {
                    if (next.size >= remaining) break;
                    next.add(v); added++;
                  }
                } else {
                  values.forEach((v) => next.delete(v));
                }
                return next;
              });
            }}
            search={availableSearch} onSearchChange={setAvailableSearch}
            page={Math.min(availablePage, avTP)} totalPages={avTP} onPageChange={setAvailablePage}
            disabled={disabled} readonly={readonly} error={error}
          />

          {/* Transfer buttons */}
          <div className={cn(
            "flex flex-row md:flex-col items-center justify-center gap-2 shrink-0 py-1 md:py-4",
            isInert && "opacity-40 pointer-events-none"
          )}>
            <TransferBtn title="Move selected" onClick={moveHighlighted}
              disabled={isInert || availableHL.size === 0 || atMax}>
              <ChevronRight  className="hidden md:block h-4 w-4" strokeWidth={2} />
              <ChevronDown   className="block md:hidden h-4 w-4" strokeWidth={2} />
            </TransferBtn>
            <TransferBtn title="Move all" onClick={moveAll}
              disabled={isInert || available.length === 0 || atMax}>
              <ChevronsRight className="hidden md:block h-4 w-4" strokeWidth={2} />
              <ChevronsDown  className="block md:hidden h-4 w-4" strokeWidth={2} />
            </TransferBtn>
            <TransferBtn title="Remove all" onClick={removeAll}
              disabled={isInert || selected.length === 0}>
              <ChevronsLeft  className="hidden md:block h-4 w-4" strokeWidth={2} />
              <ChevronsUp    className="block md:hidden h-4 w-4" strokeWidth={2} />
            </TransferBtn>
            <TransferBtn title="Remove selected" onClick={removeHighlighted}
              disabled={isInert || selectedHL.size === 0}>
              <ChevronLeft   className="hidden md:block h-4 w-4" strokeWidth={2} />
              <ChevronUp     className="block md:hidden h-4 w-4" strokeWidth={2} />
            </TransferBtn>
          </div>

          <Panel
            label={selectedLabel} labelTooltip={selectedLabelTooltip}
            items={selected} highlighted={selectedHL}
            onToggle={(v) => setSelectedHL(toggleHL(selectedHL, v))}
            onRangeToggle={(values) => {
              setSelectedHL((prev) => {
                const next = new Set(prev);
                const newOnes = values.filter((v) => !prev.has(v));
                if (newOnes.length > 0) newOnes.forEach((v) => next.add(v));
                else values.forEach((v) => next.delete(v));
                return next;
              });
            }}
            search={selectedSearch} onSearchChange={setSelectedSearch}
            page={Math.min(selectedPage, slTP)} totalPages={slTP} onPageChange={setSelectedPage}
            disabled={disabled} readonly={readonly} error={!!error}
          />
        </div>

      </div>
    );
  }
);
TransferBox.displayName = "TransferBox";

export { TransferBox };
