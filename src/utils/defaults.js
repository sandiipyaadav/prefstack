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
