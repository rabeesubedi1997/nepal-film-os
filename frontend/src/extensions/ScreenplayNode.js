import Paragraph from '@tiptap/extension-paragraph';

export const ELEMENT_TYPES = [
  'scene-heading',
  'action',
  'character',
  'parenthetical',
  'dialogue',
  'transition',
  'shot',
  'general',
];

const SCENE_HEADING_PATTERN = /^(INT|EXT|INT\/EXT|I\/E)\.?\s+/i;
const TRANSITION_PATTERN = /^(CUT TO|FADE TO|FADE OUT|FADE IN|DISSOLVE TO|SMASH CUT TO|MATCH CUT TO|JUMP CUT TO|WIPE TO|IRIS IN|IRIS OUT)\.?/i;
const CHARACTER_PATTERN = /^[A-Z][A-Z\s\.\-']+$/;
const PARENTHETICAL_PATTERN = /^\(.+\)$/;
const SHOT_PATTERN = /^(CLOSE ON|CLOSE UP|CLOSEUP|WIDE SHOT|WIDE|MEDIUM SHOT|MEDIUM|POV|POINT OF VIEW|ANGLE ON|PAN|TILT|ZOOM|TRACKING|DOLLY|CRANE|AERIAL|INSERT|INTERCUT|SPLIT SCREEN|MONTAGE|SERIES OF SHOTS)\s*:?/i;

export function detectElementType(text) {
  const trimmed = text.trim();
  if (!trimmed) return 'action';
  if (SCENE_HEADING_PATTERN.test(trimmed)) return 'scene-heading';
  if (TRANSITION_PATTERN.test(trimmed)) return 'transition';
  if (SHOT_PATTERN.test(trimmed)) return 'shot';
  if (PARENTHETICAL_PATTERN.test(trimmed)) return 'parenthetical';
  if (CHARACTER_PATTERN.test(trimmed) && trimmed.length < 40 && !trimmed.includes('  ')) return 'character';
  return 'action';
}

export const ScreenplayNode = Paragraph.extend({
  addAttributes() {
    return {
      elementType: {
        default: 'action',
        parseHTML: element => element.getAttribute('data-element-type') || element.getAttribute('data-type') || 'action',
        renderHTML: attributes => ({
          'data-element-type': attributes.elementType,
          class: `screenplay-${attributes.elementType}`,
        }),
      },
      sceneNumber: {
        default: null,
        parseHTML: element => element.getAttribute('data-scene-number') || null,
        renderHTML: attributes => attributes.sceneNumber ? { 'data-scene-number': attributes.sceneNumber } : {},
      },
    };
  },

  parseHTML() {
    return [
      ...this.parent?.(),
      { tag: 'div[data-element-type]' },
      { tag: 'div[data-type]' },
      { tag: 'p[data-type]' },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.elementType;
    return ['p', {
      ...HTMLAttributes,
      class: `screenplay-element screenplay-${type}`,
      'data-element-type': type,
    }, 0];
  },

  addCommands() {
    return {
      setScreenplayElement: (elementType) => ({ commands, editor }) => {
        if (!ELEMENT_TYPES.includes(elementType)) return false;
        const { selection } = editor.state;
        const { $from } = selection;
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'paragraph') {
            const pos = $from.before(depth);
            return commands.setNodeMarkup(pos, undefined, { ...node.attrs, elementType });
          }
        }
        return commands.insertContent({
          type: 'paragraph',
          attrs: { elementType },
          content: [{ type: 'text', text: '\u00A0' }],
        });
      },
    };
  },

  addKeyboardShortcuts() {
    const shortcuts = {};
    ELEMENT_TYPES.forEach((type, index) => {
      const num = index + 1;
      if (num <= 9) {
        shortcuts[`Mod-${num}`] = () => this.editor.commands.setScreenplayElement(type);
      }
    });
    return shortcuts;
  },

  addInputRules() {
    return [
      { find: /^INT\.?\s/, type: this.type, getAttributes: () => ({ elementType: 'scene-heading' }) },
      { find: /^EXT\.?\s/, type: this.type, getAttributes: () => ({ elementType: 'scene-heading' }) },
      { find: /^CUT TO:?$/i, type: this.type, getAttributes: () => ({ elementType: 'transition' }) },
      { find: /^FADE (IN|OUT):?$/i, type: this.type, getAttributes: () => ({ elementType: 'transition' }) },
      { find: /^\(.+\)$/, type: this.type, getAttributes: () => ({ elementType: 'parenthetical' }) },
    ];
  },
});
