import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit3, Trash2, Calendar, Users, Clock } from 'lucide-react';
import { dprService } from '../services/dprService';
import { scheduleService } from '../services/scheduleService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

export default function DPRView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [reports, setReports] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [formData, setFormData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const [reportData, scheduleData] = await Promise.all([
        dprService.index(filmId),
        scheduleService.index(filmId).catch(() => ({ schedules: [] })),
      ]);
      setReports(reportData || []);
      setSchedules(scheduleData.schedules || []);
    } catch (err) {
      console.error('Failed to load DPRs:', err);
      addToast('Failed to load DPRs', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  // A DPR belongs to one shoot day (schedule); picking the day fills in its
  // date instead of letting the two drift apart, and — critically — sends
  // the schedule_id the backend actually requires (this used to be missing
  // from the form entirely, so every "Create Report" submit failed).
  const handleScheduleChange = (e) => {
    const scheduleId = e.target.value;
    const schedule = schedules.find(s => String(s.id) === scheduleId);
    setFormData(f => ({
      ...f,
      schedule_id: scheduleId,
      report_date: schedule?.shoot_date?.split('T')[0] || f.report_date,
    }));
  };

  const openCreate = () => {
    setEditReport(null);
    setFormData({
      schedule_id: '', report_date: new Date().toISOString().split('T')[0],
      scenes_scheduled: '0', scenes_completed: '0', pages_scheduled: '0', pages_completed: '0',
      crew_count: '0', total_hours: '0', daily_expenses: '0', notes_director: '', notes_pm: '',
    });
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditReport(r);
    setFormData({
      schedule_id: r.schedule_id ? String(r.schedule_id) : '',
      report_date: r.report_date?.split('T')[0] || '',
      scenes_scheduled: String(r.scenes_scheduled || 0),
      scenes_completed: String(r.scenes_completed || 0),
      pages_scheduled: String(r.pages_scheduled || 0),
      pages_completed: String(r.pages_completed || 0),
      crew_count: String(r.crew_count || 0),
      total_hours: String(r.total_hours || 0),
      daily_expenses: String(r.daily_expenses || 0),
      notes_director: r.notes_director || '',
      notes_pm: r.notes_pm || '',
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        schedule_id: formData.schedule_id ? Number(formData.schedule_id) : null,
        scenes_scheduled: parseInt(formData.scenes_scheduled) || 0,
        scenes_completed: parseInt(formData.scenes_completed) || 0,
        pages_scheduled: parseFloat(formData.pages_scheduled) || 0,
        pages_completed: parseFloat(formData.pages_completed) || 0,
        crew_count: parseInt(formData.crew_count) || 0,
        total_hours: parseFloat(formData.total_hours) || 0,
        daily_expenses: parseFloat(formData.daily_expenses) || 0,
      };
      if (editReport) {
        // schedule_id can't be changed after creation (the backend's
        // update() doesn't accept it either — a DPR stays tied to the
        // shoot day it was created for).
        delete data.schedule_id;
        await dprService.update(filmId, editReport.id, data);
      } else {
        if (!data.schedule_id) { addToast('Select a shoot day first', 'error'); return; }
        await dprService.store(filmId, data);
      }
      setShowModal(false);
      fetchData();
      addToast(editReport ? 'DPR updated' : 'DPR created');
    } catch (err) { console.error('Failed to save DPR:', err); addToast('Failed to save DPR', 'error'); }
  };

  const deleteReport = async (id) => {
    if (!confirm('Delete this DPR?')) return;
    try { await dprService.destroy(filmId, id); setSelectedId(null); fetchData(); addToast('DPR deleted'); } catch (err) { console.error(err); addToast('Failed to delete DPR', 'error'); }
  };

  const calcCompletion = (r) => {
    const sched = r.scenes_scheduled || 0;
    return sched > 0 ? Math.round(((r.scenes_completed || 0) / sched) * 100) : 0;
  };

  const paginatedReports = reports.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(reports.length / pageSize);

  useEffect(() => { setCurrentPage(1); }, [reports]);

  const selected = reports.find(r => r.id === selectedId);
  const totalReports = reports.length;
  const avgCompletion = reports.length > 0 ? Math.round(reports.reduce((s, r) => s + calcCompletion(r), 0) / reports.length) : 0;
  const totalHours = reports.reduce((s, r) => s + (Number(r.total_hours) || 0), 0);

  // Shoot days that don't already have a report — the create form only
  // offers those (a DPR is 1:1 with a schedule day).
  const availableSchedules = schedules.filter(s => !reports.some(r => r.schedule_id === s.id));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-400" /> Daily Production Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · {totalReports} reports</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> New Report</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Total Reports</p>
          <p className="text-xl font-black text-slate-100 mt-1">{totalReports}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Avg Completion</p>
          <p className="text-xl font-black text-amber-400 mt-1">{avgCompletion}%</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Total Hours</p>
          <p className="text-xl font-black text-blue-400 mt-1">{totalHours.toFixed(1)}h</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">All Reports</p>
          {reports.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">No reports yet.</div>}
          {paginatedReports.map(r => (
            <button key={r.id} onClick={() => setSelectedId(r.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selectedId === r.id ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg"><Calendar className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{r.report_date ? new Date(r.report_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'No date'}</p>
                  <p className="text-xs text-slate-500">{r.scenes_completed || 0}/{r.scenes_scheduled || 0} scenes · {calcCompletion(r)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${calcCompletion(r) >= 80 ? 'bg-emerald-500' : calcCompletion(r) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${calcCompletion(r)}%` }} />
                </div>
                <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="p-1 text-slate-500 hover:text-amber-400"><Edit3 className="h-3 w-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteReport(r.id); }} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            </button>
          ))}
          {reports.length > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={reports.length} showPageSizeSelector onPageSizeChange={setPageSize} />
          )}
        </div>

        <div className="lg:col-span-2">
          {!selected && <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500"><FileText className="h-12 w-12 mx-auto mb-3 opacity-30" /><p className="font-semibold">Select a report to view details</p></div>}

          {selected && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-100">DPR — {selected.report_date ? new Date(selected.report_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</h2>
                  </div>
                  <Badge color={calcCompletion(selected) >= 80 ? 'green' : calcCompletion(selected) >= 50 ? 'amber' : 'red'}>{calcCompletion(selected)}% Complete</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Scenes</p>
                    <p className="text-sm font-black text-slate-100">{selected.scenes_completed || 0} <span className="text-xs text-slate-500 font-semibold">/ {selected.scenes_scheduled || 0}</span></p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Pages</p>
                    <p className="text-sm font-black text-slate-100">{selected.pages_completed || 0} <span className="text-xs text-slate-500 font-semibold">/ {selected.pages_scheduled || 0}</span></p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Crew</p>
                    <p className="text-sm font-black text-amber-400 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {selected.crew_count || 0}</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Hours</p>
                    <p className="text-sm font-black text-blue-400 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selected.total_hours || 0}h</p>
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-lg p-3 mb-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Expenses Incurred</p>
                  <p className="text-sm font-black text-rose-400">NPR {Number(selected.daily_expenses || 0).toLocaleString()}</p>
                </div>

                {selected.notes_director && (
                  <div className="bg-slate-800/60 rounded-lg p-3 mb-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Director's Notes</p>
                    <p className="text-xs text-slate-300 mt-1">{selected.notes_director}</p>
                  </div>
                )}
                {selected.notes_pm && (
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Production Manager's Notes</p>
                    <p className="text-xs text-slate-300 mt-1">{selected.notes_pm}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editReport ? 'Edit DPR' : 'Create Daily Production Report'}>
        <form onSubmit={save} className="space-y-4">
          {editReport ? (
            <Input label="Shoot Date" type="date" value={formData.report_date} onChange={handleInput} name="report_date" required />
          ) : (
            <Input label="Shoot Day" value={formData.schedule_id} onChange={handleScheduleChange} name="schedule_id" required
              options={[
                { value: '', label: availableSchedules.length ? 'Select a shoot day…' : 'No shoot days available' },
                ...availableSchedules.map(s => ({
                  value: String(s.id),
                  label: `Day ${s.day_number ?? '?'} — ${s.shoot_date ? new Date(s.shoot_date).toLocaleDateString() : 'no date'}`,
                })),
              ]} />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Scenes Scheduled" type="number" value={formData.scenes_scheduled} onChange={handleInput} name="scenes_scheduled" required />
            <Input label="Scenes Completed" type="number" value={formData.scenes_completed} onChange={handleInput} name="scenes_completed" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Pages Scheduled" type="number" value={formData.pages_scheduled} onChange={handleInput} name="pages_scheduled" required />
            <Input label="Pages Completed" type="number" value={formData.pages_completed} onChange={handleInput} name="pages_completed" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Crew Count" type="number" value={formData.crew_count} onChange={handleInput} name="crew_count" required />
            <Input label="Hours Worked" type="number" step="0.5" value={formData.total_hours} onChange={handleInput} name="total_hours" required />
          </div>
          <Input label="Expenses Incurred (NPR)" type="number" value={formData.daily_expenses} onChange={handleInput} name="daily_expenses" required />
          <Input label="Director's Notes" value={formData.notes_director} onChange={handleInput} name="notes_director" placeholder="Notes for the director" />
          <Input label="Production Manager's Notes" value={formData.notes_pm} onChange={handleInput} name="notes_pm" placeholder="Notes for the PM" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editReport ? 'Update' : 'Create'} Report</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
