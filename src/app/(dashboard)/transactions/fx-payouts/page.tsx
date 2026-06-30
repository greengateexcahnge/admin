import type { Metadata } from "next";
import { getFxPayouts } from "@/lib/data/transactions-data";
import { FxPayoutsManager } from "@/components/transactions/fx-payouts-manager";

export const metadata: Metadata = { title: "FX Payouts — Transactions" };

export default function FxPayoutsPage() {
  const payouts = getFxPayouts();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/transactions" className="hover:text-ink">Transactions</a>
        <span>/</span>
        <span className="text-ink">FX Payouts</span>
      </div>
      <FxPayoutsManager initialPayouts={payouts} />
    </div>
  );
}
