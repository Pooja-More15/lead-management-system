import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeadsList from './pages/LeadsList';
import CreateLead from './pages/CreateLead';
import EditLead from './pages/EditLead';
import LeadDetails from './pages/LeadDetails';
import UserManagement from './pages/UserManagement';
import ActivityLogs from './pages/ActivityLogs';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children, permission }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                {/* Protected Routes */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<ProtectedRoute permission="view_dashboard"><Dashboard /></ProtectedRoute>} />
                <Route path="/leads" element={<ProtectedRoute permission="view_assigned_leads"><LeadsList /></ProtectedRoute>} />
                <Route path="/leads/create" element={<ProtectedRoute permission="create_leads"><CreateLead /></ProtectedRoute>} />
                <Route path="/leads/:id" element={<ProtectedRoute permission="view_assigned_leads"><LeadDetails /></ProtectedRoute>} />
                <Route path="/leads/:id/edit" element={<ProtectedRoute permission="update_assigned_leads"><EditLead /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute permission="manage_users"><UserManagement /></ProtectedRoute>} />
                <Route path="/logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                {/* Error Fallback Routes */}
                <Route path="/unauthorized" element={<ProtectedRoute><Unauthorized /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
