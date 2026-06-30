/** Mirrors ref.fee_schedules (Database.md §8). */

export type TxnType =
  | "fiat_deposit" | "fiat_withdrawal" | "crypto_deposit"
  | "crypto_withdrawal" | "internal_transfer" | "swap"
  | "fx_conversion" | "fee" | "reversal" | "adjustment";

export const TXN_TYPE_LABELS: Record<TxnType, string> = {
  fiat_deposit: "Fiat Deposit",
  fiat_withdrawal: "Fiat Withdrawal",
  crypto_deposit: "Crypto Deposit",
  crypto_withdrawal: "Crypto Withdrawal",
  internal_transfer: "Internal Transfer",
  swap: "Swap",
  fx_conversion: "FX Conversion",
  fee: "Fee",
  reversal: "Reversal",
  adjustment: "Adjustment",
};

export const TXN_TYPES = Object.keys(TXN_TYPE_LABELS) as TxnType[];

export type KycTier = "tier0" | "tier1" | "tier2" | "tier3";

export interface FeeSchedule {
  id: string;
  txnType: TxnType;
  assetId: string | null;
  assetSymbol: string | null;
  tier: KycTier | null;
  flatFee: number;
  percentFee: number;
  minFee: number | null;
  maxFee: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}

const NOW = "2024-03-10T00:00:00Z";

const SEED: FeeSchedule[] = [
  { id: "fs-1",  txnType: "fiat_deposit",      assetId: null, assetSymbol: null, tier: null, flatFee: 0,      percentFee: 0,       minFee: null,  maxFee: null,   effectiveFrom: NOW, effectiveTo: null },
  { id: "fs-2",  txnType: "fiat_withdrawal",    assetId: null, assetSymbol: null, tier: null, flatFee: 50,     percentFee: 0.005,   minFee: 50,    maxFee: 2000,   effectiveFrom: NOW, effectiveTo: null },
  { id: "fs-3",  txnType: "crypto_deposit",     assetId: null, assetSymbol: null, tier: null, flatFee: 0,      percentFee: 0,       minFee: null,  maxFee: null,   effectiveFrom: NOW, effectiveTo: null },
  { id: "fs-4",  txnType: "crypto_withdrawal",  assetId: "a-btc",  assetSymbol: "BTC",  tier: null, flatFee: 0.0005, percentFee: 0, minFee: null,  maxFee: null,   effectiveFrom: NOW, effectiveTo: null },
  { id: "fs-5",  txnType: "crypto_withdrawal",  assetId: "a-eth",  assetSymbol: "ETH",  tier: null, flatFee: 0.005,  percentFee: 0, minFee: null,  maxFee: null,   effectiveFrom: NOW, effectiveTo: null },
  { id: "fs-6",  txnType: "crypto_withdrawal",  assetId: "a-usdt", assetSymbol: "USDT", tier: null, flatFee: 3,      percentFee: 0, minFee: null,  maxFee: null,   effectiveFrom: NOW, effectiveTo: null },
  { id: "fs-7",  txnType: "internal_transfer",  assetId: null, assetSymbol: null, tier: null, flatFee: 0,      percentFee: 0,       minFee: null,  maxFee: null,   effectiveFrom: NOW, effectiveTo: null },
  { id: "fs-8",  txnType: "swap",               assetId: null, assetSymbol: null, tier: null, flatFee: 0,      percentFee: 0.003,   minFee: 10,    maxFee: null,   effectiveFrom: NOW, effectiveTo: null },
  { id: "fs-9",  txnType: "fx_conversion",      assetId: null, assetSymbol: null, tier: null, flatFee: 0,      percentFee: 0.015,   minFee: 50,    maxFee: 50000,  effectiveFrom: NOW, effectiveTo: null },
];

const _store = [...SEED];
let _counter = SEED.length + 1;

export function getFeeSchedules(): FeeSchedule[] { return _store; }
export function nextFeeScheduleId(): string { return `fs-${_counter++}`; }

export interface FeeScheduleSummary { total: number; active: number }
export function getFeeScheduleSummary(rows: FeeSchedule[]): FeeScheduleSummary {
  const now = new Date();
  return {
    total: rows.length,
    active: rows.filter(r => !r.effectiveTo || new Date(r.effectiveTo) > now).length,
  };
}
