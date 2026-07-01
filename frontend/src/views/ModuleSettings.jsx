import React from 'react';
import { useAuthStore } from '../authStore';
import { useToastStore } from '../toastStore';
import {
  Calendar, Users, DollarSign, Clipboard, Activity, MapPin,
  FileText, Camera, CheckSquare, Clock, BarChart2, Layers,
  MessageSquare, Film, ToggleLeft, ToggleRight, Shield
} from 'lucide-react';

const MODULES = [
  { key: 'schedule', label: 'Shooting Schedule', icon: Calendar, desc: 'Stripboard scheduling, scenes, shoot days' },
  { key: 'cast_crew', label: 'Cast & Crew', icon: Users, desc: 'Cast/crew directory, rates, contacts' },
  { key: 'expenses', label: 'Budget & Expenses', icon: DollarSign, desc: 'Budgeting, expense tracking, approvals' },
  { key: 'call_sheet', label: 'Call Sheets', icon: Clipboard, desc: 'Call sheet generation and distribution' },
  { key: 'progress', label: 'Progress Tracking', icon: Activity, desc: 'Daily progress updates and reports' },
  { key: 'locations', label: 'Locations', icon: MapPin, desc: 'Location scouting and management' },
  { key: 'script_breakdown', label: 'Script Breakdown', icon: FileText, desc: 'Tag props, cast, wardrobe from script' },
  { key: 'shot_list', label: 'Shot List', icon: Camera, desc: 'Shot-by-shot planning per scene' },
  { key: 'tasks', label: 'Task Management', icon: CheckSquare, desc: 'To-do lists and task assignments' },
  { key: 'timesheets', label: 'Time Sheets', icon: Clock, desc: 'Crew time tracking and approvals' },
  { key: 'dpr', label: 'Daily Production Reports', icon: BarChart2, desc: 'Daily report logging' },
  { key: 'documents', label: 'Document Library', icon: Layers, desc: 'File uploads and document storage' },
  { key: 'messaging', label: 'In-App Messaging', icon: MessageSquare, desc: 'Team communication' },
  { key: 'wardrobe', label: 'Wardrobe', icon: Film, desc: 'Costume tracking and management' },
  { key: 'continuity', label: 'Continuity', icon: Activity, desc: 'Scene continuity records' },
  { key: 'storyboard', label: 'Storyboard', icon: Camera, desc: 'Visual storyboarding and mood boards' },
  { key: 'production_calendar', label: 'Production Calendar', icon: Calendar, desc: 'Gantt chart timeline and milestone tracking' },
];

export default function ModuleSettings() {
  const { currentFilm, userRole, userIsAdmin, user, toggleModule } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);

  const isAdmin = userIsAdmin || user?.is_super_admin;

  const moduleStatus = (key) => {
    if (!currentFilm?.modules) return true;
    const m = currentFilm.modules.find(mod => mod.module_name === key);
    return m ? m.is_enabled : true;
  };

  const handleToggle = async (key, currentlyEnabled) => {
    await toggleModule(key, !currentlyEnabled);
    addToast(currentlyEnabled ? 'Module disabled' : 'Module enabled');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Feature Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Enable or disable features for this film workspace</p>
        </div>
        {isAdmin && (
          <span className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full font-medium">
            <Shield className="h-3.5 w-3.5" /> Admin Controls
          </span>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center">
          <Shield className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Only Admins can manage feature settings.</p>
        </div>
      )}

      <div className="grid gap-3">
        {MODULES.map(mod => {
          const Icon = mod.icon;
          const enabled = moduleStatus(mod.key);
          return (
            <div key={mod.key}
              className={`bg-slate-900 border rounded-xl p-4 flex items-center justify-between transition-all ${
                enabled ? 'border-slate-700' : 'border-slate-800/50 opacity-60'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  enabled ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-600'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${enabled ? 'text-slate-200' : 'text-slate-500'}`}>{mod.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{mod.desc}</p>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => handleToggle(mod.key, enabled)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${
                    enabled
                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                  }`}
                >
                  {enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  {enabled ? 'Enabled' : 'Disabled'}
                </button>
              )}
              {!isAdmin && (
                <span className={`text-xs px-3 py-1.5 rounded-lg ${
                  enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {enabled ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
