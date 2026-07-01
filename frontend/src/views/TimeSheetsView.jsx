import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit3, Trash2, CheckCircle, XCircle, Send, User, Calendar, Coffee } from 'lucide-react';
import { timeSheetService } from '../services/timeSheetService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

const statusColors = {
  draft: 'slate',
  submitted: 'amber',
  approved: 'green',
  rejected: 'red',
};

export default function TimeSheetsView() {
  const { currentFilm, user, userRole, userIsAdmin, userPermissions } = useAuthStore();
  const canApprove = userIsAdmin || user?.is_super_admin || (userPermissions || []).includes('timesheet.approve');
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSheet, setEditSheet] = useState(null);
  const [formData, setFormData] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await timeSheetService.index(filmId);
      setTimesheets(data || []);
    } catch (err) { console.error('Failed to load timesheets:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditSheet(null);
    setFormData({ user_id: '', shoot_date: new Date().toISOString().split('T')[0], check_in: '08:00', check_out: '18:00', break_minutes: '60', notes: '' });
    setShowModal(true);
  };

  const openEdit = (ts) => {
    if (ts.status !== 'draft') return;
    setEditSheet(ts);
    setFormData({
      user_id: ts.user_id, shoot_date: ts.shoot_date?.split('T')[0] || '',
      check_in: ts.check_in || '', check_out: ts.check_out || '',
      break_minutes: String(ts.break_minutes || 60), notes: ts.notes || '',
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, break_minutes: parseInt(formData.break_minutes) };
      if (editSheet) {
        await timeSheetService.update(filmId, editSheet.id, data);
      } else {
        await timeSheetService.store(filmId, data);
      }
      setShowModal(false);
      fetchData();
      addToast(editSheet ? 'Timesheet updated' : 'Timesheet entry created');
    } catch (err) { console.error('Failed to save timesheet:', err); addToast('Failed to save timesheet', 'error'); }
  };

  const deleteSheet = async (id) => {
    if (!confirm('Delete this timesheet?')) return;
    try { await timeSheetService.destroy(filmId, id); fetchData(); addToast('Timesheet deleted'); } catch (err) { console.error(err); addToast('Failed to delete timesheet', 'error'); }
  };

  const submitSheet = async (id) => {
    try { await timeSheetService.submit(filmId, id); fetchData(); addToast('Timesheet submitted for approval'); } catch (err) { console.error(err); addToast('Failed to submit timesheet', 'error'); }
  };

  const approveSheet = async (id) => {
    try { await timeSheetService.approve(filmId, id); fetchData(); addToast('Timesheet approved'); } catch (err) { console.error(err); addToast('Failed to approve timesheet', 'error'); }
  };

  const openReject = (id) => {
    setRejectModal(id);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await timeSheetService.reject(filmId, rejectModal, { rejection_reason: rejectReason });
      setRejectModal(null);
      fetchData();
      addToast('Timesheet rejected');
    } catch (err) { console.error(err); addToast('Failed to reject timesheet', 'error'); }
  };

  const calcHours = (ts) => {
    if (!ts.check_in || !ts.check_out) return 0;
    const [hi, mi] = ts.check_in.split(':').map(Number);
    const [ho, mo] = ts.check_out.split(':').map(Number);
    const total = (ho * 60 + mo) - (hi * 60 + mi) - (ts.break_minutes || 0);
    return Math.max(0, total / 60);
  };

  const filtered = timesheets.filter(ts => statusFilter === 'All' || ts.status === statusFilter);

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  useEffect(() => { setCurrentPage(1); }, [statusFilter]);

  const totalEntries = filtered.length;
  const totalHours = filtered.reduce((s, t) => s + calcHours(t), 0);
  const totalOvertime = filtered.filter(t => calcHours(t) > 8).reduce((s, t) => s + (calcHours(t) - 8), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" /> Time Sheets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · {timesheets.length} entries</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> New Entry</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Entries</p>
          <p className="text-xl font-black text-slate-100 mt-1">{filtered.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Total Hours</p>
          <p className="text-xl font-black text-amber-400 mt-1">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Overtime</p>
          <p className="text-xl font-black text-rose-400 mt-1">{totalOvertime.toFixed(1)}h</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {['All', 'draft', 'submitted', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${statusFilter === s ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)} <span className="ml-1 opacity-60">({timesheets.filter(ts => s === 'All' ? true : ts.status === s).length})</span>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase font-black">User</th>
                <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase font-black">Date</th>
                <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase font-black">In</th>
                <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase font-black">Out</th>
                <th className="px-4 py-3 text-right text-[10px] text-slate-500 uppercase font-black">Hours</th>
                <th className="px-4 py-3 text-center text-[10px] text-slate-500 uppercase font-black">Status</th>
                <th className="px-4 py-3 text-center text-[10px] text-slate-500 uppercase font-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">No time sheets found.</td></tr>}
              {paginated.map(ts => {
                const hours = calcHours(ts);
                const isCreator = user?.id === ts.user_id;
                    const isApprover = canApprove;
                return (
                  <tr key={ts.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-semibold text-slate-200 text-xs">{ts.user?.name || `User #${ts.user_id}`}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{ts.shoot_date ? new Date(ts.shoot_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{ts.check_in || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{ts.check_out || '—'}</td>
                    <td className="px-4 py-3 text-right font-black font-mono text-sm">
                      <span className={hours > 8 ? 'text-rose-400' : 'text-slate-100'}>{hours.toFixed(1)}h</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge color={statusColors[ts.status] || 'slate'}>{ts.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {ts.status === 'draft' && isCreator && (
                          <button onClick={() => submitSheet(ts.id)} className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg" title="Submit for Approval">
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {ts.status === 'submitted' && isApprover && (
                          <>
                            <button onClick={() => approveSheet(ts.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg" title="Approve">
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => openReject(ts.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg" title="Reject">
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {(ts.status === 'approved' || ts.status === 'rejected') && ts.approver && (
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {ts.status === 'approved' ? 'by ' : ''}{ts.approver.name}
                          </span>
                        )}
                        {ts.status === 'draft' && (
                          <button onClick={() => openEdit(ts)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg"><Edit3 className="h-3.5 w-3.5" /></button>
                        )}
                        {ts.status === 'draft' && (
                          <button onClick={() => deleteSheet(ts.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={filtered.length} showPageSizeSelector onPageSizeChange={setPageSize} />
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editSheet ? 'Edit Time Sheet' : 'New Time Sheet Entry'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="User ID" type="number" value={formData.user_id} onChange={handleInput} name="user_id" required placeholder="User ID" />
          <Input label="Shoot Date" type="date" value={formData.shoot_date} onChange={handleInput} name="shoot_date" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Check In" type="time" value={formData.check_in} onChange={handleInput} name="check_in" required />
            <Input label="Check Out" type="time" value={formData.check_out} onChange={handleInput} name="check_out" required />
          </div>
          <Input label="Break Minutes" type="number" value={formData.break_minutes} onChange={handleInput} name="break_minutes" placeholder="e.g., 60" />
          <Input label="Notes" value={formData.notes} onChange={handleInput} name="notes" placeholder="Optional notes" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editSheet ? 'Update' : 'Save'} Entry</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Timesheet">
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Provide a reason for rejecting this timesheet entry.</p>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-h-[100px]"
            placeholder="Reason for rejection..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={confirmReject} disabled={!rejectReason.trim()}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
