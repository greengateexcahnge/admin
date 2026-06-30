"use client";

import * as React from "react";
import { cn, formatDate } from "@/lib/utils";
import {
  getWalletsSummary,
  TXN_TYPE_LABELS,
  TXN_TYPE_TONE,
  TXN_STATUS_TONE,
  type PlatformWallet,
  type VirtualAccount,
  type DepositAddress,
  type PayoutAccount,
  type AddressBookEntry,
  type PlatformTransaction,
  type TxnType,
  type TxnStatus,
} from "@/lib/data/wallets-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { DateRangeFilter, DateRange, inDateRange } from "@/components/ui/date-filter";
import { Sheet } from "@/components/ui/sheet";
import { Icons } from "@/components/icons";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function fmtNgn(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtAmount(amount: number, symbol: string, assetKind: "crypto" | "fiat") {
  if (assetKind === "fiat") {
    const prefix = symbol === "NGN" ? "₦" : symbol === "USD" ? "$" : symbol === "EUR" ? "€" : symbol === "GBP" ? "£" : "";
    return `${prefix}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const dp = symbol === "BTC" ? 8 : symbol === "ETH" ? 6 : 2;
  return `${amount.toFixed(dp)} ${symbol}`;
}

function ToggleDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  tone,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  tone: "neutral" | "warning" | "danger";
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      tone={tone}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}

const PAGE_SIZE = 15;

function Pager({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-ink-muted">
      <span>{total} results · page {safePage + 1} of {totalPages}</span>
      <div className="flex gap-2">
        <Button variant="ghost" disabled={safePage === 0} onClick={() => onPage(Math.max(0, safePage - 1))}>
          <Icons.chevronLeft className="size-4" />
        </Button>
        <Button variant="ghost" disabled={safePage >= totalPages - 1} onClick={() => onPage(Math.min(totalPages - 1, safePage + 1))}>
          <Icons.chevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => undefined);
}

// ─── Wallet detail drawer ─────────────────────────────────────────────────────

const NGN_RATES: Record<string, number> = {
  NGN: 1, USD: 1620, EUR: 1750, GBP: 2050, CAD: 1200,
  USDT: 1618, USDC: 1618, BTC: 96_000_000, ETH: 5_800_000,
};

function balanceToNgn(balance: number, symbol: string) {
  return Math.round(balance * (NGN_RATES[symbol] ?? 1));
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

function WalletDetailDrawer({
  wallet,
  onClose,
  onRequestToggle,
  virtualAccounts,
  depositAddresses,
  transactions,
}: {
  wallet: PlatformWallet | null;
  onClose: () => void;
  onRequestToggle: (w: PlatformWallet) => void;
  virtualAccounts: VirtualAccount[];
  depositAddresses: DepositAddress[];
  transactions: PlatformTransaction[];
}) {
  if (!wallet) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;

  const walletVAs  = virtualAccounts.filter(va => va.walletId === wallet.id);
  const walletDAs  = depositAddresses.filter(da => da.walletId === wallet.id);
  const walletTxns = transactions
    .filter(t => t.walletId === wallet.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <Sheet
      open={!!wallet}
      onClose={onClose}
      title={wallet.userName}
      description={`${wallet.label} wallet · ${wallet.userEmail}`}
    >
      <div className="flex flex-col gap-6 p-5">

        {/* User identity */}
        <div className="flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {initials(wallet.userName)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{wallet.userName}</p>
            <p className="text-sm text-ink-muted">{wallet.userEmail}</p>
            <p className="mt-0.5 font-mono text-xs text-ink-subtle">{wallet.userId}</p>
          </div>
        </div>

        {/* Wallet identity */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">Wallet Info</p>
          <div className="flex flex-col divide-y divide-line rounded-xl border border-line bg-paper-sunken">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-ink-muted">Wallet ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-ink">{wallet.id}</span>
                <button onClick={() => copyToClipboard(wallet.id)} className="text-ink-subtle hover:text-ink">
                  <Icons.copy className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-ink-muted">Label</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink">{wallet.label}</span>
                {wallet.isPrimary && <Badge tone="info">Primary</Badge>}
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-ink-muted">Status</span>
              <Badge tone={wallet.isActive ? "success" : "neutral"}>
                {wallet.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-ink-muted">Created</span>
              <span className="text-sm text-ink">{formatDate(wallet.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Balances */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            Balances ({wallet.balances.length} asset{wallet.balances.length !== 1 ? "s" : ""})
          </p>
          {wallet.balances.length === 0 ? (
            <p className="rounded-xl border border-line bg-paper-sunken px-4 py-6 text-center text-sm text-ink-subtle">
              No balances
            </p>
          ) : (
            <>
              <div className="flex flex-col divide-y divide-line rounded-xl border border-line">
                {wallet.balances.map(b => {
                  const dp = b.symbol === "BTC" ? 8 : b.symbol === "ETH" ? 6 : b.kind === "fiat" ? 2 : 4;
                  const fmtBal = b.kind === "fiat"
                    ? b.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : b.balance.toFixed(dp);
                  const fmtLocked = b.kind === "fiat"
                    ? b.lockedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : b.lockedBalance.toFixed(dp);

                  return (
                    <div key={b.symbol} className="flex items-start justify-between px-4 py-3">
                      <div>
                        <p className="font-medium text-ink">{b.symbol}</p>
                        <p className="text-xs text-ink-muted">{b.name}</p>
                        <span className={cn(
                          "mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium",
                          b.kind === "crypto" ? "bg-info/10 text-info" : "bg-success/10 text-success",
                        )}>
                          {b.kind}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold text-ink">{fmtBal}</p>
                        {b.lockedBalance > 0 && (
                          <p className="mt-0.5 font-mono text-xs text-warning">{fmtLocked} locked</p>
                        )}
                        <p className="mt-0.5 text-xs text-ink-subtle">≈ {fmtNgn(balanceToNgn(b.balance, b.symbol))}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg border border-line bg-paper-sunken px-4 py-2.5">
                <span className="text-sm font-medium text-ink">Total (NGN est.)</span>
                <span className="font-mono text-sm font-bold text-ink">{fmtNgn(wallet.totalNgn)}</span>
              </div>
            </>
          )}
        </div>

        {/* Virtual accounts */}
        {walletVAs.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              Virtual Accounts ({walletVAs.length})
            </p>
            <div className="flex flex-col gap-2">
              {walletVAs.map(va => (
                <div key={va.id} className="flex items-center justify-between rounded-xl border border-line bg-paper-sunken px-3 py-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-ink">{va.accountNumber}</span>
                      <button onClick={() => copyToClipboard(va.accountNumber)} className="text-ink-subtle hover:text-ink">
                        <Icons.copy className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-ink-muted">{va.bankName} · {va.provider}</p>
                  </div>
                  <Badge tone={va.isActive ? "success" : "neutral"}>{va.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deposit addresses */}
        {walletDAs.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              Deposit Addresses ({walletDAs.length})
            </p>
            <div className="flex flex-col gap-2">
              {walletDAs.map(da => (
                <div key={da.id} className="rounded-xl border border-line bg-paper-sunken px-3 py-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">{da.assetSymbol}</Badge>
                      <span className="text-xs text-ink-muted">{da.networkName}</span>
                    </div>
                    <Badge tone={da.isActive ? "success" : "neutral"}>{da.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink break-all">
                      {da.address.slice(0, 18)}…{da.address.slice(-8)}
                    </span>
                    <button onClick={() => copyToClipboard(da.address)} className="shrink-0 text-ink-subtle hover:text-ink">
                      <Icons.copy className="size-3.5" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-ink-subtle capitalize">{da.provider}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent transactions */}
        {walletTxns.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              Recent Transactions
            </p>
            <div className="flex flex-col divide-y divide-line rounded-xl border border-line">
              {walletTxns.map(t => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {t.direction === "credit"
                        ? <Icons.arrowDown className="size-3.5 shrink-0 text-success" />
                        : <Icons.arrowUp className="size-3.5 shrink-0 text-danger" />}
                      <Badge tone={TXN_TYPE_TONE[t.type]}>{TXN_TYPE_LABELS[t.type]}</Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-ink-subtle">{t.reference}</p>
                    <p className="text-xs text-ink-muted">{formatDate(t.createdAt)}</p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className={cn(
                      "font-mono text-sm font-semibold",
                      t.direction === "credit" ? "text-success" : "text-danger",
                    )}>
                      {t.direction === "credit" ? "+" : "−"}{fmtAmount(t.amount, t.assetSymbol, t.assetKind)}
                    </p>
                    <Badge tone={TXN_STATUS_TONE[t.status]}>{t.status.replace("_", " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toggle action */}
        <div className="border-t border-line pt-2">
          <Button
            variant={wallet.isActive ? "ghost" : "primary"}
            className={cn("w-full", wallet.isActive && "text-danger hover:bg-danger/10 hover:text-danger")}
            onClick={() => { onClose(); onRequestToggle(wallet); }}
          >
            {wallet.isActive ? "Deactivate wallet" : "Activate wallet"}
          </Button>
        </div>

      </div>
    </Sheet>
  );
}

// ─── Wallets Panel ────────────────────────────────────────────────────────────

function WalletsPanel({
  wallets,
  onToggleActive,
  virtualAccounts,
  depositAddresses,
  transactions,
}: {
  wallets: PlatformWallet[];
  onToggleActive: (w: PlatformWallet) => void;
  virtualAccounts: VirtualAccount[];
  depositAddresses: DepositAddress[];
  transactions: PlatformTransaction[];
}) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [page, setPage] = React.useState(0);
  const [selectedWallet, setSelectedWallet] = React.useState<PlatformWallet | null>(null);
  const [confirmTarget, setConfirmTarget] = React.useState<PlatformWallet | null>(null);

  const filtered = wallets.filter(w => {
    const q = search.toLowerCase();
    if (q && !w.userName.toLowerCase().includes(q) && !w.userEmail.toLowerCase().includes(q) && !w.label.toLowerCase().includes(q)) return false;
    if (statusFilter === "active" && !w.isActive) return false;
    if (statusFilter === "inactive" && w.isActive) return false;
    if (!inDateRange(w.createdAt, dateRange)) return false;
    return true;
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  React.useEffect(() => setPage(0), [search, statusFilter, dateRange]);

  // Keep detail drawer in sync when wallet data changes (e.g. after toggle)
  React.useEffect(() => {
    if (selectedWallet) {
      const updated = wallets.find(w => w.id === selectedWallet.id);
      if (updated) setSelectedWallet(updated);
    }
  }, [wallets]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user or wallet…" className="pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <DateRangeFilter onChange={setDateRange} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Wallet</th>
              <th className="px-4 py-3 text-left font-medium">Balances</th>
              <th className="px-4 py-3 text-right font-medium">Total (NGN)</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-ink-subtle">No wallets found</td></tr>}
            {paged.map(w => (
              <tr
                key={w.id}
                onClick={() => setSelectedWallet(w)}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-paper-sunken/50",
                  selectedWallet?.id === w.id && "bg-paper-sunken/70",
                )}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{w.userName}</p>
                  <p className="text-xs text-ink-muted">{w.userEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{w.label}</span>
                    {w.isPrimary && <Badge tone="info">Primary</Badge>}
                  </div>
                  <p className="font-mono text-xs text-ink-subtle">{w.id}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {w.balances.slice(0, 3).map(b => (
                      <span key={b.symbol} className="inline-flex items-center gap-1 rounded-md bg-paper-sunken px-1.5 py-0.5 text-xs text-ink-muted">
                        <span className="font-medium text-ink">{b.symbol}</span>
                        {b.kind === "fiat"
                          ? b.balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                          : b.balance.toFixed(b.symbol === "BTC" ? 6 : 4)}
                      </span>
                    ))}
                    {w.balances.length > 3 && <span className="text-xs text-ink-subtle">+{w.balances.length - 3}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm font-medium text-ink">{fmtNgn(w.totalNgn)}</td>
                <td className="px-4 py-3">
                  <Badge tone={w.isActive ? "success" : "neutral"}>{w.isActive ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">{formatDate(w.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmTarget(w); }}
                      title={w.isActive ? "Deactivate" : "Activate"}
                      className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink"
                    >
                      {w.isActive ? <Icons.xCircle className="size-4" /> : <Icons.checkCircle className="size-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager total={filtered.length} page={page} onPage={setPage} />

      <WalletDetailDrawer
        wallet={selectedWallet}
        onClose={() => setSelectedWallet(null)}
        onRequestToggle={w => { setSelectedWallet(null); setConfirmTarget(w); }}
        virtualAccounts={virtualAccounts}
        depositAddresses={depositAddresses}
        transactions={transactions}
      />

      {confirmTarget && (
        <ToggleDialog
          open
          onClose={() => setConfirmTarget(null)}
          onConfirm={() => { onToggleActive(confirmTarget); setConfirmTarget(null); }}
          title={confirmTarget.isActive ? "Deactivate Wallet" : "Activate Wallet"}
          description={confirmTarget.isActive
            ? `Deactivate the "${confirmTarget.label}" wallet for ${confirmTarget.userName}? Transactions from this wallet will be blocked.`
            : `Reactivate the "${confirmTarget.label}" wallet for ${confirmTarget.userName}?`}
          confirmLabel={confirmTarget.isActive ? "Deactivate" : "Activate"}
          tone={confirmTarget.isActive ? "warning" : "neutral"}
        />
      )}
    </div>
  );
}

// ─── Virtual Accounts Panel ───────────────────────────────────────────────────

function VirtualAccountsPanel({ accounts, onToggleActive }: {
  accounts: VirtualAccount[];
  onToggleActive: (v: VirtualAccount) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [providerFilter, setProviderFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [page, setPage] = React.useState(0);
  const [confirmTarget, setConfirmTarget] = React.useState<VirtualAccount | null>(null);

  const filtered = accounts.filter(v => {
    const q = search.toLowerCase();
    if (q && !v.userName.toLowerCase().includes(q) && !v.accountNumber.includes(q) && !v.bankName.toLowerCase().includes(q)) return false;
    if (providerFilter !== "all" && v.provider !== providerFilter) return false;
    if (statusFilter === "active" && !v.isActive) return false;
    if (statusFilter === "inactive" && v.isActive) return false;
    if (!inDateRange(v.createdAt, dateRange)) return false;
    return true;
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  React.useEffect(() => setPage(0), [search, providerFilter, statusFilter, dateRange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, account no…" className="pl-9" />
        </div>
        <select value={providerFilter} onChange={e => setProviderFilter(e.target.value)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All providers</option>
          <option value="paystack">Paystack</option>
          <option value="flutterwave">Flutterwave</option>
          <option value="anchor">Anchor</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <DateRangeFilter onChange={setDateRange} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Account Number</th>
              <th className="px-4 py-3 text-left font-medium">Bank</th>
              <th className="px-4 py-3 text-left font-medium">Provider</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-ink-subtle">No virtual accounts found</td></tr>}
            {paged.map(v => (
              <tr key={v.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{v.userName}</p>
                  <p className="text-xs text-ink-muted">{v.userEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-ink">{v.accountNumber}</span>
                    <button onClick={() => copyToClipboard(v.accountNumber)} className="text-ink-subtle hover:text-ink">
                      <Icons.copy className="size-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-ink-muted">{v.accountName}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink">{v.bankName}</p>
                  <p className="text-xs font-mono text-ink-subtle">{v.bankCode}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone="neutral">{v.provider}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={v.isActive ? "success" : "neutral"}>{v.isActive ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">{formatDate(v.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <button onClick={() => setConfirmTarget(v)} className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink">
                      {v.isActive ? <Icons.xCircle className="size-4" /> : <Icons.checkCircle className="size-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager total={filtered.length} page={page} onPage={setPage} />

      {confirmTarget && (
        <ToggleDialog
          open
          onClose={() => setConfirmTarget(null)}
          onConfirm={() => { onToggleActive(confirmTarget); setConfirmTarget(null); }}
          title={confirmTarget.isActive ? "Disable Virtual Account" : "Enable Virtual Account"}
          description={confirmTarget.isActive
            ? `Disable NUBAN ${confirmTarget.accountNumber} (${confirmTarget.bankName}) for ${confirmTarget.userName}? Incoming transfers will stop crediting.`
            : `Re-enable NUBAN ${confirmTarget.accountNumber} for ${confirmTarget.userName}?`}
          confirmLabel={confirmTarget.isActive ? "Disable" : "Enable"}
          tone={confirmTarget.isActive ? "warning" : "neutral"}
        />
      )}
    </div>
  );
}

// ─── Deposit Addresses Panel ──────────────────────────────────────────────────

function DepositAddressesPanel({ addresses, onToggleActive }: {
  addresses: DepositAddress[];
  onToggleActive: (d: DepositAddress) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [assetFilter, setAssetFilter] = React.useState("all");
  const [networkFilter, setNetworkFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = React.useState(0);
  const [confirmTarget, setConfirmTarget] = React.useState<DepositAddress | null>(null);

  const assets = [...new Set(addresses.map(d => d.assetSymbol))].sort();
  const networks = [...new Set(addresses.map(d => d.networkCode))].sort();

  const filtered = addresses.filter(d => {
    const q = search.toLowerCase();
    if (q && !d.userName.toLowerCase().includes(q) && !d.address.toLowerCase().includes(q)) return false;
    if (assetFilter !== "all" && d.assetSymbol !== assetFilter) return false;
    if (networkFilter !== "all" && d.networkCode !== networkFilter) return false;
    if (statusFilter === "active" && !d.isActive) return false;
    if (statusFilter === "inactive" && d.isActive) return false;
    return true;
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  React.useEffect(() => setPage(0), [search, assetFilter, networkFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user or address…" className="pl-9" />
        </div>
        <select value={assetFilter} onChange={e => setAssetFilter(e.target.value)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All assets</option>
          {assets.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={networkFilter} onChange={e => setNetworkFilter(e.target.value)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All networks</option>
          {networks.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Asset</th>
              <th className="px-4 py-3 text-left font-medium">Network</th>
              <th className="px-4 py-3 text-left font-medium">Address</th>
              <th className="px-4 py-3 text-left font-medium">Provider</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-ink-subtle">No deposit addresses found</td></tr>}
            {paged.map(d => (
              <tr key={d.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{d.userName}</p>
                  <p className="text-xs text-ink-muted">{d.userEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone="neutral">{d.assetSymbol}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">{d.networkName}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink">{d.address.slice(0, 12)}…{d.address.slice(-6)}</span>
                    <button onClick={() => copyToClipboard(d.address)} title="Copy address" className="text-ink-subtle hover:text-ink">
                      <Icons.copy className="size-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted capitalize">{d.provider}</td>
                <td className="px-4 py-3">
                  <Badge tone={d.isActive ? "success" : "neutral"}>{d.isActive ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <button onClick={() => setConfirmTarget(d)} className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink">
                      {d.isActive ? <Icons.xCircle className="size-4" /> : <Icons.checkCircle className="size-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager total={filtered.length} page={page} onPage={setPage} />

      {confirmTarget && (
        <ToggleDialog
          open
          onClose={() => setConfirmTarget(null)}
          onConfirm={() => { onToggleActive(confirmTarget); setConfirmTarget(null); }}
          title={confirmTarget.isActive ? "Disable Deposit Address" : "Enable Deposit Address"}
          description={confirmTarget.isActive
            ? `Disable this ${confirmTarget.assetSymbol} address for ${confirmTarget.userName}? No new deposits will be credited to this address.`
            : `Re-enable this ${confirmTarget.assetSymbol} deposit address?`}
          confirmLabel={confirmTarget.isActive ? "Disable" : "Enable"}
          tone={confirmTarget.isActive ? "warning" : "neutral"}
        />
      )}
    </div>
  );
}

// ─── Payout Accounts Panel ────────────────────────────────────────────────────

function PayoutAccountsPanel({ accounts, onToggleVerified }: {
  accounts: PayoutAccount[];
  onToggleVerified: (p: PayoutAccount) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [verifiedFilter, setVerifiedFilter] = React.useState<"all" | "verified" | "unverified">("all");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [page, setPage] = React.useState(0);
  const [confirmTarget, setConfirmTarget] = React.useState<PayoutAccount | null>(null);

  const filtered = accounts.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.userName.toLowerCase().includes(q) && !p.accountNumber.includes(q) && !p.bankName.toLowerCase().includes(q)) return false;
    if (verifiedFilter === "verified" && !p.isVerified) return false;
    if (verifiedFilter === "unverified" && p.isVerified) return false;
    if (!inDateRange(p.createdAt, dateRange)) return false;
    return true;
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  React.useEffect(() => setPage(0), [search, verifiedFilter, dateRange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, account or bank…" className="pl-9" />
        </div>
        <select value={verifiedFilter} onChange={e => setVerifiedFilter(e.target.value as typeof verifiedFilter)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All accounts</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
        <DateRangeFilter onChange={setDateRange} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Account</th>
              <th className="px-4 py-3 text-left font-medium">Bank</th>
              <th className="px-4 py-3 text-left font-medium">Verified</th>
              <th className="px-4 py-3 text-left font-medium">Added</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-ink-subtle">No payout accounts found</td></tr>}
            {paged.map(p => (
              <tr key={p.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{p.userName}</p>
                  <p className="text-xs text-ink-muted">{p.userEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-mono text-sm font-medium text-ink">{p.accountNumber}</p>
                  <p className="text-xs text-ink-muted">{p.accountName}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink">{p.bankName}</p>
                  <p className="text-xs font-mono text-ink-subtle">{p.bankCode}</p>
                </td>
                <td className="px-4 py-3">
                  {p.isVerified
                    ? <Badge tone="success">Verified</Badge>
                    : <Badge tone="warning">Unverified</Badge>}
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">{formatDate(p.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => setConfirmTarget(p)}
                      title={p.isVerified ? "Mark unverified" : "Mark verified"}
                      className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium", p.isVerified
                        ? "text-ink-muted hover:bg-paper-sunken hover:text-ink"
                        : "text-ink-muted hover:bg-success/10 hover:text-success"
                      )}
                    >
                      {p.isVerified ? <Icons.xCircle className="size-3.5" /> : <Icons.checkCircle className="size-3.5" />}
                      {p.isVerified ? "Unverify" : "Verify"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager total={filtered.length} page={page} onPage={setPage} />

      {confirmTarget && (
        <ToggleDialog
          open
          onClose={() => setConfirmTarget(null)}
          onConfirm={() => { onToggleVerified(confirmTarget); setConfirmTarget(null); }}
          title={confirmTarget.isVerified ? "Mark as Unverified" : "Mark as Verified"}
          description={confirmTarget.isVerified
            ? `Remove verification from account ${confirmTarget.accountNumber} (${confirmTarget.bankName}) for ${confirmTarget.userName}?`
            : `Mark account ${confirmTarget.accountNumber} (${confirmTarget.bankName}) for ${confirmTarget.userName} as verified?`}
          confirmLabel={confirmTarget.isVerified ? "Unverify" : "Verify"}
          tone={confirmTarget.isVerified ? "warning" : "neutral"}
        />
      )}
    </div>
  );
}

// ─── Address Book Panel ───────────────────────────────────────────────────────

function AddressBookPanel({ entries }: { entries: AddressBookEntry[] }) {
  const [search, setSearch] = React.useState("");
  const [assetFilter, setAssetFilter] = React.useState("all");
  const [whitelistFilter, setWhitelistFilter] = React.useState<"all" | "whitelisted" | "not">("all");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [page, setPage] = React.useState(0);

  const assets = [...new Set(entries.map(e => e.assetSymbol))].sort();

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    if (q && !e.userName.toLowerCase().includes(q) && !e.address.toLowerCase().includes(q) && !(e.label?.toLowerCase() ?? "").includes(q)) return false;
    if (assetFilter !== "all" && e.assetSymbol !== assetFilter) return false;
    if (whitelistFilter === "whitelisted" && !e.whitelistedAt) return false;
    if (whitelistFilter === "not" && e.whitelistedAt) return false;
    if (!inDateRange(e.createdAt, dateRange)) return false;
    return true;
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  React.useEffect(() => setPage(0), [search, assetFilter, whitelistFilter, dateRange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, label or address…" className="pl-9" />
        </div>
        <select value={assetFilter} onChange={e => setAssetFilter(e.target.value)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All assets</option>
          {assets.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={whitelistFilter} onChange={e => setWhitelistFilter(e.target.value as typeof whitelistFilter)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All entries</option>
          <option value="whitelisted">Whitelisted</option>
          <option value="not">Not whitelisted</option>
        </select>
        <DateRangeFilter onChange={setDateRange} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Label</th>
              <th className="px-4 py-3 text-left font-medium">Asset / Network</th>
              <th className="px-4 py-3 text-left font-medium">Address</th>
              <th className="px-4 py-3 text-left font-medium">Whitelisted</th>
              <th className="px-4 py-3 text-left font-medium">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-ink-subtle">No address book entries found</td></tr>}
            {paged.map(e => (
              <tr key={e.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{e.userName}</p>
                  <p className="text-xs text-ink-muted">{e.userEmail}</p>
                </td>
                <td className="px-4 py-3 text-ink-muted">{e.label ?? <span className="italic text-ink-subtle">No label</span>}</td>
                <td className="px-4 py-3">
                  <Badge tone="neutral">{e.assetSymbol}</Badge>
                  <p className="mt-0.5 text-xs text-ink-subtle">{e.networkName}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink">{e.address.slice(0, 12)}…{e.address.slice(-6)}</span>
                    <button onClick={() => copyToClipboard(e.address)} title="Copy" className="text-ink-subtle hover:text-ink">
                      <Icons.copy className="size-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {e.whitelistedAt
                    ? <div><Badge tone="success">Whitelisted</Badge><p className="mt-0.5 text-xs text-ink-subtle">{formatDate(e.whitelistedAt)}</p></div>
                    : <Badge tone="neutral">Not whitelisted</Badge>}
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">{formatDate(e.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager total={filtered.length} page={page} onPage={setPage} />
    </div>
  );
}

// ─── Transactions Panel ───────────────────────────────────────────────────────

const TXN_TYPES_LIST: TxnType[] = [
  "fiat_deposit", "fiat_withdrawal", "crypto_deposit", "crypto_withdrawal",
  "internal_transfer", "swap", "fx_conversion", "fee", "reversal", "adjustment",
];

const TXN_STATUSES_LIST: TxnStatus[] = [
  "initiated", "pending", "processing", "requires_action",
  "completed", "failed", "reversed", "cancelled",
];

function TransactionsPanel({ transactions }: { transactions: PlatformTransaction[] }) {
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dirFilter, setDirFilter] = React.useState<"all" | "credit" | "debit">("all");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [page, setPage] = React.useState(0);

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    if (q && !t.userName.toLowerCase().includes(q) && !t.reference.toLowerCase().includes(q) && !t.assetSymbol.toLowerCase().includes(q)) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (dirFilter !== "all" && t.direction !== dirFilter) return false;
    if (!inDateRange(t.createdAt, dateRange)) return false;
    return true;
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  React.useEffect(() => setPage(0), [search, typeFilter, statusFilter, dirFilter, dateRange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, reference or asset…" className="pl-9" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All types</option>
          {TXN_TYPES_LIST.map(t => <option key={t} value={t}>{TXN_TYPE_LABELS[t]}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All status</option>
          {TXN_STATUSES_LIST.map(s => <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>)}
        </select>
        <select value={dirFilter} onChange={e => setDirFilter(e.target.value as typeof dirFilter)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">Both directions</option>
          <option value="credit">Credits only</option>
          <option value="debit">Debits only</option>
        </select>
        <DateRangeFilter onChange={setDateRange} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Reference</th>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Dir</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-right font-medium">Fee</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-ink-subtle">No transactions found</td></tr>}
            {paged.map(t => (
              <tr key={t.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-ink">{t.reference}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{t.userName}</p>
                  <p className="text-xs text-ink-muted">{t.userEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={TXN_TYPE_TONE[t.type]}>{TXN_TYPE_LABELS[t.type]}</Badge>
                </td>
                <td className="px-4 py-3">
                  {t.direction === "credit"
                    ? <Icons.arrowDown className="size-4 text-success" />
                    : <Icons.arrowUp className="size-4 text-danger" />}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={cn("font-mono text-sm font-medium", t.direction === "credit" ? "text-success" : "text-danger")}>
                    {t.direction === "credit" ? "+" : "−"}{fmtAmount(t.amount, t.assetSymbol, t.assetKind)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-ink-muted">
                  {t.fee > 0 ? fmtAmount(t.fee, t.assetSymbol, t.assetKind) : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={TXN_STATUS_TONE[t.status]}>
                    {t.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager total={filtered.length} page={page} onPage={setPage} />
    </div>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = "wallets" | "virtual_accounts" | "deposit_addresses" | "payout_accounts" | "address_book" | "transactions";

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "wallets", label: "Wallets", icon: Icons.layers },
  { id: "virtual_accounts", label: "Virtual Accounts", icon: Icons.creditCard },
  { id: "deposit_addresses", label: "Deposit Addresses", icon: Icons.arrowDown },
  { id: "payout_accounts", label: "Payout Accounts", icon: Icons.building },
  { id: "address_book", label: "Address Book", icon: Icons.bookmark },
  { id: "transactions", label: "Transactions", icon: Icons.receipt },
];

// ─── Main Manager ─────────────────────────────────────────────────────────────

export function WalletsManager({
  initialWallets,
  initialVirtualAccounts,
  initialDepositAddresses,
  initialPayoutAccounts,
  initialAddressBook,
  initialTransactions,
}: {
  initialWallets: PlatformWallet[];
  initialVirtualAccounts: VirtualAccount[];
  initialDepositAddresses: DepositAddress[];
  initialPayoutAccounts: PayoutAccount[];
  initialAddressBook: AddressBookEntry[];
  initialTransactions: PlatformTransaction[];
}) {
  const [wallets, setWallets] = React.useState(initialWallets);
  const [virtualAccounts, setVirtualAccounts] = React.useState(initialVirtualAccounts);
  const [depositAddresses, setDepositAddresses] = React.useState(initialDepositAddresses);
  const [payoutAccounts, setPayoutAccounts] = React.useState(initialPayoutAccounts);
  const [tab, setTab] = React.useState<Tab>("wallets");

  const summary = getWalletsSummary(wallets, virtualAccounts, depositAddresses, payoutAccounts, initialAddressBook);

  function toggleWalletActive(w: PlatformWallet) {
    setWallets(prev => prev.map(x => x.id === w.id ? { ...x, isActive: !x.isActive } : x));
  }

  function toggleVAActive(v: VirtualAccount) {
    setVirtualAccounts(prev => prev.map(x => x.id === v.id ? { ...x, isActive: !x.isActive } : x));
  }

  function toggleDepositActive(d: DepositAddress) {
    setDepositAddresses(prev => prev.map(x => x.id === d.id ? { ...x, isActive: !x.isActive } : x));
  }

  function togglePayoutVerified(p: PayoutAccount) {
    setPayoutAccounts(prev => prev.map(x => x.id === p.id ? { ...x, isVerified: !x.isVerified } : x));
  }

  const kpis = [
    { label: "Wallets", sub: `${summary.activeWallets} active`, value: summary.totalWallets, icon: Icons.layers },
    { label: "Virtual Accounts", sub: `${summary.activeVirtualAccounts} active`, value: summary.totalVirtualAccounts, icon: Icons.creditCard },
    { label: "Deposit Addresses", sub: `${summary.activeDepositAddresses} active`, value: summary.totalDepositAddresses, icon: Icons.arrowDown },
    { label: "Payout Accounts", sub: `${summary.verifiedPayoutAccounts} verified`, value: summary.totalPayoutAccounts, icon: Icons.building },
    { label: "Address Book", sub: `${summary.whitelistedAddressEntries} whitelisted`, value: summary.totalAddressBookEntries, icon: Icons.bookmark },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map(({ label, sub, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-line bg-paper-raised px-4 py-3">
            <Icon className="size-4 shrink-0 text-ink-muted" />
            <div className="min-w-0">
              <p className="text-lg font-semibold text-ink">{value}</p>
              <p className="truncate text-xs text-ink-muted">{label}</p>
              <p className="text-xs text-ink-subtle">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-paper-sunken p-1">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-paper-raised text-ink shadow-sm"
                : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === "wallets" && (
        <WalletsPanel
          wallets={wallets}
          onToggleActive={toggleWalletActive}
          virtualAccounts={virtualAccounts}
          depositAddresses={depositAddresses}
          transactions={initialTransactions}
        />
      )}
      {tab === "virtual_accounts" && <VirtualAccountsPanel accounts={virtualAccounts} onToggleActive={toggleVAActive} />}
      {tab === "deposit_addresses" && <DepositAddressesPanel addresses={depositAddresses} onToggleActive={toggleDepositActive} />}
      {tab === "payout_accounts" && <PayoutAccountsPanel accounts={payoutAccounts} onToggleVerified={togglePayoutVerified} />}
      {tab === "address_book" && <AddressBookPanel entries={initialAddressBook} />}
      {tab === "transactions" && <TransactionsPanel transactions={initialTransactions} />}
    </div>
  );
}
