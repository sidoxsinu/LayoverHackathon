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
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        width: '40px',
        height: '40px',
        backgroundColor: muted ? '#34322C' : 'transparent',
        color: muted ? '#8C887C' : '#E6E1D3',
        border: `1px solid ${muted ? '#34322C' : '#8C887C'}`,
        borderRadius: '2px',
        fontFamily: 'var(--font-plex), monospace',
        fontWeight: 'bold',
        fontSize: '10px',
        zIndex: 9999,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textTransform: 'uppercase',
      }}
    >
      {muted ? 'MUTE' : 'ON'}
    </button>
  );
}
