import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Flame, 
  TrendingUp, 
  AlertTriangle, 
  Compass, 
  Clock, 
  ArrowRight,
  Brain,
  Bell,
  User,
  BookOpen,
  CheckCircle2
} from 'lucide-react';

const S = {
  container: {
    padding: '30px 40px',
    background: '#f8fafc',
    color: '#0f172a',
    minHeight: '100vh',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: 'border-box',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  greeting: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '-0.02em',
  },
  subGreeting: {
    color: '#64748b',
    fontSize: '14px',
    marginTop: '4px',
    fontWeight: '500',
  },
  headerIcons: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  bellBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#ffffff',
    border: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.02)',
    cursor: 'pointer',
  },
  avatarBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#eff6ff',
    border: '1px solid #dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.02)',
    cursor: 'pointer',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
    boxSizing: 'border-box',
  },
  blueCard: {
    background: 'linear-gradient(135deg, #1a56db 0%, #2563eb 100%)',
    color: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '220px',
    boxShadow: '0 10px 25px rgba(26, 86, 219, 0.15)',
    boxSizing: 'border-box',
  },
  blueCardLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    opacity: 0.9,
  },
  blueCardTitle: {
    fontSize: '22px',
    fontWeight: '800',
    fontFamily: "'Outfit', sans-serif",
    marginTop: '8px',
  },
  blueCardSub: {
    fontSize: '13px',
    opacity: 0.8,
    marginTop: '4px',
  },
  progressBarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '12px',
  },
  progressTrack: {
    flex: 1,
    height: '6px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#ffffff',
    borderRadius: '3px',
  },
  progressPct: {
    fontSize: '13px',
    fontWeight: '700',
  },
  blueCardBtn: {
    background: '#ffffff',
    color: '#1a56db',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    fontFamily: "'Outfit', sans-serif",
    transition: 'transform 0.2s',
    marginTop: '14px',
  },
  gaugeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    justifyContent: 'center',
    height: '220px',
  },
  gaugeTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  gaugeSub: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    marginTop: '10px',
  },
  highlightCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 20px',
    background: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)',
    minHeight: '84px',
    boxSizing: 'border-box',
    width: '100%',
  },
  highlightTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
  },
  highlightIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1a56db',
    flexShrink: 0,
  },
  highlightValue: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', sans-serif",
    marginTop: '2px',
    lineHeight: '1.2',
  },
  highlightSub: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px',
  },
  recentLessonsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '16px',
  },
  recentLessonRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
  },
  lessonIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1a56db',
    flexShrink: 0,
  },
  lessonInfo: {
    flex: 1,
    marginLeft: '12px',
  },
  lessonName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0f172a',
  },
  lessonSub: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px',
  },
  lessonProgress: {
    width: '120px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  lessonTrack: {
    flex: 1,
    height: '4px',
    background: '#f1f5f9',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  lessonFill: {
    height: '100%',
    background: '#1a56db',
    borderRadius: '2px',
  },
  lessonPct: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    width: '30px',
    textAlign: 'right',
  },
  viewAllLink: {
    color: '#1a56db',
    fontSize: '12.5px',
    fontWeight: '700',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '16px',
  },
  twinSummaryRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '20px',
    marginTop: '16px',
  },
  twinList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    justifyContent: 'center',
  },
  twinItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12.5px',
    color: '#334155',
    fontWeight: '600',
  },
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    full_name: "Yvan",
    grade: "9th Grade",
    current_streak: 7,
    mastery_score: 78.0,
    confidence_score: 72.0,
    learning_goals: ["Master Linear Equations", "Quadratic expansion"]
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userRes = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }
    } catch (err) {
      console.warn('Backend offline, using default dashboard data.');
    }
  };

  const MasteryGauge = ({ pct, label, sub }) => (
    <div style={S.gaugeCard}>
      <span style={S.gaugeTitle}>{label}</span>
      <div style={{ position: 'relative', width: '100px', height: '100px', margin: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="100%" height="100%" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#f0f4ff" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="#1a56db" strokeWidth="3" 
                  strokeDasharray={`${pct}, 100`} 
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
          />
        </svg>
        <div style={{ position: 'absolute', fontSize: '20px', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
          {Math.round(pct)}%
        </div>
      </div>
      <span style={S.gaugeSub}>{sub}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
        <svg width="18" height="10" viewBox="0 0 18 10">
          <polyline points="1,8 6,4 11,6 17,1" fill="none" stroke="#1a56db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );

  const TwinNodeMap = () => (
    <div style={{ width: '220px', height: '140px', position: 'relative', background: '#f8fafc', borderRadius: '12px', padding: '6px', alignSelf: 'center' }}>
      <svg width="100%" height="100%" viewBox="0 0 220 140">
        <line x1="110" y1="70" x2="60" y2="40" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="110" y1="70" x2="110" y2="28" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="110" y1="70" x2="160" y2="45" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="110" y1="70" x2="60" y2="105" stroke="#cbd5e1" strokeWidth="1.2" />
        <line x1="110" y1="70" x2="135" y2="115" stroke="#cbd5e1" strokeWidth="1.2" />

        <rect x="85" y="60" width="50" height="20" rx="10" fill="#1a56db" />
        <text x="110" y="72" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">Algebra</text>

        <rect x="25" y="30" width="50" height="16" rx="4" fill="#ffffff" stroke="#1a56db" strokeWidth="0.8" />
        <text x="50" y="40" fill="#1a56db" fontSize="6.5" fontWeight="bold" textAnchor="middle">Expressions</text>

        <rect x="80" y="18" width="60" height="16" rx="4" fill="#ffffff" stroke="#1a56db" strokeWidth="0.8" />
        <text x="110" y="28" fill="#1a56db" fontSize="6.5" fontWeight="bold" textAnchor="middle">Linear Equations</text>

        <rect x="145" y="35" width="45" height="16" rx="4" fill="#ffffff" stroke="#1a56db" strokeWidth="0.8" />
        <text x="167" y="45" fill="#1a56db" fontSize="6.5" fontWeight="bold" textAnchor="middle">Functions</text>

        <rect x="25" y="95" width="45" height="16" rx="4" fill="#ffffff" stroke="#1a56db" strokeWidth="0.8" />
        <text x="47" y="105" fill="#1a56db" fontSize="6.5" fontWeight="bold" textAnchor="middle">Inequalities</text>

        <rect x="100" y="105" width="70" height="16" rx="4" fill="#ffffff" stroke="#1a56db" strokeWidth="0.8" />
        <text x="135" y="115" fill="#1a56db" fontSize="6.5" fontWeight="bold" textAnchor="middle">Quadratic Equations</text>
      </svg>
    </div>
  );

  const KnowledgeGraphPreview = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', width: '100%' }}>
      <div style={{ width: '380px', height: '90px' }}>
        <svg width="100%" height="100%" viewBox="0 0 380 90">
          <line x1="70" y1="20" x2="160" y2="20" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="160" y1="20" x2="250" y2="20" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="160" y1="20" x2="110" y2="60" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="160" y1="20" x2="200" y2="60" stroke="#cbd5e1" strokeWidth="1" />

          <rect x="40" y="10" width="55" height="18" rx="4" fill="#ffffff" stroke="#1a56db" strokeWidth="0.8" />
          <text x="67" y="21" fill="#1a56db" fontSize="7" fontWeight="bold" textAnchor="middle">Expressions</text>

          <rect x="130" y="10" width="65" height="18" rx="4" fill="#ffffff" stroke="#1a56db" strokeWidth="0.8" />
          <text x="162" y="21" fill="#1a56db" fontSize="7" fontWeight="bold" textAnchor="middle">Linear Equations</text>

          <rect x="235" y="10" width="50" height="18" rx="4" fill="#ffffff" stroke="#1a56db" strokeWidth="0.8" />
          <text x="260" y="21" fill="#1a56db" fontSize="7" fontWeight="bold" textAnchor="middle">Functions</text>

          <rect x="85" y="50" width="50" height="18" rx="4" fill="#ffffff" stroke="#1a56db" strokeWidth="0.8" />
          <text x="110" y="61" fill="#1a56db" fontSize="7" fontWeight="bold" textAnchor="middle">Inequalities</text>

          <rect x="165" y="50" width="75" height="18" rx="4" fill="#ffffff" stroke="#1a56db" strokeWidth="0.8" />
          <text x="202" y="61" fill="#1a56db" fontSize="7" fontWeight="bold" textAnchor="middle">Quadratic Equations</text>
        </svg>
      </div>

      <div style={{ flex: 1, padding: '0 20px', fontSize: '13px', color: '#64748b', lineHeight: 1.4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        You're strong in <strong>Expressions</strong> and <strong>Equations</strong>. Keep building connections to master Algebra!
      </div>

      <button 
        onClick={() => navigate('/twin')} 
        style={{
          background: 'transparent',
          border: '1px solid #1a56db',
          color: '#1a56db',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '13px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: "'Outfit', sans-serif",
          transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(26, 86, 219, 0.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span>Explore Full Graph</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );

  return (
    <div style={S.container}>
      {/* ══════════════════════ HEADER ══════════════════════ */}
      <div style={S.header}>
        <div>
          <h1 style={S.greeting}>Good morning, {user.full_name}! 👋</h1>
          <p style={S.subGreeting}>Let's continue your learning journey.</p>
        </div>
        <div style={S.headerIcons}>
          <div style={S.bellBtn}>
            <Bell size={18} color="#64748b" />
          </div>
          <div style={S.avatarBtn}>
            <User size={18} color="#1a56db" />
          </div>
        </div>
      </div>

      {/* ══════════════════════ MAIN CONTENT GRID ══════════════════════ */}
      <div style={S.grid}>
        
        {/* ROW 1: Continue Learning + Mastery Score + Confidence Score */}
        <div style={{ gridColumn: 'span 6' }}>
          <div style={S.blueCard}>
            <div>
              <span style={S.blueCardLabel}>Continue Learning</span>
              <h3 style={S.blueCardTitle}>Solving Linear Equations</h3>
              <span style={S.blueCardSub}>Lesson 4 • In Progress</span>
            </div>
            <div>
              <div style={S.progressBarRow}>
                <div style={S.progressTrack}>
                  <div style={{ ...S.progressFill, width: '66%' }} />
                </div>
                <span style={S.progressPct}>66%</span>
              </div>
              <button onClick={() => navigate('/classroom')} style={S.blueCardBtn}>
                Continue Lesson
              </button>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 3' }}>
          <div style={S.card}>
            <MasteryGauge pct={user.mastery_score} label="Mastery Score" sub="Keep going!" />
          </div>
        </div>

        <div style={{ gridColumn: 'span 3' }}>
          <div style={S.card}>
            <MasteryGauge pct={user.confidence_score} label="Confidence Score" sub="You're building it!" />
          </div>
        </div>

        {/* ROW 2: 4 Highlights Cards */}
        <div style={{ gridColumn: 'span 3' }}>
          <div style={S.highlightCard}>
            <div style={S.highlightIcon}>
              <Flame size={18} />
            </div>
            <div>
              <span style={S.highlightTitle}>Daily Streak</span>
              <div style={S.highlightValue}>7 days</div>
              <span style={S.highlightSub}>Great consistency!</span>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 3' }}>
          <div style={S.highlightCard}>
            <div style={S.highlightIcon}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <span style={S.highlightTitle}>Weak Concepts</span>
              <div style={S.highlightValue}>3</div>
              <span style={S.highlightSub}>Needs more practice</span>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 3' }}>
          <div style={S.highlightCard}>
            <div style={S.highlightIcon}>
              <TrendingUp size={18} />
            </div>
            <div>
              <span style={S.highlightTitle}>Predicted Challenges</span>
              <div style={S.highlightValue}>Quadratic Equations</div>
              <span style={S.highlightSub}>Review recommended</span>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 3' }}>
          <div style={S.highlightCard}>
            <div style={S.highlightIcon}>
              <BookOpen size={18} />
            </div>
            <div>
              <span style={S.highlightTitle}>Recommended Lesson</span>
              <div style={S.highlightValue}>Introduction to Functions</div>
              <span style={S.highlightSub}>Based on your progress</span>
            </div>
          </div>
        </div>

        {/* ROW 3: Recent Lessons + Cognitive Twin Summary */}
        <div style={{ gridColumn: 'span 6' }}>
          <div style={S.card}>
            <h4 style={{ fontSize: '15px', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>Recent Lessons</h4>
            <div style={S.recentLessonsList}>
              {[
                { name: 'Solving Linear Equations', sub: 'Lesson 4', pct: 66 },
                { name: 'Introduction to Functions', sub: 'Lesson 3', pct: 100 },
                { name: 'Simplifying Expressions', sub: 'Lesson 2', pct: 80 }
              ].map((lesson, idx) => (
                <div key={idx} style={S.recentLessonRow}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={S.lessonIcon}>
                      {idx === 0 ? <Play size={14} fill="currentColor" /> : idx === 1 ? <User size={14} /> : <Compass size={14} />}
                    </div>
                    <div style={S.lessonInfo}>
                      <div style={S.lessonName}>{lesson.name}</div>
                      <span style={S.lessonSub}>{lesson.sub}</span>
                    </div>
                  </div>
                  <div style={S.lessonProgress}>
                    <div style={S.lessonTrack}>
                      <div style={{ ...S.lessonFill, width: `${lesson.pct}%`, background: lesson.pct === 100 ? '#10b981' : '#1a56db' }} />
                    </div>
                    <span style={S.lessonPct}>{lesson.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
            <a href="/classroom" onClick={(e) => { e.preventDefault(); navigate('/classroom'); }} style={S.viewAllLink}>
              <span>View all lessons</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>

        <div style={{ gridColumn: 'span 6' }}>
          <div style={S.card}>
            <h4 style={{ fontSize: '15px', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>Cognitive Twin Summary</h4>
            <div style={S.twinSummaryRow}>
              <TwinNodeMap />
              <div style={S.twinList}>
                <div style={S.twinItem}>
                  <CheckCircle2 size={16} color="#1a56db" />
                  <span>Understands your strengths</span>
                </div>
                <div style={S.twinItem}>
                  <CheckCircle2 size={16} color="#1a56db" />
                  <span>Identifies learning gaps</span>
                </div>
                <div style={S.twinItem}>
                  <CheckCircle2 size={16} color="#1a56db" />
                  <span>Personalizes every step</span>
                </div>
              </div>
            </div>
            <a href="/twin" onClick={(e) => { e.preventDefault(); navigate('/twin'); }} style={S.viewAllLink}>
              <span>View Cognitive Twin</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>

        {/* ROW 4: Knowledge Graph Preview */}
        <div style={{ gridColumn: 'span 12' }}>
          <div style={S.card}>
            <h4 style={{ fontSize: '15px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", marginBottom: '16px' }}>Knowledge Graph Preview</h4>
            <KnowledgeGraphPreview />
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
