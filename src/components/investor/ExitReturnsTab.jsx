import { useState } from 'react';
import { Card, Num, Stat } from '../ui.jsx';
import { money } from '../../utils/format.js';
import { exitProceeds, returnerExit } from '../../utils/investor.js';

/** Investor tab 4: portfolio-wide exit what-ifs and the exit each company needs to return the whole book. */
export default function ExitReturnsTab({ inv, setInv, summary }) {
  const [prefFloor, setPrefFloor] = useState(true);
  const setPos = (id, patch) => setInv({ positions: inv.positions.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const rows = summary.rows.map((r) => {
    const exit = Number(r.exitValue) || 0;
    const proceeds = exit > 0 ? exitProceeds({ ownershipPct: r.ownershipPct, exit, prefAmount: prefFloor ? r.m.invested : 0 }) : r.m.mark;
    return { ...r, exit, proceeds, total: proceeds + r.m.distributed, returner: returnerExit(r.ownershipPct, summary.invested) };
  });
  const total = rows.reduce((s, r) => s + r.total, 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Paid-in" value={money(summary.invested)} />
        <Stat label="Scenario proceeds" value={money(total)} accent />
        <Stat label="Scenario multiple" value={`${(summary.invested ? total / summary.invested : 0).toFixed(2)}x`} accent />
        <label className="flex items-center justify-center gap-2 rounded-lg bg-ink-900 text-xs">
          <input type="checkbox" className="accent-[#c6ff3d]" checked={prefFloor} onChange={(e) => setPrefFloor(e.target.checked)} /> 1x pref floor on cost
        </label>
      </div>
      <Card title="Exit what-if per company (blank = hold at current mark)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-700 text-left text-[11px] uppercase tracking-wider text-zinc-500"><th className="py-2">Company</th><th>Own %</th><th>Exit value</th><th>Your proceeds</th><th>+ Past distrib.</th><th>MOIC</th><th>Exit to return portfolio</th></tr></thead>
            <tbody className="font-mono">
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-ink-800">
                  <td className="py-2 font-sans">{r.name}</td>
                  <td>{r.ownershipPct}%</td>
                  <td className="w-40 pr-2"><Num min="0" step="1000000" value={r.exitValue ?? 0} onChange={(v) => setPos(r.id, { exitValue: v })} aria-label="Exit value" /></td>
                  <td className="text-zinc-100">{money(r.proceeds)}</td>
                  <td>{money(r.m.distributed)}</td>
                  <td className={r.total >= r.m.invested ? 'text-accent' : 'text-rose-400'}>{(r.m.invested ? r.total / r.m.invested : 0).toFixed(2)}x</td>
                  <td>{Number.isFinite(r.returner) ? money(r.returner) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-500">Proceeds = the greater of your as-converted share (ownership × exit) and, when the floor is on, your cost as a 1x non-participating preference, capped at the exit. "Exit to return portfolio" is the sale price at which this company alone pays back everything you've invested, the power-law test VCs run on every deal. For exact preference stacks, use Term sheets.</p>
      </Card>
    </div>
  );
}
