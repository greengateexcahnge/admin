import { formatCompact, formatNaira, formatNumber } from "@/lib/utils";

/**
 * Serializable formatter selector — lets server components pass a `format`
 * string to client chart components (functions can't cross that boundary).
 */
export type ChartFormat = "naira" | "compact" | "number";

export function getFormatter(format?: ChartFormat) {
  switch (format) {
    case "naira":
      return (v: number) => formatNaira(v, { compact: true });
    case "compact":
      return (v: number) => formatCompact(v);
    default:
      return (v: number) => formatNumber(v);
  }
}
