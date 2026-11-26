// Seed data and the local store for HomeLedger, the household budget site of
// Keluarga Santoso (an example Indonesian family, November 2026).
//
// The store keeps every change in localStorage, so the site works offline and
// remembers edits, additions and paid bills between visits. On a first visit
// it seeds from the realistic month below; "Reset example data" on the About
// page restores it.

export const MONTH_LABEL = 'November 2026';
export const HOUSEHOLD = 'Keluarga Santoso';
export const STORAGE_KEY = 'homeledger-santoso-v1';

// Expense categories, each with its own colour used by the charts and bars.
export const CATEGORIES = [
  { id: 'groceries', name: 'Groceries', color: '#2f7d6b' },
  { id: 'utilities', name: 'Utilities', color: '#d9930d' },
  { id: 'transport', name: 'Transport', color: '#4a7fb5' },
  { id: 'school', name: 'School & kids', color: '#8a5fb0' },
  { id: 'food', name: 'Food & dining', color: '#c65b4e' },
  { id: 'health', name: 'Health', color: '#b0487a' },
  { id: 'entertainment', name: 'Entertainment', color: '#e07840' },
  { id: 'household', name: 'Household', color: '#6b7f59' },
];

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || { id, name: id, color: '#888888' };
}

// Monthly budget plan per category, in rupiah. Planned spending is
// Rp 10,700,000 against Rp 12,500,000 of income, so Rp 1,800,000 is planned
// to be saved.
export const SEED_BUDGETS = {
  groceries: 2400000,
  utilities: 1100000,
  transport: 1200000,
  school: 1500000,
  food: 900000,
  health: 900000,
  entertainment: 500000,
  household: 2200000,
};

// [day, category, note, amount] — every expense of November 2026.
const SEED_EXPENSES = [
  [1, 'household', 'House rent — November', 1500000],
  [1, 'entertainment', 'Netflix subscription', 65000],
  [2, 'groceries', 'Weekly market shop — Pasar Minggu', 385000],
  [2, 'transport', 'Pertalite fuel', 150000],
  [3, 'utilities', 'PLN electricity bill', 420000],
  [3, 'school', 'SPP school fee — Ayu', 650000],
  [3, 'food', 'Warteg lunch', 45000],
  [4, 'transport', 'Gojek rides', 86000],
  [4, 'household', 'Detergent & cleaning supplies', 132000],
  [5, 'groceries', 'Indomaret — milk, eggs, bread', 142000],
  [5, 'school', 'Books & stationery', 185000],
  [6, 'utilities', 'PDAM water bill', 185000],
  [6, 'health', 'Apotek — vitamins', 145000],
  [7, 'transport', 'Pertalite fuel', 150000],
  [7, 'food', 'Bakso family dinner', 120000],
  [8, 'entertainment', 'Cinema — family movie', 180000],
  [9, 'groceries', 'Weekly market shop — Pasar Minggu', 410000],
  [9, 'household', 'Kitchen supplies', 210000],
  [10, 'school', 'Maths tutoring — Ayu', 300000],
  [10, 'health', 'BPJS Kesehatan', 210000],
  [11, 'transport', 'TransJakarta card top-up', 100000],
  [12, 'groceries', 'Indomaret — rice 5 kg, oil', 98500],
  [12, 'utilities', 'IndiHome internet', 350000],
  [12, 'health', 'Doctor visit — Budi', 250000],
  [13, 'food', 'Nasi Padang', 85000],
  [14, 'transport', 'Pertalite fuel', 150000],
  [14, 'entertainment', 'Spotify', 55000],
  [15, 'utilities', 'LPG gas refill', 95000],
  [15, 'food', 'Pizza night with the kids', 165000],
  [16, 'groceries', 'Weekly market shop — Pasar Minggu', 392000],
  [16, 'household', 'Laundry', 85000],
  [17, 'school', 'School uniform', 240000],
  [18, 'transport', 'Gojek rides', 92000],
  [19, 'groceries', 'Alfamart — snacks & fruit', 121000],
  [19, 'health', 'Apotek — medicine', 98000],
  [20, 'food', 'Soto ayam', 65000],
  [20, 'household', 'New bed sheets', 175000],
  [21, 'transport', 'Pertalite fuel', 150000],
  [21, 'entertainment', 'Game top-up — Budi', 75000],
  [22, 'school', 'English tutoring — Budi', 150000],
  [23, 'groceries', 'Weekly market shop — Pasar Minggu', 405000],
  [24, 'transport', 'Motorbike service', 210000],
  [24, 'food', 'Warung kopi & snacks', 58000],
  [24, 'household', 'Light bulbs & tools', 78000],
  [25, 'health', 'Dental check — Ayu', 180000],
  [25, 'entertainment', 'Board game', 95000],
  [26, 'groceries', 'Indomaret — chicken, vegetables', 156000],
  [26, 'food', 'Ayam geprek', 72000],
  [27, 'transport', 'Pertalite fuel', 100000],
  [28, 'groceries', 'Sayur keliling — vegetables', 85000],
  [28, 'food', 'Family dinner — resto', 210000],
];

// [day, note, amount] — the household's income for November 2026.
const SEED_INCOME = [
  [1, 'Salary — Budi (office)', 9500000],
  [8, 'Freelance design — side income', 1800000],
  [20, 'Weekend catering order', 1200000],
];

function buildSeedTransactions() {
  const list = [];
  SEED_EXPENSES.forEach(([day, category, note, amount], i) => {
    list.push({
      id: `t${i + 1}`,
      date: `2026-11-${String(day).padStart(2, '0')}`,
      type: 'expense',
      category,
      note,
      amount,
    });
  });
  SEED_INCOME.forEach(([day, note, amount], i) => {
    list.push({
      id: `i${i + 1}`,
      date: `2026-11-${String(day).padStart(2, '0')}`,
      type: 'income',
      category: 'income',
      note,
      amount,
    });
  });
  list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
  return list;
}

// Recurring monthly bills. `paid` is the state as of 26 November 2026 —
// the two bills due at the end of the month are still unpaid.
export const SEED_BILLS = [
  { id: 'rent', name: 'House rent', amount: 1500000, dueDay: 1, paid: true },
  { id: 'netflix', name: 'Netflix', amount: 65000, dueDay: 1, paid: true },
  { id: 'pln', name: 'PLN electricity', amount: 420000, dueDay: 5, paid: true },
  { id: 'spp', name: 'School fee — Ayu (SPP)', amount: 650000, dueDay: 5, paid: true },
  { id: 'pdam', name: 'PDAM water', amount: 185000, dueDay: 10, paid: true },
  { id: 'bpjs', name: 'BPJS Kesehatan', amount: 210000, dueDay: 10, paid: true },
  { id: 'internet', name: 'IndiHome internet', amount: 350000, dueDay: 12, paid: true },
  { id: 'spotify', name: 'Spotify', amount: 55000, dueDay: 14, paid: true },
  { id: 'water', name: 'Water gallons delivery', amount: 60000, dueDay: 29, paid: false },
  { id: 'stnk', name: 'Motorbike tax (STNK)', amount: 185000, dueDay: 30, paid: false },
];

// Savings goals, in rupiah.
export const SEED_GOALS = [
  { id: 'emergency', name: 'Emergency fund', target: 15000000, saved: 9250000, note: 'Six months of essentials, for the unexpected.' },
  { id: 'house', name: 'House down payment', target: 100000000, saved: 24500000, note: 'A home of our own, one step at a time.' },
  { id: 'hajj', name: 'Hajj / Umrah fund', target: 45000000, saved: 8750000, note: 'Saving together for the holy journey.' },
  { id: 'motorbike', name: 'New motorbike', target: 22000000, saved: 6400000, note: 'Replace the old bike before it gives up.' },
];

// Six-month trend, June to November 2026, in rupiah.
export const TREND = [
  { month: 'Jun', income: 12100000, spending: 10050000 },
  { month: 'Jul', income: 12300000, spending: 10420000 },
  { month: 'Aug', income: 12500000, spending: 9870000 },
  { month: 'Sep', income: 12400000, spending: 10180000 },
  { month: 'Oct', income: 12600000, spending: 10540000 },
  { month: 'Nov', income: 12500000, spending: 10310500 },
];

export function seedState() {
  return {
    transactions: buildSeedTransactions(),
    budgets: { ...SEED_BUDGETS },
    bills: SEED_BILLS.map((b) => ({ ...b })),
    goals: SEED_GOALS.map((g) => ({ ...g })),
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.transactions) && parsed.budgets && parsed.bills && parsed.goals) {
        return parsed;
      }
    }
  } catch {
    // A damaged store falls back to the seed data below.
  }
  const fresh = seedState();
  saveState(fresh);
  return fresh;
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable: the page still works for this visit.
  }
}

export function resetState() {
  const fresh = seedState();
  saveState(fresh);
  return fresh;
}

// --- Small helpers shared by the views -------------------------------------

export function formatRp(amount) {
  const n = Math.round(Number(amount) || 0);
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export function formatShort(amount) {
  const n = Number(amount) || 0;
  if (Math.abs(n) >= 1000000) return `Rp ${(n / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} jt`;
  if (Math.abs(n) >= 1000) return `Rp ${Math.round(n / 1000)} rb`;
  return formatRp(n);
}

export function prettyDate(iso) {
  const [, m, d] = iso.split('-').map(Number);
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${names[m - 1]} 2026`;
}

export function totalIncome(state) {
  return state.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
}

export function totalSpending(state) {
  return state.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
}

export function spentByCategory(state) {
  const out = {};
  for (const c of CATEGORIES) out[c.id] = 0;
  for (const t of state.transactions) {
    if (t.type === 'expense' && out[t.category] !== undefined) out[t.category] += t.amount;
  }
  return out;
}

export function totalBudget(state) {
  return Object.values(state.budgets).reduce((s, v) => s + v, 0);
}
