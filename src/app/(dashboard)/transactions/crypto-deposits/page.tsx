import type { Metadata } from "next";
import { getCryptoDeposits } from "@/lib/data/transactions-data";
import { CryptoDepositsManager } from "@/components/transactions/crypto-deposits-manager";

export const metadata: Metadata = { title: "Crypto Deposits — Transactions" };

export default function CryptoDepositsPage() {
  const deposits = getCryptoDeposits();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/transactions" className="hover:text-ink">Transactions</a>
        <span>/</span>
        <span className="text-ink">Crypto Deposits</span>
      </div>
      <CryptoDepositsManager initialDeposits={deposits} />
    </div>
  );
}
