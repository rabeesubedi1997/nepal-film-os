import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../authStore';
import { analyticsService } from '../services/analyticsService';
import {
  BarChart3, TrendingUp, DollarSign, Users, Calendar, Film, Loader2,
  AlertTriangle
} from 'lucide-react';
import dayjs from 'dayjs';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color || 'bg-amber-500/10 text-amber-400'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function ProgressBar({ value, max = 100, color = 'bg-amber-500' }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function BarChart({ data, xKey, yKey1, yKey2, label1, label2, color1, color2, maxValue }) {
  const max = maxValue || Math.max(...data.map(d => Math.max(d[yKey1] || 0, d[yKey2] || 0)), 1);
  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const v1 = item[yKey1] || 0;
        const v2 = item[yKey2] || 0;
        const p1 = (v1 / max) * 100;
        const p2 = (v2 / max) * 100;
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-16 shrink-0 text-slate-400 truncate" title={item[xKey]}>{item[xKey]}</span>
            <div className="flex-1 flex gap-0.5">
              <div className="flex-1 bg-slate-800 rounded h-3 overflow-hidden">
                <div className={`h-full rounded ${color1} transition-all`} style={{ width: `${p1}%` }} />
              </div>
              <div className="flex-1 bg-slate-800 rounded h-3 overflow-hidden">
                <div className={`h-full rounded ${color2} transition-all`} style={{ width: `${p2}%` }} />
              </div>
            </div>
            <span className="w-20 text-right text-slate-500 shrink-0">
              {v1}{label1} / {v2}{label2}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SingleBarChart({ data, xKey, yKey, label, color }) {
  const max = Math.max(...data.map(d => d[yKey] || 0), 1);
  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const v = item[yKey] || 0;
        const p = (v / max) * 100;
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 text-slate-400 truncate" title={item[xKey]}>{item[xKey]}</span>
            <div className="flex-1 bg-slate-800 rounded h-4 overflow-hidden">
              <div className={`h-full rounded ${color} transition-all`} style={{ width: `${p}%` }} />
            </div>
            <span className="w-16 text-right text-slate-500 shrink-0">{v} {label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatusBlocks({ data }) {
  const entries = Object.entries(data || {});
  const total = entries.reduce((s, [, c]) => s + c, 0);
  const colors = {
    'Completed': 'bg-emerald-500',
    'In Progress': 'bg-amber-500',
    'Scheduled': 'bg-blue-500',
    'Not Started': 'bg-slate-600',
    'Pending': 'bg-yellow-500',
    'Approved': 'bg-green-500',
    'Paid': 'bg-emerald-500',
  };
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([status, count]) => (
        <div key={status} className="flex items-center gap-1.5 text-xs">
          <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-slate-500'}`} />
          <span className="text-slate-300">{status}</span>
          <span className="text-slate-500 font-mono">{count}</span>
        </div>
      ))}
      <div className="text-xs text-slate-600 ml-auto">Total: {total}</div>
    </div>
  );
}

export default function AnalyticsView() {
  const { currentFilm } = useAuthStore();
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [forecasts, setForecasts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentFilm?.id) return;
    (async () => {
      setLoading(true);
      try {
        const [ov, tr, fc] = await Promise.all([
          analyticsService.overview(currentFilm.id),
          analyticsService.trends(currentFilm.id),
          analyticsService.forecasts(currentFilm.id),
        ]);
        setOverview(ov);
        setTrends(tr);
        setForecasts(fc);
      } catch (err) {
        console.error('Analytics load error:', err);
      }
      setLoading(false);
    })();
  }, [currentFilm?.id]);

  if (!currentFilm) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Select a film workspace to view analytics.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  const { shoot_days, scenes, crew, budget, expenses_pending, expenses_approved } = overview || {};
  const { weekly_trends, department_budget, scene_statuses, schedule_statuses } = trends || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Advanced Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Production insights, trends, and forecasts for {currentFilm?.title}.</p>
      </div>

      {/* Section 1: Overview */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-amber-500" /> Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Calendar} label="Shoot Days"
            value={`${shoot_days?.completed || 0} / ${shoot_days?.total || 0}`}
            sub={<><span className="text-amber-400">{shoot_days?.completion || 0}%</span> complete</>}
            color="bg-blue-500/10 text-blue-400" />
          <StatCard icon={Film} label="Scenes"
            value={`${scenes?.completed || 0} / ${scenes?.total || 0}`}
            sub={<><span className="text-amber-400">{scenes?.completion || 0}%</span> complete</>}
            color="bg-purple-500/10 text-purple-400" />
          <StatCard icon={Users} label="Crew Breakdown"
            value={crew?.total || 0}
            sub={<>{crew?.cast || 0} Cast / {crew?.crew || 0} Crew</>}
            color="bg-emerald-500/10 text-emerald-400" />
          <StatCard icon={DollarSign} label="Budget"
            value={`NPR ${(budget?.budgeted || 0).toLocaleString()}`}
            sub={<>
              Spent: NPR {(budget?.spent || 0).toLocaleString()} |
              <span className={budget?.variance > 100 ? 'text-red-400' : 'text-emerald-400'}>
                {budget?.variance || 0}%
              </span>
            </>}
            color="bg-amber-500/10 text-amber-400" />
        </div>

        {/* Budget Progress Bar */}
        <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Budget Utilization</span>
            <span>NPR {(budget?.spent || 0).toLocaleString()} / NPR {(budget?.budgeted || 0).toLocaleString()}</span>
          </div>
          <ProgressBar value={budget?.variance || 0} max={100} color={budget?.variance > 100 ? 'bg-red-500' : 'bg-amber-500'} />
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>Remaining: NPR {(budget?.remaining || 0).toLocaleString()}</span>
            <div className="flex gap-4">
              <span className="text-yellow-400">Pending: {expenses_pending || 0}</span>
              <span className="text-green-400">Approved: {expenses_approved || 0}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Charts */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-500" /> Trends & Distribution
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Trends */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Weekly Shoot Day Trends</h3>
            <BarChart
              data={weekly_trends || []}
              xKey="week"
              yKey1="scheduled"
              yKey2="completed"
              label1=""
              label2=""
              color1="bg-blue-500"
              color2="bg-emerald-500"
            />
          </div>

          {/* Department Budget */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Department Budget vs Actual</h3>
            <SingleBarChart
              data={department_budget || []}
              xKey="department"
              yKey="budgeted"
              label=""
              color="bg-amber-500"
            />
            <div className="mt-3">
              <SingleBarChart
                data={department_budget || []}
                xKey="department"
                yKey="spent"
                label=""
                color="bg-emerald-500"
              />
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> Budgeted</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Spent</span>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Scene Status Distribution</h3>
            <StatusBlocks data={scene_statuses} />
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Schedule Status Distribution</h3>
            <StatusBlocks data={schedule_statuses} />
          </div>
        </div>
      </section>

      {/* Section 3: Forecast */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-500" /> Forecast & Projections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Scene Completion Rate</p>
            <p className="text-lg font-bold text-slate-100">{forecasts?.scene_completion_rate || 0}%</p>
            <ProgressBar value={forecasts?.scene_completion_rate || 0} max={100} />
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Day Completion Rate</p>
            <p className="text-lg font-bold text-slate-100">{forecasts?.day_completion_rate || 0}%</p>
            <ProgressBar value={forecasts?.day_completion_rate || 0} max={100} color="bg-blue-500" />
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Est. Days Remaining</p>
            <p className="text-lg font-bold text-slate-100">{forecasts?.estimated_days_remaining || 0}</p>
            <p className="text-xs text-slate-600 mt-1">shoot days left</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Daily Burn Rate</p>
            <p className="text-lg font-bold text-slate-100">NPR {(forecasts?.daily_burn_rate || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-600 mt-1">per day</p>
          </div>
        </div>

        <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Cost Projection</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Budget</p>
              <p className="text-lg font-bold text-slate-100">NPR {(forecasts?.budget || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Spent So Far</p>
              <p className="text-lg font-bold text-slate-100">NPR {(forecasts?.spent || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Projected Total</p>
              <p className={`text-lg font-bold ${forecasts?.budget_variance_percent > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                NPR {(forecasts?.projected_total_cost || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ProgressBar
              value={forecasts?.projected_total_cost || 0}
              max={Math.max(forecasts?.budget || 1, forecasts?.projected_total_cost || 0)}
              color={forecasts?.budget_variance_percent > 0 ? 'bg-red-500' : 'bg-emerald-500'}
            />
            <span className={`text-xs font-semibold shrink-0 ${forecasts?.budget_variance_percent > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {forecasts?.budget_variance_percent > 0 ? '+' : ''}{forecasts?.budget_variance_percent || 0}%
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs">
            {forecasts?.budget_variance_percent > 0 ? (
              <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="h-3 w-3" /> Projected over budget by {forecasts?.budget_variance_percent}%</span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400"><TrendingUp className="h-3 w-3" /> Under budget by {Math.abs(forecasts?.budget_variance_percent || 0)}%</span>
            )}
            <span className="text-slate-600 ml-auto">Est. remaining: NPR {(forecasts?.estimated_remaining_cost || 0).toLocaleString()}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
