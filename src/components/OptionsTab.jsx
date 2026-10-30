import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, Field, Num, Stat } from './ui.jsx';
import { money, int } from '../utils/format.js';
import { optionValue, breakEvenExit, commonPricePerShare } from '../utils/options.js';

/** Tab 5: employee option grant value across exit scenarios, after preferences. */
export default function OptionsTab({ state, update }) {
  const g = state.grant;
  const setG = (patch) => update({ grant: { ...g, ...patch } });
  const scenarios = state.scenarios;
  const results = useMemo(() => scenarios.map((e) => optionValue(state.holders, g, e)), [state.holders, g, scenarios]);
  const breakEven = useMemo(() => breakEvenExit(state.holders, Number(g.strike) || 0), [state.holders, g.strike]);
  const fd = state.holders.reduce((s, h) => s + (Number(h.shares) || 0), 0);
  const naive = (e) => (fd ? e / fd : 0); // headline price/share ignoring preferences

  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="space-y-5">
        <Card title="Grant">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Options granted"><Num min="0" value={g.options} onChange={(v) => setG({ options: v })} /></Field>
            <Field label="Strike price ($)"><Num min="0" step="0.01" value={g.strike} onChange={(v) => setG({ strike: v })} /></Field>
            <Field label="Vested at exit (%)"><Num min="0" max="100" value={g.vestedPct} onChange={(v) => setG({ vestedPct: v })} /></Field>
            <Field label="Tax on gain (%)"><Num min="0" max="100" value={g.taxPct} onChange={(v) => setG({ taxPct: v })} /></Field>
          </div>
        </Card>
        <Card title="Exit scenarios" right={<button onClick={() => update({ scenarios: [...scenarios, (scenarios.at(-1) || 1e7) * 2] })} className="text-zinc-400 hover:text-accent" aria-label="Add scenario"><Plus size={15} /></button>}>
          <div className="space-y-2">
            {scenarios.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Num min="0" step="1000000" value={s} onChange={(v) => update({ scenarios: scenarios.map((x, j) => (j === i ? v : x)) })} aria-label={`Scenario ${i + 1}`} />
                <span className="w-20 text-right font-mono text-xs text-zinc-500">{money(s)}</span>
                <button disabled={scenarios.length <= 1} onClick={() => update({ scenarios: scenarios.filter((_, j) => j !== i) })} className="p-1 text-zinc-500 hover:text-rose-400 disabled:opacity-30" aria-label="Remove scenario"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">The PDF report uses these scenarios too.</p>
        </Card>
        <Stat label="Break-even exit (common ≥ strike)" value={breakEven == null ? 'never' : money(breakEven)} accent />
      </section>
      <Card title="Value per scenario">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-700 text-left text-[11px] uppercase tracking-wider text-zinc-500"><th className="py-2">Exit</th><th>Naive $/sh</th><th>Real $/sh</th><th>Vested</th><th>Exercise cost</th><th>Gross</th><th>Tax</th><th>Net</th></tr></thead>
            <tbody className="font-mono">
              {results.map((r, i) => (
                <tr key={i} className="border-b border-ink-800">
                  <td className="py-2">{money(r.exit)}</td>
                  <td className="text-zinc-500">${naive(r.exit).toFixed(2)}</td>
                  <td>${r.pps.toFixed(2)}</td>
                  <td>{int(r.vested)}</td>
                  <td>{money(r.exerciseCost)}</td>
                  <td>{money(r.gross)}</td>
                  <td>{money(r.tax)}</td>
                  <td className={r.underwater ? 'text-rose-400' : 'text-accent'}>{r.underwater ? 'underwater' : money(r.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          "Naive" is exit ÷ fully diluted shares, which is what most offer letters imply. "Real" is what each common share actually gets after the waterfall runs on the current cap table (today's common price is {`$${commonPricePerShare(state.holders, state.exit).toFixed(2)}`} at the {money(state.exit)} exit in the Waterfall tab). It assumes a cashless exercise at exit with tax on the spread. Not tax advice.
        </p>
      </Card>
    </div>
  );
}
