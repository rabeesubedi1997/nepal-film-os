import { create } from 'zustand';
import enTranslations from './locales/en.json';
import neTranslations from './locales/ne.json';
import hiTranslations from './locales/hi.json';

const STORAGE_KEY = 'nepal_film_language';
const ALL_TRANSLATIONS = { en: enTranslations, ne: neTranslations, hi: hiTranslations };

const initialLang = localStorage.getItem(STORAGE_KEY) || 'en';

export const useLanguageStore = create((set, get) => ({
  language: initialLang,
  translations: ALL_TRANSLATIONS[initialLang] || enTranslations,
  loaded: true,

  setLanguage: (lang) => {
    localStorage.setItem(STORAGE_KEY, lang);
    const translations = ALL_TRANSLATIONS[lang] || enTranslations;
    set({ language: lang, translations, loaded: true });
  },

  t: (key, fallback) => {
    const { translations } = get();
    return translations[key] || fallback || key;
  },
}));
