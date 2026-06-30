import React, { useState, useEffect } from 'react';
import { FileText, Folder, Plus, Edit3, Trash2, Download, Shield, Clock, Eye } from 'lucide-react';
import { documentService } from '../services/documentService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

export default function DocumentsView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [formData, setFormData] = useState({});
  const [folderFilter, setFolderFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await documentService.index(filmId);
      setDocuments(data || []);
    } catch (err) { console.error('Failed to load documents:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditDoc(null);
    setFormData({ folder: 'General', document_name: '', file_path: '', access_roles: '', version: '1', expires_at: '', is_watermarked: 'false', is_confidential: 'false' });
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditDoc(d);
    setFormData({
      folder: d.folder || 'General', document_name: d.document_name || '',
      file_path: d.file_path || '', access_roles: d.access_roles || '',
      version: String(d.version || 1),
      expires_at: d.expires_at?.split('T')[0] || '',
      is_watermarked: String(d.is_watermarked || false),
      is_confidential: String(d.is_confidential || false),
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        version: parseInt(formData.version),
        is_watermarked: formData.is_watermarked === 'true',
        is_confidential: formData.is_confidential === 'true',
      };
      if (editDoc) {
        await documentService.update(filmId, editDoc.id, data);
      } else {
        await documentService.store(filmId, data);
      }
      setShowModal(false);
      fetchData();
      addToast(editDoc ? 'Document updated' : 'Document uploaded');
    } catch (err) { console.error('Failed to save document:', err); addToast('Failed to save document', 'error'); }
  };

  const deleteDoc = async (id) => {
    if (!confirm('Delete this document?')) return;
    try { await documentService.destroy(filmId, id); setSelectedId(null); fetchData(); addToast('Document deleted'); } catch (err) { console.error(err); addToast('Failed to delete document', 'error'); }
  };

  const folders = [...new Set(documents.map(d => d.folder || 'General').filter(Boolean))];
  const filtered = folderFilter === 'All' ? documents : documents.filter(d => (d.folder || 'General') === folderFilter);
  const paginatedFiltered = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  useEffect(() => { setCurrentPage(1); }, [folderFilter]);

  const selected = documents.find(d => d.id === selectedId);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-400" /> Documents
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · {documents.length} documents</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Upload Document</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Total Documents</p>
          <p className="text-xl font-black text-slate-100 mt-1">{documents.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Folders</p>
          <p className="text-xl font-black text-amber-400 mt-1">{folders.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Confidential</p>
          <p className="text-xl font-black text-rose-400 mt-1">{documents.filter(d => d.is_confidential).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit mb-2">
            <button onClick={() => setFolderFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${folderFilter === 'All' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
              All <span className="ml-1 opacity-60">({documents.length})</span>
            </button>
            {folders.map(f => (
              <button key={f} onClick={() => setFolderFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${folderFilter === f ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
                {f} <span className="ml-1 opacity-60">({documents.filter(d => (d.folder || 'General') === f).length})</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">No documents in this folder.</div>}
          {paginatedFiltered.map(d => (
            <button key={d.id} onClick={() => setSelectedId(d.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selectedId === d.id ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${d.is_confidential ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {d.is_confidential ? <Shield className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{d.document_name}</p>
                  <p className="text-xs text-slate-500 truncate">{d.folder || 'General'} · v{d.version || 1}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {d.is_confidential && <Badge color="red">Confidential</Badge>}
                {d.is_watermarked && <Badge color="blue">Watermarked</Badge>}
                <button onClick={(e) => { e.stopPropagation(); openEdit(d); }} className="p-1 text-slate-500 hover:text-amber-400"><Edit3 className="h-3 w-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteDoc(d.id); }} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            </button>
          ))}
          {filtered.length > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={filtered.length} showPageSizeSelector onPageSizeChange={setPageSize} />
          )}
        </div>

        <div className="lg:col-span-2">
          {!selected && <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500"><FileText className="h-12 w-12 mx-auto mb-3 opacity-30" /><p className="font-semibold">Select a document to view details</p></div>}

          {selected && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${selected.is_confidential ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {selected.is_confidential ? <Shield className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-100">{selected.document_name}</h2>
                    <p className="text-sm text-slate-400">{selected.folder || 'General'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {selected.is_confidential && <Badge color="red">Confidential</Badge>}
                  {selected.is_watermarked && <Badge color="blue">Watermarked</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Version</p>
                  <p className="text-sm font-black text-slate-100">v{selected.version || 1}</p>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">File Path</p>
                  <p className="text-xs font-bold text-amber-400 break-all">{selected.file_path || '—'}</p>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Access Roles</p>
                  <p className="text-xs font-bold text-slate-200">{selected.access_roles || 'All'}</p>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Expires</p>
                  <p className="text-sm font-bold text-slate-200">{selected.expires_at ? new Date(selected.expires_at).toLocaleDateString() : 'Never'}</p>
                </div>
              </div>

              {selected.file_path && (
                <a href={selected.file_path} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold hover:bg-amber-500/30">
                  <Download className="h-3.5 w-3.5" /> Open File
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editDoc ? 'Edit Document' : 'Upload New Document'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Folder" value={formData.folder} onChange={handleInput} name="folder" required options={[...folders, 'General', 'Scripts', 'Contracts', 'Reports', 'Legal'].filter(Boolean)} />
          <Input label="Document Name" value={formData.document_name} onChange={handleInput} name="document_name" required placeholder="e.g., Script Final Draft" />
          <Input label="File Path / URL" value={formData.file_path} onChange={handleInput} name="file_path" placeholder="https://drive.google.com/..." />
          <Input label="Access Roles" value={formData.access_roles} onChange={handleInput} name="access_roles" placeholder="e.g., Director, Producer" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Version" type="number" value={formData.version} onChange={handleInput} name="version" required />
            <Input label="Expires At" type="date" value={formData.expires_at} onChange={handleInput} name="expires_at" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Watermarked" value={formData.is_watermarked} onChange={handleInput} name="is_watermarked" options={['false', 'true']} />
            <Input label="Confidential" value={formData.is_confidential} onChange={handleInput} name="is_confidential" options={['false', 'true']} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editDoc ? 'Update' : 'Upload'} Document</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
