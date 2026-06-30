/**
 * Current-admin profile data layer.
 * Mirrors auth.users + kyc.profiles + kyc.verifications + stats.user_stats +
 * security.events. Mock-backed; swap for a query keyed by the session user id.
 */
import type { KycTier, UserStatus } from "@/lib/data/users";

export type VerificationStatus =
  | "verified"
  | "in_review"
  | "pending"
  | "unsubmitted"
  | "rejected";

export interface Verification {
  label: string;
  status: VerificationStatus;
}

export type ActivityKind = "login" | "password" | "device" | "kyc" | "pin";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  summary: string;
  at: string;
}

export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  country: string;
  occupation: string;
  referralCode: string;
  status: UserStatus;
  kycTier: KycTier;
  joinedAt: string;
  lastLoginAt: string;
  stats: {
    portfolioNgn: number;
    totalDepositsNgn: number;
    totalWithdrawalsNgn: number;
    txnCount: number;
  };
  verifications: Verification[];
  activity: ActivityEvent[];
}

function hoursAgoISO(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function getCurrentProfile(): AdminProfile {
  return {
    name: "Adebayo Okonkwo",
    email: "admin@greengate.io",
    phone: "+234 803 555 0142",
    country: "Nigeria",
    occupation: "Operations Lead",
    referralCode: "GGADEB42",
    status: "active",
    kycTier: 3,
    joinedAt: daysAgoISO(412),
    lastLoginAt: hoursAgoISO(3),
    stats: {
      portfolioNgn: 8_420_500,
      totalDepositsNgn: 24_750_000,
      totalWithdrawalsNgn: 16_120_000,
      txnCount: 318,
    },
    verifications: [
      { label: "BVN", status: "verified" },
      { label: "NIN", status: "verified" },
      { label: "Proof of Address", status: "verified" },
      { label: "CAC (Business)", status: "in_review" },
    ],
    activity: [
      { id: "e1", kind: "login", summary: "Signed in from Lagos, NG", at: hoursAgoISO(3) },
      { id: "e2", kind: "device", summary: "New device approved · iPhone 15", at: hoursAgoISO(28) },
      { id: "e3", kind: "kyc", summary: "KYC upgraded to Tier 3", at: daysAgoISO(6) },
      { id: "e4", kind: "password", summary: "Password changed", at: daysAgoISO(19) },
      { id: "e5", kind: "pin", summary: "Transaction PIN updated", at: daysAgoISO(34) },
    ],
  };
}
