import React from 'react';
import { Link } from 'react-router-dom';
import {
  Film, Calendar, Users, DollarSign, Clipboard, Activity,
  MapPin, CheckSquare, FileText, MessageSquare, Bell, Clock, Layers,
  BarChart3, Camera, ToggleLeft, Image, Building2, LogIn, Star,
  ChevronRight, Menu, X, Shield, Smartphone, Globe, Cloud, ArrowRight
} from 'lucide-react';

const features = [
  { slug: 'shooting-schedule', icon: Calendar, name: 'Shooting Schedule', desc: 'Plan and manage your entire production timeline with drag-and-drop scheduling, scene assignments, and real-time updates.', color: 'text-blue-400', bg: 'bg-blue-500/10', long: 'Our Shooting Schedule module gives you a complete overview of your production timeline. Drag-and-drop scenes onto shoot days, assign cast and crew, manage call times and wrap times, and track the status of each shoot day. Integrated with locations, weather data, and crew availability to eliminate scheduling conflicts.' },
  { slug: 'script-writing', icon: FileText, name: 'Script Writing', desc: 'Write and edit screenplays with our built-in script editor. Supports Fountain syntax, revisions, and version control.', color: 'text-purple-400', bg: 'bg-purple-500/10', long: 'A full-featured script writing environment that supports Fountain markdown syntax, automatic scene numbering, revision tracking, and version control. Export to PDF, Final Draft, or Fountain format. Collaborate in real-time with your writing team and keep a complete revision history.' },
  { slug: 'script-breakdown', icon: Camera, name: 'Script Breakdown', desc: 'Break down scripts into scenes, elements, and requirements. Generate reports for cast, props, wardrobe and more.', color: 'text-pink-400', bg: 'bg-pink-500/10', long: 'Automatically parse your script into individual scene elements. Tag cast, props, wardrobe, vehicles, special effects, and more. Generate comprehensive breakdown reports, stripboards, and budetary estimates based on each element\'s requirements.' },
  { slug: 'shot-list', icon: Image, name: 'Shot List', desc: 'Create detailed shot lists for each scene with camera angles, lens specifications, and storyboard references.', color: 'text-rose-400', bg: 'bg-rose-500/10', long: 'Plan every shot of your film with precision. Define camera angles, lens choices, camera movement, and framing for each scene. Link shots to storyboard images, assign to specific crew members, and track shot status from prep through completion.' },
  { slug: 'storyboard', icon: Image, name: 'Storyboard', desc: 'Create visual storyboards to pre-visualize your scenes. Upload reference images and arrange them in sequence.', color: 'text-orange-400', bg: 'bg-orange-500/10', long: 'Visualize your scenes before you shoot. Upload hand-drawn storyboards, create digital boards, or import from storyboard software. Arrange panels in sequence, add notes and camera directions, and share with your department heads for perfect alignment.' },
  { slug: 'production-calendar', icon: Calendar, name: 'Production Calendar', desc: 'View your entire production schedule on a calendar. Track milestones, shoot days, and important deadlines.', color: 'text-cyan-400', bg: 'bg-cyan-500/10', long: 'A comprehensive calendar view of your entire production. See shoot days, pre-production milestones, post-production deadlines, and crew schedules at a glance. Color-coded by department, with the ability to drill down into each day\'s details.' },
  { slug: 'cast-crew', icon: Users, name: 'Cast & Crew', desc: 'Manage your entire team — from lead actors to support crew. Track contracts, day rates, and availability.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', long: 'Complete cast and crew management including contact details, contracts, day rates, availability calendars, and department assignments. Track audition notes, call-back status, and payment schedules. Generate payroll reports and manage union compliance.' },
  { slug: 'locations', icon: MapPin, name: 'Locations', desc: 'Catalog shooting locations with GPS coordinates, permit status, contact info, parking details, and facility notes.', color: 'text-teal-400', bg: 'bg-teal-500/10', long: 'A searchable database of all your shooting locations. Store GPS coordinates, direction notes, permit status, contact information for location owners, parking logistics, power availability, bathroom facilities, and weather considerations. Map view for easy scouting.' },
  { slug: 'budget-expenses', icon: DollarSign, name: 'Budget & Expenses', desc: 'Track every rupee with department-level budgets, expense approvals, payment status, and real-time spending insights.', color: 'text-green-400', bg: 'bg-green-500/10', long: 'Real-time budget tracking across all departments. Set department budgets, log expenses as they occur, attach receipts digitally, and get instant notifications when spending exceeds thresholds. Approval workflows for large expenses and comprehensive budget vs. actual reports.' },
  { slug: 'vendors', icon: Building2, name: 'Vendors', desc: 'Manage your vendors and suppliers. Store contact details, service agreements, payment terms, and past orders.', color: 'text-lime-400', bg: 'bg-lime-500/10', long: 'A centralized vendor directory for all your production suppliers. Store contracts, rate cards, payment terms, and past order history. Rate and review vendors, compare quotes, and generate purchase orders — all within the platform.' },
  { slug: 'call-sheets', icon: Clipboard, name: 'Call Sheets', desc: 'Generate and distribute daily call sheets. Crew acknowledgments, weather reports, and emergency info all in one place.', color: 'text-amber-400', bg: 'bg-amber-500/10', long: 'Create professional call sheets in minutes. Automatically populate crew call times, scene schedules, location details, and catering information. Distribute via email or in-app notification. Track crew acknowledgments and keep a complete archive of past call sheets.' },
  { slug: 'progress', icon: Activity, name: 'Progress Tracking', desc: 'Track scene completion status in real time. Know exactly what\'s been shot, what\'s pending, and what\'s behind schedule.', color: 'text-yellow-400', bg: 'bg-yellow-500/10', long: 'Real-time progress tracking across all scenes and shoot days. Mark scenes as complete, in progress, or not started. Track page counts completed vs. remaining. View progress by department, location, or schedule day. Generate progress reports for producers and investors.' },
  { slug: 'tasks', icon: CheckSquare, name: 'Tasks', desc: 'Assign and track production tasks with priorities, due dates, and status updates. Keep everyone accountable.', color: 'text-indigo-400', bg: 'bg-indigo-500/10', long: 'A production-ready task management system. Create tasks, assign to team members, set priorities and due dates, add checklists, and track status. Filter by department, assignee, or priority. Get notifications when tasks are completed or overdue.' },
  { slug: 'timesheets', icon: Clock, name: 'Time Sheets', desc: 'Track crew work hours with digital time sheets. Submit, approve, and export for payroll processing.', color: 'text-violet-400', bg: 'bg-violet-500/10', long: 'Digital time tracking for all crew members. Clock in and out via mobile, submit weekly timesheets for approval, and managers can approve or reject with notes. Automatic overtime calculation and export to payroll systems. Audit trail for all time entries.' },
  { slug: 'dpr', icon: BarChart3, name: 'Daily Production Report', desc: 'Generate comprehensive DPRs with shot counts, page counts, crew hours, and daily notes for production records.', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', long: 'Auto-populated Daily Production Reports that compile shot counts, page counts, crew hours, weather conditions, meals served, and production notes. Review and approve digitally, export to PDF, and maintain a searchable archive of all production days.' },
  { slug: 'documents', icon: Layers, name: 'Document Library', desc: 'Centralized document storage for scripts, contracts, permits, and reports. Version control and role-based access.', color: 'text-sky-400', bg: 'bg-sky-500/10', long: 'A secure, organized document repository for all your production files. Upload and organize scripts, contracts, permits, reports, and reference materials. Version control with change tracking, role-based access control, and full-text search across all documents.' },
  { slug: 'messaging', icon: MessageSquare, name: 'Messaging', desc: 'In-app messaging system for cast and crew. Send updates, share files, and keep communication organized by film.', color: 'text-blue-400', bg: 'bg-blue-500/10', long: 'Built-in messaging for your entire production team. Create group chats by department or role, send direct messages, share files and images, and keep all production communication in one place. Threaded conversations and message search.' },
  { slug: 'wardrobe', icon: Layers, name: 'Wardrobe', desc: 'Manage costumes and wardrobe items per character. Track fittings, alterations, and scene assignments.', color: 'text-pink-400', bg: 'bg-pink-500/10', long: 'Complete wardrobe management for every character. Catalog costume pieces, track fittings and alterations, assign wardrobe to specific scenes, manage quick changes, and store reference photos. Ensure continuity with detailed notes for each costume piece.' },
  { slug: 'continuity', icon: Activity, name: 'Continuity', desc: 'Log continuity details — makeup, props, set dressings. Ensure every scene matches perfectly across takes.', color: 'text-rose-400', bg: 'bg-rose-500/10', long: 'Meticulous continuity tracking for every scene. Log makeup looks, prop positions, set dressing, hair styles, and wardrobe details. Compare takes side by side, capture reference photos, and generate continuity reports for the editing team.' },
  { slug: 'series', icon: Film, name: 'Series Management', desc: 'Manage multi-film series with shared cast, crew, and continuity across productions in the same franchise.', color: 'text-amber-400', bg: 'bg-amber-500/10', long: 'Manage interconnected film productions within a series or franchise. Share cast and crew across films, maintain consistent continuity, track overarching storylines, and manage series-level budgets and schedules.' },
  { slug: 'day-out-of-days', icon: Calendar, name: 'Day Out of Days', desc: 'Track cast and crew availability across the production schedule. Avoid scheduling conflicts and overtime issues.', color: 'text-orange-400', bg: 'bg-orange-500/10', long: 'Industry-standard Day Out of Days tracking for all cast and crew. Visual calendar showing work days, hold days, and travel days. Avoid overtime violations, track availability conflicts, and generate DOOD reports for guild compliance.' },
  { slug: 'reports-analytics', icon: BarChart3, name: 'Reports & Analytics', desc: 'Comprehensive production reports and analytics dashboards. Budget trends, progress forecasts, and performance metrics.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', long: 'Powerful analytics and reporting for producers and investors. Budget burn rate charts, progress forecasts, schedule adherence metrics, crew productivity stats, and custom report generation. Export to PDF, Excel, or share via link.' },
  { slug: 'news', icon: Bell, name: 'News Feed', desc: 'Stay updated with industry news, film releases, and production announcements from the Nepal film community.', color: 'text-yellow-400', bg: 'bg-yellow-500/10', long: 'A curated news feed for the Nepal film industry. Get updates on new film releases, industry events, policy changes, and production announcements. Share news with your team and stay connected to the broader film community.' },
  { slug: 'module-management', icon: ToggleLeft, name: 'Module Management', desc: 'Toggle features on or off per production. Customize your workspace with only the tools you need for each film.', color: 'text-lime-400', bg: 'bg-lime-500/10', long: 'Flexible module system that lets you customize your workspace. Enable or disable features based on your production\'s needs. Scale from a simple schedule tracker to a full-featured production management system. Changes take effect instantly for your entire team.' },
];

const stats = [
  { icon: Film, value: '24+', label: 'Production Modules' },
  { icon: Users, value: '100+', label: 'Film Productions' },
  { icon: Globe, value: 'NPR 50Cr+', label: 'Budget Managed' },
  { icon: Star, value: '98%', label: 'User Satisfaction' },
];

export default function Landing() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* ── Navbar ───────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 md:h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="bg-amber-500 text-slate-950 p-1.5 md:p-2 rounded-lg">
                <Film className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <span className="text-base md:text-lg font-bold text-slate-100 truncate">Nepal Film OS</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <button onClick={scrollToFeatures} className="text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">Features</button>
              <Link to="/login" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg transition-all text-sm flex items-center gap-2">
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </Link>
            </div>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1.5 rounded hover:bg-slate-800 text-slate-400">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-3">
            <button onClick={scrollToFeatures} className="block w-full text-left text-sm text-slate-400 hover:text-slate-200 py-2 cursor-pointer">Features</button>
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition-all text-sm">
              <LogIn className="h-4 w-4" /> Sign In
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-28 md:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-5 md:mb-6">
              <Star className="h-3 w-3 fill-amber-400" />
              <span>Complete Film Production Management</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-100 leading-tight mb-5 md:mb-6">
              Your Film's{' '}
              <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                Command Center
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-2">
              From script to screen — manage your entire film production workflow.
              Schedule shoots, track budgets, coordinate cast & crew, and bring your cinematic vision to life.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
              <Link to="/login"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 md:px-8 py-3 md:py-3.5 rounded-xl transition-all text-sm md:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                Get Started <ChevronRight className="h-4 w-4" />
              </Link>
              <button onClick={scrollToFeatures}
                className="w-full sm:w-auto text-slate-400 hover:text-slate-200 font-medium px-6 md:px-8 py-3 md:py-3.5 rounded-xl border border-slate-700 hover:border-slate-600 transition-all text-sm md:text-base cursor-pointer">
                Explore Features
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────── */}
      <section className="border-y border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center py-2">
                  <Icon className="h-4 w-4 md:h-5 md:w-5 text-amber-500 mx-auto mb-1.5" />
                  <p className="text-xl md:text-2xl font-bold text-slate-100">{stat.value}</p>
                  <p className="text-xs md:text-sm text-slate-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section id="features" className="py-16 md:py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-100 mb-3 md:mb-4">
              Everything You Need to{' '}
              <span className="text-amber-400">Produce</span>
            </h2>
            <p className="text-sm md:text-lg text-slate-400 max-w-2xl mx-auto px-4">
              24+ integrated modules covering every phase of film production — from pre-production to post.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Link key={i} to={`/features/${f.slug}`}
                  className="group relative bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 md:p-5 hover:border-amber-500/30 hover:bg-slate-900/80 transition-all duration-300">
                  <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg ${f.bg} flex items-center justify-center mb-3 md:mb-4`}>
                    <Icon className={`h-4 w-4 md:h-5 md:w-5 ${f.color}`} />
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-slate-200 group-hover:text-amber-400 transition-colors mb-1.5 md:mb-2">
                    {f.name}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed line-clamp-2 md:line-clamp-3">{f.desc}</p>
                  <span className="inline-flex items-center gap-1 mt-2 md:mt-3 text-xs text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-16 md:py-20 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-6 sm:p-8 md:p-14">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-100 mb-3 md:mb-4">
              Ready to Streamline Your Production?
            </h2>
            <p className="text-sm md:text-base text-slate-400 mb-6 md:mb-8 max-w-lg mx-auto px-2">
              Join Nepal's premier film production management platform. Start organizing your film today.
            </p>
            <Link to="/login"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 md:px-8 py-3 md:py-3.5 rounded-xl transition-all text-sm md:text-base shadow-lg shadow-amber-500/20">
              Get Started Free <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-300">Nepal Film OS</span>
            </div>
            <p className="text-xs text-slate-600 text-center">&copy; {new Date().getFullYear()} Nepal Film OS. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Smartphone className="h-4 w-4 text-slate-600" />
              <Cloud className="h-4 w-4 text-slate-600" />
              <Shield className="h-4 w-4 text-slate-600" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
