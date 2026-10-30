import { Printer } from 'lucide-react';
import { Button } from '../ui.jsx';
import { money, pct } from '../../utils/format.js';

const x = (v) => `${(v || 0).toFixed(2)}x`;
const irr = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);

/** Investor tab 5: LP- or partner-ready portfolio report; print to PDF. */
export default function InvestorReportTab({ inv, summary, plan }) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Portfolio Performance Report</div>
          <h1 className="text-3xl font-bold">{inv.investor}</h1>
          <div className="text-xs text-zinc-500">Prepared {date} · PrefStack</div>
        </header>
        <div className="mb-8 grid grid-cols-4 gap-3 text-center">
          {[['Paid-in', money(summary.invested)], ['TVPI', x(summary.tvpi)], ['DPI', x(summary.dpi)], ['Net IRR', irr(summary.irr)]].map(([k, v]) => (
            <div key={k} className="rounded border border-zinc-300 py-3"><div className="text-[10px] uppercase tracking-wider text-zinc-500">{k}</div><div className="font-mono text-xl font-semibold">{v}</div></div>
          ))}
        </div>
        <h2 className="mb-2 text-lg font-semibold">1. Positions</h2>
        <T head={['Company', 'Stage', 'Invested', 'Distributed', 'Mark', 'MOIC', 'IRR', 'Own %']}
          rows={[...summary.rows.map((r) => [r.name, `${r.stage} · ${r.instrument}`, money(r.m.invested), money(r.m.distributed), money(r.m.mark), x(r.m.moic), irr(r.m.irr), `${r.ownershipPct}%`]),
            ['Total', '', money(summary.invested), money(summary.distributed), money(summary.nav), x(summary.tvpi), irr(summary.irr), '']]} />
        <h2 className="mb-2 text-lg font-semibold">2. Follow-on reserves</h2>
        <T head={['Company', 'Next round', 'Pro-rata', 'Probability', 'Weighted', 'Own skip → take']}
          rows={plan.rows.map((r) => [r.name, money(r.post), money(r.planned), pct(r.prob), money(r.weighted), `${pct(r.diluted)} → ${pct(r.withProRata)}`])} />
        <p className="text-[12px]">Reserve budget {money(plan.budget)}, expected need {money(plan.totalWeighted)}, {plan.gap >= 0 ? `headroom ${money(plan.gap)}` : `shortfall ${money(-plan.gap)}`}.</p>
        <p className="mt-6 text-[10px] text-zinc-500">Marks are the investor's own valuations as of each mark date. IRR is XIRR on dated cash flows, treating each mark as a sale on its mark date. This report is not investment advice.</p>
      </article>
    </div>
  );
}
