'use client';
import { useState } from 'react';

interface LogEntry {
  id: string;
  text: string;
  status: 'completed' | 'skipped';
  xp: number;
  ts: number;
}

interface Props {
  log: LogEntry[];
  xp: number;
}

export default function MissionLog({ log, xp }: Props) {
  const [open, setOpen] = useState(false);

  if (log.length === 0) return null;

  return (
    <div
      style={{
        margin: '0 16px 12px',
        border: '1px solid #34322C',
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          backgroundColor: '#181816',
          border: 'none',
          cursor: 'pointer',
          textTransform: 'uppercase',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '12px',
            letterSpacing: '0.15em',
            color: '#8C887C',
          }}
        >
          MISSION LOG ({log.length})
        </span>
        <span
          style={{
            fontFamily: 'var(--font-plex), monospace',
            fontSize: '12px',
            color: '#F2A900',
          }}
        >
          {xp} XP {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div style={{ backgroundColor: '#101010' }}>
          {log.map((entry, i) => (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                borderTop: '1px solid #34322C',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  color: entry.status === 'completed' ? '#3F9B5B' : '#8C887C',
                  flexShrink: 0,
                  paddingTop: '1px',
                }}
              >
                {entry.status === 'completed' ? 'DONE' : 'SKIP'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '13px',
                  color: '#8C887C',
                  flex: 1,
                  lineHeight: '1.3',
                }}
              >
                {entry.text}
              </span>
              {entry.xp > 0 && (
                <span
                  style={{
                    fontFamily: 'var(--font-plex), monospace',
                    fontSize: '10px',
                    color: '#F2A900',
                    flexShrink: 0,
                  }}
                >
                  +{entry.xp}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
