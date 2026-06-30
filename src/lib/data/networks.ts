/** Mirrors ref.networks (Database.md §8). */

export interface Network {
  id: string;
  code: string;
  name: string;
  confirmationsRequired: number;
  isActive: boolean;
}

const SEED: Network[] = [
  { id: "net-btc",  code: "bitcoin",  name: "Bitcoin",               confirmationsRequired: 2,  isActive: true },
  { id: "net-eth",  code: "ethereum", name: "Ethereum (ERC-20)",      confirmationsRequired: 12, isActive: true },
  { id: "net-trx",  code: "tron",     name: "Tron (TRC-20)",          confirmationsRequired: 20, isActive: true },
  { id: "net-bsc",  code: "bsc",      name: "BNB Smart Chain (BEP-20)", confirmationsRequired: 15, isActive: true },
];

const _store = [...SEED];
let _counter = SEED.length + 1;

export function getNetworks(): Network[] { return _store; }

export interface NetworkSummary { total: number; active: number }
export function getNetworkSummary(nets: Network[]): NetworkSummary {
  return { total: nets.length, active: nets.filter(n => n.isActive).length };
}

export function nextNetworkId(): string { return `net-custom-${_counter++}`; }
