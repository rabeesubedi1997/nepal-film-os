import Sanscript from '@indic-transliteration/sanscript';

const TRANSLITERATION_LANGUAGES = ['ne', 'hi'];

function friendlyToITRANS(text) {
  let w = text.toLowerCase();
  w = w.replace(/aa/g, 'A');
  w = w.replace(/ee/g, 'I');
  w = w.replace(/oo/g, 'U');
  w = w.replace(/ii/g, 'I');
  w = w.replace(/uu/g, 'U');
  w = w.replace(/i$/g, 'I');
  w = w.replace(/u$/g, 'U');
  if (/[bcdfghjklmnpqrstvwxyz]$/i.test(w)) {
    w += 'a';
  }
  return w;
}

export function transliterateWord(word) {
  if (!word || /^[0-9\s]+$/.test(word)) return word;
  try {
    return Sanscript.t(friendlyToITRANS(word), 'itrans', 'devanagari');
  } catch {
    return word;
  }
}

export function isTransliterationEnabled(language) {
  return TRANSLITERATION_LANGUAGES.includes(language);
}
