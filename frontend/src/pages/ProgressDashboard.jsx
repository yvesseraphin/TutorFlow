import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Clock, 
  Target, 
  Award, 
  TrendingUp, 
  CheckCircle,
  Calendar,
  Zap
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

const ProgressDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, trends, sessions, achievements
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/v1/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.warn('Backend offline, loading mock analytics.');
      setAnalytics({
        streak: 4,
        learning_time_distribution: {
          "Mon": 25, "Tue": 40, "Wed": 15, "Thu": 30, "Fri": 50, "Sat": 20, "Sun": 10
        },
        topic_mastery: {
          "Variables & Expressions": 95,
          "Linear Equations": 85,
          "Distributive Expansion": 42,
          "Combining Like Terms": 65
        },
        accuracy_over_time: [60, 65, 62, 70, 68, 75, 82],
        achievements: [
          { title: "Streak Starter", desc: "Studied 3 days in a row!", icon: "🔥", date: "2026-07-16" },
          { title: "Equation Isolator", desc: "Solved 10 equations correctly.", icon: "🧭", date: "2026-07-17" },
          { title: "Self-Aware Learner", desc: "Completed diagnostic profile setup.", icon: "🧠", date: "2026-07-15" }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glow-text-cyan" style={{ fontSize: '18px', fontWeight: 'bold' }}>Syncing student progress logs...</div>
      </div>
    );
  }

  // Calculate total study time
  const totalStudyTime = Object.values(analytics.learning_time_distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>STUDENT PORTFOLIO</span>
          <h2 style={{ fontSize: '28px', color: '#fff' }}>Progress & Analytics</h2>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px',
          padding: '4px'
        }}>
          {[
            { id: 'overview', label: 'Progress Overview' },
            { id: 'trends', label: 'Performance Trends' },
            { id: 'sessions', label: 'Session History' },
            { id: 'achievements', label: 'Achievements' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                border: 'none',
                color: activeTab === t.id ? '#fff' : 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Layout */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
          
          {/* Study time distribution bar chart (8 units) */}
          <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <GlassCard style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="var(--color-secondary)" />
                <span>Weekly Study Time (Total: {totalStudyTime} mins)</span>
              </h4>

              {/* Custom SVG Bar Chart */}
              <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px 10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {Object.entries(analytics.learning_time_distribution).map(([day, mins], i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '10%' }}>
                    <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>{mins}m</span>
                    <div style={{
                      width: '100%',
                      height: `${mins * 2.8}px`,
                      background: 'linear-gradient(to top, var(--color-primary), var(--color-secondary))',
                      borderRadius: '4px',
                      boxShadow: '0 0 10px var(--color-secondary-glow)'
                    }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{day}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Topic Mastery list */}
            <GlassCard style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={16} color="var(--color-primary)" />
                <span>Algebra Topic Mastery Breakdown</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {Object.entries(analytics.topic_mastery).map(([topic, score]) => (
                  <div key={topic} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#fff', fontWeight: 500 }}>{topic}</span>
                      <span style={{ color: score > 75 ? 'var(--color-success)' : score > 50 ? 'var(--color-warning)' : 'var(--color-danger)', fontWeight: 'bold' }}>{score}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${score}%`, 
                        height: '100%', 
                        background: score > 75 ? 'var(--color-success)' : score > 50 ? 'var(--color-primary)' : 'var(--color-danger)'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Right Column (4 units) - Sparklines */}
          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <GlassCard glow="indigo" style={{ padding: '24px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-accent)', fontWeight: 'bold', textTransform: 'uppercase' }}>Weekly Accuracy Curve</span>
              <h4 style={{ fontSize: '24px', color: '#fff', marginTop: '6px', fontWeight: 'bold' }}>82% Average</h4>
              
              {/* Custom SVG Line Sparkline */}
              <div style={{ height: '90px', margin: '20px 0 10px 0' }}>
                <svg width="100%" height="100%" viewBox="0 0 100 50">
                  <path
                    d={`M 0 45 L 16 42 L 32 44 L 48 38 L 64 40 L 80 32 L 96 24`}
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 4px var(--color-primary-glow))' }}
                  />
                  {/* Glowing endpoint */}
                  <circle cx="96" cy="24" r="3" fill="#fff" stroke="var(--color-primary)" strokeWidth="1" />
                </svg>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Accuracy rose from 60% to 82% over the last 7 classroom sessions.
              </p>
            </GlassCard>

            {/* Achievements list quick preview */}
            <GlassCard style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '15px', color: '#fff', fontWeight: 'bold' }}>Badges Unlocked</h4>
                <button onClick={() => setActiveTab('achievements')} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  All →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analytics.achievements.map((badge, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '24px' }}>{badge.icon}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{badge.title}</div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{badge.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

        </div>
      )}

      {/* Subpage 12.1: Performance Trends */}
      {activeTab === 'trends' && (
        <GlassCard style={{ padding: '30px', maxWidth: '750px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={20} color="var(--color-secondary)" />
            <span>Weekly Progress Trends</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
            We've observed a <strong>14.5% improvement</strong> in overall algebraic score averages. 
            Isolating basic single variables is now completed at a high-speed threshold. Parenthetical grouping 
            remains an attention area.
          </p>
        </GlassCard>
      )}

      {/* Subpage 12.2: Session History */}
      {activeTab === 'sessions' && (
        <GlassCard style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={20} color="var(--color-primary)" />
            <span>Session Logs History</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>Lesson: Distributive Property Expansion</span>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>July 18 • 15 minutes</span>
              </div>
              <span className="badge badge-unlocked">Active</span>
            </div>
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>Baseline Diagnostic Assessment</span>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>July 17 • 12 minutes</span>
              </div>
              <span className="badge badge-mastered">Completed</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Subpage 12.3: Achievements */}
      {activeTab === 'achievements' && (
        <GlassCard style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={20} color="var(--color-accent)" />
            <span>Unlocked Badges & Milestones</span>
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px'
          }}>
            {[
              { title: "Streak Starter", desc: "Studied 3 days in a row!", icon: "🔥" },
              { title: "Equation Isolator", desc: "Isolate 10 equation values.", icon: "🧭" },
              { title: "Whiteboard Wizard", desc: "Scored 80% on diagnostic whiteboard task.", icon: "✏️" }
            ].map((badge, idx) => (
              <div key={idx} style={{
                padding: '20px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '12px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '4px' }}>{badge.icon}</div>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{badge.title}</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{badge.desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

    </div>
  );
};

export default ProgressDashboard;
