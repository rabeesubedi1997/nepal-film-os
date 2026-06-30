import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Edit3, Trash2, Users, Shirt, Package, Volume2, Truck, UserPlus, Camera } from 'lucide-react';
import { scriptBreakdownService } from '../services/scriptBreakdownService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

const categoryConfig = {
  cast: { label: 'Cast', icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  props: { label: 'Props', icon: Package, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  wardrobe: { label: 'Wardrobe', icon: Shirt, color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
  sfx: { label: 'SFX', icon: Volume2, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  vehicles: { label: 'Vehicles', icon: Truck, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  extras: { label: 'Extras', icon: UserPlus, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
};

export default function ScriptBreakdownView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [breakdowns, setBreakdowns] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBreakdown, setEditBreakdown] = useState(null);
  const [formData, setFormData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await scriptBreakdownService.index(filmId);
      setBreakdowns(data.breakdowns || data || []);
      if (data.scenes) setScenes(data.scenes);
    } catch (err) {
      console.error('Failed to load breakdowns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditBreakdown(null);
    setFormData({ scene_id: '', category: 'cast', item_name: '', quantity: '1', notes: '' });
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditBreakdown(b);
    setFormData({
      scene_id: b.scene_id || '',
      category: b.category || 'cast',
      item_name: b.item_name || '',
      quantity: String(b.quantity || 1),
      notes: b.notes || '',
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, quantity: parseInt(formData.quantity) || 1 };
      if (editBreakdown) {
        await scriptBreakdownService.update(filmId, editBreakdown.id, data);
      } else {
        await scriptBreakdownService.store(filmId, data);
      }
      setShowModal(false);
      fetchData();
      addToast(editBreakdown ? 'Breakdown item updated' : 'Breakdown item created');
    } catch (err) { console.error('Failed to save breakdown:', err); addToast('Failed to save breakdown', 'error'); }
  };

  const deleteBreakdown = async (id) => {
    if (!confirm('Delete this breakdown item?')) return;
    try { await scriptBreakdownService.destroy(filmId, id); fetchData(); addToast('Breakdown item deleted'); } catch (err) { console.error(err); addToast('Failed to delete item', 'error'); }
  };

  const groupedByScene = {};
  breakdowns.forEach(b => {
    const sceneKey = b.scene?.scene_number || b.scene_id || 'Unknown';
    if (!groupedByScene[sceneKey]) groupedByScene[sceneKey] = [];
    groupedByScene[sceneKey].push(b);
  });

  const sceneEntries = Object.entries(groupedByScene);
  const paginatedSceneEntries = sceneEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(sceneEntries.length / pageSize);

  useEffect(() => { setCurrentPage(1); }, [breakdowns]);

  const scenesBrokenDown = new Set(breakdowns.map(b => b.scene_id)).size;
  const categoryCounts = {};
  breakdowns.forEach(b => {
    categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-amber-400" /> Script Breakdown
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · {breakdowns.length} items across {scenesBrokenDown} scenes</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add Item</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Items', value: breakdowns.length, sub: 'Across all scenes', color: 'text-amber-400' },
          { label: 'Scenes Broken Down', value: `${scenesBrokenDown}`, sub: `${scenes.length || '?'} total scenes`, color: 'text-blue-400' },
          { label: 'Cast Items', value: categoryCounts['cast'] || 0, sub: 'Characters needed', color: 'text-blue-400' },
          { label: 'Props Items', value: categoryCounts['props'] || 0, sub: 'Hand props', color: 'text-purple-400' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold">{k.label}</p>
            <p className={`text-xl font-black mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(categoryConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const count = categoryCounts[key] || 0;
          return (
            <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${cfg.color}`}>
              <Icon className="h-3.5 w-3.5" />
              <span>{cfg.label}</span>
              <span className="opacity-60">({count})</span>
            </div>
          );
        })}
      </div>

      {breakdowns.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No breakdown items yet</p>
          <p className="text-xs mt-1">Add your first cast, prop, or wardrobe item.</p>
        </div>
      )}

      <div className="space-y-4">
        {paginatedSceneEntries.map(([sceneKey, items]) => (
          <div key={sceneKey} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center gap-2">
              <Camera className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-bold text-slate-200">Scene {sceneKey}</span>
              <span className="text-xs text-slate-500">· {items.length} items</span>
            </div>
            <div className="divide-y divide-slate-800/60">
              {items.map(item => {
                const cfg = categoryConfig[item.category] || categoryConfig.cast;
                const Icon = cfg.icon;
                return (
                  <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${cfg.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-200">{item.item_name}</span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">x{item.quantity}</span>
                        </div>
                        {item.notes && <p className="text-xs text-slate-500 mt-0.5 truncate">{item.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                      <button onClick={() => openEdit(item)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteBreakdown(item.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {sceneEntries.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={sceneEntries.length} showPageSizeSelector onPageSizeChange={setPageSize} />
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editBreakdown ? 'Edit Breakdown Item' : 'Add Breakdown Item'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Scene" value={formData.scene_id} onChange={handleInput} name="scene_id" options={scenes.map(s => ({ value: String(s.id), label: `Sc ${s.scene_number} - ${s.scene_heading || ''}` }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category" value={formData.category} onChange={handleInput} name="category" options={Object.keys(categoryConfig)} />
            <Input label="Quantity" type="number" value={formData.quantity} onChange={handleInput} name="quantity" />
          </div>
          <Input label="Item Name" value={formData.item_name} onChange={handleInput} name="item_name" required placeholder="e.g., Detective's revolver, Red saree" />
          <Input label="Notes" value={formData.notes} onChange={handleInput} name="notes" placeholder="Any additional details..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editBreakdown ? 'Update' : 'Create'} Item</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
