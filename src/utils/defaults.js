// Seed data and factories. The whole app shares one persisted state object.
export const uid = () => Math.random().toString(36).slice(2, 9);

export const COLORS = ['#c6ff3d', '#38bdf8', '#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#fb7185', '#94a3b8', '#2dd4bf', '#f97316'];

export const DEFAULT_STATE = {
  version: 2,
  company: 'Acme Robotics, Inc.',
  exit: 40000000,
  holders: [
    { id: 'f', name: 'Founders', type: 'common', isPool: false, shares: 7000000, invested: 0, multiple: 1, seniority: 0, participating: false, cap: 0 },
    { id: 'o', name: 'Option pool', type: 'common', isPool: true, shares: 1500000, invested: 0, multiple: 1, seniority: 0, participating: false, cap: 0 },
    { id: 's', name: 'Seed', type: 'preferred', isPool: false, shares: 1500000, invested: 3000000, multiple: 1, seniority: 1, participating: false, cap: 0 },
    { id: 'a', name: 'Series A', type: 'preferred', isPool: false, shares: 2500000, invested: 15000000, multiple: 1.5, seniority: 2, participating: true, cap: 3 },
  ],
  instruments: [
    { id: 'i1', name: 'Bridge SAFE', kind: 'safe', basis: 'post', amount: 2000000, cap: 60000000, discount: 20, mfn: false, rate: 0, months: 0 },
    { id: 'i2', name: 'Angel note', kind: 'note', basis: 'pre', amount: 500000, cap: 50000000, discount: 15, mfn: false, rate: 6, months: 18 },
  ],
  round: { name: 'Series B', preMoney: 80000000, newMoney: 20000000, poolTarget: 12, multiple: 1, participating: false, participationCap: 0 },
  grant: { options: 40000, strike: 1.2, vestedPct: 50, taxPct: 30 },
  scenarios: [25000000, 80000000, 250000000],
};

export const newHolder = (type) => ({
  id: uid(), name: type === 'common' ? 'New common' : 'New series', type, isPool: false,
  shares: 1000000, invested: type === 'common' ? 0 : 5000000, multiple: 1,
  seniority: 1, participating: false, cap: 0,
});

export const newInstrument = (kind) => ({
  id: uid(), name: kind === 'note' ? 'New note' : 'New SAFE', kind, basis: kind === 'note' ? 'pre' : 'post',
  amount: 500000, cap: 20000000, discount: 0, mfn: false, rate: kind === 'note' ? 5 : 0, months: kind === 'note' ? 12 : 0,
});

// ---------------- Investor mode ----------------
export const DEFAULT_INVESTOR = {
  version: 1,
  investor: 'Jane Doe Angel LLC',
  asOf: '2026-10-30',
  reserveBudget: 400000,
  positions: [
    { id: 'p1', name: 'Northwind AI', stage: 'Seed', instrument: 'Priced', ownershipPct: 1.2,
      checks: [{ id: 'c1', date: '2022-03-15', amount: 100000 }, { id: 'c2', date: '2024-01-10', amount: 150000 }],
      distributions: [], mark: 900000, markDate: '2026-09-01', next: { preMoney: 240000000, newMoney: 60000000, probability: 70, take: true } },
    { id: 'p2', name: 'Ledgerly', stage: 'Pre-seed', instrument: 'SAFE', ownershipPct: 0.8,
      checks: [{ id: 'c3', date: '2023-06-01', amount: 50000 }], distributions: [], mark: 50000, markDate: '2023-06-01',
      next: { preMoney: 20000000, newMoney: 5000000, probability: 45, take: true } },
    { id: 'p3', name: 'Quanta Bio', stage: 'Series A', instrument: 'Priced', ownershipPct: 0.3,
      checks: [{ id: 'c4', date: '2021-09-20', amount: 75000 }], distributions: [{ id: 'd1', date: '2025-11-02', amount: 40000 }], mark: 0, markDate: '2025-11-02',
      next: { preMoney: 0, newMoney: 0, probability: 0, take: false } },
    { id: 'p4', name: 'Fleetwise', stage: 'Seed', instrument: 'Priced', ownershipPct: 0.6,
      checks: [{ id: 'c5', date: '2024-05-05', amount: 60000 }], distributions: [], mark: 120000, markDate: '2026-04-01',
      next: { preMoney: 45000000, newMoney: 12000000, probability: 55, take: true } },
  ],
  base: { existingShares: 10000000, seniorPref: 4000000, priorShares: 2000000, priorSenior: false, years: 6 },
  sheets: [
    { id: 't1', name: 'Lead A: clean', invest: 500000, roundSize: 6000000, preMoney: 24000000, poolPct: 10, multiple: 1, participating: false, cap: 0 },
    { id: 't2', name: 'Lead B: higher price, 2x participating', invest: 500000, roundSize: 6000000, preMoney: 30000000, poolPct: 15, multiple: 2, participating: true, cap: 3 },
  ],
  scenarios: [15000000, 60000000, 300000000],
};

export const newPosition = () => ({
  id: uid(), name: 'New company', stage: 'Seed', instrument: 'SAFE', ownershipPct: 0.5,
  checks: [{ id: uid(), date: new Date().toISOString().slice(0, 10), amount: 25000 }], distributions: [], mark: 25000,
  markDate: new Date().toISOString().slice(0, 10), next: { preMoney: 20000000, newMoney: 5000000, probability: 50, take: true },
});

export const newSheet = () => ({ id: uid(), name: 'New term sheet', invest: 250000, roundSize: 5000000, preMoney: 20000000, poolPct: 10, multiple: 1, participating: false, cap: 0 });
