import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { supabase } from './lib/supabase';

import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import StudentDashboard from './pages/StudentDashboard';
import AIClassroom from './pages/AIClassroom';
import Profile from './pages/Profile';

const DashboardLayout = () => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [checking, setChecking] = useState(!localStorage.getItem('token'));

  useEffect(() => {
    let isMounted = true;

    const processSession = (session) => {
      if (session?.access_token) {
        localStorage.setItem('token', session.access_token);
        const user = session.user;
        if (user) {
          localStorage.setItem(
            'user',
            JSON.stringify({
              id: user.id,
              email: user.email,
              full_name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split('@')[0] ||
                '',
            })
          );
        }
        if (isMounted) {
          setToken(session.access_token);
          setChecking(false);
        }
        return true;
      }
      return false;
    };

    // Check existing or URL OAuth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (processSession(session)) return;

      // Extract code if present
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data }) => {
          if (processSession(data?.session)) return;
          if (isMounted) setChecking(false);
        }).catch(() => {
          if (isMounted) setChecking(false);
        });
      } else {
        if (isMounted) setChecking(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (processSession(session)) {
        if (isMounted) setChecking(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (checking && !token) {
    return null;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
      <Sidebar />
      <div style={{ 
        flex: 1, 
        marginLeft: '260px',
        minHeight: '100vh',
        background: '#ffffff',
        color: '#111111',
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

