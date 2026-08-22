import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import StudentDashboard from './pages/StudentDashboard';
import AIClassroom from './pages/AIClassroom';
import CognitiveTwinDashboard from './pages/CognitiveTwinDashboard';
import AIReasoningCenter from './pages/AIReasoningCenter';
import Profile from './pages/Profile';

// Dashboard layout wrapping authenticated pages with Sidebar
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
      {/* Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Main Cockpit Hub Layout */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/classroom" element={<AIClassroom />} />
        <Route path="/twin" element={<CognitiveTwinDashboard />} />
        <Route path="/reasoning" element={<AIReasoningCenter />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
