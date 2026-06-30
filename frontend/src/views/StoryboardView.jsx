import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Image, Upload, X, GripVertical, Film, LayoutGrid, Plus, Trash2, Edit3, Move } from 'lucide-react';
import { scheduleService } from '../services/scheduleService';
import { useAuthStore } from '../authStore';
import { useToastStore } from '../toastStore';

let idCounter = Date.now();
const genId = () => ++idCounter;

const storageKey = (filmId) => `storyboard_${filmId}`;
const loadEntries = (filmId) => {
  try {
    const raw = localStorage.getItem(storageKey(filmId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
const saveEntries = (filmId, entries) => {
  localStorage.setItem(storageKey(filmId), JSON.stringify(entries));
};

export default function StoryboardView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [scenes, setScenes] = useState([]);
  const [selectedSceneId, setSelectedSceneId] = useState('');
  const [entries, setEntries] = useState([]);
  const [moodBoardMode, setMoodBoardMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  useEffect(() => {
    if (!filmId) return;
    setEntries(loadEntries(filmId));
  }, [filmId]);

  useEffect(() => {
    if (!filmId) return;
    const fetchScenes = async () => {
      try {
        setLoading(true);
        const data = await scheduleService.index(filmId);
        setScenes(data.scenes || []);
      } catch (err) {
        console.error('Failed to load scenes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchScenes();
  }, [filmId]);

  useEffect(() => {
    if (!filmId) return;
    saveEntries(filmId, entries);
  }, [entries, filmId]);

  const sceneEntries = entries.filter(e => String(e.sceneId) === String(selectedSceneId));
  const displayEntries = moodBoardMode
    ? [...entries].sort((a, b) => a.order - b.order)
    : sceneEntries;

  const addImage = () => {
    if (!urlInput.trim()) return;
    if (!selectedSceneId && !moodBoardMode) {
      addToast('Select a scene first', 'error');
      return;
    }
    const newEntry = {
      id: genId(),
      sceneId: moodBoardMode ? (selectedSceneId || 'uncategorized') : selectedSceneId,
      imageUrl: urlInput.trim(),
      caption: '',
      order: entries.length,
    };
    setEntries(prev => [...prev, newEntry]);
    setUrlInput('');
    addToast('Image added to storyboard');
  };

  const removeEntry = (id) => {
    setEntries(prev => {
      const filtered = prev.filter(e => e.id !== id);
      return filtered.map((e, i) => ({ ...e, order: i }));
    });
    addToast('Image removed', 'error');
  };

  const openEdit = (entry) => {
    setEditModal(entry);
    setEditCaption(entry.caption || '');
  };

  const saveCaption = () => {
    if (!editModal) return;
    setEntries(prev => prev.map(e => e.id === editModal.id ? { ...e, caption: editCaption } : e));
    setEditModal(null);
    addToast('Caption updated');
  };

  const handleDragStart = (index) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const currentEntries = moodBoardMode ? [...entries] : [...sceneEntries];
    const draggedEntry = currentEntries[dragItem.current];
    const filtered = currentEntries.filter((_, i) => i !== dragItem.current);
    filtered.splice(dragOverItem.current, 0, draggedEntry);

    const reordered = filtered.map((e, i) => ({ ...e, order: i }));
    if (moodBoardMode) {
      setEntries(reordered);
    } else {
      const otherEntries = entries.filter(e => String(e.sceneId) !== String(selectedSceneId));
      setEntries([...otherEntries, ...reordered]);
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const selectedScene = scenes.find(s => String(s.id) === String(selectedSceneId));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Image className="h-5 w-5 text-amber-400" /> Storyboard & Mood Board
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentFilm?.title || ''} · {entries.length} images{selectedSceneId && !moodBoardMode ? ` · Scene ${selectedScene?.scene_number || selectedSceneId}` : ''}
          </p>
        </div>
        <button
          onClick={() => setMoodBoardMode(!moodBoardMode)}
          className={`btn btn-sm ${moodBoardMode ? 'btn-primary' : 'btn-ghost'}`}
        >
          <LayoutGrid className="h-4 w-4" />
          {moodBoardMode ? 'Scene View' : 'Mood Board'}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Scene</label>
            <select
              value={selectedSceneId}
              onChange={e => setSelectedSceneId(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="">Select a scene...</option>
              {scenes.map(s => (
                <option key={s.id} value={s.id}>
                  {s.scene_number} - {s.scene_heading || ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-[2]">
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Image URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addImage()}
                placeholder="Paste an image URL..."
                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button onClick={addImage} className="btn btn-primary btn-sm shrink-0">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {!moodBoardMode && !selectedSceneId && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <Image className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Select a scene to begin</p>
          <p className="text-xs mt-1">Choose a scene above to add storyboard images.</p>
        </div>
      )}

      {displayEntries.length === 0 && selectedSceneId && !moodBoardMode && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <Upload className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No storyboard images yet</p>
          <p className="text-xs mt-1">Paste an image URL above to add frames for this scene.</p>
        </div>
      )}

      {moodBoardMode && entries.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <LayoutGrid className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Mood board is empty</p>
          <p className="text-xs mt-1">Add images to any scene to populate the mood board.</p>
        </div>
      )}

      {displayEntries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {displayEntries.map((entry, index) => {
            const scene = scenes.find(s => String(s.id) === String(entry.sceneId));
            return (
              <div
                key={entry.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={e => e.preventDefault()}
                className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-amber-500/50 transition-all"
              >
                <div className="aspect-[4/3] bg-slate-800 relative overflow-hidden">
                  <img
                    src={entry.imageUrl}
                    alt={entry.caption || 'Storyboard frame'}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <div className="hidden w-full h-full items-center justify-center text-slate-600 bg-slate-800">
                    <Image className="h-8 w-8" />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(entry)}
                        className="p-1.5 bg-slate-900/90 rounded-lg text-slate-300 hover:text-amber-400 transition-colors"
                        title="Edit caption"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="p-1.5 bg-slate-900/90 rounded-lg text-slate-300 hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-slate-400" />
                  </div>
                  {moodBoardMode && scene && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="text-[10px] font-medium bg-slate-900/80 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Sc {scene.scene_number}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  {entry.caption ? (
                    <p className="text-xs text-slate-300 line-clamp-2">{entry.caption}</p>
                  ) : (
                    <p className="text-xs text-slate-600 italic">No caption</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setEditModal(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100">Edit Caption</h2>
              <button onClick={() => setEditModal(null)} className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="aspect-[4/3] bg-slate-800 rounded-lg overflow-hidden mb-3">
                <img
                  src={editModal.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div className="hidden w-full h-full items-center justify-center text-slate-600 bg-slate-800">
                  <Image className="h-8 w-8" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Caption / Notes</label>
                <textarea
                  value={editCaption}
                  onChange={e => setEditCaption(e.target.value)}
                  placeholder="Add notes about this frame..."
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditModal(null)} className="btn btn-secondary">Cancel</button>
                <button onClick={saveCaption} className="btn btn-primary">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
