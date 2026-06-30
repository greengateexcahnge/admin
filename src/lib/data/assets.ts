/**
 * Assets data layer.
 * Mirrors ref.assets (Database.md §8) — the catalogue of crypto + fiat assets
 * supported by Greengate. Mock-backed for now; replace getAssets() with a
 * query against ref.assets joined to the backend admin API.
 */

export type AssetKind = "crypto" | "fiat";

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  kind: AssetKind;
  decimals: number;
  isActive: boolean;
  isStablecoin: boolean;
  createdAt: string;
}

/** Seeded from migration 1710000000007-SeedReferenceData. */
const SEED: Asset[] = [
  {
    id: "a-ngn",
    symbol: "NGN",
    name: "Nigerian Naira",
    kind: "fiat",
    decimals: 2,
    isActive: true,
    isStablecoin: false,
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "a-usd",
    symbol: "USD",
    name: "US Dollar",
    kind: "fiat",
    decimals: 2,
    isActive: true,
    isStablecoin: false,
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "a-eur",
    symbol: "EUR",
    name: "Euro",
    kind: "fiat",
    decimals: 2,
    isActive: true,
    isStablecoin: false,
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "a-gbp",
    symbol: "GBP",
    name: "British Pound",
    kind: "fiat",
    decimals: 2,
    isActive: true,
    isStablecoin: false,
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "a-cad",
    symbol: "CAD",
    name: "Canadian Dollar",
    kind: "fiat",
    decimals: 2,
    isActive: true,
    isStablecoin: false,
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "a-btc",
    symbol: "BTC",
    name: "Bitcoin",
    kind: "crypto",
    decimals: 8,
    isActive: true,
    isStablecoin: false,
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "a-eth",
    symbol: "ETH",
    name: "Ethereum",
    kind: "crypto",
    decimals: 18,
    isActive: true,
    isStablecoin: false,
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "a-usdt",
    symbol: "USDT",
    name: "Tether",
    kind: "crypto",
    decimals: 6,
    isActive: true,
    isStablecoin: true,
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "a-usdc",
    symbol: "USDC",
    name: "USD Coin",
    kind: "crypto",
    decimals: 6,
    isActive: true,
    isStablecoin: true,
    createdAt: "2024-03-10T00:00:00Z",
  },
];

export function getAssets(): Asset[] {
  return SEED;
}

export interface AssetSummary {
  total: number;
  active: number;
  crypto: number;
  fiat: number;
}

export function getAssetSummary(assets: Asset[]): AssetSummary {
  return {
    total: assets.length,
    active: assets.filter((a) => a.isActive).length,
    crypto: assets.filter((a) => a.kind === "crypto").length,
    fiat: assets.filter((a) => a.kind === "fiat").length,
  };
}

let _counter = SEED.length + 1;

export function nextAssetId(): string {
  return `a-custom-${_counter++}`;
}
