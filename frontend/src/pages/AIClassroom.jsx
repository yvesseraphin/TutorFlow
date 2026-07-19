import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Mic, 
  MicOff, 
  Hand, 
  MessageSquare, 
  HelpCircle, 
  Pause, 
  BookOpen, 
  Flame, 
  Settings, 
  CornerDownLeft,
  ChevronRight,
  TrendingUp,
  Volume2,
  Clock,
  RotateCcw
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Whiteboard from '../components/Whiteboard';
import Avatar3D from '../components/Avatar3D';

const AIClassroom = () => {
  const [activeTab, setActiveTab] = useState('classroom'); // classroom, overview, practice, voice, replay
  const [session, setSession] = useState(null);
  
  // Interactive Chat/Logic states
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState([]);
  const [currentExplanation, setCurrentExplanation] = useState(
    "Welcome! Today we are working on Distributive Parentheses Expansion. A common equation is: 3(x + 2) = 18. Write down your steps on the whiteboard to solve for x."
  );
  const [aiFeedback, setAiFeedback] = useState("Awaiting your first step. Write on the whiteboard or talk through the microphone.");
  const [hint, setHint] = useState("Remember: distribute the term outside parentheses by multiplying it by both items inside.");
  const [detectedMisconception, setDetectedMisconception] = useState(null);
  const [confidenceMeter, setConfidenceMeter] = useState(1.0);
  const [avatarState, setAvatarState] = useState('explaining');
  const [timeline, setTimeline] = useState([
    { timestamp: "00:00", item: "Lesson initiated: Algebra basics", category: "system" },
    { timestamp: "00:30", item: "Tutor introduced equation goal", category: "avatar" }
  ]);

  // Voice States
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLogs, setVoiceLogs] = useState([
    { speaker: "tutor", text: "Please isolate the variable x from 3(x + 2) = 18." }
  ]);

  // Whiteboard Replay Telemetry
  const [replayStrokes, setReplayStrokes] = useState([]);
  const [isReplaying, setIsReplaying] = useState(false);

  // Initial setup load
  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/v1/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic: "Distributive Expansion" })
      });
      const data = await res.json();
      setSession(data);
    } catch (err) {
      console.warn('Backend offline, running classroom session locally.');
      setSession({ id: 999, topic: "Distributive Expansion" });
    }
  };

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;
    
    // Add to student local logs
    const newLogs = [...chatLogs, { speaker: "student", text: textToSend }];
    setChatLogs(newLogs);
    setChatInput('');
    setAvatarState('thinking');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/api/v1/session/${session.id}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_input: textToSend
        })
      });
      const data = await res.json();
      
      setCurrentExplanation(data.explanation);
      setAiFeedback(data.ai_feedback);
      setHint(data.hint);
      setDetectedMisconception(data.detected_misconception);
      setConfidenceMeter(data.confidence_meter);
      setTimeline(data.timeline);
      setAvatarState(data.detected_misconception ? 'thinking' : 'explaining');
      
      setChatLogs(prev => [...prev, { speaker: "tutor", text: data.explanation }]);
    } catch (err) {
      // Local fallback simulator logic matching backend misconception classifier
      setTimeout(() => {
        const inputLower = textToSend.toLowerCase();
        let explanation = "Try dividing both sides of 3(x + 2) = 18 by 3, or expand the expression first.";
        let feedback = "Good effort! Let's check how you distribute.";
        let localHint = "3 * x is 3x. What is 3 * 2?";
        let misconception = null;
        let confidence = 1.0;

        if (inputLower.includes("3x + 2") || inputLower.includes("3x+2")) {
          misconception = "Distributive-law confusion";
          confidence = 0.93;
          explanation = "A common mistake when expanding expressions like 3(x + 2) is only multiplying the first term. Let's think about this: 3(x + 2) means we have three copies of (x + 2). What does that sum up to?";
          feedback = "Careful: you distributed the 3 to the x, but forgot to multiply it by the 2!";
          localHint = "A term outside parenthesis scales everything inside. Multiply both x and 2 by 3.";
        } else if (inputLower.includes("solve") || inputLower.includes("x =") || inputLower.includes("x=")) {
          explanation = "Excellent. Subtracting 6 from both sides of 3x + 6 = 18 gives 3x = 12. Therefore x = 4. Correct!";
          feedback = "Perfect variable isolation! 100% correct.";
          setAvatarState('celebrating');
        }

        setCurrentExplanation(explanation);
        setAiFeedback(feedback);
        setHint(localHint);
        setDetectedMisconception(misconception);
        setConfidenceMeter(confidence);
        setChatLogs(prev => [...prev, { speaker: "tutor", text: explanation }]);
        if (!misconception && avatarState !== 'celebrating') setAvatarState('explaining');
      }, 1000);
    }
  };

  const handleWhiteboardSolve = async (whiteboardData) => {
    setAvatarState('thinking');
    // Save whiteboard strokes for replay feature
    setReplayStrokes(whiteboardData.strokes);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/api/v1/session/${session.id}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_input: "Drawing updated steps on whiteboard.",
          whiteboard_image_base64: whiteboardData.image,
          whiteboard_strokes: whiteboardData.strokes
        })
      });
      const data = await res.json();
      
      setCurrentExplanation(data.explanation);
      setAiFeedback(data.ai_feedback);
      setHint(data.hint);
      setDetectedMisconception(data.detected_misconception);
      setConfidenceMeter(data.confidence_meter);
      setAvatarState(data.detected_misconception ? 'thinking' : 'explaining');
    } catch (err) {
      // Simulate whiteboard OCR analysis locally
      setTimeout(() => {
        setCurrentExplanation("I scanned your whiteboard writing. It looks like you simplified 3(x + 2) to 3x + 2. Check the brackets multiplication again.");
        setAiFeedback("Strokes analyzed. Hesitation score: low, but distributive error identified.");
        setDetectedMisconception("Distributive-law confusion");
        setConfidenceMeter(0.94);
        setAvatarState('thinking');
      }, 1000);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setAvatarState('thinking');
      // Mock vocal transcription
      const studentSpeech = "I solved 3(x + 2) and got 3x plus 2. Is that correct?";
      setVoiceLogs(prev => [...prev, { speaker: "student", text: studentSpeech }]);
      handleSendMessage(studentSpeech);
    } else {
      setIsRecording(true);
      setAvatarState('listening');
    }
  };

  const simulateWhiteboardReplay = () => {
    setIsReplaying(true);
    // Draw strokes step by step on a small overlay or log console
    setTimeout(() => {
      setIsReplaying(false);
    }, 3000);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Session Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>FLAGSHIP WORKSPACE</span>
          <h2 style={{ fontSize: '28px', color: '#fff' }}>Classroom: Distributive Property</h2>
        </div>

        {/* Tab switchers (Subpages) */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px',
          padding: '4px'
        }}>
          {[
            { id: 'classroom', label: 'Whiteboard Classroom' },
            { id: 'overview', label: 'Lesson Overview' },
            { id: 'practice', label: 'Practice Mode' },
            { id: 'voice', label: 'Voice Conversation' },
            { id: 'replay', label: 'Whiteboard Replay' }
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

      {/* Flagship Panel Layout (Only visible if activeTab === 'classroom') */}
      {activeTab === 'classroom' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr 300px',
          gap: '20px',
          height: 'calc(100vh - 200px)'
        }}>
          
          {/* LEFT PANEL: Avatar & Explanations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            <GlassCard style={{ padding: '16px', flexShrink: 0 }}>
              <Avatar3D state={avatarState} />
            </GlassCard>

            <GlassCard style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>Tutor Explanation</h4>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
                {currentExplanation}
              </p>
              
              {/* Timeline widget */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Lesson Timeline</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', maxHeight: '100px', overflowY: 'auto' }}>
                  {timeline.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                      <span style={{ color: 'var(--color-secondary)' }}>{item.timestamp}</span>
                      <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* CENTER PANEL: Canvas Whiteboard & Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <GlassCard style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyItems: 'center' }}>
              {/* Equations Editor helper shortcuts */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {["3(x + 2) = 18", "4(y - 5) = -12", "-2(x - 3) = 10"].map(eq => (
                  <button 
                    key={eq}
                    onClick={() => handleSendMessage(`Let's solve ${eq}`)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Load: {eq}
                  </button>
                ))}
              </div>

              <Whiteboard onSolveStep={handleWhiteboardSolve} initialQuestion="Simplify 3(x + 2) = 18" />
            </GlassCard>
            
            {/* Bottom Bar: Chat input & quick commands */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button 
                onClick={toggleRecording}
                className="btn-secondary"
                style={{
                  width: '46px',
                  height: '46px',
                  padding: 0,
                  borderRadius: '50%',
                  background: isRecording ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)',
                  borderColor: isRecording ? 'var(--color-danger)' : 'rgba(255,255,255,0.08)',
                  color: isRecording ? 'var(--color-danger)' : '#fff'
                }}
                title="Microphone (Speech Dialogue)"
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Type algebraic steps or ask TutorFlow a question..."
                  className="form-input"
                  style={{ width: '100%', paddingRight: '46px' }}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
                />
                <button
                  onClick={() => handleSendMessage(chatInput)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <CornerDownLeft size={16} />
                </button>
              </div>

              <button 
                onClick={() => handleSendMessage("I am raising my hand. I need help solving this equation.")}
                className="btn-secondary" 
                style={{ display: 'flex', gap: '6px', fontSize: '13px', padding: '12px 16px' }}
                title="Raise Hand gesture"
              >
                <Hand size={16} color="var(--color-warning)" />
                <span>Raise Hand</span>
              </button>

              <button 
                onClick={() => handleSendMessage("Can we pause the session and review the basic multiplication rules?")}
                className="btn-secondary" 
                style={{ padding: '12px' }}
                title="Pause"
              >
                <Pause size={16} />
              </button>
            </div>
          </div>

          {/* RIGHT PANEL: AI Feedback & Misconception diagnostics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <GlassCard style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Live AI Feedback</span>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '8px', lineHeight: 1.4 }}>
                  {aiFeedback}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Strategy Hint Box</span>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                  {hint}
                </p>
              </div>
            </GlassCard>

            {/* Misconception Diagnostic Display */}
            <GlassCard glow={detectedMisconception ? 'indigo' : ''} style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Neural Diagnostics</span>
                <h4 style={{ fontSize: '15px', color: '#fff', fontWeight: 'bold', marginTop: '6px' }}>Misconception Classifier</h4>
              </div>

              {detectedMisconception ? (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-danger)' }}>{detectedMisconception}</span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', background: 'rgba(239,68,68,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-danger)' }}>
                      {Math.round(confidenceMeter * 100)}% Conf.
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    The AI detected you expanded the parenthesis term without distributing to the second constant term.
                  </p>
                </div>
              ) : (
                <div style={{ textItems: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
                  No active misconception flagged. Keep writing to analyze logic.
                </div>
              )}

              {/* Confidence Meter gauge */}
              <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span>Student Confidence Meter</span>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>{Math.round(confidenceMeter * 100)}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${confidenceMeter * 100}%`, 
                    height: '100%', 
                    background: confidenceMeter < 0.6 ? 'var(--color-danger)' : confidenceMeter < 0.85 ? 'var(--color-warning)' : 'var(--color-success)',
                    transition: 'all 0.3s'
                  }} />
                </div>
              </div>
            </GlassCard>
          </div>

        </div>
      )}

      {/* Subpage 9.1: Lesson Overview */}
      {activeTab === 'overview' && (
        <GlassCard style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '24px', color: '#fff', marginBottom: '8px' }}>Topic: Distributive Parentheses Expansion</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            Learn how to distribute constants and algebraic terms across grouped parentheses brackets.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '15px', color: 'var(--color-secondary)', fontWeight: 'bold', marginBottom: '8px' }}>Objectives</h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <li>Identify positive and negative signs outside grouping brackets.</li>
                <li>Multiply single variables/coefficients across grouped variables.</li>
                <li>Evaluate expansions using geometric grid rectangular boxes.</li>
                <li>Isolate variables in equations like 3(x + 2) = 18.</li>
              </ul>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', display: 'flex', gap: '40px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Estimated Duration</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={18} color="var(--color-secondary)" />
                  <span>15 Minutes</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Difficulty Rank</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>Medium Core</div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Subpage 9.2: Practice Mode */}
      {activeTab === 'practice' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          <GlassCard style={{ padding: '30px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Exercises Arena</span>
            <h3 style={{ fontSize: '22px', color: '#fff', marginTop: '6px', marginBottom: '20px' }}>Solve Timed Problem</h3>
            
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Problem 1 of 3:</span>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', margin: '12px 0', fontFamily: 'monospace' }}>
                -4(x - 3) = 16
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 'bold' }}>⏳ Time Left: 54 Seconds</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {["x = -1", "x = -7", "x = 7", "x = 1"].map((ans, idx) => (
                <button
                  key={idx}
                  onClick={() => alert(`Submitted response: ${ans}`)}
                  className="btn-secondary"
                  style={{ padding: '14px', justifyContent: 'flex-start' }}
                >
                  {ans}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>Challenge Leaderboard</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Complete the timed algebraic expansion puzzles to unlock badges.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', color: '#fff' }}>1. Sarah Jenkins</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-success)' }}>280 pts</span>
              </div>
              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', color: '#fff' }}>2. Alex Mercer (You)</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-secondary)' }}>210 pts</span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Subpage 9.3: Voice Conversation */}
      {activeTab === 'voice' && (
        <GlassCard style={{ padding: '30px', maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>Live Speech Transcription Log</h3>
            <button 
              onClick={toggleRecording}
              className="btn-primary"
              style={{
                background: isRecording ? 'var(--color-danger)' : 'var(--color-secondary)',
                boxShadow: isRecording ? '0 0 15px rgba(239,68,68,0.4)' : 'none'
              }}
            >
              <Mic size={16} />
              <span>{isRecording ? 'Mute' : 'Start Speech Dialogue'}</span>
            </button>
          </div>

          {/* Scrollable Dialogue Screen */}
          <div style={{
            height: '300px',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginBottom: '20px'
          }}>
            {voiceLogs.map((log, i) => (
              <div 
                key={i} 
                style={{
                  alignSelf: log.speaker === 'tutor' ? 'flex-start' : 'flex-end',
                  maxWidth: '75%',
                  background: log.speaker === 'tutor' ? 'rgba(99,102,241,0.1)' : 'rgba(6,182,212,0.1)',
                  border: log.speaker === 'tutor' ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(6,182,212,0.2)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px'
                }}
              >
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: log.speaker === 'tutor' ? 'var(--color-primary)' : 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {log.speaker === 'tutor' ? 'Tutor AI' : 'You (Student)'}
                </span>
                <p style={{ color: '#fff', lineHeight: 1.4 }}>"{log.text}"</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Subpage 9.4: Whiteboard Replay */}
      {activeTab === 'replay' && (
        <GlassCard style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>Whiteboard Replay Analytics</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Review drawing speeds and hesitation indices compiled from coordinates.
              </p>
            </div>
            <button 
              onClick={simulateWhiteboardReplay}
              disabled={replayStrokes.length === 0 && !isReplaying}
              className="btn-primary"
            >
              <RotateCcw size={16} />
              <span>{isReplaying ? 'Replaying Strokes...' : 'Replay Last Attempt'}</span>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '24px'
          }}>
            {/* Replay canvas screen */}
            <div style={{
              height: '240px',
              background: '#0f1016',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
              position: 'relative'
            }}>
              {isReplaying ? (
                <div className="glow-text-cyan animate-pulse" style={{ fontWeight: 'bold' }}>Replaying handwriting paths...</div>
              ) : (
                <span>{replayStrokes.length > 0 ? "Replay Ready. Press play to analyze drawing speed." : "No strokes recorded yet. Solve a problem on the board first."}</span>
              )}
            </div>

            {/* Speeds and telemetry diagnostics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Drawing Speed Category</span>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>Moderate - 24 points/sec</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hesitation Coefficient</span>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-warning)', marginTop: '2px' }}>0.48 (Hesitated near constants)</div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

    </div>
  );
};

export default AIClassroom;
