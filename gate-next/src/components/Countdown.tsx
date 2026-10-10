'use client';

interface Props {
  msLeft: number;
  phase: 'free' | 'headsup' | 'urgent' | 'alarm';
}

export default function Countdown({ msLeft, phase }: Props) {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  const p = (n: number) => String(n).padStart(2, '0');
  const hh = p(Math.floor(s / 3600));
  const mm = p(Math.floor((s % 3600) / 60));
  const ss = p(s % 60);

  const color = phase === 'alarm' ? '#C8201A' : phase === 'urgent' ? '#F2A900' : '#F2A900';

  return (
    <div
      style={{
        borderTop: '1px solid #34322C',
        borderBottom: '1px solid #34322C',
        backgroundColor: '#181816',
        padding: '20px 16px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-barlow), sans-serif',
          fontSize: '11px',
          letterSpacing: '0.2em',
          color: '#8C887C',
          marginBottom: '8px',
        }}
      >
        RETURN TO GATE IN
      </div>
      <div
        style={{
          fontFamily: 'var(--font-plex), monospace',
          fontSize: 'clamp(48px, 14vw, 80px)',
          fontWeight: '700',
          color,
          letterSpacing: '-0.02em',
          lineHeight: '1',
          animation: phase === 'urgent' ? 'blink 1s steps(1) infinite' : 'none',
        }}
      >
        {hh}:{mm}:{ss}
      </div>
    </div>
  );
}
