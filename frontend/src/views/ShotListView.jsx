import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Plus, Edit3, Trash2, Film, Image, Move, ZoomIn, Target } from 'lucide-react';
import { shotListService } from '../services/shotListService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

const shotTypeOptions = ['Close-up', 'Medium', 'Wide', 'Extreme Close-up', 'Cowboy', 'Two-shot', 'Over-the-shoulder', 'Insert', 'Establishing', 'POV'];
const angleOptions = ['Eye Level', 'High Angle', 'Low Angle', 'Dutch Angle', 'Bird\'s-eye', 'Worm\'s-eye', 'Overhead'];
const lensOptions = ['Prime 24mm', 'Prime 35mm', 'Prime 50mm', 'Prime 85mm', 'Prime 100mm', 'Zoom 24-70mm', 'Zoom 70-200mm', 'Wide 16mm', 'Fisheye', 'Macro'];
const movementOptions = ['Static', 'Pan', 'Tilt', 'Dolly In', 'Dolly Out', 'Tracking', 'Crane', 'Handheld', 'Steadicam', 'Zoom', 'Whip Pan'];

const statusBadgeMap = { 'Not Started': 'slate', 'Ready': 'blue', 'Completed': 'green', 'B-Roll': 'purple' };

export default function ShotListView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [shots, setShots] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editShot, setEditShot] = useState(null);
  const [formData, setFormData] = useState({});
  const [expandedScene, setExpandedScene] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredShots = useMemo(() => shots.filter(s => {
    const matchSearch = s.description?.toLowerCase().includes(search.toLowerCase()) || 
                        s.shot_type?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchStatus;
  }), [shots, search, statusFilter]);

  const totalPages = Math.ceil(filteredShots.length / pageSize) || 1;
  const paginatedShots = filteredShots.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const handlePageSizeChange = (size) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await shotListService.index(filmId);
      setShots(data.shots || data || []);
      if (data.scenes) setScenes(data.scenes);
    } catch (err) {
      console.error('Failed to load shot list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const openCreate = (sceneId) => {
    setEditShot(null);
    setFormData({ scene_id: sceneId || '', shot_number: shots.length + 1, shot_type: 'Medium', angle: 'Eye Level', lens: 'Prime 50mm', movement: 'Static', description: '', duration_seconds: '5', storyboard_url: '', status: 'Not Started' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditShot(s);
    setFormData({
      scene_id: s.scene_id || '',
      shot_number: s.shot_number || '',
      shot_type: s.shot_type || 'Medium',
      angle: s.angle || 'Eye Level',
      lens: s.lens || 'Prime 50mm',
      movement: s.movement || 'Static',
      description: s.description || '',
      duration_seconds: String(s.duration_seconds || 5),
      storyboard_url: s.storyboard_url || '',
      status: s.status || 'Not Started',
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, duration_seconds: parseInt(formData.duration_seconds) || 5 };
      if (editShot) {
        await shotListService.update(filmId, editShot.id, data);
      } else {
        await shotListService.store(filmId, data);
      }
      setShowModal(false);
      fetchData();
      addToast(editShot ? 'Shot updated' : 'Shot created');
    } catch (err) { console.error('Failed to save shot:', err); addToast('Failed to save shot', 'error'); }
  };

  const deleteShot = async (id) => {
    if (!confirm('Delete this shot?')) return;
    try { await shotListService.destroy(filmId, id); fetchData(); addToast('Shot deleted'); } catch (err) { console.error(err); addToast('Failed to delete shot', 'error'); }
  };

  const shotsByScene = {};
  shots.forEach(s => {
    const key = s.scene_id || 'unknown';
    if (!shotsByScene[key]) shotsByScene[key] = [];
    shotsByScene[key].push(s);
  });

  const totalCompleted = shots.filter(s => s.status === 'Completed').length;
  const totalDuration = shots.reduce((sum, s) => sum + (parseInt(s.duration_seconds) || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Camera className="h-5 w-5 text-amber-400" /> Shot List
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · {shots.length} shots · {(totalDuration / 60).toFixed(1)}min total</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Shots', value: shots.length, sub: 'Across all scenes', color: 'text-amber-400' },
          { label: 'Completed', value: `${totalCompleted}/${shots.length}`, sub: `${shots.length ? Math.round(totalCompleted / shots.length * 100) : 0}% done`, color: 'text-emerald-400' },
          { label: 'Scenes', value: Object.keys(shotsByScene).length, sub: 'With shot breakdowns', color: 'text-blue-400' },
          { label: 'Total Duration', value: `${(totalDuration / 60).toFixed(1)}m`, sub: `${totalDuration}s of footage`, color: 'text-purple-400' },
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
          <input type="text" placeholder="Search shots..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
          <option value="All">All Status</option>
          {Object.keys(statusBadgeMap).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {paginatedShots.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <Camera className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No shots found</p>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(shotsByScene).map(([sceneId, sceneShots]) => {
          const scene = scenes.find(s => String(s.id) === String(sceneId));
          const filteredSceneShots = sceneShots.filter(s => 
            (search === '' || s.description?.toLowerCase().includes(search.toLowerCase()) || s.shot_type?.toLowerCase().includes(search.toLowerCase())) &&
            (statusFilter === 'All' || s.status === statusFilter)
          );
          const sceneCompleted = sceneShots.filter(s => s.status === 'Completed').length;
          return (
            <div key={sceneId} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <button onClick={() => setExpandedScene(expandedScene === sceneId ? null : sceneId)}
                className="w-full px-5 py-3 flex items-center justify-between bg-slate-800/40 border-b border-slate-800 hover:bg-slate-800/60 transition-colors">
                <div className="flex items-center gap-3">
                  <Film className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-bold text-slate-200">{scene ? `Scene ${scene.scene_number}` : `Scene #${sceneId}`}</span>
                  {scene?.scene_heading && <span className="text-xs text-slate-500">{scene.scene_heading}</span>}
                  <span className="text-xs text-slate-500">· {filteredSceneShots.length} shots</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{sceneCompleted}/{sceneShots.length} done</span>
                  <button onClick={(e) => { e.stopPropagation(); openCreate(sceneId); }} className="p-1 text-slate-500 hover:text-amber-400"><Plus className="h-4 w-4" /></button>
                </div>
              </button>

              {expandedScene === sceneId && (
                <div className="divide-y divide-slate-800/60">
                  {filteredSceneShots.map(shot => (
                    <div key={shot.id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-center w-8 shrink-0">
                          <span className="text-xs font-black text-slate-400 font-mono">#{shot.shot_number}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">{shot.shot_type}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><Move className="h-3 w-3" /> {shot.movement}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><Target className="h-3 w-3" /> {shot.angle}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><ZoomIn className="h-3 w-3" /> {shot.lens}</span>
                          {shot.duration_seconds && <span className="text-[10px] text-slate-500">{shot.duration_seconds}s</span>}
                        </div>
                        {shot.description && <p className="text-xs text-slate-500 flex-1 min-w-0 truncate hidden sm:block">{shot.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {shot.storyboard_url && (
                          <a href={shot.storyboard_url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-500 hover:text-blue-400 rounded-lg transition-colors" title="View storyboard">
                            <Image className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <Badge color={statusBadgeMap[shot.status] || 'slate'}>{shot.status}</Badge>
                        <button onClick={() => openEdit(shot)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteShot(shot.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageSize={pageSize}
          totalItems={filteredShots.length}
          showPageSizeSelector
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editShot ? 'Edit Shot' : 'Add New Shot'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Scene" value={formData.scene_id} onChange={handleInput} name="scene_id" options={scenes.map(s => ({ value: String(s.id), label: `Sc ${s.scene_number} - ${s.scene_heading || ''}` }))} />
            <Input label="Shot Number" type="number" value={formData.shot_number} onChange={handleInput} name="shot_number" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Shot Type" value={formData.shot_type} onChange={handleInput} name="shot_type" options={shotTypeOptions} />
            <Input label="Camera Angle" value={formData.angle} onChange={handleInput} name="angle" options={angleOptions} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Lens" value={formData.lens} onChange={handleInput} name="lens" options={lensOptions} />
            <Input label="Movement" value={formData.movement} onChange={handleInput} name="movement" options={movementOptions} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (sec)" type="number" value={formData.duration_seconds} onChange={handleInput} name="duration_seconds" />
            <Input label="Status" value={formData.status} onChange={handleInput} name="status" options={Object.keys(statusBadgeMap)} />
          </div>
          <Input label="Description" value={formData.description} onChange={handleInput} name="description" placeholder="What happens in this shot..." />
          <Input label="Storyboard Image URL" value={formData.storyboard_url} onChange={handleInput} name="storyboard_url" placeholder="https://example.com/storyboard.jpg" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editShot ? 'Update' : 'Create'} Shot</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
