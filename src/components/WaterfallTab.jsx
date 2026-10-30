import { AlertTriangle } from 'lucide-react';
import ResultsTable from './ResultsTable.jsx';
import PayoutChart from './PayoutChart.jsx';
import { Card, Stat } from './ui.jsx';
import { money, pct } from '../utils/format.js';

/** Tab 4: liquidation preference waterfall on the shared cap table (unissued pool excluded). */
export default function WaterfallTab({ state, update, colors, outstanding, rows, curve, maxExit, totalPref }) {
  const { exit } = state;
  const common = rows.filter((r) => r.type === 'common');
  const commonTake = common.reduce((s, r) => s + r.total, 0);
  const commonOwn = common.reduce((s, r) => s + r.ownership, 0);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <section className="space-y-5">
        <div className="card">
          <div className="flex items-end justify-between gap-3">
            <div><span className="label">Exit value</span><div className="font-mono text-3xl text-zinc-100">{money(exit)}</div></div>
            <input type="number" min="0" step="1000000" className="input w-40" value={exit} onChange={(e) => update({ exit: Math.max(0, Number(e.target.value) || 0) })} aria-label="Exit value" />
          </div>
          <input type="range" min="0" max={maxExit} step={maxExit / 400} value={Math.min(exit, maxExit)} onChange={(e) => update({ exit: Number(e.target.value) })} className="mt-4 w-full accent-[#c6ff3d]" aria-label="Exit slider" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Common takes" value={money(commonTake)} accent />
            <Stat label="Common owns" value={pct(commonOwn)} />
            <Stat label="Pref stack" value={money(totalPref)} />
          </div>
          {exit > 0 && exit <= totalPref && <p className="mt-3 flex items-center gap-2 text-xs text-amber-400"><AlertTriangle size={14} /> The exit is at or below the preference stack, so common may get little or nothing.</p>}
        </div>
        <Card title="Payout by exit value"><PayoutChart data={curve} holders={outstanding} colors={colors} exit={exit} maxExit={maxExit} /></Card>
      </section>
      <Card title={`Waterfall at ${money(exit)}`}>
        <ResultsTable rows={rows} colors={colors} exit={exit} />
        <p className="mt-1 text-xs text-zinc-500">The unissued option pool is left out because it holds no shares at exit.</p>
      </Card>
    </div>
  );
}
