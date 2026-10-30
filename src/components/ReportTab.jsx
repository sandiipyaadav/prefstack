import { Printer } from 'lucide-react';
import { Button } from './ui.jsx';
import { money, int, pct } from '../utils/format.js';
import { runWaterfall } from '../utils/waterfall.js';
import { optionValue } from '../utils/options.js';

/** Tab 6: investor-ready report. Light, print-optimised; "Save as PDF" from the print dialog. */
export default function ReportTab({ state, model }) {
  const { holders, company, round, scenarios, grant } = state;
  const fd = holders.reduce((s, h) => s + h.shares, 0);
  const outstanding = holders.filter((h) => !h.isPool);
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const waterfalls = scenarios.map((e) => ({ exit: e, rows: runWaterfall(outstanding, e) }));
  const T = ({ head, rows }) => (
    <table className="mb-6 w-full border-collapse text-[12px]">
      <thead><tr>{head.map((h) => <th key={h} className="border-b-2 border-zinc-800 py-1.5 text-left font-semibold">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border-b border-zinc-200 py-1.5 font-mono">{c}</td>)}</tr>)}</tbody>
    </table>
  );

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">This preview prints as-is. Choose "Save as PDF" in the print dialog.</p>
        <Button primary onClick={() => window.print()}><Printer size={14} /> Print / Save PDF</Button>
      </div>
      <article className="report mx-auto max-w-4xl rounded-xl bg-white p-10 text-zinc-900 shadow-2xl">
        <header className="mb-8 border-b-4 border-zinc-900 pb-4">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Capitalization & Exit Analysis</div>
          <h1 className="text-3xl font-bold">{company}</h1>
          <div className="text-xs text-zinc-500">Prepared {date} · PrefStack</div>
        </header>

        <h2 className="mb-2 text-lg font-semibold">1. Current capitalization</h2>
        <T head={['Class', 'Type', 'Shares', 'Fully diluted', 'Invested', 'Terms']}
          rows={[...holders.map((h) => [h.name, h.isPool ? 'Pool (unissued)' : h.type, int(h.shares), pct(fd ? h.shares / fd : 0), h.type === 'preferred' ? money(h.invested) : '—',
            h.type === 'preferred' ? `${h.multiple}x, seniority ${h.seniority}${h.participating ? `, participating${h.cap ? ` (cap ${h.cap}x)` : ''}` : ', non-participating'}` : '—']),
          ['Total', '', int(fd), '100%', '', '']]} />

        {state.instruments.length > 0 && (<>
          <h2 className="mb-2 text-lg font-semibold">2. Convertible securities</h2>
          <T head={['Instrument', 'Type', 'Converting $', 'Cap', 'Discount', 'Conv. price', 'Shares']}
            rows={model.conversions.map((c) => [c.name, c.kind === 'note' ? `Note ${c.rate}% / ${c.months}mo` : `${c.basis}-money SAFE${c.mfn ? ' (MFN)' : ''}`, money(c.convertingAmount), c.effCap ? money(c.effCap) : '—', `${c.effDiscount}%`, `$${c.price.toFixed(4)}`, int(c.shares)])} />
        </>)}

        <h2 className="mb-2 text-lg font-semibold">3. Pro forma: {round.name}</h2>
        <p className="mb-2 text-[12px]">{money(round.newMoney)} at {money(round.preMoney)} pre-money ({money(model.postMoney)} post), ${model.price.toFixed(4)} per share, unissued pool topped up to {round.poolTarget}% post-money ({int(model.topUp)} new shares).</p>
        <T head={['Holder', 'Before', '%', 'After', '%']} rows={model.rows.map((r) => [r.name, int(r.before), pct(r.beforePct), int(r.after), pct(r.afterPct)])} />

        <h2 className="mb-2 text-lg font-semibold">4. Exit waterfall (current cap table)</h2>
        <T head={['Class', ...scenarios.map((e) => `@ ${money(e)}`)]}
          rows={outstanding.map((h) => [h.name, ...waterfalls.map((w) => { const r = w.rows.find((x) => x.id === h.id); return `${money(r.total)} (${pct(r.payoutShare)})${r.converted ? '*' : ''}`; })])} />
        <p className="-mt-4 mb-6 text-[10px] text-zinc-500">* converts to common because that pays more than its preference.</p>

        <h2 className="mb-2 text-lg font-semibold">5. Sample option grant</h2>
        <T head={['Exit', 'Common $/share', 'Gross', 'Net after tax']}
          rows={scenarios.map((e) => { const v = optionValue(holders, grant, e); return [money(e), `$${v.pps.toFixed(2)}`, money(v.gross), money(v.net)]; })} />
        <p className="text-[10px] text-zinc-500">{int(grant.options)} options at a ${grant.strike} strike, {grant.vestedPct}% vested, {grant.taxPct}% tax. This is a model only and is not legal, tax, or investment advice.</p>
      </article>
    </div>
  );
}
