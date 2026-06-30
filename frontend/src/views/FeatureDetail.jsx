import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Film, Calendar, Users, DollarSign, Clipboard, Activity,
  MapPin, CheckSquare, FileText, MessageSquare, Bell, Clock, Layers,
  BarChart3, Camera, ToggleLeft, Image, Building2, LogIn, Star,
  ChevronLeft, ChevronRight, ArrowRight, Check, Shield
} from 'lucide-react';

const features = [
  { slug: 'shooting-schedule', icon: Calendar, name: 'Shooting Schedule', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', gradient: 'from-blue-500/10',
    desc: 'Plan and manage your entire production timeline with drag-and-drop scheduling, scene assignments, and real-time updates.',
    long: 'Our Shooting Schedule module gives you a complete overview of your production timeline. Drag-and-drop scenes onto shoot days, assign cast and crew, manage call times and wrap times, and track the status of each shoot day.',
    benefits: ['Drag-and-drop scene scheduling across shoot days', 'Automatic conflict detection for cast, crew, and locations', 'Real-time status tracking (Scheduled, In Progress, Completed)', 'Export to PDF for physical distribution', 'Integrated weather data and location information', 'Call time and wrap time management per shoot day'],
    capabilities: ['Scene-to-schedule assignment with order indexing', 'Multi-camera and unit scheduling support', 'Overnight and extended shoot day handling', 'Schedule version comparison and change logs', 'Bulk scene reassignment across days', 'Automatic Day Out of Days generation'] },
  { slug: 'script-writing', icon: FileText, name: 'Script Writing', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', gradient: 'from-purple-500/10',
    desc: 'Write and edit screenplays with our built-in script editor. Supports Fountain syntax, revisions, and version control.',
    long: 'A full-featured script writing environment that supports Fountain markdown syntax, automatic scene numbering, revision tracking, and version control.',
    benefits: ['Full Fountain syntax support with live preview', 'Automatic scene numbering and page count', 'Revision tracking with color-coded changes', 'Export to PDF, Final Draft, and Fountain formats', 'Real-time collaboration with writing team', 'Version history with one-click restore'],
    capabilities: ['Dual-pane editor (source + preview)', 'Character and location autocomplete', 'Script notes and annotations', 'Margin and A4 sizing compliance', 'Title page editor', 'Watermark support for drafts'] },
  { slug: 'script-breakdown', icon: Camera, name: 'Script Breakdown', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', gradient: 'from-pink-500/10',
    desc: 'Break down scripts into scenes, elements, and requirements. Generate reports for cast, props, wardrobe and more.',
    long: 'Automatically parse your script into individual scene elements. Tag cast, props, wardrobe, vehicles, special effects, and more.',
    benefits: ['Automated scene-by-scene breakdown parsing', 'Element tagging (cast, props, wardrobe, vehicles, SFX)', 'Color-coded stripboard view', 'Comprehensive breakdown reports by category', 'Budget estimation based on breakdown elements', 'Export breakdown to Excel or PDF'],
    capabilities: ['Custom element categories and tags', 'Per-scene element count and summaries', 'Breakdown comparison between script versions', 'Department-specific breakdown views', 'Prop and wardrobe shopping lists', 'Cast size and background count tracking'] },
  { slug: 'shot-list', icon: Image, name: 'Shot List', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', gradient: 'from-rose-500/10',
    desc: 'Create detailed shot lists for each scene with camera angles, lens specifications, and storyboard references.',
    long: 'Plan every shot of your film with precision. Define camera angles, lens choices, camera movement, and framing for each scene.',
    benefits: ['Per-scene shot planning with order indexing', 'Camera angle, lens, and movement specifications', 'Link shots to storyboard panels', 'Assign shots to specific camera operators', 'Shot status tracking (Prep, Ready, Complete)', 'Export shot list to PDF for crew distribution'],
    capabilities: ['Shot type classification (wide, medium, close-up, etc.)', 'Camera rig and support equipment tracking', 'Lens and filter specifications', 'Duration estimation per shot', 'Reshoot and pickup shot marking', 'Daily shot progress tracking'] },
  { slug: 'storyboard', icon: Image, name: 'Storyboard', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', gradient: 'from-orange-500/10',
    desc: 'Create visual storyboards to pre-visualize your scenes. Upload reference images and arrange them in sequence.',
    long: 'Visualize your scenes before you shoot. Upload hand-drawn storyboards, create digital boards, or import from storyboard software.',
    benefits: ['Upload and arrange storyboard panels in sequence', 'Add notes, camera directions, and dialogue', 'Link panels to specific shots and scenes', 'Share storyboards with department heads', 'Side-by-side comparison with final footage', 'Export storyboard PDF for production binders'],
    capabilities: ['Panel-by-panel annotation system', 'Camera movement arrows and diagrams', 'Color script and mood board integration', 'Storyboard revision tracking', 'Multi-user storyboard collaboration', 'Import from popular storyboard tools'] },
  { slug: 'production-calendar', icon: Calendar, name: 'Production Calendar', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', gradient: 'from-cyan-500/10',
    desc: 'View your entire production schedule on a calendar. Track milestones, shoot days, and important deadlines.',
    long: 'A comprehensive calendar view of your entire production. See shoot days, pre-production milestones, and deadlines at a glance.',
    benefits: ['Month/week/day calendar views', 'Color-coded by department or status', 'Milestone tracking (first day, wrap date, etc.)', 'Shoot day weather forecasts', 'Crew availability overlay', 'Export calendar to Google Calendar or iCal'],
    capabilities: ['Custom event and milestone creation', 'Recurring event support', 'Conflict detection across bookings', 'Calendar sharing with external stakeholders', 'Print-friendly calendar views', 'Mobile calendar sync'] },
  { slug: 'cast-crew', icon: Users, name: 'Cast & Crew', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', gradient: 'from-emerald-500/10',
    desc: 'Manage your entire team — from lead actors to support crew. Track contracts, day rates, and availability.',
    long: 'Complete cast and crew management including contacts, contracts, day rates, availability calendars, and department assignments.',
    benefits: ['Comprehensive contact and profile management', 'Contract tracking with status (Signed, Pending, Negotiating)', 'Day rate and payment schedule management', 'Availability calendar per individual', 'Department and role organization', 'Audition and callback tracking'],
    capabilities: ['Headshot and portfolio uploads', 'Union membership and guild tracking', 'Emergency contact and medical info', 'Travel and accommodation preferences', 'Payroll report generation', 'Contract document storage with expiry alerts'] },
  { slug: 'locations', icon: MapPin, name: 'Locations', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20', gradient: 'from-teal-500/10',
    desc: 'Catalog shooting locations with GPS coordinates, permit status, contact info, parking details, and facility notes.',
    long: 'A searchable database of all your shooting locations with GPS, permits, contacts, logistics, and facility information.',
    benefits: ['GPS coordinates with map integration', 'Permit status tracking with expiry alerts', 'Location contact and owner information', 'Parking logistics and capacity details', 'Power and facility availability notes', 'Photo gallery for each location'],
    capabilities: ['Location scouting checklist and notes', 'Weather history and forecast for locations', 'Distance and travel time calculator', 'Location fee and budget tracking', 'Nearby hospital and emergency services', 'Location contract and agreement storage'] },
  { slug: 'budget-expenses', icon: DollarSign, name: 'Budget & Expenses', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', gradient: 'from-green-500/10',
    desc: 'Track every rupee with department-level budgets, expense approvals, payment status, and real-time spending insights.',
    long: 'Real-time budget tracking across all departments with approval workflows, receipt capture, and comprehensive reports.',
    benefits: ['Department-level budget allocation', 'Real-time expense logging with receipt capture', 'Approval workflows for high-value expenses', 'Payment status tracking (Pending, Approved, Paid)', 'Budget vs actual spending comparisons', 'Spending alerts when thresholds are exceeded'],
    capabilities: ['Multi-currency support (NPR, USD, etc.)', 'Recurring expense templates', 'Vendor payment tracking', 'Budget revision history', 'Cash flow forecasting', 'Export to accounting software'] },
  { slug: 'vendors', icon: Building2, name: 'Vendors', color: 'text-lime-400', bg: 'bg-lime-500/10', border: 'border-lime-500/20', gradient: 'from-lime-500/10',
    desc: 'Manage your vendors and suppliers. Store contact details, service agreements, payment terms, and past orders.',
    long: 'A centralized vendor directory for all your production suppliers with contracts, rate cards, and order history.',
    benefits: ['Vendor directory with full contact details', 'Service agreements and contract management', 'Rate cards and price comparison', 'Purchase order generation and tracking', 'Order history and vendor performance ratings', 'Payment terms and invoice tracking'],
    capabilities: ['Vendor categorization by service type', 'Quote request and comparison tools', 'Vendor insurance and certification tracking', 'Automatic vendor reminder for renewals', 'Vendor communication history log', 'Preferred vendor tagging'] },
  { slug: 'call-sheets', icon: Clipboard, name: 'Call Sheets', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', gradient: 'from-amber-500/10',
    desc: 'Generate and distribute daily call sheets. Crew acknowledgments, weather reports, and emergency info all in one place.',
    long: 'Create professional call sheets in minutes with automated crew schedules, scene details, and distribution.',
    benefits: ['Auto-populated crew call times from schedules', 'Scene-by-scene breakdown for the day', 'Weather forecast integration', 'Emergency contact and medical info section', 'Catering and craft services details', 'One-click distribution via email and in-app'],
    capabilities: ['Call sheet template customization', 'Crew acknowledgment tracking', 'PDF export for printing', 'Call sheet version history', 'Notes and special instructions per day', 'Mobile-friendly call sheet viewing'] },
  { slug: 'progress', icon: Activity, name: 'Progress Tracking', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', gradient: 'from-yellow-500/10',
    desc: 'Track scene completion status in real time. Know exactly what\'s been shot, what\'s pending, and what\'s behind schedule.',
    long: 'Real-time progress tracking across all scenes and shoot days with comprehensive status reporting.',
    benefits: ['Per-scene completion status tracking', 'Page count tracking (completed vs remaining)', 'Daily progress log with notes', 'Progress by department and location views', 'Schedule adherence percentage', 'Visual progress dashboards'],
    capabilities: ['Progress photo and video capture', 'Bulk status updates for multiple scenes', 'Progress report generation for investors', 'Delay and issue logging', 'Catch-up schedule recommendations', 'Historical progress comparison across films'] },
  { slug: 'tasks', icon: CheckSquare, name: 'Tasks', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', gradient: 'from-indigo-500/10',
    desc: 'Assign and track production tasks with priorities, due dates, and status updates. Keep everyone accountable.',
    long: 'A production-ready task management system with assignments, priorities, due dates, and progress tracking.',
    benefits: ['Task creation with assignee and due dates', 'Priority levels (Low, Medium, High, Critical)', 'Checklist support within tasks', 'Filter by department, assignee, or status', 'Task dependencies and blocking relationships', 'Completion notifications and reminders'],
    capabilities: ['Recurring task templates', 'Task comments and file attachments', 'Kanban board view for task management', 'Task load balancing across team members', 'Overdue task alerts', 'Task completion reports'] },
  { slug: 'timesheets', icon: Clock, name: 'Time Sheets', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', gradient: 'from-violet-500/10',
    desc: 'Track crew work hours with digital time sheets. Submit, approve, and export for payroll processing.',
    long: 'Digital time tracking for all crew members with clock in/out, approval workflows, and payroll export.',
    benefits: ['Mobile clock in/out with GPS verification', 'Weekly timesheet submission', 'Manager approval with notes', 'Automatic overtime calculation', 'Export to payroll systems', 'Audit trail for all time entries'],
    capabilities: ['Multiple shift support per day', 'Break time tracking', 'Project and task time allocation', 'Time off and leave requests', 'Crew cost tracking per shoot day', 'Custom pay rate support'] },
  { slug: 'dpr', icon: BarChart3, name: 'Daily Production Report', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20', gradient: 'from-fuchsia-500/10',
    desc: 'Generate comprehensive DPRs with shot counts, page counts, crew hours, and daily notes for production records.',
    long: 'Auto-populated Daily Production Reports that compile all production data into professional reports.',
    benefits: ['Auto-populated from schedule and progress data', 'Shot count and page count tracking', 'Crew hours and meal counts', 'Weather and conditions logging', 'Production notes and incident reports', 'PDF export and digital archive'],
    capabilities: ['DPR template customization', 'Photo attachment support', 'Department head sign-off workflow', 'DPR comparison across shoot days', 'Approval workflow for producers', 'Searchable DPR archive'] },
  { slug: 'documents', icon: Layers, name: 'Document Library', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', gradient: 'from-sky-500/10',
    desc: 'Centralized document storage for scripts, contracts, permits, and reports. Version control and role-based access.',
    long: 'A secure, organized document repository for all your production files with version control and access management.',
    benefits: ['Centralized file storage with folder organization', 'Version control with change tracking', 'Role-based access permissions', 'Full-text search across all documents', 'Preview for common file types (PDF, Word, images)', 'Secure sharing with external links'],
    capabilities: ['Drag-and-drop file upload', 'Document categories and tags', 'File size and type restrictions', 'Download and view tracking', 'Document expiry and renewal reminders', 'Integration with cloud storage services'] },
  { slug: 'messaging', icon: MessageSquare, name: 'Messaging', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', gradient: 'from-blue-500/10',
    desc: 'In-app messaging system for cast and crew. Send updates, share files, and keep communication organized by film.',
    long: 'Built-in messaging for your entire production team with groups, file sharing, and organized conversations.',
    benefits: ['Direct and group messaging', 'File and image sharing', 'Message search and history', 'Push notifications for urgent messages', 'Read receipts and delivery status', 'Conversation threading'],
    capabilities: ['Department and role-based groups', 'Pinned messages and announcements', 'Message reactions and replies', 'Forwarding and sharing messages', 'Message archive and export', 'Do not disturb scheduling'] },
  { slug: 'wardrobe', icon: Layers, name: 'Wardrobe', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', gradient: 'from-pink-500/10',
    desc: 'Manage costumes and wardrobe items per character. Track fittings, alterations, and scene assignments.',
    long: 'Complete wardrobe management for every character with costume cataloging, fitting tracking, and scene assignments.',
    benefits: ['Per-character costume catalog', 'Fitting scheduling and notes', 'Alteration tracking with timeline', 'Scene-specific wardrobe assignments', 'Quick change planning', 'Reference photo storage'],
    capabilities: ['Costume piece inventory tracking', 'Size and measurement records', 'Wardrobe condition and maintenance', 'Laundry and cleaning schedule', 'Budget tracking per costume', 'Rental vs purchased item tracking'] },
  { slug: 'continuity', icon: Activity, name: 'Continuity', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', gradient: 'from-rose-500/10',
    desc: 'Log continuity details — makeup, props, set dressings. Ensure every scene matches perfectly across takes.',
    long: 'Meticulous continuity tracking for every scene covering makeup, props, set dressing, and wardrobe.',
    benefits: ['Per-scene continuity logging', 'Makeup and hair reference photos', 'Prop position and movement tracking', 'Set dressing documentation', 'Take-by-take comparison', 'Continuity error flagging'],
    capabilities: ['Photo and video continuity capture', 'Color palette and mood reference', 'Weather and time-of-day continuity', 'Dialogue and action continuity notes', 'Continuity reports for editing team', 'Cross-scene consistency checks'] },
  { slug: 'series', icon: Film, name: 'Series Management', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', gradient: 'from-amber-500/10',
    desc: 'Manage multi-film series with shared cast, crew, and continuity across productions in the same franchise.',
    long: 'Manage interconnected film productions within a series or franchise with shared resources and consistent continuity.',
    benefits: ['Multi-film series workspace management', 'Shared cast and crew across films', 'Cross-film continuity tracking', 'Series-level budget and schedule oversight', 'Unified analytics across all films', 'Shared document and resource library'],
    capabilities: ['Film ordering and chronology management', 'Series milestone and release planning', 'Cross-film character and storyline tracking', 'Series marketing and promotion management', 'Fan and community engagement tools', 'Series performance analytics'] },
  { slug: 'day-out-of-days', icon: Calendar, name: 'Day Out of Days', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', gradient: 'from-orange-500/10',
    desc: 'Track cast and crew availability across the production schedule. Avoid scheduling conflicts and overtime issues.',
    long: 'Industry-standard Day Out of Days tracking for all cast and crew with visual calendars and compliance reporting.',
    benefits: ['Visual DOOD calendar per individual', 'Work day, hold day, and travel day tracking', 'Overtime and violation alerts', 'Guild compliance reporting', 'Availability conflict detection', 'Export to industry-standard DOOD format'],
    capabilities: ['Week-based and day-based views', 'Multi-production conflict checking', 'Per-contract DOOD tracking', 'Rest period and turnaround enforcement', 'Automated DOOD report generation', 'Historical DOOD data retention'] },
  { slug: 'reports-analytics', icon: BarChart3, name: 'Reports & Analytics', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', gradient: 'from-emerald-500/10',
    desc: 'Comprehensive production reports and analytics dashboards. Budget trends, progress forecasts, and performance metrics.',
    long: 'Powerful analytics and reporting for producers and investors with interactive dashboards and custom reports.',
    benefits: ['Budget burn rate and trend charts', 'Progress forecasting with AI predictions', 'Schedule adherence and variance reports', 'Crew productivity and cost metrics', 'Custom report builder with drag-and-drop', 'Export to PDF, Excel, and CSV formats'],
    capabilities: ['Interactive dashboard with filters', 'Comparative analysis across films', 'ROI and cost-per-scene metrics', 'Resource utilization heatmaps', 'Automated scheduled report delivery', 'Data visualization library'] },
  { slug: 'news', icon: Bell, name: 'News Feed', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', gradient: 'from-yellow-500/10',
    desc: 'Stay updated with industry news, film releases, and production announcements from the Nepal film community.',
    long: 'A curated news feed for the Nepal film industry with updates, events, and community announcements.',
    benefits: ['Curated Nepal film industry news feed', 'Film release and premiere announcements', 'Industry event calendar and updates', 'Policy and regulation change alerts', 'Share and discuss news with team', 'Personalized news preferences'],
    capabilities: ['News categories and filtering', 'Bookmark and save for later', 'Related news recommendations', 'Community comment and discussion', 'Newsletter subscription', 'RSS feed integration'] },
  { slug: 'module-management', icon: ToggleLeft, name: 'Module Management', color: 'text-lime-400', bg: 'bg-lime-500/10', border: 'border-lime-500/20', gradient: 'from-lime-500/10',
    desc: 'Toggle features on or off per production. Customize your workspace with only the tools you need for each film.',
    long: 'Flexible module system that lets you customize your workspace by enabling or disabling features based on your production\'s needs.',
    benefits: ['Per-film module enable/disable control', 'Custom workspace for each production', 'Instant changes that apply to whole team', 'Simple toggle interface for producers', 'Module recommendations based on film type', 'Granular permission settings per module'],
    capabilities: ['Module dependency management', 'Role-based module access control', 'Module usage analytics', 'Module update and changelog tracking', 'Default module presets by film type', 'Module request and suggestion system'] },
];

export default function FeatureDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const feature = features.find(f => f.slug === slug);

  if (!feature) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Film className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-300 mb-2">Feature Not Found</h2>
          <p className="text-slate-500 mb-6">The feature you're looking for doesn't exist.</p>
          <Link to="/#features" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition-all text-sm">
            <ChevronLeft className="h-4 w-4" /> Back to Features
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = features.findIndex(f => f.slug === slug);
  const prevFeature = currentIndex > 0 ? features[currentIndex - 1] : null;
  const nextFeature = currentIndex < features.length - 1 ? features[currentIndex + 1] : null;

  const Icon = feature.icon;

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
              <Link to="/#features" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">All Features</Link>
              <Link to="/login" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg transition-all text-sm flex items-center gap-2">
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </Link>
            </div>

            <Link to="/login" className="md:hidden bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg transition-all text-xs flex items-center gap-1.5">
              <LogIn className="h-3.5 w-3.5" /> Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Breadcrumb ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 pb-2 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-amber-400 transition-colors">Home</Link>
          <span className="text-slate-700">/</span>
          <Link to="/#features" className="hover:text-amber-400 transition-colors">Features</Link>
          <span className="text-slate-700">/</span>
          <span className="text-amber-400 font-medium">{feature.name}</span>
        </div>
      </div>

      {/* ── Hero Section ──────────────────────────────── */}
      <section className={`relative overflow-hidden bg-gradient-to-b ${feature.gradient} to-transparent`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 lg:py-20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 md:gap-10">
            <div className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl ${feature.bg} border ${feature.border} flex items-center justify-center shrink-0`}>
              <Icon className={`h-7 w-7 md:h-10 md:w-10 ${feature.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-100">{feature.name}</h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${feature.bg} ${feature.color} border ${feature.border}`}>Module</span>
              </div>
              <p className="text-sm md:text-base lg:text-lg text-slate-400 max-w-3xl leading-relaxed">{feature.long}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────── */}
      <section className="py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-100 mb-4 md:mb-6 flex items-center gap-2">
                <Check className={`h-4 w-4 md:h-5 md:w-5 ${feature.color}`} />
                Key Benefits
              </h2>
              <ul className="space-y-3 md:space-y-4">
                {feature.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full ${feature.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Check className={`h-3 w-3 md:h-3.5 md:w-3.5 ${feature.color}`} />
                    </div>
                    <span className="text-sm md:text-base text-slate-300 leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-100 mb-4 md:mb-6 flex items-center gap-2">
                <Shield className={`h-4 w-4 md:h-5 md:w-5 ${feature.color}`} />
                Capabilities
              </h2>
              <ul className="space-y-3 md:space-y-4">
                {feature.capabilities.map((c, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowRight className="h-2.5 w-2.5 md:h-3 md:w-3 text-slate-500" />
                    </div>
                    <span className="text-sm md:text-base text-slate-300 leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-10 md:py-16 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-6 sm:p-8 md:p-12">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-100 mb-3 md:mb-4">
              Ready to Use <span className="text-amber-400">{feature.name}</span>?
            </h2>
            <p className="text-sm md:text-base text-slate-400 mb-6 md:mb-8 max-w-lg mx-auto">
              Start streamlining your film production workflow today.
            </p>
            <Link to="/login"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 md:px-8 py-3 md:py-3.5 rounded-xl transition-all text-sm md:text-base shadow-lg shadow-amber-500/20">
              Get Started Free <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Prev / Next Navigation ───────────────────── */}
      <section className="pb-10 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {prevFeature ? (
              <Link to={`/features/${prevFeature.slug}`}
                className="group flex items-center gap-3 md:gap-4 bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 md:p-5 hover:border-slate-700/50 transition-all">
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-slate-600 group-hover:text-amber-400 transition-colors shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 mb-0.5">Previous</p>
                  <p className="text-sm font-medium text-slate-300 group-hover:text-amber-400 transition-colors truncate">{prevFeature.name}</p>
                </div>
              </Link>
            ) : <div />}
            {nextFeature && (
              <Link to={`/features/${nextFeature.slug}`}
                className="group flex items-center justify-end gap-3 md:gap-4 bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 md:p-5 hover:border-slate-700/50 transition-all text-right">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 mb-0.5">Next</p>
                  <p className="text-sm font-medium text-slate-300 group-hover:text-amber-400 transition-colors truncate">{nextFeature.name}</p>
                </div>
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-slate-600 group-hover:text-amber-400 transition-colors shrink-0" />
              </Link>
            )}
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
          </div>
        </div>
      </footer>
    </div>
  );
}
