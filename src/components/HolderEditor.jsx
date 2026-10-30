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
    <div className="rounded-lg border border-ink-700 bg-ink-900/70 p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
        <input className="input flex-1 font-sans font-medium" value={holder.name} onChange={set('name')} aria-label="Class name" />
        <select className="input w-32" value={holder.type} onChange={set('type')} aria-label="Class type">
          <option value="common">Common</option>
          <option value="preferred">Preferred</option>
        </select>
        <button onClick={onRemove} className="rounded-md p-2 text-zinc-500 hover:bg-ink-700 hover:text-rose-400" aria-label="Remove class"><Trash2 size={15} /></button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Field label="Shares"><input type="number" min="0" className="input" value={holder.shares} onChange={set('shares')} /></Field>
        {!isPref && (
          <Field label="Unissued option pool">
            <label className="flex h-[34px] items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" className="accent-[#c6ff3d]" checked={!!holder.isPool} onChange={set('isPool')} /> {holder.isPool ? 'Yes' : 'No'}
            </label>
          </Field>
        )}
        {isPref && (<>
          <Field label="Invested ($)"><input type="number" min="0" className="input" value={holder.invested} onChange={set('invested')} /></Field>
          <Field label="Pref multiple (x)"><input type="number" min="0" step="0.25" className="input" value={holder.multiple} onChange={set('multiple')} /></Field>
          <Field label="Seniority (higher = first)"><input type="number" min="0" className="input" value={holder.seniority} onChange={set('seniority')} /></Field>
          <Field label="Participating">
            <label className="flex h-[34px] items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" className="accent-[#c6ff3d]" checked={holder.participating} onChange={set('participating')} /> {holder.participating ? 'Yes (double-dip)' : 'No'}
            </label>
          </Field>
          {holder.participating && <Field label="Cap (x invested, 0 = none)"><input type="number" min="0" step="0.5" className="input" value={holder.cap} onChange={set('cap')} /></Field>}
        </>)}
      </div>
    </div>
  );
}
