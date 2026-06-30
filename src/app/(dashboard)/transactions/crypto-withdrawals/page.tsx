import type { Metadata } from "next";
import { getCryptoWithdrawals } from "@/lib/data/transactions-data";
import { CryptoWithdrawalsManager } from "@/components/transactions/crypto-withdrawals-manager";

export const metadata: Metadata = { title: "Crypto Withdrawals — Transactions" };

export default function CryptoWithdrawalsPage() {
  const withdrawals = getCryptoWithdrawals();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/transactions" className="hover:text-ink">Transactions</a>
        <span>/</span>
        <span className="text-ink">Crypto Withdrawals</span>
      </div>
      <CryptoWithdrawalsManager initialWithdrawals={withdrawals} />
    </div>
  );
}
