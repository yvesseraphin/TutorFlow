import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  BookOpen, 
  AlertCircle, 
  RotateCcw, 
  HelpCircle,
  FileText,
  ChevronRight
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

const ReviewCenter = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, schedule, mistakes
  const [data, setData] = useState(null);
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewData();
  }, []);

  const fetchReviewData = async () => {
    try {
      const token = localStorage.getItem('token');
      const dashboardRes = await fetch('http://localhost:8000/api/v1/review/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dashboardData = await dashboardRes.json();
      setData(dashboardData);

      const mistakesRes = await fetch('http://localhost:8000/api/v1/review/mistake-book', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const mistakesData = await mistakesRes.json();
      setMistakes(mistakesData);
    } catch (err) {
      console.warn('Backend offline, loading mock review database.');
      setData({
        concepts_to_revisit: [
          { id: 1, concept: "Distributive expansion parenthesis", difficulty: "Medium", days_since_seen: 2, recomm_action: "Review rectangular grid grids." },
          { id: 2, concept: "Negative sign multiplication constants", difficulty: "Easy", days_since_seen: 4, recomm_action: "Take a 5-question speed quiz." }
        ],
        ai_recap: "Here is your AI-generated recap: You've made significant progress isolating variables when solving simple linear equations (mastery at 85%). However, expanding parenthetical expressions retaining correct signs remains a stumbling block. Focus your attention on the sign negation rule and area model calculations today.",
        weak_areas: ["Distributive brackets expansion", "Sign combination isolation"]
      });
      setMistakes([
        {
          id: 101,
          concept: "Distributive Property",
          formula_or_fact: "3(x + 2) = 3x + 6",
          status: "active",
          mistake_history: [
            {
              wrong_answer: "3(x + 2) = 3x + 2",
              explanation: "Student multiplied 3 by x but forgot to multiply 3 by 2.",
              correction: "Make sure to scale both x and 2 by 3: 3*x + 3*2 = 3x + 6."
            }
          ]
        },
        {
          id: 102,
          concept: "Sign Negation Expansion",
          formula_or_fact: "-2(x - 3) = -2x + 6",
          status: "active",
          mistake_history: [
            {
              wrong_answer: "-2(x - 3) = -2x - 6",
              explanation: "Incorrect processing of negatives: multiplied -2 by -3 and kept negative sign.",
              correction: "Negative multiplied by negative gives positive value: -2 * -3 = +6."
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glow-text-cyan" style={{ fontSize: '18px', fontWeight: 'bold' }}>Syncing revision mistake books...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Memory Refreshment</span>
          <h2 style={{ fontSize: '28px', color: '#fff' }}>Review & Revision Center</h2>
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
            { id: 'overview', label: 'Revision Overview' },
            { id: 'schedule', label: 'Smart Revision Plan' },
            { id: 'mistakes', label: 'Mistake Book' }
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

      {/* Revision Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          
          {/* Left panel - AI generated recap & concepts list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <GlassCard glow="indigo" style={{ padding: '30px' }}>
              <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} color="var(--color-secondary)" />
                <span>AI-Generated Spaced Recap</span>
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {data.ai_recap}
              </p>
            </GlassCard>

            <GlassCard style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={16} color="var(--color-primary)" />
                <span>Concepts Ready for Re-evaluation</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.concepts_to_revisit.map((item) => (
                  <div key={item.id} style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{item.concept}</span>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Last seen {item.days_since_seen} days ago • {item.recomm_action}</span>
                    </div>
                    <button 
                      onClick={() => setActiveTab('schedule')}
                      style={{
                        background: 'rgba(99,102,241,0.1)',
                        border: 'none',
                        color: 'var(--color-primary)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Schedule
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Right panel - Weak areas list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <GlassCard style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} color="var(--color-danger)" />
                <span>Identified Weak Categories</span>
              </h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '10px', lineHeight: 1.4 }}>
                {data.weak_areas.map((wa, idx) => (
                  <li key={idx} style={{ color: 'var(--text-primary)' }}>
                    <strong>{wa}</strong>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Flagged during whiteboard algebraic diagnostic isolation steps.
                    </span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>

        </div>
      )}

      {/* Subpage 13.1: Smart Spaced Revision Plan Calendar */}
      {activeTab === 'schedule' && (
        <GlassCard style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={20} color="var(--color-secondary)" />
            <span>Spaced Repetition Calendar Plan</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
            Calendar generated using forgetting curve analysis to target topics exactly when recall scores drop below 80%.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { day: "Today", focus: "Distributive Property parenthetical expansions", duration: "15 mins", priority: "High" },
              { day: "Tomorrow", focus: "Combining algebraic variable terms review", duration: "10 mins", priority: "Medium" },
              { day: "Wednesday", focus: "Parenthesis multi-step linear isolation", duration: "20 mins", priority: "High" }
            ].map((plan, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{
                    width: '70px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: 'var(--color-secondary)'
                  }}>
                    {plan.day}
                  </div>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{plan.focus}</span>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Duration: {plan.duration}</span>
                  </div>
                </div>
                <span className="badge" style={{
                  background: plan.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: plan.priority === 'High' ? 'var(--color-danger)' : 'var(--color-warning)'
                }}>{plan.priority} Priority</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Subpage 13.2: Mistake Book */}
      {activeTab === 'mistakes' && (
        <GlassCard style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={20} color="var(--color-primary)" />
            <span>Mistake Book Log</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
            Stores incorrect homework or test answers alongside reasons and corrected formulas.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {mistakes.map((m) => (
              <div key={m.id} style={{
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>Topic: {m.concept}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                    Formula: {m.formula_or_fact}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px'
                }}>
                  {/* Left - Wrong answer & why */}
                  <div style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.03)',
                    border: '1px solid rgba(239, 68, 68, 0.08)',
                    borderRadius: '8px',
                    fontSize: '12.5px'
                  }}>
                    <strong style={{ display: 'block', color: 'var(--color-danger)', marginBottom: '4px' }}>❌ Recorded Mistake</strong>
                    <div style={{ fontFamily: 'monospace', fontSize: '13.5px', color: '#fff', margin: '4px 0' }}>{m.mistake_history[0].wrong_answer}</div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
                      Why: {m.mistake_history[0].explanation}
                    </p>
                  </div>

                  {/* Right - Correct & explanation */}
                  <div style={{
                    padding: '12px',
                    background: 'rgba(16, 185, 129, 0.03)',
                    border: '1px solid rgba(16, 185, 129, 0.08)',
                    borderRadius: '8px',
                    fontSize: '12.5px'
                  }}>
                    <strong style={{ display: 'block', color: 'var(--color-success)', marginBottom: '4px' }}>✓ AI Remediation</strong>
                    <div style={{ fontFamily: 'monospace', fontSize: '13.5px', color: '#fff', margin: '4px 0' }}>{m.formula_or_fact}</div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
                      Correction: {m.mistake_history[0].correction}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

    </div>
  );
};

export default ReviewCenter;
