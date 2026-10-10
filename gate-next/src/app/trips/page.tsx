'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { load } from '@/lib/storage';
import { useUser } from '@/hooks/useUser';
import { createBrowserClient } from '@/lib/supabase';
import {
  Trip,
  fetchUserTrips,
  setTripsCache,
  formatTripDateTime,
  getTripStatus,
  clearTripsCache,
} from '@/lib/trips';
import GlobalMuteButton from '@/components/GlobalMuteButton';
import ThemeTimePicker from '@/components/ui/ThemeTimePicker';

import { useNow } from '@/hooks/useNow';

const WALK_OPTIONS = [2, 5, 10, 15];

export default function TripsPage() {
  const router = useRouter();
  const { user, isConfigured, loading: authLoading } = useUser();
  const now = useNow(1000);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formFlightNo, setFormFlightNo] = useState('');
  const [formGate, setFormGate] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formWalkMin, setFormWalkMin] = useState(10);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirm modal state
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // 1. Lockdown check: Redirect to / if in active quest or alarm
    const state = load();
    if (state && (state.screen === 'quest' || state.screen === 'alarm')) {
      router.replace('/');
      return;
    }

    // 2. Auth loading
    if (authLoading) return;

    // 3. Guest check
    if (!isConfigured || !user) {
      setLoading(false);
      return;
    }

    // 4. Load trips
    loadTrips(user.id);
  }, [router, authLoading, isConfigured, user]);

  const loadTrips = async (userId: string) => {
    setLoading(true);
    const res = await fetchUserTrips(userId);
    setTrips(res.trips);
    setIsOffline(res.offline);
    setIsUnavailable(res.unavailable);
    setLoading(false);
  };

  const handleSignOut = async () => {
    if (user) {
      clearTripsCache(user.id);
    }
    const supabase = createBrowserClient();
    await supabase?.auth.signOut();
    router.replace('/');
  };

  const { upcomingTrips, pastTrips } = useMemo(() => {
    const upcoming: (Trip & { departureMs: number })[] = [];
    const past: (Trip & { departureMs: number })[] = [];
    const effectiveNow = now || 0;

    trips.forEach((t) => {
      const ms = new Date(t.departure_at).getTime();
      const item = { ...t, departureMs: ms };
      if (ms >= effectiveNow) {
        upcoming.push(item);
      } else {
        past.push(item);
      }
    });

    upcoming.sort((a, b) => a.departureMs - b.departureMs);
    past.sort((a, b) => b.departureMs - a.departureMs);

    return { upcomingTrips: upcoming, pastTrips: past };
  }, [trips, now]);

  const openAddForm = () => {
    setEditingTrip(null);
    setFormName('');
    setFormLocation('');
    setFormFlightNo('');
    setFormGate('');
    // Default to tomorrow 12:00
    const tomorrow = new Date(Date.now() + 86400000);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setFormDate(`${yyyy}-${mm}-${dd}`);
    setFormTime('12:00');
    setFormWalkMin(10);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (trip: Trip) => {
    setEditingTrip(trip);
    setFormName(trip.name);
    setFormLocation(trip.location || '');
    setFormFlightNo(trip.flight_no || '');
    setFormGate(trip.gate || '');
    const d = new Date(trip.departure_at);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    setFormDate(`${yyyy}-${mm}-${dd}`);
    setFormTime(`${hh}:${min}`);
    setFormWalkMin(trip.walk_min || 10);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleUseTrip = (trip: Trip) => {
    try {
      localStorage.setItem('gate.active_trip_id', trip.id);
    } catch {}
    router.push('/');
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('NAME IS REQUIRED');
      return;
    }
    if (trimmedName.length > 60) {
      setFormError('NAME MUST BE 60 CHARACTERS OR LESS');
      return;
    }

    const trimmedLocation = formLocation.trim();
    if (trimmedLocation.length > 60) {
      setFormError('LOCATION MUST BE 60 CHARACTERS OR LESS');
      return;
    }

    const trimmedFlight = formFlightNo.trim().toUpperCase();
    if (trimmedFlight.length > 12) {
      setFormError('FLIGHT NO MUST BE 12 CHARACTERS OR LESS');
      return;
    }

    const trimmedGate = formGate.trim().toUpperCase();
    if (trimmedGate.length > 8) {
      setFormError('GATE MUST BE 8 CHARACTERS OR LESS');
      return;
    }

    if (!formDate || !formTime) {
      setFormError('DEPARTURE DATE AND TIME ARE REQUIRED');
      return;
    }

    const [yyyy, mm, dd] = formDate.split('-').map(Number);
    const [hh, min] = formTime.split(':').map(Number);
    const depDate = new Date(yyyy, mm - 1, dd, hh, min, 0, 0);
    const depMs = depDate.getTime();

    if (isNaN(depMs)) {
      setFormError('INVALID DEPARTURE DATE OR TIME');
      return;
    }

    // On create: departure must be in the future
    if (!editingTrip && depMs <= Date.now()) {
      setFormError('DEPARTURE MUST BE IN THE FUTURE');
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setFormError('CONNECTION REQUIRED TO SAVE TRIP');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const supabase = createBrowserClient();
    if (!supabase) {
      setFormError('DATABASE UNAVAILABLE');
      setIsSubmitting(false);
      return;
    }

    const tripId = editingTrip ? editingTrip.id : crypto.randomUUID();
    const payload: Trip = {
      id: tripId,
      user_id: user.id,
      name: trimmedName,
      location: trimmedLocation || null,
      flight_no: trimmedFlight || null,
      gate: trimmedGate || null,
      departure_at: depDate.toISOString(),
      walk_min: formWalkMin,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('trips').upsert(payload);

    if (error) {
      setFormError(error.message.toUpperCase() || 'FAILED TO SAVE TRIP');
      setIsSubmitting(false);
      return;
    }

    // Update local state and cache
    const updated = editingTrip
      ? trips.map((t) => (t.id === tripId ? payload : t))
      : [...trips, payload];

    setTrips(updated);
    setTripsCache(user.id, updated);
    setIsSubmitting(false);
    setIsFormOpen(false);
  };

  const confirmDelete = async () => {
    if (!tripToDelete || !user) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert('CONNECTION REQUIRED TO DELETE TRIP');
      return;
    }

    setIsDeleting(true);
    const supabase = createBrowserClient();
    if (!supabase) {
      setIsDeleting(false);
      return;
    }

    const { error } = await supabase.from('trips').delete().eq('id', tripToDelete.id);

    if (!error) {
      const remaining = trips.filter((t) => t.id !== tripToDelete.id);
      setTrips(remaining);
      setTripsCache(user.id, remaining);
      if (selectedTripId === tripToDelete.id) {
        setSelectedTripId(null);
      }
    }
    setIsDeleting(false);
    setTripToDelete(null);
  };

  // 1. Loading screen
  if (authLoading || (loading && user)) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: '#101010', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '13px', color: '#8C887C', letterSpacing: '0.2em' }}>
          LOADING TRIPS...
        </span>
      </div>
    );
  }

  // 2. Guest screen
  if (!user) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          backgroundColor: '#101010',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '480px',
          margin: '0 auto',
          padding: '24px 16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #34322C', paddingBottom: '16px', marginBottom: '40px' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '12px',
              color: '#8C887C',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: 0,
            }}
          >
            ← BACK
          </button>
          <span style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '12px', color: '#8C887C', letterSpacing: '0.2em' }}>
            TRIPS
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '20px' }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontSize: '24px', fontWeight: '700', color: '#E6E1D3', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            SIGN IN TO SAVE TRIPS
          </div>
          <button
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              maxWidth: '320px',
              height: '48px',
              backgroundColor: '#F2A900',
              border: 'none',
              borderRadius: '2px',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '16px',
              fontWeight: '700',
              color: '#101010',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            RETURN TO START
          </button>
        </div>
      </div>
    );
  }

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

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
          padding: '20px 16px',
          borderBottom: '1px solid #34322C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-plex), monospace',
            fontSize: '13px',
            color: '#8C887C',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: 0,
          }}
        >
          ← SETUP
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => router.push('/passport')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '13px',
              color: '#8C887C',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: 0,
            }}
          >
            PASSPORT
          </button>
          <button
            onClick={handleSignOut}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '13px',
              color: '#C8201A',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: 0,
            }}
          >
            SIGN OUT
          </button>
          <GlobalMuteButton />
        </div>
      </div>

      {/* Offline or Unavailable Notice */}
      {isOffline && (
        <div style={{ padding: '8px 16px', backgroundColor: '#181816', borderBottom: '1px solid #34322C' }}>
          <span style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '11px', color: '#8C887C', letterSpacing: '0.15em' }}>
            OFFLINE, SHOWING SAVED TRIPS
          </span>
        </div>
      )}
      {isUnavailable && (
        <div style={{ padding: '8px 16px', backgroundColor: '#181816', borderBottom: '1px solid #34322C' }}>
          <span style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '11px', color: '#8C887C', letterSpacing: '0.15em' }}>
            TRIPS UNAVAILABLE
          </span>
        </div>
      )}

      {/* Page Title & Add Button */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #34322C',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '13px',
            color: '#8C887C',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          SCHEDULED TRIPS
        </span>
        <button
          onClick={openAddForm}
          style={{
            height: '48px',
            padding: '0 20px',
            backgroundColor: '#F2A900',
            border: 'none',
            borderRadius: '2px',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            color: '#101010',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          ADD TRIP
        </button>
      </div>

      {/* Empty State */}
      {trips.length === 0 ? (
        <div
          style={{
            flex: 1,
            padding: '48px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '14px',
              color: '#8C887C',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            NO TRIPS SAVED. ADD YOUR NEXT DEPARTURE.
          </div>
          <button
            onClick={openAddForm}
            style={{
              width: '100%',
              maxWidth: '280px',
              height: '48px',
              backgroundColor: '#F2A900',
              border: 'none',
              borderRadius: '2px',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '16px',
              fontWeight: '700',
              color: '#101010',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            ADD TRIP
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Departure-board Table Header */}
          <div
            style={{
              display: 'flex',
              padding: '10px 16px',
              backgroundColor: '#181816',
              borderBottom: '1px solid #34322C',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '11px',
              letterSpacing: '0.15em',
              color: '#8C887C',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: '88px' }}>DEPARTS</span>
            <span style={{ flex: 1 }}>TRIP</span>
            <span style={{ width: '70px', textAlign: 'right' }}>STATUS</span>
          </div>

          {/* Upcoming Trips List */}
          {upcomingTrips.map((trip) => {
            const { dateStr, timeStr, departureMs } = formatTripDateTime(trip.departure_at);
            const status = getTripStatus(departureMs, now);
            const isSelected = selectedTripId === trip.id;
            const details = [trip.location, trip.flight_no, trip.gate ? `GATE ${trip.gate}` : '']
              .filter(Boolean)
              .join(' · ');

            return (
              <div
                key={trip.id}
                onClick={() => setSelectedTripId(isSelected ? null : trip.id)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #34322C',
                  backgroundColor: isSelected ? '#181816' : '#101010',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {/* Left: Date and Time in mono amber */}
                  <div style={{ width: '88px', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '13px', fontWeight: '700', color: '#F2A900' }}>
                      {dateStr}
                    </span>
                    <span style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '15px', color: '#F2A900', marginTop: '2px' }}>
                      {timeStr}
                    </span>
                  </div>

                  {/* Middle: Name over muted location, flight, gate */}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-barlow), sans-serif',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#E6E1D3',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {trip.name}
                    </div>
                    {details && (
                      <div
                        style={{
                          fontFamily: 'var(--font-plex), monospace',
                          fontSize: '11px',
                          color: '#8C887C',
                          marginTop: '3px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textTransform: 'uppercase',
                        }}
                      >
                        {details}
                      </div>
                    )}
                  </div>

                  {/* Right: Status text */}
                  <div style={{ width: '70px', textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-plex), monospace',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: status === 'TODAY' ? '#3F9B5B' : '#F2A900',
                      }}
                    >
                      {status}
                    </span>
                  </div>
                </div>

                {/* Selected Action Buttons: USE, EDIT, DELETE */}
                {isSelected && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '14px',
                      paddingTop: '12px',
                      borderTop: '1px solid #34322C',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleUseTrip(trip)}
                      style={{
                        flex: 1,
                        height: '48px',
                        backgroundColor: '#F2A900',
                        color: '#101010',
                        border: 'none',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-barlow), sans-serif',
                        fontSize: '16px',
                        fontWeight: '700',
                        letterSpacing: '0.1em',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      USE
                    </button>
                    <button
                      onClick={() => openEditForm(trip)}
                      style={{
                        flex: 1,
                        height: '48px',
                        backgroundColor: 'transparent',
                        color: '#E6E1D3',
                        border: '1px solid #34322C',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-barlow), sans-serif',
                        fontSize: '16px',
                        fontWeight: '700',
                        letterSpacing: '0.1em',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => setTripToDelete(trip)}
                      style={{
                        flex: 1,
                        height: '48px',
                        backgroundColor: 'transparent',
                        color: '#C8201A',
                        border: '1px solid #C8201A',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-barlow), sans-serif',
                        fontSize: '16px',
                        fontWeight: '700',
                        letterSpacing: '0.1em',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      DELETE
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Past Trips Toggle & Section */}
          {pastTrips.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid #34322C' }}>
              <button
                onClick={() => setShowPast(!showPast)}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#181816',
                  border: 'none',
                  borderBottom: '1px solid #34322C',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#8C887C',
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {showPast ? `HIDE PAST (${pastTrips.length})` : `SHOW PAST (${pastTrips.length})`}
              </button>

              {showPast &&
                pastTrips.map((trip) => {
                  const { dateStr, timeStr, departureMs } = formatTripDateTime(trip.departure_at);
                  const isSelected = selectedTripId === trip.id;
                  const details = [trip.location, trip.flight_no, trip.gate ? `GATE ${trip.gate}` : '']
                    .filter(Boolean)
                    .join(' · ');

                  return (
                    <div
                      key={trip.id}
                      onClick={() => setSelectedTripId(isSelected ? null : trip.id)}
                      style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid #34322C',
                        backgroundColor: isSelected ? '#181816' : '#101010',
                        opacity: 0.55,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '88px', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '13px', fontWeight: '700', color: '#8C887C' }}>
                            {dateStr}
                          </span>
                          <span style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '15px', color: '#8C887C', marginTop: '2px' }}>
                            {timeStr}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                          <div
                            style={{
                              fontFamily: 'var(--font-barlow), sans-serif',
                              fontSize: '18px',
                              fontWeight: '700',
                              color: '#E6E1D3',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {trip.name}
                          </div>
                          {details && (
                            <div
                              style={{
                                fontFamily: 'var(--font-plex), monospace',
                                fontSize: '11px',
                                color: '#8C887C',
                                marginTop: '3px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textTransform: 'uppercase',
                              }}
                            >
                              {details}
                            </div>
                          )}
                        </div>
                        <div style={{ width: '70px', textAlign: 'right' }}>
                          <span style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '13px', fontWeight: '700', color: '#8C887C' }}>
                            PAST
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            marginTop: '14px',
                            paddingTop: '12px',
                            borderTop: '1px solid #34322C',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => openEditForm(trip)}
                            style={{
                              flex: 1,
                              height: '48px',
                              backgroundColor: 'transparent',
                              color: '#E6E1D3',
                              border: '1px solid #34322C',
                              borderRadius: '2px',
                              fontFamily: 'var(--font-barlow), sans-serif',
                              fontSize: '16px',
                              fontWeight: '700',
                              letterSpacing: '0.1em',
                              cursor: 'pointer',
                              textTransform: 'uppercase',
                            }}
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => setTripToDelete(trip)}
                            style={{
                              flex: 1,
                              height: '48px',
                              backgroundColor: 'transparent',
                              color: '#C8201A',
                              border: '1px solid #C8201A',
                              borderRadius: '2px',
                              fontFamily: 'var(--font-barlow), sans-serif',
                              fontSize: '16px',
                              fontWeight: '700',
                              letterSpacing: '0.1em',
                              cursor: 'pointer',
                              textTransform: 'uppercase',
                            }}
                          >
                            DELETE
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {tripToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: '#181816',
              border: '1px solid #34322C',
              borderRadius: '2px',
              padding: '24px 20px',
              maxWidth: '360px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '22px',
                fontWeight: '700',
                color: '#E6E1D3',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              DELETE TRIP?
            </div>
            <div
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '13px',
                color: '#8C887C',
                lineHeight: '1.4',
                textTransform: 'uppercase',
              }}
            >
              CONFIRM DELETION OF TRIP: {tripToDelete.name}. THIS CANNOT BE UNDONE.
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => setTripToDelete(null)}
                style={{
                  flex: 1,
                  height: '48px',
                  backgroundColor: 'transparent',
                  border: '1px solid #34322C',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#8C887C',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                CANCEL
              </button>
              <button
                disabled={isDeleting}
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  height: '48px',
                  backgroundColor: '#C8201A',
                  border: 'none',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'white',
                  letterSpacing: '0.1em',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {isDeleting ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal (Full Screen) */}
      {isFormOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#101010',
            zIndex: 90,
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '480px',
            margin: '0 auto',
            overflowY: 'auto',
          }}
        >
          {/* Form Header */}
          <div
            style={{
              padding: '20px 16px',
              borderBottom: '1px solid #34322C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '20px',
                fontWeight: '700',
                color: '#E6E1D3',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {editingTrip ? 'EDIT TRIP' : 'ADD TRIP'}
            </span>
            <button
              onClick={() => setIsFormOpen(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '13px',
                color: '#8C887C',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              CANCEL
            </button>
          </div>

          <form onSubmit={handleSaveTrip} style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Error Line */}
            {formError && (
              <div
                style={{
                  padding: '10px 12px',
                  border: '1px solid #C8201A',
                  backgroundColor: '#181816',
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '12px',
                  color: '#C8201A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {formError}
              </div>
            )}

            {/* NAME */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  color: '#8C887C',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                NAME *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                maxLength={60}
                required
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#181816',
                  border: '1px solid #34322C',
                  borderRadius: '2px',
                  padding: '0 12px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#E6E1D3',
                  outline: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              />
            </div>

            {/* LOCATION */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  color: '#8C887C',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                LOCATION
              </label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                maxLength={60}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#181816',
                  border: '1px solid #34322C',
                  borderRadius: '2px',
                  padding: '0 12px',
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '15px',
                  color: '#E6E1D3',
                  outline: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              />
            </div>

            {/* FLIGHT NO & GATE */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-barlow), sans-serif',
                    fontSize: '12px',
                    letterSpacing: '0.2em',
                    color: '#8C887C',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  FLIGHT NO
                </label>
                <input
                  type="text"
                  value={formFlightNo}
                  onChange={(e) => setFormFlightNo(e.target.value.toUpperCase())}
                  maxLength={12}
                  style={{
                    width: '100%',
                    height: '48px',
                    backgroundColor: '#181816',
                    border: '1px solid #34322C',
                    borderRadius: '2px',
                    padding: '0 12px',
                    fontFamily: 'var(--font-plex), monospace',
                    fontSize: '16px',
                    color: '#E6E1D3',
                    outline: 'none',
                    letterSpacing: '0.05em',
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-barlow), sans-serif',
                    fontSize: '12px',
                    letterSpacing: '0.2em',
                    color: '#8C887C',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  GATE (TBA ALLOWED)
                </label>
                <input
                  type="text"
                  value={formGate}
                  onChange={(e) => setFormGate(e.target.value.toUpperCase())}
                  placeholder="TBA"
                  maxLength={8}
                  style={{
                    width: '100%',
                    height: '48px',
                    backgroundColor: '#181816',
                    border: '1px solid #34322C',
                    borderRadius: '2px',
                    padding: '0 12px',
                    fontFamily: 'var(--font-plex), monospace',
                    fontSize: '16px',
                    color: '#E6E1D3',
                    outline: 'none',
                    letterSpacing: '0.05em',
                  }}
                />
              </div>
            </div>

            {/* DEPARTURE DATE & TIME */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  color: '#8C887C',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                DEPARTURE DATE & TIME *
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    height: '48px',
                    backgroundColor: '#181816',
                    border: '1px solid #34322C',
                    borderRadius: '2px',
                    padding: '0 12px',
                    fontFamily: 'var(--font-plex), monospace',
                    fontSize: '15px',
                    color: '#E6E1D3',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
                <div style={{ width: '160px' }}>
                  <ThemeTimePicker
                    value={formTime}
                    onChange={(val) => setFormTime(val)}
                  />
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '11px',
                  color: '#8C887C',
                  marginTop: '6px',
                  textTransform: 'uppercase',
                }}
              >
                TIMES USE YOUR DEVICE TIME ZONE.
              </div>
            </div>

            {/* WALK TO GATE */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  color: '#8C887C',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                WALK TO GATE
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {WALK_OPTIONS.map((w) => {
                  const active = formWalkMin === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setFormWalkMin(w)}
                      style={{
                        flex: 1,
                        height: '48px',
                        backgroundColor: active ? '#F2A900' : '#181816',
                        color: active ? '#101010' : '#8C887C',
                        border: '1px solid #34322C',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-barlow), sans-serif',
                        fontSize: '16px',
                        fontWeight: '700',
                        letterSpacing: '0.1em',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      {w}M
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '16px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  height: '52px',
                  backgroundColor: '#F2A900',
                  border: 'none',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#101010',
                  letterSpacing: '0.1em',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {isSubmitting ? 'SAVING...' : editingTrip ? 'UPDATE TRIP' : 'SAVE TRIP'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
