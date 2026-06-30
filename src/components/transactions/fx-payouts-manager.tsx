"use client";

import * as React from "react";
import { cn, formatDate } from "@/lib/utils";
import {
  type FxPayout, type TxnStatus,
  TXN_STATUS_LABELS, TXN_STATUS_TONE,
  nextFpId, summarize,
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
const FP_PROVIDERS = ["grey", "flutterwave", "chipper", "manual"];
const FX_RATES: Record<string, number> = { USD: 1620, EUR: 1750, GBP: 2050, CAD: 1200 };
const FOREIGN_CURRENCIES = ["USD", "EUR", "GBP", "CAD"] as const;

function fmtNgn(n: number) {
  return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtForeign(amount: number, symbol: string) {
  const prefix = symbol === "USD" ? "$" : symbol === "EUR" ? "€" : symbol === "GBP" ? "£" : symbol === "CAD" ? "CA$" : "";
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

function CreateForm({ onSave, onCancel }: { onSave: (v: FxPayout) => void; onCancel: () => void }) {
  const [userId, setUserId] = React.useState(ALL_USERS[0]?.id ?? "");
  const [foreignSym, setForeignSym] = React.useState<typeof FOREIGN_CURRENCIES[number]>("USD");
  const [ngnAmount, setNgnAmount] = React.useState("");
  const [beneficiaryName, setBeneficiaryName] = React.useState("");
  const [beneficiaryBank, setBeneficiaryBank] = React.useState("");
  const [beneficiaryAccount, setBeneficiaryAccount] = React.useState("");
  const [swiftCode, setSwiftCode] = React.useState("");
  const [bankCountry, setBankCountry] = React.useState("US");
  const [provider, setProvider] = React.useState(FP_PROVIDERS[0]);
  const [description, setDescription] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  const user = ALL_USERS.find(u => u.id === userId);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const rate = FX_RATES[foreignSym]!;
  const ngnNum = parseFloat(ngnAmount);
  const foreignAmount = isNaN(ngnNum) ? 0 : Math.round((ngnNum / rate) * 100) / 100;
  const fee = isNaN(ngnNum) ? 0 : Math.round(ngnNum * 0.02 * 100) / 100;

  const amtErr = !ngnAmount ? "Required" : isNaN(ngnNum) || ngnNum <= 0 ? "Must be positive" : null;
  const benNameErr = !beneficiaryName.trim() ? "Required" : null;
  const benBankErr = !beneficiaryBank.trim() ? "Required" : null;
  const benAccErr = !beneficiaryAccount.trim() ? "Required" : null;
  const swiftErr = !swiftCode.trim() ? "Required" : !/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swiftCode.trim().toUpperCase()) ? "Invalid SWIFT/BIC format" : null;
  const hasErr = !!(amtErr || benNameErr || benBankErr || benAccErr || swiftErr);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (hasErr || !user) return;
    const id = nextFpId();
    const now = new Date().toISOString();
    onSave({
      id,
      reference: `GG-FP-${id.slice(3)}`,
      userId: user.id, userName: user.name, userEmail: user.email,
      walletId: `wallet-${user.id.slice(0, 8)}`,
      status: "pending", assetSymbol: "NGN", assetKind: "fiat",
      amount: ngnNum, fee, netAmount: ngnNum - fee,
      description: description.trim() || null, failureReason: null,
      initiatedAt: now, completedAt: null, createdAt: now,
      fromSymbol: "NGN", toSymbol: foreignSym,
      fromAmount: ngnNum, toAmount: foreignAmount, rate,
      beneficiaryName: beneficiaryName.trim().toUpperCase(),
      beneficiaryBank: beneficiaryBank.trim(),
      beneficiaryAccount: beneficiaryAccount.trim(),
      swiftCode: swiftCode.trim().toUpperCase(),
      bankCountry: bankCountry.trim().toUpperCase(),
      provider: provider ?? "manual",
      providerRef: null,
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
            <label className="mb-1 block text-sm font-medium text-ink">Payout Currency</label>
            <select value={foreignSym} onChange={e => setForeignSym(e.target.value as typeof foreignSym)} className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
              {FOREIGN_CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Provider</label>
            <select value={provider} onChange={e => setProvider(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink capitalize">
              {FP_PROVIDERS.map(p => <option key={p} className="capitalize">{p}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">NGN Amount to Debit</label>
          <Input value={ngnAmount} onChange={e => setNgnAmount(e.target.value)} placeholder="500000.00" type="number" min="0" step="0.01" />
          {touched && amtErr && <p className="mt-1 text-xs text-danger">{amtErr}</p>}
        </div>
        {!isNaN(ngnNum) && ngnNum > 0 && (
          <div className="rounded-lg border border-line bg-paper-sunken px-3 py-2.5 text-sm">
            <p className="text-ink-muted">Payout summary</p>
            <p className="font-mono font-medium text-ink">{fmtNgn(ngnNum)} → {fmtForeign(foreignAmount, foreignSym)}</p>
            <p className="mt-0.5 text-xs text-ink-subtle">Rate: 1 {foreignSym} = ₦{rate.toLocaleString()} · Transfer fee (2%): {fmtNgn(fee)}</p>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Beneficiary Name</label>
          <Input value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} placeholder="JOHN ADAMU" />
          {touched && benNameErr && <p className="mt-1 text-xs text-danger">{benNameErr}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Beneficiary Bank</label>
          <Input value={beneficiaryBank} onChange={e => setBeneficiaryBank(e.target.value)} placeholder="JPMorgan Chase" />
          {touched && benBankErr && <p className="mt-1 text-xs text-danger">{benBankErr}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">IBAN / Account Number</label>
          <Input value={beneficiaryAccount} onChange={e => setBeneficiaryAccount(e.target.value)} placeholder="US12345678901234567890" />
          {touched && benAccErr && <p className="mt-1 text-xs text-danger">{benAccErr}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">SWIFT / BIC</label>
            <Input value={swiftCode} onChange={e => setSwiftCode(e.target.value)} placeholder="CHASUS33XXX" className="uppercase" />
            {touched && swiftErr && <p className="mt-1 text-xs text-danger">{swiftErr}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Bank Country</label>
            <Input value={bankCountry} onChange={e => setBankCountry(e.target.value)} placeholder="US" maxLength={2} className="uppercase" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Description <span className="font-normal text-ink-subtle">(optional)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Initiate Payout</Button>
      </div>
    </form>
  );
}

function EditForm({ record, onSave, onCancel }: { record: FxPayout; onSave: (d: string | null) => void; onCancel: () => void }) {
  const [description, setDescription] = React.useState(record.description ?? "");
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(description.trim() || null); }} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-paper-sunken px-4 py-3 text-sm">
          <div className="flex justify-between"><span className="text-ink-muted">Reference</span><span className="font-mono text-ink">{record.reference}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">User</span><span className="text-ink">{record.userName}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">NGN Debited</span><span className="font-mono text-ink">{fmtNgn(record.fromAmount)}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Amount Sent</span><span className="font-mono text-ink">{fmtForeign(record.toAmount, record.toSymbol)}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Rate</span><span className="font-mono text-ink">1 {record.toSymbol} = ₦{record.rate.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Beneficiary</span><span className="text-ink">{record.beneficiaryName}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Bank</span><span className="text-ink">{record.beneficiaryBank}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Account</span><span className="font-mono text-xs text-ink-subtle truncate max-w-48">{record.beneficiaryAccount}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">SWIFT</span><span className="font-mono text-ink">{record.swiftCode}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Provider</span><span className="text-ink capitalize">{record.provider}</span></div>
          {record.providerRef && <div className="flex justify-between"><span className="text-ink-muted">Provider Ref</span><span className="font-mono text-xs text-ink-subtle">{record.providerRef}</span></div>}
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

export function FxPayoutsManager({ initialPayouts }: { initialPayouts: FxPayout[] }) {
  const [records, setRecords] = React.useState(initialPayouts);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<TxnStatus | "all">("all");
  const [currencyFilter, setCurrencyFilter] = React.useState<string>("all");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [page, setPage] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<FxPayout | null>(null);
  const [actionTarget, setActionTarget] = React.useState<{ record: FxPayout; action: "approve" | "reject" | "cancel" | "reverse" } | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  const summary = summarize(records);

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.reference.toLowerCase().includes(q) && !r.userName.toLowerCase().includes(q) && !r.beneficiaryName.toLowerCase().includes(q) && !r.beneficiaryBank.toLowerCase().includes(q)) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!inDateRange(r.createdAt, dateRange)) return false;
    if (currencyFilter !== "all" && r.toSymbol !== currencyFilter) return false;
    return true;
  });
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  React.useEffect(() => setPage(0), [search, statusFilter, currencyFilter, dateRange]);

  function handleCreate(v: FxPayout) { setRecords(r => [v, ...r]); setCreateOpen(false); }
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
      if (action === "reject")  return { ...x, status: "failed" as TxnStatus, failureReason: rejectReason.trim() || "Rejected by admin" };
      if (action === "cancel")  return { ...x, status: "cancelled" as TxnStatus };
      if (action === "reverse") return { ...x, status: "reversed" as TxnStatus };
      return x;
    }));
    setActionTarget(null); setRejectReason("");
  }

  const canApprove = (s: TxnStatus) => ["pending", "initiated", "processing", "requires_action"].includes(s);
  const canReject  = (s: TxnStatus) => ["pending", "initiated", "processing", "requires_action"].includes(s);
  const canCancel  = (s: TxnStatus) => ["pending", "initiated"].includes(s);
  const canReverse = (s: TxnStatus) => s === "completed";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard title="Total Payouts" value={summary.total} />
        <KpiCard title="Pending" value={summary.pending} tone="warning" />
        <KpiCard title="Completed" value={summary.completed} tone="success" />
        <KpiCard title="Failed / Cancelled" value={summary.failed} tone="danger" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reference, user, beneficiary…" className="pl-9" />
        </div>
        <select value={currencyFilter} onChange={e => setCurrencyFilter(e.target.value)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All currencies</option>
          {FOREIGN_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All statuses</option>
          {(Object.keys(TXN_STATUS_LABELS) as TxnStatus[]).map(s => <option key={s} value={s}>{TXN_STATUS_LABELS[s]}</option>)}
        </select>
        <DateRangeFilter onChange={setDateRange} />
        <Button onClick={() => setCreateOpen(true)}><Icons.plus className="size-4" />New payout</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Reference</th>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Beneficiary</th>
              <th className="px-4 py-3 text-right font-medium">NGN Debited</th>
              <th className="px-4 py-3 text-right font-medium">Amount Sent</th>
              <th className="px-4 py-3 text-left font-medium">Provider</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-ink-subtle">No FX payouts found</td></tr>}
            {paged.map(r => (
              <tr key={r.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3 font-mono text-xs text-ink">{r.reference}</td>
                <td className="px-4 py-3"><p className="font-medium text-ink">{r.userName}</p><p className="text-xs text-ink-muted">{r.userEmail}</p></td>
                <td className="px-4 py-3">
                  <p className="text-ink">{r.beneficiaryName}</p>
                  <p className="text-xs text-ink-muted">{r.beneficiaryBank} · {r.swiftCode}</p>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-ink">{fmtNgn(r.fromAmount)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-medium text-ink">{fmtForeign(r.toAmount, r.toSymbol)}</td>
                <td className="px-4 py-3 capitalize text-ink-muted">{r.provider}</td>
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

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="New FX Payout" description="International wire transfer from NGN wallet">
        <CreateForm onSave={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Sheet>
      <Sheet open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit FX Payout" description={editTarget?.reference}>
        {editTarget && <EditForm record={editTarget} onSave={handleEdit} onCancel={() => setEditTarget(null)} />}
      </Sheet>

      {actionTarget && actionTarget.action !== "reject" && (
        <Dialog open onClose={() => setActionTarget(null)} tone={actionTarget.action === "reverse" || actionTarget.action === "cancel" ? "warning" : "neutral"}
          title={actionTarget.action === "approve" ? "Approve Payout" : actionTarget.action === "cancel" ? "Cancel Payout" : "Reverse Payout"}
          description={actionTarget.action === "approve" ? `Process ${actionTarget.record.reference} (${fmtNgn(actionTarget.record.fromAmount)} → ${fmtForeign(actionTarget.record.toAmount, actionTarget.record.toSymbol)})?` : actionTarget.action === "cancel" ? `Cancel ${actionTarget.record.reference}?` : `Reverse ${actionTarget.record.reference}?`}
          footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setActionTarget(null)}>No, keep it</Button><Button variant={actionTarget.action === "approve" ? "primary" : "ghost"} className={cn(actionTarget.action !== "approve" && "text-warning hover:bg-warning/10 hover:text-warning")} onClick={handleAction}>{actionTarget.action === "approve" ? "Approve" : actionTarget.action === "cancel" ? "Cancel payout" : "Reverse"}</Button></div>}
        />
      )}
      {actionTarget?.action === "reject" && (
        <Dialog open onClose={() => setActionTarget(null)} tone="danger" title="Reject Payout" description={`Reject ${actionTarget.record.reference}?`}
          footer={<div className="flex flex-col gap-3"><textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Failure reason…" rows={2} className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink resize-none" /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setActionTarget(null)}>Cancel</Button><Button variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger" onClick={handleAction}>Reject</Button></div></div>}
        />
      )}
    </div>
  );
}
