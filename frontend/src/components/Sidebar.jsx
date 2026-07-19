import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Brain, 
  BarChart3, 
  RotateCcw, 
  Settings, 
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/classroom', label: 'Lessons', icon: BookOpen },
    { to: '/twin', label: 'Cognitive Twin', icon: Brain },
    { to: '/analytics', label: 'Progress', icon: BarChart3 },
    { to: '/review', label: 'Review', icon: RotateCcw },
    { to: '/profile', label: 'Settings', icon: Settings }
  ];

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: '#ffffff',
      borderRight: '1px solid #f1f5f9',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      zIndex: 100,
      boxSizing: 'border-box'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .sidebar-nav-link-inactive {
          color: #64748b !important;
          background: transparent !important;
        }
        .sidebar-nav-link-inactive:hover {
          background: #f8fafc !important;
          color: #0f172a !important;
        }
        .sidebar-nav-link-active {
          background: #1a56db !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(26, 86, 219, 0.12) !important;
        }
      `}} />

      <div>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
          <img src="/Logo_cropped.png" alt="TutorFlow" style={{ height: '34px', objectFit: 'contain' }} />
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'sidebar-nav-link-active' : 'sidebar-nav-link-inactive'}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <button 
        onClick={handleLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: 600,
          background: 'transparent',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          width: '100%',
          textAlign: 'left',
          transition: 'all 0.2s',
          marginTop: '20px'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
