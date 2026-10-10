'use client';
import { useState, useEffect } from 'react';
import { nextOccurrence, schedule, fmtDuration, BUFFER_MIN, MARGIN_MIN } from '@/lib/time';
import { startStats } from '@/lib/missions';
import { arm } from '@/lib/alarm';
import { useNow } from '@/hooks/useNow';

type InputMode = 'time' | 'duration';

interface Props {
  onStart: (data: {
    departureMs: number;
    returnByMs: number;
    airportName: string;
    customMissions: any[];
    gate: string;
    walkMin: number;
    vibe: string;
    stats: { hunger: number; energy: number; battery: number };
    startedMs: number;
  }) => void;
  onDemo: () => void;
  tapCount: number;
  onWordmarkTap: () => void;
}

const WALK_OPTIONS = [2, 5, 10, 15];
const VIBES = ['wired', 'tired', 'hungry'];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-barlow), sans-serif',
        fontSize: '11px',
        letterSpacing: '0.2em',
        color: '#8C887C',
        marginBottom: '6px',
      }}
    >
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #34322C' }}>
      {children}
    </div>
  );
}

export default function SetupScreen({ onStart, onDemo, tapCount, onWordmarkTap }: Props) {
  const [inputMode, setInputMode] = useState<InputMode>('time');
  const [timeValue, setTimeValue] = useState('');
  const [durH, setDurH] = useState('2');
  const [durM, setDurM] = useState('0');
  const [gate, setGate] = useState('');
  const [walkMin, setWalkMin] = useState(10);
  const [vibe, setVibe] = useState('tired');
  const [error, setError] = useState('');
  const [airportName, setAirportName] = useState('LOCATING...');
  const [customMissions, setCustomMissions] = useState<any[]>([]);

  useEffect(() => {
    let active = true;

    const fetchAirport = async (lat: number, lon: number) => {
      try {
        const res = await fetch('/api/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lon })
        });
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        if (!active) return;
        setAirportName(data.airport || 'UNKNOWN AIRPORT');
        setCustomMissions(data.missions || []);
      } catch (e) {
        if (!active) return;
        setAirportName('UNKNOWN AIRPORT');
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchAirport(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          if (!active) return;
          setAirportName('UNKNOWN AIRPORT');
        }
      );
    } else {
      setAirportName('UNKNOWN AIRPORT');
    }

    return () => { active = false; };
  }, []);

  const now = useNow(1000);

  // Compute departureMs
  let departureMs = 0;
  if (inputMode === 'time' && timeValue) {
    departureMs = nextOccurrence(timeValue, now);
  } else if (inputMode === 'duration') {
    const h = parseInt(durH) || 0;
    const m = parseInt(durM) || 0;
    departureMs = now + (h * 60 + m) * 60_000;
  }

  const { returnByMs } = departureMs > 0
    ? schedule({ departureMs, walkMin })
    : { returnByMs: 0 };
  const safeMs = returnByMs - now;
  const safeOk = safeMs > 0;

  const departsLabel = departureMs > 0
    ? (() => {
        const d = new Date(departureMs);
        const isNextDay = d.getDate() !== new Date(now).getDate();
        const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        return isNextDay ? `DEPARTS TOMORROW ${t}` : `DEPARTS ${t}`;
      })()
    : '';

  const handleStart = async () => {
    if (!departureMs) { setError('SET A DEPARTURE TIME'); return; }
    if (!safeOk) { setError('YOU NEED TO HEAD TO THE GATE NOW.'); return; }
    setError('');
    await arm();
    onStart({
      departureMs,
      returnByMs,
      airportName,
      customMissions,
      gate: gate || 'TBA',
      walkMin,
      vibe,
      stats: startStats(vibe),
      startedMs: now,
    });
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: '#101010',
    color: '#E6E1D3',
    border: '1px solid #34322C',
    borderRadius: '2px',
    padding: '10px 12px',
    fontFamily: 'var(--font-plex), monospace',
    fontSize: '18px',
    outline: 'none',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const segBtnStyle = (active: boolean) => ({
    flex: 1,
    padding: '8px',
    backgroundColor: active ? '#F2A900' : 'transparent',
    color: active ? '#101010' : '#8C887C',
    border: 'none',
    borderRadius: '2px',
    fontFamily: 'var(--font-barlow), sans-serif',
    fontSize: '13px',
    fontWeight: '700' as const,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
  });

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#101010',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '24px 16px 16px',
          borderBottom: '1px solid #34322C',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={onWordmarkTap}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '40px',
              fontWeight: '700',
              color: '#F2A900',
              letterSpacing: '-0.01em',
            }}
          >
            GATE
          </span>
        </button>
        <span
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '11px',
            color: '#8C887C',
            letterSpacing: '0.15em',
          }}
        >
          LAYOVER COMPANION
        </span>
      </div>

      {/* Demo mode hint */}
      {tapCount > 0 && tapCount < 3 && (
        <div
          style={{
            padding: '4px 16px',
            backgroundColor: '#181816',
            fontFamily: 'var(--font-plex), monospace',
            fontSize: '10px',
            color: '#F2A900',
          }}
        >
          DEMO: {3 - tapCount} MORE TAP{3 - tapCount !== 1 ? 'S' : ''}
        </div>
      )}

      {/* Form */}
      <div style={{ flex: 1 }}>

        {/* Departure input mode toggle */}
        <Row>
          <Label>DEPARTURE</Label>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            <button style={segBtnStyle(inputMode === 'time')} onClick={() => setInputMode('time')}>
              TIME
            </button>
            <button style={segBtnStyle(inputMode === 'duration')} onClick={() => setInputMode('duration')}>
              IN X H Y M
            </button>
          </div>
          {inputMode === 'time' ? (
            <input
              type="time"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              style={inputStyle}
            />
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                value={durH}
                min="0"
                max="23"
                onChange={(e) => setDurH(e.target.value)}
                style={{ ...inputStyle, width: '80px', textAlign: 'center' }}
                placeholder="H"
              />
              <span style={{ fontFamily: 'var(--font-barlow), sans-serif', color: '#8C887C', fontSize: '16px' }}>H</span>
              <input
                type="number"
                value={durM}
                min="0"
                max="59"
                onChange={(e) => setDurM(e.target.value)}
                style={{ ...inputStyle, width: '80px', textAlign: 'center' }}
                placeholder="M"
              />
              <span style={{ fontFamily: 'var(--font-barlow), sans-serif', color: '#8C887C', fontSize: '16px' }}>M</span>
            </div>
          )}
          {departsLabel && (
            <div
              style={{
                marginTop: '6px',
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '11px',
                color: '#8C887C',
              }}
            >
              {departsLabel}
            </div>
          )}
        </Row>

        <Row>
          <Label>LOCATION (AUTO)</Label>
          <div style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '14px', color: '#8C887C', textTransform: 'uppercase' }}>
            {airportName}
          </div>
        </Row>

        {/* Safe time preview */}
        {departureMs > 0 && (
          <Row>
            <Label>SAFE TIME</Label>
            <div
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '28px',
                fontWeight: '700',
                color: safeOk ? '#3F9B5B' : '#C8201A',
              }}
            >
              {safeOk ? fmtDuration(safeMs) : 'HEAD TO GATE NOW'}
            </div>
            <div
              style={{
                marginTop: '4px',
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '10px',
                color: '#8C887C',
              }}
            >
              BUFFER {BUFFER_MIN}M + WALK + {MARGIN_MIN}M MARGIN
            </div>
          </Row>
        )}

        {/* Airport */}
        <Row>
          <Label>AIRPORT</Label>
          <input
            type="text"
            value={airportName}
            readOnly
            style={{ ...inputStyle, color: '#8C887C', backgroundColor: '#181816' }}
          />
        </Row>

        {/* Gate */}
        <Row>
          <Label>GATE</Label>
          <input
            type="text"
            value={gate}
            onChange={(e) => setGate(e.target.value.toUpperCase())}
            placeholder="B14 OR TBA"
            maxLength={6}
            style={inputStyle}
          />
        </Row>

        {/* Walk time */}
        <Row>
          <Label>WALK TO GATE</Label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {WALK_OPTIONS.map((w) => (
              <button
                key={w}
                style={segBtnStyle(walkMin === w)}
                onClick={() => setWalkMin(w)}
              >
                {w}M
              </button>
            ))}
          </div>
        </Row>

        {/* Vibe */}
        <Row>
          <Label>VIBE</Label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {VIBES.map((v) => (
              <button
                key={v}
                style={segBtnStyle(vibe === v)}
                onClick={() => setVibe(v)}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </Row>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: '#C8201A',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '14px',
              letterSpacing: '0.1em',
              color: 'white',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Start button */}
      <div style={{ padding: '16px', borderTop: '1px solid #34322C' }}>
        <button
          onClick={handleStart}
          disabled={!safeOk && departureMs > 0}
          style={{
            width: '100%',
            backgroundColor: safeOk || !departureMs ? '#F2A900' : '#34322C',
            color: safeOk || !departureMs ? '#101010' : '#8C887C',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '22px',
            fontWeight: '700',
            letterSpacing: '0.15em',
            padding: '18px',
            border: 'none',
            borderRadius: '2px',
            cursor: safeOk || !departureMs ? 'pointer' : 'not-allowed',
            textTransform: 'uppercase',
          }}
        >
          START LAYOVER
        </button>
      </div>
    </div>
  );
}
