import { getAccountLocks, getRestrictions } from "@/lib/data/security-data";
import { SecurityManager } from "@/components/security/security-manager";
import { Icons } from "@/components/icons";

export default function SystemSecurityPage() {
  const locks = getAccountLocks();
  const restrictions = getRestrictions();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-danger/10">
          <Icons.shieldAlert className="size-5 text-danger" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-ink">System Security</h1>
          <p className="text-sm text-ink-muted">Account locks and transaction restrictions across the platform</p>
        </div>
      </div>

      <SecurityManager initialLocks={locks} initialRestrictions={restrictions} />
    </div>
  );
}
