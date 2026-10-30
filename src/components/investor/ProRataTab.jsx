import { Card, Field, Num, Stat } from '../ui.jsx';
import { money, pct } from '../../utils/format.js';

/** Investor tab 2: next-round pro-rata per position and probability-weighted reserves vs budget. */
export default function ProRataTab({ inv, setInv, plan }) {
  const setNext = (id, patch) => setInv({ positions: inv.positions.map((p) => (p.id === id ? { ...p, next: { ...p.next, ...patch } } : p)) });
  const byId = Object.fromEntries(plan.rows.map((r) => [r.id, r]));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Reserve budget ($)"><Num min="0" step="10000" value={inv.reserveBudget} onChange={(v) => setInv({ reserveBudget: v })} /></Field>
        <Stat label="Full pro-rata asks" value={money(plan.totalPlanned)} sub="if every company raises" />
        <Stat label="Expected need" value={money(plan.totalWeighted)} accent sub="probability-weighted" />
        <Stat label={plan.gap >= 0 ? 'Headroom' : 'Shortfall'} value={money(Math.abs(plan.gap))} sub={plan.gap >= 0 ? 'budget covers expected need' : 'trim or skip follow-ons'} />
      </div>
      <Card title="Next round per position">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-700 text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="py-2">Company</th><th>Own %</th><th>Pre-money</th><th>Round size</th><th>Prob. %</th><th>Take</th><th>Pro-rata check</th><th>Own if skip</th><th>Own if take</th><th>Weighted</th></tr></thead>
            <tbody className="font-mono">
              {inv.positions.map((p) => {
                const r = byId[p.id];
                return (
                  <tr key={p.id} className="border-b border-ink-800">
                    <td className="py-2 font-sans">{p.name}</td>
                    <td>{p.ownershipPct}%</td>
                    <td className="w-32 pr-2"><Num min="0" step="1000000" value={p.next.preMoney} onChange={(v) => setNext(p.id, { preMoney: v })} aria-label="Pre-money" /></td>
                    <td className="w-32 pr-2"><Num min="0" step="500000" value={p.next.newMoney} onChange={(v) => setNext(p.id, { newMoney: v })} aria-label="Round size" /></td>
                    <td className="w-20 pr-2"><Num min="0" max="100" value={p.next.probability} onChange={(v) => setNext(p.id, { probability: v })} aria-label="Probability" /></td>
                    <td><input type="checkbox" className="accent-[#c6ff3d]" checked={p.next.take !== false} onChange={(e) => setNext(p.id, { take: e.target.checked })} aria-label="Take pro-rata" /></td>
                    <td className="text-zinc-100">{money(r.check)}</td>
                    <td className="text-rose-400">{pct(r.diluted)}</td>
                    <td className="text-accent">{pct(r.withProRata)}</td>
                    <td>{money(r.weighted)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-500">Pro-rata check = your fully diluted ownership × new money, which holds your % flat. Expected need weights each check by the chance the company actually raises the round, the same graduation-rate method fund models use for reserves.</p>
      </Card>
    </div>
  );
}
