import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and resolve Tailwind conflicts.
 * @example cn("px-2", isActive && "px-4") // -> "px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const plainNumber = new Intl.NumberFormat("en-US");
const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Format an amount as Naira. Pass `{ compact: true }` for ₦1.2B style. */
export function formatNaira(value: number, opts?: { compact?: boolean }) {
  if (opts?.compact) return "₦" + compactNumber.format(value);
  return naira.format(value);
}

/** Compact number, e.g. 12_500 -> "12.5K". */
export function formatCompact(value: number) {
  return compactNumber.format(value);
}

/** Grouped number, e.g. 12500 -> "12,500". */
export function formatNumber(value: number) {
  return plainNumber.format(value);
}

/** Signed percentage, e.g. 12.4 -> "+12.4%". */
export function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

/** Format an ISO date, e.g. "Jun 27, 2026". */
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
