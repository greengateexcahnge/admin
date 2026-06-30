"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  href: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  stats: string;
  preview: Array<{ label: string; value: string }>;
}

function BentoCard({ href, icon: Icon, iconBg, iconColor, title, description, stats, preview }: BentoCardProps) {
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

      <p className="text-xs font-medium text-ink-muted">{stats}</p>

      <div className="mt-auto space-y-1.5 border-t border-line pt-4">
        {preview.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="truncate text-ink-muted">{label}</span>
            <span className="ml-2 shrink-0 text-xs text-ink-subtle">{value}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}

export interface ConfigBentoProps {
  assets: { total: number; crypto: number; fiat: number; preview: Array<{ label: string; value: string }> };
  networks: { total: number; active: number; preview: Array<{ label: string; value: string }> };
  assetNetworks: { total: number; active: number; preview: Array<{ label: string; value: string }> };
  feeSchedules: { total: number; active: number; preview: Array<{ label: string; value: string }> };
  exchangeRates: { pairs: number; latestAt: string | null; preview: Array<{ label: string; value: string }> };
  banks: { total: number; active: number; preview: Array<{ label: string; value: string }> };
}

export function ConfigBento({ assets, networks, assetNetworks, feeSchedules, exchangeRates, banks }: ConfigBentoProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <BentoCard
        href="/system-config/assets"
        icon={Icons.coins}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        title="Assets"
        description="Crypto and fiat asset catalogue"
        stats={`${assets.total} assets · ${assets.crypto} crypto · ${assets.fiat} fiat`}
        preview={assets.preview}
      />

      <BentoCard
        href="/system-config/networks"
        icon={Icons.network}
        iconBg="bg-info/10"
        iconColor="text-info"
        title="Networks"
        description="Blockchain deposit & withdrawal networks"
        stats={`${networks.total} networks · ${networks.active} active`}
        preview={networks.preview}
      />

      <BentoCard
        href="/system-config/asset-networks"
        icon={Icons.link}
        iconBg="bg-success/10"
        iconColor="text-success"
        title="Asset Networks"
        description="Asset ↔ network routing rules"
        stats={`${assetNetworks.total} pairs · ${assetNetworks.active} active`}
        preview={assetNetworks.preview}
      />

      <BentoCard
        href="/system-config/fee-schedules"
        icon={Icons.percent}
        iconBg="bg-warning/10"
        iconColor="text-warning"
        title="Fee Schedules"
        description="Transaction fees by type, asset and tier"
        stats={`${feeSchedules.total} schedules · ${feeSchedules.active} active`}
        preview={feeSchedules.preview}
      />

      <BentoCard
        href="/system-config/exchange-rates"
        icon={Icons.dollar}
        iconBg="bg-danger/10"
        iconColor="text-danger"
        title="Exchange Rates"
        description="FX and crypto rate feed"
        stats={`${exchangeRates.pairs} active pairs`}
        preview={exchangeRates.preview}
      />

      <BentoCard
        href="/system-config/banks"
        icon={Icons.landmark}
        iconBg="bg-ink/5"
        iconColor="text-ink-muted"
        title="Banks"
        description="Supported Nigerian bank institutions"
        stats={`${banks.total} banks · ${banks.active} active`}
        preview={banks.preview}
      />
    </div>
  );
}
