import React, { useState, useCallback, useMemo } from 'react';
import { Badge } from './ui';
import { GripVertical, Plus, AlertTriangle } from 'lucide-react';

const colorMap = {
  'Completed': 'border-l-emerald-500 bg-emerald-500/5',
  'In Progress': 'border-l-blue-500 bg-blue-500/5',
  'Not Started': 'border-l-slate-600 bg-slate-800/20',
  'Postponed': 'border-l-red-500 bg-red-500/5',
};

export default function Stripboard({ schedules, scenes, onOpenScene, onOpenSchedule, onSync }) {
  const [dragItem, setDragItem] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const scheduledSceneIds = new Set();
  schedules.forEach(s => (s.scenes || []).forEach(sc => scheduledSceneIds.add(sc.id)));
  const unassignedScenes = scenes.filter(sc => !scheduledSceneIds.has(sc.id));

  const handleDragStart = (e, sceneId, sourceDay) => {
    setDragItem({ sceneId, sourceDay });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(sceneId));
  };

  const handleDragOver = useCallback((e, targetDay) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(targetDay);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(null);
  }, []);

  const handleDrop = (e, targetDay) => {
    e.preventDefault();
    setDragOver(null);
    if (!dragItem) return;
    const { sceneId, sourceDay } = dragItem;
    if (sourceDay === targetDay) { setDragItem(null); return; }
    const day = schedules.find(s => s.day_number === targetDay);
    if (!day) { setDragItem(null); return; }
    const existing = (day.scenes || []).map(s => s.id);
    if (existing.includes(sceneId)) { setDragItem(null); return; }
    onSync(day.id, [...existing, sceneId]);
    setDragItem(null);
  };

  const handleSceneDrop = (e, targetDay, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    if (!dragItem) return;
    const { sceneId, sourceDay } = dragItem;
    const day = schedules.find(s => s.day_number === targetDay);
    if (!day) { setDragItem(null); return; }
    let sceneIds = (day.scenes || []).map(s => s.id);
    if (sourceDay === targetDay) {
      const fromIdx = sceneIds.indexOf(sceneId);
      if (fromIdx === -1 || fromIdx === targetIndex) { setDragItem(null); return; }
      sceneIds.splice(fromIdx, 1);
      sceneIds.splice(fromIdx < targetIndex ? targetIndex - 1 : targetIndex, 0, sceneId);
    } else {
      sceneIds = sceneIds.filter(id => id !== sceneId);
      sceneIds.splice(targetIndex, 0, sceneId);
    }
    onSync(day.id, sceneIds);
    setDragItem(null);
  };

  const handleUnassignedDrop = (e) => {
    e.preventDefault();
    setDragOver(null);
    if (!dragItem) return;
    const { sceneId, sourceDay } = dragItem;
    if (sourceDay === 'unassigned') { setDragItem(null); return; }
    const day = schedules.find(s => s.day_number === sourceDay);
    if (day) {
      const updated = (day.scenes || []).filter(s => s.id !== sceneId).map(s => s.id);
      onSync(day.id, updated);
    }
    setDragItem(null);
  };

  const getScene = (id) => scenes.find(s => s.id === id);

  const conflicts = useMemo(() => {
    const locDays = {};
    const result = [];
    schedules.forEach(day => {
      if (!day.location_id || !day.shoot_date) return;
      const key = `${day.location_id}_${day.shoot_date?.split('T')[0] || day.shoot_date}`;
      if (locDays[key]) {
        result.push({
          locationId: day.location_id,
          locationName: day.location?.name || 'Unknown location',
          date: day.shoot_date?.split('T')[0] || day.shoot_date,
          dayA: locDays[key],
          dayB: day.day_number,
        });
      } else {
        locDays[key] = day.day_number;
      }
    });
    return result;
  }, [schedules]);

  const hasConflicts = (dayNumber) => {
    return conflicts.some(c => c.dayA === dayNumber || c.dayB === dayNumber);
  };

  return (
    <div className="space-y-3">
      {conflicts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-red-400">Location Conflicts Detected</p>
            <ul className="mt-1 space-y-0.5">
              {conflicts.map((c, i) => (
                <li key={i} className="text-[10px] text-red-300">
                  "{c.locationName}" is scheduled on {c.date} for both Day {c.dayA} and Day {c.dayB}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {schedules.length === 0 && unassignedScenes.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-8">No scenes or shoot days yet.</p>
      )}

      {schedules.map(day => {
        const isOver = dragOver === day.day_number;
        return (
          <div key={day.id}
            onDragOver={(e) => handleDragOver(e, day.day_number)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, day.day_number)}
            className={`rounded-xl border transition-all ${
              isOver ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800'
            }`}>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 rounded-t-xl border-b border-slate-800">
              <div className="text-center w-10">
                <p className="text-sm font-bold text-amber-400">D{day.day_number}</p>
                <p className="text-[10px] text-slate-500">{day.shoot_date ? new Date(day.shoot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>
              </div>
              <div className="flex-1 flex items-center gap-2 flex-wrap">
                <Badge color={day.status === 'Completed' ? 'green' : day.status === 'In Progress' ? 'blue' : 'slate'}>{day.status}</Badge>
                {hasConflicts(day.day_number) && (
                  <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded" title="Location conflict detected">
                    <AlertTriangle className="h-3 w-3" /> Conflict
                  </span>
                )}
                <span className="text-[10px] text-slate-500">{day.call_time || ''}{day.wrap_time ? ` - ${day.wrap_time}` : ''}</span>
                <span className="text-[10px] text-slate-500">{day.location?.name || ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onOpenScene(null)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-amber-400 transition-colors" title="Add Scene">
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onOpenSchedule(day)}
                  className="text-[10px] text-slate-500 hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors">
                  Edit
                </button>
              </div>
            </div>

            <div className="p-2 space-y-1 min-h-[2.5rem]">
              {(!day.scenes || day.scenes.length === 0) && (
                <div className="text-center py-2 text-[10px] text-slate-600 italic">Drop scenes here</div>
              )}
              {(day.scenes || []).map((sc, idx) => {
                const scene = getScene(sc.id) || sc;
                return (
                  <div key={scene.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, scene.id, day.day_number)}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => handleSceneDrop(e, day.day_number, idx)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-l-4 cursor-grab active:cursor-grabbing transition-all hover:bg-slate-800/50 group ${
                      colorMap[scene.status] || colorMap['Not Started']
                    } ${dragItem?.sceneId === scene.id ? 'opacity-40' : ''}`}>
                    <GripVertical className="h-3 w-3 text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[10px] font-medium text-amber-400 font-mono w-8 shrink-0">#{scene.scene_number}</span>
                    <span className={`text-[10px] font-medium w-6 text-center shrink-0 ${scene.int_ext === 'INT' ? 'text-amber-300' : 'text-blue-300'}`}>{scene.int_ext}</span>
                    <span className="text-[10px] text-slate-500 w-7 shrink-0">{scene.day_or_night}</span>
                    <span className="text-xs text-slate-300 font-medium flex-1 truncate">{scene.scene_heading}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{scene.page_count}p</span>
                    <Badge color={scene.status === 'Completed' ? 'green' : scene.status === 'In Progress' ? 'blue' : scene.status === 'Postponed' ? 'red' : 'slate'}>{scene.status}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {unassignedScenes.length > 0 && (
        <div
          onDragOver={(e) => handleDragOver(e, 'unassigned')}
          onDragLeave={handleDragLeave}
          onDrop={handleUnassignedDrop}
          className={`rounded-xl border border-dashed transition-all ${
            dragOver === 'unassigned' ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-700/50'
          }`}>
          <div className="px-4 py-2">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Unassigned Scenes</p>
          </div>
          <div className="p-2 space-y-1">
            {unassignedScenes.map(sc => (
              <div key={sc.id}
                draggable
                onDragStart={(e) => handleDragStart(e, sc.id, 'unassigned')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-l-4 cursor-grab active:cursor-grabbing transition-all hover:bg-slate-800/50 group ${
                  colorMap[sc.status] || colorMap['Not Started']
                } ${dragItem?.sceneId === sc.id ? 'opacity-40' : ''}`}>
                <GripVertical className="h-3 w-3 text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-[10px] font-medium text-amber-400 font-mono w-8 shrink-0">#{sc.scene_number}</span>
                <span className={`text-[10px] font-medium w-6 text-center shrink-0 ${sc.int_ext === 'INT' ? 'text-amber-300' : 'text-blue-300'}`}>{sc.int_ext}</span>
                <span className="text-[10px] text-slate-500 w-7 shrink-0">{sc.day_or_night}</span>
                <span className="text-xs text-slate-300 font-medium flex-1 truncate">{sc.scene_heading}</span>
                <span className="text-[10px] text-slate-500 shrink-0">{sc.page_count}p</span>
                <Badge color={sc.status === 'Completed' ? 'green' : sc.status === 'In Progress' ? 'blue' : 'slate'}>{sc.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
