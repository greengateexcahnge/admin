/**
 * Transactions data layer.
 * Covers txn.transactions + the 8 detail sub-tables:
 * fiat_deposits, fiat_withdrawals, crypto_deposits, crypto_withdrawals,
 * swaps, fx_conversions, fx_payouts, internal_transfers.  (Database.md §11)
 */

import { getUsers } from "./users";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TxnStatus =
  | "initiated" | "pending" | "processing" | "requires_action"
  | "completed" | "failed" | "reversed" | "cancelled";

export const TXN_STATUS_LABELS: Record<TxnStatus, string> = {
  initiated: "Initiated", pending: "Pending", processing: "Processing",
  requires_action: "Action Needed", completed: "Completed",
  failed: "Failed", reversed: "Reversed", cancelled: "Cancelled",
};

export const TXN_STATUS_TONE: Record<TxnStatus, "success" | "warning" | "danger" | "neutral" | "info"> = {
  initiated: "info", pending: "warning", processing: "info",
  requires_action: "warning", completed: "success",
  failed: "danger", reversed: "neutral", cancelled: "neutral",
};

// Terminal statuses — no further transitions allowed
export const TERMINAL: Set<TxnStatus> = new Set(["completed", "failed", "reversed", "cancelled"]);

export interface BaseTxn {
  id: string;
  reference: string;
  userId: string;
  userName: string;
  userEmail: string;
  walletId: string;
  status: TxnStatus;
  assetSymbol: string;
  assetKind: "crypto" | "fiat";
  amount: number;
  fee: number;
  netAmount: number;
  description: string | null;
  failureReason: string | null;
  initiatedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface FiatDeposit extends BaseTxn {
  sourceAccountName: string;
  sourceAccountNumber: string;
  sourceBank: string;
  provider: string;
  providerRef: string;
  sessionId: string | null;
}

export interface FiatWithdrawal extends BaseTxn {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  provider: string;
  providerRef: string | null;
  nipSessionId: string | null;
}

export interface CryptoDeposit extends BaseTxn {
  networkCode: string;
  networkName: string;
  depositAddress: string;
  txHash: string;
  fromAddress: string | null;
  confirmations: number;
  requiredConfirmations: number;
  blockHeight: number | null;
}

export interface CryptoWithdrawal extends BaseTxn {
  networkCode: string;
  networkName: string;
  toAddress: string;
  memoTag: string | null;
  networkFee: number;
  txHash: string | null;
  broadcastAt: string | null;
  confirmations: number;
}

export interface Swap extends BaseTxn {
  fromSymbol: string;
  toSymbol: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  slippageBps: number | null;
}

export interface FxConversion extends BaseTxn {
  fromSymbol: string;
  toSymbol: string;
  side: "buy" | "sell";
  fromAmount: number;
  toAmount: number;
  rate: number;
}

export interface FxPayout extends BaseTxn {
  fromSymbol: "NGN";
  toSymbol: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  beneficiaryName: string;
  beneficiaryBank: string;
  beneficiaryAccount: string;
  swiftCode: string;
  bankCountry: string;
  provider: string;
  providerRef: string | null;
}

export interface InternalTransfer extends BaseTxn {
  direction: "credit" | "debit";
  counterpartyId: string;
  counterpartyName: string;
  counterpartyEmail: string;
  note: string | null;
}

export interface TxnTypeSummary {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalAmount: number;
}

// ─── PRNG ─────────────────────────────────────────────────────────────────────

function mulberry(seed: number) {
  let s = seed | 0;
  return () => {
    s = Math.imul(s + 0x6D2B79F5, s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

// ─── Address & hash helpers ───────────────────────────────────────────────────

const HEX = "0123456789abcdef";
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function hexStr(rand: () => number, len: number) {
  return Array.from({ length: len }, () => HEX[Math.floor(rand() * 16)]).join("");
}
function b58Str(rand: () => number, len: number) {
  return Array.from({ length: len }, () => B58[Math.floor(rand() * 58)]).join("");
}
const ethAddr = (r: () => number) => `0x${hexStr(r, 40)}`;
const btcAddr = (r: () => number) => `1${b58Str(r, 33)}`;
const tronAddr = (r: () => number) => `T${b58Str(r, 33)}`;
const txHash = (r: () => number) => `0x${hexStr(r, 64)}`;
const btcHash = (r: () => number) => hexStr(r, 64);

function nuban(r: () => number) {
  return Array.from({ length: 10 }, () => Math.floor(r() * 10)).join("");
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const BANKS = [
  { name: "Access Bank", code: "044" }, { name: "GTBank", code: "058" },
  { name: "First Bank", code: "011" }, { name: "Zenith Bank", code: "057" },
  { name: "UBA", code: "033" }, { name: "Opay", code: "999992" },
  { name: "Kuda MFB", code: "50211" }, { name: "Stanbic IBTC", code: "221" },
  { name: "FCMB", code: "214" }, { name: "Sterling Bank", code: "232" },
];

const FD_PROVIDERS = ["anchor", "flutterwave", "paystack", "manual"] as const;
const FW_PROVIDERS = ["paystack", "flutterwave", "lenco", "manual"] as const;

const NETWORKS: Record<string, { code: string; name: string; required: number }[]> = {
  BTC: [{ code: "bitcoin", name: "Bitcoin", required: 3 }],
  ETH: [{ code: "ethereum", name: "Ethereum", required: 12 }],
  USDT: [
    { code: "tron", name: "TRON (TRC-20)", required: 20 },
    { code: "ethereum", name: "Ethereum (ERC-20)", required: 12 },
  ],
  USDC: [
    { code: "ethereum", name: "Ethereum (ERC-20)", required: 12 },
    { code: "base", name: "Base", required: 15 },
  ],
};

const CRYPTO_ASSETS = ["BTC", "ETH", "USDT", "USDC"] as const;
const FIAT_ASSETS  = ["NGN", "USD", "EUR", "GBP", "CAD"] as const;

const SWAP_PAIRS: [string, string, number][] = [
  ["BTC",  "ETH",  0.0604],   // 1 BTC = 16.55 ETH
  ["ETH",  "USDT", 3594.5],
  ["USDT", "BTC",  0.00001042],
  ["USDT", "ETH",  0.000278],
  ["BTC",  "USDC", 96420],
  ["ETH",  "USDC", 3596.8],
  ["USDC", "USDT", 1.0002],
];

const FX_RATES: Record<string, number> = {
  USD: 1620, EUR: 1750, GBP: 2050, CAD: 1200,
};

const STATUSES: TxnStatus[] = [
  "completed", "completed", "completed", "completed", "completed", "completed",
  "pending", "pending", "pending",
  "processing", "processing",
  "requires_action",
  "failed", "failed",
  "cancelled",
];

function isoAt(daysAgo: number, hourOffset = 0): string {
  const d = new Date("2026-06-28T00:00:00Z");
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hourOffset);
  return d.toISOString();
}

function completedAt(status: TxnStatus, initiatedAt: string): string | null {
  if (status !== "completed" && status !== "reversed" && status !== "failed") return null;
  const d = new Date(initiatedAt);
  d.setMinutes(d.getMinutes() + 10);
  return d.toISOString();
}

function pickStatus(idx: number): TxnStatus {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return STATUSES[idx % STATUSES.length]!;
}

// ─── Seeds ────────────────────────────────────────────────────────────────────

let _fdCounter = 0;
let _fwCounter = 0;
let _cdCounter = 0;
let _cwCounter = 0;
let _swCounter = 0;
let _fxCounter = 0;
let _fpCounter = 0;
let _itCounter = 0;

function fdId()  { return `fd-${String(++_fdCounter).padStart(4, "0")}`; }
function fwId()  { return `fw-${String(++_fwCounter).padStart(4, "0")}`; }
function cdId()  { return `cd-${String(++_cdCounter).padStart(4, "0")}`; }
function cwId()  { return `cw-${String(++_cwCounter).padStart(4, "0")}`; }
function swId()  { return `sw-${String(++_swCounter).padStart(4, "0")}`; }
function fxId()  { return `fx-${String(++_fxCounter).padStart(4, "0")}`; }
function fpId()  { return `fp-${String(++_fpCounter).padStart(4, "0")}`; }
function itId()  { return `it-${String(++_itCounter).padStart(4, "0")}`; }
function fdRef() { return `GG-FD-${String(_fdCounter).padStart(4, "0")}`; }
function fwRef() { return `GG-FW-${String(_fwCounter).padStart(4, "0")}`; }
function cdRef() { return `GG-CD-${String(_cdCounter).padStart(4, "0")}`; }
function cwRef() { return `GG-CW-${String(_cwCounter).padStart(4, "0")}`; }
function swRef() { return `GG-SW-${String(_swCounter).padStart(4, "0")}`; }
function fxRef() { return `GG-FX-${String(_fxCounter).padStart(4, "0")}`; }
function fpRef() { return `GG-FP-${String(_fpCounter).padStart(4, "0")}`; }
function itRef() { return `GG-IT-${String(_itCounter).padStart(4, "0")}`; }

export function nextFdId()  { return `fd-${String(_fdCounter + 1).padStart(4, "0")}`; }
export function nextFwId()  { return `fw-${String(_fwCounter + 1).padStart(4, "0")}`; }
export function nextCdId()  { return `cd-${String(_cdCounter + 1).padStart(4, "0")}`; }
export function nextCwId()  { return `cw-${String(_cwCounter + 1).padStart(4, "0")}`; }
export function nextSwId()  { return `sw-${String(_swCounter + 1).padStart(4, "0")}`; }
export function nextFxId()  { return `fx-${String(_fxCounter + 1).padStart(4, "0")}`; }
export function nextFpId()  { return `fp-${String(_fpCounter + 1).padStart(4, "0")}`; }
export function nextItId()  { return `it-${String(_itCounter + 1).padStart(4, "0")}`; }

// ─── Generators ───────────────────────────────────────────────────────────────

function buildFiatDeposits(): FiatDeposit[] {
  const users = getUsers().filter(u => u.status === "active" || u.status === "pending");
  const result: FiatDeposit[] = [];
  const rand = mulberry(41);

  for (let i = 0; i < 30; i++) {
    const r = mulberry(i * 7 + 3);
    const user = users[i % users.length];
    const status = pickStatus(i);
    const daysAgo = Math.floor(r() * 90);
    const initiated = isoAt(daysAgo, Math.floor(r() * 23));
    const amount = Math.round((5_000 + r() * 495_000) * 100) / 100;
    const fee = Math.round(amount * 0.005 * 100) / 100;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const bank = BANKS[Math.floor(r() * BANKS.length)]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const provider = FD_PROVIDERS[Math.floor(r() * FD_PROVIDERS.length)]!;
    const id = fdId();
    if (!user) continue;

    result.push({
      id,
      reference: fdRef(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      walletId: `wallet-${user.id.slice(0, 8)}`,
      status,
      assetSymbol: "NGN",
      assetKind: "fiat",
      amount,
      fee,
      netAmount: amount - fee,
      description: null,
      failureReason: status === "failed" ? "Bank transfer not received within 24h" : null,
      initiatedAt: initiated,
      completedAt: completedAt(status, initiated),
      createdAt: initiated,
      sourceAccountName: `${["MR", "MRS", "DR"][Math.floor(r() * 3)]} ${["JOHN ADAMU", "GRACE OBI", "SAMUEL TAIWO", "BLESSING EZE", "VICTOR NWOSU"][Math.floor(r() * 5)]}`,
      sourceAccountNumber: nuban(r),
      sourceBank: bank.name,
      provider,
      providerRef: `${provider.toUpperCase()}-${hexStr(mulberry(rand() * 1000 | 0), 12).toUpperCase()}`,
      sessionId: provider !== "manual" ? `090405${hexStr(mulberry(rand() * 1000 | 0), 6).toUpperCase()}` : null,
    });
  }
  return result;
}

function buildFiatWithdrawals(): FiatWithdrawal[] {
  const users = getUsers().filter(u => u.status === "active");
  const result: FiatWithdrawal[] = [];
  const rand = mulberry(83);

  for (let i = 0; i < 25; i++) {
    const r = mulberry(i * 11 + 7);
    const user = users[i % users.length];
    const status = pickStatus(i + 3);
    const daysAgo = Math.floor(r() * 90);
    const initiated = isoAt(daysAgo, Math.floor(r() * 23));
    const amount = Math.round((10_000 + r() * 990_000) * 100) / 100;
    const fee = 52.5;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const bank = BANKS[Math.floor(r() * BANKS.length)]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const provider = FW_PROVIDERS[Math.floor(r() * FW_PROVIDERS.length)]!;
    const id = fwId();
    if (!user) continue;

    result.push({
      id,
      reference: fwRef(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      walletId: `wallet-${user.id.slice(0, 8)}`,
      status,
      assetSymbol: "NGN",
      assetKind: "fiat",
      amount,
      fee,
      netAmount: amount - fee,
      description: null,
      failureReason: status === "failed" ? "Beneficiary bank returned funds" : null,
      initiatedAt: initiated,
      completedAt: completedAt(status, initiated),
      createdAt: initiated,
      accountNumber: nuban(r),
      accountName: user.name.toUpperCase(),
      bankName: bank.name,
      bankCode: bank.code,
      provider,
      providerRef: status === "completed" || status === "processing"
        ? `${hexStr(mulberry(rand() * 1000 | 0), 14).toUpperCase()}`
        : null,
      nipSessionId: status === "completed"
        ? `090405${hexStr(mulberry(rand() * 1000 | 0), 6).toUpperCase()}`
        : null,
    });
  }
  return result;
}

function buildCryptoDeposits(): CryptoDeposit[] {
  const users = getUsers().filter(u => u.kycTier >= 2);
  const result: CryptoDeposit[] = [];
  const rand = mulberry(127);

  for (let i = 0; i < 20; i++) {
    const r = mulberry(i * 13 + 17);
    const user = users[i % users.length];
    if (!user) continue;
    const status = pickStatus(i + 1);
    const daysAgo = Math.floor(r() * 90);
    const initiated = isoAt(daysAgo, Math.floor(r() * 23));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const assetSym = CRYPTO_ASSETS[Math.floor(r() * CRYPTO_ASSETS.length)]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const nets = NETWORKS[assetSym]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const net = nets[Math.floor(r() * nets.length)]!;
    const isBtc = assetSym === "BTC";
    const amount = isBtc
      ? Math.round(r() * 0.5 * 1e8) / 1e8
      : Math.round((0.01 + r() * 4.99) * 1e6) / 1e6;
    const fee = 0;
    const conf = status === "completed" ? net.required + Math.floor(r() * 50)
                 : status === "processing" ? Math.floor(r() * net.required)
                 : 0;
    const r2 = mulberry(rand() * 10000 | 0);

    result.push({
      id: cdId(),
      reference: cdRef(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      walletId: `wallet-${user.id.slice(0, 8)}`,
      status,
      assetSymbol: assetSym,
      assetKind: "crypto",
      amount,
      fee,
      netAmount: amount,
      description: null,
      failureReason: null,
      initiatedAt: initiated,
      completedAt: completedAt(status, initiated),
      createdAt: initiated,
      networkCode: net.code,
      networkName: net.name,
      depositAddress: net.code === "bitcoin" ? btcAddr(r2) : net.code === "tron" ? tronAddr(r2) : ethAddr(r2),
      txHash: net.code === "bitcoin" ? btcHash(r2) : txHash(r2),
      fromAddress: r() > 0.3 ? (net.code === "bitcoin" ? btcAddr(r2) : net.code === "tron" ? tronAddr(r2) : ethAddr(r2)) : null,
      confirmations: conf,
      requiredConfirmations: net.required,
      blockHeight: conf > 0 ? 19_800_000 + Math.floor(r() * 100_000) : null,
    });
  }
  return result;
}

function buildCryptoWithdrawals(): CryptoWithdrawal[] {
  const users = getUsers().filter(u => u.kycTier >= 2);
  const result: CryptoWithdrawal[] = [];
  const rand = mulberry(251);

  for (let i = 0; i < 20; i++) {
    const r = mulberry(i * 17 + 23);
    const user = users[i % users.length];
    if (!user) continue;
    const status = pickStatus(i + 5);
    const daysAgo = Math.floor(r() * 90);
    const initiated = isoAt(daysAgo, Math.floor(r() * 23));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const assetSym = CRYPTO_ASSETS[Math.floor(r() * CRYPTO_ASSETS.length)]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const nets = NETWORKS[assetSym]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const net = nets[Math.floor(r() * nets.length)]!;
    const isBtc = assetSym === "BTC";
    const amount = isBtc
      ? Math.round(r() * 0.3 * 1e8) / 1e8
      : Math.round((0.01 + r() * 2.99) * 1e6) / 1e6;
    const networkFee = isBtc ? 0.0001 : assetSym === "ETH" ? 0.0008 : 1.2;
    const r2 = mulberry(rand() * 10000 | 0);
    const hasTxHash = status === "completed" || status === "processing";
    const conf = status === "completed" ? net.required + Math.floor(r() * 20) : 0;

    result.push({
      id: cwId(),
      reference: cwRef(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      walletId: `wallet-${user.id.slice(0, 8)}`,
      status,
      assetSymbol: assetSym,
      assetKind: "crypto",
      amount,
      fee: networkFee,
      netAmount: amount - networkFee,
      description: null,
      failureReason: status === "failed" ? "Wallet address validation failed" : null,
      initiatedAt: initiated,
      completedAt: completedAt(status, initiated),
      createdAt: initiated,
      networkCode: net.code,
      networkName: net.name,
      toAddress: net.code === "bitcoin" ? btcAddr(r2) : net.code === "tron" ? tronAddr(r2) : ethAddr(r2),
      memoTag: null,
      networkFee,
      txHash: hasTxHash ? (net.code === "bitcoin" ? btcHash(r2) : txHash(r2)) : null,
      broadcastAt: hasTxHash ? new Date(new Date(initiated).getTime() + 60_000).toISOString() : null,
      confirmations: conf,
    });
  }
  return result;
}

function buildSwaps(): Swap[] {
  const users = getUsers().filter(u => u.kycTier >= 2);
  const result: Swap[] = [];

  for (let i = 0; i < 18; i++) {
    const r = mulberry(i * 23 + 29);
    const user = users[i % users.length];
    if (!user) continue;
    const status = pickStatus(i + 2);
    const daysAgo = Math.floor(r() * 90);
    const initiated = isoAt(daysAgo, Math.floor(r() * 23));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [fromSym, toSym, rate] = SWAP_PAIRS[i % SWAP_PAIRS.length]!;
    const fromAmount = Math.round((0.005 + r() * 1.995) * 1e6) / 1e6;
    const toAmount = Math.round(fromAmount * rate * 1e6) / 1e6;
    const fee = Math.round(fromAmount * 0.002 * 1e6) / 1e6;

    result.push({
      id: swId(),
      reference: swRef(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      walletId: `wallet-${user.id.slice(0, 8)}`,
      status,
      assetSymbol: fromSym,
      assetKind: "crypto",
      amount: fromAmount,
      fee,
      netAmount: fromAmount - fee,
      description: null,
      failureReason: status === "failed" ? "Insufficient liquidity for swap pair" : null,
      initiatedAt: initiated,
      completedAt: completedAt(status, initiated),
      createdAt: initiated,
      fromSymbol: fromSym,
      toSymbol: toSym,
      fromAmount,
      toAmount,
      rate,
      slippageBps: Math.floor(r() * 50),
    });
  }
  return result;
}

function buildFxConversions(): FxConversion[] {
  const users = getUsers().filter(u => u.status === "active");
  const result: FxConversion[] = [];
  const FX_PAIRS = Object.entries(FX_RATES) as [string, number][];

  for (let i = 0; i < 18; i++) {
    const r = mulberry(i * 31 + 37);
    const user = users[i % users.length];
    if (!user) continue;
    const status = pickStatus(i + 4);
    const daysAgo = Math.floor(r() * 90);
    const initiated = isoAt(daysAgo, Math.floor(r() * 23));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [foreignSym, rate] = FX_PAIRS[i % FX_PAIRS.length]!;
    const side = r() > 0.5 ? "buy" as const : "sell" as const;
    const ngnAmount = Math.round((50_000 + r() * 950_000) * 100) / 100;
    const foreignAmount = Math.round((ngnAmount / rate) * 100) / 100;
    const fromAmount = side === "buy" ? ngnAmount : foreignAmount;
    const toAmount = side === "buy" ? foreignAmount : ngnAmount;
    const fromSym = side === "buy" ? "NGN" : foreignSym;
    const toSym = side === "buy" ? foreignSym : "NGN";
    const fee = Math.round(ngnAmount * 0.015 * 100) / 100;

    result.push({
      id: fxId(),
      reference: fxRef(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      walletId: `wallet-${user.id.slice(0, 8)}`,
      status,
      assetSymbol: fromSym,
      assetKind: "fiat",
      amount: fromAmount,
      fee,
      netAmount: fromAmount - fee,
      description: null,
      failureReason: status === "failed" ? "FX rate expired, please retry" : null,
      initiatedAt: initiated,
      completedAt: completedAt(status, initiated),
      createdAt: initiated,
      fromSymbol: fromSym,
      toSymbol: toSym,
      side,
      fromAmount,
      toAmount,
      rate,
    });
  }
  return result;
}

const FP_PROVIDERS = ["grey", "flutterwave", "chipper", "manual"] as const;
const FP_COUNTRIES: Record<string, string> = { USD: "US", EUR: "DE", GBP: "GB", CAD: "CA" };
const FP_BANKS = [
  "JPMorgan Chase", "Deutsche Bank", "Barclays", "Royal Bank of Canada", "HSBC",
  "Citibank", "BNP Paribas", "Standard Chartered", "TD Bank", "Lloyds Bank",
];

function buildFxPayouts(): FxPayout[] {
  const users = getUsers().filter(u => u.status === "active");
  const result: FxPayout[] = [];
  const FX_PAIRS = Object.entries(FX_RATES) as [string, number][];

  for (let i = 0; i < 15; i++) {
    const r = mulberry(i * 53 + 61);
    const user = users[i % users.length];
    if (!user) continue;
    const status = pickStatus(i + 6);
    const daysAgo = Math.floor(r() * 90);
    const initiated = isoAt(daysAgo, Math.floor(r() * 23));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [foreignSym, rate] = FX_PAIRS[i % FX_PAIRS.length]!;
    const ngnAmount = Math.round((100_000 + r() * 4_900_000) * 100) / 100;
    const foreignAmount = Math.round((ngnAmount / rate) * 100) / 100;
    const fee = Math.round(ngnAmount * 0.02 * 100) / 100;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const provider = FP_PROVIDERS[Math.floor(r() * FP_PROVIDERS.length)]!;
    const bankCountry = FP_COUNTRIES[foreignSym] ?? "US";
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const bank = FP_BANKS[Math.floor(r() * FP_BANKS.length)]!;
    const iban = `${bankCountry}${Math.floor(r() * 90 + 10)}${Array.from({ length: 16 }, () => Math.floor(r() * 10)).join("")}`;
    const swift = `${bank.replace(/\s/g, "").slice(0, 4).toUpperCase()}${bankCountry}XX`;
    const id = fpId();

    result.push({
      id,
      reference: fpRef(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      walletId: `wallet-${user.id.slice(0, 8)}`,
      status,
      assetSymbol: "NGN",
      assetKind: "fiat",
      amount: ngnAmount,
      fee,
      netAmount: ngnAmount - fee,
      description: null,
      failureReason: status === "failed" ? "Beneficiary account rejected by correspondent bank" : null,
      initiatedAt: initiated,
      completedAt: completedAt(status, initiated),
      createdAt: initiated,
      fromSymbol: "NGN",
      toSymbol: foreignSym,
      fromAmount: ngnAmount,
      toAmount: foreignAmount,
      rate,
      beneficiaryName: user.name.toUpperCase(),
      beneficiaryBank: bank,
      beneficiaryAccount: iban,
      swiftCode: swift,
      bankCountry,
      provider,
      providerRef: status === "completed" || status === "processing"
        ? `${provider.toUpperCase()}-${hexStr(mulberry(r() * 10000 | 0), 12).toUpperCase()}`
        : null,
    });
  }
  return result;
}

function buildInternalTransfers(): InternalTransfer[] {
  const users = getUsers().filter(u => u.status === "active");
  const result: InternalTransfer[] = [];
  const NOTES = [
    "Payment for services", "Split bill", "Loan repayment",
    "Shared expenses", "Gift", null, null,
  ];

  for (let i = 0; i < 18; i++) {
    const r = mulberry(i * 41 + 43);
    const sender = users[i % users.length];
    const recipient = users[(i + 3) % users.length];
    if (!sender || !recipient || sender.id === recipient.id) continue;
    const status = pickStatus(i + 1);
    const daysAgo = Math.floor(r() * 90);
    const initiated = isoAt(daysAgo, Math.floor(r() * 23));
    const amount = Math.round((500 + r() * 199_500) * 100) / 100;
    const fee = 0;

    // Debit (sender side)
    result.push({
      id: itId(),
      reference: itRef(),
      userId: sender.id,
      userName: sender.name,
      userEmail: sender.email,
      walletId: `wallet-${sender.id.slice(0, 8)}`,
      status,
      assetSymbol: "NGN",
      assetKind: "fiat",
      amount,
      fee,
      netAmount: amount,
      description: null,
      failureReason: null,
      initiatedAt: initiated,
      completedAt: completedAt(status, initiated),
      createdAt: initiated,
      direction: "debit",
      counterpartyId: recipient.id,
      counterpartyName: recipient.name,
      counterpartyEmail: recipient.email,
      note: (NOTES[i % NOTES.length] ?? null) as string | null,
    });
  }
  return result;
}

// ─── Seed stores ──────────────────────────────────────────────────────────────

const SEED_FD  = buildFiatDeposits();
const SEED_FW  = buildFiatWithdrawals();
const SEED_CD  = buildCryptoDeposits();
const SEED_CW  = buildCryptoWithdrawals();
const SEED_SW  = buildSwaps();
const SEED_FX  = buildFxConversions();
const SEED_FP  = buildFxPayouts();
const SEED_IT  = buildInternalTransfers();

const _fd  = [...SEED_FD];
const _fw  = [...SEED_FW];
const _cd  = [...SEED_CD];
const _cw  = [...SEED_CW];
const _sw  = [...SEED_SW];
const _fx  = [...SEED_FX];
const _fp  = [...SEED_FP];
const _it  = [...SEED_IT];

// ─── Public getters ───────────────────────────────────────────────────────────

export const getFiatDeposits    = (): FiatDeposit[]    => [..._fd];
export const getFiatWithdrawals = (): FiatWithdrawal[] => [..._fw];
export const getCryptoDeposits  = (): CryptoDeposit[]  => [..._cd];
export const getCryptoWithdrawals = (): CryptoWithdrawal[] => [..._cw];
export const getSwaps           = (): Swap[]           => [..._sw];
export const getFxConversions   = (): FxConversion[]   => [..._fx];
export const getFxPayouts       = (): FxPayout[]       => [..._fp];
export const getInternalTransfers = (): InternalTransfer[] => [..._it];

// ─── Summary ──────────────────────────────────────────────────────────────────

export function summarize(txns: BaseTxn[]): TxnTypeSummary {
  return {
    total: txns.length,
    pending: txns.filter(t => t.status === "pending" || t.status === "initiated" || t.status === "requires_action").length,
    processing: txns.filter(t => t.status === "processing").length,
    completed: txns.filter(t => t.status === "completed").length,
    failed: txns.filter(t => t.status === "failed" || t.status === "cancelled" || t.status === "reversed").length,
    totalAmount: txns.reduce((s, t) => s + t.amount, 0),
  };
}

export interface TxnBentoData {
  fiatDeposits:      TxnTypeSummary & { preview: Array<{ label: string; value: string }> };
  fiatWithdrawals:   TxnTypeSummary & { preview: Array<{ label: string; value: string }> };
  cryptoDeposits:    TxnTypeSummary & { preview: Array<{ label: string; value: string }> };
  cryptoWithdrawals: TxnTypeSummary & { preview: Array<{ label: string; value: string }> };
  swaps:             TxnTypeSummary & { preview: Array<{ label: string; value: string }> };
  fxConversions:     TxnTypeSummary & { preview: Array<{ label: string; value: string }> };
  fxPayouts:         TxnTypeSummary & { preview: Array<{ label: string; value: string }> };
  internalTransfers: TxnTypeSummary & { preview: Array<{ label: string; value: string }> };
}

function fmtAmt(amount: number, symbol: string, kind: "crypto" | "fiat"): string {
  if (kind === "fiat") return `${symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${amount.toFixed(symbol === "BTC" ? 6 : 4)} ${symbol}`;
}

function bentoPreview(txns: BaseTxn[]): Array<{ label: string; value: string }> {
  return txns
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)
    .map(t => ({
      label: `${t.reference} · ${t.userName.split(" ")[0]}`,
      value: fmtAmt(t.amount, t.assetSymbol, t.assetKind),
    }));
}

export function getTxnBentoData(): TxnBentoData {
  return {
    fiatDeposits:      { ...summarize(_fd), preview: bentoPreview(_fd) },
    fiatWithdrawals:   { ...summarize(_fw), preview: bentoPreview(_fw) },
    cryptoDeposits:    { ...summarize(_cd), preview: bentoPreview(_cd) },
    cryptoWithdrawals: { ...summarize(_cw), preview: bentoPreview(_cw) },
    swaps:             { ...summarize(_sw), preview: bentoPreview(_sw) },
    fxConversions:     { ...summarize(_fx), preview: bentoPreview(_fx) },
    fxPayouts:         { ...summarize(_fp), preview: bentoPreview(_fp) },
    internalTransfers: { ...summarize(_it), preview: bentoPreview(_it) },
  };
}
