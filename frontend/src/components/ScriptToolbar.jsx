import {
  Clapperboard, MapPin, User, MessageSquare, Quote,
  ArrowRight,
  Bold, Italic, Underline as UnderlineIcon, Link,
  Minus, RemoveFormatting, List, ListOrdered as ListOrderedIcon,
} from 'lucide-react';
import { ELEMENT_TYPES } from '../extensions';

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

const MenuButton = ({ onClick, active, children, title }) => (
  <button type="button" onClick={onClick} title={title}
    className={`p-1.5 rounded transition-colors ${active ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-slate-700 mx-1" />;

export default function ScriptToolbar({ editor }) {
  if (!editor) return null;

  const currentType = editor.getAttributes('screenplayNode').type || 'action';
  const isScreenplay = editor.isActive('screenplayNode');

  const setType = (type) => {
    editor.chain().focus().setScriptElement(type).run();
  };

  return (
    <div className="flex items-center flex-wrap gap-0.5 px-1 py-1 bg-slate-900 rounded-lg border border-slate-800">
      <div className="flex items-center gap-0.5 mr-1 pr-1 border-r border-slate-700">
        {Object.keys(ELEMENT_TYPES).map((type) => {
          const Icon = typeIcons[type];
          const label = typeLabels[type];
          return (
            <MenuButton
              key={type}
              onClick={() => setType(type)}
              active={isScreenplay && currentType === type}
              title={`${label} (${ELEMENT_TYPES[type].shortcut})`}
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
    </div>
  );
}
