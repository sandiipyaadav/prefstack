import { useEffect, useMemo, useState } from 'react';
import { Layers, Plus, RotateCcw, Download, AlertTriangle } from 'lucide-react';
import HolderEditor from './components/HolderEditor.jsx';
import ResultsTable from './components/ResultsTable.jsx';
import PayoutChart from './components/PayoutChart.jsx';
import { runWaterfall, sweep } from './utils/waterfall.js';
import { DEFAULT_STATE, COLORS, newHolder } from './utils/defaults.js';
import { load, save, clear } from './utils/storage.js';
import { money, pct } from './utils/format.js';

export default function App() {
  const [state, setState] = useState(() => load(DEFAULT_STATE));
  const { holders, exit } = state;

  // Persist every edit locally; nothing ever leaves the browser.
  useEffect(() => save(state), [state]);

  const colors = useMemo(() => Object.fromEntries(holders.map((h, i) => [h.id, COLORS[i % COLORS.length]])), [holders]);
  const totalPref = holders.filter((h) => h.type === 'preferred').reduce((s, h) => s + (Number(h.invested) || 0) * (Number(h.multiple) || 0), 0);
  const maxExit = Math.max(10000000, totalPref * 4, exit * 1.5);
  const rows = useMemo(() => runWaterfall(holders, exit), [holders, exit]);
  const curve = useMemo(() => sweep(holders, maxExit), [holders, maxExit]);

  // Headline: what common (founders + pool + any common) takes home.
  const common = rows.filter((r) => r.type === 'common');
  const commonTake = common.reduce((s, r) => s + r.total, 0);
  const commonOwn = common.reduce((s, r) => s + r.ownership, 0);

  const update = (patch) => setState((s) => ({ ...s, ...patch }));
  const setHolder = (h) => update({ holders: holders.map((x) => (x.id === h.id ? h : x)) });

  const exportCsv = () => {
    const head = 'class,type,shares,ownership,preference,pro_rata,total,share_of_exit,converted';
    const lines = rows.map((r) => [r.name, r.type, r.shares, r.ownership.toFixed(4), r.prefPaid.toFixed(2), r.partPaid.toFixed(2), r.total.toFixed(2), r.payoutShare.toFixed(4), r.converted].join(','));
    const blob = new Blob([[`exit,${exit}`, head, ...lines].join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `prefstack-${exit}.csv` });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-h-screen bg-ink-950 font-sans text-zinc-300">
      <header className="border-b border-ink-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Layers className="text-accent" size={20} />
            <span className="font-semibold text-zinc-100">PrefStack</span>
            <span className="hidden text-xs text-zinc-500 sm:inline">· who actually gets paid at exit</span>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-md border border-ink-600 px-3 py-1.5 text-xs hover:border-accent hover:text-accent"><Download size={14} /> CSV</button>
            <button onClick={() => { clear(); setState(DEFAULT_STATE); }} className="flex items-center gap-1.5 rounded-md border border-ink-600 px-3 py-1.5 text-xs hover:border-accent hover:text-accent"><RotateCcw size={14} /> Reset</button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Left: cap table editor */}
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">Cap table</h2>
          {holders.map((h) => (
            <HolderEditor key={h.id} holder={h} color={colors[h.id]} onChange={setHolder}
              onRemove={() => update({ holders: holders.filter((x) => x.id !== h.id) })} />
          ))}
          <div className="flex gap-2">
            <button onClick={() => update({ holders: [...holders, newHolder('preferred')] })} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-600 py-2 text-sm hover:border-accent hover:text-accent"><Plus size={15} /> Preferred</button>
            <button onClick={() => update({ holders: [...holders, newHolder('common')] })} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-600 py-2 text-sm hover:border-accent hover:text-accent"><Plus size={15} /> Common</button>
          </div>
        </section>

        {/* Right: exit slider, headline, chart, breakdown */}
        <section className="space-y-5">
          <div className="card">
            <div className="flex items-end justify-between">
              <div>
                <span className="label">Exit value</span>
                <div className="font-mono text-3xl text-zinc-100">{money(exit)}</div>
              </div>
              <input type="number" min="0" step="1000000" className="input w-40" value={exit} onChange={(e) => update({ exit: Math.max(0, Number(e.target.value) || 0) })} aria-label="Exit value" />
            </div>
            <input type="range" min="0" max={maxExit} step={maxExit / 400} value={Math.min(exit, maxExit)} onChange={(e) => update({ exit: Number(e.target.value) })} className="mt-4 w-full accent-[#c6ff3d]" aria-label="Exit slider" />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Stat label="Common takes" value={money(commonTake)} accent />
              <Stat label="Common owns" value={pct(commonOwn)} />
              <Stat label="Pref stack" value={money(totalPref)} />
            </div>
            {exit > 0 && exit <= totalPref && (
              <p className="mt-3 flex items-center gap-2 text-xs text-amber-400"><AlertTriangle size={14} /> Exit is at or below the preference stack. Common may get little or nothing.</p>
            )}
          </div>

          <div className="card">
            <h3 className="label">Payout by exit value</h3>
            <PayoutChart data={curve} holders={holders} colors={colors} exit={exit} maxExit={maxExit} />
          </div>

          <div className="card">
            <h3 className="label">Waterfall at {money(exit)}</h3>
            <ResultsTable rows={rows} colors={colors} exit={exit} />
          </div>
        </section>
      </main>
      <footer className="pb-8 text-center text-xs text-zinc-600">Runs in your browser. Data stays on this device. Not legal or financial advice.</footer>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg bg-ink-900 py-2">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`font-mono text-lg ${accent ? 'text-accent' : 'text-zinc-100'}`}>{value}</div>
    </div>
  );
}
