import React, { useState, useEffect } from 'react';
import { Shirt, Plus, Edit3, Trash2, User, Camera, Hash, Image } from 'lucide-react';
import { wardrobeService } from '../services/wardrobeService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

const statusBadgeMap = { 'Ready': 'green', 'In Alteration': 'amber', 'Missing': 'red' };

export default function WardrobeView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await wardrobeService.index(filmId);
      setItems(data || []);
    } catch (err) { console.error('Failed to load wardrobe:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditItem(null);
    setFormData({ character_name: '', scene_id: '', description: '', continuity_photo: '', status: 'Ready', notes: '', assigned_to: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      character_name: item.character_name,
      scene_id: item.scene_id || '',
      description: item.description || '',
      continuity_photo: item.continuity_photo || '',
      status: item.status || 'Ready',
      notes: item.notes || '',
      assigned_to: item.assigned_to || '',
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
      if (editItem) {
        await wardrobeService.update(filmId, editItem.id, data);
      } else {
        await wardrobeService.store(filmId, data);
      }
      setShowModal(false);
      fetchData();
      addToast(editItem ? 'Costume updated' : 'Costume added');
    } catch (err) { console.error('Failed to save wardrobe item:', err); addToast('Failed to save costume', 'error'); }
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this costume item?')) return;
    try { await wardrobeService.destroy(filmId, id); fetchData(); addToast('Costume deleted'); } catch (err) { console.error(err); addToast('Failed to delete costume', 'error'); }
  };

  const totalItems = items.length;
  const readyCount = items.filter(i => i.status === 'Ready').length;
  const alterationCount = items.filter(i => i.status === 'In Alteration').length;
  const missingCount = items.filter(i => i.status === 'Missing').length;

  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(items.length / pageSize);

  useEffect(() => { setCurrentPage(1); }, [items]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Shirt className="h-5 w-5 text-amber-400" /> Wardrobe
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · {totalItems} costume items</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add Costume</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Items', value: totalItems, sub: 'All costumes', color: 'text-amber-400' },
          { label: 'Ready', value: readyCount, sub: 'Available', color: 'text-emerald-400' },
          { label: 'In Alteration', value: alterationCount, sub: 'Being modified', color: 'text-amber-400' },
          { label: 'Missing', value: missingCount, sub: 'Needs attention', color: 'text-red-400' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold">{k.label}</p>
            <p className={`text-xl font-black mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {items.length === 0 && <div className="text-center py-12 text-slate-500 text-sm">No costume items yet.</div>}
        {paginatedItems.map(item => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg shrink-0"><Shirt className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-200">{item.character_name || 'Unnamed'}</span>
                    <Badge color={statusBadgeMap[item.status] || 'slate'}>{item.status}</Badge>
                  </div>
                  {item.description && <p className="text-xs text-slate-400 mt-1">{item.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                    {item.scene_id && <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> Scene #{item.scene_id}</span>}
                    {item.assigned_to && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {item.assigned_to}</span>}
                    {item.continuity_photo && <span className="flex items-center gap-1"><Image className="h-3 w-3" /> Photo</span>}
                  </div>
                  {item.notes && <p className="text-xs text-slate-500 mt-2 bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">{item.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(item)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => deleteItem(item.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
          ))}
        {items.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={items.length} showPageSizeSelector onPageSizeChange={setPageSize} />
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Costume' : 'Add New Costume'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Character Name" value={formData.character_name} onChange={handleInput} name="character_name" required placeholder="e.g., Lead Actor - Scene 3" />
          <Input label="Scene ID" type="number" value={formData.scene_id} onChange={handleInput} name="scene_id" placeholder="Associated scene number" />
          <Input label="Description" value={formData.description} onChange={handleInput} name="description" placeholder="Costume details, colors, accessories..." />
          <Input label="Continuity Photo URL" value={formData.continuity_photo} onChange={handleInput} name="continuity_photo" placeholder="https://..." />
          <Input label="Status" value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))} name="status" options={['Ready', 'In Alteration', 'Missing']} />
          <Input label="Assigned To" value={formData.assigned_to} onChange={handleInput} name="assigned_to" placeholder="Costume designer / dresser" />
          <Input label="Notes" value={formData.notes} onChange={handleInput} name="notes" placeholder="Fitting notes, alterations needed..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editItem ? 'Update' : 'Create'} Costume</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
