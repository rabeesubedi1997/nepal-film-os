import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, X } from 'lucide-react';

function extractSpeakers(html) {
  if (!html) return [];
  const div = document.createElement('div');
  div.innerHTML = html;
  const elements = Array.from(div.querySelectorAll('[data-type]'));
  const blocks = [];
  let i = 0;
  while (i < elements.length) {
    const type = elements[i].getAttribute('data-type');
    if (type === 'scene-heading') {
      blocks.push({ type: 'scene-heading', text: elements[i].textContent.trim() });
    } else if (type === 'character') {
      const name = elements[i].textContent.trim();
      const dialogue = [];
      let j = i + 1;
      while (j < elements.length) {
        const t = elements[j].getAttribute('data-type');
        if (t === 'character' || t === 'scene-heading' || t === 'transition') break;
        if (t === 'parenthetical') dialogue.push(`(${elements[j].textContent.trim()})`);
        else if (t === 'dialogue') dialogue.push(elements[j].textContent.trim());
        j++;
      }
      blocks.push({ type: 'dialogue', character: name, text: dialogue.join(' ') });
      i = j - 1;
    } else if (type === 'action') {
      const t = elements[i].textContent.trim();
      if (t) blocks.push({ type: 'action', text: t });
    } else if (type === 'transition') {
      blocks.push({ type: 'transition', text: elements[i].textContent.trim() });
    }
    i++;
  }
  return blocks;
}

const TTS_RATE = 0.9;

export default function ReadThrough({ content, onClose }) {
  const [blocks, setBlocks] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    setBlocks(extractSpeakers(content));
  }, [content]);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    const loadVoices = () => {
      const v = synthRef.current?.getVoices() || [];
      setVoices(v);
      const eng = v.find(v2 => v2.lang.startsWith('en') && v2.name.includes('Female'))
        || v.find(v2 => v2.lang.startsWith('en'))
        || v[0];
      setSelectedVoice(eng || null);
    };
    loadVoices();
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  const speak = useCallback((idx) => {
    if (!synthRef.current || idx >= blocks.length) {
      setPlaying(false);
      return;
    }
    synthRef.current.cancel();
    const block = blocks[idx];
    if (!block || !block.text) {
      setCurrentIdx(idx + 1);
      speak(idx + 1);
      return;
    }
    const u = new SpeechSynthesisUtterance(block.text);
    u.rate = TTS_RATE;
    u.volume = 1;
    if (selectedVoice) u.voice = selectedVoice;
    if (block.type === 'scene-heading') u.pitch = 0.9;
    else if (block.type === 'action') u.pitch = 1;
    else if (block.type === 'character') u.pitch = 1.1;
    else if (block.type === 'dialogue') u.pitch = 1;
    else if (block.type === 'transition') u.pitch = 0.8;
    u.onend = () => {
      setCurrentIdx(prev => {
        const next = prev + 1;
        if (next < blocks.length) {
          speak(next);
          return next;
        }
        setPlaying(false);
        return prev;
      });
    };
    utteranceRef.current = u;
    synthRef.current.speak(u);
  }, [blocks, selectedVoice]);

  const togglePlay = () => {
    if (playing) {
      synthRef.current?.cancel();
      setPlaying(false);
    } else {
      setPlaying(true);
      if (currentIdx >= blocks.length) setCurrentIdx(0);
      speak(currentIdx >= blocks.length ? 0 : currentIdx);
    }
  };

  const skipTo = (idx) => {
    synthRef.current?.cancel();
    const next = Math.max(0, Math.min(idx, blocks.length - 1));
    setCurrentIdx(next);
    if (playing) speak(next);
  };

  const currentBlock = blocks[currentIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Read Through</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 min-h-[120px] mb-4">
            {currentBlock ? (
              <>
                <span className={`text-[10px] font-medium uppercase tracking-wider mb-1 block ${
                  currentBlock.type === 'scene-heading' ? 'text-amber-400' :
                  currentBlock.type === 'character' ? 'text-emerald-400' :
                  currentBlock.type === 'dialogue' ? 'text-blue-400' :
                  currentBlock.type === 'transition' ? 'text-purple-400' : 'text-slate-400'
                }`}>
                  {currentBlock.type === 'scene-heading' ? 'Scene Heading' :
                   currentBlock.type === 'character' ? currentBlock.character || 'Character' :
                   currentBlock.type === 'dialogue' ? currentBlock.character || 'Dialogue' :
                   currentBlock.type === 'action' ? 'Action' : 'Transition'}
                </span>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {currentBlock.type === 'scene-heading' ? currentBlock.text.toUpperCase() : currentBlock.text}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">No dialog to read.</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button onClick={() => skipTo(currentIdx - 1)} disabled={currentIdx <= 0}
              className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-30">
              <SkipBack className="h-5 w-5" />
            </button>
            <button onClick={togglePlay}
              className="p-3.5 rounded-full bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors">
              {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>
            <button onClick={() => skipTo(currentIdx + 1)} disabled={currentIdx >= blocks.length - 1}
              className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-30">
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5 text-slate-500" />
              <select value={selectedVoice?.name || ''} onChange={e => {
                const v = voices.find(v2 => v2.name === e.target.value);
                setSelectedVoice(v || null);
              }}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded-lg focus:outline-none focus:border-amber-500 max-w-40">
                {voices.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>
            <span className="text-[10px] text-slate-500">
              {currentIdx + 1} / {blocks.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
