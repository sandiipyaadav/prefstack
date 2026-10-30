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
    <div className="space-y-6">
      <Card title="Company before the round" description="Baseline capitalization and preference assumptions shared by every offer.">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          <Field label="Pre-round FD shares"><Num min="1" value={base.existingShares} onChange={(v) => setBase({ existingShares: v })} /></Field>
          <Field label="Prior preferred: shares"><Num min="0" value={base.priorShares} onChange={(v) => setBase({ priorShares: v })} /></Field>
          <Field label="Prior preferred: 1x pref ($)" tip="Preference claim held by existing preferred before the new financing."><Num min="0" value={base.seniorPref} onChange={(v) => setBase({ seniorPref: v })} /></Field>
          <Field label="Prior senior to new?" tip="Senior classes are paid before the new preferred; pari passu classes share at the same priority.">
            <label className="flex h-[34px] items-center gap-2 text-sm"><input type="checkbox" checked={!!base.priorSenior} onChange={(e) => setBase({ priorSenior: e.target.checked })} /> {base.priorSenior ? 'Senior' : 'Pari passu'}</label>
          </Field>
          <Field label="Years to exit"><Num min="0.5" step="0.5" value={base.years} onChange={(v) => setBase({ years: v })} /></Field>
        </div>
      </Card>

      <div className="grid gap-3 xl:grid-cols-3">
        {sheets.map((s) => {
          const t = termSheetHolders(s, base);
          return (
            <div key={s.id} className="rounded-xl border border-white/[0.07] bg-ink-800/50 p-3.5 shadow-panel transition hover:border-white/[0.11]">
              <div className="mb-3 flex gap-2">
                <input className="input flex-1 font-sans font-medium" value={s.name} onChange={(e) => setSheet(s.id, { name: e.target.value })} aria-label="Term sheet name" />
                <button type="button" onClick={() => setInv({ sheets: sheets.filter((x) => x.id !== s.id) })} className="rounded-lg p-2 text-zinc-600 hover:bg-rose-400/10 hover:text-rose-300" aria-label="Remove term sheet"><Trash2 size={15} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Your check ($)"><Num min="0" value={s.invest} onChange={(v) => setSheet(s.id, { invest: v })} /></Field>
                <Field label="Round size ($)"><Num min="0" value={s.roundSize} onChange={(v) => setSheet(s.id, { roundSize: v })} /></Field>
                <Field label="Pre-money ($)"><Num min="0" value={s.preMoney} onChange={(v) => setSheet(s.id, { preMoney: v })} /></Field>
                <Field label="Pool (% post, pre-money)" tip="Option pool created pre-money and sized as a percentage of post-financing shares."><Num min="0" max="40" value={s.poolPct} onChange={(v) => setSheet(s.id, { poolPct: v })} /></Field>
                <Field label="Liq. pref (x)" tip="Multiple of invested capital paid before as-converted common proceeds."><Num min="0" step="0.25" value={s.multiple} onChange={(v) => setSheet(s.id, { multiple: v })} /></Field>
                <Field label="Participating" tip="Takes the preference and then participates in residual proceeds.">
                  <label className="flex h-[34px] items-center gap-2 text-sm"><input type="checkbox" checked={!!s.participating} onChange={(e) => setSheet(s.id, { participating: e.target.checked })} /> {s.participating ? 'Yes' : 'No'}</label>
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
        <button type="button" onClick={() => setInv({ sheets: [...sheets, newSheet()] })} className="add-tile min-h-24"><Plus size={15} /> Add term sheet</button>
      </div>

      <Card title="Your payout by exit" description="Returns after liquidation preferences, participation, and conversion choices.">
        <div className="mb-3 flex flex-wrap gap-2">
          {scenarios.map((e, i) => (
            <div key={i} className="w-40"><Num min="0" step="1000000" value={e} onChange={(v) => setInv({ scenarios: scenarios.map((x, j) => (j === i ? v : x)) })} aria-label={`Exit scenario ${i + 1}`} /></div>
          ))}
          <button type="button" onClick={() => setInv({ scenarios: [...scenarios, (scenarios.at(-1) || 1e7) * 2] })} className="button button-secondary">+ exit</button>
          {scenarios.length > 1 && <button type="button" onClick={() => setInv({ scenarios: scenarios.slice(0, -1) })} className="button button-danger">− exit</button>}
        </div>
        <div className="table-shell">
          <table className="min-w-[680px] w-full text-sm">
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
