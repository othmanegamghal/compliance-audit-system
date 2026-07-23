import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { canView } from '../auth/permissions';

// Pages imports
import { Login } from '../pages/auth/Login';
import { SignUp } from '../pages/auth/SignUp';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { UserList } from '../pages/users/UserList';
import { DepartmentList } from '../pages/departments/DepartmentList';
import { TemplateList } from '../pages/templates/TemplateList';
import { AuditList } from '../pages/audits/AuditList';
import { AuditDetails } from '../pages/audits/AuditDetails';
import { AuditExecution } from '../pages/execution/AuditExecution';
import { NonConformityList } from '../pages/findings/NonConformityList';
import { CorrectiveActions } from '../pages/actions/CorrectiveActions';
import { ReportsList } from '../pages/reports/ReportsList';
import { Settings } from '../pages/settings/Settings';
import { ProjectList } from '../pages/projects/ProjectList';
import { RiskList } from '../pages/risks/RiskList';
import { DocumentList } from '../pages/documents/DocumentList';
import { HistoryList } from '../pages/history/HistoryList';

// Full-screen loader shown while the session is being restored.
const SessionLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkbg">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

// Protected Route wrapper component (also enforces role-based access by URL).
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SessionLoader />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Block direct URL access to routes the role is not allowed to view.
  if (!canView(currentUser.role, location.pathname)) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center bg-white dark:bg-darkbg-card rounded-2xl border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Accès non autorisé</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Votre rôle ne permet pas d'accéder à cette page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Auth Route wrapper (redirect to dashboard if already authenticated)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <SessionLoader />;
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <AuthLayout>{children}</AuthLayout>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Authentication Pages */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <AuthRoute>
            <SignUp />
          </AuthRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <AuthRoute>
            <ForgotPassword />
          </AuthRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <AuthRoute>
            <ResetPassword />
          </AuthRoute>
        }
      />

      {/* Core Dashboards & Operational Pages */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audits"
        element={
          <ProtectedRoute>
            <AuditList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audits/:id"
        element={
          <ProtectedRoute>
            <AuditDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audits/:id/execute"
        element={
          <ProtectedRoute>
            <AuditExecution />
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ProtectedRoute>
            <TemplateList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/findings"
        element={
          <ProtectedRoute>
            <NonConformityList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/actions"
        element={
          <ProtectedRoute>
            <CorrectiveActions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UserList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <DepartmentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/risks"
        element={
          <ProtectedRoute>
            <RiskList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <DocumentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
