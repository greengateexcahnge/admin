import type { Metadata } from "next";
import { getFeeSchedules } from "@/lib/data/fee-schedules";
import { getAssets } from "@/lib/data/assets";
import { FeeSchedulesManager } from "@/components/system-config/fee-schedules-manager";

export const metadata: Metadata = {
  title: "Fee Schedules — System Config",
};

export default function FeeSchedulesPage() {
  const rows = getFeeSchedules();
  const assets = getAssets();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/system-config" className="hover:text-ink">System Config</a>
        <span>/</span>
        <span className="text-ink">Fee Schedules</span>
      </div>
      <FeeSchedulesManager initialRows={rows} assets={assets} />
    </div>
  );
}
