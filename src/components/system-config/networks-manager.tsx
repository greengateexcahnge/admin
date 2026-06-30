"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  getNetworkSummary,
  nextNetworkId,
  type Network,
} from "@/lib/data/networks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Dialog } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";

type DialogAction = "delete" | "deactivate" | "activate";

// ─── Inline toggle ────────────────────────────────────────────────────────────
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
        <span
          className={cn(
            "pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────
interface FormValues { code: string; name: string; confirmationsRequired: number; isActive: boolean }

function NetworkForm({
  initial,
  existingCodes,
  onSave,
  onCancel,
}: {
  initial?: FormValues;
  existingCodes: string[];
  onSave: (v: FormValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = React.useState<FormValues>(
    initial ?? { code: "", name: "", confirmationsRequired: 3, isActive: true }
  );
  const [touched, setTouched] = React.useState(false);

  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) =>
    setValues(prev => ({ ...prev, [k]: v }));

  const codeError =
    !values.code.trim() ? "Code is required" :
    !/^[a-z0-9_-]+$/.test(values.code) ? "Lowercase letters, numbers, _ and - only" :
    existingCodes.includes(values.code.trim()) ? "Code already exists" : null;

  const nameError = !values.name.trim() ? "Name is required" : null;
  const confsError = values.confirmationsRequired < 1 ? "Must be at least 1" : null;

  const errors = { code: codeError, name: nameError, confs: confsError };
  const hasErrors = Object.values(errors).some(Boolean);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!hasErrors) onSave({ ...values, code: values.code.trim(), name: values.name.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Network Code</label>
          <Input
            value={values.code}
            onChange={e => set("code", e.target.value.toLowerCase())}
            placeholder="e.g. solana"
            disabled={!!initial}
          />
          {touched && errors.code && <p className="mt-1 text-xs text-danger">{errors.code}</p>}
          {!initial && <p className="mt-1 text-xs text-ink-subtle">Unique identifier used internally. Cannot change after creation.</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Name</label>
          <Input
            value={values.name}
            onChange={e => set("name", e.target.value)}
            placeholder="e.g. Solana (SPL)"
          />
          {touched && errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Confirmations Required</label>
          <Input
            type="number"
            min={1}
            max={999}
            value={values.confirmationsRequired}
            onChange={e => set("confirmationsRequired", parseInt(e.target.value, 10) || 1)}
          />
          {touched && errors.confs && <p className="mt-1 text-xs text-danger">{errors.confs}</p>}
          <p className="mt-1 text-xs text-ink-subtle">Blocks required before a deposit is considered final.</p>
        </div>

        <ToggleRow label="Active" checked={values.isActive} onChange={v => set("isActive", v)} />
      </div>

      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? "Save changes" : "Add network"}</Button>
      </div>
    </form>
  );
}

// ─── Manager ──────────────────────────────────────────────────────────────────
export function NetworksManager({ initialNetworks }: { initialNetworks: Network[] }) {
  const [networks, setNetworks] = React.useState<Network[]>(initialNetworks);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Network | null>(null);
  const [dialogAction, setDialogAction] = React.useState<{ action: DialogAction; target: Network } | null>(null);

  const summary = getNetworkSummary(networks);

  const filtered = networks.filter(n => {
    const q = search.toLowerCase();
    if (q && !n.code.includes(q) && !n.name.toLowerCase().includes(q)) return false;
    if (statusFilter === "active" && !n.isActive) return false;
    if (statusFilter === "inactive" && n.isActive) return false;
    return true;
  });

  function openAdd() { setEditing(null); setSheetOpen(true); }
  function openEdit(n: Network) { setEditing(n); setSheetOpen(true); }
  function closeSheet() { setSheetOpen(false); setEditing(null); }

  function handleSave(v: { code: string; name: string; confirmationsRequired: number; isActive: boolean }) {
    if (editing) {
      setNetworks(prev => prev.map(n => n.id === editing.id ? { ...n, ...v } : n));
    } else {
      const next: Network = { id: nextNetworkId(), ...v };
      setNetworks(prev => [...prev, next]);
    }
    closeSheet();
  }

  function handleConfirm() {
    if (!dialogAction) return;
    const { action, target } = dialogAction;
    if (action === "delete") setNetworks(prev => prev.filter(n => n.id !== target.id));
    else setNetworks(prev => prev.map(n => n.id === target.id ? { ...n, isActive: action === "activate" } : n));
    setDialogAction(null);
  }

  const existingCodes = networks.filter(n => n.id !== editing?.id).map(n => n.code);

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: summary.total, icon: Icons.network },
          { label: "Active", value: summary.active, icon: Icons.checkCircle },
          { label: "Inactive", value: summary.total - summary.active, icon: Icons.xCircle },
          { label: "Avg Confs", value: networks.length ? Math.round(networks.reduce((s, n) => s + n.confirmationsRequired, 0) / networks.length) : 0, icon: Icons.hash },
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
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search networks…"
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Button onClick={openAdd} className="gap-2">
          <Icons.plus className="size-4" />
          Add Network
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Code</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Confirmations</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-ink-subtle">No networks found</td></tr>
            )}
            {filtered.map(n => (
              <tr key={n.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3 font-mono text-xs text-ink">{n.code}</td>
                <td className="px-4 py-3 font-medium text-ink">{n.name}</td>
                <td className="px-4 py-3 text-ink-muted">{n.confirmationsRequired} blocks</td>
                <td className="px-4 py-3">
                  <Badge tone={n.isActive ? "success" : "neutral"}>
                    {n.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(n)}
                      title="Edit"
                      className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink"
                    >
                      <Icons.edit className="size-4" />
                    </button>
                    <button
                      onClick={() => setDialogAction({ action: n.isActive ? "deactivate" : "activate", target: n })}
                      title={n.isActive ? "Deactivate" : "Activate"}
                      className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink"
                    >
                      {n.isActive ? <Icons.xCircle className="size-4" /> : <Icons.checkCircle className="size-4" />}
                    </button>
                    <button
                      onClick={() => setDialogAction({ action: "delete", target: n })}
                      title="Delete"
                      className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-danger/10 hover:text-danger"
                    >
                      <Icons.trash className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Sheet */}
      <Sheet
        open={sheetOpen}
        onClose={closeSheet}
        title={editing ? "Edit Network" : "Add Network"}
        description={editing ? `Editing "${editing.name}"` : "Register a new blockchain network."}
      >
        <NetworkForm
          initial={editing ? { code: editing.code, name: editing.name, confirmationsRequired: editing.confirmationsRequired, isActive: editing.isActive } : undefined}
          existingCodes={existingCodes}
          onSave={handleSave}
          onCancel={closeSheet}
        />
      </Sheet>

      {/* Confirm Dialog */}
      <Dialog
        open={!!dialogAction}
        onClose={() => setDialogAction(null)}
        title={
          dialogAction?.action === "delete" ? "Delete Network" :
          dialogAction?.action === "deactivate" ? "Deactivate Network" : "Activate Network"
        }
        description={
          dialogAction?.action === "delete"
            ? `Permanently delete "${dialogAction.target.name}"? This cannot be undone.`
            : dialogAction?.action === "deactivate"
            ? `Disable deposits and withdrawals on ${dialogAction?.target.name}?`
            : `Re-enable ${dialogAction?.target.name} for deposits and withdrawals?`
        }
        tone={dialogAction?.action === "delete" ? "danger" : dialogAction?.action === "deactivate" ? "warning" : "neutral"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogAction(null)}>Cancel</Button>
            <Button
              variant={dialogAction?.action === "delete" ? "danger" : "primary"}
              onClick={handleConfirm}
            >
              {dialogAction?.action === "delete" ? "Delete" : dialogAction?.action === "deactivate" ? "Deactivate" : "Activate"}
            </Button>
          </>
        }
      />
    </div>
  );
}
