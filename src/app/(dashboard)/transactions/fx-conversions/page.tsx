import type { Metadata } from "next";
import { getFxConversions } from "@/lib/data/transactions-data";
import { FxConversionsManager } from "@/components/transactions/fx-conversions-manager";

export const metadata: Metadata = { title: "FX Conversions — Transactions" };

export default function FxConversionsPage() {
  const conversions = getFxConversions();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/transactions" className="hover:text-ink">Transactions</a>
        <span>/</span>
        <span className="text-ink">FX Conversions</span>
      </div>
      <FxConversionsManager initialConversions={conversions} />
    </div>
  );
}
