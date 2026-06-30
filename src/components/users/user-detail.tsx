"use client";

import * as React from "react";
import Link from "next/link";
import { cn, formatDate, formatNaira, formatNumber } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Icons, type Icon } from "@/components/icons";
import type {
  UserDetail,
  TxnType,
  TxnStatus,
  TxnDirection,
  DocKind,
  VerificationStatus,
  SecurityEventKind,
  RestrictionKind,
} from "@/lib/data/user-detail";
import type { UserStatus, KycTier } from "@/lib/data/users";

// ─── Shared helpers ──────────────────────────────────────────────────────────

const statusTone: Record<UserStatus, BadgeTone> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
  locked: "danger",
  closed: "neutral",
};

const txnStatusTone: Record<TxnStatus, BadgeTone> = {
  completed: "success",
  pending: "warning",
  processing: "info",
  requires_action: "warning",
  initiated: "neutral",
  failed: "danger",
  reversed: "danger",
  cancelled: "neutral",
};

const verifTone: Record<VerificationStatus, BadgeTone> = {
  verified: "success",
  pending: "warning",
  in_review: "info",
  unsubmitted: "neutral",
  rejected: "danger",
  expired: "danger",
};

const kindLabel: Record<DocKind, string> = {
  bvn: "BVN",
  nin: "NIN",
  proof_of_address: "Proof of Address",
  cac: "CAC",
  id_card: "ID Card",
  selfie: "Selfie",
  passport: "Passport",
  utility_bill: "Utility Bill",
};

const txnTypeLabel: Record<TxnType, string> = {
  fiat_deposit: "Fiat Deposit",
  fiat_withdrawal: "Fiat Withdrawal",
  crypto_deposit: "Crypto Deposit",
  crypto_withdrawal: "Crypto Withdrawal",
  internal_transfer: "Transfer",
  swap: "Swap",
  fx_conversion: "FX Convert",
  fee: "Fee",
  reversal: "Reversal",
  adjustment: "Adjustment",
};

const restrictionLabel: Record<RestrictionKind, string> = {
  pnd: "Post No Debit",
  pnc: "Post No Credit",
  full_freeze: "Full Freeze",
};

const securityEventLabel: Record<SecurityEventKind, { label: string; icon: Icon }> = {
  login_success: { label: "Login", icon: Icons.login },
  login_failed: { label: "Failed Login", icon: Icons.alertTriangle },
  password_change: { label: "Password Changed", icon: Icons.key },
  pin_set: { label: "PIN Set", icon: Icons.lock },
  pin_change: { label: "PIN Changed", icon: Icons.lock },
  email_verified: { label: "Email Verified", icon: Icons.badgeCheck },
  phone_verified: { label: "Phone Verified", icon: Icons.phone },
  device_added: { label: "Device Added", icon: Icons.smartphone },
  device_revoked: { label: "Device Revoked", icon: Icons.ban },
  kyc_upgraded: { label: "KYC Upgraded", icon: Icons.shieldCheck },
  account_locked: { label: "Account Locked", icon: Icons.lock },
  account_unlocked: { label: "Account Unlocked", icon: Icons.unlock },
  restriction_added: { label: "Restriction Added", icon: Icons.shield },
  restriction_lifted: { label: "Restriction Lifted", icon: Icons.check },
  logout: { label: "Signed Out", icon: Icons.logout },
  reset_password: { label: "Password Reset", icon: Icons.key },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="shrink-0 text-ink-muted">{label}</span>
      <span className="text-right text-ink">{value ?? <span className="text-ink-subtle">—</span>}</span>
    </div>
  );
}

function SectionCard({ title, icon: LeadingIcon, children, className }: {
  title: string;
  icon?: Icon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-line bg-paper-raised", className)}>
      <div className="flex items-center gap-2 border-b border-line px-5 py-4">
        {LeadingIcon && <LeadingIcon className="size-4 text-ink-muted" />}
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Divider() {
  return <hr className="border-line" />;
}

// ─── Tab types ───────────────────────────────────────────────────────────────

type Tab = "overview" | "wallets" | "transactions" | "kyc" | "security";

const TABS: { id: Tab; label: string; icon: Icon }[] = [
  { id: "overview", label: "Overview", icon: Icons.user },
  { id: "wallets", label: "Wallets", icon: Icons.wallet },
  { id: "transactions", label: "Transactions", icon: Icons.receipt },
  { id: "kyc", label: "KYC", icon: Icons.shieldCheck },
  { id: "security", label: "Security", icon: Icons.shield },
];

// ─── Overview section ────────────────────────────────────────────────────────

function OverviewSection({ user }: { user: UserDetail }) {
  const { profile, stats } = user;
  const fullName = [profile.firstName, profile.middleName, profile.lastName]
    .filter(Boolean)
    .join(" ") || "—";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Identity */}
      <SectionCard title="Identity" icon={Icons.user}>
        <div className="divide-y divide-line">
          <InfoRow label="Status" value={<Badge tone={statusTone[user.status]} dot>{user.status}</Badge>} />
          <InfoRow label="KYC tier" value={<Badge tone={user.kycTier >= 2 ? "info" : "neutral"}>Tier {user.kycTier}</Badge>} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Phone" value={user.phone ?? "—"} />
          <InfoRow label="Email verified" value={user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : <Badge tone="warning">Unverified</Badge>} />
          <InfoRow label="Phone verified" value={user.phoneVerifiedAt ? formatDate(user.phoneVerifiedAt) : <Badge tone="warning">Unverified</Badge>} />
          <InfoRow label="PIN" value={user.pinSetAt ? <Badge tone="success">Set</Badge> : <Badge tone="neutral">Not set</Badge>} />
          <InfoRow label="Last login" value={user.lastActiveAt ? formatDate(user.lastActiveAt) : "—"} />
          <InfoRow label="Referral code" value={<span className="font-mono text-xs">{user.referralCode}</span>} />
          <InfoRow label="Referred by" value={user.referredBy
            ? <Link href={`/users/${user.referredBy}`} className="font-mono text-xs text-primary hover:underline">{user.referredBy}</Link>
            : null}
          />
          <InfoRow label="Joined" value={formatDate(user.joinedAt)} />
          <InfoRow label="Country" value={user.country} />
        </div>
      </SectionCard>

      {/* Profile */}
      <SectionCard title="KYC Profile" icon={Icons.badgeCheck}>
        <div className="divide-y divide-line">
          <InfoRow label="Full name" value={fullName} />
          <InfoRow label="Date of birth" value={profile.dateOfBirth ? formatDate(profile.dateOfBirth) : null} />
          <InfoRow label="Gender" value={profile.gender ? <span className="capitalize">{profile.gender}</span> : null} />
          <InfoRow label="Occupation" value={profile.occupation} />
          <InfoRow label="Address" value={
            profile.addressLine1
              ? <span className="text-right text-xs leading-relaxed">
                  {profile.addressLine1}{profile.addressLine2 ? `, ${profile.addressLine2}` : ""}
                </span>
              : null
          } />
          <InfoRow label="City" value={profile.city} />
          <InfoRow label="State" value={profile.state} />
          <InfoRow label="Postal code" value={profile.postalCode} />
          <InfoRow label="Profile updated" value={formatDate(profile.updatedAt)} />
        </div>
      </SectionCard>

      {/* Stats */}
      <SectionCard title="Account Stats" icon={Icons.analytics}>
        <div className="divide-y divide-line">
          <InfoRow label="Est. portfolio" value={<span className="font-semibold">{formatNaira(stats.estimatedPortfolioNgn)}</span>} />
          <InfoRow label="Total deposits" value={formatNaira(stats.totalDepositsNgn)} />
          <InfoRow label="Total withdrawals" value={formatNaira(stats.totalWithdrawalsNgn)} />
          <InfoRow label="Total transactions" value={formatNumber(stats.totalTxnCount)} />
          <InfoRow label="Total swaps" value={formatNumber(stats.totalSwapsCount)} />
          <InfoRow label="Last transaction" value={stats.lastTxnAt ? formatDate(stats.lastTxnAt) : null} />
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Wallets section ─────────────────────────────────────────────────────────

function WalletsSection({ user }: { user: UserDetail }) {
  if (user.wallets.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-paper-raised p-10 text-center text-sm text-ink-subtle">
        No wallets found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {user.wallets.map((wallet) => (
        <div key={wallet.id} className="rounded-xl border border-line bg-paper-raised">
          {/* Wallet header */}
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
            <Icons.wallet className="size-4 text-ink-muted" />
            <span className="font-semibold text-ink">{wallet.label}</span>
            {wallet.isPrimary && <Badge tone="info">Primary</Badge>}
            <Badge tone={wallet.isActive ? "success" : "neutral"} dot>
              {wallet.isActive ? "Active" : "Inactive"}
            </Badge>
            <span className="ml-auto font-mono text-xs text-ink-subtle">{wallet.id}</span>
            <span className="text-xs text-ink-subtle">Created {formatDate(wallet.createdAt)}</span>
          </div>

          {/* Balances table */}
          {wallet.balances.length === 0 ? (
            <div className="p-5 text-sm text-ink-subtle">No balances.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
                    <th className="px-5 py-3 font-medium">Asset</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 text-right font-medium">Balance</th>
                    <th className="px-5 py-3 text-right font-medium">Locked</th>
                    <th className="px-5 py-3 text-right font-medium">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {wallet.balances.map((b) => {
                    const available = b.balance - b.lockedBalance;
                    const fmt = (v: number) =>
                      b.kind === "fiat"
                        ? v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : v.toFixed(b.decimals > 6 ? 8 : b.decimals);
                    return (
                      <tr key={b.assetSymbol} className="border-b border-line last:border-0 hover:bg-paper-sunken/60">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-ink">{b.assetSymbol}</span>
                            <span className="text-xs text-ink-muted">{b.assetName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={b.kind === "crypto" ? "info" : "neutral"}>{b.kind}</Badge>
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums font-medium text-ink">
                          {fmt(b.balance)}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-ink-muted">
                          {b.lockedBalance > 0 ? fmt(b.lockedBalance) : "—"}
                        </td>
                        <td className={cn(
                          "px-5 py-3 text-right tabular-nums font-medium",
                          available < 0 ? "text-danger" : "text-success",
                        )}>
                          {fmt(Math.max(0, available))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Transactions section ────────────────────────────────────────────────────

const TXN_PAGE_SIZE = 10;

function TransactionsSection({ user }: { user: UserDetail }) {
  const [typeFilter, setTypeFilter] = React.useState<"all" | TxnType>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | TxnStatus>("all");
  const [dirFilter, setDirFilter] = React.useState<"all" | TxnDirection>("all");
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    return user.transactions.filter((t) => {
      const matchType = typeFilter === "all" || t.type === typeFilter;
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchDir = dirFilter === "all" || t.direction === dirFilter;
      return matchType && matchStatus && matchDir;
    });
  }, [user.transactions, typeFilter, statusFilter, dirFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / TXN_PAGE_SIZE));
  const cur = Math.min(page, totalPages);
  const start = (cur - 1) * TXN_PAGE_SIZE;
  const pageItems = filtered.slice(start, start + TXN_PAGE_SIZE);

  React.useEffect(() => setPage(1), [typeFilter, statusFilter, dirFilter]);

  function fmtAmt(t: (typeof user.transactions)[0]) {
    return t.assetKind === "fiat"
      ? `₦${t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      : `${t.amount} ${t.assetSymbol}`;
  }

  return (
    <div className="rounded-xl border border-line bg-paper-raised">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 border-b border-line p-4">
        <Select
          aria-label="Filter by type"
          className="h-9 w-auto"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "all" | TxnType)}
        >
          <option value="all">All types</option>
          {Object.entries(txnTypeLabel).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Select
          aria-label="Filter by status"
          className="h-9 w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | TxnStatus)}
        >
          <option value="all">All statuses</option>
          {(["completed","pending","processing","failed","reversed","cancelled"] as TxnStatus[]).map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </Select>
        <Select
          aria-label="Filter by direction"
          className="h-9 w-auto"
          value={dirFilter}
          onChange={(e) => setDirFilter(e.target.value as "all" | TxnDirection)}
        >
          <option value="all">All directions</option>
          <option value="credit">Credit (in)</option>
          <option value="debit">Debit (out)</option>
        </Select>
        <span className="ml-auto self-center text-xs text-ink-subtle">
          {total} transaction{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Direction</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-right font-medium">Fee</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((t) => (
              <tr key={t.id} className="border-b border-line last:border-0 hover:bg-paper-sunken/60">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-ink">{t.reference}</span>
                </td>
                <td className="px-4 py-3 text-ink-muted">{txnTypeLabel[t.type]}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium",
                    t.direction === "credit" ? "text-success" : "text-danger",
                  )}>
                    {t.direction === "credit"
                      ? <Icons.arrowDown className="size-3" />
                      : <Icons.arrowUp className="size-3" />}
                    {t.direction}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={txnStatusTone[t.status]} dot>{t.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">
                  {fmtAmt(t)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-muted text-xs">
                  {t.fee > 0 ? (t.assetKind === "fiat" ? `₦${t.fee.toLocaleString()}` : `${t.fee} ${t.assetSymbol}`) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">
                  {formatDate(t.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total === 0 && (
          <div className="p-10 text-center text-sm text-ink-subtle">
            No transactions match your filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <p className="text-xs text-ink-subtle">
          {total === 0 ? "No results" : `${start + 1}–${Math.min(start + TXN_PAGE_SIZE, total)} of ${total}`}
        </p>
        <div className="flex items-center gap-1">
          <PagerBtn disabled={cur <= 1} onClick={() => setPage((p) => p - 1)}>
            <Icons.chevronLeft className="size-4" />
          </PagerBtn>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={cn(
                "grid size-8 place-items-center rounded-md text-sm transition-colors",
                cur === i + 1
                  ? "bg-primary text-primary-foreground"
                  : "text-ink-muted hover:bg-paper-sunken",
              )}
            >
              {i + 1}
            </button>
          ))}
          <PagerBtn disabled={cur >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <Icons.chevronRight className="size-4" />
          </PagerBtn>
        </div>
      </div>
    </div>
  );
}

function PagerBtn({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-paper-sunken disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

// ─── KYC section ─────────────────────────────────────────────────────────────

function KycSection({ user }: { user: UserDetail }) {
  const { kyc } = user;
  const { tierLimits, nextTierLimits, verifications } = kyc;

  return (
    <div className="space-y-4">
      {/* Tier banner */}
      <div className="rounded-xl border border-line bg-paper-raised">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
          <Icons.shieldCheck className="size-4 text-ink-muted" />
          <h3 className="text-sm font-semibold text-ink">Current Tier</h3>
          <Badge tone={user.kycTier >= 2 ? "info" : "neutral"} className="ml-auto">
            Tier {user.kycTier}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {[
            { label: "Daily fiat limit", value: tierLimits.dailyFiatLimit > 0 ? formatNaira(tierLimits.dailyFiatLimit) : "No access" },
            { label: "Single txn limit", value: tierLimits.singleTxnLimit > 0 ? formatNaira(tierLimits.singleTxnLimit) : "No access" },
            { label: "Crypto trading", value: tierLimits.cryptoEnabled ? "Enabled" : "Disabled" },
            { label: "FX conversion", value: tierLimits.fxEnabled ? "Enabled" : "Disabled" },
          ].map((item) => (
            <div key={item.label} className="bg-paper-raised p-4">
              <p className="text-xs text-ink-subtle">{item.label}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next tier requirements */}
      {nextTierLimits && (
        <SectionCard title={`Requirements for Tier ${user.kycTier + 1}`} icon={Icons.arrowUp}>
          <div className="flex flex-wrap gap-2">
            {nextTierLimits.requiresDocs.map((doc) => {
              const verif = verifications.find((v) => v.kind === doc);
              const done = verif?.status === "verified";
              return (
                <span
                  key={doc}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                    done
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-line text-ink-muted",
                  )}
                >
                  {done ? <Icons.check className="size-3" /> : <Icons.clock className="size-3" />}
                  {kindLabel[doc]}
                </span>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Verifications */}
      <SectionCard title="Document Verifications" icon={Icons.badgeCheck}>
        {verifications.length === 0 ? (
          <p className="text-sm text-ink-subtle">No verifications on file.</p>
        ) : (
          <div className="space-y-3">
            {verifications.map((v) => (
              <div key={v.id} className="flex flex-col gap-1 rounded-lg border border-line p-4 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-[140px] font-medium text-sm text-ink">{kindLabel[v.kind]}</div>
                <Badge tone={verifTone[v.status]} dot className="w-fit">{v.status.replace("_", " ")}</Badge>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-subtle sm:ml-auto">
                  {v.provider && <span>via {v.provider}</span>}
                  {v.submittedAt && <span>Submitted {formatDate(v.submittedAt)}</span>}
                  {v.reviewedAt && <span>Reviewed {formatDate(v.reviewedAt)}</span>}
                  {v.rejectedReason && <span className="text-danger">{v.rejectedReason}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Security section ─────────────────────────────────────────────────────────

function SecuritySection({ user }: { user: UserDetail }) {
  const { security } = user;
  const activeRestrictions = security.restrictions.filter((r) => !r.liftedAt);

  return (
    <div className="space-y-4">
      {/* Lock state banner */}
      {security.lock && !security.lock.liftedAt && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
          <Icons.alertTriangle className="mt-0.5 size-5 shrink-0 text-danger" />
          <div className="flex-1">
            <p className="font-semibold text-danger">Account is Locked</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              Reason: {security.lock.reason}
              {security.lock.lockedUntil && ` · Expires ${formatDate(security.lock.lockedUntil)}`}
            </p>
            <p className="text-xs text-ink-subtle">Locked {formatDate(security.lock.createdAt)}</p>
          </div>
        </div>
      )}

      {/* Active restrictions */}
      <SectionCard title="Restrictions" icon={Icons.shield}>
        {activeRestrictions.length === 0 ? (
          <p className="text-sm text-ink-subtle">No active restrictions.</p>
        ) : (
          <div className="space-y-3">
            {activeRestrictions.map((r) => (
              <div key={r.id} className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                <div className="flex items-center gap-2">
                  <Badge tone="warning">{restrictionLabel[r.kind]}</Badge>
                  {r.walletId && (
                    <span className="text-xs text-ink-subtle">Wallet: <span className="font-mono">{r.walletId.slice(0, 8)}…</span></span>
                  )}
                  {!r.walletId && <span className="text-xs text-ink-subtle">All wallets</span>}
                </div>
                <p className="mt-2 text-sm text-ink">{r.reason}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-ink-subtle">
                  <span>Placed {formatDate(r.createdAt)}</span>
                  {r.expiresAt && <span>Expires {formatDate(r.expiresAt)}</span>}
                  {!r.expiresAt && <span>No expiry</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Devices */}
      <SectionCard title="Devices" icon={Icons.smartphone}>
        {security.devices.length === 0 ? (
          <p className="text-sm text-ink-subtle">No devices registered.</p>
        ) : (
          <div className="space-y-3">
            {security.devices.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-4">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-paper-sunken">
                  <Icons.smartphone className="size-4 text-ink-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-ink">
                    {d.model ?? d.platform ?? "Unknown device"}
                  </p>
                  <p className="text-xs text-ink-subtle capitalize">
                    {d.platform ?? "—"}
                    {d.lastSeenAt && ` · Last seen ${formatDate(d.lastSeenAt)}`}
                  </p>
                </div>
                <Badge tone={d.status === "active" ? "success" : "neutral"} dot>
                  {d.status.replace("_", " ")}
                </Badge>
                {d.approvedAt && (
                  <span className="text-xs text-ink-subtle">Approved {formatDate(d.approvedAt)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Sessions */}
      <SectionCard title="Recent Sessions" icon={Icons.key}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">IP</th>
                <th className="pb-3 font-medium">User Agent</th>
                <th className="pb-3 font-medium">Created</th>
                <th className="pb-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {security.sessions.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="py-3 pr-4">
                    <Badge
                      tone={s.status === "active" ? "success" : s.status === "revoked" ? "danger" : "neutral"}
                      dot
                    >
                      {s.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-ink">{s.ip ?? "—"}</td>
                  <td className="py-3 pr-4 max-w-[200px] truncate text-xs text-ink-muted">
                    {s.userAgent ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-xs text-ink-muted">{formatDate(s.createdAt)}</td>
                  <td className="py-3 text-xs text-ink-muted">{formatDate(s.expiresAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Security event timeline */}
      <SectionCard title="Security Events" icon={Icons.activity}>
        <ol className="relative border-l border-line pl-5">
          {security.events.map((e, i) => {
            const meta = securityEventLabel[e.kind] ?? { label: e.kind, icon: Icons.activity };
            const EventIcon = meta.icon;
            return (
              <li key={e.id} className={cn("pb-5", i === security.events.length - 1 && "pb-0")}>
                <span className="absolute -left-[9px] grid size-4 place-items-center rounded-full border border-line bg-paper-raised">
                  <EventIcon className="size-2.5 text-ink-muted" />
                </span>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="text-sm font-medium text-ink">{meta.label}</span>
                  {e.summary && e.summary !== meta.label && (
                    <span className="text-xs text-ink-muted">{e.summary}</span>
                  )}
                  <span className="ml-auto text-xs text-ink-subtle">{formatDate(e.createdAt)}</span>
                </div>
                {e.ip && (
                  <p className="mt-0.5 font-mono text-xs text-ink-subtle">IP: {e.ip}</p>
                )}
              </li>
            );
          })}
        </ol>
      </SectionCard>
    </div>
  );
}

// ─── Quick action dialogs ─────────────────────────────────────────────────────

type QuickAction = "lock" | "unlock" | null;

// ─── Main component ───────────────────────────────────────────────────────────

export function UserDetailView({ user: initial }: { user: UserDetail }) {
  const [user, setUser] = React.useState(initial);
  const [tab, setTab] = React.useState<Tab>("overview");
  const [action, setAction] = React.useState<QuickAction>(null);
  const [lockReason, setLockReason] = React.useState("");

  const isLocked = !!user.security.lock && !user.security.lock.liftedAt;
  const fullName = [user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ") || user.name;

  function confirmAction() {
    if (action === "lock") {
      setUser((u) => ({
        ...u,
        status: "locked",
        security: {
          ...u.security,
          lock: { id: "lck-new", reason: lockReason || "Manual admin lock", lockedUntil: null, createdAt: new Date().toISOString(), liftedAt: null },
        },
      }));
    } else if (action === "unlock") {
      setUser((u) => ({
        ...u,
        status: "active",
        security: {
          ...u.security,
          lock: u.security.lock ? { ...u.security.lock, liftedAt: new Date().toISOString() } : null,
        },
      }));
    }
    setAction(null);
    setLockReason("");
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Back nav */}
      <div className="mb-6">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <Icons.chevronLeft className="size-4" />
          Back to users
        </Link>
      </div>

      {/* User header */}
      <div className="rounded-xl border border-line bg-paper-raised p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar name={fullName} size="lg" />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-ink">{fullName}</h1>
              <Badge tone={statusTone[user.status]} dot>{user.status}</Badge>
              <Badge tone={user.kycTier >= 2 ? "info" : "neutral"}>Tier {user.kycTier}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{user.email}</p>
            {user.phone && <p className="text-sm text-ink-muted">{user.phone}</p>}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-subtle">
              <span className="inline-flex items-center gap-1"><Icons.hash className="size-3" />{user.id}</span>
              <span className="inline-flex items-center gap-1"><Icons.calendar className="size-3" />Joined {formatDate(user.joinedAt)}</span>
              {user.lastActiveAt && (
                <span className="inline-flex items-center gap-1"><Icons.clock className="size-3" />Last active {formatDate(user.lastActiveAt)}</span>
              )}
              <span className="inline-flex items-center gap-1">
                <Icons.landmark className="size-3" />
                {formatNaira(user.stats.estimatedPortfolioNgn)} portfolio
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 sm:ml-auto sm:shrink-0">
            {isLocked ? (
              <Button variant="outline" size="sm" onClick={() => setAction("unlock")}>
                <Icons.unlock className="size-4" />
                Unlock
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAction("lock")}>
                <Icons.lock className="size-4" />
                Lock
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b border-line">
        <div className="flex gap-1 overflow-x-auto" role="tablist">
          {TABS.map((t) => {
            const TabIcon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  tab === t.id
                    ? "border-primary text-ink"
                    : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                <TabIcon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {tab === "overview" && <OverviewSection user={user} />}
        {tab === "wallets" && <WalletsSection user={user} />}
        {tab === "transactions" && <TransactionsSection user={user} />}
        {tab === "kyc" && <KycSection user={user} />}
        {tab === "security" && <SecuritySection user={user} />}
      </div>

      {/* Lock dialog */}
      <Dialog
        open={action === "lock"}
        onClose={() => { setAction(null); setLockReason(""); }}
        title="Lock account"
        description="The user will be unable to log in until the account is unlocked."
        icon={Icons.lock}
        tone="warning"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setAction(null); setLockReason(""); }}>Cancel</Button>
            <Button variant="danger" disabled={!lockReason.trim()} onClick={confirmAction}>Lock</Button>
          </>
        }
      >
        <div className="mt-3 space-y-2">
          <label htmlFor="lock-reason" className="text-sm font-medium text-ink">Reason</label>
          <Input
            id="lock-reason"
            placeholder="e.g. Suspicious activity"
            value={lockReason}
            onChange={(e) => setLockReason(e.target.value)}
          />
        </div>
      </Dialog>

      {/* Unlock dialog */}
      <Dialog
        open={action === "unlock"}
        onClose={() => setAction(null)}
        title="Unlock account"
        description={`${fullName}'s account will regain full access immediately.`}
        icon={Icons.unlock}
        tone="neutral"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={confirmAction}>Unlock</Button>
          </>
        }
      />
    </div>
  );
}
