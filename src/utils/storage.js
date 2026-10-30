// localStorage persistence plus JSON import/export with schema migration.
import { DEFAULT_STATE } from './defaults.js';

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

/** Trigger a browser download for text content. */
export function download(filename, text, type = 'application/json') {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type })), download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
