"use client";

import * as React from "react";
import { cn, formatDate } from "@/lib/utils";
import {
  getAdminSummary,
  nextAdminId,
  ADMIN_ROLES,
  ROLE_LABELS,
  STATUS_LABELS,
  type AdminMember,
  type AdminRole,
  type AdminStatus,
} from "@/lib/data/admins";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Dialog } from "@/components/ui/dialog";
import { DateRangeFilter, DateRange, inDateRange } from "@/components/ui/date-filter";
import { Icons } from "@/components/icons";

// ─── Role / status styling ────────────────────────────────────────────────────

const ROLE_TONE: Record<AdminRole, BadgeTone> = {
  super_admin: "danger",
  admin: "info",
  support: "neutral",
  compliance: "warning",
  finance: "success",
  read_only: "neutral",
};

const ROLE_DOT: Record<AdminRole, string> = {
  super_admin: "bg-danger",
  admin: "bg-info",
  support: "bg-ink-subtle",
  compliance: "bg-warning",
  finance: "bg-success",
  read_only: "bg-ink-subtle",
};

const ROLE_STAT_BG: Record<AdminRole, string> = {
  super_admin: "bg-danger/10 border-danger/20",
  admin: "bg-info/10 border-info/20",
  support: "bg-paper-sunken border-line",
  compliance: "bg-warning/10 border-warning/20",
  finance: "bg-success/10 border-success/20",
  read_only: "bg-paper-sunken border-line",
};

const ROLE_STAT_TEXT: Record<AdminRole, string> = {
  super_admin: "text-danger",
  admin: "text-info",
  support: "text-ink-muted",
  compliance: "text-warning",
  finance: "text-success",
  read_only: "text-ink-muted",
};

const STATUS_TONE: Record<AdminStatus, BadgeTone> = {
  active: "success",
  suspended: "warning",
  disabled: "neutral",
};

const PAGE_SIZE = 10;

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
        <span className={cn("pointer-events-none block size-4 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-4" : "translate-x-0")} />
      </button>
    </div>
  );
}

// ─── Avatar initials ──────────────────────────────────────────────────────────
function AdminAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
  return (
    <span className={cn(
      "inline-grid shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary",
      size === "sm" ? "size-8 text-xs" : "size-10 text-sm",
    )}>
      {initials}
    </span>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────
interface AdminFormValues {
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  password: string;
}

function AdminForm({
  initial,
  existingEmails,
  onSave,
  onCancel,
}: {
  initial?: AdminMember;
  existingEmails: string[];
  onSave: (v: AdminFormValues) => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = React.useState(initial?.name ?? "");
  const [email, setEmail] = React.useState(initial?.email ?? "");
  const [role, setRole] = React.useState<AdminRole>(initial?.role ?? "read_only");
  const [status, setStatus] = React.useState<AdminStatus>(initial?.status ?? "active");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  const emailError =
    !email.trim() ? "Email is required" :
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Invalid email address" :
    existingEmails.includes(email.trim().toLowerCase()) ? "Email already in use" : null;

  const nameError = !name.trim() ? "Name is required" : null;
  const passwordError = !isEdit && !password ? "Password is required for new admins" :
    (!isEdit && password.length < 8) ? "Minimum 8 characters" : null;

  const hasErrors = !!(emailError || nameError || passwordError);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!hasErrors) onSave({ name: name.trim(), email: email.trim().toLowerCase(), role, status, password });
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Full Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amara Osei" />
          {touched && nameError && <p className="mt-1 text-xs text-danger">{nameError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Email Address</label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@greengate.ng"
          />
          {touched && emailError && <p className="mt-1 text-xs text-danger">{emailError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Role</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value as AdminRole)}
            className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
          >
            {ADMIN_ROLES.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-ink-subtle">
            {role === "super_admin" && "Full platform access including admin management."}
            {role === "admin" && "Full operational access. Cannot manage other admins."}
            {role === "support" && "User management and transaction queries only."}
            {role === "compliance" && "KYC reviews and compliance reporting."}
            {role === "finance" && "Fee schedules, exchange rates and financial reporting."}
            {role === "read_only" && "View-only access across all sections."}
          </p>
        </div>

        {isEdit && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as AdminStatus)}
              className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        )}

        {!isEdit && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Initial Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                {showPassword ? <Icons.eyeOff className="size-4" /> : <Icons.eye className="size-4" />}
              </button>
            </div>
            {touched && passwordError && <p className="mt-1 text-xs text-danger">{passwordError}</p>}
            <p className="mt-1 text-xs text-ink-subtle">Admin will be prompted to change this on first login.</p>
          </div>
        )}

        {role === "super_admin" && !initial?.role.includes("super_admin") && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
            Super Admin has unrestricted access. Only assign to trusted senior staff.
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{isEdit ? "Save changes" : "Create admin"}</Button>
      </div>
    </form>
  );
}

// ─── Role breakdown section ───────────────────────────────────────────────────
function RoleBreakdown({ admins }: { admins: AdminMember[] }) {
  const summary = getAdminSummary(admins);

  return (
    <div className="rounded-xl border border-line bg-paper-raised p-5">
      <h2 className="mb-4 text-sm font-semibold text-ink">Role Distribution</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ADMIN_ROLES.map(role => {
          const count = summary.byRole[role];
          const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
          return (
            <div
              key={role}
              className={cn(
                "flex flex-col gap-2 rounded-xl border p-4",
                ROLE_STAT_BG[role],
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", ROLE_DOT[role])} />
                <span className="text-xs font-medium text-ink-muted">{ROLE_LABELS[role]}</span>
              </div>
              <p className={cn("text-2xl font-bold", ROLE_STAT_TEXT[role])}>{count}</p>
              <div className="space-y-1">
                <div className="h-1 w-full rounded-full bg-ink/10">
                  <div
                    className={cn("h-1 rounded-full transition-all", ROLE_DOT[role])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-ink-subtle">{pct}% of total</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Manager ──────────────────────────────────────────────────────────────────
type DialogKind = "suspend" | "activate" | "disable" | "delete";

export function AdminsManager({ initialAdmins }: { initialAdmins: AdminMember[] }) {
  const [admins, setAdmins] = React.useState<AdminMember[]>(initialAdmins);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<AdminRole | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<AdminStatus | "all">("all");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [page, setPage] = React.useState(0);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminMember | null>(null);
  const [dialog, setDialog] = React.useState<{ kind: DialogKind; target: AdminMember } | null>(null);
  const [resetTarget, setResetTarget] = React.useState<AdminMember | null>(null);

  const summary = getAdminSummary(admins);

  const filtered = admins.filter(a => {
    const q = search.toLowerCase();
    if (q && !a.name.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false;
    if (roleFilter !== "all" && a.role !== roleFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (!inDateRange(a.createdAt, dateRange)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeP = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safeP * PAGE_SIZE, (safeP + 1) * PAGE_SIZE);

  React.useEffect(() => { setPage(0); }, [search, roleFilter, statusFilter, dateRange]);

  function closeSheet() { setSheetOpen(false); setEditing(null); }

  function handleSave(v: AdminFormValues) {
    const now = new Date().toISOString();
    if (editing) {
      setAdmins(prev => prev.map(a => a.id === editing.id
        ? { ...a, name: v.name, email: v.email, role: v.role, status: v.status, updatedAt: now }
        : a
      ));
    } else {
      const next: AdminMember = {
        id: nextAdminId(),
        email: v.email,
        name: v.name,
        role: v.role,
        status: "active",
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: null,
        createdBy: "adm-001",
        createdAt: now,
        updatedAt: now,
      };
      setAdmins(prev => [...prev, next]);
    }
    closeSheet();
  }

  function handleDialogConfirm() {
    if (!dialog) return;
    const { kind, target } = dialog;
    const now = new Date().toISOString();
    if (kind === "delete") {
      setAdmins(prev => prev.filter(a => a.id !== target.id));
    } else {
      const newStatus: AdminStatus =
        kind === "activate" ? "active" :
        kind === "suspend" ? "suspended" : "disabled";
      setAdmins(prev => prev.map(a =>
        a.id === target.id ? { ...a, status: newStatus, updatedAt: now } : a
      ));
    }
    setDialog(null);
  }

  const existingEmails = admins
    .filter(a => a.id !== editing?.id)
    .map(a => a.email.toLowerCase());

  const dialogMeta = dialog ? {
    suspend: {
      title: "Suspend Admin",
      description: `Suspend ${dialog.target.name}? They will lose access immediately but their account will be retained.`,
      tone: "warning" as const,
      confirmLabel: "Suspend",
      confirmVariant: "primary" as const,
    },
    activate: {
      title: "Re-activate Admin",
      description: `Restore access for ${dialog.target.name}?`,
      tone: "neutral" as const,
      confirmLabel: "Activate",
      confirmVariant: "primary" as const,
    },
    disable: {
      title: "Disable Admin",
      description: `Permanently disable ${dialog.target.name}? This account cannot be re-activated.`,
      tone: "danger" as const,
      confirmLabel: "Disable",
      confirmVariant: "danger" as const,
    },
    delete: {
      title: "Delete Admin",
      description: `Permanently delete ${dialog.target.name} (${dialog.target.email})? All audit logs will be retained.`,
      tone: "danger" as const,
      confirmLabel: "Delete",
      confirmVariant: "danger" as const,
    },
  }[dialog.kind] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Admins", value: summary.total, icon: Icons.userCog, color: "text-ink-muted" },
          { label: "Active", value: summary.byStatus.active, icon: Icons.checkCircle, color: "text-success" },
          { label: "Suspended", value: summary.byStatus.suspended, icon: Icons.alertTriangle, color: "text-warning" },
          { label: "Disabled", value: summary.byStatus.disabled, icon: Icons.xCircle, color: "text-ink-subtle" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-line bg-paper-raised px-4 py-3">
            <Icon className={cn("size-4 shrink-0", color)} />
            <div>
              <p className="text-2xl font-bold text-ink">{value}</p>
              <p className="text-xs text-ink-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Role breakdown */}
      <RoleBreakdown admins={admins} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search admins…"
            className="pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as typeof roleFilter)}
          className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
        >
          <option value="all">All roles</option>
          {ADMIN_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="disabled">Disabled</option>
        </select>
        <DateRangeFilter onChange={setDateRange} />
        <Button
          onClick={() => { setEditing(null); setSheetOpen(true); }}
          className="ml-auto gap-2"
        >
          <Icons.plus className="size-4" />
          Add Admin
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Admin</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Last Login</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.length === 0 && (
              <tr>
                <td colSpan={6} className="py-14 text-center text-ink-subtle">
                  No admins match your filters
                </td>
              </tr>
            )}
            {paged.map(a => (
              <tr key={a.id} className="group transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <AdminAvatar name={a.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{a.name}</p>
                      <p className="truncate text-xs text-ink-muted">{a.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={ROLE_TONE[a.role]}>{ROLE_LABELS[a.role]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "size-1.5 rounded-full",
                      a.status === "active" ? "bg-success" :
                      a.status === "suspended" ? "bg-warning" : "bg-ink-subtle"
                    )} />
                    <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABELS[a.status]}</Badge>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {a.lastLoginAt ? formatDate(a.lastLoginAt) : <span className="text-ink-subtle italic">Never</span>}
                </td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(a.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {/* Edit */}
                    <button
                      onClick={() => { setEditing(a); setSheetOpen(true); }}
                      title="Edit"
                      className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink"
                    >
                      <Icons.edit className="size-4" />
                    </button>

                    {/* Reset password */}
                    <button
                      onClick={() => setResetTarget(a)}
                      title="Reset password"
                      className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-paper-sunken hover:text-ink"
                    >
                      <Icons.key className="size-4" />
                    </button>

                    {/* Status toggle */}
                    {a.status === "active" ? (
                      <button
                        onClick={() => setDialog({ kind: "suspend", target: a })}
                        title="Suspend"
                        className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-warning/10 hover:text-warning"
                      >
                        <Icons.ban className="size-4" />
                      </button>
                    ) : a.status === "suspended" ? (
                      <button
                        onClick={() => setDialog({ kind: "activate", target: a })}
                        title="Re-activate"
                        className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-success/10 hover:text-success"
                      >
                        <Icons.checkCircle className="size-4" />
                      </button>
                    ) : null}

                    {/* Delete */}
                    <button
                      onClick={() => setDialog({ kind: "delete", target: a })}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span>
            {filtered.length} admin{filtered.length !== 1 ? "s" : ""} · page {safeP + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={safeP === 0} onClick={() => setPage(p => p - 1)}>
              <Icons.chevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled={safeP >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <Icons.chevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit Sheet */}
      <Sheet
        open={sheetOpen}
        onClose={closeSheet}
        title={editing ? "Edit Admin" : "Add Admin"}
        description={
          editing
            ? `Update ${editing.name}'s profile and permissions.`
            : "Create a new back-office admin account."
        }
      >
        <AdminForm
          initial={editing ?? undefined}
          existingEmails={existingEmails}
          onSave={handleSave}
          onCancel={closeSheet}
        />
      </Sheet>

      {/* Confirm Dialog */}
      {dialogMeta && (
        <Dialog
          open={!!dialog}
          onClose={() => setDialog(null)}
          title={dialogMeta.title}
          description={dialogMeta.description}
          tone={dialogMeta.tone}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
              <Button variant={dialogMeta.confirmVariant} onClick={handleDialogConfirm}>
                {dialogMeta.confirmLabel}
              </Button>
            </>
          }
        />
      )}

      {/* Reset password Dialog */}
      <Dialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Reset Password"
        description={resetTarget ? `Send a password reset link to ${resetTarget.email}? They will be signed out of all sessions.` : ""}
        tone="warning"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => setResetTarget(null)}>Send Reset Link</Button>
          </>
        }
      />
    </div>
  );
}
