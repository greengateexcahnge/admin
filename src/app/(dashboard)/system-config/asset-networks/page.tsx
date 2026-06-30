import type { Metadata } from "next";
import { getAssetNetworks } from "@/lib/data/asset-networks";
import { getAssets } from "@/lib/data/assets";
import { getNetworks } from "@/lib/data/networks";
import { AssetNetworksManager } from "@/components/system-config/asset-networks-manager";

export const metadata: Metadata = {
  title: "Asset Networks — System Config",
};

export default function AssetNetworksPage() {
  const rows = getAssetNetworks();
  const assets = getAssets();
  const networks = getNetworks();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <a href="/system-config" className="hover:text-ink">System Config</a>
        <span>/</span>
        <span className="text-ink">Asset Networks</span>
      </div>
      <AssetNetworksManager initialRows={rows} assets={assets} networks={networks} />
    </div>
  );
}
