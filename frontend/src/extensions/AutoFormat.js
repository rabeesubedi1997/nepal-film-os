import { detectElementType } from './ScreenplayNode';

export function applyAutoFormatting(editor) {
  if (!editor) return;

  const { doc, tr } = editor.state;
  const screenNodeType = editor.state.schema.nodes.paragraph;
  if (!screenNodeType) return;

  let modified = false;

  doc.descendants((node, pos) => {
    if (node.type !== screenNodeType) return;

    const text = node.textContent;
    if (!text) return;

    const detected = detectElementType(text);
    if (detected !== node.attrs.type) {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        type: detected,
      });
      modified = true;
    }
  });

  if (modified) {
    editor.view.dispatch(tr);
  }
}
