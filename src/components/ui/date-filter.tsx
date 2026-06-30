"use client";

import * as React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DateOption =
  | "all_time" | "today" | "yesterday"
  | "last_3_days" | "last_7_days"
  | "this_week" | "last_week"
  | "this_month" | "last_month"
  | "last_30_days" | "last_90_days"
  | "this_year" | "last_year"
  | "custom";

export interface DateRange { from: Date; to: Date }

const OPTIONS: { value: DateOption; label: string }[] = [
  { value: "all_time",    label: "All time" },
  { value: "today",       label: "Today" },
  { value: "yesterday",   label: "Yesterday" },
  { value: "last_3_days", label: "Last 3 days" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "this_week",   label: "This week" },
  { value: "last_week",   label: "Last week" },
  { value: "this_month",  label: "This month" },
  { value: "last_month",  label: "Last month" },
  { value: "last_30_days",label: "Last 30 days" },
  { value: "last_90_days",label: "Last 90 days" },
  { value: "this_year",   label: "This year" },
  { value: "last_year",   label: "Last year" },
  { value: "custom",      label: "Custom range…" },
];

// ─── Date helpers ──────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function subDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - n);
  return r;
}
function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0 = Sunday
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1)); // back to Monday
  return startOfDay(copy);
}

// ─── Range resolver ────────────────────────────────────────────────────────────

export function resolveRange(
  option: DateOption,
  customFrom?: Date | null,
  customTo?: Date | null,
): DateRange | null {
  if (option === "all_time") return null;
  if (option === "custom") {
    if (!customFrom || !customTo) return null;
    return { from: customFrom, to: customTo };
  }

  const now = new Date();

  switch (option) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };

    case "yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }

    case "last_3_days":
      return { from: startOfDay(subDays(now, 2)), to: endOfDay(now) };

    case "last_7_days":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };

    case "this_week":
      return { from: startOfWeek(now), to: endOfDay(now) };

    case "last_week": {
      const thisMonday = startOfWeek(now);
      const lastMonday = subDays(thisMonday, 7);
      const lastSunday = subDays(thisMonday, 1);
      return { from: lastMonday, to: endOfDay(lastSunday) };
    }

    case "this_month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };

    case "last_month": {
      const firstOfLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastOfLast  = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: firstOfLast, to: endOfDay(lastOfLast) };
    }

    case "last_30_days":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };

    case "last_90_days":
      return { from: startOfDay(subDays(now, 89)), to: endOfDay(now) };

    case "this_year":
      return { from: new Date(now.getFullYear(), 0, 1), to: endOfDay(now) };

    case "last_year":
      return {
        from: new Date(now.getFullYear() - 1, 0, 1),
        to:   new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
      };

    default:
      return null;
  }
}

// ─── Filter helper ─────────────────────────────────────────────────────────────

export function inDateRange(dateStr: string, range: DateRange | null): boolean {
  if (!range) return true;
  const d = new Date(dateStr);
  return d >= range.from && d <= range.to;
}

// ─── datetime-local input value ────────────────────────────────────────────────

function toInputValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface DateRangeFilterProps {
  onChange: (range: DateRange | null) => void;
}

export function DateRangeFilter({ onChange }: DateRangeFilterProps) {
  const [option, setOption] = React.useState<DateOption>("all_time");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");

  // Initialise custom inputs to a sensible default when switching to "custom"
  function handleOptionChange(next: DateOption) {
    if (next === "custom" && !customFrom) {
      const now = new Date();
      setCustomFrom(toInputValue(new Date(now.getFullYear(), now.getMonth(), 1)));
      setCustomTo(toInputValue(now));
    }
    setOption(next);
  }

  React.useEffect(() => {
    if (option === "custom") {
      const from = customFrom ? new Date(customFrom) : null;
      const to   = customTo   ? new Date(customTo)   : null;
      onChange(resolveRange("custom", from, to));
    } else {
      onChange(resolveRange(option));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option, customFrom, customTo]);

  return (
    <>
      <select
        value={option}
        onChange={e => handleOptionChange(e.target.value as DateOption)}
        className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {option === "custom" && (
        <>
          <input
            type="datetime-local"
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
          />
          <span className="shrink-0 text-sm text-ink-muted">→</span>
          <input
            type="datetime-local"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
          />
        </>
      )}
    </>
  );
}
