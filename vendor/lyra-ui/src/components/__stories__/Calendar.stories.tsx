import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Calendar, type DateRange } from "../calendar";

const meta: Meta<typeof Calendar> = {
  title: "Atoms/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

/* ── Single date ── */

export const SingleDate: Story = {
  name: "Single Date",
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base shadow-md p-4 w-[280px]">
        <Calendar mode="single" selected={date} onSelect={setDate} />
        <p className="lyra-body-sm text-lyra-fg-secondary mt-3 text-center">
          {date ? date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "No date selected"}
        </p>
      </div>
    );
  },
};

/* ── Range selection ── */

export const RangeSelection: Story = {
  name: "Range Selection",
  render: () => {
    const [range, setRange] = useState<DateRange | undefined>({
      from: new Date(),
      to: (() => { const d = new Date(); d.setDate(d.getDate() + 6); return d; })(),
    });
    return (
      <div className="rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base shadow-md p-4 w-[280px]">
        <Calendar mode="range" selected={range} onSelect={setRange} />
        <p className="lyra-body-sm text-lyra-fg-secondary mt-3 text-center">
          {range?.from && range?.to
            ? `${range.from.toLocaleDateString()} – ${range.to.toLocaleDateString()}`
            : range?.from
            ? `From ${range.from.toLocaleDateString()}`
            : "Select a range"}
        </p>
      </div>
    );
  },
};

/* ── Week selection ── */

export const WeekSelection: Story = {
  name: "Week Selection",
  render: () => {
    const [weekStart, setWeekStart] = useState<Date | undefined>(() => {
      const today = new Date();
      today.setDate(today.getDate() - today.getDay());
      return today;
    });

    const getWeekEnd = (start: Date) => {
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return end;
    };

    return (
      <div className="rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base shadow-md p-4 w-[280px]">
        <Calendar mode="week" selected={weekStart} onSelect={setWeekStart} />
        <p className="lyra-body-sm text-lyra-fg-secondary mt-3 text-center">
          {weekStart
            ? `Week of ${weekStart.toLocaleDateString()} – ${getWeekEnd(weekStart).toLocaleDateString()}`
            : "Select a week"}
        </p>
      </div>
    );
  },
};

/* ── All variants ── */

export const AllVariants: Story = {
  name: "All Variants",
  render: () => {
    const [single, setSingle] = useState<Date | undefined>(new Date());
    const [range, setRange] = useState<DateRange | undefined>();
    const [week, setWeek] = useState<Date | undefined>(() => {
      const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d;
    });

    return (
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col gap-2">
          <span className="lyra-label text-lyra-fg-default">Single</span>
          <div className="rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base shadow-md p-4 w-[280px]">
            <Calendar mode="single" selected={single} onSelect={setSingle} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="lyra-label text-lyra-fg-default">Range</span>
          <div className="rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base shadow-md p-4 w-[280px]">
            <Calendar mode="range" selected={range} onSelect={setRange} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="lyra-label text-lyra-fg-default">Week</span>
          <div className="rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base shadow-md p-4 w-[280px]">
            <Calendar mode="week" selected={week} onSelect={setWeek} />
          </div>
        </div>
      </div>
    );
  },
};

export const WithDisabledDates: Story = {
  name: "With Disabled Dates",
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    return (
      <div className="rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base shadow-md p-4 w-[280px]">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={{ before: today }}
        />
        <p className="lyra-body-sm text-lyra-fg-secondary mt-2 text-center">
          Past dates are disabled
        </p>
      </div>
    );
  },
};
