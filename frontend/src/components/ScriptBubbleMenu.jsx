import { BubbleMenu } from '@tiptap/react/menus';
import { Bold, Italic, Underline as UnderlineIcon, Type } from 'lucide-react';

const FONT_FAMILIES = [
  { value: 'inherit', label: 'Default' },
  { value: '"Courier Prime", "Courier New", monospace', label: 'Courier Prime' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New' },
  { value: '"Noto Sans Devanagari", "Mangal", "Nirmala UI", sans-serif', label: 'Noto Sans Devanagari' },
  { value: '"Tiro Devanagari Sanskrit", "Kokila", serif', label: 'Tiro Devanagari' },
  { value: '"Noto Sans", sans-serif', label: 'Noto Sans' },
  { value: 'Arial, "Helvetica Neue", Helvetica, sans-serif', label: 'Arial' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: 'Calibri, "Segoe UI", sans-serif', label: 'Calibri' },
  { value: '"Mukta", sans-serif', label: 'Mukta' },
];

export default function ScriptBubbleMenu({ editor }) {
  if (!editor) return null;

  const currentFont = editor.getAttributes('paragraph')?.fontFamily || 'inherit';

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150, placement: 'top' }}
      shouldShow={({ editor: ed, view, state, oldState, from, to }) => {
        return from !== to && !ed.isActive('link');
      }}
      className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50"
    >
      <select
        value={currentFont}
        onChange={(e) => {
          const font = e.target.value;
          if (!editor) return;
          editor.chain().focus().setParagraphFontFamily(font === 'inherit' ? null : font).run();
        }}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] px-1.5 py-1 rounded focus:outline-none focus:border-amber-500 cursor-pointer min-w-[110px]"
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>

      <div className="w-px h-4 bg-slate-700 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded transition-colors ${editor.isActive('bold') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded transition-colors ${editor.isActive('italic') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1 rounded transition-colors ${editor.isActive('underline') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        title="Underline"
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </button>
    </BubbleMenu>
  );
}
