import React, { useState, useEffect } from 'react';
import { Tv, Plus, Edit3, Trash2, Film, Hash, Layers } from 'lucide-react';
import { seriesService } from '../services/seriesService';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';

export default function SeriesView() {
  const addToast = useToastStore(s => s.addToast);
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSeries, setEditSeries] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleting, setDeleting] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await seriesService.index();
      setSeriesList(data || []);
    } catch (err) { console.error('Failed to load series:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditSeries(null);
    setFormData({ title: '', total_episodes: '' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditSeries(s);
    setFormData({ title: s.title, total_episodes: String(s.total_episodes || '') });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = {
        title: formData.title,
        total_episodes: formData.total_episodes ? parseInt(formData.total_episodes) : 0,
      };
      if (editSeries) {
        await seriesService.update(editSeries.id, data);
      } else {
        await seriesService.store(data);
      }
      setShowModal(false);
      fetchData();
      addToast(editSeries ? 'Series updated' : 'Series created');
    } catch (err) { console.error('Failed to save series:', err); addToast('Failed to save series', 'error'); }
  };

  const deleteSeries = async (id) => {
    if (!confirm('Delete this series?')) return;
    setDeleting(id);
    try { await seriesService.destroy(id); fetchData(); addToast('Series deleted'); } catch (err) { console.error(err); addToast('Failed to delete series', 'error'); } finally { setDeleting(null); }
  };

  const totalSeries = seriesList.length;
  const totalEpisodes = seriesList.reduce((s, series) => s + (series.total_episodes || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Tv className="h-5 w-5 text-amber-400" /> Series
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{totalSeries} series · {totalEpisodes} total episodes</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add Series</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Series', value: totalSeries, sub: 'All series', color: 'text-amber-400' },
          { label: 'Total Episodes', value: totalEpisodes, sub: 'Across all series', color: 'text-blue-400' },
          { label: 'Avg Episodes', value: totalSeries ? Math.round(totalEpisodes / totalSeries) : 0, sub: 'Per series', color: 'text-purple-400' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold">{k.label}</p>
            <p className={`text-xl font-black mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {seriesList.length === 0 && <div className="col-span-full text-center py-12 text-slate-500 text-sm">No series yet.</div>}
        {seriesList.map(s => (
          <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 text-amber-400 p-2.5 rounded-lg shrink-0"><Tv className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{s.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Film className="h-3 w-3" /> {s.total_episodes || 0} episodes</span>
                    {s.episodes_count !== undefined && <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {s.episodes_count} linked</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(s)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => deleteSeries(s.id)} disabled={deleting === s.id} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editSeries ? 'Edit Series' : 'Add New Series'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Title" value={formData.title} onChange={handleInput} name="title" required placeholder="e.g., Kabaddi Kabaddi" />
          <Input label="Total Episodes" type="number" value={formData.total_episodes} onChange={handleInput} name="total_episodes" placeholder="e.g., 13" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editSeries ? 'Update' : 'Create'} Series</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
