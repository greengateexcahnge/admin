import type { Metadata } from "next";
import { getExchangeRates } from "@/lib/data/exchange-rates";
import { getAssets } from "@/lib/data/assets";
import { ExchangeRatesManager } from "@/components/system-config/exchange-rates-manager";

export const metadata: Metadata = {
  title: "Exchange Rates — System Config",
};

export default function ExchangeRatesPage() {
  const rates = getExchangeRates();
  const assets = getAssets();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/system-config" className="hover:text-ink">System Config</a>
        <span>/</span>
        <span className="text-ink">Exchange Rates</span>
      </div>
      <ExchangeRatesManager initialRates={rates} assets={assets} />
    </div>
  );
}
