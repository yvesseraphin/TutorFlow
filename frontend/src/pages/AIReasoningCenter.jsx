import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  HelpCircle, 
  AlertTriangle, 
  Award, 
  TrendingUp, 
  Settings, 
  Layers,
  ChevronRight,
  Database
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { api } from '../lib/api';

const AIReasoningCenter = () => {
  const [insight, setInsight] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReasoningData();
  }, []);

  const fetchReasoningData = async () => {
    try {
      const insData = await api('/reasoning/active-insight');
      setInsight(insData);

      const rulesData = await api('/reasoning/rules');
      setRules(rulesData);
    } catch (err) {
      setError(err.message || 'Unable to load reasoning data.');
      return;
      setInsight({
        current_misconception: "Distributive-law confusion",
        confidence: 0.93,
        evidence: [
          "Whiteboard input: 3(x + 2) simplified as 3x + 2 at 10:24:10",
          "Chat input: '2(a - 4) is 2a - 4' at 10:24:45",
          "Diagnostic question #3 whiteboard strokes showed expansion of terms without constant multiplication"
        ],
        strategy_chosen: "Visual Grid Explanation (Area Model)",
        strategy_rationale: "Socratic text explanations failed twice. Cognitive Twin profiles indicate the user has a 60% Visual learning preference, which responds better to geometric representations of algebraic properties.",
        suggested_intervention: "Switch to visual classroom view, render 3 blocks of (x+2) and ask student to sum components."
      });
      setRules([
        {
          misconception: "Distributive-law confusion",
          heuristics: ["a(b + c) = ab + c", "a(b - c) = ab - c"],
          intervention_hierarchy: [
            { attempt: 1, strategy: "Socratic questioning (verify terms)" },
            { attempt: 2, strategy: "Substitution method (substitute numbers)" },
            { attempt: 3, strategy: "Visual Area Model (geometric grid)" }
          ]
        },
        {
          misconception: "Sign mistakes",
          heuristics: ["-a(-b + c) = ab + ac", "-a * -b = -ab"],
          intervention_hierarchy: [
            { attempt: 1, strategy: "Double negative rules highlight" },
            { attempt: 2, strategy: "Interactive number line step-back" }
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
        <div className="glow-text-cyan" style={{ fontSize: '18px', fontWeight: 'bold' }}>Syncing explainable reasoning nodes...</div>
      </div>
    );
  }

  if (error) return <div style={{ padding: '24px', color: '#b91c1c' }}>{error}</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div>
        <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 'bold', textTransform: 'uppercase' }}>Explainable AI Engine</span>
        <h2 style={{ fontSize: '28px', color: '#fff' }}>AI Reasoning Center</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Inspect the logic paths and classifier outputs explaining why TutorFlow selects teaching methods.
        </p>
      </div>

      {/* Main Grid: Active Misconception Diagnostics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '24px'
      }}>
        
        {/* Left Side: Heuristic details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <GlassCard glow="indigo" style={{ padding: '30px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Active Logic Branch</span>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 20px 0' }}>
              <h3 style={{ fontSize: '22px', color: '#fff', fontWeight: 'bold' }}>
                {insight.current_misconception || 'No active misconception'}
              </h3>
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid var(--color-primary)',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 'bold',
                color: 'var(--color-primary)'
              }}>
                {Math.round(insight.confidence * 100)}% Confidence
              </div>
            </div>

            {/* Why Strategy chosen details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Strategy Selection Reasoning</span>
                <div style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  padding: '16px',
                  borderRadius: '10px',
                  marginTop: '6px',
                  fontSize: '13.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5
                }}>
                  <strong style={{ display: 'block', color: '#fff', marginBottom: '6px' }}>Chosen Strategy: {insight.strategy_chosen}</strong>
                  {insight.strategy_rationale}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Suggested Intervention Path</span>
                <p style={{ fontSize: '14px', color: 'var(--color-success)', fontWeight: 600, marginTop: '4px' }}>
                  {insight.suggested_intervention}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Heuristic classifier rules list */}
          <GlassCard style={{ padding: '30px' }}>
            <h4 style={{ fontSize: '16px', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={16} color="var(--color-secondary)" />
              <span>Pedagogical Classification Heuristics</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {rules.map((rule, idx) => (
                <div key={idx} style={{ borderBottom: idx < rules.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', paddingBottom: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{rule.misconception}</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0' }}>
                    {rule.heuristics.map((h, hIdx) => (
                      <span key={hIdx} style={{ fontSize: '10px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                        {h}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Intervention Order: {rule.intervention_hierarchy.map(item => item.strategy).join(" → ")}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Side: Evidence Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <GlassCard style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="var(--color-secondary)" />
              <span>Evidence Classifier Database</span>
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              The specific telemetry and coordinate logs triggers leading to active classifications.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {insight.evidence.map((item, i) => (
                <div key={i} style={{
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.03)',
                  border: '1px solid rgba(239, 68, 68, 0.08)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4
                }}>
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};

export default AIReasoningCenter;
