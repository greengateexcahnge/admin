import type { Metadata } from "next";
import { getFiatDeposits } from "@/lib/data/transactions-data";
import { FiatDepositsManager } from "@/components/transactions/fiat-deposits-manager";

export const metadata: Metadata = { title: "Fiat Deposits — Transactions" };

export default function FiatDepositsPage() {
  const deposits = getFiatDeposits();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/transactions" className="hover:text-ink">Transactions</a>
        <span>/</span>
        <span className="text-ink">Fiat Deposits</span>
      </div>
      <FiatDepositsManager initialDeposits={deposits} />
    </div>
  );
}
