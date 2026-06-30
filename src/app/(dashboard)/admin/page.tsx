import type { Metadata } from "next";
import { getAdmins } from "@/lib/data/admins";
import { AdminsManager } from "@/components/admins/admins-manager";

export const metadata: Metadata = {
  title: "Admins — Greengate",
  description: "Manage back-office admin accounts, roles and access.",
};

export default function AdminsPage() {
  const admins = getAdmins();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Admin Management</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Back-office staff accounts, roles and access control.
        </p>
      </div>
      <AdminsManager initialAdmins={admins} />
    </div>
  );
}
