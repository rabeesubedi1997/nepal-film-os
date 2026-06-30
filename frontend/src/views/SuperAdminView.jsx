import React, { useState, useEffect } from 'react';
import { Shield, Film, Users, CreditCard, Plus, Edit3, Trash2, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, Loader, Activity, Key, Mail, Lock } from 'lucide-react';
import api from '../api';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';

export default function SuperAdminView() {
  const addToast = useToastStore(s => s.addToast);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({});
  const [films, setFilms] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [planForm, setPlanForm] = useState({});
  const [savingPlan, setSavingPlan] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userForm, setUserForm] = useState({});
  const [savingUser, setSavingUser] = useState(false);

  const [toggleLoading, setToggleLoading] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [statsRes, filmsRes, usersRes, plansRes] = await Promise.all([
        api.get('/super-admin/dashboard'),
        api.get('/super-admin/films'),
        api.get('/super-admin/users'),
        api.get('/super-admin/subscription-plans'),
      ]);
      setStats(statsRes.data || {});
      setFilms(filmsRes.data || []);
      setUsers(usersRes.data || []);
      setPlans(plansRes.data || []);
    } catch (err) { console.error('Failed to load admin data:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleActive = async (filmId) => {
    setToggleLoading(filmId);
    try {
      await api.put(`/super-admin/films/${filmId}/toggle-status`);
      fetchAll();
      addToast('Film status toggled');
    } catch (err) { console.error(err); addToast('Failed to toggle status', 'error'); } finally { setToggleLoading(null); }
  };

  const openCreatePlan = () => {
    setEditPlan(null);
    setPlanForm({ name: '', price_npr: '', billing_cycle: 'monthly', features: '' });
    setShowPlanModal(true);
  };

  const openEditPlan = (p) => {
    setEditPlan(p);
    setPlanForm({
      name: p.name,
      price_npr: String(p.price_npr || ''),
      billing_cycle: p.billing_cycle || 'monthly',
      features: Array.isArray(p.features) ? p.features.join('\n') : (p.features || ''),
    });
    setShowPlanModal(true);
  };

  const savePlan = async (e) => {
    e.preventDefault();
    setSavingPlan(true);
    try {
      const data = {
        name: planForm.name,
        price_npr: parseFloat(planForm.price_npr),
        billing_cycle: planForm.billing_cycle,
        features: planForm.features ? planForm.features.split('\n').filter(Boolean) : [],
      };
      if (editPlan) {
        await api.put(`/super-admin/subscription-plans/${editPlan.id}`, data);
      } else {
        await api.post('/super-admin/subscription-plans', data);
      }
      setShowPlanModal(false);
      fetchAll();
      addToast(editPlan ? 'Plan updated' : 'Plan created');
    } catch (err) { console.error('Failed to save plan:', err); addToast('Failed to save plan', 'error'); } finally { setSavingPlan(false); }
  };

  const deletePlan = async (id) => {
    if (!confirm('Delete this subscription plan?')) return;
    try { await api.delete(`/super-admin/subscription-plans/${id}`); fetchAll(); addToast('Plan deleted'); } catch (err) { console.error(err); addToast('Failed to delete plan', 'error'); }
  };

  const openCreateUser = () => {
    setEditUser(null);
    setUserForm({ name: '', email: '', password: '', role: 'user' });
    setShowUserModal(true);
  };

  const openEditUser = (u) => {
    setEditUser(u);
    setUserForm({ name: u.name, email: u.email, password: '', role: u.role || 'user' });
    setShowUserModal(true);
  };

  const saveUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      const data = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
      };
      if (userForm.password) data.password = userForm.password;
      if (editUser) {
        await api.put(`/super-admin/users/${editUser.id}`, data);
      } else {
        await api.post('/super-admin/users', data);
      }
      setShowUserModal(false);
      fetchAll();
      addToast(editUser ? 'User updated' : 'User created');
    } catch (err) { console.error('Failed to save user:', err); addToast('Failed to save user', 'error'); } finally { setSavingUser(false); }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await api.delete(`/super-admin/users/${id}`); fetchAll(); addToast('User deleted'); } catch (err) { console.error(err); addToast('Failed to delete user', 'error'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-400" /> Super Admin
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Platform administration dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {[
          { value: 'overview', label: 'Overview', icon: Activity },
          { value: 'films', label: 'Films', icon: Film },
          { value: 'users', label: 'Users', icon: Users },
          { value: 'plans', label: 'Subscriptions', icon: CreditCard },
        ].map(v => {
          const Icon = v.icon;
          return (
            <button key={v.value} onClick={() => setTab(v.value)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${tab === v.value ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
              <Icon className="h-3.5 w-3.5" /> {v.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Films', value: stats.total_films || 0, sub: 'All productions', color: 'text-blue-400', icon: Film },
            { label: 'Active Films', value: stats.active_films || 0, sub: 'Currently active', color: 'text-emerald-400', icon: CheckCircle },
            { label: 'Total Users', value: stats.total_users || 0, sub: 'Registered', color: 'text-purple-400', icon: Users },
            { label: 'Film Users', value: stats.film_users || 0, sub: 'With film access', color: 'text-amber-400', icon: Users },
          ].map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{k.label}</p>
                    <p className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{k.sub}</p>
                  </div>
                  <Icon className={`h-8 w-8 opacity-30 ${k.color}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'films' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800">
            <p className="text-sm font-bold text-slate-200">All Films ({films.length})</p>
          </div>
          <div className="divide-y divide-slate-800">
            {films.length === 0 && <div className="px-5 py-8 text-center text-slate-500 text-sm">No films found.</div>}
            {films.map(f => (
              <div key={f.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg"><Film className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">{f.title}</p>
                    <p className="text-xs text-slate-500">{f.production_company || '—'} · {f.status || 'draft'}</p>
                  </div>
                </div>
                <button onClick={() => toggleActive(f.id)} disabled={toggleLoading === f.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${f.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'} hover:opacity-80 disabled:opacity-50`}>
                  {toggleLoading === f.id ? <Loader className="h-3.5 w-3.5 animate-spin" /> : f.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                  {f.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex justify-between items-center">
            <p className="text-sm font-bold text-slate-200">All Users ({users.length})</p>
            <Button variant="primary" size="sm" onClick={openCreateUser}><Plus className="h-3.5 w-3.5" /> Add User</Button>
          </div>
          <div className="divide-y divide-slate-800">
            {users.length === 0 && <div className="px-5 py-8 text-center text-slate-500 text-sm">No users found.</div>}
            {users.map(u => (
              <div key={u.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    {u.name?.charAt(0) || u.email?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">{u.name || 'Unnamed'}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={u.role === 'super_admin' ? 'red' : u.role === 'admin' ? 'amber' : 'slate'}>{u.role || 'user'}</Badge>
                  <span className="text-xs text-slate-500">{u.films_count || 0} films</span>
                  <Button variant="ghost" size="xs" onClick={() => openEditUser(u)}>Edit</Button>
                  <Button variant="ghost" size="xs" className="text-red-400 hover:text-red-300" onClick={() => deleteUser(u.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={openCreatePlan}><Plus className="h-3.5 w-3.5" /> Add Plan</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.length === 0 && <div className="col-span-full text-center py-12 text-slate-500 text-sm">No subscription plans yet.</div>}
            {plans.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg"><CreditCard className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{p.name}</p>
                      <p className="text-lg font-black text-amber-400">NPR {p.price_npr?.toLocaleString() || p.price?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditPlan(p)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deletePlan(p.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p><span className="text-slate-500">Billing:</span> {p.billing_cycle || '—'}</p>
                  {p.features && <p className="text-slate-400 mt-2 bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 whitespace-pre-line">{p.features}</p>}
                </div>
              </div>
            ))}
          </div>

          <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title={editPlan ? 'Edit Plan' : 'Add Subscription Plan'}>
            <form onSubmit={savePlan} className="space-y-4">
              <Input label="Plan Name" value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} name="name" required placeholder="e.g., Premium" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Price (NPR)" type="number" step="0.01" value={planForm.price_npr} onChange={e => setPlanForm(f => ({ ...f, price_npr: e.target.value }))} name="price_npr" required placeholder="999" />
                <Input label="Billing Cycle" value={planForm.billing_cycle} onChange={e => setPlanForm(f => ({ ...f, billing_cycle: e.target.value }))} name="billing_cycle" options={['monthly', 'quarterly', 'yearly', 'one-time']} required />
              </div>
              <Input label="Features" value={planForm.features} onChange={e => setPlanForm(f => ({ ...f, features: e.target.value }))} name="features" placeholder="Feature 1&#10;Feature 2&#10;Feature 3" />
              <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowPlanModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={savingPlan}>
              {savingPlan ? <><Loader className="h-3.5 w-3.5 animate-spin" /> Saving...</> : editPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
}
