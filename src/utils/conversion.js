/**
 * SAFE / convertible-note conversion and priced-round engine (pure functions).
 *
 * Instrument shape:
 *  { id, name, kind: 'safe' | 'note', basis: 'post' | 'pre', amount, cap, discount,
 *    mfn, rate, months }
 *  - cap: valuation cap in $ (0 = uncapped)
 *  - discount: % off the round price (0-100)
 *  - mfn: inherits the best cap and discount of the non-MFN instruments
 *  - rate / months: simple interest for notes, which convert principal + interest
 *
 * Round shape: { name, preMoney, newMoney, poolTarget (% of post-money FD),
 *                multiple, participating }
 *
 * Conventions (standard YC / NVCA practice):
 *  - Post-money SAFE cap price = cap / Company Capitalization, where Company
 *    Capitalization = existing FD shares + all converting securities, excluding
 *    the new money and the new pool top-up. Post-money SAFEs don't dilute each other.
 *  - Pre-money SAFE and note cap price = cap / existing FD shares.
 *  - Each instrument converts at min(cap price, round price x (1 - discount)).
 *  - Round price = pre-money / (existing FD + conversion shares + pool top-up),
 *    which is the "pool shuffle": the top-up dilutes existing holders, not new money.
 *  - Pool top-up makes the unissued pool equal poolTarget% of post-money FD.
 * These are coupled, so we solve the system by fixed-point iteration.
 */

const num = (v) => Math.max(0, Number(v) || 0);

/** Principal plus simple accrued interest for notes. */
export const convertingAmount = (x) =>
  x.kind === 'note' ? num(x.amount) * (1 + (num(x.rate) / 100) * (num(x.months) / 12)) : num(x.amount);

/** Apply MFN: an MFN instrument takes the best cap (lowest > 0) and the best discount of the others. */
export function resolveMfn(instruments) {
  const base = instruments.filter((x) => !x.mfn);
  const caps = base.map((x) => num(x.cap)).filter((c) => c > 0);
  const bestCap = caps.length ? Math.min(...caps) : 0;
  const bestDisc = Math.max(0, ...base.map((x) => num(x.discount)));
  return instruments.map((x) => {
    if (!x.mfn) return { ...x, effCap: num(x.cap), effDiscount: num(x.discount) };
    const own = num(x.cap);
    const effCap = own > 0 && bestCap > 0 ? Math.min(own, bestCap) : own || bestCap;
    return { ...x, effCap, effDiscount: Math.max(num(x.discount), bestDisc) };
  });
}

/** Model a priced round with conversions. Returns prices, shares, and before/after rows. */
export function modelRound({ holders, instruments = [], round }) {
  const S0 = holders.reduce((s, h) => s + num(h.shares), 0);
  const existingPool = holders.filter((h) => h.isPool).reduce((s, h) => s + num(h.shares), 0);
  const preMoney = num(round.preMoney);
  const newMoney = num(round.newMoney);
  const target = Math.min(0.95, num(round.poolTarget) / 100);
  const inst = resolveMfn(instruments);

  let companyCap = S0, topUp = 0, P = S0 > 0 ? preMoney / S0 : 0, conv = [];
  for (let i = 0; i < 1000 && S0 > 0 && preMoney > 0; i++) {
    conv = inst.map((x) => {
      const amt = convertingAmount(x);
      const capBase = x.kind === 'safe' && x.basis === 'post' ? companyCap : S0;
      const capPrice = x.effCap > 0 ? x.effCap / capBase : Infinity;
      const discPrice = P * (1 - Math.min(99, x.effDiscount) / 100);
      const price = Math.min(capPrice, discPrice);
      return { ...x, convertingAmount: amt, capPrice, discPrice, price, by: capPrice < discPrice ? 'cap' : 'discount', shares: price > 0 ? amt / price : 0 };
    });
    const convShares = conv.reduce((s, c) => s + c.shares, 0);
    const nextCap = S0 + convShares;
    const Spre = S0 + convShares + topUp;
    const nextP = preMoney / Spre;
    const newShares = newMoney / nextP;
    const nextTop = Math.max(0, target * (Spre + newShares) - existingPool);
    const done = Math.abs(nextP - P) < 1e-12 * Math.max(1, P) && Math.abs(nextTop - topUp) < 1e-6 && Math.abs(nextCap - companyCap) < 1e-6;
    P = nextP; topUp = nextTop; companyCap = nextCap;
    if (done) break;
  }

  const convShares = conv.reduce((s, c) => s + c.shares, 0);
  const newShares = P > 0 ? newMoney / P : 0;
  const postFD = S0 + convShares + topUp + newShares;

  // Before/after table rows.
  const rows = [
    ...holders.map((h) => ({ id: h.id, name: h.name, group: h.isPool ? 'pool' : h.type, before: num(h.shares), after: num(h.shares) + (h.isPool && existingPool > 0 ? topUp * (num(h.shares) / existingPool) : 0) })),
    ...(existingPool === 0 && topUp > 0 ? [{ id: 'pool-new', name: 'New option pool', group: 'pool', before: 0, after: topUp }] : []),
    ...conv.map((c) => ({ id: c.id, name: c.name, group: 'converted', before: 0, after: c.shares })),
    ...(newShares > 0 ? [{ id: 'new-money', name: round.name || 'New investors', group: 'new', before: 0, after: newShares }] : []),
  ].map((r) => ({ ...r, beforePct: S0 ? r.before / S0 : 0, afterPct: postFD ? r.after / postFD : 0 }));

  return { S0, existingPool, price: P, conversions: conv, convShares, topUp, newShares, postFD, postMoney: P * postFD, rows, companyCap };
}

/** Turn a modelled round into a new cap table: conversions and new money become preferred classes. */
export function applyRound(holders, result, round, uid) {
  const senior = Math.max(0, ...holders.map((h) => Number(h.seniority) || 0)) + 1;
  let next = holders.map((h) => ({ ...h }));
  const pools = next.filter((h) => h.isPool);
  if (result.topUp > 0) {
    if (pools.length) {
      const tot = pools.reduce((s, h) => s + h.shares, 0);
      next = next.map((h) => (h.isPool ? { ...h, shares: Math.round(h.shares + (tot ? result.topUp * (h.shares / tot) : result.topUp / pools.length)) } : h));
    } else {
      next.push({ id: uid(), name: 'Option pool', type: 'common', isPool: true, shares: Math.round(result.topUp), invested: 0, multiple: 1, seniority: 0, participating: false, cap: 0 });
    }
  }
  for (const c of result.conversions) {
    next.push({ id: uid(), name: `${c.name} (converted)`, type: 'preferred', isPool: false, shares: Math.round(c.shares), invested: Math.round(c.convertingAmount), multiple: 1, seniority: senior - 1, participating: false, cap: 0 });
  }
  if (result.newShares > 0) {
    next.push({ id: uid(), name: round.name || 'New round', type: 'preferred', isPool: false, shares: Math.round(result.newShares), invested: Math.round(Number(round.newMoney) || 0), multiple: Number(round.multiple) || 1, seniority: senior, participating: !!round.participating, cap: Number(round.participationCap) || 0 });
  }
  return next;
}
