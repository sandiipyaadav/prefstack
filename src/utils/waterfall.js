/**
 * Liquidation-preference waterfall engine (pure functions, no side effects).
 *
 * Holder shape:
 *  { id, name, type: 'common' | 'preferred', shares,
 *    invested, multiple, seniority, participating, cap }
 *  - multiple: liquidation preference multiple (1 = 1x)
 *  - seniority: higher number is paid first; equal numbers share pari passu
 *  - participating: after its preference, also shares pro-rata with common
 *  - cap: total-return cap as a multiple of invested for participating (0 = uncapped)
 *
 * Non-participating and capped-participating preferred will convert to common
 * whenever converting pays more. We find a stable set of conversion decisions by
 * iterated best response, which converges for standard VC structures.
 */

const pref = (h) => Math.max(0, h.invested) * Math.max(0, h.multiple);

/** Distribute `exit` given a fixed set of converted preferred ids. */
function distribute(holders, exit, converted) {
  const pay = Object.fromEntries(holders.map((h) => [h.id, { pref: 0, part: 0 }]));
  let remaining = Math.max(0, exit);

  // 1) Preferences, by seniority (desc); same tier shares pro-rata to pref amount.
  const prefHolders = holders.filter((h) => h.type === 'preferred' && !converted.has(h.id));
  const tiers = [...new Set(prefHolders.map((h) => h.seniority))].sort((a, b) => b - a);
  for (const tier of tiers) {
    const group = prefHolders.filter((h) => h.seniority === tier);
    const owed = group.reduce((s, h) => s + pref(h), 0);
    if (owed <= 0) continue;
    const paid = Math.min(owed, remaining);
    group.forEach((h) => { pay[h.id].pref = (paid * pref(h)) / owed; });
    remaining -= paid;
  }

  // 2) Residual, pro-rata by shares among common, converted, and participating
  //    preferred. Capped participants stop at their cap; excess re-flows.
  let pool = holders.filter((h) =>
    h.shares > 0 && (h.type === 'common' || converted.has(h.id) || h.participating));
  for (let guard = 0; guard < 50 && remaining > 1e-6 && pool.length; guard++) {
    const totalShares = pool.reduce((s, h) => s + h.shares, 0);
    let overflow = 0;
    const next = [];
    for (const h of pool) {
      const share = (remaining * h.shares) / totalShares;
      const capped = h.type === 'preferred' && !converted.has(h.id) && h.participating && h.cap > 0;
      if (capped) {
        const room = Math.max(0, h.cap * h.invested - pay[h.id].pref - pay[h.id].part);
        if (share >= room) { pay[h.id].part += room; overflow += share - room; continue; }
      }
      pay[h.id].part += share;
      next.push(h);
    }
    remaining = overflow;
    pool = next;
  }

  return holders.map((h) => {
    const p = pay[h.id];
    return { ...h, converted: converted.has(h.id), prefPaid: p.pref, partPaid: p.part, total: p.pref + p.part };
  });
}

/** Full waterfall with optimal conversion decisions. */
export function runWaterfall(holders, exit) {
  const clean = holders.map((h) => ({
    ...h,
    shares: Math.max(0, Number(h.shares) || 0),
    invested: Math.max(0, Number(h.invested) || 0),
    multiple: Math.max(0, Number(h.multiple) || 0),
    seniority: Number(h.seniority) || 0,
    cap: Math.max(0, Number(h.cap) || 0),
  }));
  // Only classes that could ever benefit from converting are candidates.
  const candidates = clean.filter((h) => h.type === 'preferred' && (!h.participating || h.cap > 0));
  let converted = new Set();

  for (let iter = 0; iter < 40; iter++) {
    let changed = false;
    for (const h of candidates) {
      const asIs = distribute(clean, exit, converted).find((r) => r.id === h.id).total;
      const flipped = new Set(converted);
      flipped.has(h.id) ? flipped.delete(h.id) : flipped.add(h.id);
      const alt = distribute(clean, exit, flipped).find((r) => r.id === h.id).total;
      if (alt > asIs + 0.01) { converted = flipped; changed = true; }
    }
    if (!changed) break;
  }

  const rows = distribute(clean, exit, converted);
  const totalShares = clean.reduce((s, h) => s + h.shares, 0);
  return rows.map((r) => ({
    ...r,
    ownership: totalShares ? r.shares / totalShares : 0,
    payoutShare: exit > 0 ? r.total / exit : 0,
  }));
}

/** Sample payouts across exit values for charting. */
export function sweep(holders, maxExit, steps = 60) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const exit = (maxExit * i) / steps;
    const rows = runWaterfall(holders, exit);
    out.push({ exit, byId: Object.fromEntries(rows.map((r) => [r.id, r.total])) });
  }
  return out;
}
