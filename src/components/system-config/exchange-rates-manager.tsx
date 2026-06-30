"use client";

import * as React from "react";
import { formatDate } from "@/lib/utils";
import {
  nextExchangeRateId,
  type ExchangeRate,
} from "@/lib/data/exchange-rates";
import type { Asset } from "@/lib/data/assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Dialog } from "@/components/ui/dialog";
import { DateRangeFilter, DateRange, inDateRange } from "@/components/ui/date-filter";
import { Icons } from "@/components/icons";

function fmt(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function AddRateForm({
  assets,
  onSave,
  onCancel,
}: {
  assets: Asset[];
  onSave: (r: ExchangeRate) => void;
  onCancel: () => void;
}) {
  const [baseId, setBaseId] = React.useState("");
  const [quoteId, setQuoteId] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [buyRate, setBuyRate] = React.useState("");
  const [sellRate, setSellRate] = React.useState("");
  const [source, setSource] = React.useState("manual");
  const [touched, setTouched] = React.useState(false);

  const errors = {
    base: !baseId ? "Required" : null,
    quote: !quoteId ? "Required" : null,
    same: baseId && quoteId && baseId === quoteId ? "Base and quote must differ" : null,
    rate: !rate || parseFloat(rate) <= 0 ? "Rate must be > 0" : null,
    source: !source.trim() ? "Required" : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) return;
    const baseAsset = assets.find(a => a.id === baseId)!;
    const quoteAsset = assets.find(a => a.id === quoteId)!;
    onSave({
      id: nextExchangeRateId(),
      baseAssetId: baseId,
      baseSymbol: baseAsset.symbol,
      quoteAssetId: quoteId,
      quoteSymbol: quoteAsset.symbol,
      rate: parseFloat(rate),
      buyRate: buyRate ? parseFloat(buyRate) : null,
      sellRate: sellRate ? parseFloat(sellRate) : null,
      source: source.trim(),
      capturedAt: new Date().toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <p className="text-sm text-ink-muted">Adding a new rate entry creates a snapshot. The latest entry per pair becomes the active rate.</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Base Asset</label>
            <select value={baseId} onChange={e => setBaseId(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
              <option value="">Select…</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.symbol}</option>)}
            </select>
            {touched && (errors.base || errors.same) && <p className="mt-1 text-xs text-danger">{errors.base ?? errors.same}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Quote Asset</label>
            <select value={quoteId} onChange={e => setQuoteId(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
              <option value="">Select…</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.symbol}</option>)}
            </select>
            {touched && errors.quote && <p className="mt-1 text-xs text-danger">{errors.quote}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Mid Rate</label>
          <Input type="number" step="any" min={0} value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 1545" />
          {touched && errors.rate && <p className="mt-1 text-xs text-danger">{errors.rate}</p>}
          <p className="mt-1 text-xs text-ink-subtle">1 {assets.find(a => a.id === baseId)?.symbol ?? "BASE"} = rate {assets.find(a => a.id === quoteId)?.symbol ?? "QUOTE"}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Buy Rate <span className="text-ink-subtle">(opt.)</span></label>
            <Input type="number" step="any" min={0} value={buyRate} onChange={e => setBuyRate(e.target.value)} placeholder="same as rate" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Sell Rate <span className="text-ink-subtle">(opt.)</span></label>
            <Input type="number" step="any" min={0} value={sellRate} onChange={e => setSellRate(e.target.value)} placeholder="same as rate" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Source</label>
          <Input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. chainlink, binance, manual" />
          {touched && errors.source && <p className="mt-1 text-xs text-danger">{errors.source}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Add Rate Entry</Button>
      </div>
    </form>
  );
}

export function ExchangeRatesManager({ initialRates, assets }: { initialRates: ExchangeRate[]; assets: Asset[] }) {
  const [rates, setRates] = React.useState<ExchangeRate[]>(initialRates);
  const [view, setView] = React.useState<"latest" | "all">("latest");
  const [pairFilter, setPairFilter] = React.useState("all");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<ExchangeRate | null>(null);

  const computedLatest = React.useMemo(() => {
    const latest = new Map<string, ExchangeRate>();
    for (const r of rates) {
      const key = `${r.baseSymbol}/${r.quoteSymbol}`;
      const existing = latest.get(key);
      if (!existing || r.capturedAt > existing.capturedAt) latest.set(key, r);
    }
    return [...latest.values()];
  }, [rates]);

  const displayed = view === "latest" ? computedLatest : rates;
  const uniquePairs = [...new Set(rates.map(r => `${r.baseSymbol}/${r.quoteSymbol}`))].sort();
  const filtered = displayed.filter(r => {
    if (pairFilter !== "all" && `${r.baseSymbol}/${r.quoteSymbol}` !== pairFilter) return false;
    if (!inDateRange(r.capturedAt, dateRange)) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));

  function handleAdd(r: ExchangeRate) {
    setRates(prev => [...prev, r]);
    setSheetOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active Pairs", value: computedLatest.length, icon: Icons.dollar },
          { label: "Total Entries", value: rates.length, icon: Icons.receipt },
          { label: "Sources", value: new Set(rates.map(r => r.source)).size, icon: Icons.globe },
          { label: "Latest", value: computedLatest.length > 0 ? formatDate([...computedLatest].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0]?.capturedAt ?? "") : "—", icon: Icons.clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-line bg-paper-raised px-4 py-3">
            <Icon className="size-4 text-ink-muted shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">{value}</p>
              <p className="text-xs text-ink-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-line overflow-hidden">
          {(["latest", "all"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm capitalize transition-colors ${view === v ? "bg-primary text-white" : "bg-paper-raised text-ink-muted hover:text-ink"}`}
            >
              {v === "latest" ? "Latest rates" : `All entries (${rates.length})`}
            </button>
          ))}
        </div>
        <select value={pairFilter} onChange={e => setPairFilter(e.target.value)} className="h-9 rounded-lg border border-line bg-paper-raised px-3 text-sm text-ink">
          <option value="all">All pairs</option>
          {uniquePairs.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <DateRangeFilter onChange={setDateRange} />
        <Button onClick={() => setSheetOpen(true)} className="ml-auto gap-2">
          <Icons.plus className="size-4" />
          Add Rate
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper-sunken text-xs text-ink-muted uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Pair</th>
              <th className="px-4 py-3 text-right font-medium">Mid Rate</th>
              <th className="px-4 py-3 text-right font-medium">Buy</th>
              <th className="px-4 py-3 text-right font-medium">Sell</th>
              <th className="px-4 py-3 text-left font-medium">Source</th>
              <th className="px-4 py-3 text-left font-medium">Captured</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-ink-subtle">No rates found</td></tr>
            )}
            {sorted.map(r => (
              <tr key={r.id} className="transition-colors hover:bg-paper-sunken/50">
                <td className="px-4 py-3">
                  <span className="font-medium text-ink">{r.baseSymbol}</span>
                  <span className="text-ink-subtle"> / </span>
                  <span className="text-ink-muted">{r.quoteSymbol}</span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-ink">{fmt(r.rate)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-success">{fmt(r.buyRate)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-danger">{fmt(r.sellRate)}</td>
                <td className="px-4 py-3 text-ink-muted">{r.source}</td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(r.capturedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
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

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add Exchange Rate" description="Snapshot the current rate for a currency pair.">
        <AddRateForm assets={assets} onSave={handleAdd} onCancel={() => setSheetOpen(false)} />
      </Sheet>

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Rate Entry"
        description={deleteTarget ? `Delete the ${deleteTarget.baseSymbol}/${deleteTarget.quoteSymbol} rate captured at ${formatDate(deleteTarget.capturedAt)}?` : ""}
        tone="danger"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => {
              if (deleteTarget) setRates(prev => prev.filter(r => r.id !== deleteTarget.id));
              setDeleteTarget(null);
            }}>Delete</Button>
          </>
        }
      />
    </div>
  );
}
