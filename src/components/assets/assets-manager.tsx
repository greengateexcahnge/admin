"use client";

import * as React from "react";
import { cn, formatDate } from "@/lib/utils";
import {
  getAssetSummary,
  nextAssetId,
  type Asset,
  type AssetKind,
} from "@/lib/data/assets";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Dialog } from "@/components/ui/dialog";
import { DateRangeFilter, DateRange, inDateRange } from "@/components/ui/date-filter";
import { Icons } from "@/components/icons";
import { AssetForm, type AssetFormValues } from "@/components/assets/asset-form";
import { getAssetNetworksByAsset } from "@/lib/data/asset-networks";

type SortKey = "symbol" | "name" | "kind" | "decimals" | "createdAt";
type DialogAction = "delete" | "deactivate" | "activate";

const PAGE_SIZE = 8;

const kindTone: Record<AssetKind, BadgeTone> = {
  crypto: "info",
  fiat: "neutral",
};

function sortValue(a: Asset, key: SortKey): string | number {
  switch (key) {
    case "symbol":
      return a.symbol;
    case "name":
      return a.name.toLowerCase();
    case "kind":
      return a.kind;
    case "decimals":
      return a.decimals;
    case "createdAt":
      return new Date(a.createdAt).getTime();
  }
}

const NETWORK_LABEL: Record<string, string> = {
  bitcoin: "Bitcoin", ethereum: "ERC-20", tron: "TRC-20", bsc: "BEP-20",
};

export function AssetsManager({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = React.useState<Asset[]>(initialAssets);
  const assetNetworks = getAssetNetworksByAsset();

  // Filters / sort / pagination
  const [query, setQuery] = React.useState("");
  const [kindFilter, setKindFilter] = React.useState<"all" | AssetKind>("all");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>(
    { key: "symbol", dir: "asc" },
  );
  const [page, setPage] = React.useState(1);

  // Sheet (add / edit) + Dialog (confirm action)
  const [sheet, setSheet] = React.useState<{
    open: boolean;
    asset: Asset | null;
  }>({ open: false, asset: null });
  const [dialog, setDialog] = React.useState<{
    open: boolean;
    action: DialogAction | null;
    asset: Asset | null;
  }>({ open: false, action: null, asset: null });

  React.useEffect(() => {
    setPage(1);
  }, [query, kindFilter, statusFilter, dateRange, sort]);

  const summary = getAssetSummary(assets);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = assets.filter((a) => {
      const matchesQuery =
        !q ||
        a.symbol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q);
      const matchesKind = kindFilter === "all" || a.kind === kindFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? a.isActive : !a.isActive);
      return matchesQuery && matchesKind && matchesStatus && inDateRange(a.createdAt, dateRange);
    });

    const dir = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      if (typeof av === "string" && typeof bv === "string")
        return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
  }, [assets, query, kindFilter, statusFilter, dateRange, sort]);

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

  function handleSubmit(values: AssetFormValues) {
    setAssets((list) => {
      if (sheet.asset) {
        return list.map((a) =>
          a.id === sheet.asset!.id ? { ...a, ...values } : a,
        );
      }
      const created: Asset = {
        id: nextAssetId(),
        ...values,
        createdAt: new Date().toISOString(),
      };
      return [created, ...list];
    });
    setSheet({ open: false, asset: null });
  }

  function confirmAction() {
    const { action, asset } = dialog;
    if (!asset || !action) return;
    setAssets((list) => {
      if (action === "delete") return list.filter((a) => a.id !== asset.id);
      const isActive = action === "activate";
      return list.map((a) => (a.id === asset.id ? { ...a, isActive } : a));
    });
    setDialog({ open: false, action: null, asset: null });
  }

  const dialogCopy = (() => {
    const sym = dialog.asset?.symbol ?? "this asset";
    switch (dialog.action) {
      case "delete":
        return {
          title: "Delete asset",
          description: `${sym} will be permanently removed from the catalogue. Existing wallets and ledger entries referencing it are unaffected.`,
          icon: Icons.trash,
          tone: "danger" as const,
          confirmLabel: "Delete",
          confirmVariant: "danger" as const,
        };
      case "deactivate":
        return {
          title: "Deactivate asset",
          description: `${sym} will be hidden from users and blocked in new transactions until reactivated.`,
          icon: Icons.ban,
          tone: "warning" as const,
          confirmLabel: "Deactivate",
          confirmVariant: "danger" as const,
        };
      default:
        return {
          title: "Activate asset",
          description: `${sym} will become available to users for deposits, withdrawals, and swaps.`,
          icon: Icons.check,
          tone: "neutral" as const,
          confirmLabel: "Activate",
          confirmVariant: "primary" as const,
        };
    }
  })();

  const existingSymbols = assets.map((a) => a.symbol);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Assets
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage crypto and fiat assets available on the platform.
          </p>
        </div>
        <Button onClick={() => setSheet({ open: true, asset: null })}>
          <Icons.plus />
          <span className="hidden sm:inline">Add asset</span>
        </Button>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total assets"
          value={String(summary.total)}
          icon={Icons.coins}
        />
        <StatCard
          label="Active"
          value={String(summary.active)}
          icon={Icons.badgeCheck}
        />
        <StatCard
          label="Crypto"
          value={String(summary.crypto)}
          icon={Icons.wallet}
        />
        <StatCard
          label="Fiat"
          value={String(summary.fiat)}
          icon={Icons.creditCard}
        />
      </div>

      {/* Table card */}
      <div className="mt-4 rounded-xl border border-line bg-paper-raised">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-xs">
            <Input
              type="search"
              placeholder="Search symbol or name"
              icon={Icons.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              aria-label="Filter by kind"
              className="h-9 w-auto"
              value={kindFilter}
              onChange={(e) =>
                setKindFilter(e.target.value as "all" | AssetKind)
              }
            >
              <option value="all">All kinds</option>
              <option value="crypto">Crypto</option>
              <option value="fiat">Fiat</option>
            </Select>
            <Select
              aria-label="Filter by status"
              className="h-9 w-auto"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "active" | "inactive",
                )
              }
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            <DateRangeFilter onChange={setDateRange} />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-subtle">
                <SortableTh
                  label="Symbol"
                  active={sort.key === "symbol"}
                  dir={sort.dir}
                  onClick={() => toggleSort("symbol")}
                />
                <SortableTh
                  label="Name"
                  active={sort.key === "name"}
                  dir={sort.dir}
                  onClick={() => toggleSort("name")}
                />
                <SortableTh
                  label="Kind"
                  active={sort.key === "kind"}
                  dir={sort.dir}
                  onClick={() => toggleSort("kind")}
                />
                <SortableTh
                  label="Decimals"
                  align="right"
                  active={sort.key === "decimals"}
                  dir={sort.dir}
                  onClick={() => toggleSort("decimals")}
                />
                <th className="px-4 py-3 font-medium">Networks</th>
                <th className="px-4 py-3 font-medium">Stablecoin</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <SortableTh
                  label="Added"
                  active={sort.key === "createdAt"}
                  dir={sort.dir}
                  onClick={() => toggleSort("createdAt")}
                />
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-line last:border-0 hover:bg-paper-sunken/60"
                >
                  {/* Symbol */}
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-ink">
                      {a.symbol}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3 text-ink">{a.name}</td>

                  {/* Kind */}
                  <td className="px-4 py-3">
                    <Badge tone={kindTone[a.kind]}>{a.kind}</Badge>
                  </td>

                  {/* Decimals */}
                  <td className="px-4 py-3 text-right tabular-nums text-ink-muted">
                    {a.decimals}
                  </td>

                  {/* Networks */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(assetNetworks[a.symbol] ?? [])
                        .filter(an => an.isActive)
                        .map(an => (
                          <span
                            key={an.id}
                            className="rounded-full bg-paper-sunken px-2 py-0.5 text-xs font-medium text-ink-muted"
                          >
                            {NETWORK_LABEL[an.networkCode] ?? an.networkCode}
                          </span>
                        ))}
                      {(assetNetworks[a.symbol] ?? []).length === 0 && (
                        <span className="text-xs text-ink-subtle">—</span>
                      )}
                    </div>
                  </td>

                  {/* Stablecoin */}
                  <td className="px-4 py-3">
                    {a.isStablecoin ? (
                      <Badge tone="success" dot>
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-xs text-ink-subtle">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge tone={a.isActive ? "success" : "neutral"} dot>
                      {a.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>

                  {/* Added */}
                  <td className="px-4 py-3 text-ink-muted">
                    {formatDate(a.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        title="Edit"
                        onClick={() => setSheet({ open: true, asset: a })}
                      >
                        <Icons.edit className="size-4" />
                      </IconButton>
                      {a.isActive ? (
                        <IconButton
                          title="Deactivate"
                          onClick={() =>
                            setDialog({
                              open: true,
                              action: "deactivate",
                              asset: a,
                            })
                          }
                        >
                          <Icons.ban className="size-4" />
                        </IconButton>
                      ) : (
                        <IconButton
                          title="Activate"
                          onClick={() =>
                            setDialog({
                              open: true,
                              action: "activate",
                              asset: a,
                            })
                          }
                        >
                          <Icons.check className="size-4" />
                        </IconButton>
                      )}
                      <IconButton
                        title="Delete"
                        danger
                        onClick={() =>
                          setDialog({ open: true, action: "delete", asset: a })
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
              No assets match your filters.
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
        onClose={() => setSheet({ open: false, asset: null })}
        title={sheet.asset ? `Edit ${sheet.asset.symbol}` : "Add asset"}
        description={
          sheet.asset
            ? `Update ${sheet.asset.name} configuration.`
            : "Add a new crypto or fiat asset to the platform catalogue."
        }
      >
        <AssetForm
          key={sheet.asset?.id ?? "new"}
          initial={sheet.asset}
          existingSymbols={existingSymbols}
          onSubmit={handleSubmit}
          onCancel={() => setSheet({ open: false, asset: null })}
        />
      </Sheet>

      {/* Confirm dialog */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, action: null, asset: null })}
        title={dialogCopy.title}
        description={dialogCopy.description}
        icon={dialogCopy.icon}
        tone={dialogCopy.tone}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                setDialog({ open: false, action: null, asset: null })
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
    <th
      className={cn(
        "font-medium",
        align === "right" ? "text-right" : "text-left",
      )}
    >
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
