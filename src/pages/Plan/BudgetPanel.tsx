import { useEffect, useState, type FormEvent } from 'react';
import { PieChart, Trash2, Plus } from 'lucide-react';

type Currency = 'NGN' | 'USD';
type Category = 'Food' | 'Transport' | 'Bills' | 'Shopping' | 'Other';
type Expense = { id: string; month: string; currency: Currency; category: Category; note: string; amount: number };
type Data = { budgets: Record<Currency, number>; expenses: Expense[] };
const STORAGE = 'ravoxa.manualBudget.v1';
const monthNow = () => new Date().toISOString().slice(0, 7);

function load(): Data {
  const fallback: Data = { budgets: { NGN: 0, USD: 0 }, expenses: [] };
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE) ?? 'null');
    if (!value || typeof value !== 'object') return fallback;
    const obj = value as Partial<Data>;
    const budgets = obj.budgets;
    const expenses = obj.expenses;
    return {
      budgets: {
        NGN: typeof budgets?.NGN === 'number' && Number.isFinite(budgets.NGN) && budgets.NGN >= 0 ? budgets.NGN : 0,
        USD: typeof budgets?.USD === 'number' && Number.isFinite(budgets.USD) && budgets.USD >= 0 ? budgets.USD : 0,
      },
      expenses: Array.isArray(expenses) ? expenses.filter((e): e is Expense => !!e &&
        typeof e.id === 'string' && typeof e.month === 'string' &&
        (e.currency === 'NGN' || e.currency === 'USD') &&
        Number.isFinite(e.amount) && e.amount > 0 && typeof e.note === 'string' &&
        ['Food','Transport','Bills','Shopping','Other'].includes(e.category)) : [],
    };
  } catch { return fallback; }
}

function money(amount: number, currency: Currency) {
  return (currency === 'NGN' ? '₦' : '$') + amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export default function BudgetPanel() {
  const [data, setData] = useState<Data>(load);
  const [currency, setCurrency] = useState<Currency>('NGN');
  const [budgetText, setBudgetText] = useState('');
  const [spent, setSpent] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [message, setMessage] = useState('');
  const month = monthNow();
  const entries = data.expenses.filter((item) => item.month === month && item.currency === currency);
  const spentTotal = entries.reduce((sum, item) => sum + item.amount, 0);
  const budget = data.budgets[currency];
  const remaining = budget > 0 ? Math.max(0, budget - spentTotal) : 0;
  const percent = budget > 0 ? Math.min(100, Math.round(100 * spentTotal / budget)) : 0;
  const biggest = (['Food','Transport','Bills','Shopping','Other'] as Category[]).map((c) => ({
    category: c,
    amount: entries.filter((e) => e.category === c).reduce((sum,e)=>sum+e.amount,0),
  })).sort((a,b)=>b.amount-a.amount)[0];

  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify(data)); }
    catch { /* Private browsing may disable storage. */ }
  }, [data]);

  function saveBudget(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = Number(budgetText);
    if (!Number.isFinite(value) || value <= 0 || value > 1_000_000_000_000) {
      setMessage('Enter a positive monthly budget.');
      return;
    }
    setData((prev) => ({ ...prev, budgets: { ...prev.budgets, [currency]: value } }));
    setBudgetText('');
    setMessage('Monthly planning budget saved on this device.');
  }

  function recordExpense(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = Number(spent);
    if (!Number.isFinite(value) || value <= 0 || value > 1_000_000_000_000) {
      setMessage('Enter a valid positive expense.');
      return;
    }
    setData((prev)=>({...prev, expenses:[{id:crypto.randomUUID(),month,currency,category,note:note.trim().slice(0,80),amount:value},...prev.expenses]}));
    setSpent('');
    setNote('');
    setMessage('Manual expense recorded.');
  }

  return <section className="rv-card">
    <h2><PieChart size={19}/> Monthly budget and insight</h2>
    <p className="rv-muted">Manual planning only. This is not connected to blockchain transaction activity or a bank account.</p>
    <div className="rv-form">
      <label htmlFor="budget-currency">Currency</label>
      <select id="budget-currency" value={currency} onChange={(e)=>setCurrency(e.target.value as Currency)}>
        <option value="NGN">Nigerian naira (₦)</option><option value="USD">US dollars ($)</option>
      </select>
      <div className="rv-list-row"><div><strong>Budget for {month}</strong><span>{budget ? money(budget,currency) : 'Not set'}</span></div></div>
      <div className="rv-list-row"><div><strong>Spent (manual entries)</strong><span>{money(spentTotal,currency)}</span></div></div>
      <div className="rv-list-row"><div><strong>Remaining in plan</strong><span>{budget ? money(remaining,currency) : 'Set a budget to calculate'}</span></div></div>
      <div className="rv-progress" role="progressbar" aria-label="Monthly budget used" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div style={{width:percent+'%'}}/></div>
      <p className="rv-muted">Budget used: {budget ? percent+'%' : 'Not set'}{biggest?.amount ? ' · Largest category: '+biggest.category+' ('+money(biggest.amount,currency)+')' : ''}</p>
    </div>
    <form className="rv-form" onSubmit={saveBudget}>
      <label htmlFor="monthly-budget">Set monthly budget</label>
      <input id="monthly-budget" type="number" inputMode="decimal" min="0.01" step="0.01" value={budgetText} onChange={(e)=>setBudgetText(e.target.value)} placeholder="Monthly limit"/>
      <button type="submit" className="rv-primary">Save budget</button>
    </form>
    <form className="rv-form" onSubmit={recordExpense} style={{marginTop:24}}>
      <label htmlFor="expense-amount">Record a manual expense</label>
      <input id="expense-amount" type="number" inputMode="decimal" min="0.01" step="0.01" value={spent} onChange={(e)=>setSpent(e.target.value)} placeholder="Amount spent"/>
      <label htmlFor="expense-category">Category</label>
      <select id="expense-category" value={category} onChange={(e)=>setCategory(e.target.value as Category)}>
        {(['Food','Transport','Bills','Shopping','Other'] as Category[]).map((c)=><option key={c} value={c}>{c}</option>)}
      </select>
      <label htmlFor="expense-note">Note (optional)</label>
      <input id="expense-note" maxLength={80} value={note} onChange={(e)=>setNote(e.target.value)} placeholder="What was this for?"/>
      <button type="submit" className="rv-primary"><Plus size={17}/> Add expense</button>
    </form>
    {message && <p role="status" className="rv-muted">{message}</p>}
    <h3 style={{marginTop:22}}>This month's entries</h3>
    {entries.length === 0 ? <p className="rv-muted">No manual expenses recorded yet.</p> : entries.map((e)=>
      <div className="rv-list-row" key={e.id}>
        <div><strong>{money(e.amount,e.currency)} · {e.category}</strong><span>{e.note || 'No note'}</span></div>
        <button type="button" className="rv-icon-button" aria-label={'Delete expense '+e.id}
          onClick={()=>setData((prev)=>({...prev,expenses:prev.expenses.filter((x)=>x.id!==e.id)}))}>
          <Trash2 size={16}/>
        </button>
      </div>)}
  </section>;
}
