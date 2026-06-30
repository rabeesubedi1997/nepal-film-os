import { create } from 'zustand';

const STORAGE_KEY = 'nepal_film_language';

const loadTranslations = async (lang) => {
  try {
    const module = await import(`./locales/${lang}.json`);
    return module.default || module;
  } catch {
    const module = await import(`./locales/en.json`);
    return module.default || module;
  }
};

export const useLanguageStore = create((set, get) => ({
  language: localStorage.getItem(STORAGE_KEY) || 'en',
  translations: {},
  loaded: false,

  setLanguage: async (lang) => {
    localStorage.setItem(STORAGE_KEY, lang);
    const translations = await loadTranslations(lang);
    set({ language: lang, translations, loaded: true });
  },

  t: (key, fallback) => {
    const { translations } = get();
    return translations[key] || fallback || key;
  },

  initialize: async () => {
    const currentLang = localStorage.getItem(STORAGE_KEY) || 'en';
    const translations = await loadTranslations(currentLang);
    set({ language: currentLang, translations, loaded: true });
  },
}));
