import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';

import Layout from './components/Layout';

import Landing from './views/Landing';
import FeatureDetail from './views/FeatureDetail';
import Login from './views/Login';
import Register from './views/Register';
import Dashboard from './views/Dashboard';
import ScheduleView from './views/ScheduleView';
import CastCrewView from './views/CastCrewView';
import BudgetExpensesView from './views/BudgetExpensesView';
import CallSheetsView from './views/CallSheetsView';
import ProgressView from './views/ProgressView';
import LocationsView from './views/LocationsView';
import ScriptBreakdownView from './views/ScriptBreakdownView';
import ShotListView from './views/ShotListView';
import TaskView from './views/TaskView';
import TimeSheetsView from './views/TimeSheetsView';
import DPRView from './views/DPRView';
import DocumentsView from './views/DocumentsView';
import MessagesView from './views/MessagesView';
import WardrobeView from './views/WardrobeView';
import ContinuityView from './views/ContinuityView';
import NewsFeedView from './views/NewsFeedView';
import NewsArticleReader from './views/NewsArticleReader';
import SeriesView from './views/SeriesView';
import SuperAdminView from './views/SuperAdminView';
import ModuleSettings from './views/ModuleSettings';
import ScriptEditor from './views/ScriptEditor';
import ProductionCalendar from './views/ProductionCalendar';
import StoryboardView from './views/StoryboardView';
import DayOutOfDaysView from './views/DayOutOfDaysView';
import ReportsHubView from './views/ReportsHubView';
import AnalyticsView from './views/AnalyticsView';
import VendorsView from './views/VendorsView';
import MediaLibraryView from './views/MediaLibraryView';

function AuthGuard({ children }) {
  const { token, user, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      fetchCurrentUser();
    }
  }, [token, user]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function GuestGuard({ children }) {
  const { token } = useAuthStore();

  if (token) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/features/:slug" element={<FeatureDetail />} />

        <Route
          path="/login"
          element={
            <GuestGuard>
              <Login />
            </GuestGuard>
          }
        />
        <Route
          path="/register"
          element={
            <GuestGuard>
              <Register />
            </GuestGuard>
          }
        />

        <Route
          path="/app"
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="schedule" element={<ScheduleView />} />
          <Route path="script-breakdown" element={<ScriptBreakdownView />} />
          <Route path="shot-list" element={<ShotListView />} />
          <Route path="cast-crew" element={<CastCrewView />} />
          <Route path="expenses" element={<BudgetExpensesView />} />
          <Route path="call-sheets" element={<CallSheetsView />} />
          <Route path="progress" element={<ProgressView />} />
          <Route path="locations" element={<LocationsView />} />
          <Route path="tasks" element={<TaskView />} />
          <Route path="timesheets" element={<TimeSheetsView />} />
          <Route path="dpr" element={<DPRView />} />
          <Route path="documents" element={<DocumentsView />} />
          <Route path="messages" element={<MessagesView />} />
          <Route path="wardrobe" element={<WardrobeView />} />
          <Route path="continuity" element={<ContinuityView />} />
          <Route path="news" element={<NewsFeedView />} />
          <Route path="news/:id" element={<NewsArticleReader />} />
          <Route path="series" element={<SeriesView />} />
          <Route path="admin" element={<SuperAdminView />} />
          <Route path="settings" element={<ModuleSettings />} />
          <Route path="scripts" element={<ScriptEditor />} />
          <Route path="production-calendar" element={<ProductionCalendar />} />
          <Route path="storyboard" element={<StoryboardView />} />
          <Route path="day-out-of-days" element={<DayOutOfDaysView />} />
          <Route path="reports" element={<ReportsHubView />} />
          <Route path="vendors" element={<VendorsView />} />
          <Route path="analytics" element={<AnalyticsView />} />
          <Route path="media" element={<MediaLibraryView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
