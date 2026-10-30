# PrefStack

**See exactly who gets paid what at exit.** A fast, private founder equity toolkit covering cap table, SAFEs and notes, round modeling, exit waterfall, option value, and investor reports. Runs 100% in the browser.

## Problem
Headline valuations lie. A $40M acquisition of a company that raised $18M with a 1.5x participating Series A can leave founders with far less than their ownership % suggests. Founders usually find out during M&A, when it's too late to negotiate. Today the answer lives in:
- **Carta / Pulley exit modeling**: locked behind paid plans and a full cap-table migration.
- **Spreadsheets**: brittle; few people model non-participating conversion or participation caps correctly.
- **Free SAFE calculators (YC, Binderwork, Equidam)**: plenty of them, but they stop at conversion and don't model the exit waterfall.

## Audience
Venture-backed founders weighing term sheets or acquisition of## Features (one shared, persisted cap table across six tabs)
1. **Cap table**: share classes, common or preferred, unissued option pool flag, outstanding and fully diluted %, ownership bar
2. **SAFEs & notes**: post-money and pre-money SAFEs, convertible notes with simple interest, caps, discounts, and MFN (inherits the best cap and discount). Shows cap price vs discount price and which one wins
3. **Round modeling**: pre-money, new money, and target post-money pool (pool shuffle). Solves price per share, conversions, and top-up together. Before/after table and a one-click "close round" that writes the new classes into the cap table
4. **Exit waterfall**: preference multiples, seniority tiers, participation caps, automatic convert-vs-preference decisions, and a payout curve
5. **Options**: what a grant is worth after preferences (real vs naive $/share), exercise cost, tax, net, and break-even exit
6. **Report**: investor-ready print/PDF report. JSON import/export, localStorage persistence

## Investor mode (Founder / Investor toggle in the header)
The toggle is remembered, and investor data is saved separately (`prefstack:investor:v1`). Export JSON writes one bundle holding founder data, investor data, and the current mode. Import accepts that bundle or older founder-only or investor-only files.

Why these tools: angels mostly track their books in spreadsheets that break on SAFE conversions, follow-ons, partial exits, and hand-built XIRR. Paid trackers (Signed $29–149/mo, AngelHub $29–79/mo, Seraf ~$60/mo) sell MOIC/IRR/TVPI/DPI and pro-rata tracking, and fund tools like Tactyc sell probability-weighted reserves. PrefStack covers those core numbers client-side, plus a term-sheet comparison run through a real preference waterfall.

1. **Portfolio**: positions with dated checks, distributions, and marks. Per-position MOIC and XIRR. Portfolio TVPI / DPI / RVPI and pooled net IRR
2. **Pro-rata & reserves**: next-round pro-rata check (ownership × new money), ownership if you skip vs take it, and probability-weighted reserve need vs budget
3. **Term sheets**: side-by-side term sheets (price, pool shuffle, pref multiple, participation and cap, prior preferred senior or pari passu). Your payout, MOIC, and IRR at each exit, via the waterfall engine
4. **Exit returns**: portfolio what-if exits with an optional 1x preference floor, plus the exit each company needs to return the whole portfolio
5. **Report**: print/PDF portfolio report for partners or LPs

## Verification
- `npm test` runs 20 unit sanity checks, including XIRR against Microsoft's documented example (37.34%), MOIC/DPI/RVPI, TVPI on paid-in, pro-rata, weighted reserves, term-sheet pricing and payout, and exit proceeds. The founder checks (Node test runner). They cover the waterfall summing to the exit, conversion, seniority, a Binderwork reference cap table reproduced to the share, post-money SAFE additivity, pre-money SAFEs, discounts, note interest, the pool top-up target, MFN, applyRound conservation, and option break-even
- `npm run build` passes, and a headless Chrome smoke test of every tab in both modes found no console errors, and the remembered mode survives a reload

## Stack
Vite + React 18, Tailwind CSS 3, lucide-react. Pure-JS engines in `src/utils/` (`waterfall.js`, `conversion.js`, `options.js`, `investor.js`).

## Setup
```bash
npm install
npm run dev     # local dev server
npm test        # engine unit tests
npm run build   # production build in dist/
```

## Structure
```
src/
  components/  investor/ (PortfolioTab, ProRataTab, TermSheetsTab, ExitReturnsTab, InvestorReportTab),
               CapTableTab, ConversionsTab, RoundTab, WaterfallTab, OptionsTab, ReportTab, HolderEditor, ResultsTable, PayoutChart, ui
  utils/       waterfall.js, conversion.js, options.js, storage.js, defaults.js, format.js
  styles/      index.css (Tailwind + print styles)
  App.jsx, main.jsx
tests/         engine.test.js, investor.test.js
```

lts.js
  styles/      index.css (Tailwind)
  App.jsx, main.jsx
```

## Monetization
- Free core tool (SEO: "liquidation preference calculator", "exit waterfall")
- **Pro, $19/mo or $99 one-time**: side-by-side term-sheet comparison, PDF reports for boards, option-holder views with strike prices
- **Advisor licence, $499/yr**: white-labelled for law firms, VC platform teams, and M&A advisors

*Not legal or financial advice. Check with counsel before relying on it.*
