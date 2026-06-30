import React, { useState, useRef } from 'react';
import {
  X, Upload, Image, Film, FileAudio, FileText, Loader,
  Trash2, Check, Search
} from 'lucide-react';
import { mediaService } from '../services/mediaService';
import { useToastStore } from '../toastStore';
import { Modal, Button } from './ui';

const typeIcons = { image: Image, video: Film, audio: FileAudio, document: FileText };
const typeColors = { image: 'text-blue-400', video: 'text-purple-400', audio: 'text-green-400', document: 'text-orange-400' };

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function MediaPicker({ open, onClose, onSelect, filterType }) {
  const addToast = useToastStore(s => s.addToast);
  const fileInputRef = useRef(null);
  const [tab, setTab] = useState('library');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typeFilter, setTypeFilter] = useState(filterType || 'all');
  const [selectedId, setSelectedId] = useState(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const data = await mediaService.fetch({ type: typeFilter === 'all' ? undefined : typeFilter, perPage: 50 });
      setItems(data.data || []);
    } catch (err) { addToast('Failed to load media', 'error'); } finally { setLoading(false); }
  };

  React.useEffect(() => { if (open && tab === 'library') fetchMedia(); }, [open, tab, typeFilter]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const media = await mediaService.upload(file);
      addToast('File uploaded');
      if (onSelect) onSelect(media.url);
      onClose();
    } catch (err) { addToast('Upload failed', 'error'); } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this file?')) return;
    try { await mediaService.delete(id); setItems(prev => prev.filter(i => i.id !== id)); addToast('Deleted'); } catch (err) { addToast('Delete failed', 'error'); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Media Library" size="xl">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-lg p-1 w-fit">
          <button onClick={() => setTab('library')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${tab === 'library' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
            <Image className="h-3.5 w-3.5 inline mr-1" /> From Library
          </button>
          <button onClick={() => { setTab('upload'); }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${tab === 'upload' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
            <Upload className="h-3.5 w-3.5 inline mr-1" /> Upload Local
          </button>
        </div>

        {tab === 'upload' && (
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-10 text-center hover:border-amber-500/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">Click to upload or drag & drop</p>
            <p className="text-xs text-slate-600 mt-1">Images, Videos, Audio, PDF (Max 100MB)</p>
            <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" />
            {uploading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-amber-500">
                <Loader className="h-4 w-4 animate-spin" /> Uploading...
              </div>
            )}
          </div>
        )}

        {tab === 'library' && (
          <>
            {/* Type filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'image', 'video', 'audio', 'document'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${typeFilter === t ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50 border border-slate-700'}`}>
                  {t}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10"><Loader className="h-5 w-5 animate-spin text-slate-500" /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No media found. Upload something first.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
                {items.map(item => {
                  const Icon = typeIcons[item.type] || FileText;
                  const color = typeColors[item.type] || 'text-slate-400';
                  const isSelected = selectedId === item.id;
                  return (
                    <div key={item.id}
                      onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
                      className={`group relative bg-slate-800/50 border rounded-xl overflow-hidden cursor-pointer transition-all ${
                        isSelected ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-700 hover:border-slate-600'
                      }`}>
                      {item.type === 'image' ? (
                        <div className="aspect-video bg-slate-800 overflow-hidden">
                          <img src={item.url} alt={item.original_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-800 flex items-center justify-center">
                          <Icon className={`h-8 w-8 ${color}`} />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-[10px] text-slate-300 truncate">{item.original_name}</p>
                        <p className="text-[10px] text-slate-600">{formatSize(item.size)}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 rounded-md text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="h-3 w-3" />
                      </button>
                      {isSelected && (
                        <div className="absolute top-1.5 left-1.5 bg-amber-500 rounded-full p-0.5">
                          <Check className="h-3 w-3 text-slate-950" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {tab === 'library' && (
            <Button variant="primary" disabled={!selectedId} onClick={() => {
              const item = items.find(i => i.id === selectedId);
              if (item) { onSelect(item.url); onClose(); }
            }}>
              <Check className="h-3.5 w-3.5" /> Select
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
