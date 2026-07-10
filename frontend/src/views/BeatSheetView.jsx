import { useState, useEffect, useCallback } from 'react';
import { Layout, Plus, FileText, Trash2, Palette, FolderOpen, Hash, GripVertical, X, Check, Loader } from 'lucide-react';
import { beatSheetService } from '../services/beatSheetService';
import { useAuthStore } from '../authStore';
import { useToastStore } from '../toastStore';

const PRESET_COLORS = [
  '#e2a309', '#ef4444', '#f97316', '#84cc16', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b',
];

export default function BeatSheetView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [sheets, setSheets] = useState([]);
  const [activeSheetId, setActiveSheetId] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');

  const [showAddBeat, setShowAddBeat] = useState(false);
  const [editingBeatId, setEditingBeatId] = useState(null);
  const [beatForm, setBeatForm] = useState({
    title: '', description: '', color: '#e2a309',
    act_label: '', scene_number: '',
  });

  const fetchSheets = useCallback(async () => {
    if (!filmId) return;
    setLoading(true);
    try {
      const res = await beatSheetService.index(filmId);
      setSheets(res.data || []);
    } catch { addToast('Failed to load beat sheets', 'error'); }
    setLoading(false);
  }, [filmId]);

  useEffect(() => { fetchSheets(); }, [fetchSheets]);

  const fetchSheet = useCallback(async (id) => {
    if (!filmId || !id) return;
    setSheetLoading(true);
    try {
      const res = await beatSheetService.show(filmId, id);
      setActiveSheet(res.data);
    } catch { addToast('Failed to load beat sheet', 'error'); }
    setSheetLoading(false);
  }, [filmId]);

  useEffect(() => {
    if (activeSheetId) fetchSheet(activeSheetId);
    else setActiveSheet(null);
  }, [activeSheetId, fetchSheet]);

  const handleSelect = (id) => {
    if (activeSheetId !== id) setActiveSheetId(id);
  };

  const handleCreateSheet = async () => {
    if (!newSheetTitle.trim()) return;
    try {
      const res = await beatSheetService.store(filmId, { title: newSheetTitle.trim() });
      setSheets(prev => [res.data, ...prev]);
      setActiveSheetId(res.data.id);
      setNewSheetTitle('');
      addToast('Beat sheet created');
    } catch { addToast('Failed to create beat sheet', 'error'); }
  };

  const handleDeleteSheet = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this beat sheet and all its beats?')) return;
    try {
      await beatSheetService.destroy(filmId, id);
      setSheets(prev => prev.filter(s => s.id !== id));
      if (activeSheetId === id) { setActiveSheetId(null); setActiveSheet(null); }
      addToast('Beat sheet deleted');
    } catch { addToast('Failed to delete beat sheet', 'error'); }
  };

  const resetBeatForm = () => {
    setBeatForm({ title: '', description: '', color: '#e2a309', act_label: '', scene_number: '' });
    setShowAddBeat(false);
    setEditingBeatId(null);
  };

  const handleAddBeat = async () => {
    if (!beatForm.title.trim() || !activeSheetId) return;
    try {
      const res = await beatSheetService.storeBeat(filmId, activeSheetId, beatForm);
      setActiveSheet(prev => ({
        ...prev,
        beats: [...(prev?.beats || []), res.data],
      }));
      resetBeatForm();
      addToast('Beat added');
    } catch { addToast('Failed to add beat', 'error'); }
  };

  const handleEditBeat = (beat) => {
    setEditingBeatId(beat.id);
    setBeatForm({
      title: beat.title,
      description: beat.description || '',
      color: beat.color || '#e2a309',
      act_label: beat.act_label || '',
      scene_number: beat.scene_number || '',
    });
  };

  const handleSaveBeat = async () => {
    if (!beatForm.title.trim() || !activeSheetId || !editingBeatId) return;
    try {
      const res = await beatSheetService.updateBeat(filmId, activeSheetId, editingBeatId, beatForm);
      setActiveSheet(prev => ({
        ...prev,
        beats: (prev?.beats || []).map(b => b.id === editingBeatId ? res.data : b),
      }));
      resetBeatForm();
      addToast('Beat updated');
    } catch { addToast('Failed to update beat', 'error'); }
  };

  const handleDeleteBeat = async (beatId) => {
    if (!confirm('Delete this beat?')) return;
    try {
      await beatSheetService.destroyBeat(filmId, activeSheetId, beatId);
      setActiveSheet(prev => ({
        ...prev,
        beats: (prev?.beats || []).filter(b => b.id !== beatId),
      }));
      addToast('Beat deleted');
    } catch { addToast('Failed to delete beat', 'error'); }
  };

  const startAddBeat = () => {
    resetBeatForm();
    setBeatForm({ title: '', description: '', color: '#e2a309', act_label: '', scene_number: '' });
    setShowAddBeat(true);
  };

  const beats = activeSheet?.beats || [];
  const groupedByAct = {};
  beats.forEach(b => {
    const act = b.act_label || 'Uncategorized';
    if (!groupedByAct[act]) groupedByAct[act] = [];
    groupedByAct[act].push(b);
  });
  const actOrder = Object.keys(groupedByAct).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <h1 className="text-lg font-bold text-slate-100">Beat Sheet</h1>
        {activeSheet && (
          <button onClick={startAddBeat}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all">
            <Plus className="h-3.5 w-3.5" /> Add Beat
          </button>
        )}
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-56 shrink-0 bg-slate-900 rounded-xl border border-slate-800 flex flex-col">
          <div className="p-2.5 border-b border-slate-800 space-y-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sheets</p>
            <div className="flex gap-1">
              <input value={newSheetTitle} onChange={e => setNewSheetTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateSheet()}
                placeholder="New sheet..."
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600 min-w-0" />
              <button onClick={handleCreateSheet} disabled={!newSheetTitle.trim()}
                className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all disabled:opacity-40 shrink-0">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {loading && sheets.length === 0 ? (
              <div className="flex items-center justify-center py-8"><Loader className="h-5 w-5 text-slate-500 animate-spin" /></div>
            ) : sheets.length === 0 ? (
              <div className="text-center py-8"><Layout className="h-8 w-8 text-slate-600 mx-auto mb-2" /><p className="text-xs text-slate-500">No sheets yet</p></div>
            ) : sheets.map(s => (
              <div key={s.id} onClick={() => handleSelect(s.id)}
                className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all text-xs ${
                  activeSheetId === s.id ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}>
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{s.title}</span>
                <button onClick={(e) => handleDeleteSheet(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {activeSheet ? (
            sheetLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader className="h-6 w-6 text-slate-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2 shrink-0">
                  <input value={activeSheet.title}
                    onChange={async e => {
                      const newTitle = e.target.value;
                      setActiveSheet(prev => ({ ...prev, title: newTitle }));
                    }}
                    onBlur={async () => {
                      try {
                        const res = await beatSheetService.update(filmId, activeSheet.id, { title: activeSheet.title, description: activeSheet.description });
                        setActiveSheet(prev => ({ ...prev, ...res.data }));
                        setSheets(prev => prev.map(s => s.id === activeSheet.id ? { ...s, title: activeSheet.title } : s));
                      } catch { addToast('Failed to update title', 'error'); }
                    }}
                    placeholder="Beat sheet title..."
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600" />
                  <span className="text-xs text-slate-500">{beats.length} beat{beats.length !== 1 ? 's' : ''}</span>
                </div>

                {showAddBeat && (
                  <div className="mb-3 bg-slate-900 border border-amber-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">New Beat</span>
                      <button onClick={resetBeatForm} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-[10px] font-medium text-slate-400 mb-1 block">Title *</label>
                        <input value={beatForm.title} onChange={e => setBeatForm(f => ({ ...f, title: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddBeat()}
                          placeholder="e.g., Hero meets mentor"
                          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-medium text-slate-400 mb-1 block">Description</label>
                        <textarea value={beatForm.description} onChange={e => setBeatForm(f => ({ ...f, description: e.target.value }))}
                          rows={2}
                          placeholder="What happens in this beat?"
                          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600 resize-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-400 mb-1 block">Act Label</label>
                        <input value={beatForm.act_label} onChange={e => setBeatForm(f => ({ ...f, act_label: e.target.value }))}
                          placeholder="e.g., Act 1"
                          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-400 mb-1 block">Scene #</label>
                        <input value={beatForm.scene_number} onChange={e => setBeatForm(f => ({ ...f, scene_number: e.target.value }))}
                          placeholder="e.g., 1"
                          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-medium text-slate-400 mb-1 block">Color</label>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {PRESET_COLORS.map(c => (
                              <button key={c} onClick={() => setBeatForm(f => ({ ...f, color: c }))}
                                className={`w-5 h-5 rounded-full border-2 transition-all ${
                                  beatForm.color === c ? 'border-white scale-110' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          <input type="color" value={beatForm.color}
                            onChange={e => setBeatForm(f => ({ ...f, color: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={resetBeatForm} className="text-xs px-2.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:text-slate-200 transition-all">Cancel</button>
                      <button onClick={handleAddBeat} disabled={!beatForm.title.trim()}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all disabled:opacity-40">
                        <Check className="h-3 w-3" /> Add Beat
                      </button>
                    </div>
                  </div>
                )}

                {beats.length === 0 && !showAddBeat ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <FolderOpen className="h-16 w-16 text-slate-800 mx-auto mb-4" />
                      <h2 className="text-lg font-medium text-slate-500 mb-2">No beats yet</h2>
                      <p className="text-sm text-slate-600 mb-4">Start building your story beat by beat</p>
                      <button onClick={startAddBeat}
                        className="flex items-center gap-1.5 text-sm px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all mx-auto">
                        <Plus className="h-4 w-4" /> Add Your First Beat
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-4">
                    {actOrder.map(act => (
                      <div key={act}>
                        <div className="flex items-center gap-2 mb-2 sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm py-1.5">
                          <Palette className="h-4 w-4 text-amber-400" />
                          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{act}</span>
                          <span className="text-[10px] text-slate-500">({groupedByAct[act].length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {groupedByAct[act].map(beat => (
                            <div key={beat.id}
                              className="group bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-all">
                              {editingBeatId === beat.id ? (
                                <div className="space-y-2.5">
                                  <input value={beatForm.title} onChange={e => setBeatForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Beat title"
                                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600" />
                                  <textarea value={beatForm.description} onChange={e => setBeatForm(f => ({ ...f, description: e.target.value }))}
                                    rows={2} placeholder="Description"
                                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600 resize-none" />
                                  <div className="flex gap-2">
                                    <input value={beatForm.act_label} onChange={e => setBeatForm(f => ({ ...f, act_label: e.target.value }))}
                                      placeholder="Act"
                                      className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-[10px] px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600" />
                                    <input value={beatForm.scene_number} onChange={e => setBeatForm(f => ({ ...f, scene_number: e.target.value }))}
                                      placeholder="Sc #"
                                      className="w-16 bg-slate-800 border border-slate-700 text-slate-200 text-[10px] px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600" />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex gap-1">
                                      {PRESET_COLORS.map(c => (
                                        <button key={c} onClick={() => setBeatForm(f => ({ ...f, color: c }))}
                                          className={`w-4 h-4 rounded-full border ${beatForm.color === c ? 'border-white' : 'border-transparent'}`}
                                          style={{ backgroundColor: c }} />
                                      ))}
                                    </div>
                                    <div className="flex gap-1">
                                      <button onClick={resetBeatForm}
                                        className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                      <button onClick={handleSaveBeat} disabled={!beatForm.title.trim()}
                                        className="p-1 text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-40">
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <div className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: beat.color || '#e2a309' }} />
                                      <span className="text-sm font-bold text-slate-200 truncate">{beat.title}</span>
                                    </div>
                                    <button onClick={() => handleDeleteBeat(beat.id)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all shrink-0">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                  {beat.description && (
                                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{beat.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {beat.act_label && (
                                      <span className="text-[10px] font-medium text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <Palette className="h-2.5 w-2.5" /> {beat.act_label}
                                      </span>
                                    )}
                                    {beat.scene_number && (
                                      <span className="text-[10px] font-medium text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <Hash className="h-2.5 w-2.5" /> Sc {beat.scene_number}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-600 ml-auto">{beat.creator?.name || ''}</span>
                                  </div>
                                  <button onClick={() => handleEditBeat(beat)}
                                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                    title="Edit beat" />
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Layout className="h-16 w-16 text-slate-800 mx-auto mb-4" />
                <h2 className="text-lg font-medium text-slate-500 mb-2">Select a Beat Sheet</h2>
                <p className="text-sm text-slate-600">Choose a sheet from the sidebar or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
