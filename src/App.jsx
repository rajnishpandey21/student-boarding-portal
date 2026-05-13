import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from './context/SessionContext';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import AssociatePage from './pages/AssociatePage';
import QueuePage from './pages/QueuePage';
import SingleBoardingPage from './pages/SingleBoardingPage';
import BulkBoardingPage from './pages/BulkBoardingPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function ProtectedRoute({ children, requireAssociate = false, requireAdmin = false }) {
  const { sessionToken, associate, role } = useSession();

  if (!sessionToken) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  if (!requireAdmin && role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  if (requireAssociate && !associate?.associateId) {
    return <Navigate to="/associate" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/associate"
          element={
            <ProtectedRoute>
              <AssociatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queue"
          element={
            <ProtectedRoute requireAssociate>
              <QueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/:regno"
          element={
            <ProtectedRoute requireAssociate>
              <SingleBoardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bulk"
          element={
            <ProtectedRoute requireAssociate>
              <BulkBoardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireAssociate>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
