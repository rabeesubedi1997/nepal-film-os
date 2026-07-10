import {
  Clapperboard, MapPin, User, MessageSquare, Quote,
  ArrowRight,
  Bold, Italic, Underline as UnderlineIcon, Link,
  Minus, RemoveFormatting, List, ListOrdered as ListOrderedIcon,
  Type, Languages,
} from 'lucide-react';
import { ELEMENT_TYPES } from '../extensions';
import { transliterateWord } from '../services/transliteration';

const typeIcons = {
  'scene-heading': MapPin,
  'action': Clapperboard,
  'character': User,
  'parenthetical': Quote,
  'dialogue': MessageSquare,
  'transition': ArrowRight,
};

const typeLabels = {
  'scene-heading': 'Scene Heading',
  'action': 'Action',
  'character': 'Character',
  'parenthetical': 'Parenthetical',
  'dialogue': 'Dialogue',
  'transition': 'Transition',
};

const FONT_FAMILIES = [
  { value: 'inherit', label: 'Default (Screenplay)' },
  { value: '"Courier Prime", "Courier New", monospace', label: 'Courier Prime (Screenplay)' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New' },
  { value: '"Noto Sans Devanagari", "Mangal", "Nirmala UI", sans-serif', label: 'Noto Sans Devanagari (Nepali/Hindi)' },
  { value: '"Tiro Devanagari Sanskrit", "Kokila", serif', label: 'Tiro Devanagari (Nepali/Hindi)' },
  { value: '"Noto Sans", sans-serif', label: 'Noto Sans (Multi-script)' },
  { value: 'Arial, "Helvetica Neue", Helvetica, sans-serif', label: 'Arial' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', label: 'Segoe UI' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, "Segoe UI", Geneva, sans-serif', label: 'Tahoma' },
  { value: 'Calibri, "Segoe UI", sans-serif', label: 'Calibri' },
  { value: 'Cambria, "Times New Roman", Times, serif', label: 'Cambria' },
  { value: '"Noto Serif Devanagari", serif', label: 'Noto Serif Devanagari (Nepali/Hindi)' },
  { value: '"Mukta", sans-serif', label: 'Mukta (Nepali/Hindi)' },
];

const MenuButton = ({ onClick, active, children, title }) => (
  <button type="button" onClick={onClick} title={title}
    className={`p-1.5 rounded transition-colors ${active ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-slate-700 mx-1" />;

const FontSelector = ({ editor }) => {
  const currentFont = editor?.getAttributes('textStyle').fontFamily || 'inherit';
  const handleChange = (e) => {
    const font = e.target.value;
    if (!editor) return;
    if (font === 'inherit') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(font).run();
    }
  };
  
  return (
    <select
      value={currentFont}
      onChange={handleChange}
      className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer min-w-[140px]"
      title="Font Family"
    >
      {FONT_FAMILIES.map((font) => (
        <option key={font.value} value={font.value} style={{ fontFamily: font.value.replace(/['"]/g, '').split(',')[0].trim() }}>
          {font.label}
        </option>
      ))}
    </select>
  );
};

export default function ScriptToolbar({ editor }) {
  if (!editor) return null;

  const setType = (type) => {
    editor.chain().focus().setScreenplayElement(type).run();
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-slate-900 rounded-lg border border-slate-800">
      <div className="flex items-center gap-1 mr-1 pr-2 border-r border-slate-700">
        {ELEMENT_TYPES.filter(t => t !== 'shot' && t !== 'general').map((type, i) => {
          const Icon = typeIcons[type];
          const label = typeLabels[type];
          return (
            <MenuButton
              key={type}
              onClick={() => setType(type)}
              active={editor.isActive('paragraph', { elementType: type })}
              title={`${label} (Ctrl+${i + 1})`}
            >
              <Icon className="h-3.5 w-3.5" />
            </MenuButton>
          );
        })}
      </div>

      <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <Bold className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <Italic className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
        <UnderlineIcon className="h-3.5 w-3.5" />
      </MenuButton>

      <Divider />

      <MenuButton onClick={() => {
        const prev = editor.getAttributes('link').href;
        const url = window.prompt('Link URL', prev || 'https://');
        if (url === null) return;
        if (url === '') { editor.chain().focus().unsetLink().run(); return; }
        editor.chain().focus().setLink({ href: url }).run();
      }} active={editor.isActive('link')} title="Link">
        <Link className="h-3.5 w-3.5" />
      </MenuButton>

      <Divider />

      <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
        <List className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
        <ListOrderedIcon className="h-3.5 w-3.5" />
      </MenuButton>

      <Divider />

      <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <Minus className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting">
        <RemoveFormatting className="h-3.5 w-3.5" />
      </MenuButton>

      <Divider />

      <MenuButton onClick={() => {
        const { from, to, empty } = editor.state.selection;
        if (empty) return;
        const text = editor.state.doc.textBetween(from, to);
        const converted = transliterateWord(text);
        if (converted !== text) {
          editor.chain().focus().deleteSelection().insertContent(converted).run();
        }
      }} title="Convert selected text to Devanagari (Ctrl+T)">
        <Languages className="h-3.5 w-3.5" />
      </MenuButton>

    </div>
  );
}

export { FontSelector };
