'use client';

import { VaporCountdown } from '@/components/ui/countdown-vapor-digits';

interface Props {
  targetDate: number;
  phase: 'free' | 'headsup' | 'urgent' | 'alarm';
}

export default function Countdown({ targetDate, phase }: Props) {
  const color = phase === 'alarm' ? '#C8201A' : phase === 'urgent' ? '#F2A900' : '#F2A900';

  return (
    <div
      style={{
        borderTop: '1px solid #34322C',
        borderBottom: '1px solid #34322C',
        backgroundColor: '#181816',
        padding: '20px 16px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-barlow), sans-serif',
          fontSize: '14px',
          letterSpacing: '0.2em',
          color: '#8C887C',
          marginBottom: '12px',
        }}
      >
        RETURN TO GATE IN
      </div>
      <VaporCountdown
        targetDate={targetDate}
        color={color}
        className={phase === 'urgent' ? 'animate-blink' : ''}
      />
    </div>
  );
}
