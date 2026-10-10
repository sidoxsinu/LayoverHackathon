'use client';

interface Stats {
  hunger: number;
  sanity: number;
  battery: number;
}

interface Props {
  stats: Stats;
  realBattery: number | null;
}

const STAT_DEFS = [
  { key: 'hunger' as const,  label: 'HUNGER',  unit: 'FOOD'   },
  { key: 'sanity' as const,  label: 'SANITY',  unit: 'MIND'   },
  { key: 'battery' as const, label: 'BATTERY', unit: 'PWR'    },
];

function StatRow({ label, value, low }: { label: string; value: number; low: boolean }) {
  const blocks = 10;
  const filled = Math.round((value / 100) * blocks);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 0',
        borderBottom: '1px solid #34322C',
        animation: low ? 'blink 1s steps(1) infinite' : 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-barlow), sans-serif',
          fontSize: '11px',
          letterSpacing: '0.15em',
          color: '#8C887C',
          width: '60px',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
        {Array.from({ length: blocks }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '14px',
              backgroundColor: i < filled
                ? value < 25
                  ? '#C8201A'
                  : value < 50
                  ? '#F2A900'
                  : '#3F9B5B'
                : '#34322C',
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-plex), monospace',
          fontSize: '12px',
          color: '#8C887C',
          width: '32px',
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}

export default function StatBar({ stats, realBattery }: Props) {
  const displayStats = {
    ...stats,
    battery: realBattery !== null ? realBattery : stats.battery,
  };

  return (
    <div
      style={{
        backgroundColor: '#181816',
        padding: '0 16px',
        borderBottom: '1px solid #34322C',
      }}
    >
      {STAT_DEFS.map(({ key, label }) => (
        <StatRow
          key={key}
          label={label}
          value={displayStats[key]}
          low={displayStats[key] < 25}
        />
      ))}
    </div>
  );
}
