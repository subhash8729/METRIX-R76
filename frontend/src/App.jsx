import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Instruments from './pages/Instruments';
import InstrumentDetail from './pages/InstrumentDetail';
import TestProjects from './pages/TestProjects';
import TestProjectDetail from './pages/TestProjectDetail';
import TestExecution from './pages/TestExecution';
import ReportRepository from './pages/ReportRepository';
import RuleManagement from './pages/RuleManagement';
import RuleSimulator from './pages/RuleSimulator';
import EquipmentManagement from './pages/EquipmentManagement';
import AuditLogs from './pages/AuditLogs';
import Login from './pages/Login';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="h-screen flex items-center justify-center text-xs text-slate-500">Checking session...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="instruments" element={<Instruments />} />
        <Route path="instruments/:id" element={<InstrumentDetail />} />
        <Route path="projects" element={<TestProjects />} />
        <Route path="projects/:id" element={<TestProjectDetail />} />
        <Route path="projects/:projectId/tests/:testInstanceId" element={<TestExecution />} />
        <Route path="reports" element={<ReportRepository />} />
        <Route path="rules" element={<RuleManagement />} />
        <Route path="rules/simulator" element={<RuleSimulator />} />
        <Route path="equipment" element={<EquipmentManagement />} />
        <Route path="audit" element={<AuditLogs />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
