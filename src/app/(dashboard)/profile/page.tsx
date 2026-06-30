import type { Metadata } from "next";
import Link from "next/link";
import {
  getCurrentProfile,
  type ActivityKind,
  type VerificationStatus,
} from "@/lib/data/profile";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Icons, type Icon } from "@/components/icons";
import { formatDate, formatNaira } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Profile",
};

const verificationTone: Record<VerificationStatus, BadgeTone> = {
  verified: "success",
  in_review: "info",
  pending: "warning",
  unsubmitted: "neutral",
  rejected: "danger",
};

const activityIcon: Record<ActivityKind, Icon> = {
  login: Icons.login,
  password: Icons.key,
  device: Icons.smartphone,
  kyc: Icons.badgeCheck,
  pin: Icons.shield,
};

function DetailRow({
  icon: DetailIcon,
  label,
  value,
}: {
  icon: Icon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <DetailIcon className="size-4 shrink-0 text-ink-subtle" />
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="ml-auto text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const p = getCurrentProfile();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Profile</h1>

      {/* Identity card */}
      <div className="mt-6 rounded-xl border border-line bg-paper-raised p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={p.name} size="lg" />
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-ink">{p.name}</h2>
            <p className="text-sm text-ink-muted">{p.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="success" dot>
                {p.status}
              </Badge>
              <Badge tone="info">KYC Tier {p.kycTier}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-ink-subtle">
                <Icons.coins className="size-3.5" />
                Ref: {p.referralCode}
              </span>
            </div>
          </div>
          <Link
            href="/settings"
            className="inline-flex h-9 items-center gap-2 self-start rounded-md border border-line-strong px-3 text-sm font-medium text-ink transition-colors hover:bg-paper-sunken sm:ml-auto"
          >
            <Icons.settings className="size-4" />
            Edit profile
          </Link>
        </div>
      </div>

      {/* Account stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Portfolio"
          value={formatNaira(p.stats.portfolioNgn, { compact: true })}
          icon={Icons.wallet}
        />
        <StatCard
          label="Total deposits"
          value={formatNaira(p.stats.totalDepositsNgn, { compact: true })}
          icon={Icons.trendingUp}
        />
        <StatCard
          label="Total withdrawals"
          value={formatNaira(p.stats.totalWithdrawalsNgn, { compact: true })}
          icon={Icons.trendingDown}
        />
        <StatCard
          label="Transactions"
          value={String(p.stats.txnCount)}
          icon={Icons.activity}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Personal details */}
        <section className="rounded-xl border border-line bg-paper-raised p-5">
          <h3 className="text-sm font-semibold text-ink">Personal details</h3>
          <div className="mt-2 divide-y divide-line">
            <DetailRow icon={Icons.phone} label="Phone" value={p.phone} />
            <DetailRow icon={Icons.mapPin} label="Country" value={p.country} />
            <DetailRow
              icon={Icons.user}
              label="Occupation"
              value={p.occupation}
            />
            <DetailRow
              icon={Icons.calendar}
              label="Joined"
              value={formatDate(p.joinedAt)}
            />
            <DetailRow
              icon={Icons.clock}
              label="Last login"
              value={formatDate(p.lastLoginAt)}
            />
          </div>
        </section>

        {/* Verifications */}
        <section className="rounded-xl border border-line bg-paper-raised p-5">
          <h3 className="text-sm font-semibold text-ink">Verifications</h3>
          <ul className="mt-2 divide-y divide-line">
            {p.verifications.map((v) => (
              <li
                key={v.label}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="flex items-center gap-3 text-sm text-ink">
                  <Icons.shieldCheck className="size-4 text-ink-subtle" />
                  {v.label}
                </span>
                <Badge tone={verificationTone[v.status]}>
                  {v.status.replace("_", " ")}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Recent activity */}
      <section className="mt-4 rounded-xl border border-line bg-paper-raised p-5">
        <h3 className="text-sm font-semibold text-ink">Recent activity</h3>
        <ul className="mt-3 space-y-1">
          {p.activity.map((event) => {
            const EventIcon = activityIcon[event.kind];
            return (
              <li key={event.id} className="flex items-center gap-3 py-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-paper-sunken text-ink-muted">
                  <EventIcon className="size-4" />
                </span>
                <span className="text-sm text-ink">{event.summary}</span>
                <span className="ml-auto text-xs text-ink-subtle">
                  {formatDate(event.at)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
