export type RestrictionKind = "pnd" | "pnc" | "full_freeze";

export const RESTRICTION_KIND_LABELS: Record<RestrictionKind, string> = {
  pnd: "PND",
  pnc: "PNC",
  full_freeze: "Full Freeze",
};

export const RESTRICTION_KIND_DESC: Record<RestrictionKind, string> = {
  pnd: "Post No Debit — blocks all outgoing transfers",
  pnc: "Post No Credit — blocks all incoming transfers",
  full_freeze: "Full account freeze — blocks all transactions",
};

export const RESTRICTION_KINDS: RestrictionKind[] = ["pnd", "pnc", "full_freeze"];

export interface AccountLock {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  reason: string;
  lockedUntil: string | null;
  lockedBy: string | null;
  createdAt: string;
  liftedAt: string | null;
  liftedBy: string | null;
}

export interface SecurityRestriction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  walletId: string | null;
  kind: RestrictionKind;
  reason: string;
  placedBy: string | null;
  expiresAt: string | null;
  createdAt: string;
  liftedAt: string | null;
  liftedBy: string | null;
}

export interface SecuritySummary {
  totalLocks: number;
  activeLocks: number;
  liftedLocks: number;
  totalRestrictions: number;
  activeRestrictions: number;
  liftedRestrictions: number;
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysHenceISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const LOCK_SEED: AccountLock[] = [
  {
    id: "lock-001",
    userId: "GG-U01051",
    userName: "Chinedu Umeh",
    userEmail: "chinedu.umeh@gmail.com",
    reason: "Exceeded maximum failed login attempts (5 consecutive failures)",
    lockedUntil: null,
    lockedBy: null,
    createdAt: daysAgoISO(2),
    liftedAt: null,
    liftedBy: null,
  },
  {
    id: "lock-002",
    userId: "GG-U01048",
    userName: "Yemi Adeyemi",
    userEmail: "yemi.adeyemi@gmail.com",
    reason: "Manual lock placed pending compliance review of large transfer",
    lockedUntil: daysHenceISO(7),
    lockedBy: "Compliance Team",
    createdAt: daysAgoISO(5),
    liftedAt: null,
    liftedBy: null,
  },
  {
    id: "lock-003",
    userId: "GG-U01049",
    userName: "Bola Ahmed",
    userEmail: "bola.ahmed@gmail.com",
    reason: "Failed PIN attempts — account temporarily locked",
    lockedUntil: daysAgoISO(1),
    lockedBy: null,
    createdAt: daysAgoISO(4),
    liftedAt: daysAgoISO(1),
    liftedBy: "System (auto-lift)",
  },
  {
    id: "lock-004",
    userId: "GG-U01053",
    userName: "Musa Ibrahim",
    userEmail: "musa.ibrahim@gmail.com",
    reason: "Suspicious login from unrecognised device and location",
    lockedUntil: null,
    lockedBy: "fraud-detection",
    createdAt: daysAgoISO(14),
    liftedAt: daysAgoISO(12),
    liftedBy: "Emeka Obi (Admin)",
  },
];

const RESTRICTION_SEED: SecurityRestriction[] = [
  {
    id: "restr-001",
    userId: "GG-U01042",
    userName: "Adaeze Okafor",
    userEmail: "adaeze.okafor@gmail.com",
    walletId: null,
    kind: "pnd",
    reason: "Suspicious outbound transfer pattern flagged by AML screening",
    placedBy: "Compliance Team",
    expiresAt: daysHenceISO(14),
    createdAt: daysAgoISO(3),
    liftedAt: null,
    liftedBy: null,
  },
  {
    id: "restr-002",
    userId: "GG-U01044",
    userName: "Chiamaka Eze",
    userEmail: "chiamaka.eze@gmail.com",
    walletId: null,
    kind: "pnc",
    reason: "NFIU directive — pending source-of-funds documentation submission",
    placedBy: "Compliance Team",
    expiresAt: null,
    createdAt: daysAgoISO(8),
    liftedAt: null,
    liftedBy: null,
  },
  {
    id: "restr-003",
    userId: "GG-U01047",
    userName: "Ifeanyi Okeke",
    userEmail: "ifeanyi.okeke@gmail.com",
    walletId: null,
    kind: "full_freeze",
    reason: "Active fraud investigation — account frozen pending EFCC liaison",
    placedBy: "Risk & Fraud Team",
    expiresAt: null,
    createdAt: daysAgoISO(1),
    liftedAt: null,
    liftedBy: null,
  },
  {
    id: "restr-004",
    userId: "GG-U01045",
    userName: "Tunde Bakare",
    userEmail: "tunde.bakare@gmail.com",
    walletId: null,
    kind: "pnd",
    reason: "Temporary debit hold during KYC tier upgrade processing",
    placedBy: "KYC Team",
    expiresAt: daysAgoISO(2),
    createdAt: daysAgoISO(10),
    liftedAt: daysAgoISO(2),
    liftedBy: "System (expired)",
  },
  {
    id: "restr-005",
    userId: "GG-U01046",
    userName: "Ngozi Obi",
    userEmail: "ngozi.obi@gmail.com",
    walletId: null,
    kind: "pnc",
    reason: "Erroneous credit hold placed in error — resolved after internal review",
    placedBy: "Finance",
    expiresAt: null,
    createdAt: daysAgoISO(20),
    liftedAt: daysAgoISO(18),
    liftedBy: "Emeka Obi (Admin)",
  },
];

const _locks = [...LOCK_SEED];
const _restrictions = [...RESTRICTION_SEED];

export function getAccountLocks(): AccountLock[] {
  return [..._locks];
}

export function getRestrictions(): SecurityRestriction[] {
  return [..._restrictions];
}

export function getSecuritySummary(
  locks: AccountLock[],
  restrictions: SecurityRestriction[],
): SecuritySummary {
  const activeLocks = locks.filter(l => !l.liftedAt).length;
  const activeRestrictions = restrictions.filter(r => !r.liftedAt).length;
  return {
    totalLocks: locks.length,
    activeLocks,
    liftedLocks: locks.length - activeLocks,
    totalRestrictions: restrictions.length,
    activeRestrictions,
    liftedRestrictions: restrictions.length - activeRestrictions,
  };
}

export function nextLockId(): string {
  return `lock-${String(_locks.length + 1).padStart(3, "0")}`;
}

export function nextRestrictionId(): string {
  return `restr-${String(_restrictions.length + 1).padStart(3, "0")}`;
}
