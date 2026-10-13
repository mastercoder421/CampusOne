import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AttendanceFaculty from './pages/AttendanceFaculty';
import AttendanceStudent from './pages/AttendanceStudent';
import Assignments from './pages/Assignments';
import Events from './pages/Events';
import Grievances from './pages/Grievances';
import LostFound from './pages/LostFound';
import RoomBooking from './pages/RoomBooking';
import CampusAiChat from './pages/CampusAiChat';
import AcademicManagement from './pages/AcademicManagement';

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar setMobileOpen={setMobileOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated && !loading ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated && !loading ? <Navigate to="/" replace /> : <Register />}
      />

      {/* Protected App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/admin/onboarding"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AcademicManagement />
            </ProtectedRoute>
          }
        />

        {/* Attendance */}
        <Route
          path="/attendance/faculty"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <AttendanceFaculty />
            </ProtectedRoute>
          }
        />
        <Route path="/attendance/student" element={<AttendanceStudent />} />

        {/* Course Assignments */}
        <Route path="/assignments" element={<Assignments />} />

        {/* Campus Life */}
        <Route path="/events" element={<Events />} />
        <Route path="/grievances" element={<Grievances />} />
        <Route path="/complaints" element={<Navigate to="/grievances" replace />} />
        <Route path="/lost-found" element={<LostFound />} />
        <Route path="/room-booking" element={<RoomBooking />} />
        <Route path="/rooms" element={<Navigate to="/room-booking" replace />} />

        {/* CampusBot AI Chat */}
        <Route path="/ai-chat" element={<CampusAiChat />} />
        <Route path="/ai-assistant" element={<Navigate to="/ai-chat" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
