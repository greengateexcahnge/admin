"use client";

import * as React from "react";
import { cn, formatDate } from "@/lib/utils";
import {
  type FiatDeposit, type TxnStatus,
  TXN_STATUS_LABELS, TXN_STATUS_TONE, TERMINAL,
  nextFdId, summarize,
} from "@/lib/data/transactions-data";
import { getUsers } from "@/lib/data/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Dialog } from "@/components/ui/dialog";
import { DateRangeFilter, DateRange, inDateRange } from "@/components/ui/date-filter";
import { Icons } from "@/components/icons";

const PAGE_SIZE = 15;
const ALL_USERS = getUsers().filter(u => u.status === "active" || u.status === "pending");
const FD_PROVIDERS = ["anchor", "flutterwave", "paystack", "manual"];
const BANKS = [
  "Access Bank","GTBank","First Bank","Zenith Bank","UBA",
  "Opay","Kuda MFB","Stanbic IBTC","FCMB","Sterling Bank",
];

function fmtNgn(n: number) {
  return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, tone }: {
  title: string; value: number | string; sub?: string;
  tone?: "success" | "warning" | "danger" | "info";
}) {
  const colors: Record<string, string> = {
    success: "text-success", warning: "text-warning", danger: "text-danger", info: "text-info",
  };
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-paper-raised p-4">
      <p className="text-xs font-medium text-ink-muted">{title}</p>
      <p className={cn("text-2xl font-bold text-ink", tone && colors[tone])}>{value}</p>
      {sub && <p className="text-xs text-ink-subtle">{sub}</p>}
    </div>
  );
}

function Pager({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-ink-muted">
      <span>{total} records</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>
          <Icons.chevronLeft className="size-4" />
        </Button>
        <span>{page + 1} / {pages}</span>
        <Button variant="ghost" size="sm" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
          <Icons.chevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function CreateForm({ onSave, onCancel }: {
  onSave: (v: FiatDeposit) => void;
  onCancel: () => void;
}) {
  const [userId, setUserId] = React.useState(ALL_USERS[0]?.id ?? "");
  const [amount, setAmount] = React.useState("");
  const [sourceAccountName, setSourceAccountName] = React.useState("");
  const [sourceAccountNumber, setSourceAccountNumber] = React.useState("");
  const [sourceBank, setSourceBank] = React.useState(BANKS[0]);
  const [provider, setProvider] = React.useState(FD_PROVIDERS[0]);
  const [description, setDescription] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  const user = ALL_USERS.find(u => u.id === userId);
  const amountNum = parseFloat(amount);
  const amtErr = !amount.trim() ? "Required" : isNaN(amountNum) || amountNum <= 0 ? "Must be positive" : null;
  const nameErr = !sourceAccountName.trim() ? "Required" : null;
  const numErr = !sourceAccountNumber.trim() ? "Required" : !/^\d{10}$/.test(sourceAccountNumber) ? "Must be 10 digits" : null;
  const hasErr = !!(amtErr || nameErr || numErr);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (hasErr || !user) return;
    const id = nextFdId();
    const now = new Date().toISOString();
    const fee = Math.round(amountNum * 0.005 * 100) / 100;
    onSave({
      id,
      reference: `GG-FD-${id.slice(3)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      walletId: `wallet-${user.id.slice(0, 8)}`,
      status: "pending",
      assetSymbol: "NGN",
      assetKind: "fiat",
      amount: amountNum,
      fee,
      netAmount: amountNum - fee,
      description: description.trim() || null,
      failureReason: null,
      initiatedAt: now,
      completedAt: null,
      createdAt: now,
      sourceAccountName: sourceAccountName.trim(),
      sourceAccountNumber: sourceAccountNumber.trim(),
      sourceBank: sourceBank ?? BANKS[0] ?? "Access Bank",
      provider: provider ?? "manual",
      providerRef: `${(provider ?? "manual").toUpperCase()}-MANUAL${Date.now()}`,
      sessionId: null,
    });
  }

  return (
    <form onSubmit={handle} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">User</label>
          <select value={userId} onChange={e => setUserId(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
            {ALL_USERS.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Amount (NGN)</label>
          <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="50000.00" type="number" min="1" step="0.01" />
          {touched && amtErr && <p className="mt-1 text-xs text-danger">{amtErr}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Source Account Name</label>
          <Input value={sourceAccountName} onChange={e => setSourceAccountName(e.target.value)} placeholder="JOHN ADAMU" />
          {touched && nameErr && <p className="mt-1 text-xs text-danger">{nameErr}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Source Account Number</label>
          <Input value={sourceAccountNumber} onChange={e => setSourceAccountNumber(e.target.value)} placeholder="0123456789" maxLength={10} />
          {touched && numErr && <p className="mt-1 text-xs text-danger">{numErr}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Source Bank</label>
          <select value={sourceBank} onChange={e => setSourceBank(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
            {BANKS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Provider</label>
          <select value={provider} onChange={e => setProvider(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink capitalize">
            {FD_PROVIDERS.map(p => <option key={p} className="capitalize">{p}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Description <span className="text-ink-subtle font-normal">(optional)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Internal note…" className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Create Deposit</Button>
      </div>
    </form>
  );
}

function EditForm({ record, onSave, onCancel }: {
  record: FiatDeposit;
  onSave: (description: string | null) => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = React.useState(record.description ?? "");
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(description.trim() || null); }} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-paper-sunken px-4 py-3 text-sm">
          <div className="flex justify-between"><span className="text-ink-muted">Reference</span><span className="font-mono text-ink">{record.reference}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">User</span><span className="text-ink">{record.userName}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Amount</span><span className="font-mono text-ink">{fmtNgn(record.amount)}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Status</span><Badge tone={TXN_STATUS_TONE[record.status]}>{TXN_STATUS_LABELS[record.status]}</Badge></div>
          <div className="flex justify-between"><span className="text-ink-muted">Source Bank</span><span className="text-ink">{record.sourceBank}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Source Account</span><span className="font-mono text-ink">{record.sourceAccountNumber}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Provider</span><span className="text-ink capitalize">{record.provider}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Provider Ref</span><span className="font-mono text-xs text-ink-subtle">{record.providerRef}</span></div>
          {record.sessionId && <div className="flex justify-between"><span className="text-ink-muted">Session ID</span><span className="font-mono text-xs text-ink-subtle">{record.sessionId}</span></div>}
          <div className="flex justify-between"><span className="text-ink-muted">Created</span><span className="text-ink">{formatDate(record.createdAt)}</span></div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Description / Note</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Note</Button>
      </div>
    </form>
  );
}

// ─── Manager ──────────────────────────────────────────────────────────────────

export function FiatDepositsManager({ initialDeposits }: { initialDeposits: FiatDeposit[] }) {
  const [records, setRecords] = React.useState(initialDeposits);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<TxnStatus | "all">("all");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [page, setPage] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<FiatDeposit | null>(null);
  const [actionTarget, setActionTarget] = React.useState<{ record: FiatDeposit; action: "approve" | "reject" | "cancel" | "reverse" } | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  const summary = summarize(records);

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.reference.toLowerCase().includes(q) && !r.userName.toLowerCase().includes(q) && !r.userEmail.toLowerCase().includes(q) && !r.sourceBank.toLowerCase().includes(q)) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!inDateRange(r.createdAt, dateRange)) return false;
    return true;
  });
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  React.useEffect(() => setPage(0), [search, statusFilter, dateRange]);

  function handleCreate(v: FiatDeposit) {
    setRecords(r => [v, ...r]);
    setCreateOpen(false);
  }

  function handleEdit(description: string | null) {
    if (!editTarget) return;
    setRecords(r => r.map(x => x.id === editTarget.id ? { ...x, description } : x));
    setEditTarget(null);
  }

  function handleAction() {
    if (!actionTarget) return;
    const { record, action } = actionTarget;
    const now = new Date().toISOString();
    setRecords(r => r.map(x => {
      if (x.id !== record.id) return x;
      if (action === "approve")  return { ...x, status: "completed" as TxnStatus, completedAt: now };
      if (action === "reject")   return { ...x, status: "failed" as TxnStatus, failureReason: rejectReason.trim() || "Rejected by admin" };
      if (action === "cancel")   return { ...x, status: "cancelled" as TxnStatus };
      if (action === "reverse")  return { ...x, status: "reversed" as TxnStatus };
      return x;
    }));
    setActionTarget(null);
    setRejectReason("");
  }

  const canApprove  = (s: TxnStatus) => s === "pending" || s === "initiated" || s === "processing" || s === "requires_action";
  const canReject   = (s: TxnStatus) => s === "pending" || s === "initiated" || s === "processing" || s === "requires_action";
  const canCancel   = (s: TxnStatus) => s === "pending" || s === "initiated";
  const canReverse  = (s: TxnStatus) => s === "completed";

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard title="Total Deposits" value={summary.total} />
        <KpiCard title="Pending" value={summary.pending} tone="warning" />
        <KpiCard title="Completed" value={summary.completed} tone="success" />
        <KpiCard title="Failed / Cancelled" value={summary.failed} tone="danger" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reference, user, bank…" className="pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All statuses</option>
          {(Object.keys(TXN_STATUS_LABELS) as TxnStatus[]).map(s => <option key={s} value={s}>{TXN_STATUS_LABELS[s]}</option>)}
        </select>
        <DateRangeFilter onChange={setDateRange} />
        <Button onClick={() => setCreateOpen(true)}>
          <Icons.plus className="size-4" />New deposit
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Reference</th>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Source</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Provider</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-ink-subtle">No deposits found</td></tr>}
            {paged.map(r => (
              <tr key={r.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3 font-mono text-xs text-ink">{r.reference}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{r.userName}</p>
                  <p className="text-xs text-ink-muted">{r.userEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink">{r.sourceBank}</p>
                  <p className="font-mono text-xs text-ink-muted">{r.sourceAccountNumber}</p>
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-ink">{fmtNgn(r.amount)}</td>
                <td className="px-4 py-3 capitalize text-ink-muted">{r.provider}</td>
                <td className="px-4 py-3">
                  <Badge tone={TXN_STATUS_TONE[r.status]}>{TXN_STATUS_LABELS[r.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">{formatDate(r.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {canApprove(r.status) && (
                      <button onClick={() => setActionTarget({ record: r, action: "approve" })} title="Approve" className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-success/10 hover:text-success">
                        <Icons.checkCircle className="size-4" />
                      </button>
                    )}
                    {canReject(r.status) && (
                      <button onClick={() => setActionTarget({ record: r, action: "reject" })} title="Reject" className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-danger/10 hover:text-danger">
                        <Icons.xCircle className="size-4" />
                      </button>
                    )}
                    {canCancel(r.status) && (
                      <button onClick={() => setActionTarget({ record: r, action: "cancel" })} title="Cancel" className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink">
                        <Icons.ban className="size-4" />
                      </button>
                    )}
                    {canReverse(r.status) && (
                      <button onClick={() => setActionTarget({ record: r, action: "reverse" })} title="Reverse" className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-warning/10 hover:text-warning">
                        <Icons.refresh className="size-4" />
                      </button>
                    )}
                    <button onClick={() => setEditTarget(r)} title="Edit note" className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink">
                      <Icons.edit className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager total={filtered.length} page={page} onPage={setPage} />

      {/* Create sheet */}
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="New Fiat Deposit" description="Manually record a bank transfer deposit">
        <CreateForm onSave={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Sheet>

      {/* Edit sheet */}
      <Sheet open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Deposit" description={editTarget?.reference}>
        {editTarget && <EditForm record={editTarget} onSave={handleEdit} onCancel={() => setEditTarget(null)} />}
      </Sheet>

      {/* Action dialogs */}
      {actionTarget && actionTarget.action !== "reject" && (
        <Dialog
          open
          onClose={() => setActionTarget(null)}
          tone={actionTarget.action === "reverse" || actionTarget.action === "cancel" ? "warning" : "neutral"}
          title={actionTarget.action === "approve" ? "Approve Deposit" : actionTarget.action === "cancel" ? "Cancel Deposit" : "Reverse Deposit"}
          description={
            actionTarget.action === "approve"
              ? `Mark ${actionTarget.record.reference} (${fmtNgn(actionTarget.record.amount)}) as completed?`
              : actionTarget.action === "cancel"
              ? `Cancel ${actionTarget.record.reference}? This cannot be undone.`
              : `Reverse ${actionTarget.record.reference}? This will trigger a compensating ledger entry.`
          }
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setActionTarget(null)}>No, keep it</Button>
              <Button variant={actionTarget.action === "approve" ? "primary" : "ghost"} className={cn(actionTarget.action !== "approve" && "text-warning hover:bg-warning/10 hover:text-warning")} onClick={handleAction}>
                {actionTarget.action === "approve" ? "Approve" : actionTarget.action === "cancel" ? "Cancel deposit" : "Reverse"}
              </Button>
            </div>
          }
        />
      )}
      {actionTarget?.action === "reject" && (
        <Dialog
          open
          onClose={() => setActionTarget(null)}
          tone="danger"
          title="Reject Deposit"
          description={`Mark ${actionTarget.record.reference} as failed?`}
          footer={
            <div className="flex flex-col gap-3">
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Failure reason (optional)…" rows={2} className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setActionTarget(null)}>Cancel</Button>
                <Button variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger" onClick={handleAction}>Reject</Button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
