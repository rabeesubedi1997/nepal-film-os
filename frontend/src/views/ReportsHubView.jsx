import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import { reportService } from '../services/reportService';
import { scheduleService } from '../services/scheduleService';
import { callSheetService } from '../services/callSheetService';
import {
  Calendar, FileText, Clipboard, DollarSign, CheckSquare,
  BarChart2, Download, ChevronDown, X, FileSpreadsheet,
  Activity, Loader2
} from 'lucide-react';

const REPORTS = [
  {
    id: 'day-out-of-days',
    name: 'Day Out of Days',
    description: 'Cast scheduling grid showing availability across shoot days.',
    icon: Calendar,
    color: 'from-blue-500 to-blue-600',
    type: 'link',
    path: '/day-out-of-days',
  },
  {
    id: 'shooting-schedule',
    name: 'Shooting Schedule PDF',
    description: 'Generate a PDF for a specific shoot day.',
    icon: FileText,
    color: 'from-amber-500 to-orange-600',
    type: 'schedule_pdf',
  },
  {
    id: 'call-sheet',
    name: 'Call Sheet PDF',
    description: 'Download a call sheet as PDF.',
    icon: Clipboard,
    color: 'from-purple-500 to-purple-700',
    type: 'call_sheet_pdf',
  },
  {
    id: 'budget',
    name: 'Budget Report',
    description: 'Full budget vs actuals overview.',
    icon: DollarSign,
    color: 'from-emerald-500 to-emerald-700',
    type: 'link',
    path: '/expenses',
  },
  {
    id: 'scene-progress',
    name: 'Scene Progress',
    description: 'Scene-by-scene completion status table.',
    icon: CheckSquare,
    color: 'from-cyan-500 to-cyan-700',
    type: 'scene_progress',
  },
  {
    id: 'production-summary',
    name: 'Production Summary',
    description: 'Aggregate production stats at a glance.',
    icon: BarChart2,
    color: 'from-rose-500 to-rose-700',
    type: 'summary',
  },
  {
    id: 'dpr',
    name: 'DPR Report',
    description: 'Daily Production Report export.',
    icon: Activity,
    color: 'from-indigo-500 to-indigo-700',
    type: 'link',
    path: '/dpr',
  },
];

export default function ReportsHubView() {
  const { currentFilm } = useAuthStore();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalReport, setModalReport] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(null);
  const [sceneLoading, setSceneLoading] = useState(false);

  useEffect(() => {
    if (!currentFilm) return;
    (async () => {
      setLoading(true);
      try {
        const data = await reportService.summary(currentFilm.id);
        setSummary(data);
      } catch (err) {
        console.error('Failed to load summary', err);
      }
      setLoading(false);
    })();
  }, [currentFilm]);

  const openModal = async (report) => {
    setModalReport(report);
    if (report.type === 'schedule_pdf') {
      setItemsLoading(true);
      try {
        const { scheduleService: ss } = await import('../services/scheduleService');
        const data = await ss.index(currentFilm.id);
        setItems(data.schedules || data || []);
      } catch (err) {
        console.error(err);
        setItems([]);
      }
      setItemsLoading(false);
    } else if (report.type === 'call_sheet_pdf') {
      setItemsLoading(true);
      try {
        const { callSheetService: cs } = await import('../services/callSheetService');
        const data = await cs.index(currentFilm.id);
        setItems(data.callSheets || data || []);
      } catch (err) {
        console.error(err);
        setItems([]);
      }
      setItemsLoading(false);
    } else if (report.type === 'scene_progress') {
      setSceneLoading(true);
      try {
        const api = (await import('../api')).default;
        const res = await api.get(`/films/${currentFilm.id}/schedules`);
        const schedules = res.data.schedules || res.data || [];
        const { default: dayjs } = await import('dayjs');
        const grouped = {};
        for (const sched of schedules) {
          const scenes = sched.scenes || [];
          for (const sc of scenes) {
            const key = `${sc.scene_number || sc.id} - ${sc.scene_heading || 'Untitled'}`;
            grouped[key] = {
              scene: key,
              status: sc.status || 'Not Started',
              location: sc.location?.name || '-',
              pages: sc.page_count || 0,
              shootDate: sched.shoot_date || '-',
            };
          }
        }
        setSceneProgress(Object.values(grouped));
      } catch (err) {
        console.error(err);
        setSceneProgress([]);
      }
      setSceneLoading(false);
    } else if (report.type === 'summary') {
      setModalReport(null);
      if (summary) {
        const lines = [
          '=== Production Summary ===',
          `Total Shoot Days: ${summary.total_shoot_days}`,
          `Completed Shoot Days: ${summary.completed_shoot_days}`,
          `Shoot Day Completion: ${summary.shoot_day_completion}%`,
          `Total Scenes: ${summary.total_scenes}`,
          `Completed Scenes: ${summary.completed_scenes}`,
          `Scene Completion: ${summary.scene_completion}%`,
          `Total Cast & Crew: ${summary.total_cast_crew}`,
          `Total Call Sheets: ${summary.total_call_sheets}`,
          `Total Expenses: NPR ${summary.total_expenses}`,
        ].join('\n');
        const blob = new Blob([lines], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `production-summary-${currentFilm.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    }
  };

  const downloadItem = async (item) => {
    if (modalReport.type === 'schedule_pdf') {
      await scheduleService.exportPdf(currentFilm.id, item.id);
    } else if (modalReport.type === 'call_sheet_pdf') {
      await callSheetService.exportPdf(currentFilm.id, item.id);
    }
    setModalReport(null);
  };

  const handleCardClick = (report) => {
    if (report.type === 'link') {
      navigate(report.path);
    } else {
      openModal(report);
    }
  };

  if (!currentFilm) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Select a film workspace to view reports.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Reports Hub</h1>
        <p className="text-sm text-slate-400 mt-1">Generate, export, and view production reports.</p>
      </div>

      {/* Summary Stats */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading summary...
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Shoot Days" value={`${summary.completed_shoot_days}/${summary.total_shoot_days}`} sub={`${summary.shoot_day_completion}% complete`} />
          <StatCard label="Scenes" value={`${summary.completed_scenes}/${summary.total_scenes}`} sub={`${summary.scene_completion}% complete`} />
          <StatCard label="Cast & Crew" value={summary.total_cast_crew} sub="Total members" />
          <StatCard label="Expenses" value={`NPR ${summary.total_expenses?.toLocaleString()}`} sub="Total spent" />
        </div>
      ) : null}

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => handleCardClick(report)}
              className="group relative bg-slate-900/70 border border-slate-800 rounded-xl p-5 text-left transition-all hover:border-slate-700 hover:bg-slate-900 hover:shadow-lg hover:shadow-amber-500/5"
            >
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${report.color} text-white mb-4`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">{report.name}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{report.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {report.type === 'link' ? 'Navigate →' : 'Generate →'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scene Progress Table */}
      {sceneProgress && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Scene Progress</h2>
            <button onClick={() => setSceneProgress(null)} className="text-slate-500 hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left py-2 pr-4">Scene</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Location</th>
                  <th className="text-left py-2 pr-4">Pages</th>
                  <th className="text-left py-2 pr-4">Shoot Date</th>
                </tr>
              </thead>
              <tbody>
                {sceneLoading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></td></tr>
                ) : sceneProgress.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500">No scenes found.</td></tr>
                ) : (
                  sceneProgress.map((s, i) => (
                    <tr key={i} className="border-b border-slate-800/50 text-slate-300">
                      <td className="py-2 pr-4 font-medium">{s.scene}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          s.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                          s.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-slate-700/50 text-slate-400'
                        }`}>{s.status}</span>
                      </td>
                      <td className="py-2 pr-4 text-slate-500">{s.location}</td>
                      <td className="py-2 pr-4 text-slate-500">{s.pages}</td>
                      <td className="py-2 pr-4 text-slate-500">{s.shootDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selection Modal */}
      {modalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModalReport(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-200">Select {modalReport.name}</h2>
              <button onClick={() => setModalReport(null)} className="text-slate-500 hover:text-slate-300">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {itemsLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No items available.</p>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => downloadItem(item)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-left transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {item.day_number ? `Day ${item.day_number}` : item.title || item.name || `Item #${item.id}`}
                      </p>
                      {item.shoot_date && (
                        <p className="text-xs text-slate-500">{item.shoot_date}</p>
                      )}
                    </div>
                    <Download className="h-4 w-4 text-amber-500 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-100">{value}</p>
      <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>
    </div>
  );
}
