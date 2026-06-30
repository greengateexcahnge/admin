"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Icons } from "@/components/icons";
import type {
  AdminUser,
  KycTier,
  UserStatus,
} from "@/lib/data/users";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserFormValues {
  name: string;
  email: string;
  phone: string;
  country: string;
  status: UserStatus;
  kycTier: KycTier;
}

interface UserFormProps {
  initial?: AdminUser | null;
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
}

const STATUSES: UserStatus[] = [
  "active",
  "pending",
  "suspended",
  "locked",
  "closed",
];

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function UserForm({ initial, onSubmit, onCancel }: UserFormProps) {
  const [values, setValues] = React.useState<UserFormValues>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    country: initial?.country ?? "Nigeria",
    status: initial?.status ?? "pending",
    kycTier: initial?.kycTier ?? 0,
  });
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof UserFormValues, string>>
  >({});

  function set<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function validate() {
    const next: Partial<Record<keyof UserFormValues, string>> = {};
    if (!values.name.trim()) next.name = "Name is required.";
    if (!values.email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(values.email)) next.email = "Enter a valid email.";
    if (!values.country.trim()) next.country = "Country is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...values, name: values.name.trim(), email: values.email.trim() });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <Field label="Full name" htmlFor="f-name" error={errors.name}>
          <Input
            id="f-name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            invalid={!!errors.name}
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Email" htmlFor="f-email" error={errors.email}>
          <Input
            id="f-email"
            type="email"
            icon={Icons.mail}
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            invalid={!!errors.email}
            placeholder="jane@example.com"
          />
        </Field>
        <Field label="Phone" htmlFor="f-phone">
          <Input
            id="f-phone"
            icon={Icons.phone}
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+234 800 000 0000"
          />
        </Field>
        <Field label="Country" htmlFor="f-country" error={errors.country}>
          <Input
            id="f-country"
            icon={Icons.mapPin}
            value={values.country}
            onChange={(e) => set("country", e.target.value)}
            invalid={!!errors.country}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status" htmlFor="f-status">
            <Select
              id="f-status"
              value={values.status}
              onChange={(e) => set("status", e.target.value as UserStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="KYC tier" htmlFor="f-tier">
            <Select
              id="f-tier"
              value={String(values.kycTier)}
              onChange={(e) =>
                set("kycTier", Number(e.target.value) as KycTier)
              }
            >
              {[0, 1, 2, 3].map((t) => (
                <option key={t} value={t}>
                  Tier {t}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-line p-5">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? "Save changes" : "Create user"}</Button>
      </div>
    </form>
  );
}
