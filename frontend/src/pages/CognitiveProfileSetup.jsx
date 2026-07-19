import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, BarChart2, Compass, Award, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import KnowledgeGraph from '../components/KnowledgeGraph';

const CognitiveProfileSetup = () => {
  const navigate = useNavigate();
  const profileString = localStorage.getItem('profile');
  
  const profile = profileString ? JSON.parse(profileString) : {
    score: 80.0,
    confidence_level: 70.0,
    learning_style: { "Visual": 60.0, "Analytical": 25.0, "Example-driven": 15.0 },
    knowledge_map: {
      nodes: [
        {"id": "alg-1", "label": "Variables & Expressions", "status": "mastered", "mastery": 0.95, "x": 120, "y": 150},
        {"id": "alg-2", "label": "Linear Equations", "status": "mastered", "mastery": 0.85, "x": 280, "y": 150},
        {"id": "alg-3", "label": "Distributive Expansion", "status": "weak", "mastery": 0.42, "x": 440, "y": 90},
        {"id": "alg-4", "label": "Quadratic Functions", "status": "locked", "mastery": 0.0, "x": 600, "y": 150}
      ],
      edges: [
        {"source": "alg-1", "target": "alg-2"},
        {"source": "alg-2", "target": "alg-3"},
        {"source": "alg-3", "target": "alg-4"}
      ]
    }
  };

  const handleDashboardRedirect = () => {
    navigate('/dashboard');
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{ width: '100%', maxWidth: '880px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
        {/* Success Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '2px solid var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            animation: 'float 3s infinite'
          }}>
            <CheckCircle size={32} color="var(--color-success)" />
          </div>
          <h2 style={{ fontSize: '32px', color: '#fff' }}>Cognitive Twin Compiled!</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px' }}>
            We analyzed your question times, coordinate patterns, and transcript responses to establish your baseline neural map.
          </p>
        </div>

        {/* Core Profile Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: '24px'
        }}>
          {/* Left panel - stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <GlassCard glow="cyan" style={{ padding: '24px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={14} />
                <span>Diagnostic Baseline</span>
              </span>
              <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mastery Score</span>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{profile.score}%</div>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '24px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Confidence Est.</span>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '4px' }}>{profile.confidence_level}%</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard glow="indigo" style={{ padding: '24px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-accent)', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                <BarChart2 size={14} />
                <span>Learning Style Blend</span>
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {Object.entries(profile.learning_style).map(([style, val]) => (
                  <div key={style} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#fff', fontWeight: 500 }}>{style} Learner</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{val}%</span>
                    </div>
                    {/* Visual progress bar */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
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

          {/* Right panel - Knowledge graph preview */}
          <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={14} />
              <span>Initial Knowledge Map</span>
            </span>

            {/* Knowledge graph preview component */}
            <KnowledgeGraph data={profile.knowledge_map} />
          </GlassCard>
        </div>

        <button onClick={handleDashboardRedirect} className="btn-primary" style={{ width: '100%', padding: '16px', justifyContent: 'center' }}>
          <span>Enter Student Dashboard</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default CognitiveProfileSetup;
