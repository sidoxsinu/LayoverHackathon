'use client';
import { useEffect, useRef } from 'react';
import Countdown from './Countdown';
import StatBar from './StatBar';
import MissionCard from './MissionCard';
import MissionLog from './MissionLog';
import { Mission } from '@/lib/missions';
import { phaseFor } from '@/lib/time';

interface Stats {
  hunger: number;
  sanity: number;
  battery: number;
}

interface LogEntry {
  id: string;
  text: string;
  status: 'completed' | 'skipped';
  xp: number;
  ts: number;
}

interface Props {
  returnByMs: number;
  departureMs: number;
  gate: string;
  stats: Stats;
  mission: Mission | null;
  log: LogEntry[];
  xp: number;
  demo: boolean;
  now: number;
  realBattery: number | null;
  onComplete: () => void;
  onSkip: () => void;
  onSafeReturn: () => void;
}

export default function QuestScreen({
  returnByMs,
  departureMs,
  gate,
  stats,
  mission,
  log,
  xp,
  demo,
  now,
  realBattery,
  onComplete,
  onSkip,
  onSafeReturn,
}: Props) {
  const msLeft = returnByMs - now;
  const phase = phaseFor(msLeft, demo);
  const prevPhase = useRef(phase);

  // Chime on phase transitions
  useEffect(() => {
    if (prevPhase.current !== phase) {
      if (phase === 'headsup' || phase === 'urgent') {
        import('@/lib/alarm').then(({ chime }) => chime());
      }
      prevPhase.current = phase;
    }
  }, [phase]);

  const headsUpBanner = phase === 'headsup';
  const urgentBanner = phase === 'urgent';

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: urgentBanner ? '#101010' : '#101010',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '480px',
        margin: '0 auto',
        animation: urgentBanner ? 'urgent-bg 0.5s steps(1) infinite' : 'none',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #34322C',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '20px',
            fontWeight: '700',
            color: '#F2A900',
            letterSpacing: '-0.01em',
          }}
        >
          GATE
        </span>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {demo && (
            <span
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '10px',
                color: '#F2A900',
                border: '1px solid #F2A900',
                padding: '2px 6px',
              }}
            >
              DEMO
            </span>
          )}
          <span
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '14px',
              color: '#8C887C',
            }}
          >
            {gate}
          </span>
        </div>
      </div>

      {/* Heads-up banner */}
      {headsUpBanner && (
        <div
          style={{
            backgroundColor: '#181816',
            borderBottom: '1px solid #F2A900',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '14px',
              letterSpacing: '0.15em',
              color: '#F2A900',
            }}
          >
            START WRAPPING UP
          </span>
          <span
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '12px',
              color: '#F2A900',
            }}
          >
            15 MIN
          </span>
        </div>
      )}

      {/* Urgent banner */}
      {urgentBanner && (
        <div
          style={{
            backgroundColor: '#C8201A',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '18px',
              fontWeight: '700',
              letterSpacing: '0.15em',
              color: 'white',
            }}
          >
            WALK TO GATE NOW
          </span>
        </div>
      )}

      {/* Countdown */}
      <Countdown msLeft={msLeft} phase={phase} />

      {/* Stats */}
      <StatBar stats={stats} realBattery={realBattery} />

      {/* Missions */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: '4px' }}>
        <MissionCard
          mission={mission}
          xp={xp}
          log={log}
          onComplete={onComplete}
          onSkip={onSkip}
        />
        <MissionLog log={log} xp={xp} />
      </div>

      {/* Safe return button */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #34322C' }}>
        <button
          onClick={onSafeReturn}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            color: '#8C887C',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '14px',
            letterSpacing: '0.15em',
            padding: '12px',
            border: '1px solid #34322C',
            borderRadius: '2px',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          I AM AT THE GATE (EARLY)
        </button>
      </div>
    </div>
  );
}
