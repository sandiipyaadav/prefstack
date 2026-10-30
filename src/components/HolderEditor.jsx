import { Trash2 } from 'lucide-react';
import { Field } from './ui.jsx';

/** One editable share class in the shared cap table. */
export default function HolderEditor({ holder, color, onChange, onRemove }) {
  const set = (k) => (e) => {
    const t = e.target.type;
    const v = t === 'checkbox' ? e.target.checked : t === 'number' ? Number(e.target.value) : e.target.value;
    const next = { ...holder, [k]: v };
    if (k === 'type' && v === 'preferred') next.isPool = false;
    onChange(next);
  };
  const isPref = holder.type === 'preferred';
  return (
    <div className="rounded-xl border border-white/[0.07] bg-ink-800/50 p-3.5 shadow-panel transition hover:border-white/[0.11]">
      <div className="mb-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_8rem_auto]">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/10" style={{ background: color }} />
        <input className="input min-w-0 font-sans font-medium" value={holder.name} onChange={set('name')} aria-label="Class name" />
        <select className="input col-start-2 w-full font-sans sm:col-start-auto" value={holder.type} onChange={set('type')} aria-label="Class type">
          <option value="common">Common</option>
          <option value="preferred">Preferred</option>
        </select>
        <button type="button" onClick={onRemove} className="col-start-3 row-start-1 rounded-lg p-2 text-zinc-600 transition hover:bg-rose-400/10 hover:text-rose-300 sm:col-start-auto sm:row-start-auto" aria-label="Remove class"><Trash2 size={15} /></button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Field label="Shares"><input type="number" min="0" className="input" value={holder.shares} onChange={set('shares')} /></Field>
        {!isPref && (
          <Field label="Unissued option pool" tip="Reserved shares that have not yet been granted. They count in fully diluted ownership.">
            <label className="flex h-[34px] items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={!!holder.isPool} onChange={set('isPool')} /> {holder.isPool ? 'Yes' : 'No'}
            </label>
          </Field>
        )}
        {isPref && (<>
          <Field label="Invested ($)"><input type="number" min="0" className="input" value={holder.invested} onChange={set('invested')} /></Field>
          <Field label="Pref multiple (x)" tip="The invested capital multiple returned before common participates."><input type="number" min="0" step="0.25" className="input" value={holder.multiple} onChange={set('multiple')} /></Field>
          <Field label="Seniority" tip="Higher seniority classes are paid first in the exit waterfall."><input type="number" min="0" className="input" value={holder.seniority} onChange={set('seniority')} /></Field>
          <Field label="Participating" tip="Participating preferred takes its preference and then also shares in remaining proceeds.">
            <label className="flex h-[34px] items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={holder.participating} onChange={set('participating')} /> {holder.participating ? 'Yes (double-dip)' : 'No'}
            </label>
          </Field>
          {holder.participating && <Field label="Cap (x invested, 0 = none)"><input type="number" min="0" step="0.5" className="input" value={holder.cap} onChange={set('cap')} /></Field>}
        </>)}
      </div>
    </div>
  );
}
