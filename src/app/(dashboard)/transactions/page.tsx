import { getTxnBentoData } from "@/lib/data/transactions-data";
import { TxnBento } from "@/components/transactions/txn-bento";
import { Icons } from "@/components/icons";

export default function TransactionsPage() {
  const data = getTxnBentoData();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
          <Icons.receipt className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-ink">Transactions</h1>
          <p className="text-sm text-ink-muted">
            Platform-wide transaction records across all types
          </p>
        </div>
      </div>
      <TxnBento data={data} />
    </div>
  );
}
