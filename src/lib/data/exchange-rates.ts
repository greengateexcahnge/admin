/** Mirrors ref.exchange_rates (Database.md §8). Latest rates per pair plus history. */

export interface ExchangeRate {
  id: string;
  baseAssetId: string;
  baseSymbol: string;
  quoteAssetId: string;
  quoteSymbol: string;
  rate: number;
  buyRate: number | null;
  sellRate: number | null;
  source: string;
  capturedAt: string;
}

function d(daysAgo: number): string {
  const dt = new Date("2026-06-27T12:00:00Z");
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toISOString();
}

const PAIRS: Array<{
  baseId: string; base: string; quoteId: string; quote: string;
  rate: number; buy: number; sell: number;
}> = [
  { baseId: "a-usd",  base: "USD",  quoteId: "a-ngn", quote: "NGN", rate: 1545,       buy: 1530,       sell: 1560 },
  { baseId: "a-eur",  base: "EUR",  quoteId: "a-ngn", quote: "NGN", rate: 1680,       buy: 1662,       sell: 1698 },
  { baseId: "a-gbp",  base: "GBP",  quoteId: "a-ngn", quote: "NGN", rate: 1960,       buy: 1940,       sell: 1980 },
  { baseId: "a-cad",  base: "CAD",  quoteId: "a-ngn", quote: "NGN", rate: 1130,       buy: 1115,       sell: 1145 },
  { baseId: "a-btc",  base: "BTC",  quoteId: "a-ngn", quote: "NGN", rate: 154_000_000, buy: 152_000_000, sell: 156_000_000 },
  { baseId: "a-eth",  base: "ETH",  quoteId: "a-ngn", quote: "NGN", rate: 8_600_000,  buy: 8_500_000,  sell: 8_700_000 },
  { baseId: "a-usdt", base: "USDT", quoteId: "a-ngn", quote: "NGN", rate: 1530,       buy: 1520,       sell: 1540 },
  { baseId: "a-usdc", base: "USDC", quoteId: "a-ngn", quote: "NGN", rate: 1530,       buy: 1520,       sell: 1540 },
];

const SEED: ExchangeRate[] = PAIRS.flatMap((p, pi) => {
  const drift = [1, 1.008, 0.993, 1.005, 0.997];
  return drift.map((f, i) => ({
    id: `er-${pi}-${i}`,
    baseAssetId: p.baseId,
    baseSymbol: p.base,
    quoteAssetId: p.quoteId,
    quoteSymbol: p.quote,
    rate: Math.round(p.rate * f),
    buyRate: Math.round(p.buy * f),
    sellRate: Math.round(p.sell * f),
    source: i % 2 === 0 ? "chainlink" : "binance",
    capturedAt: d(drift.length - 1 - i),
  }));
});

const _store = [...SEED];
let _counter = SEED.length + 1;

export function getExchangeRates(): ExchangeRate[] { return _store; }

export function getLatestRates(): ExchangeRate[] {
  const latest = new Map<string, ExchangeRate>();
  for (const r of _store) {
    const key = `${r.baseSymbol}/${r.quoteSymbol}`;
    const existing = latest.get(key);
    if (!existing || r.capturedAt > existing.capturedAt) latest.set(key, r);
  }
  return [...latest.values()];
}

export function nextExchangeRateId(): string { return `er-custom-${_counter++}`; }

export interface ExchangeRateSummary { pairs: number; latestAt: string | null }
export function getExchangeRateSummary(): ExchangeRateSummary {
  const latest = getLatestRates();
  const dates = latest.map(r => r.capturedAt).sort();
  return { pairs: latest.length, latestAt: dates[dates.length - 1] ?? null };
}
