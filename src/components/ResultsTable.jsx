import { money, pct } from '../utils/format.js';

/** Payout breakdown per class at the selected exit value. */
export default function ResultsTable({ rows, colors, exit }) {
  return (
    <div className="table-shell">
      <table className="min-w-[620px] w-full text-sm">
        <thead>
          <tr className="border-b border-ink-700 text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="py-2">Class</th><th>Owns</th><th>Preference</th><th>Pro-rata</th><th>Total</th><th>Of exit</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((r) => {
            const delta = r.payoutShare - r.ownership;
            return (
              <tr key={r.id} className="border-b border-ink-800">
                <td className="py-2 font-sans">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: colors[r.id] }} />
                  {r.name}
                  {r.converted && <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent">converts</span>}
                </td>
                <td>{pct(r.ownership)}</td>
                <td>{money(r.prefPaid)}</td>
                <td>{money(r.partPaid)}</td>
                <td className="text-zinc-100">{money(r.total)}</td>
                <td className={exit > 0 ? (delta < -0.0005 ? 'text-rose-400' : delta > 0.0005 ? 'text-accent' : '') : ''}>
                  {pct(r.payoutShare)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-zinc-500">Red: the class gets less than its ownership % because of preferences ahead of it. Green: it gets more.</p>
    </div>
  );
}
