import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/Auth';

import Landing from './pages/Landing';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import Folders from './pages/dashboard/Folders';
import FolderView from './pages/dashboard/FolderView';
import TestResults from './pages/dashboard/TestResults';
import TestPlayer from './pages/student/TestPlayer';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />

        {/* Protected Routes (Teacher Dashboard) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="folders" element={<Folders />} />
            <Route path="folders/:id" element={<FolderView />} />
            <Route path="test/:testId/results" element={<TestResults />} />
          </Route>
        </Route>

        {/* Student Route Placeholder (Public) */}
        <Route path="/t/:id" element={<TestPlayer />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
