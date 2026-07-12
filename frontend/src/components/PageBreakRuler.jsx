import { useMemo } from 'react';

const LINE_HEIGHT_PT = 12;
const LINE_SPACING = 1.5;
const LINES_PER_INCH = 72 / (LINE_HEIGHT_PT * LINE_SPACING);
const PAGE_HEIGHT_IN = 9.5;
const LINES_PER_PAGE = Math.round(LINES_PER_INCH * PAGE_HEIGHT_IN);

function estimateScreenplayLines(doc) {
  let totalLines = 0;
  doc.descendants((node) => {
    if (node.type.name !== 'paragraph') return;
    const text = node.textContent;
    const type = node.attrs.elementType;
    const textLines = text ? Math.max(1, Math.ceil(text.length / 55)) : 1;
    switch (type) {
      case 'scene-heading': totalLines += 2 + textLines; break;
      case 'character': totalLines += 2 + textLines; break;
      case 'parenthetical': totalLines += 1 + textLines; break;
      case 'dialogue': totalLines += 1 + textLines; break;
      case 'transition': totalLines += 2 + textLines; break;
      default: totalLines += 1 + textLines; break;
    }
  });
  return totalLines;
}

export default function PageBreakRuler({ editor }) {
  if (!editor) return null;

  const { lines, pageCount } = useMemo(() => {
    const l = estimateScreenplayLines(editor.state.doc);
    return { lines: l, pageCount: Math.max(1, Math.round(l / LINES_PER_PAGE)) };
  }, [editor.state.doc]);

  if (pageCount <= 1) return null;

  const pageBreaks = [];
  for (let i = 1; i < pageCount; i++) {
    pageBreaks.push(i);
  }

  return (
    <div className="absolute left-0 top-0 bottom-0 w-6 pointer-events-none z-10">
      {pageBreaks.map((page) => (
        <div
          key={page}
          className="absolute right-0 left-0 h-px flex items-center justify-end pr-1"
          style={{ top: `${(page / pageCount) * 100}%` }}
        >
          <span className="text-[8px] text-slate-600 font-mono">{page}</span>
          <div className="w-full h-px bg-slate-700/50 ml-1" />
        </div>
      ))}
    </div>
  );
}
