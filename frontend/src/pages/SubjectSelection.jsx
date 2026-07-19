import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Book, Flame, Compass, HelpCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const SubjectSelection = () => {
  const navigate = useNavigate();

  const subjects = [
    {
      id: "algebra",
      title: "Algebra & Linear Isolation",
      desc: "Solve linear equations, simplify fractions, expand distributive properties, and eliminate multiple variables.",
      active: true,
      questions: 5,
      estimated_time: "10 mins",
      icon: Compass,
      color: "var(--color-primary)"
    },
    {
      id: "physics",
      title: "Newtonian Physics & Mechanics",
      desc: "Examine forces, motion equations, gravitational fields, and velocity vector graphs.",
      active: false,
      coming_soon: true,
      icon: Flame,
      color: "var(--color-secondary)"
    },
    {
      id: "programming",
      title: "Python Data Structures",
      desc: "Implement sorting algorithms, arrays, nodes, binary trees, and dynamic programming layouts.",
      active: false,
      coming_soon: true,
      icon: Book,
      color: "var(--color-accent)"
    },
    {
      id: "chemistry",
      title: "Stoichiometry & Balances",
      desc: "Balance equation chemical formulas, calculate mole numbers, and review gas pressures.",
      active: false,
      coming_soon: true,
      icon: HelpCircle,
      color: "var(--color-success)"
    }
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Academic Core
          </span>
          <h2 style={{ fontSize: '36px', color: '#fff', marginTop: '6px' }}>Select Active Subject</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Choose a syllabus track to run your initial baseline diagnostic test.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px'
        }}>
          {subjects.map((sub) => {
            const SubIcon = sub.icon;
            return (
              <GlassCard
                key={sub.id}
                glow={sub.active ? 'indigo' : ''}
                style={{
                  padding: '30px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: sub.active ? 1 : 0.6,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {sub.coming_soon && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-secondary)',
                    padding: '4px 8px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    Future / Coming Soon
                  </div>
                )}

                <div>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${sub.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px'
                  }}>
                    <SubIcon size={20} color={sub.color} />
                  </div>

                  <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '8px' }}>{sub.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
                    {sub.desc}
                  </p>
                </div>

                {sub.active ? (
                  <button
                    onClick={() => navigate('/diagnostic')}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <span>Run Diagnostic ({sub.questions} Tasks)</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', cursor: 'not-allowed', opacity: 0.5 }}
                  >
                    <span>Locked</span>
                  </button>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubjectSelection;
