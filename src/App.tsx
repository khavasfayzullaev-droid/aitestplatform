import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/Auth';

import Landing from './pages/Landing';

function TeacherDashboard() {
  return <div className="p-10 font-bold text-2xl text-[#004B49]">Himoyalangan O'qituvchi Paneli (Dashboard)</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/*" element={<TeacherDashboard />} />
        </Route>

        {/* Student Route Placeholder (Public) */}
        <Route path="/t/:testId" element={<div className="p-10 font-bold text-2xl text-center">O'quvchi Test Oynasi Kutib Olish...</div>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
