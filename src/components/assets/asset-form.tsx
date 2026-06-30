"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Icons } from "@/components/icons";
import type { Asset, AssetKind } from "@/lib/data/assets";

export interface AssetFormValues {
  symbol: string;
  name: string;
  kind: AssetKind;
  decimals: number;
  isActive: boolean;
  isStablecoin: boolean;
}

interface AssetFormProps {
  initial?: Asset | null;
  existingSymbols: string[];
  onSubmit: (values: AssetFormValues) => void;
  onCancel: () => void;
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-ink-subtle">{hint}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-line p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-subtle">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised",
          checked ? "bg-primary" : "bg-line-strong",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

const DECIMAL_PRESETS = [
  { label: "2 — fiat / stablecoin display", value: 2 },
  { label: "6 — USDT / USDC", value: 6 },
  { label: "8 — BTC", value: 8 },
  { label: "18 — ETH / ERC-20", value: 18 },
];

export function AssetForm({
  initial,
  existingSymbols,
  onSubmit,
  onCancel,
}: AssetFormProps) {
  const [values, setValues] = React.useState<AssetFormValues>({
    symbol: initial?.symbol ?? "",
    name: initial?.name ?? "",
    kind: initial?.kind ?? "crypto",
    decimals: initial?.decimals ?? 8,
    isActive: initial?.isActive ?? true,
    isStablecoin: initial?.isStablecoin ?? false,
  });
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof AssetFormValues, string>>
  >({});

  function set<K extends keyof AssetFormValues>(
    key: K,
    value: AssetFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const next: Partial<Record<keyof AssetFormValues, string>> = {};
    const sym = values.symbol.trim().toUpperCase();

    if (!sym) {
      next.symbol = "Symbol is required.";
    } else if (sym.length > 20) {
      next.symbol = "Symbol must be 20 characters or fewer.";
    } else if (!/^[A-Z0-9]+$/.test(sym)) {
      next.symbol = "Symbol may only contain letters and numbers.";
    } else {
      const isDuplicate = existingSymbols
        .filter((s) => s !== initial?.symbol)
        .includes(sym);
      if (isDuplicate) next.symbol = `Symbol "${sym}" already exists.`;
    }

    if (!values.name.trim()) next.name = "Name is required.";

    if (
      !Number.isInteger(values.decimals) ||
      values.decimals < 0 ||
      values.decimals > 18
    ) {
      next.decimals = "Decimals must be a whole number between 0 and 18.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...values,
      symbol: values.symbol.trim().toUpperCase(),
      name: values.name.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {/* Symbol + Kind side-by-side */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Symbol" htmlFor="f-symbol" error={errors.symbol}>
            <Input
              id="f-symbol"
              value={values.symbol}
              onChange={(e) => set("symbol", e.target.value.toUpperCase())}
              invalid={!!errors.symbol}
              placeholder="BTC"
              maxLength={20}
              className="uppercase"
            />
          </Field>
          <Field label="Kind" htmlFor="f-kind">
            <Select
              id="f-kind"
              value={values.kind}
              onChange={(e) => set("kind", e.target.value as AssetKind)}
            >
              <option value="crypto">Crypto</option>
              <option value="fiat">Fiat</option>
            </Select>
          </Field>
        </div>

        {/* Name */}
        <Field label="Full name" htmlFor="f-name" error={errors.name}>
          <Input
            id="f-name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            invalid={!!errors.name}
            placeholder="Bitcoin"
          />
        </Field>

        {/* Decimals */}
        <Field
          label="Decimals"
          htmlFor="f-decimals"
          error={errors.decimals}
          hint="Number of decimal places used for on-chain / display precision."
        >
          <div className="space-y-2">
            <Input
              id="f-decimals"
              type="number"
              min={0}
              max={18}
              step={1}
              value={values.decimals}
              onChange={(e) =>
                set("decimals", Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              invalid={!!errors.decimals}
              icon={Icons.coins}
            />
            <div className="flex flex-wrap gap-2">
              {DECIMAL_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set("decimals", p.value)}
                  className={[
                    "rounded-md border px-2.5 py-1 text-xs transition-colors",
                    values.decimals === p.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
                  ].join(" ")}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </Field>

        {/* Toggles */}
        <ToggleRow
          id="f-active"
          label="Active"
          description="Inactive assets are hidden from users and cannot be used in new transactions."
          checked={values.isActive}
          onChange={(v) => set("isActive", v)}
        />
        <ToggleRow
          id="f-stablecoin"
          label="Stablecoin"
          description={
            values.kind === "fiat"
              ? "Not applicable to fiat currencies."
              : "Mark as a price-pegged crypto asset (e.g. USDT, USDC)."
          }
          checked={values.isStablecoin}
          onChange={(v) => set("isStablecoin", v)}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initial ? "Save changes" : "Add asset"}
        </Button>
      </div>
    </form>
  );
}
