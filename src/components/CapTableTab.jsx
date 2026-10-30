import { Plus } from 'lucide-react';
import HolderEditor from './HolderEditor.jsx';
import { Card, Stat, Dot } from './ui.jsx';
import { int, pct, money } from '../utils/format.js';
import { newHolder } from '../utils/defaults.js';

/** Tab 1: the shared cap table with fully diluted ownership. */
export default function CapTableTab({ state, update, colors }) {
  const { holders } = state;
  const fd = holders.reduce((s, h) => s + (Number(h.shares) || 0), 0);
  const outstanding = holders.filter((h) => !h.isPool).reduce((s, h) => s + (Number(h.shares) || 0), 0);
  const raised = holders.filter((h) => h.type === 'preferred').reduce((s, h) => s + (Number(h.invested) || 0), 0);
  const pool = fd - outstanding;
  const setHolder = (h) => update({ holders: holders.map((x) => (x.id === h.id ? h : x)) });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="space-y-3">
        <Card title="Company" description="This name appears across your workspace and report.">
          <input className="input font-sans" value={state.company} onChange={(e) => update({ company: e.target.value })} aria-label="Company name" />
        </Card>
        {holders.map((h) => (
          <HolderEditor key={h.id} holder={h} color={colors[h.id]} onChange={setHolder} onRemove={() => update({ holders: holders.filter((x) => x.id !== h.id) })} />
        ))}
        <div className="flex gap-2">
          <button type="button" onClick={() => update({ holders: [...holders, newHolder('preferred')] })} className="add-tile flex-1"><Plus size={15} /> Preferred class</button>
          <button type="button" onClick={() => update({ holders: [...holders, newHolder('common')] })} className="add-tile flex-1"><Plus size={15} /> Common class</button>
        </div>
      </section>
      <section className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Fully diluted" value={int(fd)} tip="All outstanding shares plus the unissued option pool." />
          <Stat label="Outstanding" value={int(outstanding)} tip="Shares currently issued to holders, excluding the unissued pool." />
          <Stat label="Unissued pool" value={pct(fd ? pool / fd : 0)} tip="Options reserved for future grants as a share of fully diluted equity." />
          <Stat label="Capital raised" value={money(raised)} accent tip="Total invested capital recorded across preferred share classes." />
        </div>
        <Card title="Ownership" description="Fully diluted ownership across all issued classes and the available option pool.">
          <div className="mb-5 rounded-xl border border-white/[0.06] bg-ink-950/60 p-3">
            <div className="flex h-7 overflow-hidden rounded-md bg-ink-900" aria-label="Fully diluted ownership distribution">
              {holders.map((h) => <div key={h.id} className="group relative transition hover:brightness-125" style={{ width: `${fd ? (h.shares / fd) * 100 : 0}%`, background: colors[h.id] }} title={`${h.name}: ${pct(fd ? h.shares / fd : 0)}`} />)}
            </div>
          </div>
          <div className="table-shell">
          <table className="min-w-[620px] w-full text-sm">
            <thead><tr className="border-b border-ink-700 text-left text-[11px] uppercase tracking-wider text-zinc-500"><th className="py-2">Class</th><th>Shares</th><th>Outstanding %</th><th>Fully diluted %</th></tr></thead>
            <tbody className="font-mono">
              {holders.map((h) => (
                <tr key={h.id} className="border-b border-ink-800">
                  <td className="py-2 font-sans"><Dot color={colors[h.id]} />{h.name}{h.isPool && <span className="ml-2 text-[10px] text-zinc-500">unissued</span>}</td>
                  <td>{int(h.shares)}</td>
                  <td>{h.isPool ? '—' : pct(outstanding ? h.shares / outstanding : 0)}</td>
                  <td className="text-zinc-100">{pct(fd ? h.shares / fd : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
