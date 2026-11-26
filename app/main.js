// Router and interactions for HomeLedger.
//
//   #/                Dashboard
//   #/transactions    Full list + add / edit / delete + filters
//   #/budgets         Monthly plan per category + edit
//   #/goals           Savings goals + add a contribution
//   #/bills           Recurring bills + mark paid
//   #/reports         Six-month trend and category comparison
//   #/about           How it works + reset example data
//
// Every change is saved to localStorage by data.js, so the site works
// offline and remembers edits. window.__shotReady tells a screenshot
// script the page has finished rendering.

import { loadState, resetState, saveState } from './data.js';
import {
  aboutView,
  billsView,
  budgetsView,
  dashboardView,
  goalsView,
  notFoundView,
  reportsView,
  transactionsView,
} from './views.js';

const app = document.getElementById('app');
const navLinks = [...document.querySelectorAll('[data-route]')];
let state = loadState();
let filters = { type: 'all', category: 'all', query: '' };
let editingId = null;

function route() {
  const hash = location.hash || '#/';
  if (hash === '#/' || hash === '#') return 'dashboard';
  const m = hash.match(/^#\/([a-z]+)/);
  return m ? m[1] : 'missing';
}

function render() {
  window.__shotReady = false;
  const page = route();
  const titles = {
    dashboard: 'HomeLedger — Household Budget',
    transactions: 'Transactions | HomeLedger',
    budgets: 'Budgets | HomeLedger',
    goals: 'Savings Goals | HomeLedger',
    bills: 'Monthly Bills | HomeLedger',
    reports: 'Reports | HomeLedger',
    about: 'About | HomeLedger',
  };
  document.title = titles[page] || 'HomeLedger — Household Budget';
  if (page === 'dashboard') app.innerHTML = dashboardView(state);
  else if (page === 'transactions') app.innerHTML = transactionsView(state, filters);
  else if (page === 'budgets') app.innerHTML = budgetsView(state);
  else if (page === 'goals') app.innerHTML = goalsView(state);
  else if (page === 'bills') app.innerHTML = billsView(state);
  else if (page === 'reports') app.innerHTML = reportsView(state);
  else if (page === 'about') app.innerHTML = aboutView(state);
  else app.innerHTML = notFoundView();
  for (const link of navLinks) {
    const r = link.getAttribute('data-route');
    link.classList.toggle('active', r === page || (r === 'dashboard' && page === 'dashboard'));
    link.setAttribute('aria-current', link.classList.contains('active') ? 'page' : 'false');
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function persist() {
  saveState(state);
}

// --- Transaction form ------------------------------------------------------

function fillForm(t) {
  document.getElementById('tx-id').value = t.id;
  document.getElementById('tx-type').value = t.type;
  document.getElementById('tx-date').value = t.date;
  document.getElementById('tx-category').value = t.category;
  document.getElementById('tx-note').value = t.note;
  document.getElementById('tx-amount').value = String(t.amount);
  document.getElementById('form-title').textContent = 'Edit transaction';
  document.getElementById('tx-cancel').hidden = false;
  document.getElementById('tx-msg').textContent = '';
  document.getElementById('tx-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearForm() {
  editingId = null;
  const form = document.getElementById('tx-form');
  if (!form) return;
  form.reset();
  document.getElementById('tx-id').value = '';
  document.getElementById('tx-date').value = '2026-11-26';
  document.getElementById('form-title').textContent = 'Add a transaction';
  document.getElementById('tx-cancel').hidden = true;
  document.getElementById('tx-msg').textContent = '';
}

function saveTransaction(event) {
  event.preventDefault();
  const note = document.getElementById('tx-note').value.trim();
  const amount = Math.round(Number(document.getElementById('tx-amount').value));
  const date = document.getElementById('tx-date').value;
  const type = document.getElementById('tx-type').value;
  const category = type === 'income' ? 'income' : document.getElementById('tx-category').value;
  const msg = document.getElementById('tx-msg');
  if (!note || !Number.isFinite(amount) || amount <= 0 || !date) {
    msg.textContent = 'Please fill in a note, a date and an amount above Rp 0.';
    return;
  }
  if (editingId) {
    const t = state.transactions.find((x) => x.id === editingId);
    if (t) Object.assign(t, { date, type, category, note, amount });
    msg.textContent = 'Transaction updated.';
  } else {
    state.transactions.push({ id: `u${Date.now()}`, date, type, category, note, amount });
    msg.textContent = 'Transaction added.';
  }
  persist();
  render();
  const after = document.getElementById('tx-msg');
  if (after) after.textContent = 'Saved — the list and totals are updated.';
}

// --- Delegated clicks ------------------------------------------------------

app.addEventListener('click', (event) => {
  const editBtn = event.target.closest('[data-edit]');
  if (editBtn) {
    const t = state.transactions.find((x) => x.id === editBtn.getAttribute('data-edit'));
    if (t) {
      editingId = t.id;
      fillForm(t);
    }
    return;
  }
  const delBtn = event.target.closest('[data-delete]');
  if (delBtn) {
    const id = delBtn.getAttribute('data-delete');
    const t = state.transactions.find((x) => x.id === id);
    if (t && window.confirm(`Delete "${t.note}"?`)) {
      state.transactions = state.transactions.filter((x) => x.id !== id);
      persist();
      render();
    }
    return;
  }
  const billBtn = event.target.closest('[data-bill]');
  if (billBtn) {
    const b = state.bills.find((x) => x.id === billBtn.getAttribute('data-bill'));
    if (b) {
      b.paid = !b.paid;
      persist();
      render();
    }
    return;
  }
  if (event.target.id === 'reset-data') {
    if (window.confirm('Restore the example figures for Keluarga Santoso? Your changes will be lost.')) {
      state = resetState();
      document.getElementById('reset-msg').textContent = 'Example data restored.';
    }
  }
  if (event.target.id === 'tx-cancel') clearForm();
});

// --- Delegated submits and inputs ------------------------------------------

app.addEventListener('submit', (event) => {
  if (event.target.id === 'tx-form') {
    saveTransaction(event);
    return;
  }
  const budgetForm = event.target.closest('[data-budget]');
  if (budgetForm) {
    event.preventDefault();
    const id = budgetForm.getAttribute('data-budget');
    const value = Math.round(Number(budgetForm.querySelector('input').value));
    if (Number.isFinite(value) && value >= 0) {
      state.budgets[id] = value;
      persist();
      render();
    }
    return;
  }
  const goalForm = event.target.closest('[data-goal]');
  if (goalForm) {
    event.preventDefault();
    const id = goalForm.getAttribute('data-goal');
    const value = Math.round(Number(goalForm.querySelector('input').value));
    const goal = state.goals.find((g) => g.id === id);
    if (goal && Number.isFinite(value) && value > 0) {
      goal.saved += value;
      persist();
      render();
    }
  }
});

app.addEventListener('input', (event) => {
  if (event.target.id === 'f-type') {
    filters.type = event.target.value;
    render();
  } else if (event.target.id === 'f-category') {
    filters.category = event.target.value;
    render();
  } else if (event.target.id === 'f-query') {
    filters.query = event.target.value;
    // Re-render the list without losing the search box focus.
    const page = route();
    if (page !== 'transactions') return;
    const pos = event.target.selectionStart;
    render();
    const box = document.getElementById('f-query');
    if (box) {
      box.focus();
      box.setSelectionRange(pos, pos);
    }
  } else if (event.target.id === 'tx-type') {
    const cat = document.getElementById('tx-category');
    cat.value = event.target.value === 'income' ? 'income' : cat.value === 'income' ? 'groceries' : cat.value;
  }
});

window.addEventListener('hashchange', () => {
  editingId = null;
  render();
});

render();
