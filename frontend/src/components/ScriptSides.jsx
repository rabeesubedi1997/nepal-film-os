import { useState, useMemo, useRef } from 'react';
import { X, Printer, User, MapPin, CheckSquare, Square } from 'lucide-react';

function extractCharacters(html) {
  if (!html) return [];
  const div = document.createElement('div');
  div.innerHTML = html;
  const els = div.querySelectorAll('[data-type="character"]');
  const names = new Set();
  els.forEach(el => {
    const name = el.textContent.trim().toUpperCase();
    if (name) names.add(name);
  });
  return Array.from(names).sort();
}

function extractScenes(html) {
  if (!html) return [];
  const div = document.createElement('div');
  div.innerHTML = html;
  const els = div.querySelectorAll('[data-type="scene-heading"]');
  const seen = new Set();
  const scenes = [];
  els.forEach(el => {
    const text = el.textContent.trim();
    if (text && !seen.has(text)) {
      seen.add(text);
      scenes.push(text);
    }
  });
  return scenes;
}

function buildFilteredHtml(html, selectedChars, selectedScenes) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;

  const allEls = Array.from(div.children);
  let include = false;
  const filtered = document.createDocumentFragment();

  const charSet = new Set(selectedChars.map(c => c.toUpperCase().trim()));
  const sceneSet = new Set(selectedScenes);

  allEls.forEach(el => {
    const type = el.getAttribute('data-type');
    const text = el.textContent.trim().toUpperCase();

    if (type === 'scene-heading') {
      include = sceneSet.size === 0 || sceneSet.has(el.textContent.trim());
    } else if (type === 'character') {
      include = charSet.size === 0 || charSet.has(text);
    } else if (!type) {
      include = false;
    }

    if (include) {
      filtered.appendChild(el.cloneNode(true));
    }
  });

  const container = document.createElement('div');
  container.appendChild(filtered);
  return container.innerHTML;
}

export default function ScriptSides({ content, title, onClose }) {
  const printRef = useRef(null);
  const characters = useMemo(() => extractCharacters(content), [content]);
  const scenes = useMemo(() => extractScenes(content), [content]);
  const [selectedChars, setSelectedChars] = useState(() => characters.slice());
  const [selectedScenes, setSelectedScenes] = useState(() => scenes.slice());
  const [generated, setGenerated] = useState(false);
  const [filteredHtml, setFilteredHtml] = useState('');

  const toggleChar = (name) => {
    setSelectedChars(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const toggleScene = (scene) => {
    setSelectedScenes(prev =>
      prev.includes(scene) ? prev.filter(s => s !== scene) : [...prev, scene]
    );
  };

  const handleGenerate = () => {
    const html = buildFilteredHtml(content, selectedChars, selectedScenes);
    setFilteredHtml(html);
    setGenerated(true);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sides - ${title || 'Script'}</title>
        <style>
          @page { size: letter; margin: 0.5in 1in 0.5in 1.5in; }
          body {
            font-family: 'Courier Prime', 'Courier New', Courier, monospace;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            max-width: 6.5in;
            margin: 0 auto;
            padding: 0;
          }
          [data-type="scene-heading"] {
            margin: 1.2em 0 0 0;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 12pt;
          }
          [data-type="action"] {
            margin: 0 0 0.5em 0;
            font-size: 12pt;
          }
          [data-type="character"] {
            margin: 1em 0 0 0;
            text-transform: uppercase;
            margin-left: 2.5in;
            max-width: 3.5in;
            font-size: 12pt;
          }
          [data-type="parenthetical"] {
            margin: 0.2em 0 0.2em 2in;
            max-width: 3in;
            font-style: italic;
            font-size: 12pt;
          }
          [data-type="dialogue"] {
            margin: 0 0 0.2em 1.5in;
            max-width: 3.5in;
            font-size: 12pt;
          }
          [data-type="transition"] {
            margin: 1em 0;
            text-transform: uppercase;
            text-align: right;
            font-size: 12pt;
          }
          [data-type="centered"] {
            text-align: center;
            margin: 1em 0;
          }
        </style>
      </head>
      <body>
        ${filteredHtml}
        <script>window.print();window.close();<\/script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const allCharsSelected = selectedChars.length === characters.length;
  const allScenesSelected = selectedScenes.length === scenes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Script Sides</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {!generated ? (
            <>
              {characters.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-amber-400" /> Characters
                    </h3>
                    <button
                      onClick={() => setSelectedChars(allCharsSelected ? [] : characters.slice())}
                      className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {allCharsSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {characters.map(name => (
                      <label
                        key={name}
                        onClick={() => toggleChar(name)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          selectedChars.includes(name)
                            ? 'bg-amber-500/10 border border-amber-500/30'
                            : 'bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50'
                        }`}
                      >
                        {selectedChars.includes(name)
                          ? <CheckSquare className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          : <Square className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        }
                        <span className="text-xs text-slate-200">{name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {scenes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-amber-400" /> Scenes
                    </h3>
                    <button
                      onClick={() => setSelectedScenes(allScenesSelected ? [] : scenes.slice())}
                      className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {allScenesSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {scenes.map(scene => (
                      <label
                        key={scene}
                        onClick={() => toggleScene(scene)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          selectedScenes.includes(scene)
                            ? 'bg-amber-500/10 border border-amber-500/30'
                            : 'bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50'
                        }`}
                      >
                        {selectedScenes.includes(scene)
                          ? <CheckSquare className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          : <Square className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        }
                        <span className="text-xs text-slate-200 truncate">{scene}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={characters.length === 0 && scenes.length === 0}
                className="w-full flex items-center justify-center gap-1.5 text-xs px-4 py-2.5 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="h-3.5 w-3.5" /> Generate Sides
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGenerated(false)}
                    className="text-[10px] px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Back to Selection
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1 text-[10px] px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors"
                  >
                    <Printer className="h-3 w-3" /> Print
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 min-h-[200px]">
                <div ref={printRef} className="screenplay-preview" dangerouslySetInnerHTML={{ __html: filteredHtml }} />
                {!filteredHtml && (
                  <p className="text-xs text-slate-400 text-center py-8">No content matches the selected filters.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
