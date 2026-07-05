import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../authStore';
import { useToastStore } from '../toastStore';
import { filmService } from '../services/filmService';
import { roleService } from '../services/roleService';
import api from '../api';
import { Modal, Input, Button, Badge } from '../components/ui';
import { Users, UserPlus, Edit3, Trash2, Loader, Shield, Mail, CheckSquare } from 'lucide-react';

export default function MembersView() {
  const { currentFilm, userIsAdmin } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const isAdmin = userIsAdmin;

  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissionsGrouped, setPermissionsGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '', department: '' });
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [saving, setSaving] = useState(false);

  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [removing, setRemoving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentFilm) return;
    setLoading(true);
    setError(null);
    try {
      const [membersRes, rolesRes, permsRes] = await Promise.all([
        filmService.getMembers(currentFilm.id),
        roleService.getAll(currentFilm.id),
        api.get('/permissions/list'),
      ]);
      setMembers(membersRes.data || []);
      setRoles(rolesRes.data || []);

      const grouped = {};
      for (const p of permsRes.data || []) {
        if (!grouped[p.group]) grouped[p.group] = [];
        grouped[p.group].push(p);
      }
      setPermissionsGrouped(grouped);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [currentFilm]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditMember(null);
    setForm({ name: '', email: '', password: '', role_id: '', department: '' });
    setSelectedPermissions([]);
    setShowAddModal(true);
  };

  const openEdit = (member) => {
    setEditMember(member);
    const roleId = Number(member.role_id) || '';
    setForm({
      name: member.name,
      email: member.email,
      password: '',
      role_id: roleId,
      department: member.department || '',
    });

    // Pre-fill permissions from role defaults, then apply individual overrides
    const role = roleId ? roles.find(r => Number(r.id) === roleId) : null;
    const rolePerms = role?.permissions || [];
    const individualPerms = member.permissions || [];
    // Merge: role defaults + individual overrides
    const merged = [...new Set([...rolePerms, ...individualPerms])];
    setSelectedPermissions(merged);
    setShowAddModal(true);
  };

  const handleRoleChange = (roleId) => {
    setForm(f => ({ ...f, role_id: roleId }));
    // When role changes, reset permissions to the role's defaults
    const role = roles.find(r => Number(r.id) === Number(roleId));
    setSelectedPermissions(role?.permissions || []);
  };

  const togglePermission = (permKey) => {
    setSelectedPermissions(prev =>
      prev.includes(permKey)
        ? prev.filter(k => k !== permKey)
        : [...prev, permKey]
    );
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.role_id) return;
    setSaving(true);
    try {
      const payload = {
        role_id: form.role_id,
        department: form.department,
        permissions: selectedPermissions,
      };

      if (editMember) {
        await filmService.updateMember(currentFilm.id, editMember.user_id, payload);
        addToast('Member updated');
      } else {
        await filmService.addMember(currentFilm.id, { ...form, ...payload });
        addToast('Member added');
      }
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save member', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeConfirm) return;
    setRemoving(true);
    try {
      await filmService.removeMember(currentFilm.id, removeConfirm.user_id);
      addToast('Member removed');
      setRemoveConfirm(null);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove member', 'error');
      setRemoveConfirm(null);
    } finally {
      setRemoving(false);
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
          <h1 className="text-xl font-bold text-slate-100">Team Members</h1>
          <p className="text-sm text-slate-400 mt-1">Manage who has access to this film workspace</p>
        </div>
        {isAdmin && (
          <Button variant="primary" size="sm" onClick={openAdd}>
            <UserPlus className="h-3.5 w-3.5" /> Add Member
          </Button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center">
          <Shield className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Only Admins can manage team members.</p>
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {members.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No members found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Member</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Role</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Permissions</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Department</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Joined</th>
                    {isAdmin && <th className="text-right px-5 py-3 text-xs font-medium text-slate-500">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
                            {m.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{m.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {m.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge color={m.is_admin ? 'amber' : 'blue'}>{m.role_name}</Badge>
                        {m.is_admin && <span className="text-[10px] text-amber-500 ml-1.5">Admin</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {m.permissions && m.permissions.length > 0 ? (
                          <span className="text-xs text-slate-400">{m.permissions.length} overrides</span>
                        ) : (
                          <span className="text-xs text-slate-600">From role</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-sm">{m.department || '-'}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '-'}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(m)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg transition-colors" title="Edit role">
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            {!m.is_admin && (
                              <button onClick={() => setRemoveConfirm(m)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors" title="Remove">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={editMember ? 'Edit Member' : 'Add Team Member'} size="lg">
        <form onSubmit={save} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {!editMember && (
            <>
              <Input label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} name="name" required placeholder="John Doe" />
              <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} name="email" required placeholder="john@example.com" />
              <Input label="Temporary Password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} name="password" placeholder="Leave blank for 'password'" />
            </>
          )}
          <Input label="Role" value={form.role_id} onChange={e => handleRoleChange(e.target.value)} name="role_id" options={roles.map(r => ({ value: r.id, label: r.is_admin ? `${r.name} (Full Access)` : r.name }))} required />

          <Input label="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} name="department" placeholder="e.g., Camera, Sound, Direction" />

          {Object.keys(permissionsGrouped).length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Permissions Override</label>
              <p className="text-xs text-slate-600 mb-3">Fine-tune permissions for this user. Changes here override the role defaults.</p>
              <div className="space-y-3 max-h-64 overflow-y-auto bg-slate-950 rounded-lg p-3 border border-slate-800">
                {Object.entries(permissionsGrouped).map(([group, perms]) => (
                  <div key={group}>
                    <p className="text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">{group}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {perms.map(p => (
                        <label key={p.key} className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-800/50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(p.key)}
                            onChange={() => togglePermission(p.key)}
                            className="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="text-xs text-slate-300">{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-slate-900 py-3">
            <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <><Loader className="h-3.5 w-3.5 animate-spin" /> Saving...</> : editMember ? 'Update Member' : 'Add Member'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!removeConfirm} onClose={() => setRemoveConfirm(null)} title="Remove Member">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to remove <span className="font-bold text-slate-100">{removeConfirm?.name}</span> from this film?
          </p>
          <p className="text-xs text-slate-500">They will lose access to all film data. You can re-invite them later.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRemoveConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmRemove} disabled={removing}>
              {removing ? <Loader className="h-3.5 w-3.5 animate-spin" /> : 'Remove'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
