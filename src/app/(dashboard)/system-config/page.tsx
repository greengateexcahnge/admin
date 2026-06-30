import type { Metadata } from "next";
import { getAssets, getAssetSummary } from "@/lib/data/assets";
import { getNetworks, getNetworkSummary } from "@/lib/data/networks";
import { getAssetNetworks, getAssetNetworkSummary } from "@/lib/data/asset-networks";
import { getFeeSchedules, getFeeScheduleSummary } from "@/lib/data/fee-schedules";
import { getExchangeRates, getExchangeRateSummary } from "@/lib/data/exchange-rates";
import { getBanks, getBankSummary } from "@/lib/data/banks";
import { ConfigBento } from "@/components/system-config/config-bento";

export const metadata: Metadata = {
  title: "System Config — Greengate Admin",
  description: "Configure assets, networks, fee schedules, exchange rates and banks.",
};

export default function SystemConfigPage() {
  const assets = getAssets();
  const assetSummary = getAssetSummary(assets);

  const networks = getNetworks();
  const networkSummary = getNetworkSummary(networks);

  const assetNetworks = getAssetNetworks();
  const assetNetworkSummary = getAssetNetworkSummary(assetNetworks);

  const feeSchedules = getFeeSchedules();
  const feeSummary = getFeeScheduleSummary(feeSchedules);

  const exchangeRateSummary = getExchangeRateSummary();

  const banks = getBanks();
  const bankSummary = getBankSummary(banks);

  const topAssets = assets.slice(0, 3);
  const seenPairs = new Set<string>();
  const latestRates = getExchangeRates()
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
    .filter(r => {
      const key = `${r.baseSymbol}/${r.quoteSymbol}`;
      if (seenPairs.has(key)) return false;
      seenPairs.add(key);
      return true;
    })
    .slice(0, 3);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">System Config</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage platform-wide reference data — assets, networks, fees, rates and banks.
        </p>
      </div>

      <ConfigBento
        assets={{
          total: assetSummary.total,
          crypto: assetSummary.crypto,
          fiat: assetSummary.fiat,
          preview: topAssets.map(a => ({
            label: `${a.symbol} — ${a.name}`,
            value: a.kind,
          })),
        }}
        networks={{
          total: networkSummary.total,
          active: networkSummary.active,
          preview: networks.slice(0, 3).map(n => ({
            label: n.name,
            value: `${n.confirmationsRequired} confs`,
          })),
        }}
        assetNetworks={{
          total: assetNetworkSummary.total,
          active: assetNetworkSummary.active,
          preview: assetNetworks.slice(0, 3).map(an => ({
            label: `${an.assetSymbol} on ${an.networkCode}`,
            value: an.isActive ? "active" : "inactive",
          })),
        }}
        feeSchedules={{
          total: feeSummary.total,
          active: feeSummary.active,
          preview: feeSchedules.slice(0, 3).map(f => ({
            label: f.txnType.replace(/_/g, " "),
            value: f.percentFee > 0 ? `${(f.percentFee * 100).toFixed(2)}%` : f.flatFee > 0 ? `flat ${f.flatFee}` : "free",
          })),
        }}
        exchangeRates={{
          pairs: exchangeRateSummary.pairs,
          latestAt: exchangeRateSummary.latestAt,
          preview: latestRates.map(r => ({
            label: `${r.baseSymbol} / ${r.quoteSymbol}`,
            value: r.rate.toLocaleString(),
          })),
        }}
        banks={{
          total: bankSummary.total,
          active: bankSummary.active,
          preview: banks.filter(b => b.isActive).slice(0, 3).map(b => ({
            label: b.name,
            value: b.code,
          })),
        }}
      />
    </div>
  );
}
