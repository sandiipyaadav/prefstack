import { Plus, Trash2 } from 'lucide-react';
import { Card, Field, Num } from '../ui.jsx';
import { money, pct } from '../../utils/format.js';
import { termSheetHolders, termSheetPayout } from '../../utils/investor.js';
import { newSheet } from '../../utils/defaults.js';

/** Investor tab 3: compare term sheets side by side, with your payout through the waterfall. */
export default function TermSheetsTab({ inv, setInv }) {
  const { base, sheets, scenarios } = inv;
  const setSheet = (id, patch) => setInv({ sheets: sheets.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const setBase = (patch) => setInv({ base: { ...base, ...patch } });
  const best = scenarios.map((e) => Math.max(...sheets.map((s) => termSheetPayout(s, base, e, base.years).payout)));

  return (
    <div className="space-y-5">
      <Card title="Company before the round">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <Field label="Pre-round FD shares"><Num min="1" value={base.existingShares} onChange={(v) => setBase({ existingShares: v })} /></Field>
          <Field label="Prior preferred: shares"><Num min="0" value={base.priorShares} onChange={(v) => setBase({ priorShares: v })} /></Field>
          <Field label="Prior preferred: 1x pref ($)"><Num min="0" value={base.seniorPref} onChange={(v) => setBase({ seniorPref: v })} /></Field>
          <Field label="Prior senior to new?">
            <label className="flex h-[34px] items-center gap-2 text-sm"><input type="checkbox" className="accent-[#c6ff3d]" checked={!!base.priorSenior} onChange={(e) => setBase({ priorSenior: e.target.checked })} /> {base.priorSenior ? 'Senior' : 'Pari passu'}</label>
          </Field>
          <Field label="Years to exit"><Num min="0.5" step="0.5" value={base.years} onChange={(v) => setBase({ years: v })} /></Field>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        {sheets.map((s) => {
          const t = termSheetHolders(s, base);
          return (
            <div key={s.id} className="rounded-lg border border-ink-700 bg-ink-900/70 p-3">
              <div className="mb-3 flex gap-2">
                <input className="input flex-1 font-sans font-medium" value={s.name} onChange={(e) => setSheet(s.id, { name: e.target.value })} aria-label="Term sheet name" />
                <button onClick={() => setInv({ sheets: sheets.filter((x) => x.id !== s.id) })} className="rounded-md p-2 text-zinc-500 hover:text-rose-400" aria-label="Remove term sheet"><Trash2 size={15} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Your check ($)"><Num min="0" value={s.invest} onChange={(v) => setSheet(s.id, { invest: v })} /></Field>
                <Field label="Round size ($)"><Num min="0" value={s.roundSize} onChange={(v) => setSheet(s.id, { roundSize: v })} /></Field>
                <Field label="Pre-money ($)"><Num min="0" value={s.preMoney} onChange={(v) => setSheet(s.id, { preMoney: v })} /></Field>
                <Field label="Pool (% post, pre-money)"><Num min="0" max="40" value={s.poolPct} onChange={(v) => setSheet(s.id, { poolPct: v })} /></Field>
                <Field label="Liq. pref (x)"><Num min="0" step="0.25" value={s.multiple} onChange={(v) => setSheet(s.id, { multiple: v })} /></Field>
                <Field label="Participating">
                  <label className="flex h-[34px] items-center gap-2 text-sm"><input type="checkbox" className="accent-[#c6ff3d]" checked={!!s.participating} onChange={(e) => setSheet(s.id, { participating: e.target.checked })} /> {s.participating ? 'Yes' : 'No'}</label>
                </Field>
                {s.participating && <Field label="Participation cap (x)"><Num min="0" step="0.5" value={s.cap} onChange={(v) => setSheet(s.id, { cap: v })} /></Field>}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="rounded bg-ink-950 py-1.5"><div className="text-[10px] text-zinc-500">PRICE</div>${t.price.toFixed(3)}</div>
                <div className="rounded bg-ink-950 py-1.5"><div className="text-[10px] text-zinc-500">POST</div>{money(t.post)}</div>
                <div className="rounded bg-ink-950 py-1.5"><div className="text-[10px] text-zinc-500">YOU OWN</div>{pct(t.ownership)}</div>
              </div>
            </div>
          );
        })}
        <button onClick={() => setInv({ sheets: [...sheets, newSheet()] })} className="flex min-h-24 items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-600 text-sm hover:border-accent hover:text-accent"><Plus size={15} /> Add term sheet</button>
      </div>

      <Card title="Your payout by exit (after preferences)">
        <div className="mb-3 flex flex-wrap gap-2">
          {scenarios.map((e, i) => (
            <div key={i} className="w-40"><Num min="0" step="1000000" value={e} onChange={(v) => setInv({ scenarios: scenarios.map((x, j) => (j === i ? v : x)) })} aria-label={`Exit scenario ${i + 1}`} /></div>
          ))}
          <button onClick={() => setInv({ scenarios: [...scenarios, (scenarios.at(-1) || 1e7) * 2] })} className="rounded-md border border-dashed border-ink-600 px-3 text-xs hover:border-accent hover:text-accent">+ exit</button>
          {scenarios.length > 1 && <button onClick={() => setInv({ scenarios: scenarios.slice(0, -1) })} className="rounded-md border border-dashed border-ink-600 px-3 text-xs hover:border-rose-400 hover:text-rose-400">− exit</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-700 text-left text-[11px] uppercase tracking-wider text-zinc-500"><th className="py-2">Term sheet</th>{scenarios.map((e, i) => <th key={i}>@ {money(e)}</th>)}</tr></thead>
            <tbody className="font-mono">
              {sheets.map((s) => (
                <tr key={s.id} className="border-b border-ink-800">
                  <td className="py-2 font-sans">{s.name}</td>
                  {scenarios.map((e, i) => {
                    const r = termSheetPayout(s, base, e, base.years);
                    return (
                      <td key={i} className={r.payout >= best[i] - 0.5 ? 'text-accent' : ''}>
                        {money(r.payout)} <span className="text-[10px] text-zinc-500">{r.moic.toFixed(2)}x · {r.irr == null ? '—' : `${(r.irr * 100).toFixed(0)}%`}{r.converted ? ' · conv' : ''}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-500">Payouts come from the same liquidation-preference waterfall as Founder mode, including seniority, participation caps, and convert-vs-preference. The best term sheet at each exit is highlighted. IRR = MOIC^(1/years) − 1.</p>
      </Card>
    </div>
  );
}
