import React, { useState, useEffect } from 'react';
import { Clipboard, Plus, MapPin, Clock, Calendar, CheckCircle, Edit3, Trash2, Phone, User, Sun, AlertTriangle, FileDown, Send } from 'lucide-react';
import { callSheetService } from '../services/callSheetService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

export default function CallSheetsView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [callSheets, setCallSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [sheetDetail, setSheetDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editSheet, setEditSheet] = useState(null);
  const [formData, setFormData] = useState({});
  const [schedules, setSchedules] = useState([]);
  const [castCrew, setCastCrew] = useState([]);
  const [locations, setLocations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(callSheets.length / pageSize) || 1;
  const totalItems = callSheets.length;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const paginatedCallSheets = callSheets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const handlePageSizeChange = (size) => { setPageSize(size); setCurrentPage(1); };
  const resetPagination = () => setCurrentPage(1);

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await callSheetService.index(filmId);
      setCallSheets(data || []);
    } catch (err) { console.error('Failed to load call sheets:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const fetchDetail = async (id) => {
    setSelectedSheet(id);
    try {
      setDetailLoading(true);
      const data = await callSheetService.show(filmId, id);
      setSheetDetail(data);
    } catch (err) { console.error(err); } finally { setDetailLoading(false); }
  };

  const fetchSupportingData = async () => {
    try {
      const api = await import('../api').then(m => m.default);
      const [schedRes, crewRes, locRes] = await Promise.all([
        api.get(`/films/${filmId}/schedules`),
        api.get(`/films/${filmId}/cast-crew`),
        api.get(`/films/${filmId}/locations`),
      ]);
      setSchedules(schedRes.data.schedules || []);
      setCastCrew(crewRes.data || []);
      setLocations(locRes.data || []);
    } catch (err) { console.error(err); }
  };

  const openCreate = async () => {
    await fetchSupportingData();
    setEditSheet(null);
    setFormData({ schedule_id: '', general_call_time: '06:00', location_id: '', catering_info: 'Breakfast: 7:00 AM, Lunch: 1:00 PM', weather: 'Sunny/Clear', emergency_info: 'Nearest Hospital: Kathmandu Medical College', special_instructions: '', crew_ids: [] });
    setShowModal(true);
  };

  const openEdit = async (cs) => {
    await fetchSupportingData();
    setEditSheet(cs);
    setFormData({ general_call_time: cs.general_call_time || '', location_id: cs.location_id || '', catering_info: cs.catering_info || '', weather: cs.weather || '', emergency_info: cs.emergency_info || '', special_instructions: cs.special_instructions || '' });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editSheet) {
        await callSheetService.update(filmId, editSheet.id, formData);
      } else {
        const entries = castCrew.map(m => ({ cast_crew_id: m.id, call_time: formData.general_call_time, notes: '' }));
        await callSheetService.store(filmId, { ...formData, entries, schedule_id: parseInt(formData.schedule_id) });
      }
      setShowModal(false);
      fetchData();
      addToast(editSheet ? 'Call sheet updated' : 'Call sheet generated');
    } catch (err) { console.error('Failed to save call sheet:', err); addToast('Failed to save call sheet', 'error'); }
  };

  const deleteSheet = async (id) => {
    if (!confirm('Delete this call sheet?')) return;
    try { await callSheetService.destroy(filmId, id); setSelectedSheet(null); setSheetDetail(null); fetchData(); addToast('Call sheet deleted'); } catch (err) { console.error(err); addToast('Failed to delete call sheet', 'error'); }
  };

  const handleAcknowledge = async (entryId) => {
    try { await callSheetService.acknowledge(filmId, entryId); if (selectedSheet) fetchDetail(selectedSheet); addToast('Entry acknowledged'); } catch (err) { console.error(err); addToast('Failed to acknowledge', 'error'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Clipboard className="h-5 w-5 text-amber-400" /> Call Sheets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · {callSheets.length} generated</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> New Call Sheet</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">All Call Sheets</p>
          {paginatedCallSheets.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">No call sheets yet.</div>}
          {paginatedCallSheets.map(cs => (
            <button key={cs.id} onClick={() => fetchDetail(cs.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selectedSheet === cs.id ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg"><Calendar className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{cs.shoot_date ? new Date(cs.shoot_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'No date'}</p>
                  <p className="text-xs text-slate-500">{cs.location?.name || 'No location'} · {cs.general_call_time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge color={cs.is_sent ? 'green' : 'amber'}>{cs.is_sent ? 'Sent' : 'Draft'}</Badge>
                <button onClick={(e) => { e.stopPropagation(); openEdit(cs); }} className="p-1 text-slate-500 hover:text-amber-400"><Edit3 className="h-3 w-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteSheet(cs.id); }} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!selectedSheet && <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500"><Clipboard className="h-12 w-12 mx-auto mb-3 opacity-30" /><p className="font-semibold">Select a call sheet to view</p></div>}

          {detailLoading && <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>}

          {sheetDetail && !detailLoading && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-100">Call Sheet</h2>
                    <p className="text-sm text-slate-400">{sheetDetail.shoot_date ? new Date(sheetDetail.shoot_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!sheetDetail.is_sent && (
                      <Button variant="ghost" size="sm" onClick={async () => { try { const r = await callSheetService.distribute(filmId, sheetDetail.id); addToast(r.message); fetchDetail(sheetDetail.id); } catch (e) { addToast('Failed to distribute', 'error'); } }} className="text-slate-400 hover:text-amber-400">
                        <Send className="h-4 w-4" /> Send to Crew
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => callSheetService.exportPdf(filmId, sheetDetail.id)} className="text-slate-400 hover:text-amber-400">
                      <FileDown className="h-4 w-4" /> Download PDF
                    </Button>
                    <Badge color={sheetDetail.is_sent ? 'green' : 'amber'}>{sheetDetail.is_sent ? 'Sent' : 'Draft'}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Call Time</p>
                    <p className="text-sm font-black text-amber-400">{sheetDetail.general_call_time}</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Location</p>
                    <p className="text-sm font-bold text-slate-200">{sheetDetail.location?.name || '—'}</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Weather</p>
                    <p className="text-sm font-bold text-slate-200 flex items-center gap-1"><Sun className="h-3.5 w-3.5 text-amber-400" /> {sheetDetail.weather || '—'}</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Catering</p>
                    <p className="text-sm font-bold text-slate-200">{sheetDetail.catering_info || '—'}</p>
                  </div>
                </div>

                {sheetDetail.special_instructions && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                    <p className="text-[10px] text-amber-500 uppercase font-bold mb-1">Special Instructions</p>
                    <p className="text-xs text-slate-300">{sheetDetail.special_instructions}</p>
                  </div>
                )}

                {sheetDetail.emergency_info && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-[10px] text-red-400 uppercase font-bold mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Emergency Info</p>
                    <p className="text-xs text-slate-300">{sheetDetail.emergency_info}</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-200">Crew Assignments ({sheetDetail.entries?.length || 0})</p>
                </div>
                <div className="divide-y divide-slate-800">
                  {sheetDetail.entries?.map(entry => (
                    <div key={entry.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-800/30">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-slate-950 text-xs">
                          {entry.cast_crew?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">{entry.cast_crew?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{entry.cast_crew?.role_name} · {entry.call_time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.is_acknowledged ? (
                          <Badge color="green"><CheckCircle className="h-3 w-3" /> Acknowledged</Badge>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => handleAcknowledge(entry.id)} className="text-amber-400">Mark Acknowledged</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          pageSize={10}
          totalItems={totalItems}
          showPageSizeSelector
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editSheet ? 'Edit Call Sheet' : 'Generate New Call Sheet'}>
        <form onSubmit={save} className="space-y-4">
          {!editSheet && (
            <Input label="Schedule Day" value={formData.schedule_id} onChange={e => setFormData(f => ({ ...f, schedule_id: e.target.value }))} name="schedule_id" required
              options={schedules.map(s => ({ value: String(s.id), label: `Day ${s.day_number} - ${s.shoot_date ? new Date(s.shoot_date).toLocaleDateString() : ''} (${s.status})` }))} />
          )}
          <Input label="General Call Time" type="time" value={formData.general_call_time} onChange={e => setFormData(f => ({ ...f, general_call_time: e.target.value }))} name="general_call_time" required />
          <Input label="Location" value={formData.location_id} onChange={e => setFormData(f => ({ ...f, location_id: e.target.value }))} name="location_id"
            options={locations.map(l => ({ value: String(l.id), label: l.name }))} />
          <Input label="Weather" value={formData.weather} onChange={e => setFormData(f => ({ ...f, weather: e.target.value }))} name="weather" options={['Sunny/Clear', 'Partly Cloudy', 'Rainy', 'Overcast', 'Hot']} />
          <Input label="Catering Info" value={formData.catering_info} onChange={e => setFormData(f => ({ ...f, catering_info: e.target.value }))} name="catering_info" />
          <Input label="Emergency Info" value={formData.emergency_info} onChange={e => setFormData(f => ({ ...f, emergency_info: e.target.value }))} name="emergency_info" />
          <Input label="Special Instructions" value={formData.special_instructions} onChange={e => setFormData(f => ({ ...f, special_instructions: e.target.value }))} name="special_instructions" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editSheet ? 'Update' : 'Generate'} Call Sheet</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
