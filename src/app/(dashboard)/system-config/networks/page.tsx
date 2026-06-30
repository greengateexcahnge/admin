import type { Metadata } from "next";
import { getNetworks } from "@/lib/data/networks";
import { NetworksManager } from "@/components/system-config/networks-manager";

export const metadata: Metadata = {
  title: "Networks — System Config",
};

export default function NetworksPage() {
  const networks = getNetworks();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/system-config" className="hover:text-ink">System Config</a>
        <span>/</span>
        <span className="text-ink">Networks</span>
      </div>
      <NetworksManager initialNetworks={networks} />
    </div>
  );
}
