import type { Metadata } from "next";
import { getSwaps } from "@/lib/data/transactions-data";
import { SwapsManager } from "@/components/transactions/swaps-manager";

export const metadata: Metadata = { title: "Swaps — Transactions" };

export default function SwapsPage() {
  const swaps = getSwaps();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/transactions" className="hover:text-ink">Transactions</a>
        <span>/</span>
        <span className="text-ink">Swaps</span>
      </div>
      <SwapsManager initialSwaps={swaps} />
    </div>
  );
}
