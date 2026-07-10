import { useState, useEffect, useCallback } from 'react';
import {
  X, Clock, Save, RotateCcw, Trash2, Archive, FileText,
  Plus, Loader, BookOpen, Layers, User, Tag
} from 'lucide-react';
import { scriptService } from '../services/scriptService';
import { useToastStore } from '../toastStore';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getAvatarColor(name) {
  const colors = [
    'bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function ScriptHistory({ filmId, scriptId, currentTitle, currentContent, onRestore, onClose }) {
  const addToast = useToastStore(s => s.addToast);
  const [tab, setTab] = useState('versions');
  const [versions, setVersions] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [snapshotDesc, setSnapshotDesc] = useState('');
  const [submittingSnapshot, setSubmittingSnapshot] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [submittingDraft, setSubmittingDraft] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [archiving, setArchiving] = useState(null);

  const fetchVersions = useCallback(async () => {
    if (!filmId || !scriptId) return;
    setLoadingVersions(true);
    try {
      const res = await scriptService.versions.index(filmId, scriptId);
      setVersions(res.data || []);
    } catch {
      addToast('Failed to load versions', 'error');
    }
    setLoadingVersions(false);
  }, [filmId, scriptId]);

  const fetchDrafts = useCallback(async () => {
    if (!filmId || !scriptId) return;
    setLoadingDrafts(true);
    try {
      const res = await scriptService.drafts.index(filmId, scriptId);
      setDrafts(res.data || []);
    } catch {
      addToast('Failed to load drafts', 'error');
    }
    setLoadingDrafts(false);
  }, [filmId, scriptId]);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);
  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const handleCreateSnapshot = async () => {
    if (!snapshotDesc.trim()) { addToast('Please enter a description', 'error'); return; }
    setSubmittingSnapshot(true);
    try {
      const res = await scriptService.versions.create(filmId, scriptId, snapshotDesc);
      setVersions(prev => [res.data, ...prev]);
      setSnapshotDesc('');
      setCreatingSnapshot(false);
      addToast('Snapshot created');
    } catch {
      addToast('Failed to create snapshot', 'error');
    }
    setSubmittingSnapshot(false);
  };

  const handleRestoreVersion = async (version) => {
    if (!confirm(`Restore script to version ${version.version_number}? Current content will be replaced.`)) return;
    setRestoring(version.id);
    try {
      await scriptService.versions.restore(filmId, scriptId, version.id);
      onRestore(version.title, version.content);
      addToast(`Restored to version ${version.version_number}`);
      fetchVersions();
    } catch {
      addToast('Failed to restore version', 'error');
    }
    setRestoring(null);
  };

  const handleCreateDraft = async () => {
    if (!draftTitle.trim()) { addToast('Please enter a draft title', 'error'); return; }
    setSubmittingDraft(true);
    try {
      const res = await scriptService.drafts.store(filmId, scriptId, {
        title: draftTitle,
        description: draftDesc,
        content: currentContent,
      });
      setDrafts(prev => [res.data, ...prev]);
      setDraftTitle('');
      setDraftDesc('');
      setCreatingDraft(false);
      addToast('Draft saved');
    } catch {
      addToast('Failed to create draft', 'error');
    }
    setSubmittingDraft(false);
  };

  const handleOpenDraft = (draft) => {
    onRestore(draft.title, draft.content);
    addToast(`Loaded draft: ${draft.title}`);
    onClose();
  };

  const handleDeleteDraft = async (draft) => {
    if (!confirm(`Delete draft "${draft.title}"?`)) return;
    setDeleting(draft.id);
    try {
      await scriptService.drafts.delete(filmId, scriptId, draft.id);
      setDrafts(prev => prev.filter(d => d.id !== draft.id));
      addToast('Draft deleted');
    } catch {
      addToast('Failed to delete draft', 'error');
    }
    setDeleting(null);
  };

  const handleArchiveDraft = async (draft) => {
    if (!confirm(`Archive draft "${draft.title}"?`)) return;
    setArchiving(draft.id);
    try {
      await scriptService.drafts.archive(filmId, scriptId, draft.id);
      setDrafts(prev => prev.filter(d => d.id !== draft.id));
      addToast('Draft archived');
    } catch {
      addToast('Failed to archive draft', 'error');
    }
    setArchiving(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">History & Drafts</h2>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-slate-800">
          <button onClick={() => setTab('versions')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-3 transition-colors ${
              tab === 'versions'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5'
                : 'text-slate-500 hover:text-slate-300'
            }`}>
            <Layers className="h-3.5 w-3.5" /> Versions
          </button>
          <button onClick={() => setTab('drafts')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-3 transition-colors ${
              tab === 'drafts'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5'
                : 'text-slate-500 hover:text-slate-300'
            }`}>
            <FileText className="h-3.5 w-3.5" /> Drafts
          </button>
        </div>

        <div className="p-4 space-y-3">
          {tab === 'versions' && (
            <>
              {creatingSnapshot ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-medium text-slate-300">Create Version Snapshot</p>
                  <input
                    value={snapshotDesc}
                    onChange={e => setSnapshotDesc(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateSnapshot(); }}
                    placeholder="e.g. Before restructuring Act 2"
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={handleCreateSnapshot} disabled={submittingSnapshot || !snapshotDesc.trim()}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50">
                      {submittingSnapshot ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save Snapshot
                    </button>
                    <button onClick={() => { setCreatingSnapshot(false); setSnapshotDesc(''); }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setCreatingSnapshot(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-colors">
                  <Save className="h-3.5 w-3.5" /> Create Snapshot of Current State
                </button>
              )}

              {loadingVersions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-5 w-5 text-slate-500 animate-spin" />
                </div>
              ) : versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Layers className="h-10 w-10 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No versions yet</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Create snapshots to track changes over time.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {versions.map(version => (
                    <div key={version.id}
                      className="group flex items-start gap-3 bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 hover:border-slate-600/50 transition-colors">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-amber-400">v{version.version_number}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-slate-200">{version.title}</span>
                          {version.description && (
                            <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <Tag className="h-2.5 w-2.5" /> {version.description}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white ${getAvatarColor(version.creator?.name)}`}>
                              {(version.creator?.name || '?')[0].toUpperCase()}
                            </div>
                            <span className="text-[10px] text-slate-500">{version.creator?.name || 'Unknown'}</span>
                          </div>
                          <span className="text-[9px] text-slate-600">&middot;</span>
                          <span className="text-[10px] text-slate-600">{formatDate(version.created_at)}</span>
                        </div>
                      </div>
                      <button onClick={() => handleRestoreVersion(version)} disabled={restoring === version.id}
                        className="shrink-0 flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50">
                        {restoring === version.id ? <Loader className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'drafts' && (
            <>
              {creatingDraft ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-medium text-slate-300">Save Draft from Current Content</p>
                  <input
                    value={draftTitle}
                    onChange={e => setDraftTitle(e.target.value)}
                    placeholder="Draft title"
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
                    autoFocus
                  />
                  <input
                    value={draftDesc}
                    onChange={e => setDraftDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={handleCreateDraft} disabled={submittingDraft || !draftTitle.trim()}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50">
                      {submittingDraft ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save Draft
                    </button>
                    <button onClick={() => { setCreatingDraft(false); setDraftTitle(''); setDraftDesc(''); }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setCreatingDraft(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Save Current as Draft
                </button>
              )}

              {loadingDrafts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-5 w-5 text-slate-500 animate-spin" />
                </div>
              ) : drafts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-10 w-10 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No drafts yet</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Save drafts to experiment with different versions.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {drafts.map(draft => (
                    <div key={draft.id}
                      className="group flex items-start gap-3 bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 hover:border-slate-600/50 transition-colors">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-200">{draft.title}</span>
                        {draft.description && (
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{draft.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white ${getAvatarColor(draft.creator?.name)}`}>
                              {(draft.creator?.name || '?')[0].toUpperCase()}
                            </div>
                            <span className="text-[10px] text-slate-500">{draft.creator?.name || 'Unknown'}</span>
                          </div>
                          <span className="text-[9px] text-slate-600">&middot;</span>
                          <span className="text-[10px] text-slate-600">{formatDate(draft.created_at)}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-0.5">
                        <button onClick={() => handleOpenDraft(draft)}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Open draft">
                          <BookOpen className="h-3 w-3" /> Open
                        </button>
                        <button onClick={() => handleArchiveDraft(draft)} disabled={archiving === draft.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
                          title="Archive draft">
                          {archiving === draft.id ? <Loader className="h-3 w-3 animate-spin" /> : <Archive className="h-3 w-3" />}
                        </button>
                        <button onClick={() => handleDeleteDraft(draft)} disabled={deleting === draft.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
                          title="Delete draft">
                          {deleting === draft.id ? <Loader className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
