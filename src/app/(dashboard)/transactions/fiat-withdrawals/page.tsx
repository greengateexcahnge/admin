import type { Metadata } from "next";
import { getFiatWithdrawals } from "@/lib/data/transactions-data";
import { FiatWithdrawalsManager } from "@/components/transactions/fiat-withdrawals-manager";

export const metadata: Metadata = { title: "Fiat Withdrawals — Transactions" };

export default function FiatWithdrawalsPage() {
  const withdrawals = getFiatWithdrawals();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/transactions" className="hover:text-ink">Transactions</a>
        <span>/</span>
        <span className="text-ink">Fiat Withdrawals</span>
      </div>
      <FiatWithdrawalsManager initialWithdrawals={withdrawals} />
    </div>
  );
}
