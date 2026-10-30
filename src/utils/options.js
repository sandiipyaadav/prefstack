/**
 * Employee option value: what a grant is worth at a given exit, driven by the
 * exit waterfall (so preferences ahead of common are respected).
 */
import { runWaterfall } from './waterfall.js';

/** Value of $1 of common per share at an exit: common payout / outstanding common shares. */
export function commonPricePerShare(holders, exit) {
  const rows = runWaterfall(holders.filter((h) => !h.isPool), exit);
  const common = rows.filter((r) => r.type === 'common' && r.shares > 0);
  const shares = common.reduce((s, r) => s + r.shares, 0);
  return shares ? common.reduce((s, r) => s + r.total, 0) / shares : 0;
}

/**
 * Grant: { options, strike, vestedPct, taxPct }
 * Returns gross spread, exercise cost, tax and net take-home at one exit.
 */
export function optionValue(holders, grant, exit) {
  const pps = commonPricePerShare(holders, exit);
  const vested = Math.max(0, Number(grant.options) || 0) * Math.min(1, Math.max(0, (Number(grant.vestedPct) || 0) / 100));
  const strike = Math.max(0, Number(grant.strike) || 0);
  const spreadPerShare = Math.max(0, pps - strike);
  const gross = vested * spreadPerShare;
  const tax = gross * Math.min(1, Math.max(0, (Number(grant.taxPct) || 0) / 100));
  return { exit, pps, vested, exerciseCost: spreadPerShare > 0 ? vested * strike : 0, gross, tax, net: gross - tax, underwater: pps <= strike };
}

/** Smallest exit at which common per-share value reaches the strike (binary search). */
export function breakEvenExit(holders, strike, hi = 1e11) {
  if (commonPricePerShare(holders, hi) < strike) return null;
  let lo = 0;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (commonPricePerShare(holders, mid) >= strike) hi = mid; else lo = mid;
  }
  return hi;
}
