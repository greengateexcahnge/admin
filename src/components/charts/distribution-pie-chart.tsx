"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORICAL } from "./palette";
import { ChartTooltip } from "./chart-tooltip";
import { getFormatter, type ChartFormat } from "./format";

interface DistributionPieChartProps {
  data: { name: string; value: number }[];
  format?: ChartFormat;
  colors?: string[];
  size?: number;
}

/** Donut chart with a side legend showing values and shares. */
export function DistributionPieChart({
  data,
  format,
  colors = CATEGORICAL,
  size = 200,
}: DistributionPieChartProps) {
  const fmt = getFormatter(format);
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip valueFormatter={fmt} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="w-full space-y-2.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: colors[i % colors.length] }}
            />
            <span className="text-ink-muted">{d.name}</span>
            <span className="ml-auto font-medium text-ink">{fmt(d.value)}</span>
            <span className="w-9 text-right text-xs tabular-nums text-ink-subtle">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
