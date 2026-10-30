// Example cap table: founders + pool + Seed + Series A. Used on first load and on reset.
export const uid = () => Math.random().toString(36).slice(2, 9);

export const COLORS = ['#c6ff3d', '#38bdf8', '#f472b6', '#fbbf24', '#a78bfa', '#34d399', '#fb7185', '#94a3b8'];

export const DEFAULT_STATE = {
  exit: 40000000,
  holders: [
    { id: 'f', name: 'Founders', type: 'common', shares: 7000000, invested: 0, multiple: 1, seniority: 0, participating: false, cap: 0 },
    { id: 'o', name: 'Option pool', type: 'common', shares: 1500000, invested: 0, multiple: 1, seniority: 0, participating: false, cap: 0 },
    { id: 's', name: 'Seed', type: 'preferred', shares: 1500000, invested: 3000000, multiple: 1, seniority: 1, participating: false, cap: 0 },
    { id: 'a', name: 'Series A', type: 'preferred', shares: 2500000, invested: 15000000, multiple: 1.5, seniority: 2, participating: true, cap: 3 },
  ],
};

export const newHolder = (type) => ({
  id: uid(), name: type === 'common' ? 'New common' : 'New series', type,
  shares: 1000000, invested: type === 'common' ? 0 : 5000000, multiple: 1,
  seniority: 1, participating: false, cap: 0,
});
