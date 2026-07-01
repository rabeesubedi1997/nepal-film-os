import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import { usePermission } from '../hooks/usePermission';
import { useLanguageStore } from '../languageStore';
import LanguageSwitcher from './LanguageSwitcher';
import ToastContainer from './Toast';
import {
  Film, Calendar, Users, DollarSign, Clipboard, Activity,
  LogOut, Home, MapPin, CheckSquare, FileText, MessageSquare,
  Bell, Clock, Layers, BarChart2, Camera, Menu, X, Settings, ToggleLeft, Image,
  BarChart3, Building2, Shield, UserPlus
} from 'lucide-react';

export default function Layout() {
  const { currentFilm, userFilms, user, userRole, logout, selectFilm, fetchFilms } = useAuthStore();
  const perm = usePermission();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { t, initialize } = useLanguageStore();

  React.useEffect(() => { fetchFilms(); }, []);
  React.useEffect(() => { initialize(); }, []);

  React.useEffect(() => {
    if (currentFilm) return;
    const safeRoutes = ['/app/dashboard', '/app/select-film'];
    if (!safeRoutes.includes(location.pathname)) {
      navigate(userFilms.length > 1 ? '/app/select-film' : '/app/dashboard');
    }
  }, [currentFilm, userFilms.length, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: Home, moduleKey: null, tKey: 'nav.dashboard' },
    { name: 'Scripts', path: '/app/scripts', icon: FileText, moduleKey: 'script', tKey: 'nav.script' },
    { name: 'Schedule', path: '/app/schedule', icon: Calendar, moduleKey: 'schedule', tKey: 'nav.schedule' },
    { name: 'Script Breakdown', path: '/app/script-breakdown', icon: FileText, moduleKey: 'script_breakdown', tKey: 'nav.script_breakdown' },
    { name: 'Shot List', path: '/app/shot-list', icon: Camera, moduleKey: 'shot_list', tKey: 'nav.shot_list' },
    { name: 'Storyboard', path: '/app/storyboard', icon: Image, moduleKey: 'storyboard', tKey: 'nav.storyboard' },
    { name: 'Production Calendar', path: '/app/production-calendar', icon: Calendar, moduleKey: 'production_calendar', tKey: 'nav.production_calendar' },
    { name: 'Cast & Crew', path: '/app/cast-crew', icon: Users, moduleKey: 'cast_crew', tKey: 'nav.cast_crew' },
    { name: 'Locations', path: '/app/locations', icon: MapPin, moduleKey: 'locations', tKey: 'nav.locations' },
    { name: 'Budget & Expenses', path: '/app/expenses', icon: DollarSign, moduleKey: 'expenses', tKey: 'nav.budget' },
    { name: 'Vendors', path: '/app/vendors', icon: Building2, moduleKey: 'vendors', tKey: 'nav.vendors' },
    { name: 'Call Sheets', path: '/app/call-sheets', icon: Clipboard, moduleKey: 'call_sheet', tKey: 'nav.call_sheets' },
    { name: 'Progress', path: '/app/progress', icon: Activity, moduleKey: 'progress', tKey: 'nav.progress' },
    { name: 'Tasks', path: '/app/tasks', icon: CheckSquare, moduleKey: 'tasks', tKey: 'nav.tasks' },
    { name: 'Time Sheets', path: '/app/timesheets', icon: Clock, moduleKey: 'timesheets', tKey: 'nav.timesheets' },
    { name: 'DPR', path: '/app/dpr', icon: BarChart2, moduleKey: 'dpr', tKey: 'nav.dpr' },
    { name: 'Documents', path: '/app/documents', icon: Layers, moduleKey: 'documents', tKey: 'nav.documents' },
    { name: 'Messages', path: '/app/messages', icon: MessageSquare, moduleKey: 'messaging', tKey: 'nav.messages' },
    { name: 'Wardrobe', path: '/app/wardrobe', icon: Layers, moduleKey: 'wardrobe', tKey: 'nav.wardrobe' },
    { name: 'Continuity', path: '/app/continuity', icon: Activity, moduleKey: 'continuity', tKey: 'nav.continuity' },
    { name: 'Series', path: '/app/series', icon: Film, moduleKey: null, tKey: 'nav.series' },
    { name: 'Day Out of Days', path: '/app/day-out-of-days', icon: Calendar, moduleKey: 'schedule', tKey: 'nav.day_out_of_days' },
    { name: 'Reports', path: '/app/reports', icon: BarChart2, moduleKey: null, tKey: 'nav.reports' },
    { name: 'Analytics', path: '/app/analytics', icon: BarChart3, moduleKey: null, tKey: 'nav.analytics' },
    { name: 'Media Library', path: '/app/media', icon: Image, moduleKey: null, tKey: 'nav.media' },
    { name: 'News', path: '/app/news', icon: Bell, moduleKey: null, tKey: 'nav.news' },
    { name: 'Feature Settings', path: '/app/settings', icon: ToggleLeft, moduleKey: null, tKey: 'nav.settings' },
    { name: 'Members', path: '/app/members', icon: UserPlus, moduleKey: null, tKey: 'nav.members' },
    { name: 'Roles & Permissions', path: '/app/roles', icon: Shield, moduleKey: null, tKey: 'nav.roles' },
    { name: 'Admin', path: '/app/admin', icon: Settings, moduleKey: null, adminOnly: true, tKey: 'nav.admin' },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (!perm.hasModule(item.moduleKey)) return false;
    if (item.adminOnly && !perm.isSuperAdmin) return false;
    return true;
  });

  const activeItem = visibleNavItems.find(item => item.path === location.pathname);

  React.useEffect(() => {
    if (!currentFilm?.modules) return;
    const item = navItems.find(i => i.path === location.pathname);
    if (item?.moduleKey && !perm.hasModule(item.moduleKey)) {
      navigate('/app/dashboard');
    }
  }, [currentFilm?.modules, location.pathname]);

  const SidebarContent = () => (
    <>
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-slate-800 shrink-0">
        <Film className="h-5 w-5 text-amber-500 shrink-0" />
        <span className="text-sm font-bold text-slate-100">{t("app.name")}</span>
      </div>

      <div className="px-3 py-3 border-b border-slate-800 space-y-2">
        {currentFilm ? (
          <select value={currentFilm.id} onChange={e => { if (e.target.value) selectFilm(Number(e.target.value)); }}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer truncate">
            {userFilms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
        ) : (
          <select value="" onChange={e => { if (e.target.value) selectFilm(Number(e.target.value)); }}
            className="w-full bg-slate-800 border border-slate-700 text-slate-500 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer">
            <option value="">{t("film.no_selection")}</option>
            {userFilms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
        )}
        {currentFilm && (
          <p className="text-xs text-amber-500 font-medium px-1">{userRole || 'Member'}</p>
        )}
        <LanguageSwitcher />
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {visibleNavItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(item.tKey, item.name)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors" title="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <aside className="hidden md:flex flex-col w-56 bg-slate-950 border-r border-slate-800/50 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      <div className="md:hidden bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="h-12 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold text-slate-100">{t("app.name")}</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400">
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-slate-800 bg-slate-950 max-h-[80vh] overflow-y-auto">
            <SidebarContent />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {activeItem && (
          <header className="hidden md:flex h-12 items-center px-6 border-b border-slate-800/50 bg-slate-950 sticky top-0 z-30">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">{t(activeItem.tKey, activeItem.name)}</span>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto" onClick={() => mobileOpen && setMobileOpen(false)}>
          <div className="max-w-7xl mx-auto p-5 md:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
