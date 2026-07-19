import React, { useEffect, useState } from 'react';

const Avatar3D = ({ state = 'explaining' }) => {
  const [pulse, setPulse] = useState(false);
  const [waves, setWaves] = useState([20, 40, 15, 30, 50, 20]);

  // Animate speech waves when explaining
  useEffect(() => {
    let interval;
    if (state === 'explaining') {
      interval = setInterval(() => {
        setWaves(prev => prev.map(() => Math.floor(Math.random() * 45) + 5));
      }, 100);
    } else if (state === 'thinking') {
      interval = setInterval(() => {
        setWaves(prev => prev.map((_, i) => Math.sin(Date.now() / 200 + i) * 15 + 20));
      }, 80);
    } else {
      setWaves([5, 5, 5, 5, 5, 5]);
    }
    return () => clearInterval(interval);
  }, [state]);

  const getGlowColor = () => {
    switch (state) {
      case 'listening': return 'rgba(6, 182, 212, 0.4)'; // cyan
      case 'thinking': return 'rgba(168, 85, 247, 0.4)'; // purple
      case 'celebrating': return 'rgba(16, 185, 129, 0.4)'; // green
      default: return 'rgba(99, 102, 241, 0.4)'; // indigo
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: '20px 0',
      background: 'rgba(255, 255, 255, 0.01)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.03)',
      boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)'
    }}>
      {/* SVG Avatar Container */}
      <div style={{
        position: 'relative',
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(18,20,30,1) 0%, rgba(8,9,14,1) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(255,255,255,0.05)',
        boxShadow: `0 0 25px ${getGlowColor()}`,
        transition: 'all 0.5s ease'
      }}>
        {/* Futuristic Grid Layer */}
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.15 }}>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#fff" strokeWidth="0.5"/>
          </pattern>
          <circle cx="70" cy="70" r="68" fill="url(#grid)" />
        </svg>

        {/* Dynamic Vector Avatar */}
        <svg width="90" height="90" viewBox="0 0 100 100" style={{ zIndex: 2 }}>
          {/* Head Shape */}
          <circle cx="50" cy="46" r="32" fill="url(#avatar-grad)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          
          {/* Head Gradients */}
          <defs>
            <radialGradient id="avatar-grad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1e1e38" />
              <stop offset="100%" stopColor="#0d0d1a" />
            </radialGradient>
            <linearGradient id="neon-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="neon-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {/* Ears / Cyber nodes */}
          <rect x="13" y="40" width="6" height="12" rx="3" fill="url(#neon-cyan)" />
          <rect x="81" y="40" width="6" height="12" rx="3" fill="url(#neon-cyan)" />

          {/* Eyes (react to states) */}
          <g transform="translate(0, 0)">
            {state === 'thinking' ? (
              <>
                {/* Horizontal squint line */}
                <line x1="32" y1="42" x2="42" y2="42" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                <line x1="58" y1="42" x2="68" y2="42" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : state === 'celebrating' ? (
              <>
                {/* Curved happy arch eyes */}
                <path d="M 32 45 Q 37 38 42 45" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                <path d="M 58 45 Q 63 38 68 45" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* Normal glowing circular eyes */}
                <circle cx="37" cy="42" r="5" fill="#06b6d4" filter="drop-shadow(0 0 3px #06b6d4)" />
                <circle cx="63" cy="42" r="5" fill="#06b6d4" filter="drop-shadow(0 0 3px #06b6d4)" />
                {/* Blink spots */}
                <circle cx="38.5" cy="40.5" r="1.5" fill="#fff" />
                <circle cx="64.5" cy="40.5" r="1.5" fill="#fff" />
              </>
            )}
          </g>

          {/* Glowing Mouth (animates if speaking) */}
          <g>
            {state === 'explaining' ? (
              <path d="M 42 62 Q 50 72 58 62" fill="none" stroke="#6366f1" strokeWidth="3.5" strokeLinecap="round" filter="drop-shadow(0 0 3px #6366f1)" />
            ) : state === 'celebrating' ? (
              <path d="M 40 58 Q 50 70 60 58 Z" fill="#10b981" />
            ) : state === 'thinking' ? (
              <line x1="45" y1="62" x2="55" y2="62" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
            ) : (
              // Listening/idle slightly smiling line
              <path d="M 44 60 Q 50 64 56 60" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
            )}
          </g>
          
          {/* Cybernetic Face lines */}
          <path d="M 50 20 L 50 30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <path d="M 30 55 Q 50 58 70 55" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
        </svg>

        {/* Decorative orbiting rings */}
        <div style={{
          position: 'absolute',
          width: '115px',
          height: '115px',
          borderRadius: '50%',
          border: '1px dashed rgba(255,255,255,0.1)',
          animation: 'spin-slow 15s linear infinite'
        }} />
      </div>

      {/* Speech Audio Wave Animation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '50px', marginTop: '16px' }}>
        {waves.map((h, i) => (
          <div
            key={i}
            style={{
              width: '4px',
              height: `${h}px`,
              background: state === 'celebrating' ? 'var(--color-success)' : state === 'thinking' ? 'var(--color-accent)' : 'var(--color-secondary)',
              borderRadius: '2px',
              transition: 'height 0.1s ease',
              boxShadow: state === 'explaining' ? '0 0 10px rgba(6,182,212,0.4)' : 'none'
            }}
          />
        ))}
      </div>

      {/* Avatar Label status */}
      <span style={{
        fontSize: '12px',
        fontWeight: 'bold',
        color: state === 'celebrating' ? 'var(--color-success)' : state === 'thinking' ? 'var(--color-accent)' : 'var(--color-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginTop: '8px'
      }}>
        {state === 'explaining' ? 'Tutor explaining' : state === 'listening' ? 'Listening...' : state === 'thinking' ? 'AI reasoning...' : 'Terrific job!'}
      </span>
    </div>
  );
};

export default Avatar3D;
