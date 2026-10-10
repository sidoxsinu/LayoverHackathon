'use client';
import { useState, useEffect, useMemo } from 'react';
import { nextOccurrence, schedule, fmtDuration, BUFFER_MIN, MARGIN_MIN } from '@/lib/time';
import { startStats } from '@/lib/missions';
import { arm } from '@/lib/alarm';
import { useNow } from '@/hooks/useNow';
import GlobalMuteButton from './GlobalMuteButton';

import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { createBrowserClient } from '@/lib/supabase';
import { Trip, fetchUserTrips, formatTripDateTime, clearTripsCache } from '@/lib/trips';
import ThemeDropdown from './ui/ThemeDropdown';
import ThemeTimePicker from './ui/ThemeTimePicker';
import InfoTip from './InfoTip';
import Tour from './Tour';
import { SETUP_STEPS, isTourCompleted } from '@/lib/tour';

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
    tripId?: string | null;
    tripName?: string | null;
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
  const router = useRouter();
  const { user } = useUser();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsUnavailable, setTripsUnavailable] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [tripDepartureMs, setTripDepartureMs] = useState<number | null>(null);
  const [selectedTripName, setSelectedTripName] = useState<string | null>(null);
  const [selectedTripLocation, setSelectedTripLocation] = useState<string | null>(null);

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
  const [draftLocation, setDraftLocation] = useState('');
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'AUTO' | 'MANUAL' | 'DEFAULT'>('AUTO');
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('replay') === 'setup') {
        setShowTour(true);
        window.history.replaceState({}, '', '/');
        return;
      }
    }

    if (!isTourCompleted('setup')) {
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  // Load Trips if user is signed in
  useEffect(() => {
    if (!user) return;
    let active = true;

    fetchUserTrips(user.id).then((res) => {
      if (!active) return;
      setTrips(res.trips);
      setTripsUnavailable(res.unavailable);

      const upcoming = res.trips.filter((t) => new Date(t.departure_at).getTime() >= Date.now());
      if (upcoming.length === 0) return;

      // 1. Check if user came from /trips with USE button
      let activeId: string | null = null;
      try {
        activeId = localStorage.getItem('gate.active_trip_id');
        if (activeId) {
          localStorage.removeItem('gate.active_trip_id');
        }
      } catch {}

      const activeTrip = activeId ? upcoming.find((t) => t.id === activeId) : null;
      if (activeTrip) {
        applyTrip(activeTrip);
      } else {
        // 2. Preselect nearest upcoming trip departing within next 24 hours
        const sorted = [...upcoming].sort(
          (a, b) => new Date(a.departure_at).getTime() - new Date(b.departure_at).getTime()
        );
        const nearest = sorted[0];
        if (nearest) {
          const depMs = new Date(nearest.departure_at).getTime();
          const diffMs = depMs - Date.now();
          if (diffMs > 0 && diffMs <= 24 * 3600000) {
            applyTrip(nearest);
          }
        }
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  const applyTrip = (trip: Trip) => {
    setSelectedTripId(trip.id);
    setSelectedTripName(trip.name);
    setSelectedTripLocation(trip.location || null);
    const depDate = new Date(trip.departure_at);
    setTripDepartureMs(depDate.getTime());
    setInputMode('time');
    const hh = String(depDate.getHours()).padStart(2, '0');
    const mm = String(depDate.getMinutes()).padStart(2, '0');
    setTimeValue(`${hh}:${mm}`);
    if (trip.gate) setGate(trip.gate);
    if (trip.walk_min) setWalkMin(trip.walk_min);
  };

  const handleSignOut = async () => {
    if (user) {
      clearTripsCache(user.id);
    }
    const { clearPendingProofs } = await import('@/lib/proof');
    await clearPendingProofs();
    const supabase = createBrowserClient();
    await supabase?.auth.signOut();
    window.location.reload();
  };

  // Sync draftLocation when airportName changes via auto-detect
  useEffect(() => {
    setDraftLocation(airportName);
  }, [airportName]);

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
        setAirportName(data.airport || 'UNKNOWN LOCATION');
        setCustomMissions(data.missions || []);
        if (!data.airport) setLocationStatus('DEFAULT');
        else setLocationStatus('AUTO');
      } catch (e) {
        if (!active) return;
        setAirportName('TINKERSPACE, CALICUT');
        setLocationStatus('DEFAULT');
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchAirport(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          if (!active) return;
          setAirportName('TINKERSPACE, CALICUT');
          setLocationStatus('DEFAULT');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setAirportName('TINKERSPACE, CALICUT');
      setLocationStatus('DEFAULT');
    }

    return () => { active = false; };
  }, []);

  const handleLocationOverride = async () => {
    if (!draftLocation || draftLocation === airportName) {
      setShowLocationConfirm(false);
      return;
    }
    setIsFetchingLocation(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationOverride: draftLocation })
      });
      if (res.ok) {
        const data = await res.json();
        setAirportName(data.airport || draftLocation);
        setCustomMissions(data.missions || []);
      } else {
        setAirportName(draftLocation);
      }
      setLocationStatus('MANUAL');
    } catch (e) {
      setAirportName(draftLocation);
      setLocationStatus('MANUAL');
    }
    setIsFetchingLocation(false);
    setShowLocationConfirm(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLocationConfirm) {
        setDraftLocation(airportName);
        setShowLocationConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLocationConfirm, airportName]);

  const now = useNow(1000);

  // Upcoming trips computed
  const upcomingTrips = useMemo(() => {
    return trips.filter((t) => new Date(t.departure_at).getTime() >= now);
  }, [trips, now]);

  // Compute departureMs
  let departureMs = 0;
  if (selectedTripId && tripDepartureMs !== null) {
    if (inputMode === 'time' && timeValue) {
      const d = new Date(tripDepartureMs);
      const [h, m] = timeValue.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        d.setHours(h, m, 0, 0);
        departureMs = d.getTime();
      } else {
        departureMs = tripDepartureMs;
      }
    } else {
      departureMs = tripDepartureMs;
    }
  } else if (inputMode === 'time' && timeValue) {
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
      tripId: selectedTripId || null,
      tripName: selectedTripName || null,
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
    <>
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
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => router.push('/trips')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '13px',
                color: '#8C887C',
                letterSpacing: '0.15em',
                padding: 0,
                textTransform: 'uppercase',
              }}
            >
              TRIPS
            </button>
            <button
              onClick={() => router.push('/passport')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '13px',
                color: '#8C887C',
                letterSpacing: '0.15em',
                padding: 0,
                textTransform: 'uppercase',
              }}
            >
              PASSPORT
            </button>
            <button
              onClick={handleSignOut}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '13px',
                color: '#C8201A',
                letterSpacing: '0.15em',
                padding: 0,
                textTransform: 'uppercase',
              }}
            >
              SIGN OUT
            </button>
            <GlobalMuteButton />
          </div>
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '11px',
              color: '#8C887C',
              letterSpacing: '0.15em',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            LAYOVER COMPANION
            <GlobalMuteButton />
          </span>
        )}
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

        {/* Trips unavailable notice */}
        {user && tripsUnavailable && (
          <Row>
            <span style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '11px', color: '#8C887C', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              TRIPS UNAVAILABLE
            </span>
          </Row>
        )}

        {/* Trip Dropdown if signed in and upcoming trips exist */}
        {user && upcomingTrips.length > 0 && (
          <Row>
            <Label>SELECT TRIP</Label>
            <ThemeDropdown
              value={selectedTripId}
              onChange={(val) => {
                if (!val) {
                  setSelectedTripId('');
                  setSelectedTripName(null);
                  setSelectedTripLocation(null);
                  setTripDepartureMs(null);
                } else {
                  const t = upcomingTrips.find((item) => item.id === val);
                  if (t) applyTrip(t);
                }
              }}
              placeholder="MANUAL ENTRY"
              options={[
                { value: '', label: 'MANUAL ENTRY', sublabel: 'ENTER DEPARTURE DETAILS MANUALLY' },
                ...upcomingTrips.map((t) => {
                  const { dateStr, timeStr } = formatTripDateTime(t.departure_at);
                  const details = [t.location, t.flight_no, t.gate ? `GATE ${t.gate}` : ''].filter(Boolean).join(' · ');
                  return {
                    value: t.id,
                    badge: `${dateStr} ${timeStr}`,
                    label: t.name,
                    sublabel: details || undefined,
                  };
                }),
              ]}
            />
            {selectedTripName && (
              <div
                style={{
                  marginTop: '8px',
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '11px',
                  color: '#8C887C',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                FROM TRIP: {selectedTripName}
              </div>
            )}
            {selectedTripLocation && (
              <div
                style={{
                  marginTop: '3px',
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '11px',
                  color: '#8C887C',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                TRIP LOCATION: {selectedTripLocation}
              </div>
            )}
          </Row>
        )}

        {/* Departure input mode toggle */}
        <div data-tour="setup-flight">
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
              <ThemeTimePicker
                value={timeValue}
                onChange={(val) => setTimeValue(val)}
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
        </div>

        {/* Safe time preview */}
        <div data-tour="setup-safe-time">
          <Row>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <Label>SAFE TIME</Label>
              <InfoTip
                text="MINUTES LEFT BEFORE YOU MUST HEAD TO THE GATE. EQUALS DEPARTURE MINUS WALK TIME MINUS 35 MIN BUFFER."
                label="Safe time information"
                align="right"
              />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '28px',
                fontWeight: '700',
                color: departureMs === 0 ? '#8C887C' : safeOk ? '#3F9B5B' : '#C8201A',
              }}
            >
              {departureMs === 0 ? '--' : safeOk ? fmtDuration(safeMs) : 'HEAD TO GATE NOW'}
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
        </div>

        {/* Location */}
        <Row>
          <Label>LOCATION</Label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={draftLocation}
              onChange={(e) => setDraftLocation(e.target.value.toUpperCase())}
              style={{ ...inputStyle, flex: 1, backgroundColor: draftLocation !== airportName ? '#181816' : '#101010', borderColor: draftLocation !== airportName ? '#F2A900' : '#34322C', height: '48px' }}
            />
            {draftLocation !== airportName && (
              <button
                onClick={() => setShowLocationConfirm(true)}
                style={{
                  backgroundColor: '#F2A900',
                  color: '#101010',
                  border: '1px solid #F2A900',
                  width: '48px',
                  height: '48px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  padding: 0,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                APPLY
              </button>
            )}
          </div>
          <div style={{ marginTop: '6px', fontFamily: 'var(--font-plex), monospace', fontSize: '11px', color: '#8C887C', textTransform: 'uppercase' }}>
            {locationStatus}
          </div>
        </Row>

        {/* Gate */}
        <Row>
          <Label>GATE</Label>
          <input
            type="text"
            value={gate}
            onChange={(e) => setGate(e.target.value.toUpperCase())}
            placeholder="TBA"
            maxLength={6}
            style={inputStyle}
          />
        </Row>

        {/* Walk time */}
        <div data-tour="setup-walk">
          <Row>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <Label>WALK TO GATE</Label>
              <InfoTip
                text="HOW LONG IT TAKES TO REACH YOUR GATE FROM CONCOURSE."
                label="Walk time information"
                align="right"
              />
            </div>
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
        </div>

        {/* Vibe */}
        <div data-tour="setup-vibe">
          <Row>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <Label>VIBE</Label>
              <InfoTip
                text="SETS YOUR STARTING ENERGY AND STAT PROFILE."
                label="Vibe information"
                align="right"
              />
            </div>
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
        </div>

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

        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setShowTour(true)}
            style={{
              minHeight: '48px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '13px',
              color: '#8C887C',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '0 16px',
            }}
          >
            HOW IT WORKS
          </button>
        </div>
      </div>
    </div>

    <Tour
      screen="setup"
      steps={SETUP_STEPS}
      isActive={showTour}
      onComplete={() => setShowTour(false)}
      onDismiss={() => setShowTour(false)}
    />

    {showLocationConfirm && (
      <div 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#101010', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}
      >
        <div style={{ border: '1px solid #34322C', backgroundColor: '#181816', padding: '24px', maxWidth: '320px', width: '100%' }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontSize: '18px', fontWeight: '700', letterSpacing: '0.1em', color: '#F2A900', marginBottom: '16px' }}>
            OVERRIDE LOCATION?
          </div>
          <div style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '16px', color: '#E6E1D3', marginBottom: '24px', lineHeight: '1.4' }}>
            Setting the location to {draftLocation} will regenerate local missions. Continue?
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleLocationOverride} 
              disabled={isFetchingLocation}
              style={{ flex: 1, backgroundColor: '#F2A900', color: '#101010', border: '1px solid #F2A900', height: '48px', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: '700', letterSpacing: '0.1em' }}
            >
              {isFetchingLocation ? 'UPDATING' : 'CONFIRM'}
            </button>
            <button 
              onClick={() => { setDraftLocation(airportName); setShowLocationConfirm(false); }} 
              disabled={isFetchingLocation}
              style={{ flex: 1, backgroundColor: 'transparent', color: '#8C887C', border: '1px solid #34322C', height: '48px', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: '700', letterSpacing: '0.1em' }}
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
