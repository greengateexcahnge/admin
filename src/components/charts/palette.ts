/** Chart palette tuned to the paper / charcoal / coffee theme. */
export const CHART = {
  ink: "#2A2A28",
  inkSoft: "#57534E",
  coffee: "#9C6F4E",
  latte: "#C9A87C",
  sage: "#717561",
  clay: "#A6705A",
  sand: "#D8C3A5",
  stone: "#A8A29E",
  grid: "#E5E1D8",
  axis: "#A8A29E",
} as const;

/** Ordered colors for categorical series (pie slices, bars). */
export const CATEGORICAL = [
  CHART.ink,
  CHART.coffee,
  CHART.sage,
  CHART.clay,
  CHART.latte,
  CHART.stone,
  CHART.sand,
];
