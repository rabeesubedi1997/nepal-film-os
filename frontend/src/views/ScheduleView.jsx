import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, Plus, ChevronRight, Edit3, Trash2, Download, Camera, Film as FilmIcon } from 'lucide-react';
import { scheduleService } from '../services/scheduleService';
import { locationService } from '../services/locationService';
import { useAuthStore } from '../authStore';
import { Modal, Input, StatCard, Badge } from '../components/ui';
import Stripboard from '../components/Stripboard';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

const statusConfig = {
  'Completed': 'green',
  'In Progress': 'blue',
  'Scheduled': 'slate',
  'Not Started': 'slate',
  'Postponed': 'red',
};

export default function ScheduleView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [schedules, setSchedules] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('schedule');
  const [expandedDay, setExpandedDay] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [editScene, setEditScene] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const [syncModal, setSyncModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedScenes, setSelectedScenes] = useState([]);

  const [formData, setFormData] = useState({});

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await scheduleService.index(filmId);
      setSchedules(data.schedules || []);
      setScenes(data.scenes || []);
      setLocations(data.locations || []);
    } catch (err) { console.error('Failed to load schedule data:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const openCreateSchedule = () => {
    setEditSchedule(null);
    setFormData({ day_number: schedules.length + 1, shoot_date: '', call_time: '06:00', wrap_time: '', location_id: '', status: 'Scheduled', notes: '' });
    setShowScheduleModal(true);
  };

  const openEditSchedule = (s) => {
    setEditSchedule(s);
    setFormData({
      day_number: s.day_number, shoot_date: s.shoot_date?.split('T')[0] || '',
      call_time: s.call_time || '', wrap_time: s.wrap_time || '',
      location_id: s.location_id || '', status: s.status || 'Scheduled', notes: s.notes || '',
    });
    setShowScheduleModal(true);
  };

  const saveSchedule = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, location_id: formData.location_id ? parseInt(formData.location_id) : null };
      if (editSchedule) {
        await scheduleService.updateSchedule(filmId, editSchedule.id, data);
      } else {
        await scheduleService.storeSchedule(filmId, data);
      }
      setShowScheduleModal(false);
      fetchData();
      addToast(editSchedule ? 'Shoot day updated' : 'Shoot day created');
    } catch (err) { console.error('Failed to save schedule:', err); addToast('Failed to save schedule', 'error'); }
  };

  const deleteSchedule = async (id) => {
    if (!confirm('Delete this shoot day?')) return;
    try { await scheduleService.destroySchedule(filmId, id); fetchData(); addToast('Shoot day deleted'); } catch (err) { console.error(err); addToast('Failed to delete schedule', 'error'); }
  };

  const openCreateScene = () => {
    setEditScene(null);
    setFormData({ scene_number: '', scene_heading: '', int_ext: 'INT', location_id: '', day_or_night: 'DAY', page_count: '1', summary: '', status: 'Not Started' });
    setShowSceneModal(true);
  };

  const openEditScene = (s) => {
    setEditScene(s);
    setFormData({
      scene_number: s.scene_number, scene_heading: s.scene_heading, int_ext: s.int_ext || 'INT',
      location_id: s.location_id || '', day_or_night: s.day_or_night || 'DAY',
      page_count: String(s.page_count || 1), summary: s.summary || '', status: s.status || 'Not Started',
    });
    setShowSceneModal(true);
  };

  const saveScene = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, page_count: parseFloat(formData.page_count) || 1, location_id: formData.location_id ? parseInt(formData.location_id) : null };
      if (editScene) {
        await scheduleService.updateScene(filmId, editScene.id, data);
      } else {
        await scheduleService.storeScene(filmId, data);
      }
      setShowSceneModal(false);
      fetchData();
      addToast(editScene ? 'Scene updated' : 'Scene created');
    } catch (err) { console.error('Failed to save scene:', err); addToast('Failed to save scene', 'error'); }
  };

  const deleteScene = async (id) => {
    if (!confirm('Delete this scene?')) return;
    try { await scheduleService.destroyScene(filmId, id); fetchData(); addToast('Scene deleted'); } catch (err) { console.error(err); addToast('Failed to delete scene', 'error'); }
  };

  const openCreateLocation = () => {
    setEditLocation(null);
    setFormData({ name: '', address: '', gps_lat: '', gps_lng: '', contact_name: '', contact_phone: '', parking_info: '', facilities_notes: '', permit_status: 'Not Required' });
    setShowLocationModal(true);
  };

  const openEditLocation = (l) => {
    setEditLocation(l);
    setFormData({
      name: l.name, address: l.address || '', gps_lat: l.gps_lat || '', gps_lng: l.gps_lng || '',
      contact_name: l.contact_name || '', contact_phone: l.contact_phone || '',
      parking_info: l.parking_info || '', facilities_notes: l.facilities_notes || '',
      permit_status: l.permit_status || 'Not Required',
    });
    setShowLocationModal(true);
  };

  const saveLocation = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null, gps_lng: formData.gps_lng ? parseFloat(formData.gps_lng) : null };
      if (editLocation) {
        await locationService.update(filmId, editLocation.id, data);
      } else {
        await locationService.store(filmId, data);
      }
      setShowLocationModal(false);
      fetchData();
      addToast(editLocation ? 'Location updated' : 'Location created');
    } catch (err) { console.error('Failed to save location:', err); addToast('Failed to save location', 'error'); }
  };

  const deleteLocation = async (id) => {
    if (!confirm('Delete this location?')) return;
    try { await locationService.destroy(filmId, id); fetchData(); addToast('Location deleted'); } catch (err) { console.error(err); addToast('Failed to delete location', 'error'); }
  };

  const openSyncModal = (schedule) => {
    setSelectedSchedule(schedule);
    setSelectedScenes(schedule.scenes?.map(s => s.id) || []);
    setSyncModal(true);
  };

  const saveSync = async () => {
    try {
      await scheduleService.addSceneToSchedule(filmId, { schedule_id: selectedSchedule.id, scene_ids: selectedScenes });
      setSyncModal(false);
      fetchData();
      addToast('Scenes synced to schedule');
    } catch (err) { console.error(err); addToast('Failed to sync scenes', 'error'); }
  };

  const handleDragSync = useCallback(async (scheduleId, sceneIds) => {
    try {
      await scheduleService.addSceneToSchedule(filmId, { schedule_id: scheduleId, scene_ids: sceneIds });
      fetchData();
    } catch (err) { addToast('Failed to reorder scenes', 'error'); }
  }, [filmId]);

  const totalScriptPages = scenes.reduce((s, sc) => s + (sc.page_count || 0), 0);
  const pagesShot = scenes.filter(sc => sc.status === 'Completed').reduce((s, sc) => s + (sc.page_count || 0), 0);

  const paginatedSchedules = schedules.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedScenes = scenes.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const scheduleTotalPages = Math.ceil(schedules.length / pageSize);
  const scenesTotalPages = Math.ceil(scenes.length / pageSize);

  useEffect(() => { setCurrentPage(1); }, [view, schedules, scenes]);
  const scenesCompleted = scenes.filter(sc => sc.status === 'Completed').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-400" /> Shooting Schedule
          </h1>
          <p className="text-sm text-slate-500">{currentFilm?.title || ''} · {schedules.length} shoot days</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreateLocation} className="btn btn-secondary btn-sm"><MapPin className="h-3.5 w-3.5" /> Location</button>
          <button onClick={openCreateSchedule} className="btn btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> Add Day</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Shoot Days" value={schedules.length.toString()} sub="Days scheduled" color="text-amber-400" />
        <StatCard label="Scenes Completed" value={`${scenesCompleted}/${scenes.length}`} sub={`${scenes.length ? Math.round(scenesCompleted / scenes.length * 100) : 0}% done`} color="text-emerald-400" />
        <StatCard label="Pages Shot" value={`${pagesShot.toFixed(1)}/${totalScriptPages.toFixed(1)}`} sub="Script pages" color="text-blue-400" />
        <StatCard label="Locations" value={locations.length.toString()} sub="Registered" color="text-purple-400" />
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit">
        {[['schedule', 'Schedule'], ['scenes', 'Scene List'], ['stripboard', 'Stripboard']].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === v ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Schedule View */}
      {view === 'schedule' && (
        <div className="space-y-3">
          {schedules.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No shoot days yet. Click "Add Day" to start.</p>}
          {paginatedSchedules.map(day => (
            <div key={day.id} className="card p-0 overflow-hidden">
              <button onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="text-center w-10 shrink-0">
                    <p className={`text-sm font-bold ${day.status === 'In Progress' ? 'text-blue-400' : day.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'}`}>D{day.day_number}</p>
                    <p className="text-xs text-slate-500">{day.shoot_date ? new Date(day.shoot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">
                        {day.shoot_date ? new Date(day.shoot_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'No date'}
                      </span>
                      <Badge color={statusConfig[day.status] || 'slate'}>{day.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      {day.call_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {day.call_time}</span>}
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {day.location?.name || 'No location'}</span>
                      <span className="flex items-center gap-1"><Camera className="h-3 w-3" /> {day.scenes?.length || 0} scenes</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 text-slate-600 transition-transform shrink-0 ${expandedDay === day.id ? 'rotate-90' : ''}`} />
              </button>

              {expandedDay === day.id && (
                <div className="border-t border-slate-800 px-4 py-3 bg-slate-900/50">
                  <div className="space-y-2">
                    {day.scenes?.map(sc => (
                      <div key={sc.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Sc {sc.scene_number}</span>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{sc.scene_heading}</p>
                            <p className="text-xs text-slate-500">{sc.page_count}p · {sc.int_ext} · {sc.day_or_night}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge color={statusConfig[sc.status] || 'slate'}>{sc.status}</Badge>
                          <button onClick={() => openEditScene(sc)} className="btn btn-ghost btn-sm"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => deleteScene(sc.id)} className="btn btn-danger btn-sm"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800 flex-wrap">
                    {day.wrap_time && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Wrapped: {day.wrap_time}</span>}
                    <div className="ml-auto flex items-center gap-1">
                      <button onClick={() => scheduleService.exportPdf(filmId, day.id)} className="btn btn-ghost btn-sm text-xs text-slate-400">
                        <Download className="h-3.5 w-3.5" /> PDF
                      </button>
                      <button onClick={() => openSyncModal(day)} className="btn btn-ghost btn-sm text-xs text-slate-400">
                        <FilmIcon className="h-3.5 w-3.5" /> Sync
                      </button>
                      <button onClick={() => openEditSchedule(day)} className="btn btn-ghost btn-sm text-xs text-slate-400">
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={() => deleteSchedule(day.id)} className="btn btn-ghost btn-sm text-xs text-slate-400 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {schedules.length > 0 && (
            <Pagination currentPage={currentPage} totalPages={scheduleTotalPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={schedules.length} showPageSizeSelector onPageSizeChange={setPageSize} />
          )}
        </div>
      )}

      {/* Scenes View */}
      {view === 'scenes' && (
        <div className="card p-0">
          <div className="card-header px-4 py-3">
            <span className="text-sm font-medium text-slate-200">{scenes.length} Scenes · {totalScriptPages.toFixed(1)} pages</span>
            <button onClick={openCreateScene} className="btn btn-ghost btn-sm text-amber-500"><Plus className="h-3.5 w-3.5" /> Add Scene</button>
          </div>
          <div className="divide-y divide-slate-800">
            {scenes.length === 0 && <p className="text-sm text-slate-500 text-center py-6">No scenes yet.</p>}
            {paginatedScenes.map(sc => (
              <div key={sc.id} className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono shrink-0">{sc.scene_number}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-200">{sc.scene_heading}</p>
                      <Badge color="slate">{sc.int_ext}</Badge>
                      <Badge color="slate">{sc.day_or_night}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{sc.location?.name || 'No location'} · {sc.page_count}p</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge color={statusConfig[sc.status] || 'slate'}>{sc.status}</Badge>
                  <button onClick={() => openEditScene(sc)} className="btn btn-ghost btn-sm"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteScene(sc.id)} className="btn btn-danger btn-sm"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          {scenes.length > 0 && (
            <Pagination currentPage={currentPage} totalPages={scenesTotalPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={scenes.length} showPageSizeSelector onPageSizeChange={setPageSize} />
          )}
        </div>
      )}

      {/* Stripboard View */}
      {view === 'stripboard' && (
        <Stripboard
          schedules={schedules}
          scenes={scenes}
          onOpenScene={openCreateScene}
          onOpenSchedule={openEditSchedule}
          onSync={handleDragSync}
        />
      )}

      {/* Schedule Modal */}
      <Modal open={showScheduleModal} onClose={() => setShowScheduleModal(false)} title={editSchedule ? 'Edit Shoot Day' : 'Add New Shoot Day'}>
        <form onSubmit={saveSchedule} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Day Number" type="number" value={formData.day_number} onChange={e => setFormData(f => ({ ...f, day_number: parseInt(e.target.value) || 0 }))} required />
            <Input label="Shoot Date" type="date" value={formData.shoot_date} onChange={handleInput} name="shoot_date" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Call Time" type="time" value={formData.call_time} onChange={handleInput} name="call_time" />
            <Input label="Wrap Time" type="time" value={formData.wrap_time} onChange={handleInput} name="wrap_time" />
          </div>
          <Input label="Status" value={formData.status} onChange={handleInput} name="status" options={['Scheduled', 'In Progress', 'Completed', 'Postponed']} />
          <Input label="Location" value={formData.location_id} onChange={handleInput} name="location_id" options={locations.map(l => ({ value: String(l.id), label: l.name }))} />
          <Input label="Notes" value={formData.notes} onChange={handleInput} name="notes" placeholder="Any notes for this day..." />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowScheduleModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{editSchedule ? 'Update' : 'Create'} Day</button>
          </div>
        </form>
      </Modal>

      {/* Scene Modal */}
      <Modal open={showSceneModal} onClose={() => setShowSceneModal(false)} title={editScene ? 'Edit Scene' : 'Add New Scene'}>
        <form onSubmit={saveScene} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Scene Number" value={formData.scene_number} onChange={handleInput} name="scene_number" required placeholder="e.g., 1, 2A, 2B" />
            <Input label="Page Count" type="number" step="0.1" value={formData.page_count} onChange={handleInput} name="page_count" />
          </div>
          <Input label="Scene Heading" value={formData.scene_heading} onChange={handleInput} name="scene_heading" required placeholder="e.g., INT. BANK VAULT - DAY" />
          <div className="grid grid-cols-3 gap-4">
            <Input label="INT/EXT" value={formData.int_ext} onChange={handleInput} name="int_ext" options={['INT', 'EXT', 'INT/EXT']} />
            <Input label="Day/Night" value={formData.day_or_night} onChange={handleInput} name="day_or_night" options={['DAY', 'NIGHT', 'DAWN', 'DUSK']} />
            <Input label="Status" value={formData.status} onChange={handleInput} name="status" options={['Not Started', 'In Progress', 'Completed', 'Postponed']} />
          </div>
          <Input label="Location" value={formData.location_id} onChange={handleInput} name="location_id" options={locations.map(l => ({ value: String(l.id), label: l.name }))} />
          <Input label="Summary" value={formData.summary} onChange={handleInput} name="summary" placeholder="Brief scene summary..." />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowSceneModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{editScene ? 'Update' : 'Create'} Scene</button>
          </div>
        </form>
      </Modal>

      {/* Location Modal */}
      <Modal open={showLocationModal} onClose={() => setShowLocationModal(false)} title={editLocation ? 'Edit Location' : 'Add New Location'}>
        <form onSubmit={saveLocation} className="space-y-4">
          <Input label="Location Name" value={formData.name} onChange={handleInput} name="name" required placeholder="e.g., Patan Durbar Square" />
          <Input label="Address" value={formData.address} onChange={handleInput} name="address" placeholder="Full address" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="GPS Latitude" type="number" step="0.000001" value={formData.gps_lat} onChange={handleInput} name="gps_lat" />
            <Input label="GPS Longitude" type="number" step="0.000001" value={formData.gps_lng} onChange={handleInput} name="gps_lng" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name" value={formData.contact_name} onChange={handleInput} name="contact_name" />
            <Input label="Contact Phone" value={formData.contact_phone} onChange={handleInput} name="contact_phone" />
          </div>
          <Input label="Parking Info" value={formData.parking_info} onChange={handleInput} name="parking_info" />
          <Input label="Facilities Notes" value={formData.facilities_notes} onChange={handleInput} name="facilities_notes" />
          <Input label="Permit Status" value={formData.permit_status} onChange={handleInput} name="permit_status" options={['Not Required', 'Pending', 'Approved', 'Rejected']} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowLocationModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{editLocation ? 'Update' : 'Create'} Location</button>
          </div>
        </form>
      </Modal>

      {/* Sync Modal */}
      <Modal open={syncModal} onClose={() => setSyncModal(false)} title={`Sync Scenes: Day D${selectedSchedule?.day_number}`}>
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Select scenes for this shoot day.</p>
          {scenes.map(sc => (
            <label key={sc.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 cursor-pointer hover:bg-slate-800">
              <input type="checkbox" checked={selectedScenes.includes(sc.id)}
                onChange={() => setSelectedScenes(prev => prev.includes(sc.id) ? prev.filter(id => id !== sc.id) : [...prev, sc.id])}
                className="accent-amber-500 h-4 w-4" />
              <span className="text-xs font-medium text-amber-400 font-mono">#{sc.scene_number}</span>
              <span className="text-sm text-slate-300 flex-1">{sc.scene_heading}</span>
              <span className="text-xs text-slate-500">{sc.page_count}p</span>
            </label>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setSyncModal(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={saveSync} className="btn btn-primary">Save Sync</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
