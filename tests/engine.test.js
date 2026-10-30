// Unit sanity checks for the math engines. Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { runWaterfall } from '../src/utils/waterfall.js';
import { modelRound, resolveMfn, applyRound } from '../src/utils/conversion.js';
import { commonPricePerShare, optionValue, breakEvenExit } from '../src/utils/options.js';

const close = (a, b, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${a} !~ ${b}`);
const H = (o) => ({ isPool: false, invested: 0, multiple: 1, seniority: 0, participating: false, cap: 0, type: 'common', ...o });

test('waterfall: payouts always sum to exit', () => {
  const hs = [H({ id: 'c', shares: 8e6 }), H({ id: 'p', type: 'preferred', shares: 2e6, invested: 5e6, multiple: 2, participating: true, cap: 3 })];
  for (const e of [0, 1e6, 1e7, 3e7, 1e9]) close(runWaterfall(hs, e).reduce((s, r) => s + r.total, 0), e, 0.01);
});

test('waterfall: 1x non-participating takes pref when low, converts when high', () => {
  const hs = [H({ id: 'c', shares: 8e6 }), H({ id: 'p', type: 'preferred', shares: 2e6, invested: 10e6 })];
  let r = runWaterfall(hs, 20e6); close(r[1].total, 10e6); assert.equal(r[1].converted, false);
  r = runWaterfall(hs, 100e6); close(r[1].total, 20e6); assert.equal(r[1].converted, true);
});

test('waterfall: senior tier paid before junior', () => {
  const hs = [H({ id: 'c', shares: 1e6 }), H({ id: 'j', type: 'preferred', shares: 1e6, invested: 5e6, seniority: 1 }), H({ id: 's', type: 'preferred', shares: 1e6, invested: 5e6, seniority: 2 })];
  const r = runWaterfall(hs, 6e6); close(r[2].total, 5e6); close(r[1].total, 1e6); close(r[0].total, 0);
});

test('post-money SAFEs match the Binderwork reference cap table', () => {
  const holders = [H({ id: 'c', shares: 9e6 }), H({ id: 'o', shares: 1e6, isPool: true })];
  const instruments = [
    { id: '1', name: 'S1', kind: 'safe', basis: 'post', amount: 1e6, cap: 10e6, discount: 0 },
    { id: '2', name: 'S2', kind: 'safe', basis: 'post', amount: 6e5, cap: 12e6, discount: 0 },
    { id: '3', name: 'S3', kind: 'safe', basis: 'post', amount: 4e5, cap: 8e6, discount: 0 },
  ];
  const r = modelRound({ holders, instruments, round: { preMoney: 15e6, newMoney: 3.75e6, poolTarget: 0 } });
  close(r.price, 1.2, 1e-6); close(r.companyCap, 12.5e6);
  close(r.conversions[0].shares, 1.25e6); close(r.conversions[1].shares, 625000); close(r.conversions[2].shares, 625000);
  close(r.newShares, 3.125e6); close(r.postFD, 15.625e6);
});

test('post-money SAFEs do not dilute each other: ownership = amount / cap', () => {
  const holders = [H({ id: 'c', shares: 10e6 })];
  const instruments = Array.from({ length: 5 }, (_, i) => ({ id: `${i}`, name: `S${i}`, kind: 'safe', basis: 'post', amount: 1e5, cap: 5e6, discount: 0 }));
  const r = modelRound({ holders, instruments, round: { preMoney: 50e6, newMoney: 0, poolTarget: 0 } });
  close(r.convShares / r.companyCap, 0.10, 1e-9);
});

test('pre-money SAFE, discount-only SAFE, and note interest', () => {
  const holders = [H({ id: 'c', shares: 9e6 })];
  const r = modelRound({ holders, round: { preMoney: 20e6, newMoney: 0, poolTarget: 0 }, instruments: [
    { id: 'a', name: 'pre', kind: 'safe', basis: 'pre', amount: 1e6, cap: 9e6, discount: 0 },
  ] });
  close(r.conversions[0].price, 1, 1e-9); close(r.price, 2, 1e-9);
  const d = modelRound({ holders, round: { preMoney: 9e6, newMoney: 0, poolTarget: 0 }, instruments: [
    { id: 'b', name: 'disc', kind: 'safe', basis: 'post', amount: 8e5, cap: 0, discount: 20 },
  ] });
  close(d.conversions[0].price, d.price * 0.8, 1e-9);
  const n = modelRound({ holders, round: { preMoney: 90e6, newMoney: 0, poolTarget: 0 }, instruments: [
    { id: 'n', name: 'note', kind: 'note', basis: 'pre', amount: 1e6, cap: 9e6, discount: 0, rate: 10, months: 12 },
  ] });
  close(n.conversions[0].convertingAmount, 1.1e6); close(n.conversions[0].shares, 1.1e6);
});

test('pool top-up hits target % of post-money FD', () => {
  const holders = [H({ id: 'c', shares: 9e6 }), H({ id: 'o', shares: 5e5, isPool: true })];
  const r = modelRound({ holders, instruments: [], round: { preMoney: 40e6, newMoney: 10e6, poolTarget: 10 } });
  close((5e5 + r.topUp) / r.postFD, 0.10, 1e-9);
  close(r.newShares / r.postFD, 0.20, 1e-9); // new money ownership = new / post-money
});

test('MFN inherits best cap and discount', () => {
  const r = resolveMfn([{ cap: 10e6, discount: 10 }, { cap: 8e6, discount: 20 }, { cap: 0, discount: 0, mfn: true }]);
  assert.equal(r[2].effCap, 8e6); assert.equal(r[2].effDiscount, 20);
});

test('applyRound preserves share counts', () => {
  const holders = [H({ id: 'c', shares: 9e6 }), H({ id: 'o', shares: 5e5, isPool: true })];
  const round = { name: 'A', preMoney: 40e6, newMoney: 10e6, poolTarget: 10, multiple: 1 };
  const r = modelRound({ holders, instruments: [], round });
  const next = applyRound(holders, r, round, () => Math.random().toString());
  close(next.reduce((s, h) => s + h.shares, 0), r.postFD, 3);
});

test('options: value uses waterfall, break-even exit is consistent', () => {
  const hs = [H({ id: 'c', shares: 9e6 }), H({ id: 'o', shares: 1e6, isPool: true }), H({ id: 'p', type: 'preferred', shares: 1e6, invested: 10e6 })];
  close(commonPricePerShare(hs, 10e6), 0, 1e-9); // all to pref
  close(commonPricePerShare(hs, 30e6), 20e6 / 9e6, 1e-6); // pref takes 10M (converting = 3M); common splits 20M over 9M outstanding
  const v = optionValue(hs, { options: 1000, strike: 1, vestedPct: 50, taxPct: 0 }, 19e6);
  close(v.gross, 500 * (1 - 1), 1e-6);
  const be = breakEvenExit(hs, 1);
  close(be, 19e6, 10);
});
