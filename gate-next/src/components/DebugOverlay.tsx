'use client';
import { useState } from 'react';

export default function DebugOverlay({ onAction }: { onAction: (action: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          width: '40px',
          height: '40px',
          backgroundColor: '#F2A900',
          color: '#101010',
          border: '1px solid #101010',
          borderRadius: '2px',
          fontFamily: 'var(--font-plex), monospace',
          fontWeight: 'bold',
          fontSize: '14px',
          zIndex: 9999,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {open ? 'X' : 'DEV'}
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          bottom: '64px',
          right: '16px',
          backgroundColor: '#181816',
          border: '1px solid #34322C',
          borderRadius: '2px',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 9999,
          minWidth: '160px'
        }}>
          <span style={{ 
            fontFamily: 'var(--font-barlow), sans-serif', 
            color: '#8C887C', 
            fontSize: '12px', 
            letterSpacing: '0.1em', 
            textAlign: 'center', 
            paddingBottom: '4px', 
            borderBottom: '1px solid #34322C' 
          }}>
            DEMO / DEV
          </span>
          <button onClick={() => onAction('trigger_alarm')} style={btnStyle}>TRIGGER ALARM</button>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => onAction('sub_minute')} style={{...btnStyle, flex: 1}}>-1 MIN</button>
            <button onClick={() => onAction('add_minute')} style={{...btnStyle, flex: 1}}>+1 MIN</button>
          </div>
          <button onClick={() => onAction('fast_forward')} style={btnStyle}>-1 HOUR</button>
          <button onClick={() => onAction('fill_stats')} style={btnStyle}>FILL STATS</button>
          <button onClick={() => onAction('drain_stats')} style={btnStyle}>DRAIN STATS</button>
          <button onClick={() => onAction('reset')} style={btnStyle}>HARD RESET</button>
        </div>
      )}
    </>
  );
}

const btnStyle = {
  backgroundColor: '#E6E1D3',
  color: '#101010',
  border: 'none',
  borderRadius: '2px',
  padding: '10px',
  fontFamily: 'var(--font-barlow), sans-serif',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer',
  textAlign: 'center' as const,
};
