import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/utils";
import { Icons, type Icon } from "@/components/icons";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  icon?: Icon;
  hint?: string;
}

/** KPI tile: label, big value, and an optional period-over-period delta. */
export function StatCard({
  label,
  value,
  delta,
  icon: LeadingIcon,
  hint = "vs prev. period",
}: StatCardProps) {
  const positive = (delta ?? 0) >= 0;

  return (
    <div className="rounded-xl border border-line bg-paper-raised p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted">{label}</span>
        {LeadingIcon ? (
          <span className="grid size-8 place-items-center rounded-lg bg-paper-sunken text-ink-muted">
            <LeadingIcon className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        {value}
      </div>
      {delta !== undefined ? (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              positive ? "text-success" : "text-danger",
            )}
          >
            {positive ? (
              <Icons.trendingUp className="size-3.5" />
            ) : (
              <Icons.trendingDown className="size-3.5" />
            )}
            {formatPercent(delta)}
          </span>
          <span className="text-ink-subtle">{hint}</span>
        </div>
      ) : null}
    </div>
  );
}
