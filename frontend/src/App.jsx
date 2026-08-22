import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import AuthCallback from './pages/AuthCallback';
import StudentDashboard from './pages/StudentDashboard';
import AIClassroom from './pages/AIClassroom';
import Profile from './pages/Profile';

const DashboardLayout = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
      <Sidebar />
      <div style={{ 
        flex: 1, 
        marginLeft: '272px',
        minHeight: '100vh',
        background: '#ffffff',
        color: '#0f172a',
        overflowY: 'auto'
      }}>
        <Outlet />
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/classroom" element={<AIClassroom />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

