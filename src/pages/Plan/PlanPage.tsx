import { useEffect, useState, type FormEvent } from 'react';
import { Target, Trash2, Plus } from 'lucide-react';
import BudgetPanel from './BudgetPanel';

type Goal = { id: string; name: string; target: number; currency: 'NGN' | 'USD' };
const STORAGE_KEY = 'ravoxa.localGoals.v1';

function loadGoals(): Goal[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((g): g is Goal =>
      !!g && typeof g === 'object' && typeof g.id === 'string' &&
      typeof g.name === 'string' && Number.isFinite(g.target) &&
      g.target > 0 && (g.currency === 'NGN' || g.currency === 'USD')
    );
  } catch {
    return [];
  }
}

export default function PlanPage() {
  const [goals, setGoals] = useState<Goal[]>(loadGoals);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [message, setMessage] = useState('');

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(goals)); }
    catch { /* Browser storage may be disabled in MiniPay. */ }
  }, [goals]);

  function addGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(target);
    if (!name.trim() || !Number.isFinite(value) || value <= 0 || value > 1_000_000_000_000) {
      setMessage('Enter a goal name and a valid positive target amount.');
      return;
    }
    setGoals((existing) => [...existing, {
      id: crypto.randomUUID(), name: name.trim().slice(0, 80), target: value, currency,
    }]);
    setName('');
    setTarget('');
    setMessage('Goal saved on this device.');
  }

  return (
    <div className="rv-page">
      <div className="rv-eyebrow">RAVOXA PLAN</div>
      <h1>Your money goals</h1>
      <p className="rv-muted">Organize future savings. Goals are planning records only—not money held or locked by RAVOXA.</p>
      <section className="rv-card">
        <h2><Target size={19} /> Create a goal</h2>
        <form onSubmit={addGoal} className="rv-form">
          <label htmlFor="goal-name">What are you saving for?</label>
          <input id="goal-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New laptop" />
          <label htmlFor="goal-target">Target amount</label>
          <input id="goal-target" type="number" inputMode="decimal" min="0.01" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0.00" />
          <label htmlFor="goal-currency">Currency</label>
          <select id="goal-currency" value={currency} onChange={(e) => setCurrency(e.target.value as 'NGN' | 'USD')}>
            <option value="NGN">Nigerian naira (₦)</option>
            <option value="USD">US dollars ($)</option>
          </select>
          <button className="rv-primary" type="submit"><Plus size={17} /> Save goal</button>
          {message && <p role="status" className="rv-muted">{message}</p>}
        </form>
      </section>
      <section className="rv-card">
        <h2>Saved goals ({goals.length})</h2>
        {goals.length === 0 ? (
          <p className="rv-muted">No goals yet. Create your first goal to get started.</p>
        ) : goals.map((g) => (
          <div className="rv-list-row" key={g.id}>
            <div><strong>{g.name}</strong><span>Target: {g.currency === 'NGN' ? '₦' : '$'}{g.target.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span></div>
            <button type="button" className="rv-icon-button" aria-label={'Delete goal ' + g.name} onClick={() => setGoals((all) => all.filter((item) => item.id !== g.id))}><Trash2 size={18} /></button>
          </div>
        ))}
      </section>
      <BudgetPanel />
      <p className="rv-disclaimer">Goals are stored locally in this browser. They may disappear if MiniPay clears its browser data, and they do not automatically transfer or safeguard funds.</p>
    </div>
  );
}
