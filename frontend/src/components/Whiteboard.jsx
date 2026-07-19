import React, { useRef, useState, useEffect } from 'react';
import { 
  Edit2, 
  Trash2, 
  RotateCcw, 
  RotateCw, 
  Eraser, 
  Square, 
  Circle, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const Whiteboard = ({ onSolveStep, initialQuestion }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushWidth, setBrushWidth] = useState(3);
  const [tool, setTool] = useState('pencil'); // pencil, eraser, square, circle
  const [strokes, setStrokes] = useState([]); // Array of stroke models to send to backend
  const [currentStroke, setCurrentStroke] = useState([]);
  const [history, setHistory] = useState([]); // for undo
  const [redoList, setRedoList] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Set display size
    canvas.width = canvas.parentElement.clientWidth * 2;
    canvas.height = 420 * 2;
    canvas.style.width = '100%';
    canvas.style.height = '420px';

    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = color;
    context.lineWidth = brushWidth;
    contextRef.current = context;
    
    // Fill dark background
    context.fillStyle = '#0f1016';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Update canvas properties on tool/color update
  useEffect(() => {
    if (!contextRef.current) return;
    contextRef.current.strokeStyle = tool === 'eraser' ? '#0f1016' : color;
    contextRef.current.lineWidth = tool === 'eraser' ? 24 : brushWidth;
  }, [color, brushWidth, tool]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    setCurrentStroke([{ x: offsetX, y: offsetY, time: Date.now() }]);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    
    if (tool === 'pencil' || tool === 'eraser') {
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
      setCurrentStroke(prev => [...prev, { x: offsetX, y: offsetY, time: Date.now() }]);
    }
  };

  const stopDrawing = ({ nativeEvent }) => {
    if (!isDrawing) return;
    contextRef.current.closePath();
    setIsDrawing(false);
    
    // Save to stroke list
    const newStroke = {
      tool,
      color: tool === 'eraser' ? '#0f1016' : color,
      points: currentStroke,
      thickness: tool === 'eraser' ? 24 : brushWidth
    };
    
    const updatedStrokes = [...strokes, newStroke];
    setStrokes(updatedStrokes);
    
    // Save canvas state to history buffer
    saveCanvasState();
    setRedoList([]);
  };

  const getCoordinates = (event) => {
    if (event.touches && event.touches.length > 0) {
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top
      };
    }
    return {
      offsetX: event.offsetX,
      offsetY: event.offsetY
    };
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    setHistory(prev => [...prev, canvas.toDataURL()]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    
    const prevHistory = [...history];
    const poppedState = prevHistory.pop();
    setRedoList(prev => [poppedState, ...prev]);
    setHistory(prevHistory);
    
    // Redraw
    const canvas = canvasRef.current;
    const context = contextRef.current;
    const img = new Image();
    
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
    };
    
    if (prevHistory.length > 0) {
      img.src = prevHistory[prevHistory.length - 1];
    } else {
      // Draw empty blackboard
      context.fillStyle = '#0f1016';
      context.fillRect(0, 0, canvas.width, canvas.height);
      setStrokes([]);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    context.fillStyle = '#0f1016';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    setHistory([]);
    setRedoList([]);
  };

  const handleSubmit = () => {
    if (onSolveStep) {
      const canvas = canvasRef.current;
      // Pass base64 image data and drawing telemetry strokes to callback
      onSolveStep({
        image: canvas.toDataURL('image/png'),
        strokes: strokes
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '12px' }}>
      {/* Board Header / Tools */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '8px 16px',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Tool Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', paddingRight: '16px' }}>
            <button 
              onClick={() => setTool('pencil')}
              style={{
                background: tool === 'pencil' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                border: 'none',
                color: tool === 'pencil' ? '#6366f1' : 'var(--text-secondary)',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Pencil"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={() => setTool('eraser')}
              style={{
                background: tool === 'eraser' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                border: 'none',
                color: tool === 'eraser' ? '#6366f1' : 'var(--text-secondary)',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Eraser"
            >
              <Eraser size={16} />
            </button>
          </div>

          {/* Color Palettes */}
          {tool !== 'eraser' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', paddingRight: '16px' }}>
              {['#ffffff', '#f59e0b', '#06b6d4', '#ec4899'].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transform: color === c ? 'scale(1.2)' : 'none',
                    transition: 'all 0.1s'
                  }}
                />
              ))}
            </div>
          )}

          {/* Width adjustment */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Brush:</span>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={brushWidth} 
              onChange={(e) => setBrushWidth(Number(e.target.value))}
              style={{ width: '60px', cursor: 'pointer', accentColor: '#6366f1' }}
            />
          </div>
        </div>

        {/* Undo, Clear, Solve */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={handleUndo} 
            disabled={history.length === 0}
            style={{
              background: 'transparent',
              border: 'none',
              color: history.length === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
              cursor: history.length === 0 ? 'not-allowed' : 'pointer',
              padding: '6px'
            }}
            title="Undo"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            onClick={handleClear} 
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px'
            }}
            title="Clear Board"
          >
            <Trash2 size={16} />
          </button>
          
          <button
            onClick={handleSubmit}
            className="btn-primary"
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              borderRadius: '6px'
            }}
          >
            <CheckCircle size={14} />
            <span>Analyze Answer</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
      }}>
        {initialQuestion && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(15, 16, 22, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '8px 12px',
            borderRadius: '8px',
            zIndex: 1,
            pointerEvents: 'none'
          }}>
            <span style={{ fontSize: '11px', color: '#06b6d4', textTransform: 'uppercase', fontWeight: 'bold' }}>Current Question:</span>
            <div style={{ fontSize: '14px', color: '#fff', fontWeight: 600, marginTop: '2px' }}>{initialQuestion}</div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ cursor: 'crosshair', display: 'block' }}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
