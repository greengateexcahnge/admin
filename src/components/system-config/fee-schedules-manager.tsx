"use client";

import * as React from "react";
import {
  getFeeScheduleSummary,
  nextFeeScheduleId,
  TXN_TYPES,
  TXN_TYPE_LABELS,
  type FeeSchedule,
  type TxnType,
  type KycTier,
} from "@/lib/data/fee-schedules";
import type { Asset } from "@/lib/data/assets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Dialog } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";

const KYC_TIERS: KycTier[] = ["tier0", "tier1", "tier2", "tier3"];

function pct(v: number): string { return v === 0 ? "0%" : `${(v * 100).toFixed(4).replace(/\.?0+$/, "")}%`; }

function FeeScheduleForm({
  initial,
  assets,
  onSave,
  onCancel,
}: {
  initial?: FeeSchedule;
  assets: Asset[];
  onSave: (v: Partial<FeeSchedule>) => void;
  onCancel: () => void;
}) {
  const [txnType, setTxnType] = React.useState<TxnType>(initial?.txnType ?? "fiat_deposit");
  const [assetId, setAssetId] = React.useState(initial?.assetId ?? "");
  const [assetSymbol, setAssetSymbol] = React.useState(initial?.assetSymbol ?? "");
  const [tier, setTier] = React.useState<string>(initial?.tier ?? "");
  const [flatFee, setFlatFee] = React.useState(initial?.flatFee?.toString() ?? "0");
  const [percentFee, setPercentFee] = React.useState(((initial?.percentFee ?? 0) * 100).toString());
  const [minFee, setMinFee] = React.useState(initial?.minFee?.toString() ?? "");
  const [maxFee, setMaxFee] = React.useState(initial?.maxFee?.toString() ?? "");
  const [effectiveFrom, setEffectiveFrom] = React.useState(initial?.effectiveFrom?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [effectiveTo, setEffectiveTo] = React.useState(initial?.effectiveTo?.slice(0, 10) ?? "");

  function handleAssetChange(id: string) {
    setAssetId(id);
    setAssetSymbol(assets.find(a => a.id === id)?.symbol ?? "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      txnType,
      assetId: assetId || null,
      assetSymbol: assetSymbol || null,
      tier: (tier as KycTier) || null,
      flatFee: parseFloat(flatFee) || 0,
      percentFee: (parseFloat(percentFee) || 0) / 100,
      minFee: minFee ? parseFloat(minFee) : null,
      maxFee: maxFee ? parseFloat(maxFee) : null,
      effectiveFrom: new Date(effectiveFrom).toISOString(),
      effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Transaction Type</label>
          <select value={txnType} onChange={e => setTxnType(e.target.value as TxnType)} className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
            {TXN_TYPES.map(t => <option key={t} value={t}>{TXN_TYPE_LABELS[t]}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Asset <span className="text-ink-subtle">(optional)</span></label>
            <select value={assetId} onChange={e => handleAssetChange(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
              <option value="">All assets</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.symbol}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">KYC Tier <span className="text-ink-subtle">(optional)</span></label>
            <select value={tier} onChange={e => setTier(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
              <option value="">All tiers</option>
              {KYC_TIERS.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Flat Fee</label>
            <Input type="number" step="any" min={0} value={flatFee} onChange={e => setFlatFee(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Percent Fee (%)</label>
            <Input type="number" step="any" min={0} max={100} value={percentFee} onChange={e => setPercentFee(e.target.value)} placeholder="0" />
            <p className="mt-1 text-xs text-ink-subtle">Enter 0.5 for 0.5%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Min Fee <span className="text-ink-subtle">(optional)</span></label>
            <Input type="number" step="any" min={0} value={minFee} onChange={e => setMinFee(e.target.value)} placeholder="none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Max Fee <span className="text-ink-subtle">(optional)</span></label>
            <Input type="number" step="any" min={0} value={maxFee} onChange={e => setMaxFee(e.target.value)} placeholder="none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Effective From</label>
            <Input type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Effective To <span className="text-ink-subtle">(optional)</span></label>
            <Input type="date" value={effectiveTo} onChange={e => setEffectiveTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? "Save changes" : "Add schedule"}</Button>
      </div>
    </form>
  );
}

export function FeeSchedulesManager({ initialRows, assets }: { initialRows: FeeSchedule[]; assets: Asset[] }) {
  const [rows, setRows] = React.useState<FeeSchedule[]>(initialRows);
  const [txnFilter, setTxnFilter] = React.useState("all");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FeeSchedule | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<FeeSchedule | null>(null);

  const summary = getFeeScheduleSummary(rows);

  const filtered = rows.filter(r => txnFilter === "all" || r.txnType === txnFilter);

  function handleSave(v: Partial<FeeSchedule>) {
    if (editing) {
      setRows(prev => prev.map(r => r.id === editing.id ? { ...r, ...v } : r));
    } else {
      setRows(prev => [...prev, { id: nextFeeScheduleId(), ...v } as FeeSchedule]);
    }
    setSheetOpen(false);
    setEditing(null);
  }

  function closeSheet() { setSheetOpen(false); setEditing(null); }
  function openEdit(r: FeeSchedule) { setEditing(r); setSheetOpen(true); }
  function openAdd() { setEditing(null); setSheetOpen(true); }

  const isActive = (r: FeeSchedule) => !r.effectiveTo || new Date(r.effectiveTo) > new Date();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: summary.total, icon: Icons.percent },
          { label: "Active", value: summary.active, icon: Icons.checkCircle },
          { label: "Expired", value: summary.total - summary.active, icon: Icons.xCircle },
          { label: "Txn Types", value: new Set(rows.map(r => r.txnType)).size, icon: Icons.tag },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-line bg-paper-raised px-4 py-3">
            <Icon className="size-4 text-ink-muted" />
            <div>
              <p className="text-lg font-semibold text-ink">{value}</p>
              <p className="text-xs text-ink-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={txnFilter} onChange={e => setTxnFilter(e.target.value)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All types</option>
          {TXN_TYPES.map(t => <option key={t} value={t}>{TXN_TYPE_LABELS[t]}</option>)}
        </select>
        <Button onClick={openAdd} className="ml-auto gap-2">
          <Icons.plus className="size-4" />
          Add Schedule
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Txn Type</th>
              <th className="px-4 py-3 text-left font-medium">Asset</th>
              <th className="px-4 py-3 text-left font-medium">Tier</th>
              <th className="px-4 py-3 text-left font-medium">Flat Fee</th>
              <th className="px-4 py-3 text-left font-medium">% Fee</th>
              <th className="px-4 py-3 text-left font-medium">Min / Max</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-ink-subtle">No fee schedules found</td></tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-paper-sunken px-2 py-0.5 text-xs font-medium text-ink-muted">
                    {TXN_TYPE_LABELS[r.txnType]}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-muted">{r.assetSymbol ?? <span className="text-ink-subtle italic">all</span>}</td>
                <td className="px-4 py-3 text-ink-muted">{r.tier ? r.tier.toUpperCase() : <span className="text-ink-subtle italic">all</span>}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink">{r.flatFee === 0 ? "—" : r.flatFee}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink">{pct(r.percentFee)}</td>
                <td className="px-4 py-3 text-xs text-ink-muted">
                  {r.minFee != null ? `≥ ${r.minFee}` : "—"} {r.maxFee != null ? `/ ≤ ${r.maxFee}` : ""}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={isActive(r) ? "success" : "neutral"}>{isActive(r) ? "Active" : "Expired"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(r)} title="Edit" className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink">
                      <Icons.edit className="size-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(r)} title="Delete" className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-danger/10 hover:text-danger">
                      <Icons.trash className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onClose={closeSheet} title={editing ? "Edit Fee Schedule" : "Add Fee Schedule"} description={editing ? `Editing ${TXN_TYPE_LABELS[editing.txnType]}` : "Define a fee rule for a transaction type."}>
        <FeeScheduleForm initial={editing ?? undefined} assets={assets} onSave={handleSave} onCancel={closeSheet} />
      </Sheet>

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Schedule"
        description={`Delete this ${deleteTarget ? TXN_TYPE_LABELS[deleteTarget.txnType] : ""} fee schedule? This cannot be undone.`}
        tone="danger"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => {
              if (deleteTarget) setRows(prev => prev.filter(r => r.id !== deleteTarget.id));
              setDeleteTarget(null);
            }}>Delete</Button>
          </>
        }
      />
    </div>
  );
}
