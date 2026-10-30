/**
 * Investor-side math (pure functions): XIRR, MOIC, TVPI/DPI/RVPI, pro-rata,
 * probability-weighted reserves, and term-sheet payout using the waterfall engine.
 */
import { runWaterfall } from './waterfall.js';

const DAY = 86400000;
const n = (v) => Number(v) || 0;

/** XNPV of dated cashflows at an annual rate (Actual/365, like Excel XIRR). */
export function xnpv(rate, flows) {
  const t0 = Math.min(...flows.map((f) => new Date(f.date).getTime()));
  return flows.reduce((s, f) => s + n(f.amount) / Math.pow(1 + rate, (new Date(f.date).getTime() - t0) / DAY / 365), 0);
}

/**
 * XIRR: annualised IRR of dated cashflows (negative = money in, positive = money out).
 * Uses bisection, which is robust. Returns null when undefined (no sign change).
 */
export function xirr(flows) {
  const valid = flows.filter((f) => f.date && !Number.isNaN(new Date(f.date).getTime()) && n(f.amount) !== 0);
  if (!valid.some((f) => n(f.amount) < 0) || !valid.some((f) => n(f.amount) > 0)) return null;
  let lo = -0.9999, hi = 1;
  while (xnpv(hi, valid) > 0 && hi < 1e6) hi *= 2;
  const fLo = xnpv(lo, valid), fHi = xnpv(hi, valid);
  if (Math.sign(fLo) === Math.sign(fHi)) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const v = xnpv(mid, valid);
    if (Math.abs(v) < 1e-9) return mid;
    if (Math.sign(v) === Math.sign(fLo)) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Per-position metrics. Position: { checks:[{date,amount}], distributions:[{date,amount}], mark, markDate } */
export function positionMetrics(p, asOf = new Date().toISOString().slice(0, 10)) {
  const invested = (p.checks || []).reduce((s, c) => s + n(c.amount), 0);
  const distributed = (p.distributions || []).reduce((s, d) => s + n(d.amount), 0);
  const mark = n(p.mark);
  const flows = [
    ...(p.checks || []).map((c) => ({ date: c.date, amount: -n(c.amount) })),
    ...(p.distributions || []).map((d) => ({ date: d.date, amount: n(d.amount) })),
    ...(mark > 0 ? [{ date: p.markDate || asOf, amount: mark }] : []),
  ];
  return {
    invested, distributed, mark,
    gain: distributed + mark - invested,
    moic: invested > 0 ? (distributed + mark) / invested : 0,
    dpi: invested > 0 ? distributed / invested : 0,
    rvpi: invested > 0 ? mark / invested : 0,
    irr: xirr(flows),
    flows,
  };
}

/** Portfolio roll-up: TVPI = (distributions + NAV) / paid-in, plus pooled XIRR. */
export function portfolioSummary(positions, asOf) {
  const rows = positions.map((p) => ({ ...p, m: positionMetrics(p, asOf) }));
  const invested = rows.reduce((s, r) => s + r.m.invested, 0);
  const distributed = rows.reduce((s, r) => s + r.m.distributed, 0);
  const nav = rows.reduce((s, r) => s + r.m.mark, 0);
  return {
    rows, invested, distributed, nav,
    tvpi: invested ? (distributed + nav) / invested : 0,
    dpi: invested ? distributed / invested : 0,
    rvpi: invested ? nav / invested : 0,
    irr: xirr(rows.flatMap((r) => r.m.flows)),
    winners: rows.filter((r) => r.m.moic >= 3).length,
    losers: rows.filter((r) => r.m.invested > 0 && r.m.moic < 1).length,
  };
}

/**
 * Pro-rata for a priced round. Your pro-rata check = current ownership x new money,
 * which holds your % flat. Returns ownership with and without taking it.
 */
export function proRata({ ownershipPct, preMoney, newMoney }) {
  const own = n(ownershipPct) / 100;
  const post = n(preMoney) + n(newMoney);
  const check = own * n(newMoney);
  const diluted = post > 0 ? own * (n(preMoney) / post) : 0;
  const withProRata = post > 0 ? diluted + check / post : 0;
  return { check, post, diluted, withProRata, valueAtPost: own * n(preMoney) };
}

/**
 * Reserves plan across positions: each position's next-round pro-rata, weighted
 * by the probability the company graduates to that round. Compares to budget.
 */
export function reservesPlan(positions, budget) {
  const rows = positions.map((p) => {
    const r = proRata({ ownershipPct: p.ownershipPct, preMoney: p.next?.preMoney, newMoney: p.next?.newMoney });
    const prob = Math.min(1, Math.max(0, n(p.next?.probability) / 100));
    const planned = p.next?.take === false ? 0 : r.check;
    return { id: p.id, name: p.name, ...r, prob, planned, weighted: planned * prob };
  });
  const totalPlanned = rows.reduce((s, r) => s + r.planned, 0);
  const totalWeighted = rows.reduce((s, r) => s + r.weighted, 0);
  return { rows, totalPlanned, totalWeighted, budget: n(budget), gap: n(budget) - totalWeighted };
}

/**
 * Term-sheet model: a company with `existingShares` (common plus prior classes as
 * common-equivalent), `seniorPref` of preferences ahead (non-participating),
 * and a new round where you invest `invest` of a round of `roundSize` at `preMoney`.
 * The pre-money option-pool shuffle (`poolPct` of post) dilutes only existing holders.
 * `existingShares` is all pre-round fully diluted shares, including `priorShares` of prior preferred.
 */
export function termSheetHolders(sheet, base) {
  const S = Math.max(1, n(base.existingShares));
  const post = n(sheet.preMoney) + n(sheet.roundSize);
  const poolFrac = Math.min(0.5, n(sheet.poolPct) / 100);
  // Post FD = S + pool + newShares; price = preMoney / (S + pool), newShares = roundSize / price.
  // Solving for pool such that pool = poolFrac * postFD gives the closed form below.
  const preFD = S / (1 - poolFrac * post / Math.max(1, n(sheet.preMoney)));
  const price = n(sheet.preMoney) / preFD;
  const pool = preFD - S;
  const roundShares = n(sheet.roundSize) / price;
  const yourShares = roundShares * (n(sheet.invest) / Math.max(1, n(sheet.roundSize)));
  const prior = n(base.seniorPref) > 0 ? Math.min(S, n(base.priorShares)) : 0; // prior preferred is part of S
  const holders = [
    { id: 'common', name: 'Common + pool', type: 'common', shares: S - prior + pool },
    { id: 'you', name: 'You', type: 'preferred', shares: yourShares, invested: n(sheet.invest), multiple: n(sheet.multiple), seniority: 2, participating: !!sheet.participating, cap: n(sheet.cap) },
    { id: 'coinv', name: 'Co-investors', type: 'preferred', shares: roundShares - yourShares, invested: n(sheet.roundSize) - n(sheet.invest), multiple: n(sheet.multiple), seniority: 2, participating: !!sheet.participating, cap: n(sheet.cap) },
  ];
  if (prior > 0) holders.push({ id: 'prior', name: 'Prior preferred', type: 'preferred', shares: prior, invested: n(base.seniorPref), multiple: 1, seniority: n(base.priorSenior) ? 3 : 2, participating: false, cap: 0 });
  return { holders, price, pool, roundShares, yourShares, ownership: yourShares / (S + pool + roundShares), post };
}

/** Your payout, MOIC and IRR at an exit for a given term sheet. */
export function termSheetPayout(sheet, base, exit, years) {
  const { holders } = termSheetHolders(sheet, base);
  const you = runWaterfall(holders, exit).find((r) => r.id === 'you');
  const inv = n(sheet.invest);
  const moic = inv ? you.total / inv : 0;
  return { payout: you.total, converted: you.converted, moic, irr: years > 0 && moic > 0 ? Math.pow(moic, 1 / years) - 1 : null };
}

/**
 * Single-position exit proceeds for a 1x-style non-participating holder:
 * the greater of your preference and your as-converted share, never more than the exit.
 */
export function exitProceeds({ ownershipPct, exit, prefAmount = 0 }) {
  const asConverted = (n(ownershipPct) / 100) * n(exit);
  return Math.min(n(exit), Math.max(n(prefAmount), asConverted));
}

/** Exit value at which one position alone returns `target` dollars (the "portfolio returner"). */
export function returnerExit(ownershipPct, target) {
  const own = n(ownershipPct) / 100;
  return own > 0 ? n(target) / own : Infinity;
}
