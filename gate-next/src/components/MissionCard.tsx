'use client';
import { useState } from 'react';
import { Mission } from '@/lib/missions';

interface LogEntry {
  id: string;
  text: string;
  status: 'completed' | 'skipped';
  xp: number;
  ts: number;
}

interface Props {
  mission: Mission | null;
  xp: number;
  log: LogEntry[];
  onComplete: () => void;
  onSkip: () => void;
}

export default function MissionCard({ mission, xp, log, onComplete, onSkip }: Props) {
  const [flash, setFlash] = useState<'complete' | null>(null);

  const handleComplete = () => {
    setFlash('complete');
    setTimeout(() => {
      setFlash(null);
      onComplete();
    }, 1000);
  };

  if (!mission) return null;

  return (
    <div
      style={{
        margin: '12px 16px',
        backgroundColor: '#E6E1D3',
        border: '1px solid #34322C',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Flash overlay */}
      {flash === 'complete' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#3F9B5B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '32px',
              fontWeight: '700',
              color: 'white',
              letterSpacing: '0.15em',
            }}
          >
            COMPLETE
          </span>
        </div>
      )}

      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid #34322C',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: '#8C887C',
          }}
        >
          {mission.icon} / {mission.type}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-plex), monospace',
            fontSize: '10px',
            color: '#8C887C',
          }}
        >
          M-{String(Math.floor(Math.random() * 99 + 1)).padStart(2, '0')}
        </span>
      </div>

      {/* Mission text */}
      <div style={{ padding: '16px 12px' }}>
        <p
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '18px',
            fontWeight: '500',
            color: '#101010',
            lineHeight: '1.3',
            margin: 0,
            letterSpacing: '0.03em',
          }}
        >
          {mission.text}
        </p>
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            gap: '12px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '11px',
              color: '#8C887C',
            }}
          >
            {mission.mins} MIN
          </span>
          {mission.boost > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '11px',
                color: '#3F9B5B',
              }}
            >
              +{mission.boost} {mission.need.toUpperCase()}
            </span>
          )}
          <span
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '11px',
              color: '#8C887C',
            }}
          >
            +40 XP
          </span>
        </div>
      </div>

      {/* Tear line */}
      <div
        style={{
          height: '1px',
          borderTop: '1px dashed #34322C',
          margin: '0 12px',
        }}
      />

      {/* Action buttons */}
      <div style={{ display: 'flex' }}>
        <button
          onClick={handleComplete}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRight: '1px solid #34322C',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            color: '#101010',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          COMPLETE
        </button>
        <button
          onClick={onSkip}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            color: '#8C887C',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          SKIP
        </button>
      </div>

      {/* XP ticker */}
      <div
        style={{
          borderTop: '1px solid #34322C',
          padding: '6px 12px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-plex), monospace',
            fontSize: '10px',
            color: '#8C887C',
          }}
        >
          TOTAL XP
        </span>
        <span
          style={{
            fontFamily: 'var(--font-plex), monospace',
            fontSize: '10px',
            color: '#101010',
            fontWeight: '700',
          }}
        >
          {xp}
        </span>
      </div>
    </div>
  );
}
