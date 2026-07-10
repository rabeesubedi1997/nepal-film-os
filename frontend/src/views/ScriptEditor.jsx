import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import { ScreenplayNode, detectElementType } from '../extensions';
import ScriptToolbar from '../components/ScriptToolbar';
import TitlePageEditor, { extractTitlePage, wrapTitlePage, buildTitlePageHtml } from '../components/TitlePageEditor';
import ScriptReports from '../components/ScriptReports';
import ReadThrough from '../components/ReadThrough';
import ScriptComments from '../components/ScriptComments';
import ScriptHistory from '../components/ScriptHistory';
import { scriptService } from '../services/scriptService';
import { useAuthStore } from '../authStore';
import { useToastStore } from '../toastStore';
import echo from '../echo';
import {
  Plus, Eye, Trash2, Save, FileText,
  Loader, BookOpen, Code, Upload, Download, Users, Scissors,
  ListOrdered, Sun, Moon, Sunrise, Sunset, RefreshCw,
  Maximize2, Minimize2, Book, BarChart3, Volume2, MessageSquare, History
} from 'lucide-react';

const DEFAULT_TITLE = 'Untitled Script';

const EMPTY_CONTENT = `<div data-type="scene-heading">INT. ROOM - DAY</div><div data-type="action">A desk is covered in papers.</div><div data-type="action">&nbsp;</div><div data-type="character">WRITER</div><div data-type="parenthetical">(quietly)</div><div data-type="dialogue">Time to write.</div><div data-type="action">&nbsp;</div><div data-type="transition">FADE OUT.</div>`;

function textToScreenplayHtml(text) {
  const lines = text.split('\n');
  return lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '<div data-type="action">&nbsp;</div>';
    const type = detectElementType(trimmed);
    return `<div data-type="${type}">${trimmed}</div>`;
  }).join('');
}

function screenplayHtmlToFountain(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const blocks = div.querySelectorAll('[data-type]');
  return Array.from(blocks).map(el => {
    const text = el.textContent.replace(/\u00A0/g, ' ').trim();
    const type = el.getAttribute('data-type');
    if (type === 'action' && text === '') return '';
    if (type === 'scene-heading' && text.startsWith('.')) return text;
    if (type === 'scene-heading') return text.toUpperCase();
    if (type === 'character') return text.toUpperCase();
    return text;
  }).join('\n\n');
}

function screenplayHtmlToPlainText(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return Array.from(div.querySelectorAll('[data-type]'))
    .map(el => el.textContent.replace(/\u00A0/g, ' ').trim())
    .filter(t => t)
    .join('\n\n');
}

const screenStyles = `
  @page { margin: 0.5in 1in 0.5in 1.5in; size: letter; }
  body {
    font-family: 'Courier New', Courier, 'Noto Sans Devanagari', monospace;
    font-size: 12pt; line-height: 1.5; color: #000;
    max-width: 6.5in; margin: 0 auto; padding: 0;
  }
  [data-type="scene-heading"] {
    margin: 1em 0 0 0; font-weight: bold; text-transform: uppercase;
    margin-left: 0; padding-left: 0;
  }
  [data-type="action"] {
    margin: 0 0 0.5em 0; margin-left: 0;
  }
  [data-type="character"] {
    margin: 1em 0 0 0; text-transform: uppercase;
    margin-left: 2.5in; max-width: 3.5in;
  }
  [data-type="parenthetical"] {
    margin: 0.25em 0; font-style: italic;
    margin-left: 2in; max-width: 3in;
  }
  [data-type="dialogue"] {
    margin: 0 0 0.25em 0;
    margin-left: 1.5in; max-width: 3.5in;
  }
  [data-type="transition"] {
    margin: 1em 0; text-transform: uppercase;
    text-align: right; max-width: 6.5in;
  }
  .page-break { page-break-after: always; }
`;

export default function ScriptEditor() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const autoFormatTimer = useRef(null);

  const [scripts, setScripts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [scenesLoading, setScenesLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [splitHeading, setSplitHeading] = useState('');
  const [showSplitInput, setShowSplitInput] = useState(null);
  const [showTitlePage, setShowTitlePage] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showReadThrough, setShowReadThrough] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [titlePageData, setTitlePageData] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ScreenplayNode,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing your script...' }),
      LinkExtension.configure({ openOnClick: false }),
      CharacterCount,
    ],
    content: '',
    onUpdate: () => {
      setDirty(true);
      if (autoFormatTimer.current) clearTimeout(autoFormatTimer.current);
      autoFormatTimer.current = setTimeout(() => {
        const { doc, tr } = editor.state;
        const nodeType = editor.state.schema.nodes.paragraph;
        if (!nodeType) return;
        let modified = false;
        doc.descendants((node, pos) => {
          if (node.type !== nodeType) return;
          const text = node.textContent;
          if (!text) return;
          const detected = detectElementType(text);
          if (detected !== node.attrs.type) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, type: detected });
            modified = true;
          }
        });
        if (modified) editor.view.dispatch(tr);
      }, 400);
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[400px] p-6 rounded-xl bg-slate-900 border border-slate-700 focus-within:border-amber-500 screenplay-editor',
      },
    },
  });

  const fetchScripts = useCallback(async () => {
    if (!filmId) return;
    setLoading(true);
    try {
      const res = await scriptService.index(filmId);
      setScripts(res.data || []);
    } catch { addToast('Failed to load scripts', 'error'); }
    setLoading(false);
  }, [filmId]);

  useEffect(() => { fetchScripts(); }, [fetchScripts]);

  useEffect(() => {
    if (!filmId) return;
    const channel = echo.channel(`scripts.${filmId}`);
    channel.listen('.ScriptUpdated', (e) => {
      if (e.scriptId === activeId && !dirty) {
        setTitle(e.title);
        editor?.commands.setContent(e.content);
      }
      setCollaborators(prev => {
        const exists = prev.find(c => c.name === e.userName);
        if (exists) return prev;
        return [...prev, { name: e.userName, action: e.action }];
      });
      addToast(`${e.userName} ${e.action} "${e.title}"`);
      setTimeout(() => setCollaborators([]), 5000);
      fetchScripts();
    });
    return () => { channel.stopListening('.ScriptUpdated'); };
  }, [filmId, activeId, dirty]);

  const contentHtml = editor?.getHTML() || '';

  const handleSelect = async (id) => {
    if (dirty) { if (!confirm('You have unsaved changes. Discard them?')) return; }
    setDirty(false); setLoading(true);
    try {
      const res = await scriptService.show(filmId, id);
      const s = res.data;
      setActiveId(s.id); setTitle(s.title);
      const content = s.content || '';
      const tpData = extractTitlePage(content);
      setTitlePageData(tpData);
      const cleanContent = content.replace(/<!-- TITLE-PAGE -->[\s\S]*?<!-- \/TITLE-PAGE -->/, '');
      if (cleanContent.includes('data-type')) {
        editor?.commands.setContent(cleanContent);
      } else {
        const converted = textToScreenplayHtml(cleanContent.replace(/<[^>]*>/g, ''));
        editor?.commands.setContent(converted);
      }
    } catch { addToast('Failed to load script', 'error'); }
    setLoading(false);
  };

  const handleNew = () => {
    if (dirty) { if (!confirm('Discard unsaved changes?')) return; }
    setActiveId(null); setTitle(DEFAULT_TITLE);
    setTitlePageData(null);
    editor?.commands.setContent(EMPTY_CONTENT);
    setDirty(false);
  };

  const handleSave = async () => {
    if (!title.trim()) { addToast('Script needs a title', 'error'); return; }
    setSaving(true);
    try {
      const tpWrapped = titlePageData ? wrapTitlePage(titlePageData) : '';
      const finalContent = tpWrapped + contentHtml;
      const data = { title, content: finalContent };
      if (activeId) {
        const res = await scriptService.update(filmId, activeId, data);
        setScripts(prev => prev.map(s => s.id === activeId ? { ...s, ...res.data, updated_at: new Date().toISOString() } : s));
        addToast('Script saved');
      } else {
        const res = await scriptService.store(filmId, data);
        setScripts(prev => [res.data, ...prev]);
        setActiveId(res.data.id);
        addToast('Script created');
      }
      setDirty(false);
    } catch { addToast('Failed to save script', 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this script?')) return;
    try {
      await scriptService.destroy(filmId, id);
      setScripts(prev => prev.filter(s => s.id !== id));
      if (activeId === id) { setActiveId(null); setTitle(''); editor?.commands.setContent(''); setDirty(false); }
      addToast('Script deleted');
    } catch { addToast('Failed to delete script', 'error'); }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      let html = '';
      if (ext === 'fountain' || ext === 'txt') {
        const text = await file.text();
        html = textToScreenplayHtml(text);
      } else if (ext === 'docx') {
        const mammoth = await import('mammoth');
        const buf = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buf });
        html = convertHtmlToScreenplay(result.value);
      } else if (ext === 'pdf') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
        const buf = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buf }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const t = await page.getTextContent();
          pages.push(t.items.map(item => item.str).join(' '));
        }
        html = textToScreenplayHtml(pages.join('\n\n'));
      } else {
        addToast('Unsupported file format. Use .fountain, .txt, .docx, or .pdf', 'error');
        return;
      }
      if (dirty) { if (!confirm('Replace current content with imported text?')) return; }
      const baseName = file.name.replace(/\.[^.]+$/, '');
      setTitle(baseName);
      editor?.commands.setContent(html);
      setActiveId(null);
      setDirty(true);
      addToast(`Imported "${file.name}"`);
    } catch (err) {
      addToast('Failed to import file: ' + err.message, 'error');
    }
    e.target.value = '';
  };

  function convertHtmlToScreenplay(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const blocks = [];
    doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, br').forEach(el => {
      const text = el.textContent.trim();
      if (!text) return;
      const type = detectElementType(text);
      const innerHtml = el.innerHTML.trim();
      if (innerHtml && innerHtml !== text) {
        blocks.push(`<div data-type="${type}">${innerHtml}</div>`);
      } else {
        blocks.push(`<div data-type="${type}">${text}</div>`);
      }
    });
    return blocks.join('');
  }

  const handleExportFountain = () => {
    if (!contentHtml && !title) { addToast('Nothing to export', 'error'); return; }
    const fountain = screenplayHtmlToFountain(contentHtml);
    downloadBlob(fountain, 'text/plain;charset=utf-8', `${title || 'script'}.fountain`);
    addToast('Exported as .fountain');
  };

  const handleExportTxt = () => {
    if (!contentHtml && !title) { addToast('Nothing to export', 'error'); return; }
    const plain = screenplayHtmlToPlainText(contentHtml);
    downloadBlob(plain, 'text/plain;charset=utf-8', `${title || 'script'}.txt`);
    addToast('Exported as .txt');
  };

  const handleExportHtml = () => {
    if (!contentHtml && !title) { addToast('Nothing to export', 'error'); return; }
    const tpHtml = titlePageData ? buildTitlePageHtml(titlePageData) : '';
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title || 'Script'}</title></head><body>${tpHtml}${contentHtml}</body></html>`;
    downloadBlob(fullHtml, 'text/html;charset=utf-8', `${title || 'script'}.html`);
    addToast('Exported as .html');
  };

  const handleExportDocx = async () => {
    if (!contentHtml && !title) { addToast('Nothing to export', 'error'); return; }
    try {
      const mammoth = await import('mammoth');
      const tpHtml = titlePageData ? buildTitlePageHtml(titlePageData) : '';
      const fullHtml = `<html><body>${tpHtml}${contentHtml}</body></html>`;
      const result = await mammoth.convertToHtml({ html: fullHtml });
      const blob = new Blob([result.value], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      downloadBlob(blob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', `${title || 'script'}.docx`);
      addToast('Exported as .docx');
    } catch {
      addToast('DOCX export requires additional setup', 'error');
    }
  };

  function downloadBlob(content, mimeType, filename) {
    const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleTitlePageChange = (data) => {
    setTitlePageData(data);
    setDirty(true);
  };

  const fetchScenes = async () => {
    if (!filmId) return;
    setScenesLoading(true);
    try {
      const res = await scriptService.scenes.index(filmId);
      setScenes(res.data || []);
    } catch { /* ignore */ }
    setScenesLoading(false);
  };

  useEffect(() => { fetchScenes(); }, [filmId, activeId]);

  const handleExtractScenes = async () => {
    if (!activeId) { addToast('Save the script first', 'error'); return; }
    setExtracting(true);
    try {
      await scriptService.extractScenes(filmId, activeId);
      addToast('Scenes extracted');
      fetchScenes();
    } catch { addToast('Extraction failed', 'error'); }
    setExtracting(false);
  };

  const handleSplitScene = async (sceneId) => {
    if (!splitHeading.trim()) { addToast('Enter a scene heading', 'error'); return; }
    try {
      await scriptService.scenes.split(filmId, sceneId, splitHeading);
      addToast('Scene split');
      setSplitHeading('');
      setShowSplitInput(null);
      fetchScenes();
    } catch { addToast('Split failed', 'error'); }
  };

  const handleDeleteScene = async (id) => {
    if (!confirm('Delete this scene?')) return;
    try { await scriptService.scenes.destroy(filmId, id); fetchScenes(); addToast('Scene deleted'); } catch { addToast('Delete failed', 'error'); }
  };

  const handleMoveScene = async (id, direction) => {
    const idx = scenes.findIndex(s => s.id === id);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= scenes.length) return;
    const updated = scenes.map((s, i) => ({
      id: s.id,
      order_index: i === idx ? newIdx : i === newIdx ? idx : s.order_index,
    }));
    try {
      await scriptService.scenes.reorder(filmId, updated);
      setScenes(prev => {
        const arr = [...prev];
        [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
        return arr.map((s, i) => ({ ...s, order_index: i }));
      });
    } catch { addToast('Reorder failed', 'error'); }
  };

  const dayIcon = (d) => {
    const v = (d || '').toUpperCase();
    if (v === 'DAY') return Sun; if (v === 'NIGHT') return Moon; if (v === 'DAWN') return Sunrise; if (v === 'DUSK') return Sunset;
    return Sun;
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <h1 className="text-lg font-bold text-slate-100">Script Editor</h1>
        <div className="flex items-center gap-1.5">
          {(title || activeId !== null) && (
            <>
              <button onClick={() => { setShowTitlePage(true); }}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                  titlePageData ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}>
                <Book className="h-3.5 w-3.5" /> Title Page
              </button>
              <button onClick={() => setShowReports(true)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:text-slate-200 transition-all">
                <BarChart3 className="h-3.5 w-3.5" /> Reports
              </button>
              <button onClick={() => setShowReadThrough(true)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:text-slate-200 transition-all">
                <Volume2 className="h-3.5 w-3.5" /> Read
              </button>
              <button onClick={() => setShowComments(true)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:text-slate-200 transition-all">
                <MessageSquare className="h-3.5 w-3.5" /> Comments
              </button>
              <button onClick={() => setShowHistory(true)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:text-slate-200 transition-all">
                <History className="h-3.5 w-3.5" /> History
              </button>
              <button onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                  showPreview ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}>
                <Eye className="h-3.5 w-3.5" /> Preview
              </button>
              <button onClick={() => setShowSource(!showSource)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                  showSource ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}>
                <Code className="h-3.5 w-3.5" /> Source
              </button>
              <button onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:text-slate-200 transition-all"
                title={expanded ? 'Collapse' : 'Expand'}>
                {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:text-slate-200 transition-all">
                <Upload className="h-3.5 w-3.5" /> Import
              </button>
              <input ref={fileInputRef} type="file" accept=".fountain,.txt,.docx,.pdf" onChange={handleImportFile} className="hidden" />
              <div className="relative group">
                <button className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:text-slate-200 transition-all">
                  <Download className="h-3.5 w-3.5" /> Export
                </button>
                <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 min-w-36 hidden group-hover:block z-50">
                  <button onClick={handleExportFountain}
                    className="w-full text-left text-xs text-slate-300 hover:bg-slate-800 px-3 py-2 transition-colors">Download .fountain</button>
                  <button onClick={handleExportTxt}
                    className="w-full text-left text-xs text-slate-300 hover:bg-slate-800 px-3 py-2 transition-colors">Download .txt</button>
                  <button onClick={handleExportHtml}
                    className="w-full text-left text-xs text-slate-300 hover:bg-slate-800 px-3 py-2 transition-colors">Download .html</button>
                  <button onClick={handleExportDocx}
                    className="w-full text-left text-xs text-slate-300 hover:bg-slate-800 px-3 py-2 transition-colors">Download .docx</button>
                  <div className="border-t border-slate-700 my-1" />
                  <button onClick={handlePrintPdf}
                    className="w-full text-left text-xs text-slate-300 hover:bg-slate-800 px-3 py-2 transition-colors">Print to PDF</button>
                </div>
              </div>
            </>
          )}
          <button onClick={handleNew}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all">
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-56 shrink-0 bg-slate-900 rounded-xl border border-slate-800 flex flex-col">
          <div className="p-2.5 border-b border-slate-800">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Scripts</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {loading && scripts.length === 0 ? (
              <div className="flex items-center justify-center py-8"><Loader className="h-5 w-5 text-slate-500 animate-spin" /></div>
            ) : scripts.length === 0 ? (
              <div className="text-center py-8"><BookOpen className="h-8 w-8 text-slate-600 mx-auto mb-2" /><p className="text-xs text-slate-500">No scripts yet</p></div>
            ) : scripts.map(s => (
              <div key={s.id} onClick={() => handleSelect(s.id)}
                className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all text-xs ${
                  activeId === s.id ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}>
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{s.title}</span>
                <button onClick={(e) => handleDelete(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {(activeId !== null || title) ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-2 shrink-0">
                <input value={title} onChange={e => { setTitle(e.target.value); setDirty(true); }}
                  placeholder="Script title..."
                  className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600" />
                {collaborators.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1.5 rounded-lg">
                    <Users className="h-3.5 w-3.5" />
                    <span>{collaborators.map(c => c.name).join(', ')} editing</span>
                  </div>
                )}
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all disabled:opacity-50">
                  {saving ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {saving ? 'Saving...' : dirty ? 'Save' : 'Saved'}
                </button>
              </div>

              <ScriptToolbar editor={editor} />

              <div className="flex-1 flex gap-3 min-h-0 mt-1.5">
                {!showSource ? (
                  <div className={`flex flex-col ${showPreview ? 'flex-1' : 'flex-1'}`}>
                    <div className="flex items-center justify-between mb-1 shrink-0">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Screenplay</span>
                      <span className="text-xs text-slate-600">
                        {editor.storage.characterCount?.characters?.() || screenplayHtmlToPlainText(contentHtml).length} chars
                        &middot; ~{Math.round((screenplayHtmlToPlainText(contentHtml).split(/\s+/).filter(Boolean).length) / 250) || 1}p
                      </span>
                    </div>
                    <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1 shrink-0">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">HTML Source</span>
                      <span className="text-xs text-slate-600">{contentHtml.length} chars</span>
                    </div>
                    <textarea value={contentHtml} onChange={e => { editor?.commands.setContent(e.target.value); setDirty(true); }}
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs p-4 rounded-xl focus:outline-none focus:border-amber-500 resize-none font-mono leading-relaxed" />
                  </div>
                )}
                {showPreview && !showSource && (
                  <div className="w-1/2 flex flex-col border-l border-slate-700 pl-3">
                    <div className="flex items-center justify-between mb-1 shrink-0">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Preview</span>
                      <span className="text-xs text-slate-600">Screenplay format</span>
                    </div>
                    <div ref={previewRef} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-6 overflow-y-auto prose prose-sm prose-invert max-w-none screenplay-preview"
                      dangerouslySetInnerHTML={{ __html: contentHtml }} />
                  </div>
                )}
              </div>

              {!expanded && (
              <div className="mt-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Scenes</span>
                    <span className="text-[10px] text-slate-500">({scenes.length} detected)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {scenesLoading && <Loader className="h-3 w-3 text-slate-500 animate-spin" />}
                    <button onClick={handleExtractScenes} disabled={extracting || !activeId}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors disabled:opacity-50">
                      <RefreshCw className={`h-3 w-3 ${extracting ? 'animate-spin' : ''}`} /> {extracting ? 'Extracting...' : 'Re-detect'}
                    </button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {scenes.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <BookOpen className="h-6 w-6 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No scenes detected yet.</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">Save the script and scenes will auto-extract.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/60">
                      {scenes.map(scene => {
                        const DayIcon = dayIcon(scene.day_or_night);
                        return (
                          <div key={scene.id} className="px-4 py-2 hover:bg-slate-800/30 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">{scene.scene_number}</span>
                                <span className="text-xs text-slate-300 truncate">{scene.scene_heading || 'No heading'}</span>
                                <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">{scene.int_ext}</span>
                                <DayIcon className="h-3 w-3 text-slate-500 shrink-0" />
                                <span className="text-[10px] text-slate-600">{scene.page_count ? scene.page_count.toFixed(2) + 'p' : ''}</span>
                                {scene.location && <span className="text-[10px] text-slate-500 truncate max-w-24">{scene.location.name}</span>}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button onClick={() => handleMoveScene(scene.id, -1)} disabled={scene.order_index === 0}
                                  className="p-1 text-slate-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                </button>
                                <button onClick={() => handleMoveScene(scene.id, 1)} disabled={scene.order_index === scenes.length - 1}
                                  className="p-1 text-slate-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {showSplitInput === scene.id ? (
                                  <div className="flex items-center gap-1">
                                    <input type="text" value={splitHeading} onChange={e => setSplitHeading(e.target.value)}
                                      placeholder="New scene heading..."
                                      className="w-44 bg-slate-800 border border-slate-700 text-[10px] text-slate-200 px-2 py-1 rounded focus:outline-none focus:border-amber-500" />
                                    <button onClick={() => handleSplitScene(scene.id)} className="p-1 text-amber-400 hover:text-amber-300"><Scissors className="h-3 w-3" /></button>
                                    <button onClick={() => { setShowSplitInput(null); setSplitHeading(''); }} className="p-1 text-slate-500 hover:text-slate-300 text-[10px]">Cancel</button>
                                  </div>
                                ) : (
                                  <button onClick={() => { setShowSplitInput(scene.id); setSplitHeading('INT. '); }}
                                    className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded text-slate-500 hover:text-amber-400 transition-colors">
                                    <Scissors className="h-3 w-3" /> Split
                                  </button>
                                )}
                                <button onClick={() => handleDeleteScene(scene.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="h-3 w-3" /></button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-slate-800 mx-auto mb-4" />
                <h2 className="text-lg font-medium text-slate-500 mb-2">No Script Selected</h2>
                <p className="text-sm text-slate-600 mb-4">Create a new script, or import from Word/PDF</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={handleNew}
                    className="flex items-center gap-1.5 text-sm px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all">
                    <Plus className="h-4 w-4" /> New Script
                  </button>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-sm px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-all">
                    <Upload className="h-4 w-4" /> Import File
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {showTitlePage && (
        <TitlePageEditor
          data={titlePageData}
          onChange={handleTitlePageChange}
          onClose={() => setShowTitlePage(false)}
        />
      )}
      {showReports && (
        <ScriptReports
          content={contentHtml}
          onClose={() => setShowReports(false)}
        />
      )}
      {showReadThrough && (
        <ReadThrough
          content={contentHtml}
          onClose={() => setShowReadThrough(false)}
        />
      )}
      {showComments && (
        <ScriptComments
          editor={editor}
          filmId={filmId}
          scriptId={activeId}
          onClose={() => setShowComments(false)}
        />
      )}
      {showHistory && (
        <ScriptHistory
          filmId={filmId}
          scriptId={activeId}
          currentTitle={title}
          currentContent={contentHtml}
          onRestore={(newTitle, newContent) => {
            setTitle(newTitle);
            editor?.commands.setContent(newContent);
            setDirty(false);
          }}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
