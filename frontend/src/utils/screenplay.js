import { detectElementType } from '../extensions/ScreenplayNode';

const SCENE_PATTERN = /^(INT|EXT|INT\.\/EXT\.|I\/E)[\.\s]/i;
const SHOT_PATTERN = /^(CLOSE ON|CLOSE UP|CLOSEUP|WIDE SHOT|WIDE|MEDIUM SHOT|MEDIUM|POV|POINT OF VIEW|ANGLE ON|PAN|TILT|ZOOM|TRACKING|DOLLY|CRANE|AERIAL|INSERT|INTERCUT|SPLIT SCREEN|MONTAGE|SERIES OF SHOTS)\s*:?/i;
const TRANSITION_PATTERN = /^[A-Z\s]+TO:$/;
const CHARACTER_PATTERN = /^[A-Z][A-Z\s\.\'\-]{0,38}$/;
const NON_CHARACTER = /^(THE END|FADE OUT\.?|FADE IN\.?|FREEZE FRAME|IRIS IN|IRIS OUT|TITLE:|SUBTITLE:|BACK TO SCENE|RESUME|CONTINUED|CONTINUED:|MORE|MORE:)$/i;
const PARENTHETICAL_PATTERN = /^\(.+\)$/;
const CENTERED_PATTERN = /^>(.+)<$/;
const NOTE_PATTERN = /\[\[(.+?)\]\]/g;
const BOLD_PATTERN = /\*\*(.+?)\*\*/g;
const ITALIC_PATTERN = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
const PAGE_BREAK = /^={3,}$/;
const SYNOPSIS = /^=/;
const SECTION = /^#{1,6}\s/;

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function parseInline(text) {
  let result = escapeHtml(text);
  result = result.replace(BOLD_PATTERN, '<strong>$1</strong>');
  result = result.replace(ITALIC_PATTERN, '<em>$1</em>');
  result = result.replace(NOTE_PATTERN, '<span class="text-cyan-400 bg-cyan-500/10 px-1 rounded italic">[$1]</span>');
  return result;
}

export function fountainToScreenplayHtml(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  const addBlock = (type, content) => {
    if (content == null) return;
    const inner = content.trim() || '&nbsp;';
    blocks.push(`<div data-type="${type}">${inner}</div>`);
  };

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed === '' || PAGE_BREAK.test(trimmed)) {
      i++;
      continue;
    }

    if (SECTION.test(trimmed)) {
      addBlock('action', parseInline(trimmed.replace(/^#+/, '').trim()));
      i++;
      continue;
    }

    if (SYNOPSIS.test(trimmed)) {
      i++;
      continue;
    }

    const centered = trimmed.match(CENTERED_PATTERN);
    if (centered) {
      addBlock('action', parseInline(centered[1]));
      i++;
      continue;
    }

    if (SCENE_PATTERN.test(trimmed) || trimmed.startsWith('.')) {
      const sceneText = trimmed.startsWith('.') ? trimmed.slice(1).trim() : trimmed;
      addBlock('scene-heading', parseInline(sceneText));
      i++;
      continue;
    }

    if (SHOT_PATTERN.test(trimmed)) {
      addBlock('shot', parseInline(trimmed));
      i++;
      continue;
    }

    if (TRANSITION_PATTERN.test(trimmed)) {
      addBlock('transition', parseInline(trimmed));
      i++;
      continue;
    }

    if (trimmed.startsWith('@')) {
      const charName = trimmed.slice(1).trim();
      addBlock('character', charName);
      i++;
      while (i < lines.length) {
        const dLine = lines[i].trim();
        if (dLine === '') break;
        if (PARENTHETICAL_PATTERN.test(dLine)) {
          addBlock('parenthetical', parseInline(dLine.slice(1, -1)));
        } else {
          addBlock('dialogue', parseInline(dLine));
        }
        i++;
      }
      continue;
    }

    const isChar = CHARACTER_PATTERN.test(trimmed) && trimmed.length >= 2
      && !trimmed.includes('  ') && !trimmed.endsWith('.')
      && !SCENE_PATTERN.test(trimmed) && !SHOT_PATTERN.test(trimmed)
      && !TRANSITION_PATTERN.test(trimmed) && !NON_CHARACTER.test(trimmed);

    if (isChar) {
      addBlock('character', trimmed);
      i++;
      while (i < lines.length) {
        const dLine = lines[i].trim();
        if (dLine === '') break;
        if (PARENTHETICAL_PATTERN.test(dLine)) {
          addBlock('parenthetical', parseInline(dLine.slice(1, -1)));
        } else if (CHARACTER_PATTERN.test(dLine) && dLine.length >= 2 && !dLine.includes('  ') && !dLine.endsWith('.')) {
          addBlock('character', dLine);
          i++;
          continue;
        } else {
          addBlock('dialogue', parseInline(dLine));
        }
        i++;
      }
      continue;
    }

    addBlock('action', parseInline(trimmed));
    i++;
  }

  return blocks.join('');
}

export function screenplayToFountain(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const elements = div.querySelectorAll('[data-type]');
  const lines = [];
  let prevType = null;

  elements.forEach((el, index) => {
    const text = el.textContent.replace(/\u00A0/g, ' ').trim();
    const type = el.getAttribute('data-type');
    if (!text && type !== 'action') return;

    const needsBlankBefore = index > 0
      && prevType !== 'dialogue'
      && prevType !== 'parenthetical'
      && type !== 'parenthetical'
      && type !== 'dialogue';

    if (needsBlankBefore) {
      lines.push('');
    }

    if (type === 'transition') {
      lines.push(text.toUpperCase());
    } else if (type === 'shot') {
      lines.push(text);
    } else if (type === 'character') {
      lines.push(text.toUpperCase());
    } else if (type === 'scene-heading') {
      if (/^(INT|EXT|INT\.\/EXT\.|I\/E)\.?\s/i.test(text)) {
        lines.push(text.toUpperCase());
      } else {
        lines.push('. ' + text.toUpperCase());
      }
    } else if (type === 'parenthetical') {
      lines.push(`(${text.replace(/^\(|\)$/g, '')})`);
    } else if (type === 'dialogue') {
      lines.push(text);
    } else {
      lines.push(text);
    }

    prevType = type;
  });

  return lines.join('\n');
}

export function screenplayToPlainText(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return Array.from(div.querySelectorAll('[data-type]'))
    .map(el => el.textContent.replace(/\u00A0/g, ' ').trim())
    .filter(t => t)
    .join('\n');
}

export function convertHtmlToScreenplay(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks = [];
  doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, li').forEach(el => {
    const text = el.textContent.trim();
    if (!text) return;
    const type = detectElementType(text);
    let inner = el.innerHTML.trim();
    inner = inner
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(span|font|b|strong|i|em|u|ins|s|del|mark|sub|sup|a|code)[^>]*>/gi, (match) => {
        const tag = match.match(/<\/?([a-z]+)/i)?.[1]?.toLowerCase();
        if (!tag) return match;
        if (match.startsWith('</')) return match;
        const allowed = ['b', 'strong', 'i', 'em', 'u', 'ins', 's', 'del', 'mark', 'sub', 'sup', 'a', 'code', 'span'];
        if (!allowed.includes(tag)) return '';
        if (tag === 'span' || tag === 'font') {
          const style = match.match(/style="([^"]*)"/i)?.[1] || '';
          const color = style.match(/color\s*:\s*([^;]+)/i)?.[1];
          const fontFamily = style.match(/font-family\s*:\s*([^;]+)/i)?.[1];
          if (color || fontFamily) return match;
          return '';
        }
        return match;
      })
      .replace(/<a\s[^>]*href="([^"]*)"[^>]*>/gi, '<a href="$1">')
      .replace(/<a\s[^>]*>/gi, '<a>')
      .replace(/<\/?div[^>]*>/gi, '');
    blocks.push(`<div data-type="${type}">${inner || '&nbsp;'}</div>`);
  });
  return blocks.join('');
}

export function downloadBlob(content, mimeType, filename) {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
