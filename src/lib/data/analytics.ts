/**
 * Analytics data layer for the Greengate admin.
 *
 * These functions return the shapes the dashboard charts consume. They are
 * currently backed by deterministic mock generators so the UI is fully
 * functional offline. Swap each generator for a real query when wiring the DB:
 *
 *   - KPIs / counters        -> stats.global_counters
 *   - time series (volume…)  -> stats.daily_aggregates (group by day, txn_type)
 *   - transactions by type   -> stats.daily_aggregates (sum over range by txn_type)
 *   - volume by asset        -> stats.daily_aggregates JOIN ref.assets
 *   - KYC tier distribution  -> auth.users (count by kyc_tier)
 *
 * The values are NGN (fiat display) per the schema's NUMERIC(20,4) convention.
 */

export type TimeRange = "7d" | "30d" | "90d" | "12m";

export const TIME_RANGES: { value: TimeRange; label: string; short: string }[] =
  [
    { value: "7d", label: "Last 7 days", short: "7D" },
    { value: "30d", label: "Last 30 days", short: "30D" },
    { value: "90d", label: "Last 90 days", short: "90D" },
    { value: "12m", label: "Last 12 months", short: "12M" },
  ];

export interface TimePoint {
  label: string;
  volume: number;
  fees: number;
  deposits: number;
  withdrawals: number;
  txns: number;
  newUsers: number;
  activeUsers: number;
}

export interface NamedValue {
  name: string;
  value: number;
}

export interface Kpi {
  value: number;
  delta: number;
}

export interface AnalyticsData {
  range: TimeRange;
  kpis: {
    totalVolume: Kpi;
    totalTxns: Kpi;
    activeUsers: Kpi;
    newUsers: Kpi;
    totalFees: Kpi;
    totalUsers: Kpi;
  };
  timeseries: TimePoint[];
  txnTypes: { name: string; count: number; volume: number }[];
  assets: NamedValue[];
  kyc: NamedValue[];
}

const RANGE_BUCKETS: Record<
  TimeRange,
  { points: number; step: "day" | "week" | "month" }
> = {
  "7d": { points: 7, step: "day" },
  "30d": { points: 30, step: "day" },
  "90d": { points: 13, step: "week" },
  "12m": { points: 12, step: "month" },
};

/** Deterministic PRNG so the mock data is stable across renders. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFor(range: TimeRange) {
  return [...range].reduce((acc, c) => acc + c.charCodeAt(0), 7);
}

function buildLabels(points: number, step: "day" | "week" | "month") {
  const labels: string[] = [];
  const now = new Date();
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(now);
    if (step === "day") d.setDate(now.getDate() - i);
    else if (step === "week") d.setDate(now.getDate() - i * 7);
    else d.setMonth(now.getMonth() - i);
    labels.push(
      step === "month"
        ? d.toLocaleDateString("en-US", { month: "short" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    );
  }
  return labels;
}

export function getAnalytics(range: TimeRange): AnalyticsData {
  const { points, step } = RANGE_BUCKETS[range];
  const rand = mulberry32(seedFor(range));
  const labels = buildLabels(points, step);

  const stepVolume =
    step === "day" ? 82_000_000 : step === "week" ? 560_000_000 : 2_350_000_000;
  const stepTxns = step === "day" ? 1_850 : step === "week" ? 12_500 : 52_000;
  const stepNewUsers = step === "day" ? 140 : step === "week" ? 960 : 4_100;

  const timeseries: TimePoint[] = labels.map((label, i) => {
    const trend = 1 + (i / points) * 0.35; // gentle upward growth
    const noise = 0.78 + rand() * 0.44;
    const volume = Math.round(stepVolume * trend * noise);
    const fees = Math.round(volume * (0.011 + rand() * 0.004));
    const deposits = Math.round(volume * (0.5 + rand() * 0.08));
    const withdrawals = Math.round(volume * (0.26 + rand() * 0.06));
    const txns = Math.round(stepTxns * trend * (0.8 + rand() * 0.4));
    const newUsers = Math.round(stepNewUsers * trend * (0.7 + rand() * 0.6));
    const activeUsers = Math.round(txns * (1.6 + rand() * 0.5));
    return { label, volume, fees, deposits, withdrawals, txns, newUsers, activeUsers };
  });

  const sum = (key: keyof TimePoint) =>
    timeseries.reduce((acc, p) => acc + (p[key] as number), 0);

  const totalVolume = sum("volume");
  const totalTxns = sum("txns");
  const totalFees = sum("fees");
  const newUsers = sum("newUsers");
  const activeUsers = Math.round(totalTxns * 0.62);
  const totalUsers = 18_420 + newUsers;

  const pct = () => Math.round((rand() * 36 - 8) * 10) / 10; // ~ -8% … +28%

  const txnWeights: [string, number][] = [
    ["Fiat Deposit", 0.27],
    ["Fiat Withdrawal", 0.17],
    ["Crypto Deposit", 0.13],
    ["Crypto Withdrawal", 0.1],
    ["Swap", 0.12],
    ["FX Conversion", 0.11],
    ["Internal Transfer", 0.1],
  ];
  const txnTypes = txnWeights.map(([name, w]) => ({
    name,
    count: Math.round(totalTxns * w),
    volume: Math.round(totalVolume * w),
  }));

  const assetWeights: [string, number][] = [
    ["NGN", 0.34],
    ["USDT", 0.27],
    ["BTC", 0.18],
    ["ETH", 0.13],
    ["USD", 0.08],
  ];
  const assets = assetWeights.map(([name, w]) => ({
    name,
    value: Math.round(totalVolume * w),
  }));

  const kycWeights: [string, number][] = [
    ["Tier 0", 0.4],
    ["Tier 1", 0.33],
    ["Tier 2", 0.2],
    ["Tier 3", 0.07],
  ];
  const kyc = kycWeights.map(([name, w]) => ({
    name,
    value: Math.round(totalUsers * w),
  }));

  return {
    range,
    kpis: {
      totalVolume: { value: totalVolume, delta: pct() },
      totalTxns: { value: totalTxns, delta: pct() },
      activeUsers: { value: activeUsers, delta: pct() },
      newUsers: { value: newUsers, delta: pct() },
      totalFees: { value: totalFees, delta: pct() },
      totalUsers: { value: totalUsers, delta: pct() },
    },
    timeseries,
    txnTypes,
    assets,
    kyc,
  };
}
