import type { Metadata } from "next";
import { getInternalTransfers } from "@/lib/data/transactions-data";
import { InternalTransfersManager } from "@/components/transactions/internal-transfers-manager";

export const metadata: Metadata = { title: "Internal Transfers — Transactions" };

export default function InternalTransfersPage() {
  const transfers = getInternalTransfers();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/transactions" className="hover:text-ink">Transactions</a>
        <span>/</span>
        <span className="text-ink">Internal Transfers</span>
      </div>
      <InternalTransfersManager initialTransfers={transfers} />
    </div>
  );
}
