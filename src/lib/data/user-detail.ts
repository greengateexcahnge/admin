/**
 * User detail data layer.
 * Aggregates auth.users + kyc.profiles + stats.user_stats + wallet.wallets +
 * ledger.accounts + txn.transactions + kyc.verifications + security.*
 * (Database.md §5–11). Mock-backed; replace getUserDetail() with a real
 * admin API call that joins these tables.
 */

import { getUsers, type AdminUser, type KycTier } from "./users";

// ─── Types ──────────────────────────────────────────────────────────────────

export type TxnType =
  | "fiat_deposit"
  | "fiat_withdrawal"
  | "crypto_deposit"
  | "crypto_withdrawal"
  | "internal_transfer"
  | "swap"
  | "fx_conversion"
  | "fee"
  | "reversal"
  | "adjustment";

export type TxnStatus =
  | "initiated"
  | "pending"
  | "processing"
  | "requires_action"
  | "completed"
  | "failed"
  | "reversed"
  | "cancelled";

export type TxnDirection = "credit" | "debit";

export type DocKind =
  | "bvn"
  | "nin"
  | "proof_of_address"
  | "cac"
  | "id_card"
  | "selfie"
  | "passport"
  | "utility_bill";

export type VerificationStatus =
  | "unsubmitted"
  | "pending"
  | "in_review"
  | "verified"
  | "rejected"
  | "expired";

export type RestrictionKind = "pnd" | "pnc" | "full_freeze";

export type SecurityEventKind =
  | "password_change"
  | "pin_change"
  | "pin_set"
  | "email_verified"
  | "phone_verified"
  | "device_added"
  | "device_revoked"
  | "login_success"
  | "login_failed"
  | "logout"
  | "reset_password"
  | "kyc_upgraded"
  | "account_locked"
  | "account_unlocked"
  | "restriction_added"
  | "restriction_lifted";

export type DeviceStatus = "active" | "revoked" | "pending_approval";
export type SessionStatus = "active" | "expired" | "revoked" | "logged_out";

export interface WalletBalance {
  assetSymbol: string;
  assetName: string;
  kind: "crypto" | "fiat";
  decimals: number;
  balance: number;
  lockedBalance: number;
}

export interface UserWallet {
  id: string;
  label: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  balances: WalletBalance[];
}

export interface UserTransaction {
  id: string;
  reference: string;
  type: TxnType;
  direction: TxnDirection;
  status: TxnStatus;
  assetSymbol: string;
  assetKind: "crypto" | "fiat";
  amount: number;
  fee: number;
  netAmount: number;
  description: string | null;
  createdAt: string;
  completedAt: string | null;
  failureReason: string | null;
}

export interface KycVerification {
  id: string;
  kind: DocKind;
  status: VerificationStatus;
  provider: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectedReason: string | null;
}

export interface TierLimits {
  tier: string;
  dailyFiatLimit: number;
  singleTxnLimit: number;
  cryptoEnabled: boolean;
  fxEnabled: boolean;
  requiresDocs: DocKind[];
}

export interface SecurityRestriction {
  id: string;
  kind: RestrictionKind;
  reason: string;
  walletId: string | null;
  expiresAt: string | null;
  createdAt: string;
  liftedAt: string | null;
}

export interface AccountLock {
  id: string;
  reason: string;
  lockedUntil: string | null;
  createdAt: string;
  liftedAt: string | null;
}

export interface UserDevice {
  id: string;
  platform: string | null;
  model: string | null;
  status: DeviceStatus;
  lastSeenAt: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface UserSession {
  id: string;
  ip: string | null;
  userAgent: string | null;
  status: SessionStatus;
  expiresAt: string;
  createdAt: string;
}

export interface SecurityEvent {
  id: string;
  kind: SecurityEventKind;
  summary: string | null;
  ip: string | null;
  createdAt: string;
}

export interface UserDetail extends AdminUser {
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  pinSetAt: string | null;
  referralCode: string | null;
  referredBy: string | null;

  profile: {
    firstName: string | null;
    lastName: string | null;
    middleName: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    occupation: string | null;
    updatedAt: string;
  };

  stats: {
    totalDepositsNgn: number;
    totalWithdrawalsNgn: number;
    totalSwapsCount: number;
    totalTxnCount: number;
    estimatedPortfolioNgn: number;
    lastTxnAt: string | null;
  };

  wallets: UserWallet[];
  transactions: UserTransaction[];

  kyc: {
    verifications: KycVerification[];
    tierLimits: TierLimits;
    nextTierLimits: TierLimits | null;
  };

  security: {
    restrictions: SecurityRestriction[];
    lock: AccountLock | null;
    devices: UserDevice[];
    sessions: UserSession[];
    events: SecurityEvent[];
  };
}

// ─── Deterministic PRNG ─────────────────────────────────────────────────────

function mulberry(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoAgo(daysAgo: number, rand: () => number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(rand() * 24));
  d.setMinutes(Math.floor(rand() * 60));
  return d.toISOString();
}

// ─── Tier limits reference data ─────────────────────────────────────────────

const TIER_LIMITS: Record<KycTier, TierLimits> = {
  0: { tier: "tier0", dailyFiatLimit: 0, singleTxnLimit: 0, cryptoEnabled: false, fxEnabled: false, requiresDocs: [] },
  1: { tier: "tier1", dailyFiatLimit: 50_000, singleTxnLimit: 20_000, cryptoEnabled: false, fxEnabled: false, requiresDocs: ["bvn", "nin"] },
  2: { tier: "tier2", dailyFiatLimit: 1_000_000, singleTxnLimit: 500_000, cryptoEnabled: true, fxEnabled: true, requiresDocs: ["bvn", "nin", "proof_of_address"] },
  3: { tier: "tier3", dailyFiatLimit: 100_000_000, singleTxnLimit: 50_000_000, cryptoEnabled: true, fxEnabled: true, requiresDocs: ["bvn", "nin", "proof_of_address", "cac"] },
};

function nextTierLimits(tier: KycTier): TierLimits | null {
  const next = (tier + 1) as KycTier;
  return next <= 3 ? TIER_LIMITS[next] : null;
}

// ─── Mock generator ─────────────────────────────────────────────────────────

const PLATFORMS = ["ios", "android", "web"];
const MODELS = ["iPhone 15 Pro", "Samsung Galaxy S24", "Pixel 8", "iPhone 14", "Redmi Note 13"];
const IPS = ["197.210.54.33", "102.88.63.142", "41.206.25.111", "105.112.77.9", "197.255.4.21"];
const USER_AGENTS = [
  "GreengateMobile/2.4.1 (iOS 17.3; iPhone15,3)",
  "GreengateMobile/2.4.1 (Android 14; SM-S928B)",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3) AppleWebKit/605.1.15",
  "GreengateMobile/2.3.9 (Android 14; GP4BC)",
];
const PROVIDERS = ["dojah", "smileid", "youverify"];
const OCCUPATIONS = [
  "Software Engineer", "Business Owner", "Teacher", "Accountant",
  "Medical Doctor", "Civil Servant", "Trader", "Freelancer",
];
const STATES = ["Lagos", "Abuja", "Rivers", "Kano", "Oyo", "Delta", "Enugu"];
const CITIES = ["Lagos Island", "Ikeja", "Lekki", "Garki", "Wuse", "Port Harcourt", "Ibadan"];
const OCCUPATIONS_MAP: Record<number, string> = { 0: "Software Engineer", 1: "Business Owner", 2: "Teacher", 3: "Accountant", 4: "Medical Doctor", 5: "Trader", 6: "Freelancer", 7: "Civil Servant" };

const TXN_TYPES: TxnType[] = [
  "fiat_deposit", "fiat_withdrawal", "crypto_deposit",
  "crypto_withdrawal", "swap", "fx_conversion", "internal_transfer",
];

const TXN_STATUSES: TxnStatus[] = ["completed", "completed", "completed", "completed", "pending", "failed"];

function generateTransactions(rand: () => number, count: number, tier: KycTier): UserTransaction[] {
  const cryptoEnabled = tier >= 2;
  const fiatTypes: TxnType[] = ["fiat_deposit", "fiat_withdrawal", "internal_transfer"];
  const cryptoTypes: TxnType[] = ["crypto_deposit", "crypto_withdrawal", "swap", "fx_conversion"];
  const types = cryptoEnabled ? TXN_TYPES : fiatTypes;

  return Array.from({ length: count }).map((_, i) => {
    const type = types[Math.floor(rand() * types.length)]!;
    const status = TXN_STATUSES[Math.floor(rand() * TXN_STATUSES.length)]!;
    const isCrypto = ["crypto_deposit", "crypto_withdrawal", "swap"].includes(type);
    const assetSymbol = isCrypto
      ? (rand() > 0.6 ? "BTC" : rand() > 0.4 ? "ETH" : "USDT")
      : "NGN";
    const assetKind: "crypto" | "fiat" = isCrypto ? "crypto" : "fiat";
    const amount = isCrypto
      ? assetSymbol === "BTC"
        ? parseFloat((rand() * 0.02 + 0.001).toFixed(8))
        : assetSymbol === "ETH"
          ? parseFloat((rand() * 0.5 + 0.01).toFixed(6))
          : parseFloat((rand() * 500 + 20).toFixed(2))
      : Math.round(rand() * 180_000 + 5_000);
    const fee = isCrypto ? parseFloat((amount * 0.001).toFixed(assetSymbol === "BTC" ? 8 : 6)) : Math.round(amount * 0.015);
    const netAmount = type.includes("withdrawal") || type === "swap" ? amount - fee : amount + fee;
    const daysAgo = i * 3 + Math.floor(rand() * 2);
    const createdAt = isoAgo(daysAgo, rand);

    return {
      id: `txn-${i}-${Math.floor(rand() * 9999)}`,
      reference: `GG-${["A", "B", "C", "D", "E", "F"][Math.floor(rand() * 6)]!}${Math.floor(rand() * 9000 + 1000)}`,
      type,
      direction: ["fiat_deposit", "crypto_deposit", "internal_transfer"].includes(type) ? "credit" : "debit",
      status,
      assetSymbol,
      assetKind,
      amount,
      fee,
      netAmount,
      description: null,
      createdAt,
      completedAt: status === "completed" ? isoAgo(daysAgo, rand) : null,
      failureReason: status === "failed" ? "Insufficient balance" : null,
    };
  });
}

function generateKycVerifications(rand: () => number, tier: KycTier): KycVerification[] {
  const kinds: DocKind[] = ["bvn", "nin", "proof_of_address", "cac"];
  const needed = tier === 0 ? 0 : tier === 1 ? 2 : tier === 2 ? 3 : 4;

  return kinds.map((kind, i) => {
    if (i >= needed && rand() > 0.3) {
      return { id: `kyc-${i}`, kind, status: "unsubmitted", provider: null, submittedAt: null, reviewedAt: null, rejectedReason: null };
    }
    const status: VerificationStatus = i < needed ? "verified" : rand() > 0.5 ? "pending" : "unsubmitted";
    const provider = PROVIDERS[Math.floor(rand() * PROVIDERS.length)]!;
    const submittedDays = 90 - i * 20 + Math.floor(rand() * 10);
    return {
      id: `kyc-${i}`,
      kind,
      status,
      provider: status !== "unsubmitted" ? provider : null,
      submittedAt: status !== "unsubmitted" ? isoAgo(submittedDays, rand) : null,
      reviewedAt: status === "verified" ? isoAgo(submittedDays - 2, rand) : null,
      rejectedReason: null,
    };
  });
}

function generateSecurityEvents(rand: () => number, count: number): SecurityEvent[] {
  const eventKinds: SecurityEventKind[] = [
    "login_success", "login_success", "login_success",
    "password_change", "pin_set", "email_verified", "phone_verified",
    "device_added", "kyc_upgraded", "logout",
  ];
  const summaries: Record<SecurityEventKind, string> = {
    login_success: "Successful login",
    login_failed: "Failed login attempt",
    password_change: "Password changed",
    pin_set: "Transaction PIN set",
    pin_change: "Transaction PIN changed",
    email_verified: "Email address verified",
    phone_verified: "Phone number verified",
    device_added: "New device registered",
    device_revoked: "Device revoked",
    kyc_upgraded: "KYC tier upgraded",
    account_locked: "Account locked",
    account_unlocked: "Account unlocked",
    restriction_added: "Restriction placed",
    restriction_lifted: "Restriction lifted",
    logout: "Signed out",
    reset_password: "Password reset via email",
  };

  return Array.from({ length: count }).map((_, i) => {
    const kind = eventKinds[Math.floor(rand() * eventKinds.length)]!;
    return {
      id: `se-${i}`,
      kind,
      summary: summaries[kind] ?? kind,
      ip: rand() > 0.3 ? IPS[Math.floor(rand() * IPS.length)]! : null,
      createdAt: isoAgo(i * 4 + Math.floor(rand() * 3), rand),
    };
  });
}

export function getUserDetail(id: string): UserDetail | null {
  const users = getUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return null;

  const idx = parseInt(user.id.replace("GG-U", ""), 10) - 1042;
  const rand = mulberry(idx * 31 + 7);

  const tier = user.kycTier;
  const firstName = user.name.split(" ")[0]!;
  const lastName = user.name.split(" ")[1]!;
  const nowIso = new Date().toISOString();
  const joinedAgo = Math.floor(
    (Date.now() - new Date(user.joinedAt).getTime()) / 86_400_000,
  );

  // wallet balances (realistic amounts based on portfolio)
  const ngnBalance = Math.round(user.portfolioNgn * 0.4);
  const usdtBalance = parseFloat((user.portfolioNgn * 0.0003 * (0.5 + rand() * 0.5)).toFixed(2));
  const btcBalance = tier >= 2 ? parseFloat((user.portfolioNgn * 0.000000015 * (0.5 + rand())).toFixed(8)) : 0;
  const ethBalance = tier >= 2 ? parseFloat((user.portfolioNgn * 0.0000002 * rand()).toFixed(6)) : 0;

  const primaryWalletId = `wlt-${idx}-primary`;

  const wallets: UserWallet[] = [
    {
      id: primaryWalletId,
      label: "Main",
      isPrimary: true,
      isActive: user.status === "active" || user.status === "pending",
      createdAt: user.joinedAt,
      balances: ([
        { assetSymbol: "NGN", assetName: "Nigerian Naira", kind: "fiat" as const, decimals: 2, balance: ngnBalance, lockedBalance: Math.round(ngnBalance * 0.05 * rand()) },
        { assetSymbol: "USD", assetName: "US Dollar", kind: "fiat" as const, decimals: 2, balance: Math.round(rand() * 200), lockedBalance: 0 },
        { assetSymbol: "USDT", assetName: "Tether", kind: "crypto" as const, decimals: 6, balance: usdtBalance, lockedBalance: 0 },
        ...(tier >= 2 ? [
          { assetSymbol: "BTC", assetName: "Bitcoin", kind: "crypto" as const, decimals: 8, balance: btcBalance, lockedBalance: 0 },
          { assetSymbol: "ETH", assetName: "Ethereum", kind: "crypto" as const, decimals: 6, balance: ethBalance, lockedBalance: 0 },
        ] : []),
      ] as WalletBalance[]).filter(b => b.balance > 0 || b.lockedBalance > 0),
    },
    ...(tier >= 2 && rand() > 0.5
      ? [{
        id: `wlt-${idx}-savings`,
        label: "Savings",
        isPrimary: false,
        isActive: true,
        createdAt: isoAgo(joinedAgo - 30, rand),
        balances: [
          { assetSymbol: "USDT", assetName: "Tether", kind: "crypto" as const, decimals: 6, balance: parseFloat((rand() * 300 + 50).toFixed(2)), lockedBalance: 0 },
        ],
      }]
      : []),
  ];

  const txnCount = Math.max(5, Math.min(20, user.txnCount > 0 ? 20 : 0));
  const transactions = generateTransactions(rand, txnCount, tier);

  const platform = PLATFORMS[Math.floor(rand() * PLATFORMS.length)]!;
  const model = MODELS[Math.floor(rand() * MODELS.length)]!;
  const deviceIp = IPS[Math.floor(rand() * IPS.length)]!;
  const ua = USER_AGENTS[Math.floor(rand() * USER_AGENTS.length)]!;

  return {
    ...user,
    emailVerifiedAt: user.status !== "pending" ? isoAgo(joinedAgo - 1, rand) : null,
    phoneVerifiedAt: user.status !== "pending" && tier >= 1 ? isoAgo(joinedAgo - 1, rand) : null,
    pinSetAt: user.status === "active" ? isoAgo(joinedAgo - 1, rand) : null,
    referralCode: `GG${user.name.slice(0, 2).toUpperCase()}${String(1000 + idx).slice(-4)}`,
    referredBy: rand() > 0.7 ? `GG-U${String(1042 + Math.floor(rand() * 5)).padStart(5, "0")}` : null,

    profile: {
      firstName,
      lastName,
      middleName: rand() > 0.5 ? ["Chukwu", "Oluwaseun", "Abdullahi", "Emeka"][Math.floor(rand() * 4)]! : null,
      dateOfBirth: `${1975 + Math.floor(rand() * 25)}-${String(1 + Math.floor(rand() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rand() * 28)).padStart(2, "0")}`,
      gender: rand() > 0.5 ? "male" : "female",
      addressLine1: `${Math.floor(rand() * 99 + 1)} ${["Allen Avenue", "Victoria Island", "Adeola Odeku", "Broad Street"][Math.floor(rand() * 4)]!}`,
      addressLine2: rand() > 0.6 ? `Flat ${Math.floor(rand() * 10 + 1)}` : null,
      city: CITIES[Math.floor(rand() * CITIES.length)]!,
      state: STATES[Math.floor(rand() * STATES.length)]!,
      postalCode: String(100001 + Math.floor(rand() * 99999)),
      occupation: OCCUPATIONS[Math.floor(rand() * OCCUPATIONS.length)]!,
      updatedAt: isoAgo(14, rand),
    },

    stats: {
      totalDepositsNgn: Math.round(user.portfolioNgn * (1.2 + rand() * 0.5)),
      totalWithdrawalsNgn: Math.round(user.portfolioNgn * (0.5 + rand() * 0.3)),
      totalSwapsCount: tier >= 2 ? Math.floor(rand() * 40 + 5) : 0,
      totalTxnCount: user.txnCount,
      estimatedPortfolioNgn: user.portfolioNgn,
      lastTxnAt: user.txnCount > 0 ? user.lastActiveAt : null,
    },

    wallets,
    transactions,

    kyc: {
      verifications: generateKycVerifications(rand, tier),
      tierLimits: TIER_LIMITS[tier],
      nextTierLimits: nextTierLimits(tier),
    },

    security: {
      restrictions: user.status === "suspended"
        ? [{
          id: "rst-1",
          kind: "pnd" as RestrictionKind,
          reason: "Suspicious outbound transaction pattern",
          walletId: null,
          expiresAt: null,
          createdAt: isoAgo(3, rand),
          liftedAt: null,
        }]
        : [],
      lock: user.status === "locked"
        ? {
          id: "lck-1",
          reason: "too_many_pin",
          lockedUntil: isoAgo(-60, rand),
          createdAt: isoAgo(1, rand),
          liftedAt: null,
        }
        : null,
      devices: [
        {
          id: `dev-${idx}`,
          platform,
          model: platform === "web" ? null : model,
          status: "active",
          lastSeenAt: user.lastActiveAt,
          approvedAt: isoAgo(joinedAgo - 1, rand),
          createdAt: user.joinedAt,
        },
        ...(rand() > 0.6
          ? [{
            id: `dev-${idx}-old`,
            platform: PLATFORMS[Math.floor(rand() * PLATFORMS.length)]!,
            model: MODELS[Math.floor(rand() * MODELS.length)]!,
            status: "revoked" as DeviceStatus,
            lastSeenAt: isoAgo(60, rand),
            approvedAt: isoAgo(90, rand),
            createdAt: isoAgo(91, rand),
          }]
          : []),
      ],
      sessions: [
        {
          id: `ses-${idx}-1`,
          ip: deviceIp,
          userAgent: ua,
          status: "active",
          expiresAt: isoAgo(-1, rand),
          createdAt: user.lastActiveAt,
        },
        {
          id: `ses-${idx}-2`,
          ip: IPS[Math.floor(rand() * IPS.length)]!,
          userAgent: USER_AGENTS[Math.floor(rand() * USER_AGENTS.length)]!,
          status: "logged_out",
          expiresAt: isoAgo(7, rand),
          createdAt: isoAgo(8, rand),
        },
      ],
      events: generateSecurityEvents(rand, 10),
    },
  };
}
