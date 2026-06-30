import type { Metadata } from "next";
import { getBanks } from "@/lib/data/banks";
import { BanksManager } from "@/components/system-config/banks-manager";

export const metadata: Metadata = {
  title: "Banks — System Config",
};

export default function BanksPage() {
  const banks = getBanks();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/system-config" className="hover:text-ink">System Config</a>
        <span>/</span>
        <span className="text-ink">Banks</span>
      </div>
      <BanksManager initialBanks={banks} />
    </div>
  );
}
