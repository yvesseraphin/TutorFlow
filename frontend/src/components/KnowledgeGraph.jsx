import React, { useState } from 'react';
import { BookOpen, CheckCircle, Lock, AlertTriangle } from 'lucide-react';

const KnowledgeGraph = ({ data, onNodeSelect }) => {
  const [selectedNode, setSelectedNode] = useState(null);

  // Setup static nodes and coordinates for drawing beautiful, clean graphs (Algebra map)
  const defaultNodes = [
    { id: "alg-1", label: "Variables & Expressions", status: "mastered", mastery: 0.95, x: 120, y: 150, desc: "Basics of coefficients and evaluating mathematical expressions." },
    { id: "alg-2", label: "Linear Equations", status: "mastered", mastery: 0.85, x: 280, y: 150, desc: "Isolating variables when solving ax + b = c." },
    { id: "alg-3", label: "Distributive Expansion", status: "weak", mastery: 0.42, x: 440, y: 90, desc: "Multiplying external terms across brackets: a(b + c)." },
    { id: "alg-4", label: "Combining Like Terms", status: "unlocked", mastery: 0.65, x: 440, y: 220, desc: "Simplifying expressions by summing common coefficient variables." },
    { id: "alg-5", label: "Systems of Equations", status: "locked", mastery: 0.0, x: 600, y: 150, desc: "Solving dual variables equations simultaneously." },
    { id: "alg-6", label: "Quadratic Factorization", status: "locked", mastery: 0.0, x: 600, y: 280, desc: "Factoring trinomials ax² + bx + c = 0." }
  ];

  const defaultEdges = [
    { source: "alg-1", target: "alg-2" },
    { source: "alg-2", target: "alg-3" },
    { source: "alg-1", target: "alg-4" },
    { source: "alg-4", target: "alg-3" },
    { source: "alg-3", target: "alg-6" },
    { source: "alg-2", target: "alg-5" }
  ];

  const nodes = data?.nodes || defaultNodes;
  const edges = data?.edges || defaultEdges;

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (onNodeSelect) onNodeSelect(node);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'mastered': return '#10b981'; // emerald
      case 'weak': return '#ef4444'; // rose
      case 'unlocked': return '#06b6d4'; // cyan
      default: return '#475569'; // slate
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '16px', position: 'relative' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '380px',
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        {/* Nodes and Connection Lines SVG */}
        <svg style={{ width: '100%', height: '100%' }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255, 255, 255, 0.15)" />
            </marker>
          </defs>

          {/* Draw Edges */}
          {edges.map((edge, idx) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            
            return (
              <line
                key={`edge-${idx}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={sourceNode.status === 'mastered' && targetNode.status !== 'locked' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.08)'}
                strokeWidth={2}
                markerEnd="url(#arrow)"
                strokeDasharray={targetNode.status === 'locked' ? '4 4' : '0'}
              />
            );
          })}

          {/* Draw Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const statusColor = getStatusColor(node.status);
            
            return (
              <g 
                key={node.id} 
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleNodeClick(node)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node Outer Glow */}
                <circle 
                  r={isSelected ? 22 : 16} 
                  fill="transparent" 
                  stroke={statusColor} 
                  strokeWidth={2}
                  style={{ 
                    opacity: isSelected ? 0.8 : 0.25,
                    filter: `drop-shadow(0 0 6px ${statusColor})`,
                    transition: 'all 0.2s'
                  }}
                />
                
                {/* Node Center Fill */}
                <circle 
                  r={isSelected ? 16 : 12} 
                  fill={node.status === 'locked' ? '#1e293b' : statusColor} 
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth={1}
                  style={{ transition: 'all 0.2s' }}
                />

                {/* Status Indicator Icon Overlay (e.g. check for mastered, lock for locked) */}
                {node.status === 'mastered' && (
                  <text y={4} x={-4} fill="#fff" fontSize="10px" fontWeight="bold">✓</text>
                )}
                {node.status === 'locked' && (
                  <text y={3} x={-3} fill="#94a3b8" fontSize="8px">🔒</text>
                )}

                {/* Node Label Text */}
                <text
                  y={32}
                  textAnchor="middle"
                  fill={isSelected ? '#fff' : 'var(--text-secondary)'}
                  fontSize="12px"
                  fontWeight={isSelected ? 'bold' : '500'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Legends */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          display: 'flex',
          gap: '12px',
          background: 'rgba(10, 11, 16, 0.75)',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '11px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> Mastered</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> Weak</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} /> Unlocked</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#475569' }} /> Locked</div>
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{selectedNode.label}</h4>
            <span className={`badge badge-${selectedNode.status}`}>{selectedNode.status}</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedNode.desc}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Mastery:</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: getStatusColor(selectedNode.status), marginTop: '2px' }}>
                {Math.round(selectedNode.mastery * 100)}%
              </div>
            </div>
            {selectedNode.status === 'weak' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)', fontSize: '12px' }}>
                <AlertTriangle size={16} />
                <span>Misconception identified: distributive properties.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraph;
