import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../authStore';
import api from '../api';
import { Film, Plus, Users, Calendar, DollarSign, Activity, Loader, MapPin, Settings, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToastStore } from '../toastStore';

function ProgressBar({ value, max, color = 'bg-amber-500' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Dashboard() {
  const { currentFilm, userFilms, fetchFilms, selectFilm, user } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [wrapDate, setWrapDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const [schedules, setSchedules] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [castCrew, setCastCrew] = useState([]);
  const [progressUpdates, setProgressUpdates] = useState([]);

  useEffect(() => {
    if (!currentFilm?.id) { setLoading(false); return; }
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [sched, exp, crew, prog] = await Promise.all([
          api.get(`/films/${currentFilm.id}/schedules`),
          api.get(`/films/${currentFilm.id}/expenses`),
          api.get(`/films/${currentFilm.id}/cast-crew`),
          api.get(`/films/${currentFilm.id}/progress`),
        ]);
        setSchedules(sched.data.schedules || []);
        setScenes(sched.data.scenes || []);
        setExpenses(exp.data.expenses || []);
        setBudgets(exp.data.budgets || []);
        setCastCrew(crew.data || []);
        setProgressUpdates(prog.data || []);
      } catch (err) { console.error('Dashboard fetch error:', err); } finally { setLoading(false); }
    };
    fetchAll();
  }, [currentFilm?.id]);

  const handleCreateFilm = async (e) => {
    e.preventDefault();
    if (!newTitle) return;
    setCreating(true);
    try {
      const res = await api.post('/films', { title: newTitle, description: newDesc, genre: newGenre, production_company: newCompany, start_date: startDate || null, expected_wrap_date: wrapDate || null });
      setShowCreateModal(false);
      setNewTitle(''); setNewDesc(''); setNewGenre(''); setNewCompany(''); setStartDate(''); setWrapDate('');
      await fetchFilms();
      await selectFilm(res.data.id);
      addToast('Film workspace created');
    } catch (err) {
      addToast('Failed to create film: ' + (err.response?.data?.message || err.message), 'error');
    } finally { setCreating(false); }
  };

  const totalBudget = budgets.reduce((s, b) => s + (b.budgeted_amount || 0), 0);
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const scenesCompleted = scenes.filter(s => s.status === 'Completed').length;
  const completedSchedules = schedules.filter(s => s.status === 'Completed').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  if (!currentFilm) {
    if (user?.is_super_admin) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <Shield className="h-16 w-16 text-amber-500/60" />
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-300 mb-2">Super Admin Dashboard</h2>
            <p className="text-slate-500 mb-6">Manage all films, users, and platform settings</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/app/admin"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" /> Go to Admin Panel
            </Link>
            <select value="" onChange={e => { if (e.target.value) selectFilm(Number(e.target.value)); }}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer min-w-[200px]">
              <option value="">Select a film to work in...</option>
              {userFilms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
          </div>
        </div>
      );
    }
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <Film className="h-16 w-16 text-slate-700" />
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-300 mb-2">Welcome to Nepal Film OS</h2>
            <p className="text-slate-500 mb-6">Select a film workspace or create a new one to get started</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {userFilms.length > 0 && (
              <select value="" onChange={e => { if (e.target.value) selectFilm(Number(e.target.value)); }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer min-w-[200px]">
                <option value="">Select a film...</option>
                {userFilms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
              </select>
            )}
            <button onClick={() => setShowCreateModal(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create New Film
            </button>
          </div>
        </div>
        {/* Create Film Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-5 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-slate-100">Create Film Workspace</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
              </div>
              <form onSubmit={handleCreateFilm} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">Film Title *</label>
                  <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    className="input-field" placeholder="e.g., Kabbadi 5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-medium mb-1 block">Genre</label>
                    <input type="text" value={newGenre} onChange={e => setNewGenre(e.target.value)} className="input-field" placeholder="Drama" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium mb-1 block">Company</label>
                    <input type="text" value={newCompany} onChange={e => setNewCompany(e.target.value)} className="input-field" placeholder="Cinema Nepal" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-medium mb-1 block">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium mb-1 block">Wrap Date</label>
                    <input type="date" value={wrapDate} onChange={e => setWrapDate(e.target.value)} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">Description</label>
                  <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} className="input-field" placeholder="Brief description..." />
                </div>
                <button type="submit" disabled={creating} className="btn btn-primary w-full justify-center mt-2">
                  {creating ? <><Loader className="h-4 w-4 animate-spin" /> Creating...</> : 'Create Workspace'}
                </button>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-5 pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-100">{currentFilm.title}</h1>
          <p className="text-sm text-slate-500">{currentFilm.description ? currentFilm.description.substring(0, 80) : 'Dashboard'}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={currentFilm.id} onChange={e => { if (e.target.value) selectFilm(Number(e.target.value)); }}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer">
            {userFilms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
            <Plus className="h-3.5 w-3.5" /> New Film
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-medium">Shoot Days</p>
          <p className="text-lg font-bold text-amber-400 mt-0.5">{completedSchedules}/{schedules.length}</p>
          <p className="text-xs text-slate-600 mt-0.5">{schedules.length} total</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-medium">Scenes</p>
          <p className="text-lg font-bold text-blue-400 mt-0.5">{scenesCompleted}/{scenes.length}</p>
          <p className="text-xs text-slate-600 mt-0.5">{scenes.length ? Math.round(scenesCompleted / scenes.length * 100) : 0}% complete</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-medium">Budget Used</p>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">{budgetPct}%</p>
          <p className="text-xs text-slate-600 mt-0.5">NPR {(totalSpent / 100000).toFixed(1)}L / {(totalBudget / 100000).toFixed(1)}L</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-medium">Cast & Crew</p>
          <p className="text-lg font-bold text-purple-400 mt-0.5">{castCrew.length}</p>
          <p className="text-xs text-slate-600 mt-0.5">{castCrew.filter(m => m.role_type === 'Cast').length} cast · {castCrew.filter(m => m.role_type === 'Crew').length} crew</p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left column */}
        <div className="xl:col-span-2 space-y-5">

          {/* Today's shoot */}
          {schedules.filter(s => s.status === 'In Progress').slice(0, 1).map(today => (
            <div key={today.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-slate-100">Today — Day {today.day_number}</h2>
                </div>
                <Link to="/app/schedule" className="text-xs text-amber-500 hover:text-amber-400 font-medium">Full Schedule</Link>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-800/40 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Call Time</p>
                  <p className="text-sm font-semibold text-amber-400">{today.call_time || '—'}</p>
                </div>
                <div className="bg-slate-800/40 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="text-sm font-semibold text-slate-200">{today.location?.name || '—'}</p>
                </div>
                <div className="bg-slate-800/40 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Crew</p>
                  <p className="text-sm font-semibold text-slate-200">{castCrew.length} members</p>
                </div>
              </div>
              {today.scenes?.map(sc => (
                <div key={sc.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/30 mb-1">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Sc {sc.scene_number} — {sc.scene_heading}</p>
                    <p className="text-xs text-slate-500">{sc.page_count} pages</p>
                  </div>
                  <span className={`badge ${sc.status === 'In Progress' ? 'badge-blue' : 'badge-slate'}`}>{sc.status}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Upcoming */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-slate-100">Upcoming Shoot Days</h2>
              </div>
              <Link to="/app/schedule" className="text-xs text-amber-500 hover:text-amber-400 font-medium">Schedule</Link>
            </div>
            {schedules.filter(s => s.status !== 'Completed').slice(0, 5).length === 0 && (
              <p className="text-sm text-slate-500 py-4 text-center">No upcoming shoot days.</p>
            )}
            {schedules.filter(s => s.status !== 'Completed').slice(0, 5).map(day => (
              <div key={day.id} className="flex items-start gap-3 py-3 border-b border-slate-800 last:border-0">
                <div className="text-center w-10 shrink-0">
                  <p className="text-sm font-bold text-amber-400">D{day.day_number}</p>
                  <p className="text-xs text-slate-500">{day.shoot_date ? new Date(day.shoot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{day.shoot_date ? new Date(day.shoot_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-600" />
                    <p className="text-xs text-slate-400 truncate">{day.location?.name || 'No location'}</p>
                    <span className="badge badge-slate">{day.status}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-amber-400">{day.call_time || '—'}</p>
                  <p className="text-xs text-slate-500">{day.scenes?.length || 0} scenes</p>
                </div>
              </div>
            ))}
          </div>

          {/* Budget */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-100">Budget Overview</h2>
              </div>
              <Link to="/app/expenses" className="text-xs text-amber-500 hover:text-amber-400 font-medium">Expenses</Link>
            </div>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xs text-slate-500">Total Spent</p>
                <p className="text-xl font-bold text-slate-100">NPR {(totalSpent / 1000).toFixed(0)}K</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">of {(totalBudget / 100000).toFixed(1)}L budget</p>
                <p className={`text-base font-bold ${budgetPct > 80 ? 'text-red-400' : budgetPct > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>{budgetPct}% used</p>
              </div>
            </div>
            <ProgressBar value={totalSpent} max={totalBudget} color={budgetPct > 80 ? 'bg-red-500' : budgetPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'} />

            <div className="mt-4 space-y-2">
              {budgets.length === 0 && <p className="text-sm text-slate-500 py-2 text-center">No budgets set.</p>}
              {budgets.map((b, i) => {
                const spent = expenses.filter(e => e.department_id === b.department_id).reduce((s, e) => s + (e.amount || 0), 0);
                const pct = b.budgeted_amount > 0 ? Math.round((spent / b.budgeted_amount) * 100) : 0;
                return (
                  <div key={b.id || i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{b.category}</span>
                      <span className="text-slate-500 font-mono">NPR {(spent / 1000).toFixed(0)}K / {(b.budgeted_amount / 1000).toFixed(0)}K</span>
                    </div>
                    <ProgressBar value={spent} max={b.budgeted_amount} color={pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'} />
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Activity */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-slate-100">Activity</h2>
              </div>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {progressUpdates.length === 0 && <p className="text-sm text-slate-500 py-4 text-center">No activity yet.</p>}
              {progressUpdates.slice(0, 10).map(u => (
                <div key={u.id} className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-slate-800/30">
                  <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${u.status === 'Completed' ? 'bg-emerald-400' : u.status === 'In Progress' ? 'bg-blue-400' : 'bg-slate-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300">Scene {u.scene?.scene_number} — <span className="text-amber-400 font-medium">{u.status}</span></p>
                    <p className="text-xs text-slate-500">{u.reporter?.name} · {new Date(u.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                <h2 className="text-sm font-semibold text-slate-100">Cast & Crew</h2>
              </div>
              <Link to="/app/cast-crew" className="text-xs text-amber-500 hover:text-amber-400 font-medium">All</Link>
            </div>
            <div className="space-y-1">
              {castCrew.length === 0 && <p className="text-sm text-slate-500 py-4 text-center">No members yet.</p>}
              {castCrew.slice(0, 8).map(m => (
                <div key={m.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800/30">
                  <div className="h-7 w-7 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                    {m.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{m.name}</p>
                    <p className="text-xs text-slate-500 truncate">{m.role_name} · {m.department}</p>
                  </div>
                  <span className={`badge ${m.contract_status === 'Signed' ? 'badge-green' : 'badge-amber'}`}>{m.contract_status || 'Pending'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Modules */}
          {currentFilm?.modules?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-sm font-semibold text-slate-100">Modules</h2>
              </div>
              <div className="space-y-1">
                {(currentFilm?.modules || []).map((m, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs text-slate-400">{m.module_name?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                    <span className={`badge ${m.is_enabled ? 'badge-green' : 'badge-slate'}`}>{m.is_enabled ? 'ON' : 'OFF'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Create Film Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100">Create Film Workspace</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
            </div>
            <form onSubmit={handleCreateFilm} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Film Title *</label>
                <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  className="input-field" placeholder="e.g., Kabbadi 5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">Genre</label>
                  <input type="text" value={newGenre} onChange={e => setNewGenre(e.target.value)} className="input-field" placeholder="Drama" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">Company</label>
                  <input type="text" value={newCompany} onChange={e => setNewCompany(e.target.value)} className="input-field" placeholder="Cinema Nepal" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">Wrap Date</label>
                  <input type="date" value={wrapDate} onChange={e => setWrapDate(e.target.value)} className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} className="input-field" placeholder="Brief description..." />
              </div>
              <button type="submit" disabled={creating} className="btn btn-primary w-full justify-center mt-2">
                {creating ? <><Loader className="h-4 w-4 animate-spin" /> Creating...</> : 'Create Workspace'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
