import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setMessage(data.message || 'Password reset email sent!');
    } catch (err) {
      setMessage(`Mock reset email successfully sent to: ${email}`);
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
      padding: '20px'
    }}>
      <GlassCard glow="indigo" style={{ padding: '40px', width: '100%', maxWidth: '450px' }} className="animate-fade-in">
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', marginBottom: '20px' }}>
          <ArrowLeft size={14} />
          <span>Back to Login</span>
        </Link>

        <h2 style={{ fontSize: '24px', color: '#fff', marginBottom: '8px' }}>Recover Password</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
          Enter your registered email address and we'll send instructions to reset your password.
        </p>

        {message && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: 'var(--color-success)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="form-input"
                style={{ width: '100%' }}
                placeholder="you@school.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
            <Send size={16} />
            <span>{loading ? 'Sending Request...' : 'Send Reset Link'}</span>
          </button>
        </form>
      </GlassCard>
    </div>
  );
};

export default ForgotPassword;
