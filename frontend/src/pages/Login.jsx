import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ChevronRight, Bell, User, LayoutGrid, BookOpen, Brain, LineChart, RefreshCw, Settings, LogOut, Flame, AlertTriangle, TrendingUp } from 'lucide-react';

/* ─── Inline styles object (light / white theme matching design) ─── */

const S = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    background: '#ffffff',
    fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
    color: '#0f172a',
    overflowX: 'hidden',
  },

  /* ── LEFT PANEL ── */
  left: {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '48px 40px',
    background: '#ffffff',
    boxSizing: 'border-box',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    maxWidth: '380px',
  },
  brandLogo: { height: '34px', objectFit: 'contain' },
  brandName: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '22px',
    fontWeight: '800',
    color: '#1a56db',
    letterSpacing: '-0.02em',
  },

  formArea: { width: '100%', maxWidth: '380px' },
  h1: {
    fontSize: '30px',
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: '6px',
    letterSpacing: '-0.03em',
    fontFamily: "'Outfit', sans-serif",
  },
  subtitle: { 
    color: '#64748b', 
    fontSize: '14px', 
    fontWeight: '400', 
    marginBottom: '28px',
    fontFamily: "'Outfit', sans-serif",
  },

  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#ef4444',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  label: { 
    fontSize: '13px', 
    fontWeight: '600', 
    color: '#0f172a',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  forgotLink: { 
    fontSize: '13px', 
    fontWeight: '600', 
    color: '#1a56db', 
    textDecoration: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  input: {
    width: '100%',
    height: '46px',
    padding: '0 42px',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '14px',
    background: '#ffffff',
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  eyeBtn: {
    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
    background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8',
    display: 'flex', alignItems: 'center',
  },
  submitBtn: {
    background: '#1a56db',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    height: '48px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'background 0.2s',
    letterSpacing: '0.01em',
    fontFamily: "'Outfit', sans-serif",
  },
  divider: {
    display: 'flex', alignItems: 'center', margin: '18px 0',
    color: '#94a3b8', fontSize: '13px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  dividerLine: { flex: 1, height: '1px', background: '#e2e8f0' },
  googleBtn: {
    width: '100%', height: '46px',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    background: '#ffffff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    cursor: 'pointer', color: '#1a56db', fontWeight: '600', fontSize: '14px',
    transition: 'border-color 0.2s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  continueCard: {
    background: '#f8fafc',
    border: '1px solid #f1f5f9',
    borderRadius: '12px',
    padding: '14px 16px',
    marginTop: '24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  continueCardLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  continueIcon: {
    width: '42px', height: '42px', borderRadius: '10px',
    background: '#eff6ff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  continueTitle: { fontSize: '14px', fontWeight: '700', color: '#0f172a' },
  continueSub: { 
    fontSize: '12.5px', 
    color: '#64748b', 
    marginTop: '2px',
    fontFamily: "'Outfit', sans-serif",
  },

  footer: { 
    fontSize: '13.5px', 
    color: '#64748b', 
    textAlign: 'center', 
    width: '100%',
    maxWidth: '380px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  footerLink: { color: '#1a56db', fontWeight: '700', textDecoration: 'none' },

  /* ── RIGHT PANEL ── */
  right: {
    width: '50%',
    background: '#ffffff url(/background.png) no-repeat right center / cover',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '56px 64px',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },

  tagline: { 
    position: 'relative', 
    zIndex: 2,
    width: '100%',
    maxWidth: '560px',
    alignSelf: 'center',
  },
  taglineH2: {
    fontSize: '40px', 
    fontWeight: '800', 
    lineHeight: 1.1, 
    letterSpacing: '-0.03em', 
    marginBottom: '10px',
    fontFamily: "'Outfit', sans-serif",
  },
  taglineSub: { 
    color: '#64748b', 
    fontSize: '15px', 
    fontWeight: '500',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  dashboardImg: {
    width: '100%',
    maxWidth: '680px',
    height: 'auto',
    alignSelf: 'center',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
    zIndex: 2,
    marginTop: '20px',
  },
};


/* ─────────────────────────────────────────────────────────────────── */

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        const errData = await response.json();
        throw new Error(errData.detail || 'Invalid credentials');
      }
    } catch (err) {
      console.warn('Backend unavailable – using demo session', err);
      if (email && password) {
        const mockUser = {
          id: 99, email, full_name: 'Yvan',
          school: 'TutorFlow Academy', grade: '9th Grade',
          learning_goals: ['Master Linear Equations', 'Quadratic expansion'],
          current_streak: 7, mastery_score: 78.0, confidence_score: 72.0,
          voice_settings: { voiceName: 'Default', speed: 1.0, pitch: 1.0 },
          ai_personality: 'Empathetic Tutor', theme: 'dark',
        };
        localStorage.setItem('token', 'mock-jwt-token-tutorflow');
        localStorage.setItem('user', JSON.stringify(mockUser));
        navigate('/dashboard');
      } else {
        setError('Please enter both email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const mockUser = {
      id: 100, email: 'yvan.google@tutorflow.ai', full_name: 'Yvan',
      school: 'TutorFlow Academy', grade: '9th Grade',
      learning_goals: ['Master Linear Equations', 'Quadratic expansion'],
      current_streak: 7, mastery_score: 78.0, confidence_score: 72.0,
      voice_settings: { voiceName: 'Default', speed: 1.0, pitch: 1.0 },
      ai_personality: 'Empathetic Tutor', theme: 'dark',
    };
    localStorage.setItem('token', 'mock-google-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    navigate('/dashboard');
  };

  return (
    <div style={S.page}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .right-panel-wrapper { display: none !important; }
          .left-panel-wrapper { width: 100% !important; max-width: 100% !important; min-width: 100% !important; padding: 40px 24px !important; }
          .form-area-wrapper { max-width: 380px !important; margin: 0 auto !important; }
        }
        
        .custom-input::placeholder {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          color: #94a3b8 !important;
          font-size: 14px !important;
          opacity: 0.85 !important;
        }
        
        .custom-input:focus {
          border-color: #1a56db !important;
          box-shadow: 0 0 0 3px rgba(26, 86, 219, 0.1) !important;
        }
        
        .google-btn:hover {
          background-color: #f8fafc !important;
          border-color: #1a56db !important;
        }
        
        .continue-card:hover {
          box-shadow: 0 10px 25px rgba(26, 86, 219, 0.08) !important;
          border-color: #cbd5e1 !important;
        }
      `}} />

      {/* ══════════════════════ LEFT PANEL ══════════════════════ */}
      <div style={S.left} className="left-panel-wrapper">

        {/* Brand */}
        <div style={S.brand}>
          <img src="/Logo_cropped.png" alt="TutorFlow" style={{ height: '36px', objectFit: 'contain' }} />
        </div>

        {/* Form block */}
        <div style={S.formArea} className="form-area-wrapper">
          <h1 style={S.h1}>Welcome back!</h1>
          <p style={S.subtitle}>Log in to continue your learning journey.</p>

          {error && <div style={S.errorBox}>{error}</div>}

          <form onSubmit={handleLogin} style={S.form}>
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={S.label}>Email</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}><Mail size={15} color="#94a3b8" /></span>
                <input
                  type="email" required placeholder="Enter your email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  style={S.input}
                  className="custom-input"
                  onFocus={(e) => (e.target.style.borderColor = '#1a56db')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={S.labelRow}>
                <label style={S.label}>Password</label>
                <Link to="/forgot-password" style={S.forgotLink}>Forgot password?</Link>
              </div>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}><Lock size={15} color="#94a3b8" /></span>
                <input
                  type={showPassword ? 'text' : 'password'} required placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  style={S.input}
                  className="custom-input"
                  onFocus={(e) => (e.target.style.borderColor = '#1a56db')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={S.eyeBtn}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading} style={S.submitBtn}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1e40af')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#1a56db')}
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          {/* Divider */}
          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={{ padding: '0 12px' }}>or</span>
            <div style={S.dividerLine} />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin} style={S.googleBtn}
            className="google-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Continue Learning card */}
          <div
            style={S.continueCard}
            onClick={handleGoogleLogin}
            className="continue-card"
          >
            <div style={S.continueCardLeft}>
              <div style={S.continueIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <div>
                <div style={S.continueTitle}>Continue learning</div>
                <div style={S.continueSub}>Pick up where you left off</div>
              </div>
            </div>
            <ChevronRight size={18} color="#1a56db" />
          </div>
        </div>

        {/* Footer */}
        <p style={S.footer}>
          Don't have an account?{' '}
          <Link to="/signup" style={S.footerLink}>Sign up</Link>
        </p>
      </div>

      <RightPanel />
    </div>
  );
};

const RightPanel = () => {
  return (
    <div style={S.right} className="right-panel-wrapper">
      <div style={S.tagline}>
        <h2 style={S.taglineH2}>
          <span style={{ color: '#1a56db' }}>Your AI Tutor.</span><br />
          <span style={{ color: '#1a56db' }}>Your Learning Flow.</span>
        </h2>
        <p style={S.taglineSub}>Teach. Understand. Improve.</p>
      </div>

      <img src="/Dashboard.png" alt="Dashboard Mockup" style={S.dashboardImg} className="dashboard-mockup-img" />

      <p style={{ color: '#94a3b8', fontSize: '12px', position: 'relative', zIndex: 1, alignSelf: 'center', marginBottom: '24px' }}>
        © 2026 TutorFlow AI. All rights reserved.
      </p>
    </div>
  );
};

export default Login;

