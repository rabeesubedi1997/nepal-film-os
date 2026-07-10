import { useState } from 'react';
import { X, Plus, Trash2, Table2 } from 'lucide-react';

let nextId = 1;

function createRow() {
  return { id: nextId++, timecode: '', video: '', audio: '' };
}

function rowsToHtml(rows) {
  if (!rows || rows.length === 0) return '';
  const header = `<tr><th style="padding:6px 10px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:11pt;font-weight:600;text-align:left;">#</th><th style="padding:6px 10px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:11pt;font-weight:600;text-align:left;">Timecode</th><th style="padding:6px 10px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:11pt;font-weight:600;text-align:left;">Video</th><th style="padding:6px 10px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:11pt;font-weight:600;text-align:left;">Audio</th></tr>`;
  const body = rows.map((r, i) =>
    `<tr><td style="padding:6px 10px;border:1px solid #334155;color:#94a3b8;font-size:11pt;vertical-align:top;">${i + 1}</td><td style="padding:6px 10px;border:1px solid #334155;color:#cbd5e1;font-size:11pt;vertical-align:top;">${r.timecode}</td><td style="padding:6px 10px;border:1px solid #334155;color:#cbd5e1;font-size:11pt;vertical-align:top;">${r.video}</td><td style="padding:6px 10px;border:1px solid #334155;color:#cbd5e1;font-size:11pt;vertical-align:top;">${r.audio}</td></tr>`
  ).join('');
  return `<table data-type="av-script" style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:11pt;">${header}${body}</table>`;
}

export default function AVEditor({ value, onChange, onClose }) {
  const [rows, setRows] = useState(() => {
    if (value) {
      const div = document.createElement('div');
      div.innerHTML = value;
      const table = div.querySelector('table[data-type="av-script"]');
      if (table) {
        const trs = table.querySelectorAll('tbody tr, tr:not(:first-child)');
        return Array.from(trs).map(tr => {
          const tds = tr.querySelectorAll('td');
          return {
            id: nextId++,
            timecode: tds[1]?.textContent?.trim() || '',
            video: tds[2]?.textContent?.trim() || '',
            audio: tds[3]?.textContent?.trim() || '',
          };
        });
      }
    }
    return [];
  });

  const addRow = () => {
    setRows(prev => [...prev, createRow()]);
  };

  const removeRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id, field, val) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleExport = () => {
    const html = rowsToHtml(rows);
    onChange(html);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Table2 className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">A/V Script Editor</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-2 py-2 text-slate-500 font-medium uppercase tracking-wider w-8">#</th>
                <th className="text-left px-2 py-2 text-slate-500 font-medium uppercase tracking-wider w-24">Timecode</th>
                <th className="text-left px-2 py-2 text-slate-500 font-medium uppercase tracking-wider">Video</th>
                <th className="text-left px-2 py-2 text-slate-500 font-medium uppercase tracking-wider">Audio</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 text-xs">No rows yet. Click "Add Row" to begin.</td>
                </tr>
              )}
              {rows.map((row, i) => (
                <tr key={row.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="px-2 py-1.5 text-slate-500 text-xs font-mono align-top pt-3">{i + 1}</td>
                  <td className="px-2 py-1.5 align-top">
                    <input
                      value={row.timecode}
                      onChange={e => updateRow(row.id, 'timecode', e.target.value)}
                      placeholder="00:00"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
                    />
                  </td>
                  <td className="px-2 py-1.5 align-top">
                    <textarea
                      value={row.video}
                      onChange={e => updateRow(row.id, 'video', e.target.value)}
                      placeholder="INT. ROOM - DAY"
                      rows={2}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-600 resize-none"
                    />
                  </td>
                  <td className="px-2 py-1.5 align-top">
                    <textarea
                      value={row.audio}
                      onChange={e => updateRow(row.id, 'audio', e.target.value)}
                      placeholder="Sound of rain"
                      rows={2}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-600 resize-none"
                    />
                  </td>
                  <td className="px-2 py-1.5 align-top pt-2.5">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 shrink-0">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs px-3 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Row
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={rows.length === 0}
              className="flex items-center gap-1.5 text-xs px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              <Table2 className="h-3.5 w-3.5" /> Export as HTML Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
