// localStorage persistence with versioned key and safe fallback.
const KEY = 'prefstack:v1';

export function load(fallback) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.holders) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota or private mode: ignore */ }
}

export function clear() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
