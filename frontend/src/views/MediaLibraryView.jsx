import React, { useState, useEffect, useRef } from 'react';
import {
  Image, Film, FileAudio, FileText, Upload, Trash2, Loader,
  Search, Download
} from 'lucide-react';
import { mediaService } from '../services/mediaService';
import { useToastStore } from '../toastStore';
import { Button } from '../components/ui';

const typeIcons = { image: Image, video: Film, audio: FileAudio, document: FileText };
const typeColors = { image: 'text-blue-400', video: 'text-purple-400', audio: 'text-green-400', document: 'text-orange-400' };
const typeLabels = { image: 'Images', video: 'Videos', audio: 'Audio', document: 'Documents' };

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function MediaLibraryView() {
  const addToast = useToastStore(s => s.addToast);
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchMedia = async (pageNum = 1, append = false) => {
    if (!append) setLoading(true);
    try {
      const data = await mediaService.fetch({ type: typeFilter === 'all' ? undefined : typeFilter, page: pageNum, perPage: 24 });
      setItems(prev => append ? [...prev, ...(data.data || [])] : (data.data || []));
      setHasMore(data.meta?.has_more ?? false);
      setTotal(data.meta?.total ?? 0);
      setPage(pageNum);
    } catch (err) { addToast('Failed to load media', 'error'); } finally { setLoading(false); }
  };

  useEffect(() => { setItems([]); setPage(1); setHasMore(false); fetchMedia(1); }, [typeFilter]);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    let count = 0;
    for (const file of files) {
      try {
        await mediaService.upload(file);
        count++;
      } catch (err) { /* skip */ }
    }
    setUploading(false);
    addToast(`${count} file(s) uploaded`);
    fetchMedia(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this file?')) return;
    try { await mediaService.delete(id); setItems(prev => prev.filter(i => i.id !== id)); setTotal(prev => prev - 1); addToast('Deleted'); } catch (err) { addToast('Delete failed', 'error'); }
  };

  const counts = { image: 0, video: 0, audio: 0, document: 0 };
  items.forEach(i => { if (counts[i.type] !== undefined) counts[i.type]++; });

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Image className="h-5 w-5 text-amber-400" /> Media Library
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{total} files in your library</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" multiple onChange={handleUpload} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" />
          <Button variant="primary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <><Loader className="h-3.5 w-3.5 animate-spin" /> Uploading...</> : <><Upload className="h-3.5 w-3.5" /> Upload Files</>}
          </Button>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', ...Object.keys(typeLabels)].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${typeFilter === t ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'}`}>
            {t === 'all' ? 'All' : typeLabels[t]}
            {t !== 'all' && <span className="ml-1.5 text-[10px] opacity-70">({counts[t]})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader className="h-6 w-6 animate-spin text-slate-500" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Image className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No files yet.</p>
          <Button variant="primary" size="sm" onClick={() => fileInputRef.current?.click()} className="mt-4">
            <Upload className="h-3.5 w-3.5" /> Upload your first file
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map(item => {
              const Icon = typeIcons[item.type] || FileText;
              const color = typeColors[item.type] || 'text-slate-400';
              return (
                <div key={item.id} className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all">
                  {item.type === 'image' ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="block aspect-video bg-slate-800 overflow-hidden">
                      <img src={item.url} alt={item.original_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </a>
                  ) : (
                    <a href={item.url} target="_blank" rel="noreferrer" className="block aspect-video bg-slate-800 flex items-center justify-center group-hover:bg-slate-750 transition-colors">
                      <Icon className={`h-10 w-10 ${color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                    </a>
                  )}
                  <div className="p-3">
                    <p className="text-xs text-slate-300 font-medium truncate" title={item.original_name}>{item.original_name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[10px] text-slate-600">{formatSize(item.size)}</p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={item.url} target="_blank" rel="noreferrer" className="p-1 text-slate-500 hover:text-amber-400 rounded">
                          <Download className="h-3 w-3" />
                        </a>
                        <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-500 hover:text-red-400 rounded">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="secondary" size="sm" onClick={() => fetchMedia(page + 1, true)}>
                <Loader className="h-3.5 w-3.5" /> Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
