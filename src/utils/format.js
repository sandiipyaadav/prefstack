/** Compact USD formatter: 1234567 -> $1.23M */
export function money(v) {
  const n = Number(v) || 0;
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
/** Percentage formatter for a 0..1 fraction. */
export const pct = (f) => `${((Number(f) || 0) * 100).toFixed(1)}%`;
/** Thousands-separated integer. */
export const int = (v) => Math.round(Number(v) || 0).toLocaleString('en-US');
