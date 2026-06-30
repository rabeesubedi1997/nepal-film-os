import React, { useState, useEffect } from 'react';
import { Activity, Plus, Edit3, Trash2, Calendar, User, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { progressService } from '../services/progressService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

const statusBadgeMap = { 'Completed': 'green', 'In Progress': 'blue', 'Not Started': 'slate', 'Postponed': 'red' };

export default function ProgressView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [updates, setUpdates] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('feed');
  const [showModal, setShowModal] = useState(false);
  const [editUpdate, setEditUpdate] = useState(null);
  const [formData, setFormData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const [progData, schedApi] = await Promise.all([
        progressService.index(filmId),
        import('../api').then(m => m.default).then(api => api.get(`/films/${filmId}/schedules`)),
      ]);
      setUpdates(progData || []);
      setScenes(schedApi.data.scenes || []);
      setSchedules(schedApi.data.schedules || []);
    } catch (err) { console.error('Failed to load progress:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const openCreate = () => {
    setEditUpdate(null);
    setFormData({ scene_id: '', schedule_id: '', status: 'In Progress', notes: '', scenes_completed: 'false', pages_completed: '0' });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUpdate(u);
    setFormData({ scene_id: String(u.scene_id), schedule_id: String(u.schedule_id), status: u.status, notes: u.notes || '', scenes_completed: String(u.scenes_completed || false), pages_completed: String(u.pages_completed || 0) });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = {
        scene_id: parseInt(formData.scene_id), schedule_id: parseInt(formData.schedule_id),
        status: formData.status, notes: formData.notes,
        scenes_completed: formData.scenes_completed === 'true',
        pages_completed: parseFloat(formData.pages_completed),
      };
      if (editUpdate) {
        await progressService.update(filmId, editUpdate.id, data);
      } else {
        await progressService.store(filmId, data);
      }
      setShowModal(false);
      fetchData();
      addToast(editUpdate ? 'Progress updated' : 'Progress logged');
    } catch (err) { console.error('Failed to save progress:', err); addToast('Failed to save progress', 'error'); }
  };

  const deleteUpdate = async (id) => {
    if (!confirm('Delete this progress update?')) return;
    try { await progressService.destroy(filmId, id); fetchData(); addToast('Progress update deleted'); } catch (err) { console.error(err); addToast('Failed to delete update', 'error'); }
  };

  const [scenesCompleted, totalScenes] = [scenes.filter(s => s.status === 'Completed').length, scenes.length];
  const totalPages = scenes.reduce((s, sc) => s + (sc.page_count || 0), 0);
  const pagesShot = scenes.filter(sc => sc.status === 'Completed').reduce((s, sc) => s + (sc.page_count || 0), 0);

  const paginatedUpdates = updates.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedScenes = scenes.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalUpdatesPages = Math.ceil(updates.length / pageSize);
  const totalScenesPages = Math.ceil(scenes.length / pageSize);

  useEffect(() => { setCurrentPage(1); }, [tab, updates, scenes]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-400" /> Set Progress
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''}</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Log Update</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Scenes Completed', value: `${scenesCompleted}/${totalScenes}`, sub: `${totalScenes ? Math.round(scenesCompleted / totalScenes * 100) : 0}% done`, color: 'text-emerald-400' },
          { label: 'Pages Shot', value: `${pagesShot.toFixed(1)}/${totalPages.toFixed(1)}`, sub: 'Script pages', color: 'text-blue-400' },
          { label: 'Updates Logged', value: `${updates.length}`, sub: 'Total entries', color: 'text-amber-400' },
          { label: 'In Progress', value: `${scenes.filter(s => s.status === 'In Progress').length}`, sub: 'Scenes shooting', color: 'text-purple-400' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold">{k.label}</p>
            <p className={`text-xl font-black mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {[['feed', 'Activity Feed'], ['tracker', 'Scene Tracker']].map(([v, label]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === v ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>{label}</button>
        ))}
      </div>

      {tab === 'feed' && (
        <div className="space-y-3">
          {updates.length === 0 && <div className="text-center py-12 text-slate-500 text-sm">No progress updates yet.</div>}
          {paginatedUpdates.map(u => (
            <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`h-3 w-3 rounded-full mt-1.5 ${u.status === 'Completed' ? 'bg-emerald-400' : u.status === 'In Progress' ? 'bg-blue-400' : 'bg-slate-600'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded">Sc {u.scene?.scene_number || '?'}</span>
                      <Badge color={statusBadgeMap[u.status] || 'slate'}>{u.status}</Badge>
                    </div>
                    <p className="text-sm font-bold text-slate-200 mt-1">{u.scene?.scene_heading || 'Unknown scene'}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {u.reporter?.name || 'Unknown'}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(u.created_at).toLocaleString()}</span>
                      {u.pages_completed > 0 && <span className="flex items-center gap-1"><Camera className="h-3 w-3" /> {u.pages_completed} pages</span>}
                    </div>
                    {u.notes && <p className="text-xs text-slate-400 mt-2 bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">{u.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(u)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteUpdate(u.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {updates.length > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalUpdatesPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={updates.length} showPageSizeSelector onPageSizeChange={setPageSize} />
          )}
        </div>
      )}

      {tab === 'tracker' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800">
            <p className="text-sm font-bold text-slate-200">Scene Status Overview</p>
          </div>
          <div className="divide-y divide-slate-800">
            {scenes.length === 0 && <div className="px-5 py-8 text-center text-slate-500 text-sm">No scenes yet.</div>}
            {paginatedScenes.map(sc => {
              const updatesForScene = updates.filter(u => u.scene_id === sc.id);
              const shotPages = updatesForScene.filter(u => u.status === 'Completed').reduce((s, u) => s + (u.pages_completed || 0), 0);
              const actualPct = sc.page_count > 0 ? Math.min(100, Math.round((shotPages / sc.page_count) * 100)) : 0;
              return (
                <div key={sc.id} className="px-5 py-3.5 hover:bg-slate-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-400 font-mono">#{sc.scene_number}</span>
                      <span className="text-sm font-semibold text-slate-200">{sc.scene_heading}</span>
                    </div>
                    <Badge color={statusBadgeMap[sc.status] || 'slate'}>{sc.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-1.5">
                    <span>Planned: {sc.page_count}p</span>
                    <span>Shot: {shotPages.toFixed(1)}p</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${actualPct >= 100 ? 'bg-emerald-500' : actualPct > 0 ? 'bg-blue-500' : 'bg-slate-700'}`} style={{ width: `${actualPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {scenes.length > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalScenesPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={scenes.length} showPageSizeSelector onPageSizeChange={setPageSize} />
          )}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editUpdate ? 'Edit Progress Update' : 'Log Progress Update'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Scene" value={formData.scene_id} onChange={e => setFormData(f => ({ ...f, scene_id: e.target.value }))} name="scene_id" required
            options={scenes.map(s => ({ value: String(s.id), label: `#${s.scene_number} - ${s.scene_heading}` }))} />
          <Input label="Schedule Day" value={formData.schedule_id} onChange={e => setFormData(f => ({ ...f, schedule_id: e.target.value }))} name="schedule_id" required
            options={schedules.map(s => ({ value: String(s.id), label: `Day ${s.day_number} - ${s.shoot_date ? new Date(s.shoot_date).toLocaleDateString() : ''}` }))} />
          <Input label="Status" value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))} name="status" options={['Not Started', 'In Progress', 'Completed', 'Postponed']} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Pages Completed" type="number" step="0.1" value={formData.pages_completed} onChange={e => setFormData(f => ({ ...f, pages_completed: e.target.value }))} name="pages_completed" />
            <Input label="Scenes Completed?" value={formData.scenes_completed} onChange={e => setFormData(f => ({ ...f, scenes_completed: e.target.value }))} name="scenes_completed" options={['false', 'true']} />
          </div>
          <Input label="Notes" value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} name="notes" placeholder="Director notes, observations..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editUpdate ? 'Update' : 'Log'} Update</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
