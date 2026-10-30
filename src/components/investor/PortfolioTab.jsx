import { Plus, Trash2, X } from 'lucide-react';
import { Card, EmptyState, Field, Num, Stat } from '../ui.jsx';
import { money } from '../../utils/format.js';
import { newPosition, uid } from '../../utils/defaults.js';

const mult = (v) => `${(v || 0).toFixed(2)}x`;
const irrFmt = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);

/** Investor tab 1: positions with dated checks and distributions -> MOIC, IRR, TVPI/DPI/RVPI. */
export default function PortfolioTab({ inv, setInv, summary }) {
  const setPos = (id, patch) => setInv({ positions: inv.positions.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const editFlow = (p, key, fid, patch) => setPos(p.id, { [key]: p[key].map((f) => (f.id === fid ? { ...f, ...patch } : f)) });

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,18rem)_11rem]">
        <Field label="Investor / entity"><input className="input font-sans" value={inv.investor} onChange={(e) => setInv({ investor: e.target.value })} aria-label="Investor or entity name" /></Field>
        <Field label="As of date" tip="Portfolio metrics and marks are presented as of this date."><input type="date" className="input" value={inv.asOf} onChange={(e) => setInv({ asOf: e.target.value })} aria-label="Portfolio as of date" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Paid-in" value={money(summary.invested)} />
        <Stat label="Distributed" value={money(summary.distributed)} />
        <Stat label="NAV (marks)" value={money(summary.nav)} />
        <Stat label="TVPI" value={mult(summary.tvpi)} accent sub={`DPI ${mult(summary.dpi)} · RVPI ${mult(summary.rvpi)}`} tip="Total value to paid-in: distributions plus remaining value, divided by invested capital." />
        <Stat label="Net IRR" value={irrFmt(summary.irr)} accent sub="pooled XIRR" tip="Annualized return using the actual dates of every cash flow and current mark." />
        <Stat label="≥3x / <1x" value={`${summary.winners} / ${summary.losers}`} sub={`${inv.positions.length} positions`} tip="Positions marked at or above 3x versus those below invested cost." />
      </div>

      <Card title="Portfolio performance" description="Current value and realized performance by position.">
        {summary.rows.length === 0 ? (
          <EmptyState title="No positions yet" description="Add your first portfolio company below to begin tracking returns." />
        ) : <div className="table-shell">
          <table className="min-w-[780px] w-full text-sm">
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
        </div>}
      </Card>

      <div className="grid gap-3 xl:grid-cols-2">
        {inv.positions.map((p) => (
          <div key={p.id} className="rounded-xl border border-white/[0.07] bg-ink-800/50 p-3.5 shadow-panel transition hover:border-white/[0.11]">
            <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_auto]">
              <input className="input min-w-0 font-sans font-medium" value={p.name} onChange={(e) => setPos(p.id, { name: e.target.value })} aria-label="Company" />
              <input className="input min-w-0 font-sans" value={p.stage} onChange={(e) => setPos(p.id, { stage: e.target.value })} aria-label="Stage" />
              <select className="input min-w-0" value={p.instrument} onChange={(e) => setPos(p.id, { instrument: e.target.value })} aria-label="Instrument">
                {['SAFE', 'Note', 'Priced', 'SPV', 'Fund'].map((o) => <option key={o}>{o}</option>)}
              </select>
              <button type="button" onClick={() => setInv({ positions: inv.positions.filter((x) => x.id !== p.id) })} className="col-start-2 row-start-1 rounded-lg p-2 text-zinc-600 transition hover:bg-rose-400/10 hover:text-rose-300 sm:col-start-auto sm:row-start-auto" aria-label="Remove position"><Trash2 size={15} /></button>
            </div>
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              <Field label="Current mark ($)"><Num min="0" value={p.mark} onChange={(v) => setPos(p.id, { mark: v })} /></Field>
              <Field label="Mark date"><input type="date" className="input" value={p.markDate} onChange={(e) => setPos(p.id, { markDate: e.target.value })} /></Field>
              <Field label="Ownership (% FD)" tip="Your ownership on a fully diluted basis."><Num min="0" step="0.05" value={p.ownershipPct} onChange={(v) => setPos(p.id, { ownershipPct: v })} /></Field>
            </div>
            {[['checks', 'Checks written'], ['distributions', 'Distributions received']].map(([key, label]) => (
              <div key={key} className="mb-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="label !mb-0">{label}</span>
                  <button type="button" onClick={() => setPos(p.id, { [key]: [...p[key], { id: uid(), date: new Date().toISOString().slice(0, 10), amount: 0 }] })} className="rounded-md p-1 text-zinc-500 transition hover:bg-accent/10 hover:text-accent" aria-label={`Add ${key}`}><Plus size={14} /></button>
                </div>
                {p[key].length === 0 && <div className="rounded-lg border border-dashed border-white/[0.06] px-2.5 py-2 text-[11px] text-zinc-600">No cash flows recorded</div>}
                {p[key].map((f) => (
                  <div key={f.id} className="mb-1 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
                    <input type="date" className="input" value={f.date} onChange={(e) => editFlow(p, key, f.id, { date: e.target.value })} aria-label="Date" />
                    <Num min="0" value={f.amount} onChange={(v) => editFlow(p, key, f.id, { amount: v })} aria-label="Amount" />
                    <button type="button" onClick={() => setPos(p.id, { [key]: p[key].filter((x) => x.id !== f.id) })} className="rounded-md p-1 text-zinc-600 hover:bg-rose-400/10 hover:text-rose-300" aria-label="Remove row"><X size={14} /></button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
        <button type="button" onClick={() => setInv({ positions: [...inv.positions, newPosition()] })} className="add-tile min-h-28"><Plus size={15} /> Add position</button>
      </div>
      <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-zinc-500">The IRR treats each mark as a sale on its mark date. TVPI = (distributions + NAV) ÷ paid-in, the way funds report it, not an average of per-company MOICs.</p>
    </div>
  );
}
