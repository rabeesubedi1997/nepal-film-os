const SCENE_PATTERN = /^(INT|EXT|INT\.\/EXT\.|I\/E)[\.\s]/i;
const TRANSITION_PATTERN = /^[A-Z\s]+TO:$/;
const CHARACTER_PATTERN = /^[A-Z][A-Z\s\.\'\-]+$/;
const PARENTHETICAL_PATTERN = /^\(.+\)$/;
const CENTERED_PATTERN = /^>(.+)<$/;
const NOTE_PATTERN = /\[\[(.+?)\]\]/g;
const BOLD_PATTERN = /\*\*(.+?)\*\*/g;
const ITALIC_PATTERN = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
const PAGE_BREAK = /^={3,}$/;
const SYNOPSIS = /^=/;
const SECTION = /^#{1,6}\s/;

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseInline(text) {
  let result = escapeHtml(text);
  result = result.replace(BOLD_PATTERN, '<strong>$1</strong>');
  result = result.replace(ITALIC_PATTERN, '<em>$1</em>');
  result = result.replace(NOTE_PATTERN, '<span class="text-cyan-400 bg-cyan-500/10 px-1 rounded italic">[$1]</span>');
  return result;
}

export function parseFountain(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    let line = lines[i];
    let trimmed = line.trim();

    if (trimmed === '' || PAGE_BREAK.test(trimmed)) {
      if (elements.length && elements[elements.length - 1].type !== 'blank') {
        elements.push({ type: 'blank' });
      }
      i++;
      continue;
    }

    if (SECTION.test(trimmed)) {
      elements.push({ type: 'section', text: parseInline(trimmed.replace(/^#+/, '').trim()) });
      i++;
      continue;
    }

    if (SYNOPSIS.test(trimmed)) {
      elements.push({ type: 'synopsis', text: parseInline(trimmed.replace(/^=/, '').trim()) });
      i++;
      continue;
    }

    let centered = trimmed.match(CENTERED_PATTERN);
    if (centered) {
      elements.push({ type: 'centered', text: parseInline(centered[1]) });
      i++;
      continue;
    }

    if (SCENE_PATTERN.test(trimmed) || trimmed.startsWith('.')) {
      let sceneText = trimmed.startsWith('.') ? trimmed.slice(1).trim() : trimmed;
      elements.push({ type: 'scene-heading', text: parseInline(sceneText) });
      i++;
      continue;
    }

    if (TRANSITION_PATTERN.test(trimmed)) {
      elements.push({ type: 'transition', text: parseInline(trimmed) });
      i++;
      continue;
    }

    if (CHARACTER_PATTERN.test(trimmed) && trimmed.length >= 2 && !trimmed.includes('  ') && !trimmed.endsWith('.')) {
      let character = trimmed.replace(/\(.*\)/, '').trim();
      let extension = '';
      let parenMatch = trimmed.match(/\((.+)\)/);
      if (parenMatch) extension = parenMatch[1];
      elements.push({ type: 'character', text: character, extension });

      i++;
      let dialogue = [];
      while (i < lines.length) {
        let dLine = lines[i].trim();
        if (dLine === '') break;
        if (PARENTHETICAL_PATTERN.test(dLine)) {
          dialogue.push({ type: 'parenthetical', text: parseInline(dLine.slice(1, -1)) });
        } else if (CHARACTER_PATTERN.test(dLine) && dLine.length >= 2 && !dLine.includes('  ') && !dLine.endsWith('.') && dialogue.length > 0) {
          break;
        } else {
          dialogue.push({ type: 'dialogue', text: parseInline(dLine) });
        }
        i++;
      }
      if (dialogue.length) {
        elements.push({ type: 'dialogue-block', children: dialogue });
      }
      continue;
    }

    elements.push({ type: 'action', text: parseInline(trimmed) });
    i++;
  }

  return elements;
}

export function fountainToHtml(elements) {
  return elements.map(el => {
    switch (el.type) {
      case 'scene-heading':
        return `<div class="scene-heading">${el.text}</div>`;
      case 'action':
        return `<div class="action">${el.text}</div>`;
      case 'character':
        return `<div class="character">${el.text}${el.extension ? ` (${el.extension})` : ''}</div>`;
      case 'dialogue':
        return `<div class="dialogue">${el.text}</div>`;
      case 'parenthetical':
        return `<div class="parenthetical">(${el.text})</div>`;
      case 'dialogue-block':
        return `<div class="dialogue-block">${el.children.map(c => {
          if (c.type === 'dialogue') return `<div class="dialogue">${c.text}</div>`;
          if (c.type === 'parenthetical') return `<div class="parenthetical">(${c.text})</div>`;
          return '';
        }).join('')}</div>`;
      case 'transition':
        return `<div class="transition">${el.text}</div>`;
      case 'centered':
        return `<div class="centered">${el.text}</div>`;
      case 'section':
        return `<div class="section">${el.text}</div>`;
      case 'synopsis':
        return `<div class="synopsis">${el.text}</div>`;
      case 'blank':
        return `<div class="blank-line">&nbsp;</div>`;
      default:
        return `<div>${el.text || ''}</div>`;
    }
  }).join('\n');
}
