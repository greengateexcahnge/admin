"use client";

import * as React from "react";
import Link from "next/link";
import { cn, formatDate, formatNaira, formatNumber } from "@/lib/utils";
import {
  getUserSummary,
  type AdminUser,
  type KycTier,
  type UserStatus,
} from "@/lib/data/users";
import { StatCard } from "@/components/dashboard/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Dialog } from "@/components/ui/dialog";
import { DateRangeFilter, DateRange, inDateRange } from "@/components/ui/date-filter";
import { Icons } from "@/components/icons";
import { UserForm, type UserFormValues } from "@/components/users/user-form";

const statusTone: Record<UserStatus, BadgeTone> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
  locked: "danger",
  closed: "neutral",
};

type SortKey =
  | "name"
  | "status"
  | "kycTier"
  | "portfolioNgn"
  | "txnCount"
  | "joinedAt";

type DialogAction = "suspend" | "activate" | "delete";

const PAGE_SIZE = 8;

function sortValue(u: AdminUser, key: SortKey): string | number {
  switch (key) {
    case "name":
      return u.name.toLowerCase();
    case "status":
      return u.status;
    case "kycTier":
      return u.kycTier;
    case "portfolioNgn":
      return u.portfolioNgn;
    case "txnCount":
      return u.txnCount;
    case "joinedAt":
      return new Date(u.joinedAt).getTime();
    default:
      return 0;
  }
}

function nextId(users: AdminUser[]) {
  const max = users.reduce((m, u) => {
    const n = parseInt(u.id.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 1041);
  return `GG-U${String(max + 1).padStart(5, "0")}`;
}

export function UsersManager({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = React.useState<AdminUser[]>(initialUsers);

  // Filters / sort / pagination
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<"all" | UserStatus>("all");
  const [tier, setTier] = React.useState<"all" | KycTier>("all");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>(
    { key: "joinedAt", dir: "desc" },
  );
  const [page, setPage] = React.useState(1);

  // Sheet (add/edit) + Dialog (confirm)
  const [sheet, setSheet] = React.useState<{
    open: boolean;
    user: AdminUser | null;
  }>({ open: false, user: null });
  const [dialog, setDialog] = React.useState<{
    open: boolean;
    action: DialogAction | null;
    user: AdminUser | null;
  }>({ open: false, action: null, user: null });

  // Reset to first page whenever the result set changes.
  React.useEffect(() => {
    setPage(1);
  }, [query, status, tier, dateRange, sort]);

  const summary = getUserSummary(users);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();

    const list = users.filter((u) => {
      const matchesQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);
      const matchesStatus = status === "all" || u.status === status;
      const matchesTier = tier === "all" || u.kycTier === tier;
      return matchesQuery && matchesStatus && matchesTier && inDateRange(u.joinedAt, dateRange);
    });

    const dir = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      if (typeof av === "string" && typeof bv === "string") {
        return av.localeCompare(bv) * dir;
      }
      return ((av as number) - (bv as number)) * dir;
    });
  }, [users, query, status, tier, dateRange, sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }

  function handleSubmit(values: UserFormValues) {
    setUsers((list) => {
      if (sheet.user) {
        return list.map((u) =>
          u.id === sheet.user!.id ? { ...u, ...values } : u,
        );
      }
      const nowIso = new Date().toISOString();
      const created: AdminUser = {
        id: nextId(list),
        ...values,
        portfolioNgn: 0,
        txnCount: 0,
        joinedAt: nowIso,
        lastActiveAt: nowIso,
      };
      return [created, ...list];
    });
    setSheet({ open: false, user: null });
  }

  function confirmAction() {
    const { action, user } = dialog;
    if (!user || !action) return;
    setUsers((list) => {
      if (action === "delete") return list.filter((u) => u.id !== user.id);
      const status: UserStatus = action === "suspend" ? "suspended" : "active";
      return list.map((u) => (u.id === user.id ? { ...u, status } : u));
    });
    setDialog({ open: false, action: null, user: null });
  }

  const dialogCopy = (() => {
    const name = dialog.user?.name ?? "this user";
    switch (dialog.action) {
      case "delete":
        return {
          title: "Delete user",
          description: `${name} will be permanently removed. This action cannot be undone.`,
          icon: Icons.trash,
          tone: "danger" as const,
          confirmLabel: "Delete",
          confirmVariant: "danger" as const,
        };
      case "suspend":
        return {
          title: "Suspend user",
          description: `${name} will lose access until reactivated.`,
          icon: Icons.ban,
          tone: "warning" as const,
          confirmLabel: "Suspend",
          confirmVariant: "danger" as const,
        };
      default:
        return {
          title: "Activate user",
          description: `${name} will regain full access immediately.`,
          icon: Icons.check,
          tone: "neutral" as const,
          confirmLabel: "Activate",
          confirmVariant: "primary" as const,
        };
    }
  })();

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header with timeline + add (top right) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Users
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage accounts, KYC tiers and access.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button onClick={() => setSheet({ open: true, user: null })}>
            <Icons.userPlus />
            <span className="hidden sm:inline">Add user</span>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={formatNumber(summary.total)}
          icon={Icons.users}
        />
        <StatCard
          label="Active"
          value={formatNumber(summary.active)}
          icon={Icons.badgeCheck}
        />
        <StatCard
          label="Pending KYC"
          value={formatNumber(summary.pending)}
          icon={Icons.clock}
        />
        <StatCard
          label="Restricted"
          value={formatNumber(summary.restricted)}
          icon={Icons.shield}
        />
      </div>

      {/* Table card */}
      <div className="mt-4 rounded-xl border border-line bg-paper-raised">
        {/* Toolbar: search + filters */}
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-xs">
            <Input
              type="search"
              placeholder="Search name, email or ID"
              icon={Icons.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              aria-label="Filter by status"
              className="h-9 w-auto"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "all" | UserStatus)
              }
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="locked">Locked</option>
              <option value="closed">Closed</option>
            </Select>
            <Select
              aria-label="Filter by KYC tier"
              className="h-9 w-auto"
              value={String(tier)}
              onChange={(e) =>
                setTier(
                  e.target.value === "all"
                    ? "all"
                    : (Number(e.target.value) as KycTier),
                )
              }
            >
              <option value="all">All tiers</option>
              <option value="0">Tier 0</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </Select>
            <DateRangeFilter onChange={setDateRange} />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
                <SortableTh
                  label="User"
                  active={sort.key === "name"}
                  dir={sort.dir}
                  onClick={() => toggleSort("name")}
                />
                <SortableTh
                  label="Status"
                  active={sort.key === "status"}
                  dir={sort.dir}
                  onClick={() => toggleSort("status")}
                />
                <SortableTh
                  label="KYC"
                  active={sort.key === "kycTier"}
                  dir={sort.dir}
                  onClick={() => toggleSort("kycTier")}
                />
                <SortableTh
                  label="Portfolio"
                  align="right"
                  active={sort.key === "portfolioNgn"}
                  dir={sort.dir}
                  onClick={() => toggleSort("portfolioNgn")}
                />
                <SortableTh
                  label="Txns"
                  align="right"
                  active={sort.key === "txnCount"}
                  dir={sort.dir}
                  onClick={() => toggleSort("txnCount")}
                />
                <SortableTh
                  label="Joined"
                  active={sort.key === "joinedAt"}
                  dir={sort.dir}
                  onClick={() => toggleSort("joinedAt")}
                />
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-line last:border-0 hover:bg-paper-sunken/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{u.name}</p>
                        <p className="truncate text-xs text-ink-subtle">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[u.status]} dot>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.kycTier >= 2 ? "info" : "neutral"}>
                      Tier {u.kycTier}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">
                    {formatNaira(u.portfolioNgn)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-muted">
                    {formatNumber(u.txnCount)}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {formatDate(u.joinedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/users/${u.id}`}
                        title="View"
                        aria-label="View user"
                        className="grid size-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
                      >
                        <Icons.eye className="size-4" />
                      </Link>
                      <IconButton
                        title="Edit"
                        onClick={() => setSheet({ open: true, user: u })}
                      >
                        <Icons.edit className="size-4" />
                      </IconButton>
                      {u.status === "suspended" ? (
                        <IconButton
                          title="Activate"
                          onClick={() =>
                            setDialog({ open: true, action: "activate", user: u })
                          }
                        >
                          <Icons.check className="size-4" />
                        </IconButton>
                      ) : (
                        <IconButton
                          title="Suspend"
                          onClick={() =>
                            setDialog({ open: true, action: "suspend", user: u })
                          }
                        >
                          <Icons.ban className="size-4" />
                        </IconButton>
                      )}
                      <IconButton
                        title="Delete"
                        danger
                        onClick={() =>
                          setDialog({ open: true, action: "delete", user: u })
                        }
                      >
                        <Icons.trash className="size-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {total === 0 ? (
            <div className="p-10 text-center text-sm text-ink-subtle">
              No users match your filters.
            </div>
          ) : null}
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-subtle">
            {total === 0
              ? "No results"
              : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total}`}
          </p>
          <div className="flex items-center gap-1">
            <IconButton
              title="Previous page"
              disabled={current <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <Icons.chevronLeft className="size-4" />
            </IconButton>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i + 1)}
                aria-current={current === i + 1 ? "page" : undefined}
                className={cn(
                  "grid size-8 place-items-center rounded-md text-sm transition-colors",
                  current === i + 1
                    ? "bg-primary text-primary-foreground"
                    : "text-ink-muted hover:bg-paper-sunken hover:text-ink",
                )}
              >
                {i + 1}
              </button>
            ))}
            <IconButton
              title="Next page"
              disabled={current >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <Icons.chevronRight className="size-4" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Add / Edit sheet */}
      <Sheet
        open={sheet.open}
        onClose={() => setSheet({ open: false, user: null })}
        title={sheet.user ? "Edit user" : "Add user"}
        description={
          sheet.user
            ? `Update ${sheet.user.name}'s account details.`
            : "Create a new user account."
        }
      >
        <UserForm
          key={sheet.user?.id ?? "new"}
          initial={sheet.user}
          onSubmit={handleSubmit}
          onCancel={() => setSheet({ open: false, user: null })}
        />
      </Sheet>

      {/* Confirm dialog */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, action: null, user: null })}
        title={dialogCopy.title}
        description={dialogCopy.description}
        icon={dialogCopy.icon}
        tone={dialogCopy.tone}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                setDialog({ open: false, action: null, user: null })
              }
            >
              Cancel
            </Button>
            <Button variant={dialogCopy.confirmVariant} onClick={confirmAction}>
              {dialogCopy.confirmLabel}
            </Button>
          </>
        }
      />
    </div>
  );
}

function SortableTh({
  label,
  active,
  dir,
  align = "left",
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  align?: "left" | "right";
  onClick: () => void;
}) {
  return (
    <th className={cn("font-medium", align === "right" ? "text-right" : "text-left")}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 px-4 py-3 text-xs uppercase tracking-wide transition-colors hover:text-ink",
          align === "right" && "flex-row-reverse",
          active ? "text-ink" : "text-ink-subtle",
        )}
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <Icons.arrowUp className="size-3" />
          ) : (
            <Icons.arrowDown className="size-3" />
          )
        ) : (
          <Icons.sort className="size-3 opacity-50" />
        )}
      </button>
    </th>
  );
}

function IconButton({
  title,
  danger,
  disabled,
  onClick,
  children,
}: {
  title: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-paper-sunken",
        danger ? "hover:text-danger" : "hover:text-ink",
        "disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      {children}
    </button>
  );
}
