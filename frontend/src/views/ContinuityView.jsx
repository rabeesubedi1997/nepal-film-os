import React, { useState, useEffect } from 'react';
import { Camera, Plus, Edit3, Trash2, Hash, Image, Film, Eye, Scissors, Palette, Puzzle } from 'lucide-react';
import { continuityService } from '../services/continuityService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';

const typeConfig = {
  'wardrobe': { label: 'Wardrobe', icon: Eye, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  'hair': { label: 'Hair', icon: Scissors, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  'makeup': { label: 'Makeup', icon: Palette, color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  'props': { label: 'Props', icon: Puzzle, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'set': { label: 'Set', icon: Film, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
};

function TypeBadge({ type }) {
  const cfg = typeConfig[type];
  if (!cfg) return <Badge color="slate">{type}</Badge>;
  const Icon = cfg.icon;
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${cfg.color}`}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </span>
  );
}

export default function ContinuityView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [formData, setFormData] = useState({});

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await continuityService.index(filmId);
      setRecords(data || []);
    } catch (err) { console.error('Failed to load continuity records:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditRecord(null);
    setFormData({ scene_id: '', type: 'wardrobe', continuity_photo: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditRecord(r);
    setFormData({
      scene_id: r.scene_id || '',
      type: r.type || 'wardrobe',
      continuity_photo: r.continuity_photo || '',
      notes: r.notes || '',
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        scene_id: formData.scene_id ? parseInt(formData.scene_id) : null,
      };
      if (editRecord) {
        await continuityService.update(filmId, editRecord.id, data);
      } else {
        await continuityService.store(filmId, data);
      }
      setShowModal(false);
      fetchData();
      addToast(editRecord ? 'Continuity record updated' : 'Continuity record created');
    } catch (err) { console.error('Failed to save continuity record:', err); addToast('Failed to save record', 'error'); }
  };

  const deleteRecord = async (id) => {
    if (!confirm('Delete this continuity record?')) return;
    try { await continuityService.destroy(filmId, id); fetchData(); addToast('Continuity record deleted'); } catch (err) { console.error(err); addToast('Failed to delete record', 'error'); }
  };

  const totalRecords = records.length;
  const typeCounts = {};
  records.forEach(r => { typeCounts[r.type] = (typeCounts[r.type] || 0) + 1; });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Camera className="h-5 w-5 text-amber-400" /> Continuity
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · {totalRecords} records</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add Record</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Total</p>
          <p className="text-xl font-black mt-1 text-slate-100">{totalRecords}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">All records</p>
        </div>
        {Object.entries(typeConfig).map(([key, cfg]) => (
          <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold">{cfg.label}</p>
            <p className={`text-xl font-black mt-1 ${cfg.color.split(' ')[1]}`}>{typeCounts[key] || 0}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Records</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {records.length === 0 && <div className="text-center py-12 text-slate-500 text-sm">No continuity records yet.</div>}
        {records.map(r => (
          <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg shrink-0"><Camera className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <TypeBadge type={r.type} />
                    {r.scene_id && <span className="text-xs font-black text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1"><Hash className="h-3 w-3" /> Scene #{r.scene_id}</span>}
                  </div>
                  {r.continuity_photo && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-blue-400">
                      <Image className="h-3 w-3" />
                      <a href={r.continuity_photo} target="_blank" rel="noreferrer" className="hover:underline">View Photo</a>
                    </div>
                  )}
                  {r.notes && <p className="text-xs text-slate-400 mt-2 bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">{r.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(r)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => deleteRecord(r.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editRecord ? 'Edit Continuity Record' : 'Add Continuity Record'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Scene ID" type="number" value={formData.scene_id} onChange={handleInput} name="scene_id" required placeholder="Scene number" />
          <Input label="Type" value={formData.type} onChange={e => setFormData(f => ({ ...f, type: e.target.value }))} name="type" options={['wardrobe', 'hair', 'makeup', 'props', 'set']} />
          <Input label="Continuity Photo URL" value={formData.continuity_photo} onChange={handleInput} name="continuity_photo" placeholder="https://..." />
          <Input label="Notes" value={formData.notes} onChange={handleInput} name="notes" placeholder="Continuity notes, observations..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editRecord ? 'Update' : 'Create'} Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
