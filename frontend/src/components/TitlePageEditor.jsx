import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const FIELDS = [
  { key: 'title', label: 'Script Title', placeholder: 'THE SCRIPT TITLE' },
  { key: 'author', label: 'Author', placeholder: 'Written by' },
  { key: 'basedOn', label: 'Based On', placeholder: 'Based on [story] by' },
  { key: 'contact', label: 'Contact Info', placeholder: 'Email / Phone / Address' },
  { key: 'draft', label: 'Draft / Revision', placeholder: 'First Draft / Revision 3' },
  { key: 'date', label: 'Date', placeholder: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
  { key: 'copyright', label: 'Copyright', placeholder: '© 2026 Your Name. All rights reserved.' },
];

export function extractTitlePage(content) {
  if (!content) return null;
  const match = content.match(/<!-- TITLE-PAGE -->([\s\S]*?)<!-- \/TITLE-PAGE -->/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export function wrapTitlePage(data) {
  return `<!-- TITLE-PAGE -->${JSON.stringify(data)}<!-- /TITLE-PAGE -->`;
}

export function buildTitlePageHtml(data) {
  if (!data || !data.title) return '';
  const lines = [];
  if (data.title) lines.push(`<div style="text-align:center;margin-top:2in;"><h1 style="font-size:18pt;font-weight:700;text-transform:uppercase;">${data.title}</h1></div>`);
  if (data.author) lines.push(`<div style="text-align:center;margin-top:1in;"><p style="font-size:14pt;">${data.author}</p></div>`);
  if (data.basedOn) lines.push(`<div style="text-align:center;margin-top:0.5in;"><p style="font-size:12pt;font-style:italic;">${data.basedOn}</p></div>`);
  if (data.contact || data.draft || data.date) {
    lines.push(`<div style="text-align:center;margin-top:1.5in;">`);
    if (data.contact) lines.push(`<p style="font-size:12pt;">${data.contact}</p>`);
    if (data.draft) lines.push(`<p style="font-size:12pt;margin-top:0.3in;">${data.draft}</p>`);
    if (data.date) lines.push(`<p style="font-size:12pt;margin-top:0.3in;">${data.date}</p>`);
    lines.push(`</div>`);
  }
  if (data.copyright) lines.push(`<div style="text-align:center;margin-top:1in;"><p style="font-size:10pt;">${data.copyright}</p></div>`);
  lines.push(`<div style="page-break-after:always;"></div>`);
  return lines.join('\n');
}

export default function TitlePageEditor({ data, onChange, onClose }) {
  const [form, setForm] = useState(data || {});

  useEffect(() => {
    setForm(data || {});
  }, [data]);

  const update = (key, value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    onChange(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Title Page</h2>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-3.5">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">{f.label}</label>
              {f.key === 'contact' || f.key === 'copyright' ? (
                <textarea value={form[f.key] || ''} onChange={e => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600 resize-none" />
              ) : (
                <input value={form[f.key] || ''} onChange={e => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600" />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-800">
          <button onClick={onClose}
            className="text-xs px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
