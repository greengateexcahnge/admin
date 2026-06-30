"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORICAL, CHART } from "./palette";
import { ChartTooltip } from "./chart-tooltip";
import { getFormatter, type ChartFormat } from "./format";

interface CategoryBarChartProps {
  data: object[];
  dataKey: string;
  nameKey?: string;
  format?: ChartFormat;
  colors?: string[];
  height?: number;
}

/** Horizontal bars, one color per category — good for "by type" rankings. */
export function CategoryBarChart({
  data,
  dataKey,
  nameKey = "name",
  format,
  colors = CATEGORICAL,
  height = 300,
}: CategoryBarChartProps) {
  const fmt = getFormatter(format);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        barCategoryGap={10}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: CHART.axis }}
          tickFormatter={(v) => fmt(Number(v))}
        />
        <YAxis
          type="category"
          dataKey={nameKey}
          width={116}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: CHART.inkSoft }}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={fmt} />}
          cursor={{ fill: CHART.grid, opacity: 0.4 }}
        />
        <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface BarSeries {
  dataKey: string;
  name: string;
  color: string;
}

interface GroupedBarChartProps {
  data: object[];
  series: BarSeries[];
  format?: ChartFormat;
  height?: number;
}

/** Vertical grouped bars for comparing two+ series over time. */
export function GroupedBarChart({
  data,
  series,
  format,
  height = 280,
}: GroupedBarChartProps) {
  const fmt = getFormatter(format);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          cursor={{ fill: CHART.grid, opacity: 0.4 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: CHART.inkSoft }}
        />
        {series.map((s) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            name={s.name}
            fill={s.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
