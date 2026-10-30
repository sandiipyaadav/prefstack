// localStorage persistence plus JSON import/export with schema migration.
import { DEFAULT_STATE, DEFAULT_INVESTOR } from './defaults.js';

const KEY = 'prefstack:v2';
const LEGACY = 'prefstack:v1';

/** Fill missing fields from defaults and coerce types; throws on unusable input. */
export function normalize(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.holders)) throw new Error('File has no "holders" array.');
  const holders = raw.holders.map((h, i) => ({
    id: String(h.id ?? `h${i}`), name: String(h.name ?? `Class ${i + 1}`),
    type: h.type === 'preferred' ? 'preferred' : 'common',
    isPool: h.isPool ?? /pool/i.test(h.name ?? ''),
    shares: Number(h.shares) || 0, invested: Number(h.invested) || 0, multiple: Number(h.multiple ?? 1),
    seniority: Number(h.seniority) || 0, participating: !!h.participating, cap: Number(h.cap) || 0,
  }));
  return {
    ...DEFAULT_STATE,
    ...raw,
    version: 2,
    holders,
    instruments: Array.isArray(raw.instruments) ? raw.instruments : DEFAULT_STATE.instruments,
    round: { ...DEFAULT_STATE.round, ...(raw.round || {}) },
    grant: { ...DEFAULT_STATE.grant, ...(raw.grant || {}) },
    scenarios: Array.isArray(raw.scenarios) && raw.scenarios.length ? raw.scenarios.map(Number) : DEFAULT_STATE.scenarios,
    exit: Number(raw.exit ?? DEFAULT_STATE.exit) || 0,
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY);
    return raw ? normalize(JSON.parse(raw)) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota or private mode */ }
}

export function clear() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(LEGACY); } catch { /* ignore */ }
}

// ---------- Investor mode: stored separately, plus the remembered view toggle ----------
const INV_KEY = 'prefstack:investor:v1';
const MODE_KEY = 'prefstack:mode';

/** Validate and fill investor state. */
export function normalizeInvestor(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.positions)) throw new Error('Investor data has no "positions" array.');
  return {
    ...DEFAULT_INVESTOR, ...raw,
    positions: raw.positions.map((p, i) => ({
      ...p, id: String(p.id ?? `p${i}`), name: String(p.name ?? `Company ${i + 1}`),
      checks: Array.isArray(p.checks) ? p.checks : [], distributions: Array.isArray(p.distributions) ? p.distributions : [],
      mark: Number(p.mark) || 0, ownershipPct: Number(p.ownershipPct) || 0,
      next: { preMoney: 0, newMoney: 0, probability: 0, take: false, ...(p.next || {}) },
    })),
    base: { ...DEFAULT_INVESTOR.base, ...(raw.base || {}) },
    sheets: Array.isArray(raw.sheets) ? raw.sheets : DEFAULT_INVESTOR.sheets,
    scenarios: Array.isArray(raw.scenarios) && raw.scenarios.length ? raw.scenarios.map(Number) : DEFAULT_INVESTOR.scenarios,
  };
}

export function loadInvestor() {
  try { const raw = localStorage.getItem(INV_KEY); return raw ? normalizeInvestor(JSON.parse(raw)) : DEFAULT_INVESTOR; } catch { return DEFAULT_INVESTOR; }
}
export function saveInvestor(s) { try { localStorage.setItem(INV_KEY, JSON.stringify(s)); } catch { /* ignore */ } }
export function clearInvestor() { try { localStorage.removeItem(INV_KEY); } catch { /* ignore */ } }
export function loadMode() { try { return localStorage.getItem(MODE_KEY) === 'investor' ? 'investor' : 'founder'; } catch { return 'founder'; } }
export function saveMode(m) { try { localStorage.setItem(MODE_KEY, m); } catch { /* ignore */ } }

/** Combined export bundle (founder + investor + mode). */
export const bundle = (mode, founder, investor) => ({ app: 'prefstack', version: 3, mode, founder, investor });

/** Parse any supported file: a v3 bundle, or a legacy founder-only or investor-only file. */
export function parseImport(raw) {
  if (raw && raw.app === 'prefstack') {
    return { mode: raw.mode === 'investor' ? 'investor' : 'founder', founder: raw.founder ? normalize(raw.founder) : null, investor: raw.investor ? normalizeInvestor(raw.investor) : null };
  }
  if (raw && Array.isArray(raw.positions)) return { mode: 'investor', founder: null, investor: normalizeInvestor(raw) };
  return { mode: 'founder', founder: normalize(raw), investor: null };
}

/** Trigger a browser download for text content. */
export function download(filename, text, type = 'application/json') {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type })), download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
