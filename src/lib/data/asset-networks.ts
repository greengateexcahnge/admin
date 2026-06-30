/** Mirrors ref.asset_networks (Database.md §8) — an asset on a specific network. */

export interface AssetNetwork {
  id: string;
  assetId: string;
  assetSymbol: string;
  networkId: string;
  networkCode: string;
  networkName: string;
  contractAddress: string | null;
  minDeposit: number | null;
  minWithdrawal: number | null;
  withdrawalFee: number | null;
  isActive: boolean;
}

const SEED: AssetNetwork[] = [
  {
    id: "an-btc-bitcoin",
    assetId: "a-btc", assetSymbol: "BTC",
    networkId: "net-btc", networkCode: "bitcoin", networkName: "Bitcoin",
    contractAddress: null, minDeposit: 0.0001, minWithdrawal: 0.0002, withdrawalFee: 0.0005,
    isActive: true,
  },
  {
    id: "an-eth-ethereum",
    assetId: "a-eth", assetSymbol: "ETH",
    networkId: "net-eth", networkCode: "ethereum", networkName: "Ethereum (ERC-20)",
    contractAddress: null, minDeposit: 0.01, minWithdrawal: 0.02, withdrawalFee: 0.005,
    isActive: true,
  },
  {
    id: "an-usdt-ethereum",
    assetId: "a-usdt", assetSymbol: "USDT",
    networkId: "net-eth", networkCode: "ethereum", networkName: "Ethereum (ERC-20)",
    contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    minDeposit: 10, minWithdrawal: 20, withdrawalFee: 3,
    isActive: true,
  },
  {
    id: "an-usdt-tron",
    assetId: "a-usdt", assetSymbol: "USDT",
    networkId: "net-trx", networkCode: "tron", networkName: "Tron (TRC-20)",
    contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    minDeposit: 5, minWithdrawal: 10, withdrawalFee: 1,
    isActive: true,
  },
  {
    id: "an-usdt-bsc",
    assetId: "a-usdt", assetSymbol: "USDT",
    networkId: "net-bsc", networkCode: "bsc", networkName: "BNB Smart Chain (BEP-20)",
    contractAddress: "0x55d398326f99059fF775485246999027B3197955",
    minDeposit: 5, minWithdrawal: 10, withdrawalFee: 0.5,
    isActive: true,
  },
  {
    id: "an-usdc-ethereum",
    assetId: "a-usdc", assetSymbol: "USDC",
    networkId: "net-eth", networkCode: "ethereum", networkName: "Ethereum (ERC-20)",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    minDeposit: 10, minWithdrawal: 20, withdrawalFee: 3,
    isActive: true,
  },
  {
    id: "an-usdc-bsc",
    assetId: "a-usdc", assetSymbol: "USDC",
    networkId: "net-bsc", networkCode: "bsc", networkName: "BNB Smart Chain (BEP-20)",
    contractAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    minDeposit: 5, minWithdrawal: 10, withdrawalFee: 0.5,
    isActive: true,
  },
];

const _store = [...SEED];
let _counter = SEED.length + 1;

export function getAssetNetworks(): AssetNetwork[] { return _store; }

export function getAssetNetworksByAsset(): Record<string, AssetNetwork[]> {
  return _store.reduce<Record<string, AssetNetwork[]>>((acc, an) => {
    (acc[an.assetSymbol] ??= []).push(an);
    return acc;
  }, {});
}

export interface AssetNetworkSummary { total: number; active: number }
export function getAssetNetworkSummary(rows: AssetNetwork[]): AssetNetworkSummary {
  return { total: rows.length, active: rows.filter(r => r.isActive).length };
}

export function nextAssetNetworkId(): string { return `an-custom-${_counter++}`; }
