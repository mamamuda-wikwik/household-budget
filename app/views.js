// HTML for every page of HomeLedger, built from the state in data.js.
// Every value that comes from a transaction note or a form is escaped before
// it goes into the page. Views return strings; main.js wires the controls.

import {
  CATEGORIES,
  HOUSEHOLD,
  MONTH_LABEL,
  TREND,
  categoryById,
  formatRp,
  formatShort,
  prettyDate,
  spentByCategory,
  totalBudget,
  totalIncome,
  totalSpending,
} from './data.js';
import { barRow, donutChart, trendChart } from './charts.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function monthProgress() {
  // The example month is shown as of 26 November 2026.
  return { day: 26, days: 30 };
}

function savingsRate(state) {
  const income = totalIncome(state);
  if (income <= 0) return 0;
  return ((income - totalSpending(state)) / income) * 100;
}

function categoryRows(state) {
  const spent = spentByCategory(state);
  return CATEGORIES.map((c) => ({
    ...c,
    budget: state.budgets[c.id] || 0,
    spent: spent[c.id],
  }));
}

function healthLine(state) {
  const rate = savingsRate(state);
  const spent = totalSpending(state);
  const budget = totalBudget(state);
  if (rate >= 20) return { tone: 'good', text: `Excellent — you are saving ${rate.toFixed(0)}% of income, above the 20% target.` };
  if (rate >= 10) return { tone: 'good', text: `Healthy — you are saving ${rate.toFixed(0)}% of income. Keep the cushion growing.` };
  if (spent <= budget) return { tone: 'warn', text: `Within budget, but savings are only ${rate.toFixed(0)}% of income. Look for one leak to plug.` };
  return { tone: 'bad', text: `Over budget by ${formatRp(spent - budget)} — spending is outrunning the plan this month.` };
}

// --- Dashboard -------------------------------------------------------------

export function dashboardView(state) {
  const income = totalIncome(state);
  const spent = totalSpending(state);
  const saved = income - spent;
  const rate = savingsRate(state);
  const health = healthLine(state);
  const spentByCat = spentByCategory(state);
  const donut = donutChart(CATEGORIES.map((c) => ({ label: c.name, value: spentByCat[c.id], color: c.color })));
  const legend = CATEGORIES.map(
    (c) => `<li><span class="dot" style="background:${c.color}"></span>${c.name}<strong>${formatShort(spentByCat[c.id])}</strong></li>`,
  ).join('');
  const recent = [...state.transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7)
    .map(
      (t) => `<li class="tx-row"><span class="tx-date">${prettyDate(t.date)}</span><span class="tx-note">${esc(t.note)}</span><span class="tx-cat">${t.type === 'income' ? 'Income' : esc(categoryById(t.category).name)}</span><strong class="${t.type}">${t.type === 'income' ? '+' : '−'} ${formatRp(t.amount)}</strong></li>`,
    )
    .join('');
  const upcoming = state.bills
    .filter((b) => !b.paid)
    .sort((a, b) => a.dueDay - b.dueDay)
    .map(
      (b) => `<li class="bill-row"><span><strong>${esc(b.name)}</strong><small>Due ${b.dueDay} Nov 2026</small></span><strong>${formatRp(b.amount)}</strong></li>`,
    )
    .join('');
  const over = categoryRows(state).filter((c) => c.spent > c.budget);
  const overLine =
    over.length === 0
      ? '<p class="ok-line">Every category is inside its budget this month.</p>'
      : `<p class="warn-line">${over.map((c) => `${c.name} is ${formatRp(c.spent - c.budget)} over`).join(' · ')}.</p>`;
  const prog = monthProgress();
  return `<section class="hero">
  <div><p class="eyebrow">${esc(HOUSEHOLD)} · ${esc(MONTH_LABEL)}</p>
  <h1>November, at a glance</h1>
  <p class="lede">Income, spending and savings for the whole household — one page, always up to date. Day ${prog.day} of ${prog.days} in the month.</p></div>
  <div class="hero-note"><strong>${rate.toFixed(1)}%</strong><span>savings rate</span></div>
</section>
<section class="cards">
  <article class="card stat"><span>Income</span><strong class="income">+ ${formatRp(income)}</strong><small>Salary + side income</small></article>
  <article class="card stat"><span>Spending</span><strong class="expense">− ${formatRp(spent)}</strong><small>Across ${state.transactions.filter((t) => t.type === 'expense').length} expenses</small></article>
  <article class="card stat"><span>Saved this month</span><strong class="saved">${formatRp(saved)}</strong><small>${rate.toFixed(1)}% of income</small></article>
  <article class="card stat"><span>Budget left</span><strong>${formatRp(Math.max(0, totalBudget(state) - spent))}</strong><small>of ${formatRp(totalBudget(state))} planned</small></article>
</section>
<section class="panel health ${health.tone}"><strong>Budget health</strong><p>${health.text}</p>${overLine}</section>
<section class="grid-2">
  <article class="card"><h2>Where the money went</h2><div class="donut-wrap">${donut}<ul class="legend">${legend}</ul></div></article>
  <article class="card"><h2>Recent transactions</h2><ul class="tx-list">${recent}</ul><p class="more"><a href="#/transactions">See all transactions →</a></p></article>
</section>
<section class="grid-2">
  <article class="card"><h2>Upcoming bills</h2>${upcoming ? `<ul class="bill-list">${upcoming}</ul>` : '<p class="ok-line">All bills for this month are paid.</p>'}<p class="more"><a href="#/bills">Manage all bills →</a></p></article>
  <article class="card"><h2>Goals on track</h2><ul class="goal-mini">${state.goals
    .map((g) => {
      const pct = Math.min(100, (g.saved / g.target) * 100);
      return `<li><span>${esc(g.name)}</span><div class="bar-track slim"><div class="bar-fill" style="width:${pct.toFixed(1)}%"></div></div><strong>${pct.toFixed(0)}%</strong></li>`;
    })
    .join('')}</ul><p class="more"><a href="#/goals">Open savings goals →</a></p></article>
</section>`;
}

// --- Transactions ----------------------------------------------------------

export function transactionsView(state, filters) {
  const { type, category, query } = filters;
  let list = [...state.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (type !== 'all') list = list.filter((t) => t.type === type);
  if (category !== 'all') list = list.filter((t) => t.category === category);
  if (query) {
    const q = query.toLowerCase();
    list = list.filter((t) => t.note.toLowerCase().includes(q) || categoryById(t.category).name.toLowerCase().includes(q));
  }
  const rows = list
    .map(
      (t) => `<li class="tx-row">
  <span class="tx-date">${prettyDate(t.date)}</span>
  <span class="tx-note">${esc(t.note)}</span>
  <span class="tx-cat">${t.type === 'income' ? 'Income' : esc(categoryById(t.category).name)}</span>
  <strong class="${t.type}">${t.type === 'income' ? '+' : '−'} ${formatRp(t.amount)}</strong>
  <span class="tx-actions"><button type="button" data-edit="${t.id}">Edit</button><button type="button" data-delete="${t.id}">Delete</button></span>
</li>`,
    )
    .join('');
  const catOptions = ['<option value="all">All categories</option>']
    .concat(CATEGORIES.map((c) => `<option value="${c.id}"${category === c.id ? ' selected' : ''}>${c.name}</option>`))
    .join('');
  const incomeSum = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseSum = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return `<h1>Transactions</h1>
<p class="lede">Every rupiah in and out for ${esc(MONTH_LABEL)}. Add, edit or delete — changes save on this device and stay offline.</p>
<section class="card form-card"><h2 id="form-title">Add a transaction</h2>
<form id="tx-form">
  <input type="hidden" id="tx-id" value="">
  <label>Type <select id="tx-type"><option value="expense">Expense</option><option value="income">Income</option></select></label>
  <label>Date <input type="date" id="tx-date" value="2026-11-26" min="2026-11-01" max="2026-11-30" required></label>
  <label>Category <select id="tx-category">${CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}<option value="income">Income</option></select></label>
  <label>What for <input type="text" id="tx-note" placeholder="e.g. Weekly market shop" maxlength="80" required></label>
  <label>Amount (Rp) <input type="number" id="tx-amount" min="1" step="1" placeholder="150000" required></label>
  <span class="form-actions"><button type="submit" class="btn">Save transaction</button><button type="button" class="btn ghost" id="tx-cancel" hidden>Cancel edit</button></span>
  <p class="form-msg" id="tx-msg" role="status"></p>
</form></section>
<section class="card"><h2>Filter</h2>
<form id="tx-filter" class="filters">
  <label>Type <select id="f-type"><option value="all"${type === 'all' ? ' selected' : ''}>All</option><option value="income"${type === 'income' ? ' selected' : ''}>Income</option><option value="expense"${type === 'expense' ? ' selected' : ''}>Expenses</option></select></label>
  <label>Category <select id="f-category">${catOptions}</select></label>
  <label>Search <input type="search" id="f-query" value="${esc(query)}" placeholder="Search notes…"></label>
</form>
<p class="totals">Showing <strong>${list.length}</strong> transactions · Income <strong class="income">+ ${formatRp(incomeSum)}</strong> · Spending <strong class="expense">− ${formatRp(expenseSum)}</strong></p>
${rows ? `<ul class="tx-list full">${rows}</ul>` : '<p class="empty">No transactions match these filters. Try clearing the search.</p>'}
</section>`;
}

// --- Budgets ---------------------------------------------------------------

export function budgetsView(state) {
  const rows = categoryRows(state);
  const total = totalBudget(state);
  const spent = totalSpending(state);
  const cards = rows
    .map((c) => {
      const pct = c.budget > 0 ? (c.spent / c.budget) * 100 : 0;
      const left = c.budget - c.spent;
      const tone = pct > 100 ? 'over' : pct > 85 ? 'warn' : 'ok';
      return `<article class="card budget-card ${tone}">
  <header><span class="dot" style="background:${c.color}"></span><h3>${c.name}</h3><strong>${pct.toFixed(0)}%</strong></header>
  <p class="budget-figures"><strong>${formatRp(c.spent)}</strong> of ${formatRp(c.budget)}</p>
  <div class="bar-track"><div class="bar-fill ${tone}" style="width:${Math.min(100, pct).toFixed(1)}%"></div></div>
  <p class="budget-status">${left >= 0 ? `${formatRp(left)} left` : `${formatRp(-left)} over budget`}</p>
  <form class="budget-edit" data-budget="${c.id}"><label>Monthly budget (Rp) <input type="number" min="0" step="1000" value="${c.budget}" required></label><button type="submit" class="btn small">Update budget</button></form>
</article>`;
    })
    .join('');
  return `<h1>Budgets</h1>
<p class="lede">A plan for every category in ${esc(MONTH_LABEL)}. Total plan ${formatRp(total)} — ${formatRp(spent)} spent so far, ${formatRp(Math.max(0, total - spent))} still in the plan.</p>
<section class="budget-grid">${cards}</section>
<p class="hint">Tip: a category over 100% turns red. Edit any monthly budget above and the bar updates at once — the new plan is saved on this device.</p>`;
}

// --- Goals -----------------------------------------------------------------

export function goalsView(state) {
  const cards = state.goals
    .map((g) => {
      const pct = Math.min(100, (g.saved / g.target) * 100);
      const left = Math.max(0, g.target - g.saved);
      return `<article class="card goal-card">
  <h3>${esc(g.name)}</h3>
  <p class="goal-note">${esc(g.note)}</p>
  <p class="goal-figures"><strong>${formatRp(g.saved)}</strong> of ${formatRp(g.target)} <span>(${pct.toFixed(1)}%)</span></p>
  <div class="bar-track"><div class="bar-fill" style="width:${pct.toFixed(1)}%"></div></div>
  <p class="goal-left">${left > 0 ? `${formatRp(left)} to go` : 'Goal reached — well done!'}</p>
  <form class="goal-add" data-goal="${g.id}"><label>Add savings (Rp) <input type="number" min="0" step="1000" placeholder="100000" required></label><button type="submit" class="btn small">Add to goal</button></form>
</article>`;
    })
    .join('');
  const totalSaved = state.goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);
  return `<h1>Savings goals</h1>
<p class="lede">What the family is saving for — ${formatRp(totalSaved)} saved toward ${formatRp(totalTarget)} in total. Add money to a goal whenever there is a surplus.</p>
<section class="goal-grid">${cards}</section>`;
}

// --- Bills -----------------------------------------------------------------

export function billsView(state) {
  const sorted = [...state.bills].sort((a, b) => a.dueDay - b.dueDay);
  const paidTotal = sorted.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0);
  const dueTotal = sorted.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0);
  const rows = sorted
    .map(
      (b) => `<li class="bill-row ${b.paid ? 'paid' : 'due'}">
  <span class="bill-check">${b.paid ? '✓' : '○'}</span>
  <span class="bill-name"><strong>${esc(b.name)}</strong><small>Due ${b.dueDay} Nov 2026</small></span>
  <strong>${formatRp(b.amount)}</strong>
  <button type="button" class="btn small" data-bill="${b.id}">${b.paid ? 'Mark unpaid' : 'Mark paid'}</button>
</li>`,
    )
    .join('');
  return `<h1>Monthly bills</h1>
<p class="lede">The recurring bills of the household. Tap “Mark paid” when a bill is settled — the tick is saved on this device.</p>
<p class="totals">Paid <strong class="income">${formatRp(paidTotal)}</strong> · Still due <strong class="expense">${formatRp(dueTotal)}</strong> · ${sorted.filter((b) => b.paid).length} of ${sorted.length} bills paid</p>
<section class="card"><ul class="bill-list full">${rows}</ul></section>`;
}

// --- Reports ---------------------------------------------------------------

export function reportsView(state) {
  const spent = spentByCategory(state);
  const maxCat = Math.max(...CATEGORIES.map((c) => spent[c.id]));
  const income = totalIncome(state);
  const spending = totalSpending(state);
  const catBars = CATEGORIES.map((c) =>
    barRow(
      c.name,
      spent[c.id],
      maxCat,
      c.color,
      `${formatRp(spent[c.id])} · ${((spent[c.id] / spending) * 100).toFixed(1)}% of spending · ${formatRp(state.budgets[c.id] - spent[c.id])} ${state.budgets[c.id] - spent[c.id] >= 0 ? 'under budget' : 'over budget'}`,
    ),
  ).join('');
  const topCat = CATEGORIES.reduce((a, c) => (spent[c.id] > spent[a.id] ? c : a), CATEGORIES[0]);
  const overCats = categoryRows(state).filter((c) => c.spent > c.budget);
  const bestSaver = categoryRows(state).reduce((a, c) => (c.budget - c.spent > a.budget - a.spent ? c : a), categoryRows(state)[0]);
  const avgSpending = TREND.reduce((s, r) => s + r.spending, 0) / TREND.length;
  return `<h1>Reports</h1>
<p class="lede">Six months of income and spending, and where November's money went.</p>
<section class="grid-2">
  <article class="card"><h2>Income vs spending — Jun to Nov 2026</h2>${trendChart(TREND)}<p class="legend-inline"><span class="dot" style="background:#0f766e"></span>Income <span class="dot" style="background:#c65b4e"></span>Spending</p></article>
  <article class="card"><h2>Top spending insights</h2><ul class="insights">
    <li><strong>${topCat.name}</strong> is the biggest category at ${formatRp(spent[topCat.id])} — ${((spent[topCat.id] / spending) * 100).toFixed(0)}% of all spending.</li>
    <li>${overCats.length ? `${overCats.map((c) => c.name).join(' and ')} ${overCats.length > 1 ? 'are' : 'is'} over budget — ${overCats.map((c) => `${formatRp(c.spent - c.budget)} over`).join(', ')}.` : 'No category is over budget this month.'}</li>
    <li><strong>${bestSaver.name}</strong> saved the most against its plan: ${formatRp(bestSaver.budget - bestSaver.spent)} under budget.</li>
    <li>Average monthly spending over six months is ${formatRp(avgSpending)}; November is ${spending > avgSpending ? `${formatRp(spending - avgSpending)} above` : `${formatRp(avgSpending - spending)} below`} that average.</li>
    <li>The household saved ${formatRp(income - spending)} in November — a ${savingsRate(state).toFixed(1)}% savings rate.</li>
  </ul></article>
</section>
<section class="card"><h2>Spending by category — November 2026</h2><div class="bars">${catBars}</div></section>`;
}

// --- About -----------------------------------------------------------------

export function aboutView(state) {
  return `<h1>About HomeLedger</h1>
<p class="lede">A household budget site that runs entirely in your browser — no account, no server, no network.</p>
<section class="card about">
  <h2>How it works</h2>
  <ol>
    <li><strong>Dashboard</strong> shows the month at a glance: income, spending, savings and the bills still due.</li>
    <li><strong>Transactions</strong> lists every rupiah in and out. Add your own, edit or delete — everything is stored on this device with localStorage.</li>
    <li><strong>Budgets</strong> sets a monthly plan per category and shows how much of it is used.</li>
    <li><strong>Goals</strong> tracks what the family is saving for, and lets you add money to a goal.</li>
    <li><strong>Bills</strong> keeps the recurring monthly bills and their paid state.</li>
    <li><strong>Reports</strong> compares six months of income and spending and ranks the categories.</li>
  </ol>
  <h2>About the figures</h2>
  <p>The numbers are a realistic example household, <strong>${esc(HOUSEHOLD)}</strong>, for ${esc(MONTH_LABEL)}: a salary of Rp 9,500,000 plus side income, eight spending categories, ten recurring bills and four savings goals. Use “Reset example data” below to restore these figures after you have tried the controls — your own edits are kept on this device only and never leave it.</p>
  <p><button type="button" class="btn" id="reset-data">Reset example data</button> <span class="form-msg" id="reset-msg" role="status"></span></p>
  <h2>Privacy</h2>
  <p>HomeLedger sends nothing anywhere. There are no accounts, no trackers and no network requests — open the page, and everything you see comes from files on this device.</p>
</section>`;
}

export function notFoundView() {
  return `<h1>Page not found</h1><p class="lede">There is no page at this address. <a href="#/">Back to the dashboard</a>.</p>`;
}
