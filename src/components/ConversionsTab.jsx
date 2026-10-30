import { Plus, Trash2 } from 'lucide-react';
import { Card, EmptyState, Field, Num, Stat } from './ui.jsx';
import { money, int, pct } from '../utils/format.js';
import { newInstrument } from '../utils/defaults.js';

/** Tab 2: SAFEs and convertible notes, and how each converts in the modelled round. */
export default function ConversionsTab({ state, update, model }) {
  const { instruments } = state;
  const set = (id, patch) => update({ instruments: instruments.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const byId = Object.fromEntries(model.conversions.map((c) => [c.id, c]));
  const totalAmt = model.conversions.reduce((s, c) => s + c.convertingAmount, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="space-y-3">
        {instruments.length === 0 && <EmptyState title="No convertibles yet" description="Add a SAFE or note to model its conversion into the next priced round." />}
        {instruments.map((x) => (
          <div key={x.id} className="rounded-xl border border-white/[0.07] bg-ink-800/50 p-3.5 shadow-panel">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input className="input min-w-[12rem] flex-1 font-sans font-medium" value={x.name} onChange={(e) => set(x.id, { name: e.target.value })} aria-label="Instrument name" />
              <select className="input w-28" value={x.kind} onChange={(e) => set(x.id, { kind: e.target.value, basis: e.target.value === 'note' ? 'pre' : x.basis })} aria-label="Instrument kind">
                <option value="safe">SAFE</option><option value="note">Note</option>
              </select>
              {x.kind === 'safe' && (
                <select className="input w-28" value={x.basis} onChange={(e) => set(x.id, { basis: e.target.value })} aria-label="SAFE basis">
                  <option value="post">Post-money</option><option value="pre">Pre-money</option>
                </select>
              )}
              <button type="button" onClick={() => update({ instruments: instruments.filter((i) => i.id !== x.id) })} className="rounded-lg p-2 text-zinc-600 transition hover:bg-rose-400/10 hover:text-rose-300" aria-label="Remove instrument"><Trash2 size={15} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Field label={x.kind === 'note' ? 'Principal ($)' : 'Investment ($)'}><Num min="0" value={x.amount} onChange={(v) => set(x.id, { amount: v })} /></Field>
              <Field label="Valuation cap ($, 0 = none)"><Num min="0" value={x.cap} onChange={(v) => set(x.id, { cap: v })} /></Field>
              <Field label="Discount (%)"><Num min="0" max="99" value={x.discount} onChange={(v) => set(x.id, { discount: v })} /></Field>
              {x.kind === 'note' && <>
                <Field label="Interest (% / yr, simple)"><Num min="0" step="0.5" value={x.rate} onChange={(v) => set(x.id, { rate: v })} /></Field>
                <Field label="Months outstanding"><Num min="0" value={x.months} onChange={(v) => set(x.id, { months: v })} /></Field>
              </>}
              <Field label="MFN" tip="Most Favored Nation: adopts more favorable economic terms from later securities.">
                <label className="flex h-[34px] items-center gap-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={!!x.mfn} onChange={(e) => set(x.id, { mfn: e.target.checked })} /> {x.mfn ? 'Best terms' : 'No'}
                </label>
              </Field>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <button type="button" onClick={() => update({ instruments: [...instruments, newInstrument('safe')] })} className="add-tile flex-1"><Plus size={15} /> SAFE</button>
          <button type="button" onClick={() => update({ instruments: [...instruments, newInstrument('note')] })} className="add-tile flex-1"><Plus size={15} /> Convertible note</button>
        </div>
      </section>
      <section className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Converting $" value={money(totalAmt)} />
          <Stat label="Round price" value={`$${model.price.toFixed(4)}`} sub={`at ${money(state.round.preMoney)} pre`} tip="Price per share paid by new-money investors in the modeled round." />
          <Stat label="Post-round FD %" value={pct(model.postFD ? model.convShares / model.postFD : 0)} accent tip="Combined fully diluted ownership of converting securities after the round." />
        </div>
        <Card title={`Conversion into ${state.round.name || 'the next round'}`} description="Each instrument receives the lower of its applicable cap or discount price.">
          <div className="table-shell">
            <table className="min-w-[760px] w-full text-sm">
              <thead><tr className="border-b border-ink-700 text-left text-[11px] uppercase tracking-wider text-zinc-500"><th className="py-2">Instrument</th><th>Converts</th><th>Cap price</th><th>Disc. price</th><th>Price</th><th>Shares</th><th>Post %</th></tr></thead>
              <tbody className="font-mono">
                {instruments.map((x) => {
                  const c = byId[x.id];
                  if (!c) return null;
                  return (
                    <tr key={x.id} className="border-b border-ink-800">
                      <td className="py-2 font-sans">{x.name}<div className="text-[10px] text-zinc-500">{x.kind === 'note' ? 'note' : `${x.basis}-money SAFE`}{x.mfn ? ` · MFN → ${money(c.effCap)} / ${c.effDiscount}%` : ''}</div></td>
                      <td>{money(c.convertingAmount)}</td>
                      <td>{Number.isFinite(c.capPrice) ? `$${c.capPrice.toFixed(4)}` : '—'}</td>
                      <td>${c.discPrice.toFixed(4)}</td>
                      <td className="text-accent">${c.price.toFixed(4)}<span className="ml-1 text-[10px] text-zinc-500">{c.by}</span></td>
                      <td>{int(c.shares)}</td>
                      <td>{pct(model.postFD ? c.shares / model.postFD : 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Post-money SAFEs price their cap over company capitalization ({int(model.companyCap)} shares, which includes every converting security but not the new money or pool top-up). Pre-money SAFEs and notes price their cap over existing fully diluted shares ({int(model.S0)}). Each instrument gets the lower of its cap price and discount price. Set the round terms in the Round tab.
          </p>
        </Card>
      </section>
    </div>
  );
}
