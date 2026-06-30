/** Mirrors ref.banks (Database.md §8) — Nigerian banks for fiat withdrawal. */

export interface Bank {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

const SEED: Bank[] = [
  { id: "bk-001", code: "044",  name: "Access Bank",                isActive: true },
  { id: "bk-002", code: "023",  name: "Citibank Nigeria",           isActive: true },
  { id: "bk-003", code: "050",  name: "Ecobank Nigeria",            isActive: true },
  { id: "bk-004", code: "011",  name: "First Bank of Nigeria",      isActive: true },
  { id: "bk-005", code: "214",  name: "First City Monument Bank",   isActive: true },
  { id: "bk-006", code: "070",  name: "Fidelity Bank",              isActive: true },
  { id: "bk-007", code: "058",  name: "GTBank",                     isActive: true },
  { id: "bk-008", code: "030",  name: "Heritage Bank",              isActive: false },
  { id: "bk-009", code: "301",  name: "Jaiz Bank",                  isActive: true },
  { id: "bk-010", code: "082",  name: "Keystone Bank",              isActive: true },
  { id: "bk-011", code: "076",  name: "Polaris Bank",               isActive: true },
  { id: "bk-012", code: "039",  name: "Stanbic IBTC Bank",          isActive: true },
  { id: "bk-013", code: "232",  name: "Sterling Bank",              isActive: true },
  { id: "bk-014", code: "033",  name: "Union Bank",                 isActive: true },
  { id: "bk-015", code: "032",  name: "United Bank for Africa",     isActive: true },
  { id: "bk-016", code: "215",  name: "Unity Bank",                 isActive: true },
  { id: "bk-017", code: "035A", name: "Wema Bank",                  isActive: true },
  { id: "bk-018", code: "057",  name: "Zenith Bank",                isActive: true },
];

const _store = [...SEED];
let _counter = SEED.length + 1;

export function getBanks(): Bank[] { return _store; }

export interface BankSummary { total: number; active: number }
export function getBankSummary(banks: Bank[]): BankSummary {
  return { total: banks.length, active: banks.filter(b => b.isActive).length };
}

export function nextBankId(): string { return `bk-custom-${_counter++}`; }
