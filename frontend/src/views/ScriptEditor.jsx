import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import { scriptService } from '../services/scriptService';
import { useAuthStore } from '../authStore';
import { useToastStore } from '../toastStore';
import echo from '../echo';
import {
  Plus, Eye, Trash2, Save, FileText,
  Loader, BookOpen, Code, Upload, Download, Printer, Users, Scissors,
  ListOrdered, Sun, Moon, Sunrise, Sunset, RefreshCw,
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered as ListOrderedIcon, Quote, Minus, Link, AlignLeft, AlignCenter, AlignRight,
  RemoveFormatting, Maximize2, Minimize2
} from 'lucide-react';

const DEFAULT_TITLE = 'Untitled Script';
const EMPTY_CONTENT = '<p>INT. ROOM - DAY</p><p>A desk is covered in papers.</p><p><br></p><p><strong>WRITER</strong></p><p><em>(quietly)</em></p><p>Time to write.</p><p><br></p><p>FADE OUT.</p>';

const MenuButton = ({ onClick, active, children, title }) => (
  <button type="button" onClick={onClick} title={title}
    className={`p-1.5 rounded transition-colors ${active ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-slate-700 mx-1" />;

export default function ScriptEditor() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing your script...' }),
      LinkExtension.configure({ openOnClick: false }),
    ],
    content: '',
    onUpdate: () => { setDirty(true); },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none prose-invert focus:outline-none min-h-[400px] p-4 rounded-xl bg-slate-900 border border-slate-700 focus-within:border-amber-500',
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

  const activeScript = scripts.find(s => s.id === activeId);

  const handleSelect = async (id) => {
    if (dirty) { if (!confirm('You have unsaved changes. Discard them?')) return; }
    setDirty(false); setLoading(true);
    try {
      const res = await scriptService.show(filmId, id);
      const s = res.data;
      setActiveId(s.id); setTitle(s.title);
      editor?.commands.setContent(s.content || '');
    } catch { addToast('Failed to load script', 'error'); }
    setLoading(false);
  };

  const handleNew = () => {
    if (dirty) { if (!confirm('Discard unsaved changes?')) return; }
    setActiveId(null); setTitle(DEFAULT_TITLE);
    editor?.commands.setContent(EMPTY_CONTENT);
    setDirty(false);
  };

  const handleSave = async () => {
    if (!title.trim()) { addToast('Script needs a title', 'error'); return; }
    setSaving(true);
    try {
      const data = { title, content: contentHtml };
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
      let text = '';
      if (ext === 'fountain' || ext === 'txt') {
        text = await file.text();
      } else if (ext === 'docx') {
        const mammoth = await import('mammoth');
        const buf = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buf });
        text = result.value;
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
        text = pages.join('\n\n');
      } else {
        addToast('Unsupported file format. Use .fountain, .txt, .docx, or .pdf', 'error');
        return;
      }
      if (dirty) { if (!confirm('Replace current content with imported text?')) return; }
      const baseName = file.name.replace(/\.[^.]+$/, '');
      setTitle(baseName);
      editor?.commands.setContent(text.startsWith('<') ? text : text.split('\n').map(l => `<p>${l}</p>`).join(''));
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
    const plainText = contentHtml.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (title || 'script') + '.fountain';
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported as .fountain');
  };

  const handleExportTxt = () => {
    if (!contentHtml && !title) { addToast('Nothing to export', 'error'); return; }
    const plainText = contentHtml.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (title || 'script') + '.txt';
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported as .txt');
  };

  const handlePrintPdf = () => {
    if (!contentHtml) { addToast('Nothing to print', 'error'); return; }
    const w = window.open('', '_blank');
    const printContent = contentHtml
      .replace(/<p>/g, '<p style="margin:0 0 0.5em 0;line-height:1.5;">')
      .replace(/<h1>/g, '<h1 style="font-size:14pt;font-weight:700;margin:1em 0 0.5em 0;text-transform:uppercase;">')
      .replace(/<h2>/g, '<h2 style="font-size:12pt;font-weight:700;margin:1em 0 0.5em 0;">')
      .replace(/<h3>/g, '<h3 style="font-size:11pt;font-weight:600;margin:0.5em 0;">');
    w.document.write(`<!DOCTYPE html><html><head><title>${title || 'Script'}</title>
<style>
  @page { margin: 0.5in; size: letter; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 12pt; line-height: 1.5; color: #000; max-width: 6.5in; margin: 0 auto; }
  p { margin: 0 0 0.5em 0; line-height: 1.5; }
  h1, h2, h3 { margin: 1em 0 0.5em 0; }
  h1 { font-size: 14pt; font-weight: 700; text-transform: uppercase; }
  blockquote { margin-left: 2em; font-style: italic; }
  ul, ol { margin: 0.5em 0; padding-left: 2em; }
</style></head><body>
${printContent}
<p style="margin-top:2em;text-align:center;font-size:10pt;color:#999;">Generated by Nepal Film OS</p>
</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
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

  const toggleLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('Link URL', prev || 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <h1 className="text-lg font-bold text-slate-100">Script Editor</h1>
        <div className="flex items-center gap-1.5">
          {(title || activeId !== null) && (
            <>
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

              <div className="flex items-center flex-wrap gap-0.5 mb-1.5 px-1 py-1 bg-slate-900 rounded-lg border border-slate-800">
                <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold className="h-3.5 w-3.5" /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic className="h-3.5 w-3.5" /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon className="h-3.5 w-3.5" /></MenuButton>
                <MenuButton onClick={toggleLink} active={editor.isActive('link')} title="Link"><Link className="h-3.5 w-3.5" /></MenuButton>
                <Divider />
                <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 className="h-3.5 w-3.5" /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 className="h-3.5 w-3.5" /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 className="h-3.5 w-3.5" /></MenuButton>
                <Divider />
                <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List className="h-3.5 w-3.5" /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List"><ListOrderedIcon className="h-3.5 w-3.5" /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote className="h-3.5 w-3.5" /></MenuButton>
                <Divider />
                <MenuButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft className="h-3.5 w-3.5" /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter className="h-3.5 w-3.5" /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight className="h-3.5 w-3.5" /></MenuButton>
                <Divider />
                <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus className="h-3.5 w-3.5" /></MenuButton>
                <MenuButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting"><RemoveFormatting className="h-3.5 w-3.5" /></MenuButton>
              </div>

              <div className="flex-1 flex gap-3 min-h-0">
                {!showSource ? (
                  <div className={`flex flex-col ${showPreview ? 'flex-1' : 'flex-1'}`}>
                    <div className="flex items-center justify-between mb-1 shrink-0">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Editor</span>
                      <span className="text-xs text-slate-600">{editor.storage.characterCount?.characters?.() || contentHtml.replace(/<[^>]*>/g, '').length} chars</span>
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
                      <span className="text-xs text-slate-600">Rich text</span>
                    </div>
                    <div ref={previewRef} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-6 overflow-y-auto prose prose-sm prose-invert max-w-none"
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
    </div>
  );
}
