import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Search, Phone, Mail, MessageCircle, Download, Edit3, Trash2 } from 'lucide-react';
import { castCrewService } from '../services/castCrewService';
import { useAuthStore } from '../authStore';
import { useToastStore } from '../toastStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import Pagination from '../components/Pagination';

export default function CastCrewView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [formData, setFormData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => members.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.role_name?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All' || p.department === deptFilter;
    const matchType = typeFilter === 'All' || p.role_type === typeFilter;
    return matchSearch && matchDept && matchType;
  }), [members, search, deptFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const handlePageSizeChange = (size) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await castCrewService.index(filmId);
      setMembers(data || []);
    } catch (err) {
      console.error('Failed to load cast/crew:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditMember(null);
    setFormData({ name: '', role_type: 'Crew', role_name: '', department: '', character_name: '', contact_phone: '', contact_email: '', whatsapp: '', emergency_contact_name: '', emergency_contact_phone: '', contract_status: 'Pending', day_rates: '0' });
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditMember(m);
    setFormData({
      name: m.name, role_type: m.role_type, role_name: m.role_name, department: m.department || '',
      character_name: m.character_name || '', contact_phone: m.contact_phone || '',
      contact_email: m.contact_email || '', whatsapp: m.whatsapp || '',
      emergency_contact_name: m.emergency_contact_name || '', emergency_contact_phone: m.emergency_contact_phone || '',
      contract_status: m.contract_status || 'Pending', day_rates: String(m.day_rates || 0),
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, day_rates: parseFloat(formData.day_rates) || 0 };
      if (editMember) {
        await castCrewService.update(filmId, editMember.id, data);
        addToast('Member updated successfully');
      } else {
        await castCrewService.store(filmId, data);
        addToast('Member added successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (err) { addToast('Failed to save member', 'error'); console.error('Failed to save member:', err); }
  };

  const deleteMember = async (id) => {
    if (!confirm('Delete this member?')) return;
    try { await castCrewService.destroy(filmId, id); setSelected(null); fetchData(); addToast('Member deleted'); } catch (err) { addToast('Failed to delete member', 'error'); console.error(err); }
  };

  const departments = ['All', ...new Set(members.map(p => p.department).filter(Boolean))];
  const totalPayroll = members.reduce((s, p) => s + (p.day_rates || 0), 0);
  const signed = members.filter(p => p.contract_status === 'Signed').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" /> Cast & Crew Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · {members.filter(m => m.role_type === 'Cast').length} cast · {members.filter(m => m.role_type === 'Crew').length} crew</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add Member</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Members', value: members.length, sub: 'Cast + Crew', color: 'text-purple-400' },
          { label: 'Contracts Signed', value: `${signed}/${members.length}`, sub: `${members.length - signed} pending`, color: 'text-emerald-400' },
          { label: 'Daily Payroll', value: `NPR ${(totalPayroll / 1000).toFixed(0)}K`, sub: 'Per day total', color: 'text-amber-400' },
          { label: 'Departments', value: `${new Set(members.map(m => m.department).filter(Boolean)).size}`, sub: 'Active', color: 'text-blue-400' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold">{k.label}</p>
            <p className={`text-xl font-black mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input type="text" placeholder="Search by name or role..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            {['All', 'Cast', 'Crew'].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-2 text-xs font-bold transition-all ${typeFilter === t ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>{t}</button>
            ))}
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {paginated.map(person => (
          <div key={person.id} onClick={() => setSelected(selected?.id === person.id ? null : person)}
            className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-slate-600 ${selected?.id === person.id ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800'}`}>
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center font-black text-white text-sm shrink-0">
                {person.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-200 text-sm leading-snug">{person.name}</p>
                    <p className="text-xs text-slate-400">{person.role_name}</p>
                  </div>
                  <Badge color={person.contract_status === 'Signed' ? 'green' : 'amber'}>{person.contract_status || 'Pending'}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-semibold">{person.department}</span>
                  {person.character_name && <span className="text-[10px] text-purple-400 font-semibold">as {person.character_name}</span>}
                </div>
              </div>
            </div>

            {selected?.id === person.id && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/60 rounded-lg p-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Day Rate</p>
                    <p className="text-sm font-black text-amber-400">NPR {(person.day_rates || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Type</p>
                    <p className="text-sm font-bold text-slate-200">{person.role_type}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {person.contact_phone && <a href={`tel:${person.contact_phone}`} className="flex items-center gap-2 text-xs text-slate-300 hover:text-amber-400"><Phone className="h-3.5 w-3.5 text-slate-500" /> {person.contact_phone}</a>}
                  {person.contact_email && <a href={`mailto:${person.contact_email}`} className="flex items-center gap-2 text-xs text-slate-300 hover:text-amber-400"><Mail className="h-3.5 w-3.5 text-slate-500" /> {person.contact_email}</a>}
                  {person.whatsapp && <a href={`https://wa.me/${person.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(person)} className="flex-1 text-amber-400"><Edit3 className="h-3.5 w-3.5" /> Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => deleteMember(person.id)} className="flex-1"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No members found</p>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageSize={pageSize}
          totalItems={filtered.length}
          showPageSizeSelector
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editMember ? `Edit ${editMember.name}` : 'Add New Member'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Full Name" value={formData.name} onChange={handleInput} name="name" required placeholder="e.g., Saugat Malla" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Role Type" value={formData.role_type} onChange={e => {
              setFormData(f => ({ ...f, role_type: e.target.value, department: e.target.value === 'Cast' ? 'Cast' : f.department }));
            }} name="role_type" options={['Cast', 'Crew']} />
            <Input label="Role Name" value={formData.role_name} onChange={handleInput} name="role_name" required placeholder="e.g., Lead Actor, DOP" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department" value={formData.department} onChange={handleInput} name="department" placeholder="e.g., Camera, Art" />
            <Input label="Character Name" value={formData.character_name} onChange={handleInput} name="character_name" placeholder="Only for cast" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={formData.contact_phone} onChange={handleInput} name="contact_phone" placeholder="9841XXXXXX" />
            <Input label="Email" value={formData.contact_email} onChange={handleInput} name="contact_email" placeholder="email@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="WhatsApp" value={formData.whatsapp} onChange={handleInput} name="whatsapp" placeholder="9841XXXXXX" />
            <Input label="Day Rate (NPR)" type="number" value={formData.day_rates} onChange={handleInput} name="day_rates" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Emergency Contact" value={formData.emergency_contact_name} onChange={handleInput} name="emergency_contact_name" />
            <Input label="Emergency Phone" value={formData.emergency_contact_phone} onChange={handleInput} name="emergency_contact_phone" />
          </div>
          <Input label="Contract Status" value={formData.contract_status} onChange={handleInput} name="contract_status" options={['Pending', 'Signed', 'Rejected']} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editMember ? 'Update' : 'Create'} Member</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
