"use client";

interface TooltipEntry {
  name?: string;
  value?: number;
  color?: string;
  payload?: { fill?: string };
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
  valueFormatter?: (value: number) => string;
}

/** Shared, themed Recharts tooltip. */
export function ChartTooltip({
  active,
  label,
  payload,
  valueFormatter = (v) => String(v),
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-32 rounded-lg border border-line bg-paper-raised px-3 py-2 shadow-md">
      {label ? (
        <p className="mb-1.5 text-xs font-medium text-ink">{label}</p>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: entry.color ?? entry.payload?.fill }}
            />
            {entry.name ? (
              <span className="text-ink-muted">{entry.name}</span>
            ) : null}
            <span className="ml-auto font-medium text-ink">
              {valueFormatter(entry.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
