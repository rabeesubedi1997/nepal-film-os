import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DollarSign, Plus, Download, CheckCircle, Clock, XCircle, Edit3, Trash2, TrendingUp, TrendingDown, AlertTriangle, Printer } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

const statusBadgeMap = { Paid: 'green', Approved: 'blue', Pending: 'amber', Rejected: 'red' };

const canApproveExpense = (role) => ['Producer', 'Super Admin', 'Production Manager'].includes(role);

const statusConfig = {
  'Paid': { icon: CheckCircle, color: 'text-emerald-400' },
  'Approved': { icon: CheckCircle, color: 'text-blue-400' },
  'Pending': { icon: Clock, color: 'text-amber-400' },
  'Rejected': { icon: XCircle, color: 'text-red-400' },
};

export default function BudgetExpensesView() {
  const { currentFilm, userRole } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [formData, setFormData] = useState({});
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expensePage, setExpensePage] = useState(1);
  const [expensePageSize, setExpensePageSize] = useState(10);

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await expenseService.index(filmId);
      setExpenses(data.expenses || []);
      setBudgets(data.budgets || []);
    } catch (err) { console.error('Failed to load expenses:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const openCreateExpense = () => {
    setEditExpense(null);
    setFormData({ department_id: '', category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0], po_number: '', payment_method: 'Cash' });
    setShowModal(true);
  };

  const openEditExpense = (e) => {
    setEditExpense(e);
    setFormData({ department_id: e.department_id, category: e.category, amount: String(e.amount), description: e.description || '', date: e.date?.split('T')[0] || '', po_number: e.po_number || '', payment_method: e.payment_method || 'Cash' });
    setShowModal(true);
  };

  const saveExpense = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, amount: parseFloat(formData.amount) };
      if (editExpense) {
        await expenseService.updateExpense(filmId, editExpense.id, data);
      } else {
        await expenseService.storeExpense(filmId, data);
      }
      setShowModal(false);
      fetchData();
      addToast(editExpense ? 'Expense updated' : 'Expense logged');
    } catch (err) { console.error('Failed to save expense:', err); addToast('Failed to save expense', 'error'); }
  };

  const deleteExpense = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try { await expenseService.destroyExpense(filmId, id); fetchData(); addToast('Expense deleted'); } catch (err) { console.error(err); addToast('Failed to delete expense', 'error'); }
  };

  const approveExpense = async (id, status) => {
    try {
      const payload = status === 'Rejected' ? { status, rejection_reason: rejectReason } : { status };
      await expenseService.approveExpense(filmId, id, payload);
      setRejectModal(null);
      fetchData();
      addToast(`Expense ${status}`);
    } catch (err) { console.error(err); addToast('Failed to update expense', 'error'); }
  };

  const openRejectExpense = (id) => {
    setRejectModal(id);
    setRejectReason('');
  };

  const openCreateBudget = () => {
    setEditBudget(null);
    setFormData({ department_id: '', category: '', budgeted_amount: '' });
    setShowBudgetModal(true);
  };

  const openEditBudget = (b) => {
    setEditBudget(b);
    setFormData({ department_id: b.department_id, category: b.category, budgeted_amount: String(b.budgeted_amount) });
    setShowBudgetModal(true);
  };

  const saveBudget = async (e) => {
    e.preventDefault();
    try {
      await expenseService.storeBudget(filmId, { ...formData, budgeted_amount: parseFloat(formData.budgeted_amount) });
      setShowBudgetModal(false);
      fetchData();
      addToast(editBudget ? 'Budget updated' : 'Budget set');
    } catch (err) { console.error('Failed to save budget:', err); addToast('Failed to save budget', 'error'); }
  };

  const deleteBudget = async (id) => {
    if (!confirm('Delete this budget item?')) return;
    try { await expenseService.destroyBudget(filmId, id); fetchData(); addToast('Budget item deleted'); } catch (err) { console.error(err); addToast('Failed to delete budget', 'error'); }
  };

  const totalBudget = budgets.reduce((s, b) => s + (b.budgeted_amount || 0), 0);
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingTotal = expenses.filter(e => e.status === 'Pending').reduce((s, e) => s + (e.amount || 0), 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const filtered = expenses.filter(e => statusFilter === 'All' || e.status === statusFilter);

  const totalExpensePages = Math.ceil(filtered.length / expensePageSize) || 1;
  const paginatedExpenses = filtered.slice((expensePage - 1) * expensePageSize, expensePage * expensePageSize);

  const handleExpensePageChange = (page) => setExpensePage(Math.max(1, Math.min(page, totalExpensePages)));
  const handleExpensePageSizeChange = (size) => { setExpensePageSize(size); setExpensePage(1); };

  const categoryVariance = useCallback(() => {
    const cats = {};
    budgets.forEach(b => {
      cats[b.category] = { category: b.category, department: b.department_id, budgeted: b.budgeted_amount || 0, spent: 0 };
    });
    expenses.forEach(e => {
      if (cats[e.category]) {
        cats[e.category].spent += e.amount || 0;
      } else {
        cats[e.category] = { category: e.category, department: e.department_id || '—', budgeted: 0, spent: e.amount || 0 };
      }
    });
    return Object.values(cats).map(c => ({
      ...c,
      variance: c.budgeted - c.spent,
      pct: c.budgeted > 0 ? Math.round((c.spent / c.budgeted) * 100) : c.spent > 0 ? Infinity : 0,
    })).sort((a, b) => b.spent - a.spent);
  }, [budgets, expenses]);

  const handlePrintReport = () => {
    const variances = categoryVariance();
    const rows = variances.map(c => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;">${c.category}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;">${c.department}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;">NPR ${c.budgeted.toLocaleString()}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;">NPR ${c.spent.toLocaleString()}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;color:${c.variance >= 0 ? '#059669' : '#dc2626'}">${c.variance >= 0 ? '+' : ''}NPR ${c.variance.toLocaleString()}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:center;">${c.pct === Infinity ? '∞' : c.pct + '%'}</td>
      </tr>
    `).join('');
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Budget Report - ${currentFilm?.title}</title>
<style>
  body{font-family:Inter,sans-serif;font-size:12px;color:#1e293b;max-width:800px;margin:0 auto;padding:2rem;}
  h1{font-size:18px;font-weight:700;margin-bottom:4px;}
  .sub{color:#64748b;font-size:11px;margin-bottom:1.5rem;}
  table{width:100%;border-collapse:collapse;}
  th{text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0;}
  .total-row td{font-weight:700;border-top:2px solid #1e293b;padding-top:8px;}
  .over{color:#dc2626;} .under{color:#059669;}
</style></head><body>
<h1>Budget vs Actuals</h1>
<p class="sub">${currentFilm?.title || ''} · Generated ${new Date().toLocaleDateString()}</p>
<table>
<thead><tr><th>Category</th><th>Department</th><th style="text-align:right;">Budgeted</th><th style="text-align:right;">Spent</th><th style="text-align:right;">Variance</th><th style="text-align:center;">% Used</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr class="total-row">
<td colspan="2" style="padding:8px 10px;font-size:11px;">TOTAL</td>
<td style="padding:8px 10px;text-align:right;font-size:11px;">NPR ${totalBudget.toLocaleString()}</td>
<td style="padding:8px 10px;text-align:right;font-size:11px;">NPR ${totalSpent.toLocaleString()}</td>
<td style="padding:8px 10px;text-align:right;font-size:11px;color:${totalBudget - totalSpent >= 0 ? '#059669' : '#dc2626'}">${totalBudget - totalSpent >= 0 ? '+' : ''}NPR ${(totalBudget - totalSpent).toLocaleString()}</td>
<td style="padding:8px 10px;text-align:center;font-size:11px;">${budgetPct}%</td>
</tr></tfoot>
</table>
<p style="margin-top:2rem;text-align:center;font-size:10px;color:#94a3b8;">Generated by Nepal Film OS</p>
</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-400" /> Budget & Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · All amounts in NPR</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={openCreateBudget}>Set Budget</Button>
          <Button variant="primary" size="sm" onClick={openCreateExpense}><Plus className="h-3.5 w-3.5" /> Log Expense</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Total Budget</p>
          <p className="text-xl font-black text-slate-100 mt-1">NPR {(totalBudget / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Total Spent</p>
          <p className="text-xl font-black text-emerald-400 mt-1">NPR {(totalSpent / 100000).toFixed(2)}L</p>
          <p className="text-[10px] text-slate-600 mt-0.5">{budgetPct}% of budget</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Pending Approval</p>
          <p className="text-xl font-black text-amber-400 mt-1">NPR {(pendingTotal / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-slate-600 mt-0.5">{expenses.filter(e => e.status === 'Pending').length} pending</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Remaining</p>
          <p className="text-xl font-black text-blue-400 mt-1">NPR {((totalBudget - totalSpent) / 100000).toFixed(2)}L</p>
          <p className="text-[10px] text-slate-600 mt-0.5">{100 - budgetPct}% remaining</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {[['overview', 'Budget Overview'], ['variance', 'Budget vs Actuals'], ['expenses', 'Expense Log']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === v ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>{l}</button>
        ))}
        {tab === 'variance' && (
          <button onClick={handlePrintReport} className="ml-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all flex items-center gap-1">
            <Printer className="h-3.5 w-3.5" /> Print Report
          </button>
        )}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Overall Budget Utilization</p>
                <p className="text-2xl font-black text-slate-100 mt-0.5">NPR {(totalSpent / 1000).toFixed(0)}K <span className="text-sm font-semibold text-slate-500">spent</span></p>
              </div>
              <p className={`text-2xl font-black ${budgetPct > 80 ? 'text-red-400' : budgetPct > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>{budgetPct}%</p>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${budgetPct > 80 ? 'bg-red-500' : budgetPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${budgetPct}%` }} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">Department Budgets</h3>
              <button onClick={openCreateBudget} className="text-xs text-emerald-500 font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> Add Budget</button>
            </div>
            <div className="divide-y divide-slate-800">
              {budgets.length === 0 && <div className="px-5 py-8 text-center text-slate-500 text-sm">No budgets set yet.</div>}
              {budgets.map((b, i) => {
                const spent = expenses.filter(e => e.department_id === b.department_id).reduce((s, e) => s + (e.amount || 0), 0);
                const pct = b.budgeted_amount > 0 ? Math.round((spent / b.budgeted_amount) * 100) : 0;
                const barColor = pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500';
                return (
                  <div key={b.id || i} className="px-5 py-3 hover:bg-slate-800/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-300">{b.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-mono">NPR {(spent / 1000).toFixed(0)}K / {(b.budgeted_amount / 1000).toFixed(0)}K</span>
                        <span className={`text-xs font-black w-10 text-right ${pct > 80 ? 'text-red-400' : pct > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>{pct}%</span>
                        <button onClick={() => openEditBudget(b)} className="p-1 text-slate-500 hover:text-amber-400"><Edit3 className="h-3 w-3" /></button>
                        <button onClick={() => deleteBudget(b.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'variance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">Category Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase font-black">Category</th>
                  <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase font-black">Dept</th>
                  <th className="px-4 py-3 text-right text-[10px] text-slate-500 uppercase font-black">Budgeted</th>
                  <th className="px-4 py-3 text-right text-[10px] text-slate-500 uppercase font-black">Spent</th>
                  <th className="px-4 py-3 text-right text-[10px] text-slate-500 uppercase font-black">Variance</th>
                  <th className="px-4 py-3 text-center text-[10px] text-slate-500 uppercase font-black">% Used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {categoryVariance().map((c, i) => {
                  const isOver = c.variance < 0;
                  const isInf = c.pct === Infinity;
                  return (
                    <tr key={i} className={`hover:bg-slate-800/40 ${isOver ? 'bg-red-500/5' : ''}`}>
                      <td className="px-4 py-3 text-xs text-slate-200 font-medium">{c.category}</td>
                      <td className="px-4 py-3"><span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-semibold">{c.department}</span></td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-300">{c.budgeted ? `NPR ${c.budgeted.toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-200">{c.spent ? `NPR ${c.spent.toLocaleString()}` : '—'}</td>
                      <td className={`px-4 py-3 text-right font-mono text-xs font-bold ${isOver ? 'text-red-400' : 'text-emerald-400'}`}>
                        <span className="flex items-center justify-end gap-1">
                          {isOver ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {c.variance >= 0 ? '+' : ''}NPR {c.variance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isInf ? (
                          <span className="text-xs text-amber-400 flex items-center justify-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> No Budget
                          </span>
                        ) : (
                          <span className={`text-xs font-bold ${c.pct > 80 ? 'text-red-400' : c.pct > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {c.pct}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-700 bg-slate-900/80">
                  <td className="px-4 py-3 text-xs font-bold text-slate-100" colSpan={2}>TOTAL</td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-100">NPR {totalBudget.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-100">NPR {totalSpent.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-mono text-xs font-bold ${totalBudget - totalSpent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totalBudget - totalSpent >= 0 ? '+' : ''}NPR {(totalBudget - totalSpent).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-bold text-slate-100">{budgetPct}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-800">
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${budgetPct > 80 ? 'bg-red-500' : budgetPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(budgetPct, 100)}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-slate-500">Budget utilization</span>
              <span className={`text-xs font-bold ${budgetPct > 80 ? 'text-red-400' : budgetPct > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {budgetPct}% used — {totalBudget - totalSpent >= 0 ? `NPR ${(totalBudget - totalSpent).toLocaleString()} remaining` : `NPR ${Math.abs(totalBudget - totalSpent).toLocaleString()} over budget`}
              </span>
            </div>
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {['All', 'Paid', 'Approved', 'Pending', 'Rejected'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${statusFilter === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
                {s} <span className="ml-1 opacity-60">({expenses.filter(e => e.status === s).length})</span>
              </button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase font-black">Description</th>
                    <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase font-black">Dept</th>
                    <th className="px-4 py-3 text-right text-[10px] text-slate-500 uppercase font-black">Amount</th>
                    <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase font-black">Date</th>
                    <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase font-black">Status</th>
                    <th className="px-4 py-3 text-center text-[10px] text-slate-500 uppercase font-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {paginatedExpenses.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">No expenses found.</td></tr>}
                  {paginatedExpenses.map(exp => {
                    const sc = statusConfig[exp.status] || statusConfig['Pending'];
                    const isApprover = canApproveExpense(userRole);
                    const canEdit = exp.status === 'Pending';
                    return (
                      <tr key={exp.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-200 text-xs">{exp.description}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">by {exp.submitter?.name || '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-semibold">{exp.department_id}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-100 font-mono">NPR {(exp.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{exp.date ? new Date(exp.date).toLocaleDateString() : ''}</td>
                        <td className="px-4 py-3">
                          <Badge color={statusBadgeMap[exp.status] || 'slate'}>{exp.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {exp.status === 'Pending' && isApprover && (
                              <>
                                <button onClick={() => approveExpense(exp.id, 'Approved')} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg" title="Approve">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => openRejectExpense(exp.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg" title="Reject">
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                            {(exp.status === 'Approved' || exp.status === 'Rejected' || exp.status === 'Paid') && exp.approver && (
                              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                {exp.approver.name}
                              </span>
                            )}
                            {canEdit && (
                              <button onClick={() => openEditExpense(exp)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg"><Edit3 className="h-3.5 w-3.5" /></button>
                            )}
                            {canEdit && (
                              <button onClick={() => deleteExpense(exp.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalExpensePages > 1 && (
            <Pagination
              currentPage={expensePage}
              totalPages={totalExpensePages}
              onPageChange={handleExpensePageChange}
              pageSize={expensePageSize}
              totalItems={filtered.length}
              showPageSizeSelector
              onPageSizeChange={handleExpensePageSizeChange}
            />
          )}

        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editExpense ? 'Edit Expense' : 'Log New Expense'}>
        <form onSubmit={saveExpense} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department" value={formData.department_id} onChange={handleInput} name="department_id" required placeholder="e.g., Camera" />
            <Input label="Category" value={formData.category} onChange={handleInput} name="category" required placeholder="e.g., Camera Equipment" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount (NPR)" type="number" value={formData.amount} onChange={handleInput} name="amount" required />
            <Input label="Date" type="date" value={formData.date} onChange={handleInput} name="date" required />
          </div>
          <Input label="Description" value={formData.description} onChange={handleInput} name="description" placeholder="What was this for?" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="PO Number" value={formData.po_number} onChange={handleInput} name="po_number" placeholder="Optional" />
            <Input label="Payment Method" value={formData.payment_method} onChange={handleInput} name="payment_method" options={['Cash', 'Bank Transfer', 'Cheque', 'Mobile Banking']} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editExpense ? 'Update' : 'Log'} Expense</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showBudgetModal} onClose={() => setShowBudgetModal(false)} title={editBudget ? 'Edit Budget' : 'Set Department Budget'}>
        <form onSubmit={saveBudget} className="space-y-4">
          <Input label="Department" value={formData.department_id} onChange={handleInput} name="department_id" required placeholder="e.g., Camera" />
          <Input label="Category" value={formData.category} onChange={handleInput} name="category" required placeholder="e.g., Camera Equipment" />
          <Input label="Budgeted Amount (NPR)" type="number" value={formData.budgeted_amount} onChange={handleInput} name="budgeted_amount" required />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowBudgetModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editBudget ? 'Update' : 'Set'} Budget</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Expense">
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Provide a reason for rejecting this expense.</p>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-h-[100px]"
            placeholder="Reason for rejection..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => approveExpense(rejectModal, 'Rejected')} disabled={!rejectReason.trim()}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
