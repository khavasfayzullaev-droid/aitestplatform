import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/Auth';

import Landing from './pages/Landing';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import Folders from './pages/dashboard/Folders';
import FolderView from './pages/dashboard/FolderView';
import TestResults from './pages/dashboard/TestResults';
import MockExams from './pages/dashboard/MockExams';
import MockGrading from './pages/dashboard/MockGrading';
import TestPlayer from './pages/student/TestPlayer';
import MockPlayer from './pages/student/MockPlayer';

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
            <Route path="mock-exams" element={<MockExams />} />
            <Route path="mock-exams/:id/grading" element={<MockGrading />} />
          </Route>
        </Route>

        {/* Student Route (Public) */}
        <Route path="/t/:id" element={<TestPlayer />} />
        <Route path="/mock/:id" element={<MockPlayer />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
