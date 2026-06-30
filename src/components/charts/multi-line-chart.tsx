"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART } from "./palette";
import { ChartTooltip } from "./chart-tooltip";
import { getFormatter, type ChartFormat } from "./format";

export interface LineSeries {
  dataKey: string;
  name: string;
  color: string;
}

interface MultiLineChartProps {
  data: object[];
  series: LineSeries[];
  format?: ChartFormat;
  height?: number;
}

export function MultiLineChart({
  data,
  series,
  format,
  height = 280,
}: MultiLineChartProps) {
  const fmt = getFormatter(format);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
        <Tooltip content={<ChartTooltip valueFormatter={fmt} />} />
        {series.map((s) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
