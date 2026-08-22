import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Compass, 
  History, 
  Activity, 
  BarChart, 
  AlertTriangle,
  TrendingDown,
  Percent,
  TrendingUp,
  Eye
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import KnowledgeGraph from '../components/KnowledgeGraph';
import { api } from '../lib/api';

const CognitiveTwinDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, map, history, patterns, predictions
  const [twinData, setTwinData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTwinData();
  }, []);

  const fetchTwinData = async () => {
    try {
      const data = await api('/twin/profile');
      setTwinData(data);
    } catch (err) {
      setError(err.message || 'Unable to load your cognitive twin.');
      return;
      setTwinData({
        learning_style: { "Visual": 60.0, "Analytical": 25.0, "Example-driven": 15.0 },
        forgetting_curve: {
          retention: 0.85,
          concepts_at_risk: ["Distributive expansion variables", "Coefficient division isolation"]
        },
        predictions: {
          predicted_weaknesses: ["Systems of equations elimination"],
          upcoming_struggles: "Factoring quadratic equations with mixed integers due to subtraction signs hesitancy."
        },
        confidence_tracker: [
          { date: "July 12", val: 30 },
          { date: "July 14", val: 42 },
          { date: "July 16", val: 56 },
          { date: "July 18", val: 68 }
        ],
        misconception_graph: {
          nodes: [
            { id: "m1", label: "Distributive confusion", severity: 0.93, occurrences: 3 },
            { id: "m2", label: "Sign mistakes", severity: 0.55, occurrences: 1 }
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
        <div className="glow-text-cyan" style={{ fontSize: '18px', fontWeight: 'bold' }}>Syncing cognitive twin replica...</div>
      </div>
    );
  }

  if (error) return <div style={{ padding: '24px', color: '#b91c1c' }}>{error}</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--color-accent)', fontWeight: 'bold', textTransform: 'uppercase' }}>STUDENT NEURAL REPLICA</span>
          <h2 style={{ fontSize: '28px', color: '#fff' }}>Cognitive Twin Cockpit</h2>
        </div>

        {/* Subpages Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px',
          padding: '4px'
        }}>
          {[
            { id: 'dashboard', label: 'Twin Dashboard' },
            { id: 'map', label: 'Knowledge Map' },
            { id: 'history', label: 'Misconception History' },
            { id: 'patterns', label: 'Learning Patterns' },
            { id: 'predictions', label: 'AI Predictions' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? 'rgba(168,85,247,0.15)' : 'transparent',
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

      {/* 10. Core Dashboard Layout */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
          
          {/* Knowledge Map preview (8 units) */}
          <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <GlassCard style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass size={18} color="var(--color-secondary)" />
                  <span>Algebra Core Knowledge Graph</span>
                </h4>
                <button onClick={() => setActiveTab('map')} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Open Interactive Map →
                </button>
              </div>
              <KnowledgeGraph />
            </GlassCard>

            {/* Split: Misconception Graph and Confidence Tracker */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* Misconception Graph List */}
              <GlassCard style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} color="var(--color-danger)" />
                  <span>Pedagogical Misconceptions</span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {twinData.misconception_graph.nodes.map((node, i) => (
                    <div key={i} style={{
                      padding: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{node.label}</span>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Occurrences: {node.occurrences}</span>
                      </div>
                      <span className="badge badge-weak" style={{ fontSize: '10px' }}>
                        {Math.round(node.severity * 100)}% Sev
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Confidence Tracker SVG Plot */}
              <GlassCard style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={16} color="var(--color-secondary)" />
                  <span>Confidence Over Time</span>
                </h4>
                
                {/* Custom Sparkline Graph */}
                <div style={{ height: '110px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {twinData.confidence_tracker.map((pt, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '22%' }}>
                      <div style={{
                        width: '12px',
                        height: `${pt.val * 0.9}px`,
                        background: 'linear-gradient(to top, var(--color-primary), var(--color-secondary))',
                        borderRadius: '6px',
                        boxShadow: '0 0 8px var(--color-secondary-glow)'
                      }} />
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{pt.date}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  <span>Baseline: 30%</span>
                  <span>Latest: 68%</span>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Right Column (4 units) */}
          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Forgetting Curve Retention */}
            <GlassCard glow="cyan" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Forgetting Curve Retention</span>
              
              <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--color-secondary)', margin: '14px 0', textShadow: '0 0 12px var(--color-secondary-glow)' }}>
                {Math.round(twinData.forgetting_curve.retention * 100)}%
              </div>

              <div style={{ width: '100%', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'left' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Concepts at Risk of Decay</span>
                <ul style={{ paddingLeft: '16px', color: 'var(--text-secondary)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {twinData.forgetting_curve.concepts_at_risk.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            </GlassCard>

            {/* Learning Style blend */}
            <GlassCard style={{ padding: '24px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>Cognitive Learning Style</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {Object.entries(twinData.learning_style).map(([style, val]) => (
                  <div key={style} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span style={{ color: '#fff', fontWeight: 500 }}>{style}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{val}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${val}%`, 
                        height: '100%', 
                        background: style === 'Visual' ? 'var(--color-secondary)' : style === 'Analytical' ? 'var(--color-primary)' : 'var(--color-accent)'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

        </div>
      )}

      {/* Subpage 10.1: Full screen Knowledge Map */}
      {activeTab === 'map' && (
        <GlassCard style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={20} color="var(--color-secondary)" />
            <span>Interactive Algebra Roadmap</span>
          </h3>
          <KnowledgeGraph />
        </GlassCard>
      )}

      {/* Subpage 10.2: Misconception History */}
      {activeTab === 'history' && (
        <GlassCard style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="var(--color-danger)" />
            <span>Misconception Event Log</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
            Timeline tracking historical mistakes detected during whiteboard and chat practice.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderLeft: '2px solid var(--color-danger)', paddingLeft: '16px', position: 'relative' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)', position: 'absolute', left: '-5px', top: '4px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ fontSize: '14.5px', fontWeight: 'bold', color: '#fff' }}>Distributive Parentheses Negation Error</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>2 hours ago</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                User solved 3(x + 2) as 3x + 2. Failed to distribute constant multiplier to term index 2.
              </p>
              <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.03)' }}>
                OCR INPUT: "3(x+2) = 3x + 2" | CLASSIFIER CONFIDENCE: 93%
              </div>
            </div>

            <div style={{ borderLeft: '2px solid var(--color-success)', paddingLeft: '16px', position: 'relative' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)', position: 'absolute', left: '-5px', top: '4px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ fontSize: '14.5px', fontWeight: 'bold', color: '#fff' }}>Sign Negative Multiplication Error (RESOLVED)</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>2 days ago</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                Double negative multiplication rules successfully resolved during visual number-line step exercises.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Subpage 10.3: Learning Patterns */}
      {activeTab === 'patterns' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          <GlassCard style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={20} color="var(--color-accent)" />
              <span>Teaching Method Engagement</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { method: "Visual Rectangular Models", val: 88, status: "highly_effective" },
                { method: "Socratic Text Questioning", val: 72, status: "moderately_effective" },
                { method: "Numerical Text Explanations", val: 45, status: "ineffective" }
              ].map((item, idx) => (
                <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '8px' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{item.method}</span>
                    <span style={{ color: item.status === 'highly_effective' ? 'var(--color-success)' : item.status === 'ineffective' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                      {item.val}% engagement
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                    <div style={{ width: `${item.val}%`, height: '100%', background: 'var(--color-accent)' }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>Webcam Attention Telemetry</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Biometric metrics extracted via browser face meshes to optimize lesson timing.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Focus Retention Threshold</span>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>22.4 Minutes</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recommended Session Cap</span>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-secondary)', marginTop: '2px' }}>30 Minutes</div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Subpage 10.4: Predictions */}
      {activeTab === 'predictions' && (
        <GlassCard style={{ padding: '30px', maxWidth: '750px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={20} color="var(--color-secondary)" />
            <span>AI Predictive Weakness Index</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
            Predictive modeling of upcoming concepts where learning struggles are expected.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h4 style={{ fontSize: '14.5px', fontWeight: 'bold', color: '#fff' }}>Quadratic Factorization</h4>
                <span className="badge badge-weak">87% Struggle Prob.</span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Risk reasoning: Factoring quadratic matrices requires strong foundation in multiplication of mixed negatives which are currently flagged as a weak area.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h4 style={{ fontSize: '14.5px', fontWeight: 'bold', color: '#fff' }}>Systems of Equations by Elimination</h4>
                <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)' }}>62% Struggle Prob.</span>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

    </div>
  );
};

export default CognitiveTwinDashboard;
