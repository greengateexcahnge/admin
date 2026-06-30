"use client";

import * as React from "react";
import { formatDate } from "@/lib/utils";
import {
  getSecuritySummary,
  nextLockId,
  nextRestrictionId,
  RESTRICTION_KIND_LABELS,
  RESTRICTION_KIND_DESC,
  RESTRICTION_KINDS,
  type AccountLock,
  type SecurityRestriction,
  type RestrictionKind,
} from "@/lib/data/security-data";
import { getUsers } from "@/lib/data/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Dialog } from "@/components/ui/dialog";
import { DateRangeFilter, DateRange, inDateRange } from "@/components/ui/date-filter";
import { Icons } from "@/components/icons";

const RESTRICTION_TONE: Record<RestrictionKind, "warning" | "danger"> = {
  pnd: "warning",
  pnc: "warning",
  full_freeze: "danger",
};

const ALL_USERS = getUsers().map(u => ({ id: u.id, name: u.name, email: u.email }));

// ─── Textarea ────────────────────────────────────────────────────────────────

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-md border border-line-strong bg-paper-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised"
    />
  );
}

// ─── Add Lock Form ────────────────────────────────────────────────────────────

function AddLockForm({
  onSave,
  onCancel,
}: {
  onSave: (lock: AccountLock) => void;
  onCancel: () => void;
}) {
  const [userId, setUserId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [lockedUntil, setLockedUntil] = React.useState("");
  const [placedBy, setPlacedBy] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  const userError = !userId ? "Select a user" : null;
  const reasonError = !reason.trim() ? "Reason is required" : null;
  const hasErrors = !!(userError || reasonError);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) return;
    const user = ALL_USERS.find(u => u.id === userId)!;
    onSave({
      id: nextLockId(),
      userId,
      userName: user.name,
      userEmail: user.email,
      reason: reason.trim(),
      lockedUntil: lockedUntil ? new Date(lockedUntil).toISOString() : null,
      lockedBy: placedBy.trim() || null,
      createdAt: new Date().toISOString(),
      liftedAt: null,
      liftedBy: null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">User</label>
          <select
            value={userId}
            onChange={e => setUserId(e.target.value)}
            className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
          >
            <option value="">Select a user…</option>
            {ALL_USERS.map(u => (
              <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
            ))}
          </select>
          {touched && userError && <p className="mt-1 text-xs text-danger">{userError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Reason</label>
          <Textarea value={reason} onChange={setReason} placeholder="Describe why this account is being locked…" />
          {touched && reasonError && <p className="mt-1 text-xs text-danger">{reasonError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Lock Until <span className="text-ink-subtle">(optional)</span>
          </label>
          <Input type="datetime-local" value={lockedUntil} onChange={e => setLockedUntil(e.target.value)} />
          <p className="mt-1 text-xs text-ink-subtle">Leave blank for an indefinite lock requiring manual lift.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Placed By <span className="text-ink-subtle">(optional)</span>
          </label>
          <Input value={placedBy} onChange={e => setPlacedBy(e.target.value)} placeholder="e.g. Compliance Team" />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Lock Account</Button>
      </div>
    </form>
  );
}

// ─── Place Restriction Form ───────────────────────────────────────────────────

function PlaceRestrictionForm({
  onSave,
  onCancel,
}: {
  onSave: (r: SecurityRestriction) => void;
  onCancel: () => void;
}) {
  const [userId, setUserId] = React.useState("");
  const [kind, setKind] = React.useState<RestrictionKind>("pnd");
  const [reason, setReason] = React.useState("");
  const [placedBy, setPlacedBy] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  const userError = !userId ? "Select a user" : null;
  const reasonError = !reason.trim() ? "Reason is required" : null;
  const hasErrors = !!(userError || reasonError);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) return;
    const user = ALL_USERS.find(u => u.id === userId)!;
    onSave({
      id: nextRestrictionId(),
      userId,
      userName: user.name,
      userEmail: user.email,
      walletId: null,
      kind,
      reason: reason.trim(),
      placedBy: placedBy.trim() || null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      createdAt: new Date().toISOString(),
      liftedAt: null,
      liftedBy: null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">User</label>
          <select
            value={userId}
            onChange={e => setUserId(e.target.value)}
            className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
          >
            <option value="">Select a user…</option>
            {ALL_USERS.map(u => (
              <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
            ))}
          </select>
          {touched && userError && <p className="mt-1 text-xs text-danger">{userError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Restriction Type</label>
          <select
            value={kind}
            onChange={e => setKind(e.target.value as RestrictionKind)}
            className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
          >
            {RESTRICTION_KINDS.map(k => (
              <option key={k} value={k}>{RESTRICTION_KIND_LABELS[k]}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-ink-subtle">{RESTRICTION_KIND_DESC[kind]}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Reason</label>
          <Textarea value={reason} onChange={setReason} placeholder="Regulatory directive, AML flag, compliance hold…" />
          {touched && reasonError && <p className="mt-1 text-xs text-danger">{reasonError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Expires At <span className="text-ink-subtle">(optional)</span>
          </label>
          <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          <p className="mt-1 text-xs text-ink-subtle">Leave blank for no expiry — must be lifted manually.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Placed By <span className="text-ink-subtle">(optional)</span>
          </label>
          <Input value={placedBy} onChange={e => setPlacedBy(e.target.value)} placeholder="e.g. Compliance Team" />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Place Restriction</Button>
      </div>
    </form>
  );
}

// ─── Locks Panel ─────────────────────────────────────────────────────────────

function LocksPanel({
  locks,
  onLift,
  onAdd,
}: {
  locks: AccountLock[];
  onLift: (lock: AccountLock) => void;
  onAdd: (lock: AccountLock) => void;
}) {
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "lifted">("all");
  const [search, setSearch] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [liftTarget, setLiftTarget] = React.useState<AccountLock | null>(null);

  const filtered = locks.filter(l => {
    const q = search.toLowerCase();
    if (q && !l.userName.toLowerCase().includes(q) && !l.userEmail.toLowerCase().includes(q) && !l.reason.toLowerCase().includes(q)) return false;
    if (statusFilter === "active" && l.liftedAt) return false;
    if (statusFilter === "lifted" && !l.liftedAt) return false;
    if (!inDateRange(l.createdAt, dateRange)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user or reason…" className="pl-9" />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
        >
          <option value="all">All status</option>
          <option value="active">Active locks</option>
          <option value="lifted">Lifted</option>
        </select>
        <DateRangeFilter onChange={setDateRange} />
        <Button onClick={() => setSheetOpen(true)} className="gap-2">
          <Icons.plus className="size-4" />
          Add Lock
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Reason</th>
              <th className="px-4 py-3 text-left font-medium">Placed By</th>
              <th className="px-4 py-3 text-left font-medium">Locked Until</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-ink-subtle">No locks found</td>
              </tr>
            )}
            {sorted.map(lock => (
              <tr key={lock.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{lock.userName}</p>
                  <p className="text-xs text-ink-muted">{lock.userEmail}</p>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="truncate text-ink-muted" title={lock.reason}>{lock.reason}</p>
                </td>
                <td className="px-4 py-3 text-ink-muted">{lock.lockedBy ?? <span className="italic text-ink-subtle">System</span>}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {lock.liftedAt
                    ? <span className="text-ink-subtle">—</span>
                    : lock.lockedUntil
                    ? formatDate(lock.lockedUntil)
                    : <span className="text-warning text-xs font-medium">Indefinite</span>}
                </td>
                <td className="px-4 py-3">
                  {lock.liftedAt ? (
                    <div>
                      <Badge tone="neutral">Lifted</Badge>
                      <p className="mt-0.5 text-xs text-ink-subtle">{formatDate(lock.liftedAt)}</p>
                    </div>
                  ) : (
                    <Badge tone="danger">Active</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(lock.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    {!lock.liftedAt && (
                      <button
                        onClick={() => setLiftTarget(lock)}
                        title="Lift lock"
                        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:bg-success/10 hover:text-success"
                      >
                        <Icons.unlock className="size-3.5" />
                        Lift
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add Account Lock" description="Manually lock a user account.">
        <AddLockForm
          onSave={lock => { onAdd(lock); setSheetOpen(false); }}
          onCancel={() => setSheetOpen(false)}
        />
      </Sheet>

      <Dialog
        open={!!liftTarget}
        onClose={() => setLiftTarget(null)}
        title="Lift Account Lock"
        description={liftTarget ? `Remove the active lock on ${liftTarget.userName}'s account? They will regain full login access.` : ""}
        tone="warning"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLiftTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => { if (liftTarget) onLift(liftTarget); setLiftTarget(null); }}>
              Lift Lock
            </Button>
          </>
        }
      />
    </div>
  );
}

// ─── Restrictions Panel ───────────────────────────────────────────────────────

function RestrictionsPanel({
  restrictions,
  onLift,
  onPlace,
}: {
  restrictions: SecurityRestriction[];
  onLift: (r: SecurityRestriction) => void;
  onPlace: (r: SecurityRestriction) => void;
}) {
  const [kindFilter, setKindFilter] = React.useState<"all" | RestrictionKind>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "lifted">("all");
  const [search, setSearch] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [liftTarget, setLiftTarget] = React.useState<SecurityRestriction | null>(null);

  const filtered = restrictions.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.userName.toLowerCase().includes(q) && !r.userEmail.toLowerCase().includes(q) && !r.reason.toLowerCase().includes(q)) return false;
    if (kindFilter !== "all" && r.kind !== kindFilter) return false;
    if (statusFilter === "active" && r.liftedAt) return false;
    if (statusFilter === "lifted" && !r.liftedAt) return false;
    if (!inDateRange(r.createdAt, dateRange)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user or reason…" className="pl-9" />
        </div>
        <select
          value={kindFilter}
          onChange={e => setKindFilter(e.target.value as typeof kindFilter)}
          className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
        >
          <option value="all">All types</option>
          {RESTRICTION_KINDS.map(k => (
            <option key={k} value={k}>{RESTRICTION_KIND_LABELS[k]}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="lifted">Lifted</option>
        </select>
        <DateRangeFilter onChange={setDateRange} />
        <Button onClick={() => setSheetOpen(true)} className="gap-2">
          <Icons.plus className="size-4" />
          Place Restriction
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Reason</th>
              <th className="px-4 py-3 text-left font-medium">Placed By</th>
              <th className="px-4 py-3 text-left font-medium">Expires</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-ink-subtle">No restrictions found</td>
              </tr>
            )}
            {sorted.map(r => (
              <tr key={r.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{r.userName}</p>
                  <p className="text-xs text-ink-muted">{r.userEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={RESTRICTION_TONE[r.kind]}>{RESTRICTION_KIND_LABELS[r.kind]}</Badge>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="truncate text-ink-muted" title={r.reason}>{r.reason}</p>
                </td>
                <td className="px-4 py-3 text-ink-muted">{r.placedBy ?? <span className="italic text-ink-subtle">System</span>}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {r.liftedAt
                    ? <span className="text-ink-subtle">—</span>
                    : r.expiresAt
                    ? formatDate(r.expiresAt)
                    : <span className="text-warning text-xs font-medium">No expiry</span>}
                </td>
                <td className="px-4 py-3">
                  {r.liftedAt ? (
                    <div>
                      <Badge tone="neutral">Lifted</Badge>
                      <p className="mt-0.5 text-xs text-ink-subtle">{formatDate(r.liftedAt)}</p>
                    </div>
                  ) : (
                    <Badge tone="danger">Active</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(r.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    {!r.liftedAt && (
                      <button
                        onClick={() => setLiftTarget(r)}
                        title="Lift restriction"
                        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:bg-success/10 hover:text-success"
                      >
                        <Icons.unlock className="size-3.5" />
                        Lift
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Place Restriction" description="Apply a PND, PNC, or full freeze to a user account.">
        <PlaceRestrictionForm
          onSave={r => { onPlace(r); setSheetOpen(false); }}
          onCancel={() => setSheetOpen(false)}
        />
      </Sheet>

      <Dialog
        open={!!liftTarget}
        onClose={() => setLiftTarget(null)}
        title="Lift Restriction"
        description={
          liftTarget
            ? `Remove the ${RESTRICTION_KIND_LABELS[liftTarget.kind]} restriction on ${liftTarget.userName}'s account? All blocked transaction types will resume immediately.`
            : ""
        }
        tone="warning"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLiftTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => { if (liftTarget) onLift(liftTarget); setLiftTarget(null); }}>
              Lift Restriction
            </Button>
          </>
        }
      />
    </div>
  );
}

// ─── Main Manager ─────────────────────────────────────────────────────────────

export function SecurityManager({
  initialLocks,
  initialRestrictions,
}: {
  initialLocks: AccountLock[];
  initialRestrictions: SecurityRestriction[];
}) {
  const [locks, setLocks] = React.useState<AccountLock[]>(initialLocks);
  const [restrictions, setRestrictions] = React.useState<SecurityRestriction[]>(initialRestrictions);
  const [tab, setTab] = React.useState<"locks" | "restrictions">("locks");

  const summary = getSecuritySummary(locks, restrictions);

  function liftLock(lock: AccountLock) {
    setLocks(prev =>
      prev.map(l =>
        l.id === lock.id
          ? { ...l, liftedAt: new Date().toISOString(), liftedBy: "Admin (manual)" }
          : l,
      ),
    );
  }

  function addLock(lock: AccountLock) {
    setLocks(prev => [lock, ...prev]);
  }

  function liftRestriction(r: SecurityRestriction) {
    setRestrictions(prev =>
      prev.map(x =>
        x.id === r.id
          ? { ...x, liftedAt: new Date().toISOString(), liftedBy: "Admin (manual)" }
          : x,
      ),
    );
  }

  function addRestriction(r: SecurityRestriction) {
    setRestrictions(prev => [r, ...prev]);
  }

  const kpis = [
    {
      label: "Active Locks",
      value: summary.activeLocks,
      icon: Icons.lock,
      tone: summary.activeLocks > 0 ? "danger" : "neutral",
    },
    {
      label: "Active Restrictions",
      value: summary.activeRestrictions,
      icon: Icons.ban,
      tone: summary.activeRestrictions > 0 ? "danger" : "neutral",
    },
    {
      label: "Total Locks",
      value: summary.totalLocks,
      icon: Icons.shield,
      tone: "neutral",
    },
    {
      label: "Total Restrictions",
      value: summary.totalRestrictions,
      icon: Icons.shieldAlert,
      tone: "neutral",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
              tone === "danger"
                ? "border-danger/30 bg-danger/5"
                : "border-line bg-paper-raised"
            }`}
          >
            <Icon className={`size-4 shrink-0 ${tone === "danger" ? "text-danger" : "text-ink-muted"}`} />
            <div>
              <p className={`text-lg font-semibold ${tone === "danger" ? "text-danger" : "text-ink"}`}>{value}</p>
              <p className="text-xs text-ink-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-line bg-paper-sunken p-1 w-fit">
        {(["locks", "restrictions"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-paper-raised text-ink shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {t === "locks"
              ? `Account Locks (${summary.activeLocks} active)`
              : `Restrictions (${summary.activeRestrictions} active)`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "locks" ? (
        <LocksPanel locks={locks} onLift={liftLock} onAdd={addLock} />
      ) : (
        <RestrictionsPanel restrictions={restrictions} onLift={liftRestriction} onPlace={addRestriction} />
      )}
    </div>
  );
}
