import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Star, CheckCircle } from 'lucide-react';
import { scheduleService } from '../services/scheduleService';
import { taskService } from '../services/taskService';
import { useAuthStore } from '../authStore';
import { useToastStore } from '../toastStore';

const COL_WIDTH = 36;
const ROW_HEIGHT = 32;
const LABEL_WIDTH = 200;
const HEADER_HEIGHT = 48;

const statusColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'done') return 'bg-emerald-500';
  if (s === 'in progress' || s === 'in_progress') return 'bg-blue-500';
  if (s === 'postponed') return 'bg-red-500';
  return 'bg-slate-600';
};

const statusLabelColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'done') return 'text-emerald-400';
  if (s === 'in progress' || s === 'in_progress') return 'text-blue-400';
  if (s === 'postponed') return 'text-red-400';
  return 'text-slate-400';
};

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
}

function isToday(d) {
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

function MonthRow({ months, dayOffset }) {
  return (
    <div className="flex" style={{ height: HEADER_HEIGHT / 2 }}>
      {months.map((m, i) => {
        const startOffset = dayOffset(m);
        return (
          <div key={i}
            className="flex items-end pb-1 text-[10px] font-semibold text-slate-500 uppercase shrink-0 border-r border-slate-800/50 px-1"
            style={{ width: m.days * COL_WIDTH, marginLeft: i === 0 ? 0 : 0 }}>
            {m.label}
          </div>
        );
      })}
    </div>
  );
}

function DayRow({ days, dateToOffset }) {
  return (
    <div className="flex border-t border-slate-800/30" style={{ height: HEADER_HEIGHT / 2 }}>
      {days.map((d, i) => {
        const offset = dateToOffset(d);
        const today = isToday(d);
        return (
          <div key={i}
            className={`flex items-center justify-center text-[9px] font-medium shrink-0 border-r border-slate-800/20 ${today ? 'bg-amber-500/10 text-amber-400' : 'text-slate-600'}`}
            style={{ width: COL_WIDTH, marginLeft: i === 0 ? offset : 0 }}>
            {d.getDate()}
          </div>
        );
      })}
    </div>
  );
}

function GanttBar({ item, dateToOffset, label, color, compact }) {
  const offset = dateToOffset(new Date(item.date));
  return (
    <div className="flex items-center" style={{ height: compact ? ROW_HEIGHT - 4 : ROW_HEIGHT }}>
      <div className="shrink-0 flex items-center gap-2 px-3 text-xs text-slate-300 truncate"
        style={{ width: LABEL_WIDTH, height: '100%' }}>
        {label}
      </div>
      <div className="relative flex-1" style={{ height: '100%' }}>
        <div
          className={`absolute top-1/2 -translate-y-1/2 rounded ${color} ${compact ? 'h-1.5' : 'h-2.5'}`}
          style={{ left: offset, width: COL_WIDTH - 4, minWidth: 6 }}
          title={item.tooltip || ''}
        />
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-px h-full bg-slate-800/20"
          style={{ left: offset }} />
      </div>
    </div>
  );
}

function MilestoneDiamond({ scene, dateToOffset }) {
  const offset = dateToOffset(new Date(scene.shoot_date || scene.created_at));
  const color = statusColor(scene.status);
  return (
    <div className="flex items-center" style={{ height: ROW_HEIGHT }}>
      <div className="shrink-0 flex items-center gap-2 px-3 text-xs text-slate-300 truncate"
        style={{ width: LABEL_WIDTH, height: '100%' }}>
        <Star className="h-3 w-3 text-amber-400 shrink-0" />
        <span className="truncate">Sc {scene.scene_number}</span>
      </div>
      <div className="relative flex-1" style={{ height: '100%' }}>
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border border-slate-800"
          style={{ left: offset, backgroundColor: color === 'bg-emerald-500' ? '#10b981' : color === 'bg-blue-500' ? '#3b82f6' : '#64748b' }}
          title={`Scene ${scene.scene_number}: ${scene.scene_heading || ''}`}
        />
      </div>
    </div>
  );
}

export default function ProductionCalendar() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [schedules, setSchedules] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const [schedData, taskData] = await Promise.all([
        scheduleService.index(filmId),
        taskService.index(filmId),
      ]);
      setSchedules(schedData.schedules || []);
      setScenes(schedData.scenes || []);
      setTasks(taskData.tasks || taskData || []);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
      addToast('Failed to load calendar data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const dateRange = useMemo(() => {
    const dates = [];

    schedules.forEach(s => {
      if (s.shoot_date) dates.push(new Date(s.shoot_date));
    });
    tasks.forEach(t => {
      if (t.due_date) dates.push(new Date(t.due_date));
    });
    scenes.forEach(s => {
      if (s.shoot_date) dates.push(new Date(s.shoot_date));
      if (s.created_at) dates.push(new Date(s.created_at));
    });

    if (dates.length === 0) {
      const now = new Date();
      return { start: now, end: addDays(now, 90), days: 90 };
    }

    dates.sort((a, b) => a - b);
    const start = dates[0];
    let end = dates[dates.length - 1];

    const range = daysBetween(start, end);
    if (range < 60) {
      end = addDays(start, 60);
    }
    if (range > 365) {
      end = addDays(start, 365);
    }

    const totalDays = daysBetween(start, end);
    return { start, end, days: totalDays || 60 };
  }, [schedules, tasks, scenes]);

  const days = useMemo(() => {
    const result = [];
    for (let i = 0; i <= dateRange.days; i++) {
      result.push(addDays(dateRange.start, i));
    }
    return result;
  }, [dateRange]);

  const months = useMemo(() => {
    const map = [];
    days.forEach(d => {
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const last = map[map.length - 1];
      if (!last || last.label !== label) {
        map.push({ label, days: 1, start: d });
      } else {
        last.days++;
      }
    });
    return map;
  }, [days]);

  const dateToOffset = useMemo(() => {
    return (date) => {
      const diff = daysBetween(dateRange.start, date);
      if (diff < 0) return 0;
      if (diff > dateRange.days) return dateRange.days * COL_WIDTH;
      return diff * COL_WIDTH;
    };
  }, [dateRange]);

  const dayOffset = useMemo(() => {
    return (month) => {
      const diff = daysBetween(dateRange.start, month.start);
      return Math.max(0, diff * COL_WIDTH);
    };
  }, [dateRange]);

  const completedSchedules = schedules.filter(s => {
    const st = (s.status || '').toLowerCase();
    return st === 'completed' || st === 'done';
  }).length;

  const completedTasks = tasks.filter(t => {
    const st = (t.status || '').toLowerCase();
    return st === 'done' || st === 'completed';
  }).length;

  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-400" /> Production Calendar
          </h1>
          <p className="text-sm text-slate-500">{currentFilm?.title || ''} - Gantt chart</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Shoot Days', value: schedules.length.toString(), sub: `${completedSchedules} completed`, color: 'text-amber-400', icon: Calendar },
          { label: 'Tasks', value: tasks.length.toString(), sub: `${completedTasks} done`, color: 'text-blue-400', icon: CheckCircle },
          { label: 'Completion', value: `${completionRate}%`, sub: `${completedTasks}/${tasks.length} tasks`, color: 'text-emerald-400', icon: Clock },
          { label: 'Scenes', value: scenes.length.toString(), sub: 'Milestones', color: 'text-purple-400', icon: Star },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-500 uppercase font-bold">{k.label}</p>
                <Icon className={`h-4 w-4 ${k.color} opacity-50`} />
              </div>
              <p className={`text-xl font-black mt-1 ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{k.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          <div style={{ minWidth: LABEL_WIDTH + (dateRange.days + 1) * COL_WIDTH + 40 }}>
            <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10" style={{ marginLeft: LABEL_WIDTH }}>
              <MonthRow months={months} dayOffset={dayOffset} />
              <DayRow days={days} dateToOffset={dateToOffset} />
            </div>

            <div className="sticky left-0 z-10 bg-slate-900/80 backdrop-blur-sm" style={{ position: 'sticky', left: 0, width: LABEL_WIDTH, float: 'left' }}>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800/50" style={{ height: ROW_HEIGHT }}>
                <Calendar className="h-3 w-3 inline mr-1 -mt-0.5" />Shoot Days
              </div>
            </div>
            <div className="divide-y divide-slate-800/30">
              {schedules.length === 0 && (
                <div className="flex items-center text-xs text-slate-500 px-3" style={{ height: ROW_HEIGHT }}>
                  <span style={{ width: LABEL_WIDTH }} className="shrink-0">No shoot days</span>
                  <span className="text-slate-600">-</span>
                </div>
              )}
              {schedules.map(s => {
                const color = statusColor(s.status);
                const labelColor = statusLabelColor(s.status);
                return (
                  <GanttBar
                    key={`sched-${s.id}`}
                    item={{ date: s.shoot_date, tooltip: `Day ${s.day_number}: ${s.status || ''}` }}
                    dateToOffset={dateToOffset}
                    label={
                      <><span className="font-medium text-amber-400 shrink-0">D{s.day_number}</span>
                        <span className={`${labelColor} text-[10px]`}>{s.status || ''}</span></>
                    }
                    color={color}
                    compact={false}
                  />
                );
              })}
            </div>

            <div className="sticky left-0 z-10 bg-slate-900/80 backdrop-blur-sm" style={{ position: 'sticky', left: 0, width: LABEL_WIDTH, float: 'left' }}>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800/50 border-t border-slate-800" style={{ height: ROW_HEIGHT }}>
                <CheckCircle className="h-3 w-3 inline mr-1 -mt-0.5" />Tasks
              </div>
            </div>
            <div className="divide-y divide-slate-800/30">
              {tasks.length === 0 && (
                <div className="flex items-center text-xs text-slate-500 px-3" style={{ height: ROW_HEIGHT }}>
                  <span style={{ width: LABEL_WIDTH }} className="shrink-0">No tasks</span>
                  <span className="text-slate-600">-</span>
                </div>
              )}
              {tasks.map(t => {
                const color = statusColor(t.status);
                const labelColor = statusLabelColor(t.status);
                return (
                  <GanttBar
                    key={`task-${t.id}`}
                    item={{ date: t.due_date || t.created_at, tooltip: `${t.title}: ${t.status || ''}` }}
                    dateToOffset={dateToOffset}
                    label={
                      <><span className="truncate flex-1">{t.title}</span>
                        <span className={`${labelColor} text-[10px] shrink-0`}>{t.status === 'done' ? 'Done' : t.status === 'in_progress' ? 'Active' : 'Todo'}</span></>
                    }
                    color={color}
                    compact={true}
                  />
                );
              })}
            </div>

            <div className="sticky left-0 z-10 bg-slate-900/80 backdrop-blur-sm" style={{ position: 'sticky', left: 0, width: LABEL_WIDTH, float: 'left' }}>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 border-b border-slate-800/50 border-t border-slate-800" style={{ height: ROW_HEIGHT }}>
                <Star className="h-3 w-3 inline mr-1 -mt-0.5" />Milestones
              </div>
            </div>
            <div className="divide-y divide-slate-800/30">
              {scenes.length === 0 && (
                <div className="flex items-center text-xs text-slate-500 px-3" style={{ height: ROW_HEIGHT }}>
                  <span style={{ width: LABEL_WIDTH }} className="shrink-0">No scenes</span>
                  <span className="text-slate-600">-</span>
                </div>
              )}
              {scenes.map(sc => (
                <MilestoneDiamond key={`scene-${sc.id}`} scene={sc} dateToOffset={dateToOffset} />
              ))}
            </div>

            <div style={{ height: ROW_HEIGHT }} className="border-t border-slate-800/30" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Completed</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500" /> In Progress</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-600" /> Not Started</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rotate-45 bg-slate-600" /> Milestone</span>
      </div>
    </div>
  );
}
