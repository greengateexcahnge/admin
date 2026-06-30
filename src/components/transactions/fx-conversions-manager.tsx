"use client";

import * as React from "react";
import { cn, formatDate } from "@/lib/utils";
import {
  type FxConversion, type TxnStatus,
  TXN_STATUS_LABELS, TXN_STATUS_TONE,
  nextFxId, summarize,
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
const ALL_USERS = getUsers().filter(u => u.status === "active");
const FX_RATES: Record<string, number> = { USD: 1620, EUR: 1750, GBP: 2050, CAD: 1200 };
const FOREIGN_CURRENCIES = ["USD", "EUR", "GBP", "CAD"] as const;

function fmtFiat(amount: number, symbol: string) {
  const prefix = symbol === "NGN" ? "₦" : symbol === "USD" ? "$" : symbol === "EUR" ? "€" : symbol === "GBP" ? "£" : symbol === "CAD" ? "CA$" : "";
  return `${prefix}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function KpiCard({ title, value, tone }: { title: string; value: number; tone?: "success" | "warning" | "danger" }) {
  const colors = { success: "text-success", warning: "text-warning", danger: "text-danger" };
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-paper-raised p-4">
      <p className="text-xs font-medium text-ink-muted">{title}</p>
      <p className={cn("text-2xl font-bold text-ink", tone && colors[tone])}>{value}</p>
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
        <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}><Icons.chevronLeft className="size-4" /></Button>
        <span>{page + 1} / {pages}</span>
        <Button variant="ghost" size="sm" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}><Icons.chevronRight className="size-4" /></Button>
      </div>
    </div>
  );
}

function CreateForm({ onSave, onCancel }: { onSave: (v: FxConversion) => void; onCancel: () => void }) {
  const [userId, setUserId] = React.useState(ALL_USERS[0]?.id ?? "");
  const [foreignSym, setForeignSym] = React.useState<typeof FOREIGN_CURRENCIES[number]>("USD");
  const [side, setSide] = React.useState<"buy" | "sell">("buy");
  const [ngnAmount, setNgnAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  const user = ALL_USERS.find(u => u.id === userId);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const rate = FX_RATES[foreignSym]!;
  const ngnNum = parseFloat(ngnAmount);
  const foreignAmount = isNaN(ngnNum) ? 0 : Math.round((ngnNum / rate) * 100) / 100;
  const fromSym = side === "buy" ? "NGN" : foreignSym;
  const toSym   = side === "buy" ? foreignSym : "NGN";
  const fromAmount = side === "buy" ? ngnNum : foreignAmount;
  const toAmount   = side === "buy" ? foreignAmount : ngnNum;
  const fee = isNaN(ngnNum) ? 0 : Math.round(ngnNum * 0.015 * 100) / 100;
  const amtErr = !ngnAmount ? "Required" : isNaN(ngnNum) || ngnNum <= 0 ? "Must be positive" : null;

  function handle(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!!amtErr || !user) return;
    const id = nextFxId();
    const now = new Date().toISOString();
    onSave({
      id, reference: `GG-FX-${id.slice(3)}`,
      userId: user.id, userName: user.name, userEmail: user.email,
      walletId: `wallet-${user.id.slice(0, 8)}`,
      status: "pending", assetSymbol: fromSym, assetKind: "fiat",
      amount: fromAmount, fee, netAmount: fromAmount - fee,
      description: description.trim() || null, failureReason: null,
      initiatedAt: now, completedAt: null, createdAt: now,
      fromSymbol: fromSym, toSymbol: toSym, side, fromAmount, toAmount, rate,
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Foreign Currency</label>
            <select value={foreignSym} onChange={e => setForeignSym(e.target.value as typeof foreignSym)} className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
              {FOREIGN_CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Side</label>
            <select value={side} onChange={e => setSide(e.target.value as "buy" | "sell")} className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
              <option value="buy">Buy {foreignSym} (spend NGN)</option>
              <option value="sell">Sell {foreignSym} (receive NGN)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">NGN Equivalent</label>
          <Input value={ngnAmount} onChange={e => setNgnAmount(e.target.value)} placeholder="100000.00" type="number" min="0" step="0.01" />
          {touched && amtErr && <p className="mt-1 text-xs text-danger">{amtErr}</p>}
        </div>
        {!isNaN(ngnNum) && ngnNum > 0 && (
          <div className="rounded-lg border border-line bg-paper-sunken px-3 py-2.5 text-sm">
            <p className="text-ink-muted">Conversion summary</p>
            <p className="font-mono font-medium text-ink">{fmtFiat(fromAmount, fromSym)} → {fmtFiat(toAmount, toSym)}</p>
            <p className="mt-0.5 text-xs text-ink-subtle">Rate: 1 {foreignSym} = ₦{rate.toLocaleString()} · FX fee (1.5%): ₦{fee.toLocaleString()}</p>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Description <span className="font-normal text-ink-subtle">(optional)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Execute Conversion</Button>
      </div>
    </form>
  );
}

function EditForm({ record, onSave, onCancel }: { record: FxConversion; onSave: (d: string | null) => void; onCancel: () => void }) {
  const [description, setDescription] = React.useState(record.description ?? "");
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(description.trim() || null); }} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-paper-sunken px-4 py-3 text-sm">
          <div className="flex justify-between"><span className="text-ink-muted">Reference</span><span className="font-mono text-ink">{record.reference}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">User</span><span className="text-ink">{record.userName}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Side</span><Badge tone={record.side === "buy" ? "success" : "warning"}>{record.side === "buy" ? "Buy" : "Sell"} {record.toSymbol === "NGN" ? record.fromSymbol : record.toSymbol}</Badge></div>
          <div className="flex justify-between"><span className="text-ink-muted">From</span><span className="font-mono text-ink">{fmtFiat(record.fromAmount, record.fromSymbol)}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">To</span><span className="font-mono text-ink">{fmtFiat(record.toAmount, record.toSymbol)}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Rate</span><span className="font-mono text-ink">{record.rate.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Status</span><Badge tone={TXN_STATUS_TONE[record.status]}>{TXN_STATUS_LABELS[record.status]}</Badge></div>
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

export function FxConversionsManager({ initialConversions }: { initialConversions: FxConversion[] }) {
  const [records, setRecords] = React.useState(initialConversions);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<TxnStatus | "all">("all");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [sideFilter, setSideFilter] = React.useState<"all" | "buy" | "sell">("all");
  const [page, setPage] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<FxConversion | null>(null);
  const [actionTarget, setActionTarget] = React.useState<{ record: FxConversion; action: "approve" | "reject" | "cancel" | "reverse" } | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  const summary = summarize(records);

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.reference.toLowerCase().includes(q) && !r.userName.toLowerCase().includes(q) && !r.fromSymbol.toLowerCase().includes(q) && !r.toSymbol.toLowerCase().includes(q)) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!inDateRange(r.createdAt, dateRange)) return false;
    if (sideFilter !== "all" && r.side !== sideFilter) return false;
    return true;
  });
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  React.useEffect(() => setPage(0), [search, statusFilter, sideFilter, dateRange]);

  function handleCreate(v: FxConversion) { setRecords(r => [v, ...r]); setCreateOpen(false); }
  function handleEdit(d: string | null) {
    if (!editTarget) return;
    setRecords(r => r.map(x => x.id === editTarget.id ? { ...x, description: d } : x));
    setEditTarget(null);
  }
  function handleAction() {
    if (!actionTarget) return;
    const { record, action } = actionTarget;
    const now = new Date().toISOString();
    setRecords(r => r.map(x => {
      if (x.id !== record.id) return x;
      if (action === "approve") return { ...x, status: "completed" as TxnStatus, completedAt: now };
      if (action === "reject")  return { ...x, status: "failed" as TxnStatus, failureReason: rejectReason || "Rejected by admin" };
      if (action === "cancel")  return { ...x, status: "cancelled" as TxnStatus };
      if (action === "reverse") return { ...x, status: "reversed" as TxnStatus };
      return x;
    }));
    setActionTarget(null); setRejectReason("");
  }

  const canApprove = (s: TxnStatus) => ["pending", "initiated", "requires_action"].includes(s);
  const canReject  = (s: TxnStatus) => ["pending", "initiated", "processing", "requires_action"].includes(s);
  const canCancel  = (s: TxnStatus) => ["pending", "initiated"].includes(s);
  const canReverse = (s: TxnStatus) => s === "completed";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard title="Total Conversions" value={summary.total} />
        <KpiCard title="Pending" value={summary.pending} tone="warning" />
        <KpiCard title="Completed" value={summary.completed} tone="success" />
        <KpiCard title="Failed / Cancelled" value={summary.failed} tone="danger" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reference, user, currency…" className="pl-9" />
        </div>
        <select value={sideFilter} onChange={e => setSideFilter(e.target.value as typeof sideFilter)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All sides</option>
          <option value="buy">Buy foreign</option>
          <option value="sell">Sell foreign</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All statuses</option>
          {(Object.keys(TXN_STATUS_LABELS) as TxnStatus[]).map(s => <option key={s} value={s}>{TXN_STATUS_LABELS[s]}</option>)}
        </select>
        <DateRangeFilter onChange={setDateRange} />
        <Button onClick={() => setCreateOpen(true)}><Icons.plus className="size-4" />New conversion</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Reference</th>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Side</th>
              <th className="px-4 py-3 text-left font-medium">Pair</th>
              <th className="px-4 py-3 text-right font-medium">From</th>
              <th className="px-4 py-3 text-right font-medium">To</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-ink-subtle">No FX conversions found</td></tr>}
            {paged.map(r => (
              <tr key={r.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3 font-mono text-xs text-ink">{r.reference}</td>
                <td className="px-4 py-3"><p className="font-medium text-ink">{r.userName}</p><p className="text-xs text-ink-muted">{r.userEmail}</p></td>
                <td className="px-4 py-3"><Badge tone={r.side === "buy" ? "success" : "warning"}>{r.side}</Badge></td>
                <td className="px-4 py-3 text-ink">{r.fromSymbol} → {r.toSymbol}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-ink">{fmtFiat(r.fromAmount, r.fromSymbol)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-ink">{fmtFiat(r.toAmount, r.toSymbol)}</td>
                <td className="px-4 py-3"><Badge tone={TXN_STATUS_TONE[r.status]}>{TXN_STATUS_LABELS[r.status]}</Badge></td>
                <td className="px-4 py-3 text-xs text-ink-muted">{formatDate(r.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {canApprove(r.status) && <button onClick={() => setActionTarget({ record: r, action: "approve" })} title="Approve" className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-success/10 hover:text-success"><Icons.checkCircle className="size-4" /></button>}
                    {canReject(r.status)  && <button onClick={() => setActionTarget({ record: r, action: "reject" })} title="Reject" className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-danger/10 hover:text-danger"><Icons.xCircle className="size-4" /></button>}
                    {canCancel(r.status)  && <button onClick={() => setActionTarget({ record: r, action: "cancel" })} title="Cancel" className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink"><Icons.ban className="size-4" /></button>}
                    {canReverse(r.status) && <button onClick={() => setActionTarget({ record: r, action: "reverse" })} title="Reverse" className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-warning/10 hover:text-warning"><Icons.refresh className="size-4" /></button>}
                    <button onClick={() => setEditTarget(r)} title="Edit note" className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink"><Icons.edit className="size-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager total={filtered.length} page={page} onPage={setPage} />

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="New FX Conversion" description="Buy or sell a foreign currency against NGN">
        <CreateForm onSave={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Sheet>
      <Sheet open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Conversion" description={editTarget?.reference}>
        {editTarget && <EditForm record={editTarget} onSave={handleEdit} onCancel={() => setEditTarget(null)} />}
      </Sheet>

      {actionTarget && actionTarget.action !== "reject" && (
        <Dialog open onClose={() => setActionTarget(null)} tone={actionTarget.action === "reverse" || actionTarget.action === "cancel" ? "warning" : "neutral"}
          title={actionTarget.action === "approve" ? "Approve Conversion" : actionTarget.action === "cancel" ? "Cancel Conversion" : "Reverse Conversion"}
          description={`${actionTarget.action === "approve" ? "Approve" : actionTarget.action === "cancel" ? "Cancel" : "Reverse"} ${actionTarget.record.reference}?`}
          footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setActionTarget(null)}>No, keep it</Button><Button variant={actionTarget.action === "approve" ? "primary" : "ghost"} className={cn(actionTarget.action !== "approve" && "text-warning hover:bg-warning/10 hover:text-warning")} onClick={handleAction}>{actionTarget.action === "approve" ? "Approve" : actionTarget.action === "cancel" ? "Cancel" : "Reverse"}</Button></div>}
        />
      )}
      {actionTarget?.action === "reject" && (
        <Dialog open onClose={() => setActionTarget(null)} tone="danger" title="Reject Conversion" description={`Reject ${actionTarget.record.reference}?`}
          footer={<div className="flex flex-col gap-3"><textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Failure reason…" rows={2} className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink resize-none" /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setActionTarget(null)}>Cancel</Button><Button variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger" onClick={handleAction}>Reject</Button></div></div>}
        />
      )}
    </div>
  );
}
