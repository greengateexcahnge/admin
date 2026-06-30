/**
 * Wallets data layer.
 * Covers wallet.wallets, wallet.virtual_accounts, wallet.deposit_addresses,
 * wallet.payout_accounts, wallet.address_book, and a cross-user txn feed.
 * (Database.md §9–11)
 */

import { getUsers } from "./users";

// ─── Shared types ────────────────────────────────────────────────────────────

export type TxnType =
  | "fiat_deposit" | "fiat_withdrawal" | "crypto_deposit"
  | "crypto_withdrawal" | "internal_transfer" | "swap"
  | "fx_conversion" | "fee" | "reversal" | "adjustment";

export type TxnStatus =
  | "initiated" | "pending" | "processing" | "requires_action"
  | "completed" | "failed" | "reversed" | "cancelled";

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

export const TXN_TYPE_TONE: Record<TxnType, "success" | "warning" | "danger" | "neutral" | "info"> = {
  fiat_deposit: "success",
  fiat_withdrawal: "neutral",
  crypto_deposit: "success",
  crypto_withdrawal: "neutral",
  internal_transfer: "info",
  swap: "info",
  fx_conversion: "info",
  fee: "neutral",
  reversal: "warning",
  adjustment: "warning",
};

export const TXN_STATUS_TONE: Record<TxnStatus, "success" | "warning" | "danger" | "neutral" | "info"> = {
  initiated: "info",
  pending: "warning",
  processing: "info",
  requires_action: "warning",
  completed: "success",
  failed: "danger",
  reversed: "neutral",
  cancelled: "neutral",
};

// ─── Entity types ─────────────────────────────────────────────────────────────

export interface BalanceLine {
  symbol: string;
  name: string;
  kind: "crypto" | "fiat";
  balance: number;
  lockedBalance: number;
}

export interface PlatformWallet {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  label: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  balances: BalanceLine[];
  totalNgn: number;
}

export interface VirtualAccount {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  walletId: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  provider: "anchor" | "flutterwave" | "paystack";
  isActive: boolean;
  createdAt: string;
}

export interface DepositAddress {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  walletId: string;
  assetSymbol: string;
  assetName: string;
  networkCode: string;
  networkName: string;
  address: string;
  memoTag: string | null;
  provider: "fireblocks" | "bitgo";
  isActive: boolean;
  createdAt: string;
}

export interface PayoutAccount {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AddressBookEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  assetSymbol: string;
  networkCode: string;
  networkName: string;
  label: string | null;
  address: string;
  memoTag: string | null;
  whitelistedAt: string | null;
  createdAt: string;
}

export interface PlatformTransaction {
  id: string;
  reference: string;
  userId: string;
  userName: string;
  userEmail: string;
  walletId: string;
  type: TxnType;
  direction: "credit" | "debit";
  status: TxnStatus;
  assetSymbol: string;
  assetKind: "crypto" | "fiat";
  amount: number;
  fee: number;
  netAmount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface WalletsSummary {
  totalWallets: number;
  activeWallets: number;
  totalVirtualAccounts: number;
  activeVirtualAccounts: number;
  totalDepositAddresses: number;
  activeDepositAddresses: number;
  totalPayoutAccounts: number;
  verifiedPayoutAccounts: number;
  totalAddressBookEntries: number;
  whitelistedAddressEntries: number;
}

// ─── PRNG & helpers ───────────────────────────────────────────────────────────

function mulberry(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoAgo(days: number, rand: () => number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(Math.floor(rand() * 24));
  d.setMinutes(Math.floor(rand() * 60));
  return d.toISOString();
}

function hexStr(rand: () => number, len: number) {
  return Array.from({ length: len }, () => Math.floor(rand() * 16).toString(16)).join("");
}

function b58Str(rand: () => number, len: number) {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return Array.from({ length: len }, () => chars[Math.floor(rand() * chars.length)]).join("");
}

function ethAddr(rand: () => number) { return `0x${hexStr(rand, 40)}`; }
function btcAddr(rand: () => number) { return `1${b58Str(rand, 33)}`; }
function tronAddr(rand: () => number) { return `T${b58Str(rand, 33)}`; }
function nuban(rand: () => number) {
  return Array.from({ length: 10 }, () => Math.floor(rand() * 10).toString()).join("");
}

// ─── Reference data ───────────────────────────────────────────────────────────

const BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "058", name: "GTBank" },
  { code: "057", name: "Zenith Bank" },
  { code: "011", name: "First Bank" },
  { code: "033", name: "UBA" },
  { code: "232", name: "Sterling Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "068", name: "Standard Chartered" },
] as const;

const VA_CONFIGS = [
  { bankCode: "035", bankName: "Wema Bank", provider: "paystack" as const },
  { bankCode: "100014", bankName: "Titan Trust Bank", provider: "flutterwave" as const },
  { bankCode: "090405", bankName: "Prospa Microfinance", provider: "anchor" as const },
] as const;

const DEPOSIT_CONFIGS = [
  { assetSymbol: "BTC", assetName: "Bitcoin", networkCode: "bitcoin", networkName: "Bitcoin", addrFn: btcAddr, memoTag: false },
  { assetSymbol: "ETH", assetName: "Ethereum", networkCode: "ethereum", networkName: "Ethereum (ERC-20)", addrFn: ethAddr, memoTag: false },
  { assetSymbol: "USDT", assetName: "Tether", networkCode: "ethereum", networkName: "Ethereum (ERC-20)", addrFn: ethAddr, memoTag: false },
  { assetSymbol: "USDT", assetName: "Tether", networkCode: "tron", networkName: "Tron (TRC-20)", addrFn: tronAddr, memoTag: false },
  { assetSymbol: "USDC", assetName: "USD Coin", networkCode: "ethereum", networkName: "Ethereum (ERC-20)", addrFn: ethAddr, memoTag: false },
] as const;

const AB_LABELS = ["Exchange Wallet", "Hardware Wallet", "Friend", "Personal Cold", "Business", "Savings Wallet"];

const TXN_STATUSES: TxnStatus[] = ["completed", "completed", "completed", "completed", "pending", "failed"];
const FIAT_TXN_TYPES: TxnType[] = ["fiat_deposit", "fiat_withdrawal", "internal_transfer", "fx_conversion"];
const CRYPTO_TXN_TYPES: TxnType[] = ["crypto_deposit", "crypto_withdrawal", "swap"];

// ─── Data generation ──────────────────────────────────────────────────────────

interface BuildResult {
  wallets: PlatformWallet[];
  virtualAccounts: VirtualAccount[];
  depositAddresses: DepositAddress[];
  payoutAccounts: PayoutAccount[];
  addressBook: AddressBookEntry[];
  transactions: PlatformTransaction[];
}

function buildData(): BuildResult {
  const users = getUsers();
  const wallets: PlatformWallet[] = [];
  const virtualAccounts: VirtualAccount[] = [];
  const depositAddresses: DepositAddress[] = [];
  const payoutAccounts: PayoutAccount[] = [];
  const addressBook: AddressBookEntry[] = [];
  const allTxns: PlatformTransaction[] = [];

  for (const user of users) {
    const idx = parseInt(user.id.replace("GG-U", ""), 10) - 1042;
    const rand = mulberry(idx * 13 + 5);
    const tier = user.kycTier;
    const joinedDays = Math.floor((Date.now() - new Date(user.joinedAt).getTime()) / 86_400_000);
    const isActive = user.status === "active" || user.status === "pending";
    const email = `${user.name.toLowerCase().replace(" ", ".")  }@gmail.com`;

    // ─ Wallet ─
    const primaryWalletId = `wlt-${user.id}-p`;
    const ngnBal = Math.round(user.portfolioNgn * 0.4);
    const usdBal = tier >= 1 ? Math.round(rand() * 150 + 20) : 0;
    const usdtBal = tier >= 1 ? parseFloat((user.portfolioNgn * 0.0003 * rand()).toFixed(2)) : 0;
    const btcBal = tier >= 2 ? parseFloat((user.portfolioNgn * 0.000000012 * rand()).toFixed(8)) : 0;
    const ethBal = tier >= 2 ? parseFloat((user.portfolioNgn * 0.00000018 * rand()).toFixed(6)) : 0;

    const balances: BalanceLine[] = [
      { symbol: "NGN", name: "Nigerian Naira", kind: "fiat", balance: ngnBal, lockedBalance: Math.round(ngnBal * 0.03 * rand()) },
      ...(usdBal > 0 ? [{ symbol: "USD", name: "US Dollar", kind: "fiat" as const, balance: usdBal, lockedBalance: 0 }] : []),
      ...(usdtBal > 5 ? [{ symbol: "USDT", name: "Tether", kind: "crypto" as const, balance: usdtBal, lockedBalance: 0 }] : []),
      ...(btcBal > 0.0001 ? [{ symbol: "BTC", name: "Bitcoin", kind: "crypto" as const, balance: btcBal, lockedBalance: 0 }] : []),
      ...(ethBal > 0.001 ? [{ symbol: "ETH", name: "Ethereum", kind: "crypto" as const, balance: ethBal, lockedBalance: 0 }] : []),
    ];

    const totalNgn = ngnBal + usdBal * 1620 + usdtBal * 1618 + btcBal * 96_000_000 + ethBal * 5_800_000;

    wallets.push({
      id: primaryWalletId,
      userId: user.id,
      userName: user.name,
      userEmail: email,
      label: "Main",
      isPrimary: true,
      isActive,
      createdAt: user.joinedAt,
      balances,
      totalNgn: Math.round(totalNgn),
    });

    // Secondary wallet for some tier2+ users
    if (tier >= 2 && rand() > 0.55) {
      const savWalletId = `wlt-${user.id}-s`;
      const savBal = parseFloat((rand() * 400 + 50).toFixed(2));
      wallets.push({
        id: savWalletId,
        userId: user.id,
        userName: user.name,
        userEmail: email,
        label: "Savings",
        isPrimary: false,
        isActive: true,
        createdAt: isoAgo(joinedDays - 30, rand),
        balances: [{ symbol: "USDT", name: "Tether", kind: "crypto", balance: savBal, lockedBalance: 0 }],
        totalNgn: Math.round(savBal * 1618),
      });
    }

    // ─ Virtual accounts (tier >= 1) ─
    if (tier >= 1) {
      const vaConfig = VA_CONFIGS[idx % VA_CONFIGS.length]!;
      virtualAccounts.push({
        id: `va-${user.id}-1`,
        userId: user.id,
        userName: user.name,
        userEmail: email,
        walletId: primaryWalletId,
        accountNumber: nuban(rand),
        accountName: user.name.toUpperCase(),
        bankName: vaConfig.bankName,
        bankCode: vaConfig.bankCode,
        provider: vaConfig.provider,
        isActive: isActive,
        createdAt: isoAgo(joinedDays - 1, rand),
      });

      // Some tier2+ get a second VA from a different provider
      if (tier >= 2 && rand() > 0.6) {
        const vaConfig2 = VA_CONFIGS[(idx + 1) % VA_CONFIGS.length]!;
        virtualAccounts.push({
          id: `va-${user.id}-2`,
          userId: user.id,
          userName: user.name,
          userEmail: email,
          walletId: primaryWalletId,
          accountNumber: nuban(rand),
          accountName: user.name.toUpperCase(),
          bankName: vaConfig2.bankName,
          bankCode: vaConfig2.bankCode,
          provider: vaConfig2.provider,
          isActive: true,
          createdAt: isoAgo(joinedDays - 20, rand),
        });
      }
    }

    // ─ Deposit addresses (tier >= 2) ─
    if (tier >= 2) {
      const addrConfigs = tier >= 3
        ? DEPOSIT_CONFIGS                           // all 5 for tier3
        : DEPOSIT_CONFIGS.slice(0, 3);              // BTC + ETH + USDT/ETH for tier2

      addrConfigs.forEach((cfg, ai) => {
        depositAddresses.push({
          id: `da-${user.id}-${ai}`,
          userId: user.id,
          userName: user.name,
          userEmail: email,
          walletId: primaryWalletId,
          assetSymbol: cfg.assetSymbol,
          assetName: cfg.assetName,
          networkCode: cfg.networkCode,
          networkName: cfg.networkName,
          address: cfg.addrFn(rand),
          memoTag: null,
          provider: rand() > 0.5 ? "fireblocks" : "bitgo",
          isActive: isActive,
          createdAt: isoAgo(joinedDays - 1, rand),
        });
      });
    }

    // ─ Payout accounts (tier >= 1) ─
    if (tier >= 1) {
      const bank = BANKS[idx % BANKS.length]!;
      payoutAccounts.push({
        id: `pa-${user.id}-1`,
        userId: user.id,
        userName: user.name,
        userEmail: email,
        bankName: bank.name,
        bankCode: bank.code,
        accountNumber: nuban(rand),
        accountName: user.name.toUpperCase(),
        isVerified: rand() > 0.25,
        createdAt: isoAgo(joinedDays - 2, rand),
      });

      if (tier >= 2 && rand() > 0.5) {
        const bank2 = BANKS[(idx + 2) % BANKS.length]!;
        payoutAccounts.push({
          id: `pa-${user.id}-2`,
          userId: user.id,
          userName: user.name,
          userEmail: email,
          bankName: bank2.name,
          bankCode: bank2.code,
          accountNumber: nuban(rand),
          accountName: user.name.toUpperCase(),
          isVerified: rand() > 0.5,
          createdAt: isoAgo(joinedDays - 40, rand),
        });
      }
    }

    // ─ Address book (tier >= 2) ─
    if (tier >= 2) {
      const entryCount = Math.floor(rand() * 3) + 1;
      for (let a = 0; a < entryCount; a++) {
        const isCrypto = rand() > 0.3;
        const symbol = isCrypto ? (rand() > 0.5 ? "BTC" : rand() > 0.5 ? "ETH" : "USDT") : "USDT";
        const networkCode = symbol === "BTC" ? "bitcoin" : rand() > 0.5 ? "ethereum" : "tron";
        const networkName = networkCode === "bitcoin" ? "Bitcoin" : networkCode === "ethereum" ? "Ethereum (ERC-20)" : "Tron (TRC-20)";
        const addr = networkCode === "bitcoin" ? btcAddr(rand) : networkCode === "tron" ? tronAddr(rand) : ethAddr(rand);
        const isWhitelisted = rand() > 0.6;

        addressBook.push({
          id: `ab-${user.id}-${a}`,
          userId: user.id,
          userName: user.name,
          userEmail: email,
          assetSymbol: symbol,
          networkCode,
          networkName,
          label: rand() > 0.3 ? (AB_LABELS[Math.floor(rand() * AB_LABELS.length)] ?? null) : null,
          address: addr,
          memoTag: null,
          whitelistedAt: isWhitelisted ? isoAgo(joinedDays - 5, rand) : null,
          createdAt: isoAgo(joinedDays - 10 + a * 5, rand),
        });
      }
    }

    // ─ Transactions ─
    if (user.txnCount > 0) {
      const txnCount = Math.min(8, Math.max(3, Math.floor(rand() * 8 + 3)));
      const cryptoOk = tier >= 2;
      const types = cryptoOk
        ? [...FIAT_TXN_TYPES, ...CRYPTO_TXN_TYPES]
        : FIAT_TXN_TYPES;

      for (let t = 0; t < txnCount; t++) {
        const type = types[Math.floor(rand() * types.length)]!;
        const status = TXN_STATUSES[Math.floor(rand() * TXN_STATUSES.length)]!;
        const isCrypto = ["crypto_deposit", "crypto_withdrawal", "swap"].includes(type);
        const symbol = isCrypto ? (rand() > 0.6 ? "BTC" : rand() > 0.4 ? "ETH" : "USDT") : "NGN";
        const assetKind: "crypto" | "fiat" = isCrypto ? "crypto" : "fiat";
        const amount = isCrypto
          ? symbol === "BTC" ? parseFloat((rand() * 0.02 + 0.001).toFixed(8))
          : symbol === "ETH" ? parseFloat((rand() * 0.5 + 0.01).toFixed(6))
          : parseFloat((rand() * 500 + 20).toFixed(2))
          : Math.round(rand() * 150_000 + 5_000);
        const fee = isCrypto
          ? parseFloat((amount * 0.001).toFixed(8))
          : Math.round(amount * 0.015);
        const isDebit = ["fiat_withdrawal", "crypto_withdrawal", "swap", "fx_conversion"].includes(type);
        const netAmount = isDebit ? amount - fee : amount;
        const createdDaysAgo = t * 2 + Math.floor(rand() * 2);
        const createdAt = isoAgo(createdDaysAgo, rand);

        allTxns.push({
          id: `txn-${user.id}-${t}`,
          reference: `GG-${b58Str(rand, 6).toUpperCase()}`,
          userId: user.id,
          userName: user.name,
          userEmail: email,
          walletId: primaryWalletId,
          type,
          direction: isDebit ? "debit" : "credit",
          status,
          assetSymbol: symbol,
          assetKind,
          amount,
          fee,
          netAmount,
          createdAt,
          completedAt: status === "completed" ? createdAt : null,
        });
      }
    }
  }

  // Sort transactions newest-first, keep top 100
  allTxns.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const transactions = allTxns.slice(0, 100);

  return { wallets, virtualAccounts, depositAddresses, payoutAccounts, addressBook, transactions };
}

const _built = buildData();
const _wallets = [..._built.wallets];
const _virtualAccounts = [..._built.virtualAccounts];
const _depositAddresses = [..._built.depositAddresses];
const _payoutAccounts = [..._built.payoutAccounts];
const _addressBook = [..._built.addressBook];
const _transactions = [..._built.transactions];

// ─── Public API ───────────────────────────────────────────────────────────────

export function getWallets(): PlatformWallet[] { return [..._wallets]; }
export function getVirtualAccounts(): VirtualAccount[] { return [..._virtualAccounts]; }
export function getDepositAddresses(): DepositAddress[] { return [..._depositAddresses]; }
export function getPayoutAccounts(): PayoutAccount[] { return [..._payoutAccounts]; }
export function getAddressBook(): AddressBookEntry[] { return [..._addressBook]; }
export function getTransactions(): PlatformTransaction[] { return [..._transactions]; }

export function getWalletsSummary(
  wallets: PlatformWallet[],
  vas: VirtualAccount[],
  das: DepositAddress[],
  pas: PayoutAccount[],
  ab: AddressBookEntry[],
): WalletsSummary {
  return {
    totalWallets: wallets.length,
    activeWallets: wallets.filter(w => w.isActive).length,
    totalVirtualAccounts: vas.length,
    activeVirtualAccounts: vas.filter(v => v.isActive).length,
    totalDepositAddresses: das.length,
    activeDepositAddresses: das.filter(d => d.isActive).length,
    totalPayoutAccounts: pas.length,
    verifiedPayoutAccounts: pas.filter(p => p.isVerified).length,
    totalAddressBookEntries: ab.length,
    whitelistedAddressEntries: ab.filter(e => e.whitelistedAt !== null).length,
  };
}
