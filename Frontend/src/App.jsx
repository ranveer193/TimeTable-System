import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login               from './pages/Login';
import AwaitingApproval    from './pages/AwaitingApproval';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard      from './pages/AdminDashboard';
import TimetableView       from './pages/TimeTableView';
import PublicTimetableView from './pages/PublicTimetableView'; // ← NEW

const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'SUPER_ADMIN' ? <SuperAdminDashboard /> : <AdminDashboard />;
};

function App() {
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/health`).catch(() => {
      console.log('Backend wake-up ping failed (probably sleeping)');
    });
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { background: '#1e293b', color: '#f8fafc' },
            success: {
              duration: 3500,
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              duration: 4500,
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login"             element={<Login />} />
          <Route path="/awaiting-approval" element={<AwaitingApproval />} />
          <Route path="/public/:token"     element={<PublicTimetableView />} /> {/* ← NEW */}

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout><DashboardRouter /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable/:id"
            element={
              <ProtectedRoute>
                <Layout><TimetableView /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;