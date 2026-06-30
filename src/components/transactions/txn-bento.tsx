"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { TxnBentoData, TxnTypeSummary } from "@/lib/data/transactions-data";

function BentoCard({
  href, icon: Icon, iconBg, iconColor,
  title, description, summary, preview,
}: {
  href: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  summary: TxnTypeSummary;
  preview: Array<{ label: string; value: string }>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border border-line bg-paper-raised p-6",
        "transition-all duration-200 hover:border-line-strong hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("grid size-11 place-items-center rounded-xl", iconBg)}>
          <Icon className={cn("size-5", iconColor)} />
        </div>
        <Icons.chevronRight className="size-4 text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="font-medium text-ink">{summary.total} total</span>
        {summary.pending > 0 && (
          <span className="font-medium text-warning">{summary.pending} pending</span>
        )}
        {summary.processing > 0 && (
          <span className="font-medium text-info">{summary.processing} processing</span>
        )}
        {summary.failed > 0 && (
          <span className="font-medium text-danger">{summary.failed} failed/cancelled</span>
        )}
        <span className="text-ink-muted">{summary.completed} completed</span>
      </div>

      <div className="mt-auto space-y-1.5 border-t border-line pt-4">
        {preview.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="truncate text-ink-muted">{label}</span>
            <span className="ml-2 shrink-0 font-mono text-xs text-ink-subtle">{value}</span>
          </div>
        ))}
        {preview.length === 0 && (
          <p className="text-xs text-ink-subtle">No records yet</p>
        )}
      </div>
    </Link>
  );
}

export function TxnBento({ data }: { data: TxnBentoData }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <BentoCard
        href="/transactions/fiat-deposits"
        icon={Icons.arrowDown}
        iconBg="bg-success/10"
        iconColor="text-success"
        title="Fiat Deposits"
        description="Naira top-ups via virtual account / bank transfer"
        summary={data.fiatDeposits}
        preview={data.fiatDeposits.preview}
      />

      <BentoCard
        href="/transactions/fiat-withdrawals"
        icon={Icons.arrowUp}
        iconBg="bg-danger/10"
        iconColor="text-danger"
        title="Fiat Withdrawals"
        description="NGN payouts to Nigerian bank accounts"
        summary={data.fiatWithdrawals}
        preview={data.fiatWithdrawals.preview}
      />

      <BentoCard
        href="/transactions/crypto-deposits"
        icon={Icons.coins}
        iconBg="bg-info/10"
        iconColor="text-info"
        title="Crypto Deposits"
        description="On-chain receives to deposit addresses"
        summary={data.cryptoDeposits}
        preview={data.cryptoDeposits.preview}
      />

      <BentoCard
        href="/transactions/crypto-withdrawals"
        icon={Icons.coins}
        iconBg="bg-warning/10"
        iconColor="text-warning"
        title="Crypto Withdrawals"
        description="On-chain sends from user wallets"
        summary={data.cryptoWithdrawals}
        preview={data.cryptoWithdrawals.preview}
      />

      <BentoCard
        href="/transactions/swaps"
        icon={Icons.swap}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        title="Swaps"
        description="Crypto-to-crypto swaps within the platform"
        summary={data.swaps}
        preview={data.swaps.preview}
      />

      <BentoCard
        href="/transactions/fx-conversions"
        icon={Icons.dollar}
        iconBg="bg-ink/5"
        iconColor="text-ink-muted"
        title="FX Conversions"
        description="Buy/sell foreign fiat currencies against NGN"
        summary={data.fxConversions}
        preview={data.fxConversions.preview}
      />

      <BentoCard
        href="/transactions/fx-payouts"
        icon={Icons.globe}
        iconBg="bg-info/10"
        iconColor="text-info"
        title="FX Payouts"
        description="International wire transfers to foreign bank accounts"
        summary={data.fxPayouts}
        preview={data.fxPayouts.preview}
      />

      <BentoCard
        href="/transactions/internal-transfers"
        icon={Icons.users}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        title="Internal Transfers"
        description="Instant user-to-user transfers within Greengate"
        summary={data.internalTransfers}
        preview={data.internalTransfers.preview}
      />
    </div>
  );
}
