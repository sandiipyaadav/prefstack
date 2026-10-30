# PrefStack

**See exactly who gets paid what at exit.** A fast, private liquidation-preference waterfall simulator for founders, early employees, and angels.

## Problem
Headline valuations lie. A $40M acquisition of a company that raised $18M with a 1.5x participating Series A can leave founders with far less than their ownership % suggests. Founders usually find out during M&A, when it's too late to negotiate. Today the answer lives in:
- **Carta / Pulley exit modeling**: locked behind paid plans and a full cap-table migration.
- **Spreadsheets**: brittle; few people model non-participating conversion or participation caps correctly.
- **Free SAFE calculators (YC, Binderwork, Equidam)**: plenty of them, but they stop at conversion and don't model the exit waterfall.

## Audience
Venture-backed founders weighing term sheets or acquisition offers, startup CFOs, angels, and senior hires judging their equity.

## Features
- Multiple share classes: common and preferred
- Preference multiples, seniority tiers (pari passu within a tier), participating with or without a cap
- Automatic convert-vs-take-preference decision for each class (iterated best response)
- Exit slider plus a payout-vs-exit curve for every class
- Flags classes that get less (red) or more (green) than their ownership %
- CSV export, localStorage persistence, no backend, no account

## Stack
Vite + React 18, Tailwind CSS 3, lucide-react. Pure-JS engine in `src/utils/waterfall.js`.

## Setup
```bash
npm install
npm run dev     # local dev server
npm run build   # production build in dist/
```

## Structure
```
src/
  components/  HolderEditor, ResultsTable, PayoutChart
  utils/       waterfall.js (engine), storage.js, format.js, defaults.js
  styles/      index.css (Tailwind)
  App.jsx, main.jsx
```

## Monetization
- Free core tool (SEO: "liquidation preference calculator", "exit waterfall")
- **Pro, $19/mo or $99 one-time**: side-by-side term-sheet comparison, PDF reports for boards, option-holder views with strike prices
- **Advisor licence, $499/yr**: white-labelled for law firms, VC platform teams, and M&A advisors

*Not legal or financial advice. Check with counsel before relying on it.*
