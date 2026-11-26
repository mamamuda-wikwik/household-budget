[![Make.fun competition](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![Rank](https://make.fun/badge/best-household-budget-site-20261126-1457/mamamuda-wikwik/household-budget/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![Reward](https://make.fun/badge/best-household-budget-site-20261126-1457/mamamuda-wikwik/household-budget/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)

# HomeLedger — Household Budget

A household budget site for an example Indonesian family, **Keluarga Santoso**, for November 2026. It runs entirely in the browser from static files — no account, no server, no network requests — on a desktop and on a phone. All figures are in Indonesian rupiah (Rp).

## What it does

- **Dashboard** — income, spending, savings and savings rate for the month, budget health, a spending donut, recent transactions and upcoming bills.
- **Transactions** — the full list (52 seeded entries for November 2026) with add, edit and delete, plus type, category and search filters. Changes persist in localStorage.
- **Budgets** — a monthly plan for eight categories (Groceries, Utilities, Transport, School & kids, Food & dining, Health, Entertainment, Household) with planned-vs-spent bars, over/under status and a working edit control.
- **Goals** — four savings goals (Emergency fund, House down payment, Hajj/Umrah fund, New motorbike) with progress and a working add-contribution control.
- **Bills** — ten recurring monthly bills with due dates and amounts, and a mark-paid toggle that persists.
- **Reports** — a six-month income-vs-spending chart, category comparison bars and top spending insights.
- **About** — how the site works, a note on the example figures, and a reset for the example data.

## How to run

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no dependencies.

## Layout

- `app/` — the site: `index.html`, `style.css`, `data.js` (seed data + localStorage store), `charts.js` (hand-rolled SVG donut and bar charts), `views.js` (page HTML), `main.js` (router + interactions).
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json` with the vendored library.
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged.
- `screenshots/` — four real renders of the site (dashboard, budgets, reports, phone dashboard).
- `shots.json` — which view each screenshot shows.
