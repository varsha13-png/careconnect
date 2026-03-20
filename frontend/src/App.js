import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import NeedsPage from './pages/NeedsPage';
import MembersPage from './pages/MembersPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';
import WorkersPage from './pages/WorkersPage';
import CareWorkerDashboard from './pages/CareWorkerDashboard';
import DonorProfilePage from './pages/DonorProfilePage';
import DonorHomePage from './pages/DonorHomePage';
import NeedsFeedPage from './pages/NeedsFeedPage';
import DonatePage from './pages/DonatePage';
import SettingsPage from './pages/SettingsPage';
import CareWorkerProfile from './pages/CareWorkerProfile';
import GovtDashboard from './pages/GovtDashboard';

// Protected route — redirects to login if not authenticated
const Protected = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #f0f0f0', borderTopColor: '#D4537E', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'donor') return <Navigate to="/browse" />;
    if (user.role === 'authority') return <Navigate to="/dashboard" />;
    if (user.role === 'care_worker') return <Navigate to="/alerts" />;
    if (user.role === 'govt_official') return <Navigate to="/govt" />;
    return <Navigate to="/login" />;
  }
  return children;
};

// Root redirect based on role
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'authority') return <Navigate to="/dashboard" />;
  if (user.role === 'care_worker') return <Navigate to="/alerts" />;
  if (user.role === 'donor') return <Navigate to="/browse" />;
  if (user.role === 'govt_official') return <Navigate to="/govt" />;
  return <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Dashboard - feed page for everyone */}
      <Route path="/dashboard" element={
        <Protected>
          <DashboardPage />
        </Protected>
      } />
      <Route path="/alerts" element={
        <Protected allowedRoles={['authority', 'care_worker']}>
          <AlertsPage />
        </Protected>
      } />
      <Route path="/needs" element={
        <Protected allowedRoles={['authority']}>
          <NeedsPage />
        </Protected>
      } />

      <Route path="/donor-profile" element={
        <Protected allowedRoles={['donor']}>
          <DonorProfilePage />
        </Protected>
      } />

      <Route path="/govt" element={
        <Protected allowedRoles={['govt_official']}>
          <GovtDashboard />
        </Protected>
      } />

      <Route path="/care-worker-profile" element={
        <Protected allowedRoles={['care_worker']}>
          <CareWorkerProfile />
        </Protected>
      } />

      <Route path="/care-worker" element={
        <Protected allowedRoles={['care_worker']}>
          <CareWorkerDashboard />
        </Protected>
      } />

      <Route path="/workers/invite" element={
        <Protected allowedRoles={['authority']}>
          <WorkersPage />
        </Protected>
      } />
      <Route path="/workers" element={
        <Protected allowedRoles={['authority']}>
          <WorkersPage />
        </Protected>
      } />

      <Route path="/reports" element={
        <Protected allowedRoles={['authority']}>
          <ReportsPage />
        </Protected>
      } />

      <Route path="/profile" element={
        <Protected allowedRoles={['authority', 'care_worker']}>
          <ProfilePage />
        </Protected>
      } />

      <Route path="/feed" element={
        <Protected>
          <FeedPage />
        </Protected>
      } />

      <Route path="/members" element={
        <Protected allowedRoles={['authority', 'care_worker']}>
          <MembersPage />
        </Protected>
      } />

      <Route path="/settings" element={
        <Protected allowedRoles={['authority', 'care_worker']}>
          <SettingsPage />
        </Protected>
      } />

      <Route path="/donate" element={
        <Protected allowedRoles={['donor']}>
          <DonatePage />
        </Protected>
      } />

      {/* Donor routes */}
      <Route path="/browse" element={
        <Protected allowedRoles={['donor']}>
          <DonorHomePage />
        </Protected>
      } />
      <Route path="/needs-feed" element={
        <Protected allowedRoles={['donor']}>
          <NeedsFeedPage />
        </Protected>
      } />
      <Route path="/donor-profile" element={
        <Protected allowedRoles={['donor']}>
          <DonorProfilePage />
        </Protected>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '13px',
              borderRadius: '10px',
              background: '#fff',
              color: '#212121',
              border: '0.5px solid #f0f0f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            },
            success: { iconTheme: { primary: '#1D9E75', secondary: '#fff' } },
            error: { iconTheme: { primary: '#E24B4A', secondary: '#fff' } }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}