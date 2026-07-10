import { useMemo } from 'react';
import { X, FileText, User, MapPin, MessageSquare, Hash, BookOpen } from 'lucide-react';

function analyzeScript(html) {
  if (!html) return null;
  const div = document.createElement('div');
  div.innerHTML = html;

  const elements = Array.from(div.querySelectorAll('[data-type]'));
  const scenes = elements.filter(el => el.getAttribute('data-type') === 'scene-heading');
  const characters = elements.filter(el => el.getAttribute('data-type') === 'character');
  const dialogues = elements.filter(el => el.getAttribute('data-type') === 'dialogue');
  const actions = elements.filter(el => el.getAttribute('data-type') === 'action');
  const transitions = elements.filter(el => el.getAttribute('data-type') === 'transition');

  const characterMap = {};
  characters.forEach(el => {
    const name = el.textContent.trim().toUpperCase();
    if (!characterMap[name]) characterMap[name] = { name, lines: 0, words: 0 };
  });

  let charIdx = 0;
  elements.forEach((el, i) => {
    if (el.getAttribute('data-type') === 'character') {
      const name = el.textContent.trim().toUpperCase();
      if (!characterMap[name]) characterMap[name] = { name, lines: 0, words: 0 };
      characterMap[name].lines++;
      let j = i + 1;
      while (j < elements.length) {
        const t = elements[j].getAttribute('data-type');
        if (t === 'character' || t === 'scene-heading' || t === 'transition') break;
        if (t === 'dialogue') {
          const text = elements[j].textContent.trim();
          characterMap[name].words += text.split(/\s+/).filter(Boolean).length;
        }
        j++;
      }
    }
  });

  const sceneLocations = scenes.map(el => {
    const text = el.textContent.trim();
    const ie = text.match(/^(INT|EXT|INT\.\/EXT\.|I\/E|INT\/EXT)/i);
    const location = text.replace(ie?.[0] || '', '').replace(/[-–].+$/, '').trim();
    const timeOfDay = text.match(/[-–]\s*(DAY|NIGHT|DAWN|DUSK|MORNING|AFTERNOON|EVENING|LATER|CONTINUOUS|MOMENTS?\s+LATER)\s*$/i);
    return {
      heading: text,
      intExt: ie?.[1]?.toUpperCase() || '',
      location: location || 'Unknown',
      timeOfDay: timeOfDay?.[1]?.toUpperCase() || '',
    };
  });

  const totalWords = elements
    .map(el => el.textContent.trim().split(/\s+/).filter(Boolean).length)
    .reduce((a, b) => a + b, 0);

  const totalChars = elements
    .map(el => el.textContent.trim().length)
    .reduce((a, b) => a + b, 0);

  return {
    total: elements.length,
    scenes: scenes.length,
    characters: Object.keys(characterMap).length,
    dialogues: dialogues.length,
    actions: actions.length,
    transitions: transitions.length,
    words: totalWords,
    chars: totalChars,
    estimatedPages: Math.max(1, Math.round(totalWords / 250)),
    characterDetails: Object.values(characterMap).sort((a, b) => b.words - a.words),
    sceneDetails: sceneLocations,
  };
}

const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3.5">
    <div className="flex items-center gap-2 mb-1.5">
      <Icon className="h-3.5 w-3.5 text-amber-400" />
      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-lg font-bold text-slate-100">{value}</p>
    {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
  </div>
);

export default function ScriptReports({ content, onClose }) {
  const stats = useMemo(() => analyzeScript(content), [content]);

  if (!stats) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 text-center">
          <BookOpen className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No script content to analyze.</p>
          <button onClick={onClose} className="mt-4 text-xs px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Script Reports</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-4 gap-3">
            <StatCard icon={FileText} label="Total Elements" value={stats.total} sub={`${stats.actions} action, ${stats.transitions} transitions`} />
            <StatCard icon={MapPin} label="Scenes" value={stats.scenes} />
            <StatCard icon={User} label="Characters" value={stats.characters} sub={`${stats.dialogues} dialogue blocks`} />
            <StatCard icon={Hash} label="Estimated Pages" value={stats.estimatedPages} sub={`${stats.words.toLocaleString()} words`} />
          </div>

          {stats.characterDetails.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Character Dialogue Breakdown</h3>
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left px-3.5 py-2 text-slate-500 font-medium uppercase tracking-wider">Character</th>
                      <th className="text-right px-3.5 py-2 text-slate-500 font-medium uppercase tracking-wider">Lines</th>
                      <th className="text-right px-3.5 py-2 text-slate-500 font-medium uppercase tracking-wider">Words</th>
                      <th className="text-right px-3.5 py-2 text-slate-500 font-medium uppercase tracking-wider w-24">% of Dialogue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {stats.characterDetails.map(c => {
                      const pct = stats.words ? ((c.words / stats.words) * 100).toFixed(1) : 0;
                      return (
                        <tr key={c.name} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-3.5 py-2 text-slate-200 font-medium">{c.name}</td>
                          <td className="px-3.5 py-2 text-right text-slate-300">{c.lines}</td>
                          <td className="px-3.5 py-2 text-right text-slate-300">{c.words}</td>
                          <td className="px-3.5 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[10px] text-slate-500 w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {stats.sceneDetails.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Scene Breakdown</h3>
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-800/95">
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left px-3.5 py-2 text-slate-500 font-medium uppercase tracking-wider">#</th>
                      <th className="text-left px-3.5 py-2 text-slate-500 font-medium uppercase tracking-wider">I/E</th>
                      <th className="text-left px-3.5 py-2 text-slate-500 font-medium uppercase tracking-wider">Location</th>
                      <th className="text-left px-3.5 py-2 text-slate-500 font-medium uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {stats.sceneDetails.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-3.5 py-1.5 text-amber-400 font-bold">{i + 1}</td>
                        <td className="px-3.5 py-1.5">
                          <span className="text-[10px] font-medium bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded">{s.intExt}</span>
                        </td>
                        <td className="px-3.5 py-1.5 text-slate-200">{s.location}</td>
                        <td className="px-3.5 py-1.5 text-slate-400">{s.timeOfDay || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
