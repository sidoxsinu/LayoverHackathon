'use client';
import { useState, useEffect } from 'react';
import { setGlobalMute } from '@/lib/alarm';

export default function GlobalMuteButton() {
  const [muted, setMuted] = useState(false);

  // Sync to lib on mount and change
  useEffect(() => {
    setGlobalMute(muted);
  }, [muted]);

  return (
    <button
      onClick={() => setMuted(!muted)}
      aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
      title={muted ? 'SOUND OFF' : 'SOUND ON'}
      style={{
        width: '48px',
        height: '48px',
        minWidth: '48px',
        minHeight: '48px',
        backgroundColor: muted ? '#181816' : 'transparent',
        color: muted ? '#8C887C' : '#E6E1D3',
        border: `1px solid ${muted ? '#34322C' : '#8C887C'}`,
        borderRadius: '2px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
      }}
    >
      {muted ? (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path
            d="M3 7H7L12 3V17L7 13H3V7Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="miter"
          />
          <line x1="14.5" y1="7.5" x2="18.5" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="18.5" y1="7.5" x2="14.5" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path
            d="M3 7H7L12 3V17L7 13H3V7Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="miter"
          />
          <path
            d="M15 7.5A4 4 0 0 1 15 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            fill="none"
          />
          <path
            d="M17.5 5A7.5 7.5 0 0 1 17.5 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            fill="none"
          />
        </svg>
      )}
    </button>
  );
}
