"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  getAssetNetworkSummary,
  nextAssetNetworkId,
  type AssetNetwork,
} from "@/lib/data/asset-networks";
import type { Asset } from "@/lib/data/assets";
import type { Network } from "@/lib/data/networks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Dialog } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";

type DialogAction = "delete" | "deactivate" | "activate";

type FormValues = {
  assetId: string; networkId: string; contractAddress: string;
  minDeposit: string; minWithdrawal: string; withdrawalFee: string; isActive: boolean;
};

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-primary" : "bg-line-strong",
        )}
      >
        <span className={cn("pointer-events-none block size-4 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-4" : "translate-x-0")} />
      </button>
    </div>
  );
}

function AssetNetworkForm({
  initial,
  assets,
  networks,
  existingPairs,
  onSave,
  onCancel,
}: {
  initial?: AssetNetwork;
  assets: Asset[];
  networks: Network[];
  existingPairs: Array<[string, string]>;
  onSave: (v: FormValues & { assetSymbol: string; networkCode: string; networkName: string }) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = React.useState<FormValues>({
    assetId: initial?.assetId ?? "",
    networkId: initial?.networkId ?? "",
    contractAddress: initial?.contractAddress ?? "",
    minDeposit: initial?.minDeposit?.toString() ?? "",
    minWithdrawal: initial?.minWithdrawal?.toString() ?? "",
    withdrawalFee: initial?.withdrawalFee?.toString() ?? "",
    isActive: initial?.isActive ?? true,
  });
  const [touched, setTouched] = React.useState(false);

  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) =>
    setValues(prev => ({ ...prev, [k]: v }));

  const pairDuplicate = !initial &&
    existingPairs.some(([aId, nId]) => aId === values.assetId && nId === values.networkId);

  const errors = {
    asset: !values.assetId ? "Asset is required" : null,
    network: !values.networkId ? "Network is required" : null,
    pair: pairDuplicate ? "This asset-network pair already exists" : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) return;
    const asset = assets.find(a => a.id === values.assetId)!;
    const network = networks.find(n => n.id === values.networkId)!;
    onSave({
      ...values,
      assetSymbol: asset.symbol,
      networkCode: network.code,
      networkName: network.name,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Asset</label>
          <select
            value={values.assetId}
            onChange={e => set("assetId", e.target.value)}
            disabled={!!initial}
            className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink disabled:opacity-60"
          >
            <option value="">Select asset…</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.symbol} — {a.name}</option>)}
          </select>
          {touched && errors.asset && <p className="mt-1 text-xs text-danger">{errors.asset}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Network</label>
          <select
            value={values.networkId}
            onChange={e => set("networkId", e.target.value)}
            disabled={!!initial}
            className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink disabled:opacity-60"
          >
            <option value="">Select network…</option>
            {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          {touched && (errors.network || errors.pair) && (
            <p className="mt-1 text-xs text-danger">{errors.network ?? errors.pair}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Contract Address <span className="text-ink-subtle">(optional)</span></label>
          <Input
            value={values.contractAddress}
            onChange={e => set("contractAddress", e.target.value)}
            placeholder="0x… or T… for native assets leave blank"
            className="font-mono text-xs"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "minDeposit" as const, label: "Min Deposit" },
            { key: "minWithdrawal" as const, label: "Min Withdrawal" },
            { key: "withdrawalFee" as const, label: "Withdrawal Fee" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
              <Input
                type="number"
                step="any"
                min={0}
                value={values[key]}
                onChange={e => set(key, e.target.value)}
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <ToggleRow label="Active" checked={values.isActive} onChange={v => set("isActive", v)} />
      </div>

      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? "Save changes" : "Add pair"}</Button>
      </div>
    </form>
  );
}

function truncateAddr(addr: string | null): string {
  if (!addr) return "—";
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export function AssetNetworksManager({
  initialRows,
  assets,
  networks,
}: {
  initialRows: AssetNetwork[];
  assets: Asset[];
  networks: Network[];
}) {
  const [rows, setRows] = React.useState<AssetNetwork[]>(initialRows);
  const [search, setSearch] = React.useState("");
  const [assetFilter, setAssetFilter] = React.useState("all");
  const [networkFilter, setNetworkFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AssetNetwork | null>(null);
  const [dialogAction, setDialogAction] = React.useState<{ action: DialogAction; target: AssetNetwork } | null>(null);

  const summary = getAssetNetworkSummary(rows);

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.assetSymbol.toLowerCase().includes(q) && !r.networkName.toLowerCase().includes(q) && !(r.contractAddress ?? "").toLowerCase().includes(q)) return false;
    if (assetFilter !== "all" && r.assetSymbol !== assetFilter) return false;
    if (networkFilter !== "all" && r.networkCode !== networkFilter) return false;
    if (statusFilter === "active" && !r.isActive) return false;
    if (statusFilter === "inactive" && r.isActive) return false;
    return true;
  });

  function openAdd() { setEditing(null); setSheetOpen(true); }
  function openEdit(r: AssetNetwork) { setEditing(r); setSheetOpen(true); }
  function closeSheet() { setSheetOpen(false); setEditing(null); }

  function handleSave(v: FormValues & { assetSymbol: string; networkCode: string; networkName: string }) {
    const toNum = (s: string) => s === "" ? null : parseFloat(s);
    if (editing) {
      setRows(prev => prev.map(r => r.id === editing.id ? {
        ...r,
        contractAddress: v.contractAddress || null,
        minDeposit: toNum(v.minDeposit),
        minWithdrawal: toNum(v.minWithdrawal),
        withdrawalFee: toNum(v.withdrawalFee),
        isActive: v.isActive,
      } : r));
    } else {
      setRows(prev => [...prev, {
        id: nextAssetNetworkId(),
        assetId: v.assetId,
        assetSymbol: v.assetSymbol,
        networkId: v.networkId,
        networkCode: v.networkCode,
        networkName: v.networkName,
        contractAddress: v.contractAddress || null,
        minDeposit: toNum(v.minDeposit),
        minWithdrawal: toNum(v.minWithdrawal),
        withdrawalFee: toNum(v.withdrawalFee),
        isActive: v.isActive,
      }]);
    }
    closeSheet();
  }

  function handleConfirm() {
    if (!dialogAction) return;
    const { action, target } = dialogAction;
    if (action === "delete") setRows(prev => prev.filter(r => r.id !== target.id));
    else setRows(prev => prev.map(r => r.id === target.id ? { ...r, isActive: action === "activate" } : r));
    setDialogAction(null);
  }

  const existingPairs: Array<[string, string]> = rows
    .filter(r => r.id !== editing?.id)
    .map(r => [r.assetId, r.networkId]);

  const uniqueSymbols = [...new Set(rows.map(r => r.assetSymbol))].sort();
  const uniqueNetCodes = [...new Set(rows.map(r => r.networkCode))].sort();

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Pairs", value: summary.total, icon: Icons.link },
          { label: "Active", value: summary.active, icon: Icons.checkCircle },
          { label: "Inactive", value: summary.total - summary.active, icon: Icons.xCircle },
          { label: "Assets Covered", value: new Set(rows.map(r => r.assetId)).size, icon: Icons.coins },
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-9" />
        </div>
        <select value={assetFilter} onChange={e => setAssetFilter(e.target.value)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All assets</option>
          {uniqueSymbols.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={networkFilter} onChange={e => setNetworkFilter(e.target.value)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All networks</option>
          {uniqueNetCodes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Button onClick={openAdd} className="gap-2">
          <Icons.plus className="size-4" />
          Add Pair
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Asset</th>
              <th className="px-4 py-3 text-left font-medium">Network</th>
              <th className="px-4 py-3 text-left font-medium">Contract</th>
              <th className="px-4 py-3 text-left font-medium">Min Deposit</th>
              <th className="px-4 py-3 text-left font-medium">Min Withdrawal</th>
              <th className="px-4 py-3 text-left font-medium">Fee</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-ink-subtle">No asset-network pairs found</td></tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3">
                  <span className="font-medium text-ink">{r.assetSymbol}</span>
                </td>
                <td className="px-4 py-3 text-ink-muted">{r.networkName}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-ink-muted" title={r.contractAddress ?? undefined}>{truncateAddr(r.contractAddress)}</span>
                </td>
                <td className="px-4 py-3 text-ink-muted">{r.minDeposit ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{r.minWithdrawal ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{r.withdrawalFee ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={r.isActive ? "success" : "neutral"}>{r.isActive ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(r)} title="Edit" className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink">
                      <Icons.edit className="size-4" />
                    </button>
                    <button onClick={() => setDialogAction({ action: r.isActive ? "deactivate" : "activate", target: r })} title={r.isActive ? "Deactivate" : "Activate"} className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink">
                      {r.isActive ? <Icons.xCircle className="size-4" /> : <Icons.checkCircle className="size-4" />}
                    </button>
                    <button onClick={() => setDialogAction({ action: "delete", target: r })} title="Delete" className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-danger/10 hover:text-danger">
                      <Icons.trash className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onClose={closeSheet} title={editing ? "Edit Asset Network" : "Add Asset Network"} description={editing ? `Editing ${editing.assetSymbol} on ${editing.networkName}` : "Link an asset to a network with routing rules."}>
        <AssetNetworkForm
          initial={editing ?? undefined}
          assets={assets}
          networks={networks}
          existingPairs={existingPairs}
          onSave={handleSave}
          onCancel={closeSheet}
        />
      </Sheet>

      <Dialog
        open={!!dialogAction}
        onClose={() => setDialogAction(null)}
        title={dialogAction?.action === "delete" ? "Remove Pair" : dialogAction?.action === "deactivate" ? "Disable Route" : "Enable Route"}
        description={
          dialogAction?.action === "delete"
            ? `Remove ${dialogAction.target.assetSymbol} on ${dialogAction.target.networkName}? This cannot be undone.`
            : dialogAction?.action === "deactivate"
            ? `Disable ${dialogAction.target.assetSymbol} deposits and withdrawals on ${dialogAction.target.networkName}?`
            : `Re-enable ${dialogAction?.target.assetSymbol} on ${dialogAction?.target.networkName}?`
        }
        tone={dialogAction?.action === "delete" ? "danger" : dialogAction?.action === "deactivate" ? "warning" : "neutral"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogAction(null)}>Cancel</Button>
            <Button
              variant={dialogAction?.action === "delete" ? "danger" : "primary"}
              onClick={handleConfirm}
            >
              {dialogAction?.action === "delete" ? "Remove" : dialogAction?.action === "deactivate" ? "Disable" : "Enable"}
            </Button>
          </>
        }
      />
    </div>
  );
}

