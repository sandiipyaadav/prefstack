import { useEffect, useMemo, useRef, useState } from 'react';
import { Layers, RotateCcw, FileDown, FileUp, Table2, FileSignature, TrendingUp, Droplets, BadgeDollarSign, FileText, Briefcase, PiggyBank, Scale, Target, Building2, Landmark, LockKeyhole, ChevronRight } from 'lucide-react';
import CapTableTab from './components/CapTableTab.jsx';
import ConversionsTab from './components/ConversionsTab.jsx';
import RoundTab from './components/RoundTab.jsx';
import WaterfallTab from './components/WaterfallTab.jsx';
import OptionsTab from './components/OptionsTab.jsx';
import ReportTab from './components/ReportTab.jsx';
import PortfolioTab from './components/investor/PortfolioTab.jsx';
import ProRataTab from './components/investor/ProRataTab.jsx';
import TermSheetsTab from './components/investor/TermSheetsTab.jsx';
import ExitReturnsTab from './components/investor/ExitReturnsTab.jsx';
import InvestorReportTab from './components/investor/InvestorReportTab.jsx';
import { Button } from './components/ui.jsx';
import { portfolioSummary, reservesPlan } from './utils/investor.js';
import { runWaterfall, sweep } from './utils/waterfall.js';
import { modelRound, applyRound } from './utils/conversion.js';
import { DEFAULT_STATE, DEFAULT_INVESTOR, COLORS, uid } from './utils/defaults.js';
import { load, save, clear, download, loadInvestor, saveInvestor, clearInvestor, loadMode, saveMode, bundle, parseImport } from './utils/storage.js';

const TABS = [
  { id: 'cap', label: 'Cap table', icon: Table2, description: 'Model ownership, share classes, preferences, and fully diluted equity.' },
  { id: 'conv', label: 'SAFEs & notes', icon: FileSignature, description: 'See how outstanding convertibles price and dilute in the next round.' },
  { id: 'round', label: 'Round', icon: TrendingUp, description: 'Model a priced financing and compare ownership before and after.' },
  { id: 'exit', label: 'Exit waterfall', icon: Droplets, description: 'Understand how liquidation preferences shape proceeds at exit.' },
  { id: 'options', label: 'Options', icon: BadgeDollarSign, description: 'Estimate employee option value after preferences, exercise, and tax.' },
  { id: 'report', label: 'Report', icon: FileText, description: 'Create a clean, investor-ready capitalization and exit analysis.' },
];

const INV_TABS = [
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase, description: 'Track position-level performance, cash flows, marks, and fund metrics.' },
  { id: 'prorata', label: 'Pro-rata & reserves', icon: PiggyBank, description: 'Plan follow-ons and allocate reserves against probability-weighted needs.' },
  { id: 'terms', label: 'Term sheets', icon: Scale, description: 'Compare economics, ownership, and preference outcomes side by side.' },
  { id: 'exits', label: 'Exit returns', icon: Target, description: 'Stress-test portfolio outcomes and identify fund-returning exits.' },
  { id: 'ireport', label: 'Report', icon: FileText, description: 'Prepare a polished portfolio performance report for partners or LPs.' },
];

export default function App() {
  const [state, setState] = useState(load);
  const [inv, setInvState] = useState(loadInvestor);
  const [mode, setModeState] = useState(loadMode);
  const [tab, setTab] = useState(() => {
    const h = location.hash.slice(1);
    const m = loadMode();
    const list = m === 'investor' ? INV_TABS : TABS;
    return list.some((t) => t.id === h) ? h : list[0].id;
  });
  const [notice, setNotice] = useState('');
  const fileRef = useRef(null);

  useEffect(() => save(state), [state]);            // persist every edit, locally only
  useEffect(() => saveInvestor(inv), [inv]);        // investor data lives under its own key
  useEffect(() => saveMode(mode), [mode]);          // remember the Founder / Investor toggle
  useEffect(() => { history.replaceState(null, '', `#${tab}`); }, [tab]);
  useEffect(() => { if (!notice) return undefined; const t = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(t); }, [notice]);

  const update = (patch) => setState((s) => ({ ...s, ...patch }));
  const setInv = (patch) => setInvState((s) => ({ ...s, ...patch }));
  const switchMode = (m) => { setModeState(m); setTab(m === 'investor' ? INV_TABS[0].id : TABS[0].id); };
  const summary = useMemo(() => portfolioSummary(inv.positions, inv.asOf), [inv.positions, inv.asOf]);
  const plan = useMemo(() => reservesPlan(inv.positions, inv.reserveBudget), [inv.positions, inv.reserveBudget]);

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

  // One file carries founder data, investor data, and the current mode.
  const exportJson = () => download(`prefstack-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(bundle(mode, state, inv), null, 2));
  const importJson = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = parseImport(JSON.parse(await file.text()));
      if (parsed.founder) setState(parsed.founder);
      if (parsed.investor) setInvState(parsed.investor);
      switchMode(parsed.mode);
      setNotice(`Imported ${file.name}${parsed.founder && parsed.investor ? ' (founder + investor)' : parsed.investor ? ' (investor)' : ' (founder)'}.`);
    } catch (err) {
      setNotice(`Import failed: ${err.message}`);
    }
  };

  const shared = { state, update, colors, model };
  const tabs = mode === 'investor' ? INV_TABS : TABS;
  const activeTab = tabs.find((item) => item.id === tab) || tabs[0];
  const ActiveIcon = activeTab.icon;
  const entity = mode === 'investor' ? inv.investor : state.company;
  return (
    <div className="min-h-screen font-sans text-zinc-300">
      <a href="#main-content" className="no-print fixed left-4 top-3 z-50 -translate-y-20 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-ink-950 transition focus:translate-y-0">Skip to content</a>
      <div className="md:flex">
        <aside className="no-print border-b border-white/[0.07] bg-ink-900/95 backdrop-blur-xl md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col md:border-b-0 md:border-r">
          <div className="flex h-16 items-center gap-2.5 px-4 md:px-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent shadow-glow">
              <Layers size={17} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div>
              <div className="text-[15px] font-semibold tracking-[-0.02em] text-white">PrefStack</div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Equity intelligence</div>
            </div>
          </div>

          <div className="mx-4 mb-3 grid grid-cols-2 rounded-lg border border-white/[0.07] bg-ink-950/80 p-1" role="tablist" aria-label="Workspace mode">
            {[
              { id: 'founder', icon: Building2 },
              { id: 'investor', icon: Landmark },
            ].map(({ id, icon: Icon }) => (
              <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => switchMode(id)}
                className={`flex min-h-8 items-center justify-center gap-1.5 rounded-md px-2 text-[11px] font-medium capitalize transition ${mode === id ? 'bg-white/[0.09] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <Icon size={13} aria-hidden="true" /> {id}
              </button>
            ))}
          </div>

          <nav className="flex gap-1 overflow-x-auto px-4 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0" aria-label={`${mode} tools`}>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}
                className={`group flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium transition md:w-full ${tab === id ? 'bg-accent/[0.11] text-zinc-100' : 'text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-300'}`}>
                <Icon size={15} className={tab === id ? 'text-accent' : 'text-zinc-600 transition group-hover:text-zinc-400'} aria-hidden="true" />
                <span>{label}</span>
                {tab === id && <ChevronRight size={13} className="ml-auto hidden text-accent/60 md:block" aria-hidden="true" />}
              </button>
            ))}
          </nav>

          <div className="mx-4 mb-4 hidden rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 md:block">
            <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400"><LockKeyhole size={12} className="text-positive" /> Local & private</div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-600">Your data is stored only in this browser. Nothing is sent to a server.</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 md:ml-64">
          <header className="no-print sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-white/[0.06] bg-ink-950/80 px-4 backdrop-blur-xl sm:px-6">
            <div className="min-w-0">
              <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-600">{mode} workspace</div>
              <div className="truncate text-sm font-medium text-zinc-200">{entity}</div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importJson} />
              <Button variant="ghost" onClick={() => fileRef.current?.click()} aria-label="Import JSON"><FileUp size={14} /><span className="hidden sm:inline">Import</span></Button>
              <Button variant="secondary" onClick={exportJson} aria-label="Export JSON"><FileDown size={14} /><span className="hidden sm:inline">Export JSON</span></Button>
              <Button variant="ghost" onClick={() => {
                if (!confirm(`Reset ${mode} data to the example? Your current ${mode} data will be lost.`)) return;
                if (mode === 'investor') { clearInvestor(); setInvState(DEFAULT_INVESTOR); } else { clear(); setState(DEFAULT_STATE); }
              }} aria-label={`Reset ${mode} data`} title={`Reset ${mode} data`}><RotateCcw size={14} /><span className="hidden lg:inline">Reset</span></Button>
            </div>
          </header>

          {notice && <div role="status" aria-live="polite" className="no-print fixed bottom-5 right-5 z-40 max-w-sm animate-fade-up rounded-xl border border-accent/25 bg-ink-800 px-4 py-3 text-xs text-zinc-100 shadow-2xl">{notice}</div>}

          <main id="main-content" className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8">
            <div className="no-print mb-6 flex items-start gap-3 sm:mb-8">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.035] text-accent">
                <ActiveIcon size={17} aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-xl font-semibold tracking-[-0.035em] text-white sm:text-2xl">{activeTab.label}</h1>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500 sm:text-[13px]">{activeTab.description}</p>
              </div>
            </div>

            <div key={`${mode}-${tab}`} className="animate-fade-up">
              {tab === 'cap' && <CapTableTab {...shared} />}
              {tab === 'conv' && <ConversionsTab {...shared} />}
              {tab === 'round' && <RoundTab {...shared} onApply={closeRound} />}
              {tab === 'exit' && <WaterfallTab {...shared} outstanding={outstanding} rows={rows} curve={curve} maxExit={maxExit} totalPref={totalPref} />}
              {tab === 'options' && <OptionsTab {...shared} />}
              {tab === 'report' && <ReportTab {...shared} />}
              {tab === 'portfolio' && <PortfolioTab inv={inv} setInv={setInv} summary={summary} />}
              {tab === 'prorata' && <ProRataTab inv={inv} setInv={setInv} plan={plan} />}
              {tab === 'terms' && <TermSheetsTab inv={inv} setInv={setInv} />}
              {tab === 'exits' && <ExitReturnsTab inv={inv} setInv={setInv} summary={summary} />}
              {tab === 'ireport' && <InvestorReportTab inv={inv} summary={summary} plan={plan} />}
            </div>
          </main>
          <footer className="no-print px-5 pb-8 text-center text-[10px] leading-relaxed text-zinc-600">Private, client-only modelling · Not legal, tax, or financial advice.</footer>
        </div>
      </div>
    </div>
  );
}
