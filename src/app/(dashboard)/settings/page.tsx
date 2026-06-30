import type { Metadata } from "next";
import * as React from "react";
import { getCurrentProfile } from "@/lib/data/profile";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Icons } from "@/components/icons";

export const metadata: Metadata = {
  title: "Settings",
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 border-t border-line py-6 lg:grid-cols-3 lg:gap-8">
      <div className="lg:col-span-1">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      <div className="lg:col-span-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  defaultChecked,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-sm text-ink-muted">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} aria-label={title} />
    </div>
  );
}

export default function SettingsPage() {
  const profile = getCurrentProfile();

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Settings
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage your account, security and preferences.
        </p>
      </div>

      <div className="mt-2">
        {/* Profile */}
        <Section
          title="Profile"
          description="Your personal information and how you appear in the console."
        >
          <div className="space-y-4 rounded-xl border border-line bg-paper-raised p-5">
            <div className="flex items-center gap-4">
              <Avatar name={profile.name} size="lg" />
              <Button variant="outline" size="sm">
                <Icons.camera />
                Change photo
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="name">
                <Input id="name" defaultValue={profile.name} />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input id="email" type="email" defaultValue={profile.email} />
              </Field>
              <Field label="Phone" htmlFor="phone">
                <Input id="phone" defaultValue={profile.phone} />
              </Field>
              <Field label="Occupation" htmlFor="occupation">
                <Input id="occupation" defaultValue={profile.occupation} />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button>Save changes</Button>
            </div>
          </div>
        </Section>

        {/* Security */}
        <Section
          title="Security"
          description="Protect your account with strong credentials and device controls."
        >
          <div className="divide-y divide-line rounded-xl border border-line bg-paper-raised px-5">
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <Icons.key className="size-5 text-ink-muted" />
                <div>
                  <p className="text-sm font-medium text-ink">Password</p>
                  <p className="text-sm text-ink-muted">
                    Last changed 19 days ago
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <Icons.shield className="size-5 text-ink-muted" />
                <div>
                  <p className="text-sm font-medium text-ink">
                    Transaction PIN
                  </p>
                  <p className="text-sm text-ink-muted">
                    Required for sensitive operations
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>
            <ToggleRow
              title="Two-factor authentication"
              description="Add an extra layer of security at login."
              defaultChecked
            />
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <Icons.smartphone className="size-5 text-ink-muted" />
                <div>
                  <p className="text-sm font-medium text-ink">Active device</p>
                  <p className="text-sm text-ink-muted">
                    iPhone 15 · Lagos, NG
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Revoke
              </Button>
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section
          title="Notifications"
          description="Choose what updates you receive and where."
        >
          <div className="divide-y divide-line rounded-xl border border-line bg-paper-raised px-5">
            <ToggleRow
              title="Transaction alerts"
              description="Deposits, withdrawals, swaps and FX."
              defaultChecked
            />
            <ToggleRow
              title="Security alerts"
              description="Logins, device changes and restrictions."
              defaultChecked
            />
            <ToggleRow
              title="Product updates"
              description="New features and improvements."
            />
            <ToggleRow
              title="Marketing emails"
              description="Occasional news and offers."
            />
          </div>
        </Section>

        {/* Appearance */}
        <Section
          title="Appearance"
          description="Customize how the console looks for you."
        >
          <div className="rounded-xl border border-line bg-paper-raised p-5">
            <Field label="Theme" htmlFor="theme">
              <select
                id="theme"
                defaultValue="light"
                className="h-11 w-full rounded-md border border-line-strong bg-paper-raised px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">System</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Danger zone */}
        <Section
          title="Danger zone"
          description="Irreversible and destructive actions."
        >
          <div className="flex flex-col gap-4 rounded-xl border border-danger/30 bg-danger/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Close account</p>
              <p className="text-sm text-ink-muted">
                Permanently disable this admin account.
              </p>
            </div>
            <Button variant="danger" size="sm" className="self-start">
              Close account
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}
