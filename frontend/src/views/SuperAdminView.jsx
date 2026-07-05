import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Film, Users, CreditCard, Plus, Edit3, Trash2, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, Loader, Activity, X, UserPlus, UserMinus } from 'lucide-react';
import api from '../api';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';

const getErrMsg = (err, fallback) => {
  const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
  return msg || fallback;
};

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

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignUserId, setAssignUserId] = useState(null);
  const [assignForm, setAssignForm] = useState({ film_id: '', role_id: '', department: '' });
  const [assignRoles, setAssignRoles] = useState([]);
  const [savingAssign, setSavingAssign] = useState(false);
  const [removingFilm, setRemovingFilm] = useState(null);

  const [showFilmModal, setShowFilmModal] = useState(false);
  const [filmForm, setFilmForm] = useState({ title: '', description: '', genre: '', language: 'Nepali', production_company: '', assign_user_id: '', assign_role_id: '', assign_department: '' });
  const [savingFilm, setSavingFilm] = useState(false);
  const [filmFormRoles, setFilmFormRoles] = useState([]);

  const [toggleLoading, setToggleLoading] = useState(null);

  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [featuresFilm, setFeaturesFilm] = useState(null);
  const [featuresList, setFeaturesList] = useState([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);

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
    } catch (err) {
      addToast(getErrMsg(err, 'Failed to load admin data'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleActive = async (filmId) => {
    setToggleLoading(filmId);
    try {
      await api.put(`/super-admin/films/${filmId}/toggle-status`);
      await fetchAll();
      addToast('Film status toggled');
    } catch (err) {
      addToast(getErrMsg(err, 'Failed to toggle status'), 'error');
    } finally {
      setToggleLoading(null);
    }
  };

  const openFeaturesModal = async (film) => {
    setFeaturesFilm(film);
    setShowFeaturesModal(true);
    setFeaturesLoading(true);
    try {
      const res = await api.get(`/films/${film.id}/features`);
      setFeaturesList(res.data || []);
    } catch (err) {
      addToast(getErrMsg(err, 'Failed to load features'), 'error');
      setFeaturesList([]);
    } finally {
      setFeaturesLoading(false);
    }
  };

  const toggleFeature = async (moduleName, currentlyEnabled) => {
    if (!featuresFilm) return;
    // Optimistic update
    setFeaturesList(prev => prev.map(f =>
      f.module_name === moduleName ? { ...f, is_enabled: !currentlyEnabled } : f
    ));
    try {
      await api.put(`/films/${featuresFilm.id}/features/toggle`, {
        module_name: moduleName,
        is_enabled: !currentlyEnabled,
      });
    } catch (err) {
      addToast(getErrMsg(err, 'Failed to toggle feature'), 'error');
      setFeaturesList(prev => prev.map(f =>
        f.module_name === moduleName ? { ...f, is_enabled: currentlyEnabled } : f
      ));
    }
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
      await fetchAll();
      addToast(editPlan ? 'Plan updated' : 'Plan created');
    } catch (err) {
      addToast(getErrMsg(err, 'Failed to save plan'), 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  const deletePlan = async (id) => {
    if (!confirm('Delete this subscription plan?')) return;
    try {
      await api.delete(`/super-admin/subscription-plans/${id}`);
      await fetchAll();
      addToast('Plan deleted');
    } catch (err) {
      addToast(getErrMsg(err, 'Failed to delete plan'), 'error');
    }
  };

  const openCreateUser = () => {
    setEditUser(null);
    setUserForm({ name: '', email: '', password: '', is_super_admin: false, film_id: '', role_id: '', department: '' });
    setShowUserModal(true);
  };

  const openEditUser = (u) => {
    setEditUser(u);
    setUserForm({ name: u.name, email: u.email, password: '', is_super_admin: !!u.is_super_admin, film_id: '', role_id: '', department: '' });
    setShowUserModal(true);
  };

  const saveUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      const data = {
        name: userForm.name,
        email: userForm.email,
        is_super_admin: userForm.is_super_admin,
      };
      if (userForm.password) data.password = userForm.password;

      if (!editUser && userForm.film_id && userForm.role_id) {
        data.film_id = Number(userForm.film_id);
        data.role_id = Number(userForm.role_id);
        if (userForm.department) data.department = userForm.department;
      }

      if (editUser) {
        const res = await api.put(`/super-admin/users/${editUser.id}`, data);
        // Immediately update users list
        setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...res.data } : u));
      } else {
        await api.post('/super-admin/users', data);
      }
      setShowUserModal(false);
      await fetchAll();
      addToast(editUser ? 'User updated' : 'User created');
    } catch (err) {
      addToast(getErrMsg(err, 'Failed to save user'), 'error');
    } finally {
      setSavingUser(false);
    }
  };

  const openCreateFilm = () => {
    setFilmForm({ title: '', description: '', genre: '', language: 'Nepali', production_company: '', assign_user_id: '', assign_role_id: '', assign_department: '' });
    setFilmFormRoles([]);
    setShowFilmModal(true);
  };

  const saveFilm = async (e) => {
    e.preventDefault();
    if (!filmForm.title.trim()) { addToast('Film title is required', 'error'); return; }
    setSavingFilm(true);
    try {
      const data = {
        title: filmForm.title,
        description: filmForm.description || null,
        genre: filmForm.genre || null,
        language: filmForm.language || 'Nepali',
        production_company: filmForm.production_company || null,
      };
      if (filmForm.assign_user_id) {
        data.assign_user_id = Number(filmForm.assign_user_id);
        if (filmForm.assign_role_id) data.assign_role_id = Number(filmForm.assign_role_id);
        if (filmForm.assign_department) data.assign_department = filmForm.assign_department;
      }
      const res = await api.post('/super-admin/films', data);
      setFilms(prev => [...prev, res.data]);
      setShowFilmModal(false);
      await fetchAll();
      addToast('Film created');
    } catch (err) {
      addToast(getErrMsg(err, 'Failed to create film'), 'error');
    } finally {
      setSavingFilm(false);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/super-admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      await fetchAll();
      addToast('User deleted');
    } catch (err) {
      addToast(getErrMsg(err, 'Failed to delete user'), 'error');
    }
  };

  const openAssignFilm = (userId) => {
    setAssignUserId(userId);
    setAssignForm({ film_id: '', role_id: '', department: '' });
    setAssignRoles([]);
    setShowAssignModal(true);
  };

  const handleAssignFilmChange = async (filmId) => {
    setAssignForm(f => ({ ...f, film_id: filmId, role_id: '' }));
    if (!filmId) { setAssignRoles([]); return; }
    try {
      const res = await api.get(`/super-admin/films/${filmId}`);
      const film = res.data;
      const roles = await api.get(`/films/${filmId}/roles`);
      setAssignRoles(roles.data || []);
    } catch {
      setAssignRoles([]);
    }
  };

  const saveAssignFilm = async (e) => {
    e.preventDefault();
    if (!assignForm.film_id || !assignForm.role_id) {
      addToast('Select a film and role', 'error');
      return;
    }
    setSavingAssign(true);
    try {
      const res = await api.post(`/super-admin/users/${assignUserId}/assign-film`, {
        film_id: Number(assignForm.film_id),
        role_id: Number(assignForm.role_id),
        department: assignForm.department || null,
      });
      setUsers(prev => prev.map(u => u.id === assignUserId ? { ...u, film_assignments: [...(u.film_assignments || []), res.data] } : u));
      setShowAssignModal(false);
      await fetchAll();
      addToast('User assigned to film');
    } catch (err) {
      addToast(getErrMsg(err, 'Failed to assign user'), 'error');
    } finally {
      setSavingAssign(false);
    }
  };

  const removeUserFromFilm = async (userId, filmId, filmTitle) => {
    if (!confirm(`Remove this user from "${filmTitle}"?`)) return;
    setRemovingFilm(`${userId}-${filmId}`);
    try {
      await api.delete(`/super-admin/users/${userId}/films/${filmId}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, film_assignments: (u.film_assignments || []).filter(fa => Number(fa.film_id) !== Number(filmId) && fa.film?.id !== Number(filmId)) } : u));
      await fetchAll();
      addToast('User removed from film');
    } catch (err) {
      addToast(getErrMsg(err, 'Failed to remove user'), 'error');
    } finally {
      setRemovingFilm(null);
    }
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

      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto">
        {[
          { value: 'overview', label: 'Overview', icon: Activity },
          { value: 'films', label: 'Films', icon: Film },
          { value: 'users', label: 'Users', icon: Users },
          { value: 'plans', label: 'Subscriptions', icon: CreditCard },
        ].map(v => {
          const Icon = v.icon;
          return (
            <button key={v.value} onClick={() => setTab(v.value)}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${tab === v.value ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
              <Icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{v.label}</span><span className="sm:hidden">{v.label}</span>
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
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-slate-200">All Films ({films.length})</p>
            <Button variant="primary" size="sm" onClick={openCreateFilm}><Plus className="h-3.5 w-3.5" /> Add Film</Button>
          </div>

          <Modal open={showFilmModal} onClose={() => setShowFilmModal(false)} title="Create Film Workspace">
            <form onSubmit={saveFilm} className="space-y-4">
              <Input label="Film Title" value={filmForm.title} onChange={e => setFilmForm(f => ({ ...f, title: e.target.value }))} name="title" required placeholder="e.g., Maya Nagari" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Genre" value={filmForm.genre} onChange={e => setFilmForm(f => ({ ...f, genre: e.target.value }))} name="genre" placeholder="e.g., Drama" />
                <Input label="Language" value={filmForm.language} onChange={e => setFilmForm(f => ({ ...f, language: e.target.value }))} name="language" options={['Nepali', 'English', 'Hindi', 'Other']} />
              </div>
              <Input label="Production Company" value={filmForm.production_company} onChange={e => setFilmForm(f => ({ ...f, production_company: e.target.value }))} name="production_company" placeholder="e.g., Nepal Films" />
              <Input label="Description" value={filmForm.description} onChange={e => setFilmForm(f => ({ ...f, description: e.target.value }))} name="description" placeholder="Brief description..." />
              <div className="border-t border-slate-700 pt-4 mt-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Assign Admin (optional)</p>
                <div className="space-y-3">
                  <select value={filmForm.assign_user_id} onChange={e => { const val = e.target.value; setFilmForm(f => ({ ...f, assign_user_id: val, assign_role_id: '' })); const u = users.find(uu => uu.id === Number(val)); if (u?.film_assignments?.[0]) setFilmFormRoles([]); }}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500">
                    <option value="">Select a user...</option>
                    {users.filter(u => !u.is_super_admin).map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                  </select>
                  <Input label="Department" value={filmForm.assign_department} onChange={e => setFilmForm(f => ({ ...f, assign_department: e.target.value }))} name="assign_department" placeholder="e.g., Production" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowFilmModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={savingFilm}>
                  {savingFilm ? <><Loader className="h-3.5 w-3.5 animate-spin" /> Creating...</> : 'Create Film'}
                </Button>
              </div>
            </form>
          </Modal>

          <div className="divide-y divide-slate-800">
            {films.length === 0 && <div className="px-5 py-8 text-center text-slate-500 text-sm">No films found.</div>}
            {films.map(f => (
                <div key={f.id} className="px-4 sm:px-5 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg shrink-0"><Film className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-200 truncate">{f.title}</p>
                      <p className="text-xs text-slate-500 truncate">{f.production_company || '\u2014'} \u00B7 {f.status || 'draft'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => openFeaturesModal(f)}
                      className="shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 hover:border-amber-500/50 hover:text-amber-400 transition-all">
                      <ToggleRight className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Features</span>
                    </button>
                    <button onClick={() => toggleActive(f.id)} disabled={toggleLoading === f.id}
                      className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${f.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'} hover:opacity-80 disabled:opacity-50`}>
                      {toggleLoading === f.id ? <Loader className="h-3.5 w-3.5 animate-spin" /> : f.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{f.is_active ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-800 flex justify-between items-center gap-3">
            <p className="text-sm font-bold text-slate-200 shrink-0">All Users ({users.length})</p>
            <Button variant="primary" size="sm" onClick={openCreateUser}><Plus className="h-3.5 w-3.5" /> Add User</Button>
          </div>

          <Modal open={showUserModal} onClose={() => setShowUserModal(false)} title={editUser ? 'Edit User' : 'Add User'}>
            <form onSubmit={saveUser} className="space-y-4">
              <Input label="Name" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} name="name" required placeholder="Full name" />
              <Input label="Email" type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} name="email" required placeholder="email@domain.com" />
              <Input label={editUser ? 'New Password (leave blank to keep)' : 'Password'} type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} name="password" required={!editUser} placeholder="Min 8 characters" />
              <label className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 cursor-pointer hover:border-amber-500/50 transition-colors">
                <input type="checkbox" checked={userForm.is_super_admin} onChange={e => setUserForm(f => ({ ...f, is_super_admin: e.target.checked }))} className="h-4 w-4 accent-amber-500" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Super Admin</p>
                  <p className="text-[10px] text-slate-400">Full platform access \u2014 can manage all films, users, and settings</p>
                </div>
              </label>
              {!editUser && (
                <div className="border-t border-slate-700 pt-4 mt-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Assign to Film (optional)</p>
                  <div className="space-y-3">
                    <select value={userForm.film_id} onChange={e => { const val = e.target.value; setUserForm(f => ({ ...f, film_id: val, role_id: '' })); }}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500">
                      <option value="">Select a film...</option>
                      {films.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                    </select>
                    {userForm.film_id && <FilmRoleDropdown filmId={userForm.film_id} value={userForm.role_id} onChange={v => setUserForm(f => ({ ...f, role_id: v }))} />}
                    <Input label="Department (optional)" value={userForm.department} onChange={e => setUserForm(f => ({ ...f, department: e.target.value }))} name="department" placeholder="e.g., Production" />
          </div>

          <Modal open={showFeaturesModal} onClose={() => setShowFeaturesModal(false)}
            title={featuresFilm ? `Features: ${featuresFilm.title}` : 'Manage Features'} size="lg">
            {featuresLoading ? (
              <div className="flex items-center justify-center py-12"><Loader className="h-6 w-6 animate-spin text-amber-400" /></div>
            ) : (
              <div className="space-y-1">
                {featuresList.map(feat => (
                  <div key={feat.module_name}
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                    <div>
                      <p className="text-sm font-medium text-slate-200 capitalize">
                        {feat.module_name.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{feat.module_name}</p>
                    </div>
                    <button onClick={() => toggleFeature(feat.module_name, feat.is_enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all shrink-0 ${feat.is_enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${feat.is_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
                {featuresList.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-8">No features available.</p>
                )}
              </div>
            )}
          </Modal>
        </div>
      )}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowUserModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={savingUser}>
                  {savingUser ? <><Loader className="h-3.5 w-3.5 animate-spin" /> Saving...</> : editUser ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </form>
          </Modal>

          <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign to Film">
            <form onSubmit={saveAssignFilm} className="space-y-4">
              <select value={assignForm.film_id} onChange={e => handleAssignFilmChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500">
                <option value="">Select a film...</option>
                {films.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
              </select>
              {assignRoles.length > 0 && (
                <select value={assignForm.role_id} onChange={e => setAssignForm(f => ({ ...f, role_id: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500">
                  <option value="">Select a role...</option>
                  {assignRoles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}{r.is_admin ? ' (Admin)' : ''}</option>
                  ))}
                </select>
              )}
              <Input label="Department (optional)" value={assignForm.department} onChange={e => setAssignForm(f => ({ ...f, department: e.target.value }))} name="department" placeholder="e.g., Production" />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={savingAssign}>
                  {savingAssign ? <><Loader className="h-3.5 w-3.5 animate-spin" /> Assigning...</> : 'Assign'}
                </Button>
              </div>
            </form>
          </Modal>

          <div className="divide-y divide-slate-800">
            {users.length === 0 && <div className="px-5 py-8 text-center text-slate-500 text-sm">No users found.</div>}
            {users.map(u => (
              <div key={u.id} className="px-4 sm:px-5 py-3 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center font-bold text-xs text-white shrink-0">
                      {u.name?.charAt(0) || u.email?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-200 truncate">{u.name || 'Unnamed'}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {u.is_super_admin && <Badge color="red">Super Admin</Badge>}
                    <span className="text-xs text-slate-500 hidden sm:inline">{u.films_count || 0} films</span>
                    <Button variant="ghost" size="xs" onClick={() => openAssignFilm(u.id)} title="Assign to film"><UserPlus className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="xs" onClick={() => openEditUser(u)}>Edit</Button>
                    <Button variant="ghost" size="xs" className="text-red-400 hover:text-red-300" onClick={() => deleteUser(u.id)}>Delete</Button>
                  </div>
                </div>
                {u.film_assignments?.length > 0 && (
                  <div className="mt-2 ml-12 flex flex-wrap gap-1.5">
                    {u.film_assignments.map(fa => (
                      <span key={`${u.id}-${fa.film_id}`} className="inline-flex items-center gap-1 text-[10px] bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 text-slate-300">
                        <Film className="h-2.5 w-2.5 text-amber-400" />
                        {fa.film_title}
                        <span className="text-slate-600">({fa.role_name})</span>
                        <button onClick={() => removeUserFromFilm(u.id, fa.film_id, fa.film_title)} disabled={removingFilm === `${u.id}-${fa.film_id}`}
                          className="p-0.5 text-slate-600 hover:text-red-400 disabled:opacity-50">
                          {removingFilm === `${u.id}-${fa.film_id}` ? <Loader className="h-2.5 w-2.5 animate-spin" /> : <X className="h-2.5 w-2.5" />}
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg shrink-0"><CreditCard className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-200 truncate">{p.name}</p>
                      <p className="text-lg font-black text-amber-400">NPR {p.price_npr?.toLocaleString() || p.price?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditPlan(p)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deletePlan(p.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p><span className="text-slate-500">Billing:</span> {p.billing_cycle || '\u2014'}</p>
                  {p.features && <p className="text-slate-400 mt-2 bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 whitespace-pre-line break-words">{Array.isArray(p.features) ? p.features.join('\n') : p.features}</p>}
                </div>
              </div>
            ))}
          </div>

          <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title={editPlan ? 'Edit Plan' : 'Add Subscription Plan'}>
            <form onSubmit={savePlan} className="space-y-4">
              <Input label="Plan Name" value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} name="name" required placeholder="e.g., Premium" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

function FilmRoleDropdown({ filmId, value, onChange }) {
  const [roles, setRoles] = useState([]);
  useEffect(() => {
    if (!filmId) { setRoles([]); return; }
    api.get(`/films/${filmId}/roles`).then(r => setRoles(r.data || [])).catch(() => setRoles([]));
  }, [filmId]);
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500">
      <option value="">Select a role...</option>
      {roles.map(r => (
        <option key={r.id} value={r.id}>{r.name}{r.is_admin ? ' (Admin)' : ''}</option>
      ))}
    </select>
  );
}
