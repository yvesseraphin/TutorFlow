import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, ChevronRight, AlertCircle, HelpCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Whiteboard from '../components/Whiteboard';

const DiagnosticAssessment = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/diagnostic/questions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      } else {
        throw new Error('Failed to fetch questions');
      }
    } catch (err) {
      console.warn('Backend offline, using fallback diagnostic questions');
      // Fallback local questions
      setQuestions([
        {
          id: 1,
          type: "multiple_choice",
          question: "Solve for x in the equation: 3x - 7 = 14",
          options: ["x = 5", "x = 7", "x = 21/3", "x = -7"],
          correct_answer: "x = 7",
          hint: "Try adding 7 to both sides first."
        },
        {
          id: 2,
          type: "multiple_choice",
          question: "Expand the expression: -2(a - 4)",
          options: ["-2a - 8", "-2a + 8", "-2a - 4", "-2a + 4"],
          correct_answer: "-2a + 8",
          hint: "Be careful when multiplying two negative signs!"
        },
        {
          id: 3,
          type: "whiteboard_task",
          question: "Use the whiteboard to solve: 4(x + 3) = 16. Write down your steps.",
          instructions: "Click and drag to write on the whiteboard. When done, submit your strokes.",
          correct_answer: "x = 1",
          hint: "Divide by 4 first or expand the left side!"
        },
        {
          id: 4,
          type: "voice_question",
          question: "Listen to the prompt: 'Why is it important to perform the same operation on both sides of an equation?' Click the microphone and record your explanation.",
          instructions: "Hold the microphone icon to record your answer verbally.",
          correct_answer: "To keep the equation balanced / equivalence",
          hint: "Think of a balance scale."
        },
        {
          id: 5,
          type: "multiple_choice",
          question: "If 5x + 3 = 2x + 12, what is the value of x?",
          options: ["x = 3", "x = 5", "x = 9", "x = 15"],
          correct_answer: "x = 3",
          hint: "Subtract 2x from both sides first, then subtract 3."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleChoiceSelect = (option) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentIdx].id]: {
        question_id: questions[currentIdx].id,
        answer: option
      }
    }));
  };

  const handleWhiteboardSubmit = (data) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentIdx].id]: {
        question_id: questions[currentIdx].id,
        answer: "whiteboard_sub",
        drawing_strokes: data.strokes
      }
    }));
    handleNext();
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording, load mock transcription
      setIsRecording(false);
      const text = "We must do the same operation on both sides to keep the balance scale aligned. If we only subtract from one side, the equation becomes unbalanced and unequal.";
      setVoiceText(text);
      setAnswers(prev => ({
        ...prev,
        [questions[currentIdx].id]: {
          question_id: questions[currentIdx].id,
          answer: text,
          audio_transcript: text
        }
      }));
    } else {
      setIsRecording(true);
      setVoiceText('Listening to vocal reasoning...');
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitDiagnostic();
    }
  };

  const submitDiagnostic = async () => {
    setSubmitting(true);
    const payload = {
      answers: Object.values(answers),
      time_taken_seconds: 180
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/diagnostic/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('profile', JSON.stringify(result));
        navigate('/profile-setup');
      } else {
        throw new Error('Failed to submit results');
      }
    } catch (err) {
      console.warn('Backend failed, compiling mock profile results');
      const mockResult = {
        score: 80.0,
        confidence_level: 70.0,
        learning_style: { "Visual": 60.0, "Analytical": 25.0, "Example-driven": 15.0 },
        knowledge_map: {
          nodes: [
            {"id": "alg-1", "label": "Variables & Expressions", "status": "mastered", "mastery": 0.95},
            {"id": "alg-2", "label": "Linear Equations", "status": "mastered", "mastery": 0.85},
            {"id": "alg-3", "label": "Distributive Expansion", "status": "weak", "mastery": 0.42},
            {"id": "alg-4", "label": "Quadratic Functions", "status": "locked", "mastery": 0.0}
          ]
        }
      };
      localStorage.setItem('profile', JSON.stringify(mockResult));
      navigate('/profile-setup');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="glow-text-cyan" style={{ fontSize: '18px', fontWeight: 'bold' }}>Calibrating diagnostic curriculum...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const progressPercent = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{ width: '100%', maxWidth: '840px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '13px' }}>
          <span>Diagnostic Progress</span>
          <span>Question {currentIdx + 1} of {questions.length}</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', transition: 'width 0.3s ease' }} />
        </div>

        {/* Question Panel */}
        <GlassCard glow="indigo" style={{ padding: '36px' }} className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '24px' }}>
            <div style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid var(--color-primary)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'var(--color-primary)'
            }}>
              Q{currentQuestion.id}
            </div>
            <h3 style={{ fontSize: '20px', color: '#fff', lineHeight: 1.4, fontWeight: '600' }}>
              {currentQuestion.question}
            </h3>
          </div>

          {/* Question Tasks Rendering */}
          {currentQuestion.type === 'multiple_choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
              {currentQuestion.options.map((option, i) => {
                const isSelected = answers[currentQuestion.id]?.answer === option;
                return (
                  <button
                    key={i}
                    onClick={() => handleMultipleChoiceSelect(option)}
                    style={{
                      textAlign: 'left',
                      padding: '16px 20px',
                      borderRadius: '10px',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.06)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      fontSize: '15px',
                      fontWeight: isSelected ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'whiteboard_task' && (
            <div style={{ marginBottom: '30px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>{currentQuestion.instructions}</p>
              <Whiteboard 
                initialQuestion={currentQuestion.question}
                onSolveStep={handleWhiteboardSubmit} 
              />
            </div>
          )}

          {currentQuestion.type === 'voice_question' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', margin: '40px 0', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{currentQuestion.instructions}</p>
              
              <button
                onClick={toggleRecording}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: isRecording ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                  border: isRecording ? '2px solid var(--color-danger)' : '2px solid var(--color-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  outline: 'none',
                  animation: isRecording ? 'pulseGlow 1.2s infinite' : 'none',
                  transition: 'all 0.3s'
                }}
              >
                {isRecording ? <MicOff size={32} color="var(--color-danger)" /> : <Mic size={32} color="var(--color-secondary)" />}
              </button>

              <span style={{ fontSize: '14px', color: isRecording ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                {isRecording ? 'RECORDING VOICE REASONING... CLICK TO FINISH' : 'CLICK TO RECORD ANSWER'}
              </span>

              {voiceText && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  maxWidth: '500px',
                  lineHeight: 1.4
                }}>
                  <strong style={{ display: 'block', color: 'var(--color-secondary)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase' }}>Transcription Result</strong>
                  "{voiceText}"
                </div>
              )}
            </div>
          )}

          {/* Action buttons (Only show Next for multiple choice / voice, whiteboard has its own Solve submit button) */}
          {currentQuestion.type !== 'whiteboard_task' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id] || submitting}
                className="btn-primary"
                style={{ padding: '12px 28px' }}
              >
                <span>{currentIdx === questions.length - 1 ? (submitting ? 'Generating Twin...' : 'Finalize & Build Twin') : 'Next Task'}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default DiagnosticAssessment;
