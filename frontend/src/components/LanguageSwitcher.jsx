import React from 'react';
import { useLanguageStore } from '../languageStore';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ne', label: 'नेपाली' },
  { code: 'hi', label: 'हिन्दी' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage, loaded } = useLanguageStore();

  const handleChange = (e) => {
    setLanguage(e.target.value);
  };

  return (
    <select
      value={language}
      onChange={handleChange}
      disabled={!loaded}
      className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
