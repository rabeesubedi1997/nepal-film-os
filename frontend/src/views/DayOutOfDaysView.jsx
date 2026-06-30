import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Users, Search, RotateCcw } from 'lucide-react';
import { dayOutOfDaysService } from '../services/dayOutOfDaysService';
import { useAuthStore } from '../authStore';
import { useToastStore } from '../toastStore';

const STATUS_CONFIG = {
  working: { code: 'W', label: 'Working', bg: 'bg-emerald-600/30 hover:bg-emerald-500/50', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  hold: { code: 'H', label: 'Hold', bg: 'bg-amber-600/30 hover:bg-amber-500/50', text: 'text-amber-300', border: 'border-amber-500/30' },
  available: { code: 'F', label: 'Frozen', bg: 'bg-sky-600/30 hover:bg-sky-500/50', text: 'text-sky-300', border: 'border-sky-500/30' },
  released: { code: 'R', label: 'Rest', bg: 'bg-slate-600/30 hover:bg-slate-500/50', text: 'text-slate-300', border: 'border-slate-500/30' },
  not_required: { code: '—', label: 'Not Working', bg: 'bg-transparent hover:bg-white/5', text: 'text-red-400/50', border: 'border-transparent' },
};

const CYCLE_STATUSES = ['working', 'hold', 'available', 'released'];

export default function DayOutOfDaysView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [schedules, setSchedules] = useState([]);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await dayOutOfDaysService.index(filmId);
      setSchedules(data.schedules || []);
      setCast(data.cast || []);
    } catch (err) {
      console.error('Failed to load DOOD:', err);
      addToast('Failed to load Day Out of Days data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const filteredCast = useMemo(() => {
    if (!search.trim()) return cast;
    const q = search.toLowerCase();
    return cast.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.character_name?.toLowerCase().includes(q)
    );
  }, [cast, search]);

  const stats = useMemo(() => {
    const totalCast = cast.length;
    const totalDays = schedules.length;
    const workingDays = {};
    cast.forEach(m => {
      workingDays[m.id] = m.days?.filter(d => d.status === 'working').length || 0;
    });
    return { totalCast, totalDays, workingDays };
  }, [cast, schedules]);

  const handleCellClick = async (castCrewId, shootDate, currentStatus) => {
    if (updating) return;
    const nextIdx = currentStatus === 'not_required'
      ? 0
      : (CYCLE_STATUSES.indexOf(currentStatus) + 1) % CYCLE_STATUSES.length;
    const nextStatus = currentStatus === 'not_required'
      ? CYCLE_STATUSES[0]
      : CYCLE_STATUSES[nextIdx];

    setUpdating(`${castCrewId}-${shootDate}`);
    try {
      await dayOutOfDaysService.update(filmId, {
        cast_crew_id: castCrewId,
        shoot_date: shootDate,
        status: nextStatus,
      });
      setCast(prev => prev.map(m => {
        if (m.id !== castCrewId) return m;
        return {
          ...m,
          days: m.days.map(d =>
            d.date === shootDate ? { ...d, status: nextStatus } : d
          ),
        };
      }));
    } catch (err) {
      console.error('Failed to update status:', err);
      addToast('Failed to update status', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const handleReset = () => {
    if (!confirm('Reset all availability to Not Working?')) return;
    const promises = [];
    cast.forEach(m => {
      m.days.forEach(d => {
        if (d.status !== 'not_required') {
          promises.push(
            dayOutOfDaysService.update(filmId, {
              cast_crew_id: m.id,
              shoot_date: d.date,
              status: 'not_required',
            })
          );
        }
      });
    });
    Promise.all(promises)
      .then(() => {
        fetchData();
        addToast('All statuses reset');
      })
      .catch(() => addToast('Failed to reset statuses', 'error'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const dateRange = schedules.length > 0
    ? `${schedules[0].shoot_date} — ${schedules[schedules.length - 1].shoot_date}`
    : 'No dates';

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-400" /> Day Out of Days
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentFilm?.title || ''} · {dateRange} · {schedules.length} shoot days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-800/60 border border-slate-700 rounded-lg hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Reset All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { code: 'W', label: 'Working', color: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/30' },
          { code: 'H', label: 'Hold', color: 'bg-amber-600/30 text-amber-300 border-amber-500/30' },
          { code: 'F', label: 'Frozen', color: 'bg-sky-600/30 text-sky-300 border-sky-500/30' },
          { code: 'R', label: 'Rest', color: 'bg-slate-600/30 text-slate-300 border-slate-500/30' },
          { code: '—', label: 'Not Working', color: 'bg-transparent text-red-400/50 border-slate-800' },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${s.color}`}>
            <span className="text-xs font-black">{s.code}</span>
            <span className="text-[10px] text-slate-400">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cast or character..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="text-xs text-slate-500">
          <span className="text-amber-400 font-bold">{filteredCast.length}</span> cast · <span className="text-amber-400 font-bold">{schedules.length}</span> shoot days
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <div className="min-w-max">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-900/80">
                <th className="sticky left-0 z-10 bg-slate-900 text-left px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[180px] border-r border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" /> Cast / Character
                  </div>
                </th>
                {schedules.map(s => (
                  <th
                    key={s.id}
                    className="px-2 py-2.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider min-w-[40px] border-r border-slate-800 last:border-r-0"
                  >
                    <div className="text-slate-400">{s.day_number}</div>
                    <div className="text-slate-600 font-normal mt-0.5">
                      {s.shoot_date ? s.shoot_date.slice(5) : ''}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCast.length === 0 && (
                <tr>
                  <td colSpan={schedules.length + 1} className="text-center py-12 text-slate-500 text-sm">
                    No cast members found.
                  </td>
                </tr>
              )}
              {filteredCast.map((member, idx) => (
                <tr
                  key={member.id}
                  className={`${idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/10'} hover:bg-slate-800/30 transition-colors`}
                >
                  <td className="sticky left-0 z-10 bg-inherit px-3 py-2 border-r border-slate-800 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black shrink-0">
                        {member.character_name ? member.character_name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-slate-200 font-bold text-xs truncate">{member.name}</div>
                        <div className="text-slate-500 text-[10px] truncate">
                          {member.character_name || member.role_name || '—'}
                        </div>
                      </div>
                      <div className="ml-auto shrink-0 text-right">
                        <span className="text-emerald-400 font-black text-[10px]">
                          {stats.workingDays[member.id] || 0}W
                        </span>
                      </div>
                    </div>
                  </td>
                  {member.days.map((day, di) => {
                    const cfg = STATUS_CONFIG[day.status] || STATUS_CONFIG.not_required;
                    const isUpdating = updating === `${member.id}-${day.date}`;
                    return (
                      <td
                        key={di}
                        className="px-2 py-1.5 text-center border-r border-slate-800 last:border-r-0"
                      >
                        <button
                          onClick={() => handleCellClick(member.id, day.date, day.status)}
                          disabled={!!updating}
                          className={`w-full h-full min-h-[28px] flex items-center justify-center rounded-md border text-[11px] font-black transition-all ${cfg.bg} ${cfg.text} ${cfg.border} ${isUpdating ? 'animate-pulse opacity-50' : ''}`}
                          title={`${member.name} — ${day.date}: ${cfg.label}`}
                        >
                          {cfg.code}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
