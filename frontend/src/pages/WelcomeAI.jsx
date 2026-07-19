import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Sparkles, Brain, GraduationCap, Eye } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const WelcomeAI = () => {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: "Welcome to TutorFlow AI",
      tagline: "Your Personal AI Mathematics Companion",
      desc: "TutorFlow is not a basic question bank. It is an empathetic math mentor that builds a replica of your understanding to guide you step-by-step through algebraic concepts.",
      icon: Sparkles,
      color: "var(--color-secondary)"
    },
    {
      title: "The Cognitive Twin Module",
      tagline: "Your Mind, Mapped Digitally",
      desc: "Every mistake is an opportunity. Our database tracks your specific misconception nodes, updates your forgetting retention curve daily, and predicts concepts you might struggle with in the future.",
      icon: Brain,
      color: "var(--color-accent)"
    },
    {
      title: "Flagship Classroom & Replay",
      tagline: "Whiteboard OCR & Whisper Voice Audio",
      desc: "Write equations on our interactive whiteboard or speak your reasoning out loud. Our real-time computer vision analyzes your strokes and vocal speed to gauge cognitive fatigue.",
      icon: GraduationCap,
      color: "var(--color-primary)"
    },
    {
      title: "Explainable AI (XAI) Dashboard",
      tagline: "Full Heuristics Transparency",
      desc: "Inspect our AI's decision pathways at any time. We list our diagnostic evidence, classification confidence levels, and explain exactly why we switched from textual to visual strategies.",
      icon: Eye,
      color: "var(--color-success)"
    }
  ];

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      navigate('/subjects');
    }
  };

  const handlePrev = () => {
    if (slide > 0) setSlide(slide - 1);
  };

  const CurrentIcon = slides[slide].icon;

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <GlassCard glow="indigo" style={{ width: '100%', maxWidth: '680px', padding: '40px', position: 'relative' }} className="animate-fade-in">
        {/* Step indicator */}
        <div style={{
          position: 'absolute',
          top: '24px',
          right: '40px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          fontWeight: 'bold'
        }}>
          STEP {slide + 1} OF 4
        </div>

        {/* Dynamic Icon */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '12px',
          background: `rgba(255,255,255,0.03)`,
          border: `1px solid ${slides[slide].color}`,
          boxShadow: `0 0 15px ${slides[slide].color}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
          transition: 'all 0.3s'
        }}>
          <CurrentIcon size={30} color={slides[slide].color} />
        </div>

        {/* Text Contents */}
        <div style={{ minHeight: '180px', transition: 'all 0.2s' }}>
          <span style={{ fontSize: '13px', color: slides[slide].color, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {slides[slide].tagline}
          </span>
          <h2 style={{ fontSize: '32px', color: '#fff', marginTop: '6px', marginBottom: '16px' }}>
            {slides[slide].title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>
            {slides[slide].desc}
          </p>
        </div>

        {/* Dot Indicators */}
        <div style={{ display: 'flex', gap: '8px', margin: '30px 0 10px 0' }}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === slide ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
          <button
            onClick={handlePrev}
            disabled={slide === 0}
            className="btn-secondary"
            style={{
              padding: '10px 16px',
              visibility: slide === 0 ? 'hidden' : 'visible'
            }}
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>

          <button
            onClick={handleNext}
            className="btn-primary"
            style={{ padding: '10px 24px' }}
          >
            <span>{slide === slides.length - 1 ? 'Go to Subjects' : 'Continue'}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default WelcomeAI;
