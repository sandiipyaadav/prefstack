// Investor math sanity checks. Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { xirr, positionMetrics, portfolioSummary, proRata, reservesPlan, termSheetHolders, termSheetPayout } from '../src/utils/investor.js';

const close = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} !~ ${b}`);

test('XIRR: -100 then +121 two years later = 10%', () => {
  close(xirr([{ date: '2020-01-01', amount: -100 }, { date: '2022-01-01', amount: 121 }]), 0.1, 1e-3);
});

test('XIRR: matches Excel reference example (37.3%)', () => {
  // Microsoft XIRR docs example -> 0.373362535
  const r = xirr([
    { date: '2008-01-01', amount: -10000 }, { date: '2008-03-01', amount: 2750 }, { date: '2008-10-30', amount: 4250 },
    { date: '2009-02-15', amount: 3250 }, { date: '2009-04-01', amount: 2750 },
  ]);
  close(r, 0.373362535, 1e-4);
});

test('XIRR: total loss is -100%, no positive flow returns null', () => {
  assert.equal(xirr([{ date: '2020-01-01', amount: -100 }]), null);
  const r = xirr([{ date: '2020-01-01', amount: -100 }, { date: '2021-01-01', amount: 50 }]);
  close(r, -0.5, 1e-3);
});

test('MOIC / DPI / RVPI per position', () => {
  const m = positionMetrics({ checks: [{ date: '2020-01-01', amount: 100 }], distributions: [{ date: '2021-01-01', amount: 50 }], mark: 250, markDate: '2022-01-01' });
  close(m.moic, 3); close(m.dpi, 0.5); close(m.rvpi, 2.5); close(m.gain, 200);
});

test('Portfolio TVPI aggregates on paid-in, not average of MOICs', () => {
  const s = portfolioSummary([
    { checks: [{ date: '2020-01-01', amount: 100 }], distributions: [], mark: 1000, markDate: '2024-01-01' },
    { checks: [{ date: '2020-01-01', amount: 900 }], distributions: [], mark: 0, markDate: '2024-01-01' },
  ]);
  close(s.tvpi, 1.0); // (1000+0)/(100+900), while the mean MOIC would be 5x
  assert.equal(s.winners, 1); assert.equal(s.losers, 1);
});

test('Pro-rata keeps ownership flat', () => {
  const r = proRata({ ownershipPct: 2, preMoney: 80e6, newMoney: 20e6 });
  close(r.check, 400000); close(r.diluted, 0.016); close(r.withProRata, 0.02);
});

test('Reserves are probability weighted; declined rounds reserve nothing', () => {
  const plan = reservesPlan([
    { id: 'a', ownershipPct: 1, next: { preMoney: 40e6, newMoney: 10e6, probability: 50, take: true } },
    { id: 'b', ownershipPct: 1, next: { preMoney: 40e6, newMoney: 10e6, probability: 100, take: false } },
  ], 100000);
  close(plan.totalPlanned, 100000); close(plan.totalWeighted, 50000); close(plan.gap, 50000);
});

test('Term sheet: price, pool shuffle, ownership = invest / post when no pool', () => {
  const base = { existingShares: 10e6, seniorPref: 0, priorShares: 0 };
  const sheet = { invest: 1e6, roundSize: 5e6, preMoney: 20e6, poolPct: 0, multiple: 1, participating: false, cap: 0 };
  const t = termSheetHolders(sheet, base);
  close(t.price, 2); close(t.ownership, 1e6 / 25e6);
  const withPool = termSheetHolders({ ...sheet, poolPct: 10 }, base);
  const fd = withPool.holders.reduce((s, h) => s + h.shares, 0);
  close(withPool.pool / fd, 0.10, 1e-9); // pool is 10% of post
  close(withPool.holders.find((h) => h.id === 'you').shares / fd, 1e6 / 25e6, 1e-9); // new money still owns invest/post
});

test('Term sheet payout: 1x non-participating takes pref at low exit, converts at high', () => {
  const base = { existingShares: 10e6, seniorPref: 0, priorShares: 0 };
  const sheet = { invest: 1e6, roundSize: 5e6, preMoney: 20e6, poolPct: 0, multiple: 1, participating: false, cap: 0 };
  close(termSheetPayout(sheet, base, 10e6, 5).payout, 1e6, 1e-3);
  const hi = termSheetPayout(sheet, base, 250e6, 5);
  close(hi.payout, 10e6, 1e-3); assert.equal(hi.converted, true); close(hi.moic, 10, 1e-6);
  close(hi.irr, Math.pow(10, 1 / 5) - 1, 1e-9);
});
