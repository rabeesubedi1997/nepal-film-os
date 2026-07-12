import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export function extractCharacterNames(doc) {
  const names = new Set();
  doc.descendants((node) => {
    if (node.type.name === 'paragraph' && node.attrs.elementType === 'character') {
      const name = node.textContent.trim().toUpperCase();
      if (name && name.length > 0) names.add(name);
    }
  });
  return Array.from(names).sort();
}

export default function CharacterAutocomplete({ editor }) {
  const [characters, setCharacters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [show, setShow] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const inputRef = useRef('');

  useEffect(() => {
    if (!editor) return;
    const chars = extractCharacterNames(editor.state.doc);
    setCharacters(chars);
    const handleUpdate = () => {
      const chars = extractCharacterNames(editor.state.doc);
      setCharacters(chars);
    };
    editor.on('update', handleUpdate);
    return () => editor.off('update', handleUpdate);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const handleKeyDown = (view, event) => {
      if (show && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault();
        setSelectedIdx(prev => {
          if (event.key === 'ArrowDown') return Math.min(prev + 1, filtered.length - 1);
          return Math.max(prev - 1, 0);
        });
        return true;
      }
      if (show && event.key === 'Enter' && filtered[selectedIdx]) {
        event.preventDefault();
        applySuggestion(filtered[selectedIdx]);
        return true;
      }
      if (show && event.key === 'Escape') {
        setShow(false);
        event.preventDefault();
        return true;
      }
      return false;
    };

    const handleSelectionUpdate = () => {
      const { selection } = editor.state;
      const { $from } = selection;
      let inCharacter = false;
      for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type.name === 'paragraph' && node.attrs.elementType === 'character') {
          inCharacter = true;
          break;
        }
      }
      if (!inCharacter) { setShow(false); return; }

      const textBefore = editor.state.doc.textBetween(
        Math.max(0, $from.pos - 20),
        $from.pos
      ).trim().toUpperCase();

      if (!textBefore || textBefore.length < 2) { setShow(false); return; }

      const matches = characters.filter(c => c.startsWith(textBefore) && c !== textBefore);
      if (matches.length === 0) { setShow(false); return; }

      const coords = editor.view.coordsAtPos($from.pos);
      const editorRect = editor.view.dom.getBoundingClientRect();
      setDropdownPos({
        top: coords.bottom - editorRect.top + 4,
        left: coords.left - editorRect.left,
      });
      setFiltered(matches);
      setSelectedIdx(0);
      inputRef.current = textBefore;
      setShow(true);
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('update', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('update', handleSelectionUpdate);
    };
  }, [editor, characters, show, filtered, selectedIdx]);

  const applySuggestion = useCallback((name) => {
    if (!editor) return;
    const { selection } = editor.state;
    const { $from } = selection;
    const textBefore = editor.state.doc.textBetween(
      Math.max(0, $from.pos - 20),
      $from.pos
    );
    const startPos = $from.pos - textBefore.length;
    const beforeMatch = textBefore.toUpperCase().match(/^[A-Z\s\.\-']+/);
    if (!beforeMatch) { setShow(false); return; }
    const actualStart = $from.pos - beforeMatch[0].length;
    const tr = editor.state.tr.replaceWith(actualStart, $from.pos, editor.state.schema.text(name));
    editor.view.dispatch(tr);
    editor.view.focus();
    setShow(false);
  }, [editor]);

  if (!show || filtered.length === 0) return null;

  return (
    <div
      className="fixed z-[100] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl shadow-black/50 py-1 min-w-[180px] max-h-[200px] overflow-y-auto"
      style={{ top: dropdownPos.top, left: dropdownPos.left }}
    >
      {filtered.map((name, i) => (
        <button
          key={name}
          onMouseDown={(e) => { e.preventDefault(); applySuggestion(name); }}
          onMouseEnter={() => setSelectedIdx(i)}
          className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
            i === selectedIdx ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
