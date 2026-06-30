"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART } from "./palette";
import { ChartTooltip } from "./chart-tooltip";
import { getFormatter, type ChartFormat } from "./format";

export interface AreaSeries {
  dataKey: string;
  name: string;
  color: string;
}

interface AreaTrendChartProps {
  data: object[];
  series: AreaSeries[];
  format?: ChartFormat;
  height?: number;
}

export function AreaTrendChart({
  data,
  series,
  format,
  height = 280,
}: AreaTrendChartProps) {
  const fmt = getFormatter(format);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient
              key={s.dataKey}
              id={`area-${s.dataKey}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={s.color} stopOpacity={0.22} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          minTickGap={24}
          tick={{ fontSize: 11, fill: CHART.axis }}
        />
        <YAxis
          width={52}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: CHART.axis }}
          tickFormatter={(v) => fmt(Number(v))}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={fmt} />}
          cursor={{ stroke: CHART.stone, strokeWidth: 1 }}
        />
        {series.map((s) => (
          <Area
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#area-${s.dataKey})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
