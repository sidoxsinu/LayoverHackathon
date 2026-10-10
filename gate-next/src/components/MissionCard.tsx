'use client';
import { useState } from 'react';
import { Mission } from '@/lib/missions';
import { PROOF_BONUS_XP } from '@/lib/verify';
import { MISSION_XP } from '@/lib/rank';

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
  gate?: string;
  onSafeReturn?: () => void;
  isProofDisabled?: boolean;
  onRequestProof?: () => void;
}

export default function MissionCard({
  mission,
  xp,
  log,
  onComplete,
  onSkip,
  gate,
  onSafeReturn,
  isProofDisabled = false,
  onRequestProof,
}: Props) {
  const [flash, setFlash] = useState<'complete' | null>(null);

  const handleComplete = () => {
    // If photo proof is available and not disabled by phase/time guard, trigger proof modal
    if (mission?.proof !== 'none' && !isProofDisabled && onRequestProof) {
      onRequestProof();
      return;
    }

    setFlash('complete');
    setTimeout(() => {
      setFlash(null);
      onComplete();
    }, 1000);
  };

  const isGateComplete = log.some((l) => l.id === 'go' && l.status === 'completed');

  if (isGateComplete) {
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
        {/* Top header strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderBottom: '1px solid #34322C',
            backgroundColor: '#101010',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.2em',
              color: '#3F9B5B',
            }}
          >
            GATE REACHED / FINAL
          </span>
          <span
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '11px',
              fontWeight: '700',
              color: '#F2A900',
            }}
          >
            GATE {gate || 'TBA'}
          </span>
        </div>

        {/* Main message body */}
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '10px',
              letterSpacing: '0.25em',
              color: '#8C887C',
              marginBottom: '6px',
            }}
          >
            ALL OBJECTIVES COMPLETED
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '32px',
              fontWeight: '900',
              color: '#101010',
              letterSpacing: '0.08em',
              lineHeight: '1',
              margin: '0 0 10px 0',
              textTransform: 'uppercase',
            }}
          >
            ENJOY YOUR JOURNEY
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '11px',
              color: '#101010',
              margin: 0,
              lineHeight: '1.4',
              letterSpacing: '0.02em',
            }}
          >
            STAND BY AT GATE FOR BOARDING ANNOUNCEMENT.
          </p>
        </div>

        {/* Perforated tear line */}
        <div
          style={{
            height: '1px',
            borderTop: '1px dashed #34322C',
            margin: '0 12px',
          }}
        />

        {/* Boarding pass style flight badge / status strip */}
        <div
          style={{
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#DCD6C5',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '9px',
                letterSpacing: '0.15em',
                color: '#8C887C',
              }}
            >
              STATUS
            </span>
            <span
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '13px',
                fontWeight: '700',
                color: '#3F9B5B',
              }}
            >
              READY TO BOARD
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '9px',
                letterSpacing: '0.15em',
                color: '#8C887C',
              }}
            >
              TOTAL SCORE
            </span>
            <span
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '13px',
                fontWeight: '700',
                color: '#101010',
              }}
            >
              {xp} XP
            </span>
          </div>
        </div>

        {/* Action Button: CONFIRM AT GATE / SAFE RETURN */}
        {onSafeReturn && (
          <div style={{ borderTop: '1px solid #34322C' }}>
            <button
              onClick={onSafeReturn}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#101010',
                border: 'none',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '15px',
                fontWeight: '700',
                color: '#E6E1D3',
                letterSpacing: '0.12em',
                cursor: 'pointer',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>CONFIRM AT GATE</span>
              <span style={{ color: '#F2A900' }}>[SAFE RETURN]</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!mission) {
    return (
      <div
        style={{
          margin: '12px 16px',
          backgroundColor: '#E6E1D3',
          border: '1px dashed #8C887C',
          borderRadius: '2px',
          padding: '40px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}
      >
        <span style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '12px', color: '#101010', animation: 'blink 1s infinite' }}>
          CONTACTING TOWER...
        </span>
        <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontSize: '16px', color: '#8C887C', letterSpacing: '0.05em' }}>
          GENERATING OBJECTIVE
        </span>
      </div>
    );
  }

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
          {mission.boost !== 0 && (
            <span
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '11px',
                color: mission.boost > 0 ? '#3F9B5B' : '#C8201A',
              }}
            >
              {mission.boost > 0 ? '+' : ''}{mission.boost} {mission.need.toUpperCase()}
            </span>
          )}
          {mission.need === 'hunger' && mission.boost > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '11px',
                color: '#3F9B5B',
              }}
            >
              +{Math.floor(mission.boost / 2)} ENERGY
            </span>
          )}
          <span
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '11px',
              color: '#8C887C',
            }}
          >
            +{MISSION_XP} XP
          </span>
          {mission.proof !== 'none' && (
            <span
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '11px',
                color: '#F2A900',
              }}
            >
              +{PROOF_BONUS_XP} PROOF
            </span>
          )}
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

      {/* Proof Disabled Banner if within 5 min or urgent */}
      {isProofDisabled && mission.proof !== 'none' && (
        <div
          style={{
            fontFamily: 'var(--font-plex), monospace',
            fontSize: '10px',
            color: '#8C887C',
            textAlign: 'center',
            padding: '6px 12px',
            backgroundColor: '#181816',
            borderBottom: '1px solid #34322C',
            letterSpacing: '0.05em',
          }}
        >
          PROOF OFF, LESS THAN 5 MIN LEFT
        </div>
      )}

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
