import { Node, mergeAttributes } from '@tiptap/core';

export const ELEMENT_TYPES = {
  'scene-heading': {
    label: 'Scene Heading',
    shortcut: 'Mod-Alt-1',
    nextOnEnter: 'action',
  },
  action: {
    label: 'Action',
    shortcut: 'Mod-Alt-2',
    nextOnEnter: 'action',
  },
  character: {
    label: 'Character',
    shortcut: 'Mod-Alt-3',
    nextOnEnter: 'parenthetical',
  },
  parenthetical: {
    label: 'Parenthetical',
    shortcut: 'Mod-Alt-4',
    nextOnEnter: 'dialogue',
  },
  dialogue: {
    label: 'Dialogue',
    shortcut: 'Mod-Alt-5',
    nextOnEnter: 'dialogue',
  },
  transition: {
    label: 'Transition',
    shortcut: 'Mod-Alt-6',
    nextOnEnter: 'action',
  },
};

const SCENE_PATTERN = /^(INT|EXT|INT\.\/EXT\.|I\/E|INT\/EXT)[.\s]/i;
const TRANSITION_PATTERN = /^[A-Z\s]+TO:$/;
const CHARACTER_PATTERN = /^[A-Z][A-Z\s.'-]+$/;
const PARENTHETICAL_PATTERN = /^\(.+\)$/;
const SHOT_PATTERN = /^(ANGLE ON|CLOSE ON|CLOSE UP|PAN TO|PUSH IN|PULL BACK|TRACK WITH|CRANE|FLOATING CAMERA|POV|POINT OF VIEW|REVERSE|WIDE SHOT|MEDIUM SHOT|ESTABLISHING)/i;

export function detectElementType(text) {
  const trimmed = text.trim();
  if (!trimmed) return 'action';
  if (SCENE_PATTERN.test(trimmed) || trimmed.startsWith('.')) {
    return 'scene-heading';
  }
  if (TRANSITION_PATTERN.test(trimmed)) {
    return 'transition';
  }
  if (SHOT_PATTERN.test(trimmed)) {
    return 'action';
  }
  if (PARENTHETICAL_PATTERN.test(trimmed)) {
    return 'parenthetical';
  }
  if (CHARACTER_PATTERN.test(trimmed) && trimmed.length >= 2 && !trimmed.includes('  ') && !trimmed.endsWith('.')) {
    return 'character';
  }
  return 'action';
}

export const ScreenplayNode = Node.create({
  name: 'screenplayNode',

  group: 'block',

  content: 'inline*',

  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'action',
        parseHTML: (el) => el.getAttribute('data-type') || 'action',
        renderHTML: (attrs) => ({ 'data-type': attrs.type }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.type || 'action';
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': type,
        class: `screenplay-element screenplay-${type}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setScriptElement:
        (type) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { type }),
    };
  },

  addKeyboardShortcuts() {
    const shortcuts = {};
    Object.entries(ELEMENT_TYPES).forEach(([type, config]) => {
      if (config.shortcut) {
        shortcuts[config.shortcut] = () =>
          this.editor.commands.setScriptElement(type);
      }
    });

    shortcuts.Enter = () => {
      const { selection } = this.editor.state;
      const node = selection.$anchor.node();
      if (node.type.name !== this.name) return false;

      const currentType = node.attrs.type || 'action';
      const isEmpty = node.content.size === 0;

      if (isEmpty && currentType !== 'action') {
        this.editor.commands.setScriptElement('action');
        return true;
      }

      if (isEmpty && currentType === 'action') {
        this.editor.commands.setScriptElement('scene-heading');
        return true;
      }

      const nextType = ELEMENT_TYPES[currentType]?.nextOnEnter || 'action';
      return this.editor
        .chain()
        .insertContentAt(selection.to, {
          type: this.name,
          attrs: { type: nextType },
        })
        .run();
    };

    return shortcuts;
  },

  addInputRules() {
    return [
      {
        find: /^\.(.+)$/,
        type: this.type,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ type: 'scene-heading' }, state.schema.text(match[1]))
          );
          return tr;
        },
      },
    ];
  },
});
