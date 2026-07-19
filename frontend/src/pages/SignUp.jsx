import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Chrome, User, Mail, Lock, BookOpen } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState('9th Grade');
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const goalsList = [
    "Master Linear Equations",
    "Prepare for Exams",
    "Understand Graph Functions",
    "Identify Math Logic Errors",
    "Solve Factoring and Quadratics"
  ];

  const handleGoalToggle = (goal) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          full_name: fullName,
          school: "TutorFlow High School",
          grade: grade,
          learning_goals: selectedGoals
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/welcome');
      } else {
        const errData = await response.json();
        throw new Error(errData.detail || 'Sign up failed');
      }
    } catch (err) {
      console.warn('Backend failed, using mock signup', err);
      // Mock signup fallback
      const mockUser = {
        id: 101,
        email,
        full_name: fullName || 'New Learner',
        school: 'TutorFlow Academy',
        grade: grade,
        learning_goals: selectedGoals.length > 0 ? selectedGoals : ['Master Equations'],
        current_streak: 1,
        mastery_score: 0.0,
        confidence_score: 50.0,
        voice_settings: { voiceName: 'Default', speed: 1.0, pitch: 1.0 },
        ai_personality: 'Empathetic Tutor',
        theme: 'dark'
      };
      localStorage.setItem('token', 'mock-signup-jwt-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      navigate('/welcome');
    } finally {
      setLoading(false);
    }
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        width: '100%',
        maxWidth: '1000px',
        gap: '40px',
        alignItems: 'center'
      }}>
        {/* Left Side Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
          <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Personalized Mathematics
          </span>
          <h2 style={{ fontSize: '36px', color: '#fff', lineHeight: 1.1 }}>
            Build Your Math <br />
            <span style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Cognitive Profile</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.5 }}>
            By registering, TutorFlow prepares a customizable neural replica of your math understanding. We track:
          </p>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '14px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Spaced memory forgetting curves</li>
            <li>Misconception nodes and logic blocks</li>
            <li>Real-time speech dialogue speed</li>
            <li>Handwriting confidence patterns</li>
          </ul>
        </div>

        {/* Right Side: Signup Form */}
        <GlassCard glow="indigo" style={{ padding: '32px' }} className="animate-fade-in">
          <h3 style={{ fontSize: '22px', color: '#fff', marginBottom: '4px' }}>Create Student Profile</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
            Step 1 of your TutorFlow assessment setup.
          </p>

          <form onSubmit={handleSignUp}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Alex Mercer"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="alex@school.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="Create secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Grade Selection */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} />
                <span>Grade / Level</span>
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="form-input"
                style={{ background: 'rgba(0, 0, 0, 0.25)', cursor: 'pointer' }}
              >
                <option value="8th Grade">8th Grade (Pre-Algebra)</option>
                <option value="9th Grade">9th Grade (Algebra 1)</option>
                <option value="10th Grade">10th Grade (Geometry)</option>
                <option value="11th Grade">11th Grade (Algebra 2)</option>
                <option value="College">College Introductory Math</option>
              </select>
            </div>

            {/* Goals Checklist */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <span className="form-label">Select Learning Goals:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {goalsList.map(goal => {
                  const isChecked = selectedGoals.includes(goal);
                  return (
                    <button
                      type="button"
                      key={goal}
                      onClick={() => handleGoalToggle(goal)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: isChecked ? '1px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isChecked ? 'rgba(99, 102, 241, 0.15)' : 'rgba(0,0,0,0.15)',
                        color: isChecked ? '#fff' : 'var(--text-secondary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              <UserPlus size={18} />
              <span>{loading ? 'Creating Profile...' : 'Begin Registration'}</span>
            </button>
          </form>

          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'bold' }}>
              Log in
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
};

export default SignUp;
