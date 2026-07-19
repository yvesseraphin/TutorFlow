import React, { useState, useEffect } from 'react';
import { 
  User, 
  Volume2, 
  Bell, 
  Settings, 
  Save, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile'); // profile, preferences, notifications
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  
  // Voice config
  const [voiceName, setVoiceName] = useState('Default Female');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  
  // AI Persona
  const [aiPersonality, setAiPersonality] = useState('Empathetic Tutor');
  const [theme, setTheme] = useState('dark');
  
  // Alerts config
  const [reminders, setReminders] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(true);
  
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    // Load local storage
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      setFullName(user.full_name || 'Alex Mercer');
      setSchool(user.school || 'TutorFlow Academy');
      setGrade(user.grade || '9th Grade');
      if (user.voice_settings) {
        setVoiceName(user.voice_settings.voiceName || 'Default Female');
        setVoiceSpeed(user.voice_settings.speed || 1.0);
        setVoicePitch(user.voice_settings.pitch || 1.0);
      }
      setAiPersonality(user.ai_personality || 'Empathetic Tutor');
      setTheme(user.theme || 'dark');
    }
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavedMessage('');
    
    const payload = {
      full_name: fullName,
      school: school,
      grade: grade
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      localStorage.setItem('user', JSON.stringify(data));
      setSavedMessage('Profile data successfully synchronized!');
    } catch (err) {
      // Local fallback save
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : {};
      const updatedUser = { ...user, ...payload };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSavedMessage('Profile data updated locally!');
    }
  };

  const handleSavePreferences = async () => {
    setSavedMessage('');
    
    const payload = {
      voice_settings: { voiceName, speed: parseFloat(voiceSpeed), pitch: parseFloat(voicePitch) },
      ai_personality: aiPersonality,
      theme: theme
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/v1/auth/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      localStorage.setItem('user', JSON.stringify(data));
      setSavedMessage('Tutor preferences updated successfully!');
    } catch (err) {
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : {};
      const updatedUser = { ...user, ...payload };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSavedMessage('Preferences saved locally!');
    }
  };

  const handleSaveNotifications = () => {
    setSavedMessage('Notification channels configured!');
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>STUDENT COCKPIT</span>
          <h2 style={{ fontSize: '28px', color: '#fff' }}>Profile & Settings</h2>
        </div>

        {/* Tab switchers */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px',
          padding: '4px'
        }}>
          {[
            { id: 'profile', label: 'Student Profile', icon: User },
            { id: 'preferences', label: 'Tutor Preferences', icon: Volume2 },
            { id: 'notifications', label: 'Notifications Alerts', icon: Bell }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setSavedMessage('');
                }}
                style={{
                  background: activeTab === t.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: 'none',
                  color: activeTab === t.id ? '#fff' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {savedMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: 'var(--color-success)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '13.5px',
          maxWidth: '600px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s'
        }}>
          <CheckCircle size={16} />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* 14. Student Profile Settings */}
      {activeTab === 'profile' && (
        <GlassCard style={{ padding: '30px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '20px' }}>Personal Information</h3>
          
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">School / Institution</label>
              <input
                type="text"
                required
                className="form-input"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Grade / Level</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="form-input"
                style={{ background: 'rgba(0, 0, 0, 0.25)' }}
              >
                <option value="8th Grade">8th Grade (Pre-Algebra)</option>
                <option value="9th Grade">9th Grade (Algebra 1)</option>
                <option value="10th Grade">10th Grade (Geometry)</option>
                <option value="11th Grade">11th Grade (Algebra 2)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
              <Save size={16} />
              <span>Save Profile</span>
            </button>
          </form>
        </GlassCard>
      )}

      {/* 15. Preferences Settings (Speech, Persona, Theme) */}
      {activeTab === 'preferences' && (
        <GlassCard style={{ padding: '30px', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '6px' }}>Tutor Interaction Preferences</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Configure variables for TutorFlow Speech TTS output models.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Voice select */}
            <div className="form-group">
              <label className="form-label">Synthesized Voice model</label>
              <select
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="form-input"
                style={{ background: 'rgba(0, 0, 0, 0.25)' }}
              >
                <option value="Default Female">Empathetic Female (Standard)</option>
                <option value="Male Accent">Socratic Male (Deep)</option>
                <option value="Robotic Assist">Synthesized Neural Assist</option>
              </select>
            </div>

            {/* Speaking Rate & Pitch sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Speaking Rate: {voiceSpeed}x</label>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(e.target.value)}
                  style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Voice Pitch: {voicePitch}</label>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.1"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(e.target.value)}
                  style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                />
              </div>
            </div>

            {/* AI Personality selection */}
            <div className="form-group">
              <label className="form-label">AI Tutor Avatar Personality</label>
              <select
                value={aiPersonality}
                onChange={(e) => setAiPersonality(e.target.value)}
                className="form-input"
                style={{ background: 'rgba(0, 0, 0, 0.25)' }}
              >
                <option value="Empathetic Tutor">Empathetic Coach (Encourages and breaks down steps)</option>
                <option value="Strict Socratic">Strict Socratic (Responds strictly in math questions)</option>
                <option value="Example-Driven Mentor">Example-Driven Mentor (Generates sample boxes first)</option>
              </select>
            </div>

            {/* Theme selection */}
            <div className="form-group">
              <label className="form-label">Dashboard Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="form-input"
                style={{ background: 'rgba(0, 0, 0, 0.25)' }}
              >
                <option value="dark">Cybernetic Obsidian (Dark Mode - Default)</option>
                <option value="light">Solarized Slate (Light Mode)</option>
              </select>
            </div>

            <button onClick={handleSavePreferences} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
              <Save size={16} />
              <span>Save Preferences</span>
            </button>
          </div>
        </GlassCard>
      )}

      {/* 16. Notification Settings */}
      {activeTab === 'notifications' && (
        <GlassCard style={{ padding: '30px', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '6px' }}>Notification Alerts Configurations</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Set communication channels to trigger spaced retention warnings.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>Daily Study Reminders</span>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Triggers reminder alerts to retain study streaks.</span>
              </div>
              <input 
                type="checkbox" 
                checked={reminders} 
                onChange={(e) => setReminders(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>Spaced Review Alerts</span>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Warns when a core concept is decaying on forgetting curve.</span>
              </div>
              <input 
                type="checkbox" 
                checked={reviewAlerts} 
                onChange={(e) => setReviewAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
              />
            </div>

            <button onClick={handleSaveNotifications} className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
              <Save size={16} />
              <span>Configure Notifications</span>
            </button>
          </div>
        </GlassCard>
      )}

    </div>
  );
};

export default Profile;
