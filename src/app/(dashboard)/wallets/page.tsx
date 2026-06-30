import {
  getWallets,
  getVirtualAccounts,
  getDepositAddresses,
  getPayoutAccounts,
  getAddressBook,
  getTransactions,
} from "@/lib/data/wallets-data";
import { WalletsManager } from "@/components/wallets/wallets-manager";
import { Icons } from "@/components/icons";

export default function WalletsPage() {
  const wallets = getWallets();
  const virtualAccounts = getVirtualAccounts();
  const depositAddresses = getDepositAddresses();
  const payoutAccounts = getPayoutAccounts();
  const addressBook = getAddressBook();
  const transactions = getTransactions();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
          <Icons.wallet className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-ink">Wallets</h1>
          <p className="text-sm text-ink-muted">
            Wallets, virtual accounts, deposit addresses, payout accounts, address book &amp; transaction history
          </p>
        </div>
      </div>

      <WalletsManager
        initialWallets={wallets}
        initialVirtualAccounts={virtualAccounts}
        initialDepositAddresses={depositAddresses}
        initialPayoutAccounts={payoutAccounts}
        initialAddressBook={addressBook}
        initialTransactions={transactions}
      />
    </div>
  );
}
