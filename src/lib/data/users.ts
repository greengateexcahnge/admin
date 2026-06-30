/**
 * Users data layer.
 * Mirrors auth.users + kyc.profiles + stats.user_stats. Mock-backed for now;
 * replace getUsers() with a paginated query joining those tables.
 */

export type UserStatus = "active" | "pending" | "suspended" | "locked" | "closed";
export type KycTier = 0 | 1 | 2 | 3;

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  kycTier: KycTier;
  portfolioNgn: number;
  txnCount: number;
  country: string;
  joinedAt: string;
  lastActiveAt: string;
}

const NAMES = [
  "Adaeze Okafor",
  "Emeka Nwosu",
  "Chiamaka Eze",
  "Tunde Bakare",
  "Ngozi Obi",
  "Ifeanyi Okeke",
  "Yemi Adeyemi",
  "Bola Ahmed",
  "Zainab Bello",
  "Chinedu Umeh",
  "Funke Akin",
  "Musa Ibrahim",
  "Halima Sani",
  "Obinna Ude",
  "Kemi Balogun",
  "Segun Oladipo",
  "Amara Nnamdi",
  "Damilola Cole",
  "Fatima Yusuf",
  "Uche Anozie",
  "Tobi Williams",
  "Aisha Mohammed",
  "Gbenga Sotomi",
  "Rita Effiong",
];

const TIERS: KycTier[] = [2, 1, 3, 0, 2, 1, 2, 3, 0, 1, 2, 1];

/** Deterministic 0..1 from an integer. */
function frac(n: number) {
  const x = Math.sin(n + 1) * 10000;
  return x - Math.floor(x);
}

function statusFor(i: number): UserStatus {
  if (i % 11 === 6) return "suspended";
  if (i % 13 === 9) return "locked";
  if (i % 17 === 15) return "closed";
  if (i % 5 === 4) return "pending";
  return "active";
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function getUsers(): AdminUser[] {
  return NAMES.map((name, i) => {
    const [first, last] = name.toLowerCase().split(" ");
    const status = statusFor(i);
    const kycTier = TIERS[i % TIERS.length] ?? 0;
    return {
      id: `GG-U${String(1042 + i).padStart(5, "0")}`,
      name,
      email: `${first}.${last}@gmail.com`,
      phone: `+234 80${(i % 9) + 1} ${String(100 + i).padStart(3, "0")} ${String(1000 + i * 7).slice(-4)}`,
      status,
      kycTier,
      portfolioNgn:
        status === "pending" ? Math.round(frac(i) * 80_000) : Math.round(frac(i) * 12_400_000) + 24_000,
      txnCount: Math.round(frac(i * 3) * 420) + 2,
      country: i % 9 === 4 ? "Ghana" : i % 13 === 7 ? "Kenya" : "Nigeria",
      joinedAt: daysAgoISO(i * 23 + 6),
      lastActiveAt: daysAgoISO(Math.round(frac(i * 7) * 26)),
    };
  });
}

export interface UserSummary {
  total: number;
  active: number;
  pending: number;
  restricted: number;
}

export function getUserSummary(users: AdminUser[]): UserSummary {
  return {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    pending: users.filter((u) => u.status === "pending").length,
    restricted: users.filter(
      (u) => u.status === "suspended" || u.status === "locked",
    ).length,
  };
}
