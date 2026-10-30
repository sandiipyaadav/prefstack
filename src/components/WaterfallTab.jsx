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
    <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <section className="space-y-5">
        <div className="card">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><span className="label">Exit value</span><div className="font-mono text-3xl font-medium tracking-[-0.05em] text-white sm:text-4xl">{money(exit)}</div></div>
            <input type="number" min="0" step="1000000" className="input w-full sm:w-44" value={exit} onChange={(e) => update({ exit: Math.max(0, Number(e.target.value) || 0) })} aria-label="Exit value" />
          </div>
          <input type="range" min="0" max={maxExit} step={maxExit / 400} value={Math.min(exit, maxExit)} onChange={(e) => update({ exit: Number(e.target.value) })} className="mt-6 w-full" aria-label="Exit slider" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Common takes" value={money(commonTake)} accent />
            <Stat label="Common owns" value={pct(commonOwn)} />
            <Stat label="Pref stack" value={money(totalPref)} tip="The aggregate contractual preference due before conversion decisions." />
          </div>
          {exit > 0 && exit <= totalPref && <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-400/15 bg-amber-400/[0.05] px-3 py-2.5 text-xs leading-relaxed text-amber-300"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> The exit is at or below the preference stack, so common may get little or nothing.</p>}
        </div>
        <Card title="Payout curves" description="Proceeds by share class across the modeled exit range."><PayoutChart data={curve} holders={outstanding} colors={colors} exit={exit} maxExit={maxExit} /></Card>
      </section>
      <Card title={`Waterfall at ${money(exit)}`} description="Preference and participation proceeds at the selected exit value.">
        <ResultsTable rows={rows} colors={colors} exit={exit} />
        <p className="mt-1 text-xs text-zinc-500">The unissued option pool is left out because it holds no shares at exit.</p>
      </Card>
    </div>
  );
}
