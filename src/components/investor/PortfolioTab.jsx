import { Plus, Trash2, X } from 'lucide-react';
import { Card, Field, Num, Stat } from '../ui.jsx';
import { money } from '../../utils/format.js';
import { newPosition, uid } from '../../utils/defaults.js';

const mult = (v) => `${(v || 0).toFixed(2)}x`;
const irrFmt = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);

/** Investor tab 1: positions with dated checks and distributions -> MOIC, IRR, TVPI/DPI/RVPI. */
export default function PortfolioTab({ inv, setInv, summary }) {
  const setPos = (id, patch) => setInv({ positions: inv.positions.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const editFlow = (p, key, fid, patch) => setPos(p.id, { [key]: p[key].map((f) => (f.id === fid ? { ...f, ...patch } : f)) });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Investor / entity" className="w-72"><input className="input font-sans" value={inv.investor} onChange={(e) => setInv({ investor: e.target.value })} /></Field>
        <Field label="As of" className="w-44"><input type="date" className="input" value={inv.asOf} onChange={(e) => setInv({ asOf: e.target.value })} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat label="Paid-in" value={money(summary.invested)} />
        <Stat label="Distributed" value={money(summary.distributed)} />
        <Stat label="NAV (marks)" value={money(summary.nav)} />
        <Stat label="TVPI" value={mult(summary.tvpi)} accent sub={`DPI ${mult(summary.dpi)} · RVPI ${mult(summary.rvpi)}`} />
        <Stat label="Net IRR" value={irrFmt(summary.irr)} accent sub="pooled XIRR" />
        <Stat label="≥3x / <1x" value={`${summary.winners} / ${summary.losers}`} sub={`${inv.positions.length} positions`} />
      </div>

      <Card title="Positions">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-700 text-left text-[11px] uppercase tracking-wider text-zinc-500"><th className="py-2">Company</th><th>Invested</th><th>Distributed</th><th>Mark</th><th>MOIC</th><th>IRR</th><th>Gain</th></tr></thead>
            <tbody className="font-mono">
              {summary.rows.map((r) => (
                <tr key={r.id} className="border-b border-ink-800">
                  <td className="py-2 font-sans">{r.name}<span className="ml-2 text-[10px] text-zinc-500">{r.stage} · {r.instrument}</span></td>
                  <td>{money(r.m.invested)}</td><td>{money(r.m.distributed)}</td><td>{money(r.m.mark)}</td>
                  <td className={r.m.moic >= 1 ? 'text-accent' : 'text-rose-400'}>{mult(r.m.moic)}</td>
                  <td>{irrFmt(r.m.irr)}</td>
                  <td className={r.m.gain >= 0 ? 'text-accent' : 'text-rose-400'}>{money(r.m.gain)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        {inv.positions.map((p) => (
          <div key={p.id} className="rounded-lg border border-ink-700 bg-ink-900/70 p-3">
            <div className="mb-3 flex items-center gap-2">
              <input className="input flex-1 font-sans font-medium" value={p.name} onChange={(e) => setPos(p.id, { name: e.target.value })} aria-label="Company" />
              <input className="input w-24 font-sans" value={p.stage} onChange={(e) => setPos(p.id, { stage: e.target.value })} aria-label="Stage" />
              <select className="input w-24" value={p.instrument} onChange={(e) => setPos(p.id, { instrument: e.target.value })} aria-label="Instrument">
                {['SAFE', 'Note', 'Priced', 'SPV', 'Fund'].map((o) => <option key={o}>{o}</option>)}
              </select>
              <button onClick={() => setInv({ positions: inv.positions.filter((x) => x.id !== p.id) })} className="rounded-md p-2 text-zinc-500 hover:bg-ink-700 hover:text-rose-400" aria-label="Remove position"><Trash2 size={15} /></button>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <Field label="Current mark ($)"><Num min="0" value={p.mark} onChange={(v) => setPos(p.id, { mark: v })} /></Field>
              <Field label="Mark date"><input type="date" className="input" value={p.markDate} onChange={(e) => setPos(p.id, { markDate: e.target.value })} /></Field>
              <Field label="Ownership (% FD)"><Num min="0" step="0.05" value={p.ownershipPct} onChange={(v) => setPos(p.id, { ownershipPct: v })} /></Field>
            </div>
            {[['checks', 'Checks written'], ['distributions', 'Distributions received']].map(([key, label]) => (
              <div key={key} className="mb-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="label !mb-0">{label}</span>
                  <button onClick={() => setPos(p.id, { [key]: [...p[key], { id: uid(), date: new Date().toISOString().slice(0, 10), amount: 0 }] })} className="text-zinc-500 hover:text-accent" aria-label={`Add ${key}`}><Plus size={14} /></button>
                </div>
                {p[key].length === 0 && <div className="text-xs text-zinc-600">None</div>}
                {p[key].map((f) => (
                  <div key={f.id} className="mb-1 flex gap-2">
                    <input type="date" className="input" value={f.date} onChange={(e) => editFlow(p, key, f.id, { date: e.target.value })} aria-label="Date" />
                    <Num min="0" value={f.amount} onChange={(v) => editFlow(p, key, f.id, { amount: v })} aria-label="Amount" />
                    <button onClick={() => setPos(p.id, { [key]: p[key].filter((x) => x.id !== f.id) })} className="p-1 text-zinc-500 hover:text-rose-400" aria-label="Remove row"><X size={14} /></button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
        <button onClick={() => setInv({ positions: [...inv.positions, newPosition()] })} className="flex min-h-24 items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-600 text-sm hover:border-accent hover:text-accent"><Plus size={15} /> Add position</button>
      </div>
      <p className="text-xs text-zinc-500">The IRR treats each mark as a sale on its mark date. TVPI = (distributions + NAV) ÷ paid-in, the way funds report it, not an average of per-company MOICs.</p>
    </div>
  );
}
