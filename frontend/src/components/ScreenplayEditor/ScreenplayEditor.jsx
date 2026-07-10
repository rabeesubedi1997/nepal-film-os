import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { ScreenplayNode, ELEMENT_TYPES, detectElementType } from '../../extensions/ScreenplayNode';
import { screenplayCSS } from './screenplayStyles';
import {
  FileText, Download, Upload, Print, Type, AlignLeft, AlignCenter,
  Bold, Italic, Underline as UnderlineIcon, ChevronLeft, ChevronRight,
  RotateCcw, Save, Loader2, AlertCircle, CheckCircle, Menu, X,
  Maximize2, Minimize2, Search, Replace, Undo, Redo
} from 'lucide-react';

const EMPTY_SCRIPT = '';

const FONT_FAMILIES = [
  { value: 'Courier Prime', label: 'Courier Prime (Standard)' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Noto Sans Devanagari', label: 'Noto Sans Devanagari (Nepali/Hindi)' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
];

const ELEMENT_TYPE_ORDER = ['scene-heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition'];

export default function ScreenplayEditor({ 
  initialContent = '', 
  title = 'Untitled Script',
  onSave,
  onExport,
  fontSize = 12,
  fontFamily = 'Courier Prime',
  readOnly = false 
}) {
  const editorRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [currentElementType, setCurrentElementType] = useState('action');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [importMode, setImportMode] = useState(null); // 'preserve' | 'convert'

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false, // We use our own paragraph replacement
        heading: false,
        codeBlock: false,
      }),
      ScreenplayNode,
      Underline,
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Placeholder.configure({
        placeholder: ({ editor }) => {
          if (editor.isEmpty) return 'Start writing your screenplay...';
          return '';
        },
      }),
      CharacterCount.configure({
        limit: 500000,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'screenplay-editor prose prose-sm max-w-none focus:outline-none',
        style: { fontSize: `${fontSize}pt`, fontFamily },
      },
      handleKeyDown: ({ event, editor }) => handleKeyDown(event, editor),
      handlePaste: ({ event, editor }) => handlePaste(event, editor),
    },
    onUpdate: ({ editor }) => {
      updateStats(editor);
      updateCurrentElementType(editor);
    },
  });

  const updateStats = useCallback((editor) => {
    if (!editor) return;
    const text = editor.getText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    // Rough page count: 1 page ≈ 55 lines ≈ 250 words
    setPageCount(Math.max(1, Math.ceil(words / 250)));
  }, []);

  const updateCurrentElementType = useCallback((editor) => {
    if (!editor) return;
    const { state } = editor;
    const { $from } = state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'screenplayNode') {
        setCurrentElementType(node.attrs.elementType || 'action');
        return;
      }
    }
    setCurrentElementType('action');
  }, []);

  const handleKeyDown = (event, editor) => {
    const { state, view } = editor;
    const { selection, schema } = state;
    const { $from } = selection;

    // Tab key - cycle element type
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      cycleElementType(editor, 1);
      return true;
    }
    if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      cycleElementType(editor, -1);
      return true;
    }

    // Enter key - smart next element
    if (event.key === 'Enter' && !event.shiftKey) {
      const currentNode = $from.node($from.depth);
      if (currentNode.type.name === 'screenplayNode') {
        const currentType = currentNode.attrs.elementType;
        const currentIndex = ELEMENT_TYPE_ORDER.indexOf(currentType);
        let nextType = 'action';
        
        if (currentType === 'scene-heading') nextType = 'action';
        else if (currentType === 'action') nextType = 'action';
        else if (currentType === 'character') nextType = 'dialogue';
        else if (currentType === 'parenthetical') nextType = 'dialogue';
        else if (currentType === 'dialogue') nextType = 'character';
        else if (currentType === 'transition') nextType = 'scene-heading';

        // If empty, change type; otherwise create new paragraph
        const isEmpty = currentNode.content.size === 0;
        if (isEmpty) {
          event.preventDefault();
          editor.chain().focus().setScreenplayElement(nextType).run();
        } else {
          event.preventDefault();
          editor.chain().focus().setScreenplayElement(nextType).run();
        }
        return true;
      }
    }

    // Shift+Enter - force new same-type paragraph
    if (event.key === 'Enter' && event.shiftKey) {
      const currentNode = $from.node($from.depth);
      if (currentNode.type.name === 'screenplayNode') {
        const currentType = currentNode.attrs.elementType;
        event.preventDefault();
        editor.chain().focus().setScreenplayElement(currentType).run();
        return true;
      }
    }

    return false;
  };

  const handlePaste = (event, editor) => {
    event.preventDefault();
    const html = event.clipboardData.getData('text/html');
    const text = event.clipboardData.getData('text/plain');
    
    if (html && importMode === 'preserve') {
      // Preserve formatting
      editor.chain().focus().pasteHTML(html).run();
    } else if (importMode === 'convert') {
      // Convert to screenplay
      convertTextToScreenplay(text, editor);
    } else {
      // Ask user
      setImportMode('convert'); // default
      convertTextToScreenplay(text, editor);
    }
  };

  const convertTextToScreenplay = (text, editor) => {
    const lines = text.split('\n');
    const nodes = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return { type: 'screenplayNode', attrs: { elementType: 'action' }, content: [{ type: 'text', text: '\u00A0' }] };
      const type = detectElementType(trimmed);
      return { type: 'screenplayNode', attrs: { elementType: type }, content: [{ type: 'text', text: trimmed }] };
    });
    editor.chain().focus().insertContent(nodes).run();
  };

  const cycleElementType = (editor, direction) => {
    const { state } = editor;
    const { $from } = state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'screenplayNode') {
        const currentType = node.attrs.elementType;
        const currentIndex = ELEMENT_TYPE_ORDER.indexOf(currentType);
        let nextIndex = (currentIndex + direction + ELEMENT_TYPE_ORDER.length) % ELEMENT_TYPE_ORDER.length;
        const nextType = ELEMENT_TYPE_ORDER[nextIndex];
        editor.chain().focus().setScreenplayElement(nextType).run();
        return;
      }
    }
    // Default to action if not in screenplay node
    editor.chain().focus().setScreenplayElement('action').run();
  };

  const handleExport = async (format) => {
    if (!editor) return;
    const content = editor.getHTML();
    
    switch (format) {
      case 'fountain':
        exportFountain(content);
        break;
      case 'pdf':
        await exportPDF(content);
        break;
      case 'docx':
        await exportDOCX(content);
        break;
      case 'txt':
        exportTXT(content);
        break;
      case 'html':
        exportHTML(content);
        break;
    }
  };

  const exportFountain = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = doc.querySelectorAll('[data-element-type]');
    let fountain = '';
    elements.forEach(el => {
      const type = el.getAttribute('data-element-type');
      const text = el.textContent.trim();
      if (!text) return;
      if (type === 'scene-heading') fountain += text.toUpperCase() + '\n\n';
      else if (type === 'character') fountain += text.toUpperCase() + '\n';
      else if (type === 'parenthetical') fountain += `(${text})\n`;
      else if (type === 'dialogue') fountain += text + '\n\n';
      else if (type === 'transition') fountain += text.toUpperCase() + '\n\n';
      else fountain += text + '\n\n';
    });
    downloadFile(fountain, `${title}.fountain`, 'text/plain');
  };

  const exportTXT = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const text = doc.body.textContent;
    downloadFile(text, `${title}.txt`, 'text/plain');
  };

  const exportHTML = (html) => {
    const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${screenplayCSS}</style></head><body>${html}</body></html>`;
    downloadFile(fullHTML, `${title}.html`, 'text/html');
  };

  const exportPDF = async (html) => {
    try {
      const response = await fetch('/api/screenplay/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/pdf' },
        body: JSON.stringify({ html, title, fontSize, fontFamily }),
      });
      if (response.ok) {
        const blob = await response.blob();
        downloadBlob(blob, `${title}.pdf`);
      } else {
        // Fallback to print
        printToPDF(html);
      }
    } catch {
      printToPDF(html);
    }
  };

  const printToPDF = (html) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>${screenplayCSS}@page { margin: 1in; }</style></head><body>${html}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const exportDOCX = async (html) => {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.convertToHtml({ html: `<html><body>${html}</body></html>` });
      const blob = new Blob([result.value], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      downloadBlob(blob, `${title}.docx`);
    } catch {
      // Fallback: download as HTML with .docx extension
      const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${screenplayCSS}</style></head><body>${html}</body></html>`;
      downloadFile(fullHTML, `${title}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    downloadBlob(blob, filename);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (ext === 'fountain' || ext === 'txt') {
      const text = await file.text();
      convertTextToScreenplay(text, editor);
    } else if (ext === 'docx') {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (importMode === 'preserve') {
        editor.chain().focus().pasteHTML(result.value).run();
      } else {
        convertTextToScreenplay(result.value, editor);
      }
    } else if (ext === 'pdf') {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `pdfjs-dist/build/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\n\n';
      }
      convertTextToScreenplay(fullText, editor);
    }
  };

  const handleSave = async () => {
    if (!editor || !onSave) return;
    setSaving(true);
    const html = editor.getHTML();
    try {
      await onSave({ html, title, wordCount, pageCount });
      setLastSaved(new Date());
    } finally {
      setSaving(false);
    }
  };

  // Auto-save
  useEffect(() => {
    if (!onSave) return;
    const interval = setInterval(() => {
      if (editor && !saving) handleSave();
    }, 30000);
    return () => clearInterval(interval);
  }, [editor, onSave, saving]);

  const handleFind = () => {
    if (!editor || !findText) return;
    const text = editor.getText();
    const index = text.toLowerCase().indexOf(findText.toLowerCase());
    if (index >= 0) {
      editor.chain().focus().setTextSelection(index, index + findText.length).run();
    }
  };

  const handleReplace = () => {
    if (!editor || !findText) return;
    editor.chain().focus().replaceText(findText, replaceText).run();
  };

  const handleReplaceAll = () => {
    if (!editor || !findText) return;
    editor.chain().focus().replaceText(findText, replaceText, { all: true }).run();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!editor) return <div className="flex items-center justify-center h-[400px] text-slate-500">Loading editor...</div>;

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950' : 'h-[calc(100vh-200px)']}`}>
      {/* Top Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800 flex-wrap shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={handleSave} disabled={saving} className="p-2 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition" title="Save (Ctrl+S)">
            <Save className="h-4 w-4" />
          </button>
          <span className="text-xs text-slate-500 px-2">{saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Not saved'}</span>
        </div>
        <div className="w-px h-6 bg-slate-700 mx-2" />
        <div className="flex items-center gap-1">
          <select value={fontFamily} onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()} className="bg-slate-800 border border-slate-700 text-slate-100 text-xs px-2 py-1 rounded focus:outline-none focus:border-amber-500">
            {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select value={fontSize} onChange={e => { const sz = parseInt(e.target.value); editor.chain().focus().setFontSize(sz).run(); document.querySelector('.screenplay-editor').style.fontSize = `${sz}pt`; }} className="bg-slate-800 border border-slate-700 text-slate-100 text-xs px-2 py-1 rounded focus:outline-none focus:border-amber-500 w-20">
            {[10, 11, 12, 13, 14].map(s => <option key={s} value={s}>{s}pt</option>)}
          </select>
        </div>
        <div className="w-px h-6 bg-slate-700 mx-2" />
        <div className="flex items-center gap-1">
          {ELEMENT_TYPES.map(type => (
            <button
              key={type}
              onClick={() => editor.chain().focus().setScreenplayElement(type).run()}
              className={`px-2 py-1 text-xs rounded transition ${currentElementType === type ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              title={type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
            >
              {type.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-slate-700 mx-2" />
        <div className="flex items-center gap-1">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded transition ${editor.isActive('bold') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="Bold (Ctrl+B)"><Bold className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded transition ${editor.isActive('italic') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="Italic (Ctrl+I)"><Italic className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded transition ${editor.isActive('underline') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="Underline (Ctrl+U)"><UnderlineIcon className="h-4 w-4" /></button>
        </div>
        <div className="w-px h-6 bg-slate-700 mx-2" />
        <div className="flex items-center gap-1">
          <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-1.5 rounded transition ${editor.isActive({ textAlign: 'left' }) ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="Align Left"><AlignLeft className="h-4 w-4" /></button>
          <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-1.5 rounded transition ${editor.isActive({ textAlign: 'center' }) ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="Align Center"><AlignCenter className="h-4 w-4" /></button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{wordCount} words · ~{pageCount} pages</span>
          <button onClick={() => setShowFindReplace(!showFindReplace)} className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition" title="Find/Replace (Ctrl+F)"><Search className="h-4 w-4" /></button>
          <button onClick={toggleFullscreen} className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Find/Replace Bar */}
      {showFindReplace && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
          <input value={findText} onChange={e => setFindText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFind()} placeholder="Find..." className="flex-1 max-w-md bg-slate-800 border border-slate-700 text-slate-100 text-sm px-3 py-1.5 rounded focus:outline-none focus:border-amber-500" />
          <input value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Replace..." className="max-w-md bg-slate-800 border border-slate-700 text-slate-100 text-sm px-3 py-1.5 rounded focus:outline-none focus:border-amber-500" />
          <button onClick={handleFind} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 text-xs">Find</button>
          <button onClick={handleReplace} className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30 text-xs">Replace</button>
          <button onClick={handleReplaceAll} className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded hover:bg-amber-400 text-xs">Replace All</button>
          <button onClick={() => setShowFindReplace(false)} className="p-1.5 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line numbers / gutter */}
        <div className="w-12 bg-slate-900 border-r border-slate-800 flex-shrink-0 overflow-hidden" />
        
        {/* Main Editor */}
        <div className="flex-1 min-w-0 relative">
          <EditorContent editor={editor} className="h-full screenplay-editor-content" />
          
          {/* Page break indicators */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(pageCount)].map((_, i) => (
              <div key={i} className="absolute left-12 right-0 border-t border-dashed border-slate-700/50" style={{ top: `${(i + 1) * 800}px` }}>
                <span className="absolute -top-4 right-4 text-[10px] text-slate-600 bg-slate-950 px-1">Page {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-t border-slate-800 shrink-0 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>{currentElementType.charAt(0).toUpperCase() + currentElementType.slice(1).replace('-', ' ')}</span>
          <span>Ln {editor.state.selection.$from.pos}, Col {editor.state.selection.$from.pos}</span>
          <span>{wordCount} words</span>
          <span>Page {pageCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={fontSize} onChange={e => { const sz = parseInt(e.target.value); editor.chain().focus().setFontSize(sz).run(); }} className="bg-slate-800 border border-slate-700 text-slate-100 text-xs px-2 py-1 rounded focus:outline-none focus:border-amber-500 w-16">
            {[10, 11, 12, 13, 14].map(s => <option key={s} value={s}>{s}pt</option>)}
          </select>
        </div>
      </div>

      {/* Import Mode Dialog */}
      {importMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setImportMode(null)}>
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Import Mode</h3>
            <p className="text-slate-400 mb-4">How should we handle this import?</p>
            <div className="space-y-2">
              <button onClick={() => { setImportMode('preserve'); }} className="w-full p-3 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-left">
                <div className="font-medium">Preserve Formatting</div>
                <div className="text-sm text-slate-500">Keep original styles, headings, bold, italic</div>
              </button>
              <button onClick={() => { setImportMode('convert'); }} className="w-full p-3 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-left">
                <div className="font-medium">Convert to Screenplay</div>
                <div className="text-sm text-slate-500">Auto-detect Scene/Action/Character/Dialogue</div>
              </button>
            </div>
            <button onClick={() => setImportMode(null)} className="mt-4 w-full p-2 text-slate-400 hover:text-white text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}