import { useEffect, useMemo, useRef, useState } from 'react';
import { Layers, RotateCcw, FileDown, FileUp, Table2, FileSignature, TrendingUp, Droplets, BadgeDollarSign, FileText } from 'lucide-react';
import CapTableTab from './components/CapTableTab.jsx';
import ConversionsTab from './components/ConversionsTab.jsx';
import RoundTab from './components/RoundTab.jsx';
import WaterfallTab from './components/WaterfallTab.jsx';
import OptionsTab from './components/OptionsTab.jsx';
import ReportTab from './components/ReportTab.jsx';
import { Button } from './components/ui.jsx';
import { runWaterfall, sweep } from './utils/waterfall.js';
import { modelRound, applyRound } from './utils/conversion.js';
import { DEFAULT_STATE, COLORS, uid } from './utils/defaults.js';
import { load, save, clear, normalize, download } from './utils/storage.js';

const TABS = [
  { id: 'cap', label: 'Cap table', icon: Table2 },
  { id: 'conv', label: 'SAFEs & notes', icon: FileSignature },
  { id: 'round', label: 'Round', icon: TrendingUp },
  { id: 'exit', label: 'Exit waterfall', icon: Droplets },
  { id: 'options', label: 'Options', icon: BadgeDollarSign },
  { id: 'report', label: 'Report', icon: FileText },
];

export default function App() {
  const [state, setState] = useState(load);
  const [tab, setTab] = useState(() => (location.hash.slice(1) && TABS.some((t) => t.id === location.hash.slice(1)) ? location.hash.slice(1) : 'cap'));
  const [notice, setNotice] = useState('');
  const fileRef = useRef(null);

  useEffect(() => save(state), [state]);            // persist every edit, locally only
  useEffect(() => { history.replaceState(null, '', `#${tab}`); }, [tab]);
  useEffect(() => { if (!notice) return undefined; const t = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(t); }, [notice]);

  const update = (patch) => setState((s) => ({ ...s, ...patch }));

  // Derived data shared across tabs.
  const colors = useMemo(() => Object.fromEntries(state.holders.map((h, i) => [h.id, COLORS[i % COLORS.length]])), [state.holders]);
  const outstanding = useMemo(() => state.holders.filter((h) => !h.isPool), [state.holders]);
  const model = useMemo(() => modelRound(state), [state]);
  const totalPref = outstanding.filter((h) => h.type === 'preferred').reduce((s, h) => s + (Number(h.invested) || 0) * (Number(h.multiple) || 0), 0);
  const maxExit = Math.max(10000000, totalPref * 4, state.exit * 1.5);
  const rows = useMemo(() => runWaterfall(outstanding, state.exit), [outstanding, state.exit]);
  const curve = useMemo(() => (tab === 'exit' ? sweep(outstanding, maxExit) : []), [outstanding, maxExit, tab]);

  const closeRound = () => {
    update({ holders: applyRound(state.holders, model, state.round, uid), instruments: [] });
    setNotice(`${state.round.name} written to the cap table.`);
    setTab('cap');
  };

  const exportJson = () => download(`${state.company.replace(/\W+/g, '-').toLowerCase() || 'prefstack'}-captable.json`, JSON.stringify(state, null, 2));
  const importJson = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setState(normalize(JSON.parse(await file.text())));
      setNotice(`Imported ${file.name}.`);
    } catch (err) {
      setNotice(`Import failed: ${err.message}`);
    }
  };

  const shared = { state, update, colors, model };
  return (
    <div className="min-h-screen bg-ink-950 font-sans text-zinc-300">
      <header className="no-print sticky top-0 z-10 border-b border-ink-800 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-2">
            <Layers className="text-accent" size={20} />
            <span className="font-semibold text-zinc-100">PrefStack</span>
            <span className="hidden text-xs text-zinc-500 md:inline">· {state.company}</span>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importJson} />
            <Button onClick={() => fileRef.current?.click()}><FileUp size={14} /> Import</Button>
            <Button onClick={exportJson}><FileDown size={14} /> Export JSON</Button>
            <Button onClick={() => { if (confirm('Reset to the example cap table? Your current data will be lost.')) { clear(); setState(DEFAULT_STATE); } }}><RotateCcw size={14} /> Reset</Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition ${tab === id ? 'border-accent text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </nav>
      </header>

      {notice && <div className="no-print fixed bottom-5 right-5 z-20 rounded-lg border border-accent/40 bg-ink-800 px-4 py-2 text-sm text-zinc-100 shadow-lg">{notice}</div>}

      <main className="mx-auto max-w-7xl px-5 py-6">
        {tab === 'cap' && <CapTableTab {...shared} />}
        {tab === 'conv' && <ConversionsTab {...shared} />}
        {tab === 'round' && <RoundTab {...shared} onApply={closeRound} />}
        {tab === 'exit' && <WaterfallTab {...shared} outstanding={outstanding} rows={rows} curve={curve} maxExit={maxExit} totalPref={totalPref} />}
        {tab === 'options' && <OptionsTab {...shared} />}
        {tab === 'report' && <ReportTab {...shared} />}
      </main>
      <footer className="no-print pb-8 text-center text-xs text-zinc-600">Runs in your browser and your data stays on this device. Not legal, tax, or financial advice.</footer>
    </div>
  );
}
