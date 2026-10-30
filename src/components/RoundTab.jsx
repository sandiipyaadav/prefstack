import { CheckCircle2 } from 'lucide-react';
import { Card, Field, Num, Stat, Button, Dot } from './ui.jsx';
import { money, int, pct } from '../utils/format.js';

const GROUP_COLOR = { common: '#c6ff3d', preferred: '#38bdf8', pool: '#94a3b8', converted: '#fbbf24', new: '#f472b6' };

/** Tab 3: priced-round modelling, pool shuffle, before/after dilution. */
export default function RoundTab({ state, update, model, onApply }) {
  const r = state.round;
  const setR = (patch) => update({ round: { ...r, ...patch } });
  const founders = model.rows.filter((x) => x.group === 'common');
  const fBefore = founders.reduce((s, x) => s + x.beforePct, 0);
  const fAfter = founders.reduce((s, x) => s + x.afterPct, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="space-y-5">
        <Card title="Round terms">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Round name" className="col-span-2"><input className="input font-sans" value={r.name} onChange={(e) => setR({ name: e.target.value })} /></Field>
            <Field label="Pre-money valuation ($)"><Num min="0" step="1000000" value={r.preMoney} onChange={(v) => setR({ preMoney: v })} /></Field>
            <Field label="New money ($)"><Num min="0" step="500000" value={r.newMoney} onChange={(v) => setR({ newMoney: v })} /></Field>
            <Field label="Target unissued pool (% post)"><Num min="0" max="50" step="0.5" value={r.poolTarget} onChange={(v) => setR({ poolTarget: v })} /></Field>
            <Field label="Liq. pref multiple (x)"><Num min="0" step="0.25" value={r.multiple} onChange={(v) => setR({ multiple: v })} /></Field>
            <Field label="Participating">
              <label className="flex h-[34px] items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" className="accent-[#c6ff3d]" checked={!!r.participating} onChange={(e) => setR({ participating: e.target.checked })} /> {r.participating ? 'Yes' : 'No'}
              </label>
            </Field>
            {r.participating && <Field label="Participation cap (x)"><Num min="0" step="0.5" value={r.participationCap} onChange={(v) => setR({ participationCap: v })} /></Field>}
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Price / share" value={`$${model.price.toFixed(4)}`} accent />
          <Stat label="Post-money" value={money(model.postMoney)} />
          <Stat label="Pool top-up" value={int(model.topUp)} sub="dilutes existing holders" />
          <Stat label="Common" value={`${pct(fBefore)} → ${pct(fAfter)}`} sub={`${pct(fBefore ? 1 - fAfter / fBefore : 0)} relative dilution`} />
        </div>
        <Button primary onClick={onApply} disabled={model.newShares <= 0 && model.convShares <= 0}>
          <CheckCircle2 size={14} /> Close round: write to cap table
        </Button>
        <p className="text-xs text-zinc-500">Closing the round turns conversions and new money into preferred classes, tops up the pool, and clears the SAFEs and notes. Export JSON first if you want to keep the pre-round version.</p>
      </section>
      <Card title="Before / after (fully diluted)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-700 text-left text-[11px] uppercase tracking-wider text-zinc-500"><th className="py-2">Holder</th><th>Before</th><th>%</th><th>After</th><th>%</th><th>Δ pts</th></tr></thead>
            <tbody className="font-mono">
              {model.rows.map((x) => {
                const d = (x.afterPct - x.beforePct) * 100;
                return (
                  <tr key={x.id} className="border-b border-ink-800">
                    <td className="py-2 font-sans"><Dot color={GROUP_COLOR[x.group]} />{x.name}</td>
                    <td>{int(x.before)}</td><td>{pct(x.beforePct)}</td>
                    <td>{int(x.after)}</td><td className="text-zinc-100">{pct(x.afterPct)}</td>
                    <td className={d < -0.005 ? 'text-rose-400' : d > 0.005 ? 'text-accent' : ''}>{d > 0 ? '+' : ''}{d.toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr className="font-sans text-zinc-100"><td className="py-2">Total</td><td className="font-mono">{int(model.S0)}</td><td>100%</td><td className="font-mono">{int(model.postFD)}</td><td>100%</td><td /></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
