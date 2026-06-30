"use client";

import { cn } from "@/lib/utils";
import { TIME_RANGES, type TimeRange } from "@/lib/data/analytics";

interface RangeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

/** Compact segmented control to switch the analytics timeline. */
export function RangeFilter({ value, onChange }: RangeFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Select time range"
      className="inline-flex items-center gap-1 rounded-lg border border-line bg-paper-sunken p-1"
    >
      {TIME_RANGES.map((range) => {
        const active = range.value === value;
        return (
          <button
            key={range.value}
            type="button"
            role="tab"
            aria-selected={active}
            title={range.label}
            onClick={() => onChange(range.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:px-3",
              active
                ? "bg-paper-raised text-ink shadow-sm"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {range.short}
          </button>
        );
      })}
    </div>
  );
}
