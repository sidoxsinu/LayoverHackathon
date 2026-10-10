'use client';
import { useEffect } from 'react';
import { stopAlarm } from '@/lib/alarm';
import { fmt } from '@/lib/time';

interface Props {
  gate: string;
  departureMs: number;
  now: number;
  onDismiss: () => void;
}

export default function GateAlarm({ gate, departureMs, now, onDismiss }: Props) {
  useEffect(() => {
    return () => stopAlarm();
  }, []);

  const msLeft = Math.max(0, departureMs - now);
  const mins = Math.floor(msLeft / 60000);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ animation: 'alarm 0.6s steps(1) infinite', backgroundColor: '#C8201A' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}
      >
        <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontSize: '14px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>
          GATE
        </span>
        <span style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
          {fmt(msLeft)}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-white text-center">
        <div
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '16px',
            letterSpacing: '0.2em',
            marginBottom: '12px',
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          RETURN TO GATE
        </div>

        <div
          style={{
            fontFamily: 'var(--font-plex), monospace',
            fontSize: 'clamp(80px, 40vw, 200px)',
            fontWeight: '700',
            lineHeight: '1',
            letterSpacing: '-0.02em',
          }}
        >
          {gate || 'TBA'}
        </div>

        {mins > 0 && (
          <div
            style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '22px',
              letterSpacing: '0.15em',
              marginTop: '16px',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            DEPARTS IN {mins} MIN
          </div>
        )}
      </div>

      {/* Dismiss button */}
      <div className="px-6 pb-12">
        <button
          onClick={onDismiss}
          style={{
            width: '100%',
            backgroundColor: 'white',
            color: '#C8201A',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '22px',
            fontWeight: '700',
            letterSpacing: '0.1em',
            padding: '18px',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          I AM AT THE GATE
        </button>
      </div>
    </div>
  );
}
