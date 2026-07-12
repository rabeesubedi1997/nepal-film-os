import { useLanguageStore } from '../languageStore';

const LANGUAGES = [
  { code: 'en', label: 'EN', font: 'inherit' },
  { code: 'ne', label: 'ने', font: '"Noto Sans Devanagari", sans-serif' },
  { code: 'hi', label: 'हि', font: '"Noto Sans Devanagari", sans-serif' },
];

export default function LanguageSelector({ editor }) {
  const { language, setLanguage } = useLanguageStore();

  const handleChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    if (editor) {
      const selected = LANGUAGES.find(l => l.code === lang);
      const font = selected && selected.font !== 'inherit' ? selected.font : null;
      editor.chain().focus().setParagraphFontFamily(font).run();
    }
  };

  return (
    <select
      value={language}
      onChange={handleChange}
      className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer min-w-[60px] appearance-none text-center"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 2px center", backgroundRepeat: "no-repeat", backgroundSize: "12px", paddingRight: "18px" }}
      title={language === 'ne' ? 'Nepali — type roman, press Ctrl+T to convert' : language === 'hi' ? 'Hindi — type roman, press Ctrl+T to convert' : 'English'}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
