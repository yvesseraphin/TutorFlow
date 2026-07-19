import React from 'react';

const GlassCard = ({ children, className = '', glow = '', onClick }) => {
  let glowClass = '';
  if (glow === 'cyan') glowClass = 'glass-panel-glow-cyan';
  else if (glow === 'indigo') glowClass = 'glass-panel-glow-indigo';
  
  return (
    <div 
      onClick={onClick}
      className={`glass-panel ${glowClass} ${className}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </div>
  );
};

export default GlassCard;
