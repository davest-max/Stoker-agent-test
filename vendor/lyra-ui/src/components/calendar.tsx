import * as React from "react";
import {
  DayPicker,
  useDayPicker,
  type DayPickerProps,
  type DateRange,
} from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";

/* ── Types ── */

export type CalendarMode = "single" | "range" | "week";
type CalendarView = "days" | "months" | "years";

interface CalendarBaseProps {
  className?: string;
  showWeekNumbers?: boolean;
}

export interface CalendarSingleProps extends CalendarBaseProps {
  mode: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: DayPickerProps["disabled"];
  defaultMonth?: Date;
}

export interface CalendarRangeProps extends CalendarBaseProps {
  mode: "range";
  selected?: DateRange;
  onSelect?: (range: DateRange | undefined) => void;
  disabled?: DayPickerProps["disabled"];
  defaultMonth?: Date;
}

export interface CalendarWeekProps extends CalendarBaseProps {
  mode: "week";
  selected?: Date;
  onSelect?: (weekStart: Date | undefined) => void;
  disabled?: DayPickerProps["disabled"];
  defaultMonth?: Date;
}

export type CalendarProps =
  | CalendarSingleProps
  | CalendarRangeProps
  | CalendarWeekProps;

/* ── View context ── */

interface ViewCtx {
  view: CalendarView;
  viewYear: number;
  setView: (v: CalendarView) => void;
  setViewYear: (y: number) => void;
  /** Navigate the DayPicker to a new month */
  goTo: (date: Date) => void;
}
const ViewContext = React.createContext<ViewCtx>({
  view: "days", viewYear: new Date().getFullYear(),
  setView: () => {}, setViewYear: () => {}, goTo: () => {},
});

/* ── Shared day-cell classes ── */

const dayBase = cn(
  "h-9 w-9 rounded-lyra-sm lyra-body-md transition-colors",
  "flex items-center justify-center",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-1",
  "hover:bg-lyra-state-hover active:bg-lyra-state-pressed cursor-pointer",
  "aria-disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent"
);

const classNames: DayPickerProps["classNames"] = {
  root:          "w-full",
  months:        "flex flex-col gap-4",
  month:         "flex flex-col gap-3",
  month_caption: "",
  caption_label: "hidden",
  nav:           "hidden",
  button_previous: "hidden",
  button_next:   "hidden",
  month_grid:    "w-full border-collapse",
  weekdays:      "flex",
  weekday:       "h-9 w-9 flex items-center justify-center lyra-body-sm text-lyra-fg-secondary",
  week:          "flex mt-0.5",
  week_number:   "h-9 w-8 flex items-center justify-center lyra-body-sm text-lyra-fg-disabled",
  day:           cn(dayBase, "text-lyra-fg-default"),
  day_button:    "w-full h-full flex items-center justify-center",
  selected:      cn(
    "bg-lyra-bg-primary text-lyra-fg-on-primary rounded-lyra-sm",
    "hover:bg-lyra-state-hover-primary active:bg-lyra-state-pressed-primary"
  ),
  today:         "border border-lyra-border-active text-lyra-fg-active-strong font-medium",
  outside:       "text-lyra-fg-disabled opacity-40",
  disabled:      "opacity-40 cursor-not-allowed",
  range_start:   "bg-lyra-bg-primary text-lyra-fg-on-primary rounded-l-lyra-sm rounded-r-none",
  range_middle:  "bg-lyra-bg-active-subtle text-lyra-fg-active-strong rounded-none",
  range_end:     "bg-lyra-bg-primary text-lyra-fg-on-primary rounded-r-lyra-sm rounded-l-none",
  hidden:        "invisible",
};

/* ── Custom caption header ── */

function CalendarCaption() {
  const { goToMonth, nextMonth, previousMonth, months } = useDayPicker();
  const { view, setView, setViewYear } = React.useContext(ViewContext);
  const currentMonth = months?.[0]?.date ?? new Date();
  const label = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Suppress tooltips for 400ms after mount — prevents tooltip firing when the
  // calendar appears under the cursor on click (browser fires mouseenter on render)
  const [tooltipsActive, setTooltipsActive] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setTooltipsActive(true), 400);
    return () => clearTimeout(t);
  }, []);

  const btnClass = cn(
    "h-8 w-8 rounded-lyra-sm flex items-center justify-center transition-colors flex-shrink-0",
    "text-lyra-fg-secondary hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
  );

  const handleLabelClick = () => {
    if (view === "days") { setViewYear(currentMonth.getFullYear()); setView("years"); }
    else if (view === "months") setView("years");
    else setView("days");
  };

  const prevBtn = (
    <button type="button" onClick={() => previousMonth && goToMonth(previousMonth)}
      disabled={!previousMonth} aria-label="Previous month" className={btnClass}>
      <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );

  const nextBtn = (
    <button type="button" onClick={() => nextMonth && goToMonth(nextMonth)}
      disabled={!nextMonth} aria-label="Next month" className={btnClass}>
      <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );

  return (
    <div className="flex items-center h-9 px-1">
      {view === "days" && (
        tooltipsActive
          ? <Tooltip content="Previous month" placement="bottom" delayMs={400}>{prevBtn}</Tooltip>
          : prevBtn
      )}
      {view !== "days" && <div className="w-8 h-8 flex-shrink-0" />}

      <button type="button" onClick={handleLabelClick}
        className="flex-1 text-center lyra-body-md-emphasis text-lyra-fg-default select-none hover:text-lyra-fg-active-strong transition-colors">
        {label}
      </button>

      {view === "days" && (
        tooltipsActive
          ? <Tooltip content="Next month" placement="bottom" delayMs={400}>{nextBtn}</Tooltip>
          : nextBtn
      )}
      {view !== "days" && <div className="w-8 h-8 flex-shrink-0" />}
    </div>
  );
}

/* ── Year picker overlay ── */

function YearPicker({ currentYear }: { currentYear: number }) {
  const { viewYear, setViewYear, setView } = React.useContext(ViewContext);
  const today = new Date().getFullYear();
  // 24 years centred on viewYear
  const start = viewYear - 10;
  const years = Array.from({ length: 24 }, (_, i) => start + i);

  return (
    <div className="absolute inset-0 bg-lyra-bg-surface-base z-10 flex flex-col gap-3 overflow-auto">
      <div className="grid grid-cols-4 gap-1">
        {years.map(y => (
          <button key={y} type="button"
            onClick={() => { setViewYear(y); setView("months"); }}
            className={cn(
              "h-9 rounded-lyra-sm lyra-body-md transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
              y === currentYear
                ? "bg-lyra-bg-primary text-lyra-fg-on-primary hover:bg-lyra-state-hover-primary"
                : y === today
                ? "border border-lyra-border-active text-lyra-fg-active-strong font-medium hover:bg-lyra-state-hover"
                : "text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed"
            )}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Month picker overlay ── */

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function MonthPicker({ currentMonth }: { currentMonth: Date }) {
  const { viewYear, setView, goTo } = React.useContext(ViewContext);
  const todayMonth = new Date().getMonth();
  const todayYear  = new Date().getFullYear();

  return (
    <div className="absolute inset-0 bg-lyra-bg-surface-base z-10 flex flex-col gap-3 overflow-auto">
      <div className="grid grid-cols-4 gap-1">
        {MONTHS_SHORT.map((name, i) => {
          const isSelected = viewYear === currentMonth.getFullYear() && i === currentMonth.getMonth();
          const isToday    = viewYear === todayYear && i === todayMonth;
          return (
            <button key={name} type="button"
              onClick={() => { goTo(new Date(viewYear, i, 1)); setView("days"); }}
              className={cn(
                "h-9 rounded-lyra-sm lyra-label transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus",
                isSelected
                  ? "bg-lyra-bg-primary text-lyra-fg-on-primary hover:bg-lyra-state-hover-primary"
                  : isToday
                  ? "border border-lyra-border-active text-lyra-fg-active-strong font-medium hover:bg-lyra-state-hover"
                  : "text-lyra-fg-default hover:bg-lyra-state-hover active:bg-lyra-state-pressed"
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Calendar ── */

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (props, ref) => {
    const { mode, className, showWeekNumbers, disabled } = props;
    const [view, setView] = React.useState<CalendarView>("days");
    const [viewYear, setViewYear] = React.useState(
      (props.defaultMonth ?? new Date()).getFullYear()
    );
    const [currentDisplayMonth, setCurrentDisplayMonth] = React.useState<Date>(
      props.defaultMonth ?? new Date()
    );
    const [dpMonth, setDpMonth] = React.useState<Date | undefined>(
      props.defaultMonth
    );

    const goTo = (date: Date) => {
      setDpMonth(date);
      setCurrentDisplayMonth(date);
    };

    const ctx: ViewCtx = { view, viewYear, setView, setViewYear, goTo };

    const sharedProps = {
      disabled,
      showWeekNumber: showWeekNumbers,
      classNames,
      month: dpMonth,
      onMonthChange: (m: Date) => { setCurrentDisplayMonth(m); setDpMonth(m); },
      components: { MonthCaption: CalendarCaption },
    } as const;

    const renderPicker = () => {
      if (view === "years") return <YearPicker currentYear={currentDisplayMonth.getFullYear()} />;
      if (view === "months") return <MonthPicker currentMonth={currentDisplayMonth} />;
      return null;
    };

    const overlayActive = view !== "days";

    return (
      <ViewContext.Provider value={ctx}>
        <div ref={ref} className={cn("relative", className)}>
          {/* Invisible wrapper hides the DayPicker grid when an overlay is active,
              preserving layout height so the overlay covers the right area */}
          <div className={overlayActive ? "invisible" : undefined}>
          {mode === "week" ? (() => {
            const { selected, onSelect } = props as CalendarWeekProps;
            const getWeekRange = (d: Date | undefined): DateRange | undefined => {
              if (!d) return undefined;
              const s = new Date(d); s.setDate(s.getDate() - s.getDay());
              const e = new Date(s); e.setDate(s.getDate() + 6);
              return { from: s, to: e };
            };
            return (
              <DayPicker mode="range" selected={getWeekRange(selected)}
                onDayClick={(day) => { const s = new Date(day); s.setDate(s.getDate() - s.getDay()); (onSelect as (d: Date) => void)?.(s); }}
                defaultMonth={props.defaultMonth ?? selected}
                {...sharedProps} />
            );
          })() : mode === "single" ? (() => {
            const { selected, onSelect, defaultMonth } = props as CalendarSingleProps;
            return (
              <DayPicker mode="single" selected={selected} onSelect={onSelect}
                defaultMonth={defaultMonth ?? selected} {...sharedProps} />
            );
          })() : (() => {
            const { selected, onSelect, defaultMonth } = props as CalendarRangeProps;
            return (
              <DayPicker mode="range" selected={selected} onSelect={onSelect}
                defaultMonth={defaultMonth ?? selected?.from} {...sharedProps} />
            );
          })()}
          </div>{/* end invisible wrapper */}
          {renderPicker()}
        </div>
      </ViewContext.Provider>
    );
  }
);

Calendar.displayName = "Calendar";

export { Calendar };
export type { DateRange };
