import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { ScreenplayNode, detectElementType } from '../extensions';
import ScriptToolbar, { FontSelector } from '../components/ScriptToolbar';
import ScriptBubbleMenu from '../components/ScriptBubbleMenu';
import CharacterAutocomplete from '../extensions/CharacterAutocomplete';
import PageBreakRuler from '../components/PageBreakRuler';
import LanguageSelector from '../components/LanguageSelector';
import TitlePageEditor, { extractTitlePage, wrapTitlePage, buildTitlePageHtml } from '../components/TitlePageEditor';
import ScriptReports from '../components/ScriptReports';
import ReadThrough from '../components/ReadThrough';
import ScriptComments from '../components/ScriptComments';
import ScriptHistory from '../components/ScriptHistory';
import { scriptService } from '../services/scriptService';
import { useAuthStore } from '../authStore';
import { useToastStore } from '../toastStore';
import echo from '../echo';
import { useLanguageStore } from '../languageStore';
import { transliterateWord } from '../services/transliteration';
import { fountainToScreenplayHtml, screenplayToFountain, screenplayToPlainText as screenplayHtmlToPlainText, convertHtmlToScreenplay, downloadBlob } from '../utils/screenplay';
import {
  Plus, Eye, Trash2, Save, FileText,
  Loader, BookOpen, Code, Upload, Download as DownloadIcon, Users, Scissors,
  ListOrdered, Sun, Moon, Sunrise, Sunset, RefreshCw,
  BarChart3, Volume2, MessageSquare, History,
  ChevronLeft, ChevronRight, Search,
  ZoomIn, ZoomOut,
  FilePlus, ChevronUp, Target
} from 'lucide-react';

const DEFAULT_TITLE = 'Untitled Script';

const EMPTY_CONTENT = `<div data-type="scene-heading">INT. ROOM - DAY</div><div data-type="action">A desk is covered in papers.</div><div data-type="action">&nbsp;</div><div data-type="character">WRITER</div><div data-type="parenthetical">(quietly)</div><div data-type="dialogue">Time to write.</div><div data-type="action">&nbsp;</div><div data-type="transition">FADE OUT.</div>`;



const screenStyles = `
  @page { margin: 0.5in 1in 0.5in 1.5in; size: letter; }
  body {
    font-family: 'Courier Prime', 'Courier New', 'Noto Sans Devanagari', monospace;
    font-size: 12pt; line-height: 1.5; color: #000;
    max-width: 6.5in; margin: 0 auto; padding: 0;
  }
  [data-element-type="scene-heading"], [data-type="scene-heading"] {
    margin: 1em 0 0 0; font-weight: bold; text-transform: uppercase;
    margin-left: 0; padding-left: 0;
  }
  [data-element-type="action"], [data-type="action"] {
    margin: 0 0 0.5em 0; margin-left: 0;
  }
  [data-element-type="character"], [data-type="character"] {
    margin: 1em 0 0 0; text-transform: uppercase;
    margin-left: 2.5in; max-width: 3.5in;
  }
  [data-element-type="parenthetical"], [data-type="parenthetical"] {
    margin: 0.25em 0; font-style: italic;
    margin-left: 2in; max-width: 3in;
  }
  [data-element-type="dialogue"], [data-type="dialogue"] {
    margin: 0 0 0.25em 0;
    margin-left: 1.5in; max-width: 3.5in;
  }
  [data-element-type="transition"], [data-type="transition"] {
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
  const { t, language } = useLanguageStore();

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
  const [rightPanel, setRightPanel] = useState('scenes');
  const [zoom, setZoom] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const editorContainerRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ScreenplayNode,
      Underline,
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
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
          if (node.attrs.elementType === 'action' && detected !== 'action') {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, elementType: detected });
            modified = true;
          }
        });
        if (modified) editor.view.dispatch(tr);
      }, 400);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none focus:outline-none min-h-[500px] p-6 bg-slate-900 screenplay-editor',
      },
      handleKeyDown: (view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 't') {
          event.preventDefault();
          const { from, to, empty } = view.state.selection;
          if (empty) return true;
          const text = view.state.doc.textBetween(from, to);
          const converted = transliterateWord(text);
          if (converted !== text) {
            const { tr } = view.state;
            tr.replaceWith(from, to, view.state.schema.text(converted));
            view.dispatch(tr);
          }
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor?.view?.dom) {
      editor.view.dom.style.zoom = zoom / 100;
    }
  }, [zoom, editor]);

  useEffect(() => {
    if (!editor || !typewriterMode) return;
    const scrollToCenter = () => {
      try {
        const { view } = editor;
        const { selection } = view.state;
        const { $from } = selection;
        const coords = view.coordsAtPos($from.pos);
        if (!coords) return;
        const container = view.dom.closest('.screenplay-editor-wrapper');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const targetY = rect.top + rect.height / 3;
        const diff = coords.top - targetY;
        if (Math.abs(diff) > 30) container.scrollTop += diff;
      } catch { /* ignore */ }
    };
    editor.on('selectionUpdate', scrollToCenter);
    editor.on('update', scrollToCenter);
    scrollToCenter();
    return () => {
      editor.off('selectionUpdate', scrollToCenter);
      editor.off('update', scrollToCenter);
    };
  }, [editor, typewriterMode]);

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
  const wordCount = useMemo(() => screenplayHtmlToPlainText(contentHtml).split(/\s+/).filter(Boolean).length, [contentHtml]);
  const charCount = useMemo(() => screenplayHtmlToPlainText(contentHtml).length, [contentHtml]);
  const pageCount = useMemo(() => Math.max(1, Math.round(wordCount / 250)), [wordCount]);

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
        const converted = fountainToScreenplayHtml(cleanContent.replace(/<[^>]*>/g, ''));
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
        html = fountainToScreenplayHtml(text);
      } else if (ext === 'docx') {
        const mammoth = await import('mammoth');
        const buf = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buf });
        html = convertHtmlToScreenplay(result.value);
      } else if (ext === 'pdf') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        const buf = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buf }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const t = await page.getTextContent();
          pages.push(t.items.map(item => item.str).join(' '));
        }
        html = fountainToScreenplayHtml(pages.join('\n\n'));
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

  const handleExportFountain = () => {
    if (!contentHtml && !title) { addToast('Nothing to export', 'error'); return; }
    const fountain = screenplayToFountain(contentHtml);
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
      addToast('DOCX export failed', 'error');
    }
  };

  const handlePrintPdf = () => {
    if (!contentHtml) { addToast('Nothing to print', 'error'); return; }
    const w = window.open('', '_blank');
    const tpHtml = titlePageData ? buildTitlePageHtml(titlePageData) : '';
    w.document.write(`<!DOCTYPE html><html><head><title>${title || 'Script'}</title><style>${screenStyles}</style></head><body>${tpHtml}${contentHtml}<p style="margin-top:2em;text-align:center;font-size:10pt;color:#999;">Generated by Nepal Film OS</p></body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
  };

  const handleServerExport = async (format) => {
    if (!activeId || !filmId) { addToast('Save the script first', 'error'); return; }
    try {
      const res = await scriptService.show(filmId, activeId);
      const script = res.data;
      const content = script.content || '';
      const tpWrapped = titlePageData ? wrapTitlePage(titlePageData) : '';
      const response = await fetch(`/api/films/${filmId}/scripts/${activeId}/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' },
        body: JSON.stringify({ html: tpWrapped + content, title: script.title || 'Screenplay' }),
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${script.title || 'screenplay'}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      addToast(`Exported as .${format}`);
    } catch { addToast(`Server export failed`, 'error'); }
  };

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

  const filteredScripts = useMemo(() => scripts.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())), [scripts, searchQuery]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      {/* Top Toolbar */}
      <header className="min-h-11 flex items-center flex-wrap gap-y-1 justify-between px-4 py-1 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center flex-wrap gap-y-1 gap-2">
          <button onClick={handleNew} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition shrink-0" title="New Script (Ctrl+N)">
            <FilePlus className="h-4 w-4" />
          </button>
          <button onClick={handleSave} disabled={saving} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition disabled:opacity-50 shrink-0" title="Save (Ctrl+S)">
            <Save className="h-4 w-4" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition shrink-0" title="Import (.fountain, .txt, .docx, .pdf)">
            <Upload className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-slate-700 mx-0.5 shrink-0" />
          <ScriptToolbar editor={editor} />
          <div className="w-px h-5 bg-slate-700 mx-0.5 shrink-0" />
          <button onClick={() => setShowFindReplace(!showFindReplace)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition shrink-0" title="Find & Replace (Ctrl+F)">
            <Search className="h-4 w-4" />
          </button>
          <button onClick={handlePrintPdf} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition shrink-0" title="Print to PDF (Ctrl+P)">
            <FileText className="h-4 w-4" />
          </button>
          <div className="relative group">
            <button className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition shrink-0" title="Export">
              <DownloadIcon className="h-4 w-4" />
            </button>
            <div className="absolute left-0 top-full mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button onClick={handleExportFountain} className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 first:rounded-t-lg">Export Fountain</button>
              <button onClick={handleExportTxt} className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700">Export Plain Text</button>
              <button onClick={handleExportHtml} className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700">Export HTML</button>
              <button onClick={handleExportDocx} className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700">Export DOCX</button>
              <div className="border-t border-slate-700 my-1" />
              <span className="block px-3 py-1 text-[10px] text-slate-500 uppercase tracking-wider">Server-side</span>
              <button onClick={() => handleServerExport('pdf')} className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700">Export PDF (server)</button>
              <button onClick={() => handleServerExport('docx')} className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700">Export DOCX (server)</button>
              <button onClick={() => handleServerExport('fountain')} className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 last:rounded-b-lg">Export Fountain (server)</button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={e => { setTitle(e.target.value); setDirty(true); }}
            placeholder="Script title..."
            className="bg-slate-800 border border-slate-700 text-slate-100 text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600 w-64"
          />
          {collaborators.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1.5 rounded-lg">
              <Users className="h-3.5 w-3.5" />
              <span>{collaborators.map(c => c.name).join(', ')} editing</span>
            </div>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-y-1 gap-2">
          <FontSelector editor={editor} />
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
            <ZoomOut className="h-3.5 w-3.5 text-slate-500" />
            <select value={zoom} onChange={e => setZoom(Number(e.target.value))} className="bg-transparent border-none text-slate-200 text-xs focus:outline-none w-16 appearance-none cursor-pointer">
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100%</option>
              <option value={125}>125%</option>
              <option value={150}>150%</option>
              <option value={200}>200%</option>
            </select>
            <ZoomIn className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <LanguageSelector editor={editor} />
          <div className="flex items-center gap-1">
            <button onClick={() => setTypewriterMode(!typewriterMode)} className={`p-1.5 rounded transition ${typewriterMode ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`} title="Typewriter Mode — keeps cursor centered while typing">
              <Target className="h-4 w-4" />
            </button>
            <button onClick={() => setShowPreview(!showPreview)} className={`p-1.5 rounded transition ${showPreview ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`} title="Preview">
              <Eye className="h-4 w-4" />
            </button>
            <button onClick={() => setShowSource(!showSource)} className={`p-1.5 rounded transition ${showSource ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`} title="Source">
              <Code className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Find/Replace Bar */}
      {showFindReplace && (
        <div className="h-10 flex items-center gap-2 px-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm z-30">
          <input type="text" placeholder="Find..." className="flex-1 max-w-md bg-slate-800 border border-slate-700 text-slate-100 text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500" />
          <input type="text" placeholder="Replace..." className="max-w-md bg-slate-800 border border-slate-700 text-slate-100 text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500" />
          <button className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 text-xs">Replace</button>
          <button className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 text-xs">Replace All</button>
          <button onClick={() => setShowFindReplace(false)} className="p-1.5 text-slate-400 hover:text-slate-100"><ChevronUp className="h-4 w-4" /></button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar - Scripts List */}
        <aside className="w-64 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Scripts</h3>
            <div className="flex items-center gap-1">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search scripts..." className="bg-slate-800 border border-slate-700 text-slate-100 text-xs px-2 py-1 rounded focus:outline-none focus:border-amber-500 w-full placeholder:text-slate-600" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading && scripts.length === 0 ? (
              <div className="flex items-center justify-center py-8"><Loader className="h-5 w-5 text-slate-500 animate-spin" /></div>
            ) : filteredScripts.length === 0 ? (
              <div className="text-center py-8"><BookOpen className="h-8 w-8 text-slate-600 mx-auto mb-2" /><p className="text-xs text-slate-500">No scripts yet</p></div>
            ) : filteredScripts.map(s => (
              <button key={s.id} onClick={() => handleSelect(s.id)} className={`w-full text-left group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all text-xs ${
                activeId === s.id ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}>
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{s.title}</span>
                <button onClick={(e) => handleDelete(s.id, e)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all">
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            ))}
          </div>
        </aside>

        {/* Center - Editor */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          {activeId !== null || title ? (
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              <div className="flex items-center gap-2 mb-2 shrink-0 px-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Screenplay</span>
                  <span className="text-xs text-slate-600">{charCount} chars &middot; ~{wordCount} words &middot; ~{pageCount} pages</span>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-1">
                  <button onClick={() => setRightPanel('scenes')} className={`p-1.5 rounded transition text-xs ${rightPanel === 'scenes' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`} title="Scenes">
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setRightPanel('comments')} className={`p-1.5 rounded transition text-xs ${rightPanel === 'comments' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`} title="Comments">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {scenes.filter(s => s.comments_count > 0).length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] rounded-full flex items-center justify-center">{scenes.filter(s => s.comments_count > 0).length}</span>}
                  </button>
                  <button onClick={() => setRightPanel('history')} className={`p-1.5 rounded transition text-xs ${rightPanel === 'history' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`} title="History">
                    <History className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setShowReports(true)} className="p-1.5 rounded transition text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800" title="Reports">
                    <BarChart3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setShowReadThrough(true)} className="p-1.5 rounded transition text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800" title="Read Through">
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex min-h-0 overflow-hidden">
                {!showSource ? (
                  <div className={`flex-1 flex ${showPreview ? 'flex-row' : ''}`}>
                    <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col min-w-0`}>
                      <div className="flex-1 overflow-y-auto min-h-0 screenplay-editor-wrapper relative">
                        <EditorContent editor={editor} className="min-h-full" />
                        <PageBreakRuler editor={editor} />
                      </div>
                      <ScriptBubbleMenu editor={editor} />
                      <CharacterAutocomplete editor={editor} />
                    </div>
                    {showPreview && !showSource && (
                      <div className="w-1/2 flex flex-col border-l border-slate-700 pl-3 min-w-0 bg-slate-900">
                        <div className="flex items-center justify-between mb-1 shrink-0 px-3 py-2">
                          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Preview</span>
                          <span className="text-xs text-slate-600">Screenplay format</span>
                        </div>
                        <div ref={previewRef} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-6 overflow-y-auto prose prose-sm prose-invert max-w-none screenplay-preview" dangerouslySetInnerHTML={{ __html: contentHtml }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1 shrink-0 px-4">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">HTML Source</span>
                      <span className="text-xs text-slate-600">{contentHtml.length} chars</span>
                    </div>
                    <textarea value={contentHtml} onChange={e => { editor?.commands.setContent(e.target.value); setDirty(true); }} className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs p-4 rounded-xl focus:outline-none focus:border-amber-500 resize-none font-mono leading-relaxed" />
                  </div>
                )}

                {/* Right Inspector Panel */}
                <aside className={`w-72 shrink-0 bg-slate-950 border-l border-slate-800 flex flex-col transition-all duration-300 ${expanded ? 'w-0 overflow-hidden' : ''}`}>
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                      {rightPanel === 'scenes' ? 'Scenes' : rightPanel === 'comments' ? 'Comments' : 'History'}
                    </span>
                    <button onClick={() => setExpanded(!expanded)} className="p-1 text-slate-400 hover:text-slate-100">
                      {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {rightPanel === 'scenes' && (
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{scenes.length} scenes</span>
                          <button onClick={handleExtractScenes} disabled={extracting || !activeId} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors disabled:opacity-50">
                            <RefreshCw className={`h-3 w-3 ${extracting ? 'animate-spin' : ''}`} /> {extracting ? 'Extracting...' : 'Re-detect'}
                          </button>
                        </div>
                        {scenes.length === 0 ? (
                          <div className="px-3 py-6 text-center">
                            <BookOpen className="h-6 w-6 text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-500">No scenes detected</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">Save and click Re-detect</p>
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                            {scenes.map(scene => {
                              const DayIcon = dayIcon(scene.day_or_night);
                              return (
                                <div key={scene.id} className="px-3 py-2 hover:bg-slate-800/30 transition-colors rounded">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">{scene.scene_number}</span>
                                      <span className="text-xs text-slate-300 truncate">{scene.scene_heading || 'No heading'}</span>
                                      <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">{scene.int_ext}</span>
                                      <DayIcon className="h-3 w-3 text-slate-500 shrink-0" />
                                      <span className="text-[10px] text-slate-600">{scene.page_count ? scene.page_count.toFixed(2) + 'p' : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <button onClick={() => handleMoveScene(scene.id, -1)} disabled={scene.order_index === 0} className="p-1 text-slate-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Move Up"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                                      <button onClick={() => handleMoveScene(scene.id, 1)} disabled={scene.order_index === scenes.length - 1} className="p-1 text-slate-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Move Down"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                                      {showSplitInput === scene.id ? (
                                        <div className="flex items-center gap-1">
                                          <input type="text" value={splitHeading} onChange={e => setSplitHeading(e.target.value)} placeholder="New scene heading..." className="w-36 bg-slate-800 border border-slate-700 text-[10px] text-slate-200 px-2 py-1 rounded focus:outline-none focus:border-amber-500" />
                                          <button onClick={() => handleSplitScene(scene.id)} className="p-1 text-amber-400 hover:text-amber-300" title="Split"><Scissors className="h-3 w-3" /></button>
                                          <button onClick={() => { setShowSplitInput(null); setSplitHeading(''); }} className="p-1 text-slate-500 hover:text-slate-300 text-[10px]" title="Cancel">Cancel</button>
                                        </div>
                                      ) : (
                                        <button onClick={() => { setShowSplitInput(scene.id); setSplitHeading('INT. '); }} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded text-slate-500 hover:text-amber-400 transition-colors" title="Split Scene"><Scissors className="h-3 w-3" /> Split</button>
                                      )}
                                      <button onClick={() => handleDeleteScene(scene.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="h-3 w-3" /></button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {rightPanel === 'comments' && (
                      <ScriptComments editor={editor} filmId={filmId} scriptId={activeId} onClose={() => setRightPanel('scenes')} />
                    )}
                    {rightPanel === 'history' && (
                      <ScriptHistory filmId={filmId} scriptId={activeId} currentTitle={title} currentContent={contentHtml} onRestore={(newTitle, newContent) => { setTitle(newTitle); editor?.commands.setContent(newContent); setDirty(false); setRightPanel('scenes'); }} onClose={() => setRightPanel('scenes')} />
                    )}
                  </div>
                </aside>
              </div>

              {/* Bottom Status Bar */}
              <footer className="h-8 flex items-center justify-between px-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Ln {editor?.state.selection?.anchor || 0}, Col {editor?.state.selection?.head || 0}</span>
                  <span>{wordCount} words</span>
                  <span>{charCount} chars</span>
                  <span>~{pageCount} pages</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {typewriterMode && <span className="text-amber-400 font-medium">TYP</span>}
                  <span>{language.toUpperCase()}</span>
                  <span>Screenplay</span>
                </div>
              </footer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-slate-800 mx-auto mb-4" />
                <h2 className="text-lg font-medium text-slate-500 mb-2">No Script Selected</h2>
                <p className="text-sm text-slate-600 mb-4">Create a new script, or import from Word/PDF</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={handleNew} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all">
                    <Plus className="h-4 w-4" /> New Script
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-all">
                    <Upload className="h-4 w-4" /> Import File
                  </button>
                </div>
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept=".fountain,.txt,.docx,.pdf" onChange={handleImportFile} className="hidden" />
        </main>

        {/* Modals */}
        {showTitlePage && (
          <TitlePageEditor data={titlePageData} onChange={handleTitlePageChange} onClose={() => setShowTitlePage(false)} />
        )}
        {showReports && <ScriptReports content={contentHtml} onClose={() => setShowReports(false)} />}
        {showReadThrough && <ReadThrough content={contentHtml} onClose={() => setShowReadThrough(false)} />}
        {showComments && <ScriptComments editor={editor} filmId={filmId} scriptId={activeId} onClose={() => setShowComments(false)} />}
        {showHistory && <ScriptHistory filmId={filmId} scriptId={activeId} currentTitle={title} currentContent={contentHtml} onRestore={(newTitle, newContent) => { setTitle(newTitle); editor?.commands.setContent(newContent); setDirty(false); setShowHistory(false); }} onClose={() => setShowHistory(false)} />}
      </div>
    </div>
  );
}