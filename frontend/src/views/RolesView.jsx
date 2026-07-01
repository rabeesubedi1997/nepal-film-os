import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../authStore';
import { useToastStore } from '../toastStore';
import { roleService } from '../services/roleService';
import { filmService } from '../services/filmService';
import { Modal, Input, Button } from '../components/ui';
import { Shield, Plus, Edit3, Trash2, Users, UserPlus, Mail, CheckCircle, XCircle, Loader, ChevronDown, ChevronRight } from 'lucide-react';

const PERMISSION_GROUPS = {
  'Film': ['film.view', 'film.edit', 'film.invite_users', 'film.manage_roles'],
  'Schedule': ['schedule.view', 'schedule.create', 'schedule.edit', 'schedule.delete'],
  'Scenes': ['scene.view', 'scene.create', 'scene.edit', 'scene.delete'],
  'Script': ['script.view', 'script.create', 'script.edit', 'script.delete'],
  'Script Breakdown': ['script_breakdown.view', 'script_breakdown.create', 'script_breakdown.edit', 'script_breakdown.delete'],
  'Shot List': ['shot_list.view', 'shot_list.create', 'shot_list.edit', 'shot_list.delete'],
  'Cast & Crew': ['cast_crew.view', 'cast_crew.create', 'cast_crew.edit', 'cast_crew.delete'],
  'Budget': ['budget.view', 'budget.manage'],
  'Expenses': ['expense.create', 'expense.edit', 'expense.delete', 'expense.approve'],
  'Call Sheet': ['call_sheet.view', 'call_sheet.create', 'call_sheet.edit', 'call_sheet.delete'],
  'Progress': ['progress.view', 'progress.create', 'progress.edit', 'progress.delete'],
  'Locations': ['location.view', 'location.create', 'location.edit', 'location.delete'],
  'Tasks': ['task.view', 'task.create', 'task.edit', 'task.delete'],
  'Time Sheets': ['timesheet.view', 'timesheet.create', 'timesheet.edit', 'timesheet.delete', 'timesheet.approve'],
  'DPR': ['dpr.view', 'dpr.create', 'dpr.edit', 'dpr.delete'],
  'Documents': ['document.view', 'document.create', 'document.edit', 'document.delete'],
  'Messaging': ['message.view', 'message.create', 'message.delete'],
  'Wardrobe': ['wardrobe.view', 'wardrobe.create', 'wardrobe.edit', 'wardrobe.delete'],
  'Continuity': ['continuity.view', 'continuity.create', 'continuity.edit', 'continuity.delete'],
  'Notifications': ['notification.view', 'notification.mark_read'],
};

export default function RolesView() {
  const { currentFilm, userIsAdmin, userRole } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const isAdmin = userIsAdmin || userRole === 'Super Admin';

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] });
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteDepartment, setInviteDepartment] = useState('');
  const [inviting, setInviting] = useState(false);

  const fetchRoles = useCallback(async () => {
    if (!currentFilm) return;
    setLoading(true);
    setError(null);
    try {
      const res = await roleService.getAll(currentFilm.id);
      setRoles(res.data || []);
    } catch (err) {
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [currentFilm]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const openCreate = () => {
    setEditRole(null);
    setForm({ name: '', description: '', permissions: [] });
    setShowModal(true);
  };

  const openEdit = (role) => {
    setEditRole(role);
    setForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setShowModal(true);
  };

  const togglePermission = (perm) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm]
    }));
  };

  const toggleGroup = (groupKey) => {
    const groupPerms = PERMISSION_GROUPS[groupKey];
    const allSelected = groupPerms.every(p => form.permissions.includes(p));
    setForm(f => ({
      ...f,
      permissions: allSelected
        ? f.permissions.filter(p => !groupPerms.includes(p))
        : [...new Set([...f.permissions, ...groupPerms])]
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editRole) {
        await roleService.update(currentFilm.id, editRole.id, form);
        addToast('Role updated');
      } else {
        await roleService.create(currentFilm.id, form);
        addToast('Role created');
      }
      setShowModal(false);
      fetchRoles();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save role', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (role) => {
    try {
      await roleService.destroy(currentFilm.id, role.id);
      addToast('Role deleted');
      setDeleteConfirm(null);
      fetchRoles();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete role', 'error');
      setDeleteConfirm(null);
    }
  };

  if (!currentFilm) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">Select a film workspace first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Roles & Permissions</h1>
          <p className="text-sm text-slate-400 mt-1">Manage roles and their permissions for this film</p>
        </div>
        {isAdmin && (
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Create Role
          </Button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center">
          <Shield className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Only Film Admins can manage roles and permissions.</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <Loader className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {roles.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No roles defined yet.</p>
            </div>
          )}
          {roles.map(role => (
            <div key={role.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${role.is_admin ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      {role.name}
                      {role.is_admin && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">Admin</span>}
                    </p>
                    {role.description && <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{role.film_users_count || 0} users</span>
                  {isAdmin && !role.is_admin && (
                    <>
                      <button onClick={() => openEdit(role)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg transition-colors">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(role)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {role.permissions && role.permissions.length > 0 && (
                <div className="px-5 pb-4 flex flex-wrap gap-1.5">
                  {role.permissions.slice(0, 8).map(p => (
                    <span key={p} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{p}</span>
                  ))}
                  {role.permissions.length > 8 && (
                    <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">+{role.permissions.length - 8} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editRole ? 'Edit Role' : 'Create Role'}>
        <form onSubmit={save} className="space-y-5">
          <Input label="Role Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} name="name" required placeholder="e.g., Director, Writer, DOP" />
          <Input label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} name="description" placeholder="Brief description of this role" />

          <div>
            <p className="text-sm font-bold text-slate-200 mb-3">Permissions</p>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
                const allSelected = perms.every(p => form.permissions.includes(p));
                const someSelected = perms.some(p => form.permissions.includes(p));
                const expanded = expandedGroups[group] !== false;

                return (
                  <div key={group} className="bg-slate-800/60 border border-slate-700/50 rounded-lg overflow-hidden">
                    <button type="button" onClick={() => setExpandedGroups(g => ({ ...g, [group]: !expanded }))}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-slate-200 transition-colors">
                      <div className="flex items-center gap-2">
                        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        {group}
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleGroup(group); }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${allSelected ? 'bg-amber-500/20 text-amber-400' : someSelected ? 'bg-slate-700 text-slate-300' : 'bg-slate-700/50 text-slate-500'}`}>
                        {allSelected ? 'All' : someSelected ? 'Partial' : 'None'}
                      </button>
                    </button>
                    {expanded && (
                      <div className="px-4 pb-2.5 grid grid-cols-2 gap-1">
                        {perms.map(perm => (
                          <label key={perm} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-slate-700/30 rounded px-1 transition-colors">
                            <input type="checkbox" checked={form.permissions.includes(perm)} onChange={() => togglePermission(perm)} className="h-3.5 w-3.5 accent-amber-500" />
                            <span className="text-[11px] text-slate-400">{perm}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <><Loader className="h-3.5 w-3.5 animate-spin" /> Saving...</> : editRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Role">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">Are you sure you want to delete the role <span className="font-bold text-slate-100">"{deleteConfirm?.name}"</span>?</p>
          <p className="text-xs text-slate-500">Users assigned to this role will lose their permissions. Reassign them first.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => confirmDelete(deleteConfirm)}>Delete Role</Button>
          </div>
        </div>
      </Modal>

      {/* Invite User */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-bold text-slate-200">Invite Team Member</p>
          </div>
        </div>
        <div className="p-5">
          {isAdmin ? (
            <form onSubmit={async (e) => { e.preventDefault(); if (!inviteEmail || !inviteRoleId) return; setInviting(true); try { await filmService.inviteUser(currentFilm.id, { email: inviteEmail, role_id: inviteRoleId, department: inviteDepartment }); addToast('User invited'); setInviteEmail(''); setInviteDepartment(''); fetchRoles(); } catch (err) { addToast(err.response?.data?.message || 'Failed to invite user', 'error'); } finally { setInviting(false); } }} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <Input label="Email Address" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} name="invite_email" required placeholder="colleague@example.com" />
              </div>
              <div className="w-40">
                <Input label="Role" value={inviteRoleId} onChange={e => setInviteRoleId(e.target.value)} name="invite_role_id" options={roles.filter(r => !r.is_admin).map(r => ({ value: r.id, label: r.name }))} required />
              </div>
              <div className="w-40">
                <Input label="Department" value={inviteDepartment} onChange={e => setInviteDepartment(e.target.value)} name="invite_department" placeholder="e.g., Camera" />
              </div>
              <Button variant="primary" type="submit" disabled={inviting}>
                {inviting ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                Invite
              </Button>
            </form>
          ) : (
            <p className="text-sm text-slate-500 text-center">Only Admins can invite team members.</p>
          )}
        </div>
      </div>
    </div>
  );
}
