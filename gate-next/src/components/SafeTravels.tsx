'use client';
import { fmtDuration } from '@/lib/time';

interface Props {
  survivedMs: number;
  missionsCompleted: number;
  xp: number;
  onNewLayover: () => void;
}

function rankFor(xp: number): string {
  if (xp >= 500) return 'GATE GUARDIAN';
  if (xp >= 300) return 'SEASONED TRAVELER';
  if (xp >= 150) return 'BOARDING VETERAN';
  if (xp >= 50)  return 'NERVOUS PASSENGER';
  return 'FIRST-TIMER';
}

export default function SafeTravels({ survivedMs, missionsCompleted, xp, onNewLayover }: Props) {
  const rank = rankFor(xp);

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#101010',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          fontFamily: 'var(--font-barlow), sans-serif',
          fontSize: '12px',
          letterSpacing: '0.25em',
          color: '#8C887C',
          marginBottom: '32px',
        }}
      >
        GATE / LAYOVER COMPLETE
      </div>

      {/* Stamp block */}
      <div
        style={{
          border: '2px solid #E6E1D3',
          padding: '32px 28px',
          transform: 'rotate(-3deg)',
          maxWidth: '320px',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Corner marks */}
        <div style={{ position: 'absolute', top: 6, left: 6, width: 12, height: 12, borderTop: '1px solid #8C887C', borderLeft: '1px solid #8C887C' }} />
        <div style={{ position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderTop: '1px solid #8C887C', borderRight: '1px solid #8C887C' }} />
        <div style={{ position: 'absolute', bottom: 6, left: 6, width: 12, height: 12, borderBottom: '1px solid #8C887C', borderLeft: '1px solid #8C887C' }} />
        <div style={{ position: 'absolute', bottom: 6, right: 6, width: 12, height: 12, borderBottom: '1px solid #8C887C', borderRight: '1px solid #8C887C' }} />

        <div
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '10px',
            letterSpacing: '0.3em',
            color: '#8C887C',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          LAYOVER PASSPORT
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '10px',
                letterSpacing: '0.2em',
                color: '#8C887C',
              }}
            >
              SURVIVED
            </div>
            <div
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '32px',
                fontWeight: '700',
                color: '#E6E1D3',
              }}
            >
              {fmtDuration(survivedMs)}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #34322C', paddingTop: '12px', display: 'flex', gap: '24px' }}>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  color: '#8C887C',
                }}
              >
                MISSIONS
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#E6E1D3',
                }}
              >
                {missionsCompleted}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  color: '#8C887C',
                }}
              >
                XP
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#F2A900',
                }}
              >
                {xp}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #34322C', paddingTop: '12px' }}>
            <div
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '10px',
                letterSpacing: '0.15em',
                color: '#8C887C',
              }}
            >
              RANK
            </div>
            <div
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '20px',
                fontWeight: '700',
                color: '#3F9B5B',
                letterSpacing: '0.05em',
              }}
            >
              {rank}
            </div>
          </div>
        </div>
      </div>

      {/* New layover button */}
      <div style={{ marginTop: '48px', width: '100%', maxWidth: '320px' }}>
        <button
          onClick={onNewLayover}
          style={{
            width: '100%',
            backgroundColor: '#F2A900',
            color: '#101010',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '20px',
            fontWeight: '700',
            letterSpacing: '0.15em',
            padding: '18px',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          START NEW LAYOVER
        </button>
      </div>
    </div>
  );
}
