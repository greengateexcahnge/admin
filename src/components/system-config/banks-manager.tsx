"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getBankSummary, nextBankId, type Bank } from "@/lib/data/banks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Dialog } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";

type DialogAction = "delete" | "deactivate" | "activate";

const PAGE_SIZE = 10;

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

function BankForm({
  initial,
  existingCodes,
  onSave,
  onCancel,
}: {
  initial?: Bank;
  existingCodes: string[];
  onSave: (v: Omit<Bank, "id">) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = React.useState(initial?.code ?? "");
  const [name, setName] = React.useState(initial?.name ?? "");
  const [isActive, setIsActive] = React.useState(initial?.isActive ?? true);
  const [touched, setTouched] = React.useState(false);

  const codeError =
    !code.trim() ? "Code is required" :
    code.length > 10 ? "Max 10 characters" :
    existingCodes.includes(code.trim().toUpperCase()) ? "Code already exists" : null;

  const nameError = !name.trim() ? "Name is required" : null;
  const hasErrors = !!(codeError || nameError);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!hasErrors) onSave({ code: code.trim().toUpperCase(), name: name.trim(), isActive });
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">CBN / NIP Code</label>
          <Input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="e.g. 044"
            disabled={!!initial}
            maxLength={10}
            className="font-mono"
          />
          {touched && codeError && <p className="mt-1 text-xs text-danger">{codeError}</p>}
          {!initial && <p className="mt-1 text-xs text-ink-subtle">Unique interbank routing code. Cannot change after creation.</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Bank Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Access Bank" />
          {touched && nameError && <p className="mt-1 text-xs text-danger">{nameError}</p>}
        </div>

        <ToggleRow label="Active" checked={isActive} onChange={setIsActive} />
      </div>

      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? "Save changes" : "Add bank"}</Button>
      </div>
    </form>
  );
}

export function BanksManager({ initialBanks }: { initialBanks: Bank[] }) {
  const [banks, setBanks] = React.useState<Bank[]>(initialBanks);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = React.useState(0);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Bank | null>(null);
  const [dialogAction, setDialogAction] = React.useState<{ action: DialogAction; target: Bank } | null>(null);

  const summary = getBankSummary(banks);

  const filtered = banks.filter(b => {
    const q = search.toLowerCase();
    if (q && !b.name.toLowerCase().includes(q) && !b.code.toLowerCase().includes(q)) return false;
    if (statusFilter === "active" && !b.isActive) return false;
    if (statusFilter === "inactive" && b.isActive) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePageI = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePageI * PAGE_SIZE, (safePageI + 1) * PAGE_SIZE);

  React.useEffect(() => { setPage(0); }, [search, statusFilter]);

  function closeSheet() { setSheetOpen(false); setEditing(null); }

  function handleSave(v: Omit<Bank, "id">) {
    if (editing) {
      setBanks(prev => prev.map(b => b.id === editing.id ? { ...b, ...v } : b));
    } else {
      setBanks(prev => [...prev, { id: nextBankId(), ...v }]);
    }
    closeSheet();
  }

  function handleConfirm() {
    if (!dialogAction) return;
    const { action, target } = dialogAction;
    if (action === "delete") setBanks(prev => prev.filter(b => b.id !== target.id));
    else setBanks(prev => prev.map(b => b.id === target.id ? { ...b, isActive: action === "activate" } : b));
    setDialogAction(null);
  }

  const existingCodes = banks.filter(b => b.id !== editing?.id).map(b => b.code.toUpperCase());

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Banks", value: summary.total, icon: Icons.landmark },
          { label: "Active", value: summary.active, icon: Icons.checkCircle },
          { label: "Inactive", value: summary.total - summary.active, icon: Icons.xCircle },
          { label: "NIP Enabled", value: banks.filter(b => b.isActive).length, icon: Icons.creditCard },
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
        <div className="relative flex-1 min-w-48">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search banks…" className="pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Button onClick={() => { setEditing(null); setSheetOpen(true); }} className="gap-2">
          <Icons.plus className="size-4" />
          Add Bank
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Code</th>
              <th className="px-4 py-3 text-left font-medium">Bank Name</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.length === 0 && (
              <tr><td colSpan={4} className="py-12 text-center text-ink-subtle">No banks found</td></tr>
            )}
            {paged.map(b => (
              <tr key={b.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3 font-mono text-xs font-medium text-ink">{b.code}</td>
                <td className="px-4 py-3 font-medium text-ink">{b.name}</td>
                <td className="px-4 py-3">
                  <Badge tone={b.isActive ? "success" : "neutral"}>{b.isActive ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setEditing(b); setSheetOpen(true); }} title="Edit" className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink">
                      <Icons.edit className="size-4" />
                    </button>
                    <button onClick={() => setDialogAction({ action: b.isActive ? "deactivate" : "activate", target: b })} title={b.isActive ? "Deactivate" : "Activate"} className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink">
                      {b.isActive ? <Icons.xCircle className="size-4" /> : <Icons.checkCircle className="size-4" />}
                    </button>
                    <button onClick={() => setDialogAction({ action: "delete", target: b })} title="Delete" className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-danger/10 hover:text-danger">
                      <Icons.trash className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span>{filtered.length} banks · page {safePageI + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={safePageI === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
              <Icons.chevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" disabled={safePageI >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>
              <Icons.chevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Sheet open={sheetOpen} onClose={closeSheet} title={editing ? "Edit Bank" : "Add Bank"} description={editing ? `Editing "${editing.name}"` : "Register a new Nigerian bank."}>
        <BankForm initial={editing ?? undefined} existingCodes={existingCodes} onSave={handleSave} onCancel={closeSheet} />
      </Sheet>

      <Dialog
        open={!!dialogAction}
        onClose={() => setDialogAction(null)}
        title={dialogAction?.action === "delete" ? "Delete Bank" : dialogAction?.action === "deactivate" ? "Deactivate Bank" : "Activate Bank"}
        description={
          dialogAction?.action === "delete"
            ? `Permanently delete "${dialogAction.target.name}" (${dialogAction.target.code})?`
            : dialogAction?.action === "deactivate"
            ? `Disable withdrawals to ${dialogAction?.target.name}?`
            : `Re-enable ${dialogAction?.target.name}?`
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
