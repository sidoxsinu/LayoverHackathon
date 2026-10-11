'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { load } from '@/lib/storage';
import { useUser } from '@/hooks/useUser';
import { createBrowserClient } from '@/lib/supabase';
import { getRank } from '@/lib/rank';
import InfoTip from '@/components/InfoTip';
import GlobalMuteButton from '@/components/GlobalMuteButton';
import {
  LeaderboardEntry,
  LeaderboardScope,
  LeaderboardResult,
  MembershipInfo,
  fetchLeaderboard,
  checkMembership,
  joinLeaderboard,
  leaveLeaderboard,
  normalizeVenue,
} from '@/lib/leaderboard';

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();

  const [scope, setScope] = useState<LeaderboardScope>('all');
  const [venue, setVenue] = useState<string>('');
  const [boardData, setBoardData] = useState<LeaderboardResult>({
    entries: [],
    myEntry: null,
    isOffline: false,
    isUnavailable: false,
    cachedAgeText: null,
  });
  const [membership, setMembership] = useState<MembershipInfo>({
    isMember: false,
    handle: null,
    handleChangedAt: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshCooldown, setRefreshCooldown] = useState<number>(0);

  // Join / Change Handle Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [handleInput, setHandleInput] = useState<string>('');
  const [handleError, setHandleError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Leave Confirm Modal
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState<boolean>(false);
  const [isLeaving, setIsLeaving] = useState<boolean>(false);

  // First-visit hint state
  const [hasVisited, setHasVisited] = useState<boolean>(false);

  // 1. Lockdown check: Redirect to / if in active quest or alarm
  useEffect(() => {
    const state = load();
    if (state && (state.screen === 'quest' || state.screen === 'alarm')) {
      router.replace('/');
      return;
    }
  }, [router]);

  // Load first-visit flag
  useEffect(() => {
    try {
      const visited = localStorage.getItem('gate.lb.visited');
      if (visited) {
        setHasVisited(true);
      } else {
        localStorage.setItem('gate.lb.visited', 'true');
      }
    } catch {}
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (refreshCooldown <= 0) return;
    const interval = setInterval(() => {
      setRefreshCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [refreshCooldown]);

  // Retrieve user's last saved venue for the VENUE tab
  useEffect(() => {
    // Check localStorage saved state first
    const savedState = load();
    if (savedState && (savedState.venue || savedState.airportName)) {
      setVenue(normalizeVenue(savedState.venue || savedState.airportName));
    }

    // Also fetch most recent layover location from DB if signed in
    if (user) {
      const supabase = createBrowserClient();
      if (supabase) {
        Promise.resolve(
          supabase
            .from('layovers')
            .select('location')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        )
          .then(({ data }) => {
            if (data?.location) {
              setVenue(normalizeVenue(data.location));
            }
          })
          .catch(() => {});
      }
    }
  }, [user]);

  // Check membership when auth settles
  const checkUserMembership = useCallback(async () => {
    if (!user) {
      setMembership({ isMember: false, handle: null, handleChangedAt: null });
      return;
    }
    const mem = await checkMembership();
    setMembership(mem);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      checkUserMembership();
    }
  }, [authLoading, checkUserMembership]);

  // Load board data
  const loadBoard = useCallback(
    async (force = false) => {
      setLoading(true);
      const res = await fetchLeaderboard(scope, venue, force);
      setBoardData(res);
      setLoading(false);
    },
    [scope, venue]
  );

  useEffect(() => {
    loadBoard(false);
  }, [loadBoard]);

  const handleManualRefresh = () => {
    if (refreshCooldown > 0 || loading) return;
    setRefreshCooldown(10);
    loadBoard(true);
    checkUserMembership();
  };

  const handleGoogleSignIn = async () => {
    const supabase = createBrowserClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const openJoinSheet = (currentHandle = '') => {
    setHandleInput(currentHandle);
    setHandleError('');
    setIsModalOpen(true);
  };

  const submitHandle = async () => {
    const clean = handleInput.trim().toUpperCase();
    if (clean.length < 3 || clean.length > 16) {
      setHandleError('HANDLE MUST BE 3 TO 16 CHARACTERS');
      return;
    }
    if (!/^[A-Z0-9_]+$/.test(clean)) {
      setHandleError('ONLY LETTERS, NUMBERS AND UNDERSCORE ALLOWED');
      return;
    }

    setIsSubmitting(true);
    setHandleError('');

    const res = await joinLeaderboard(clean);
    setIsSubmitting(false);

    if (res.success) {
      setIsModalOpen(false);
      await checkUserMembership();
      await loadBoard(true);
    } else {
      setHandleError(res.error || 'TRY AGAIN');
    }
  };

  const confirmLeave = async () => {
    setIsLeaving(true);
    const res = await leaveLeaderboard();
    setIsLeaving(false);

    if (res.success) {
      setIsLeaveConfirmOpen(false);
      await checkUserMembership();
      await loadBoard(true);
    }
  };

  // Compute my ranking stats
  const myEntry = boardData.myEntry;
  const myXp = myEntry ? myEntry.total_xp : 0;
  const myRankTier = getRank(myXp);

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#101010',
        color: '#E6E1D3',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      {/* Header bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #34322C',
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/passport')}
          style={{
            background: 'none',
            border: 'none',
            color: '#8C887C',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            letterSpacing: '0.15em',
            cursor: 'pointer',
            padding: '12px 0',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Return"
        >
          RETURN
        </button>

        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '22px',
            fontWeight: '700',
            color: '#F2A900',
            letterSpacing: '0.05em',
          }}
        >
          LEADERBOARD
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshCooldown > 0 || loading}
            style={{
              background: 'none',
              border: '1px solid #34322C',
              color: refreshCooldown > 0 ? '#8C887C' : '#E6E1D3',
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '12px',
              padding: '8px 12px',
              minHeight: '48px',
              cursor: refreshCooldown > 0 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '2px',
            }}
            aria-label="Refresh Leaderboard"
          >
            {refreshCooldown > 0 ? `${refreshCooldown}S` : 'REFRESH'}
          </button>
          <GlobalMuteButton />
        </div>
      </header>

      {/* Scope Tabs (3 segments, flat 48px touch targets) */}
      <nav
        role="tablist"
        aria-label="Leaderboard scope"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderBottom: '1px solid #34322C',
          backgroundColor: '#181816',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={scope === 'all'}
          onClick={() => setScope('all')}
          style={{
            minHeight: '48px',
            background: scope === 'all' ? '#101010' : 'transparent',
            border: 'none',
            borderBottom: scope === 'all' ? '2px solid #F2A900' : '2px solid transparent',
            color: scope === 'all' ? '#F2A900' : '#8C887C',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            padding: '12px 4px',
          }}
        >
          ALL TIME
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === 'week'}
          onClick={() => setScope('week')}
          style={{
            minHeight: '48px',
            background: scope === 'week' ? '#101010' : 'transparent',
            border: 'none',
            borderBottom: scope === 'week' ? '2px solid #F2A900' : '2px solid transparent',
            color: scope === 'week' ? '#F2A900' : '#8C887C',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            padding: '12px 4px',
          }}
        >
          THIS WEEK
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === 'venue'}
          onClick={() => setScope('venue')}
          style={{
            minHeight: '48px',
            background: scope === 'venue' ? '#101010' : 'transparent',
            border: 'none',
            borderBottom: scope === 'venue' ? '2px solid #F2A900' : '2px solid transparent',
            color: scope === 'venue' ? '#F2A900' : '#8C887C',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            padding: '12px 4px',
          }}
        >
          THIS VENUE
        </button>
      </nav>

      {/* Scope Subtext / Venue Indicator */}
      {scope === 'venue' && venue && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#181816',
            borderBottom: '1px solid #34322C',
            fontFamily: 'var(--font-plex), monospace',
            fontSize: '12px',
            color: '#8C887C',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          VENUE: {venue}
        </div>
      )}

      {/* Offline / Cache Banner */}
      {boardData.isOffline && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#181816',
            borderBottom: '1px solid #34322C',
            fontFamily: 'var(--font-plex), monospace',
            fontSize: '12px',
            color: '#8C887C',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}
        >
          {boardData.cachedAgeText
            ? `OFFLINE, SHOWING SAVED BOARD (UPDATED ${boardData.cachedAgeText})`
            : 'OFFLINE, NO SAVED BOARD'}
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Your Position Card */}
        <section
          style={{
            backgroundColor: '#181816',
            border: '1px solid #34322C',
            borderRadius: '2px',
            padding: '16px',
          }}
          aria-label="Your Position"
        >
          {user ? (
            membership.isMember ? (
              // Case 1: Signed in & opted-in member
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-barlow), sans-serif',
                        fontSize: '12px',
                        letterSpacing: '0.2em',
                        color: '#8C887C',
                        marginBottom: '4px',
                      }}
                    >
                      YOUR POSITION
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-plex), monospace',
                        fontSize: '32px',
                        fontWeight: '700',
                        color: myEntry ? (myEntry.position <= 3 ? '#F2A900' : '#E6E1D3') : '#8C887C',
                        lineHeight: 1.1,
                      }}
                    >
                      {myEntry ? `#${myEntry.position}` : '#--'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-barlow), sans-serif',
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#E6E1D3',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {membership.handle}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-plex), monospace',
                        fontSize: '12px',
                        color: '#8C887C',
                        marginTop: '2px',
                      }}
                    >
                      {myRankTier.title} · LEVEL {myRankTier.level} OF 10
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-plex), monospace',
                        fontSize: '14px',
                        color: '#F2A900',
                        fontWeight: '700',
                        marginTop: '4px',
                      }}
                    >
                      {myXp} XP
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #34322C',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => openJoinSheet(membership.handle || '')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8C887C',
                      fontFamily: 'var(--font-barlow), sans-serif',
                      fontSize: '14px',
                      fontWeight: '700',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      padding: '12px 0',
                      minHeight: '48px',
                      textDecoration: 'underline',
                    }}
                  >
                    CHANGE HANDLE
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLeaveConfirmOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#C8201A',
                      fontFamily: 'var(--font-barlow), sans-serif',
                      fontSize: '14px',
                      fontWeight: '700',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      padding: '12px 0',
                      minHeight: '48px',
                      textDecoration: 'underline',
                    }}
                  >
                    LEAVE LEADERBOARD
                  </button>
                </div>
              </div>
            ) : (
              // Case 2: Signed in, not a member
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-barlow), sans-serif',
                    fontSize: '16px',
                    color: '#8C887C',
                    letterSpacing: '0.05em',
                    marginBottom: '12px',
                  }}
                >
                  OPT IN TO APPEAR ON THE BOARD WITH YOUR HANDLE.
                </div>
                <button
                  type="button"
                  onClick={() => openJoinSheet('')}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    backgroundColor: '#F2A900',
                    color: '#101010',
                    border: 'none',
                    borderRadius: '2px',
                    fontFamily: 'var(--font-barlow), sans-serif',
                    fontSize: '18px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    padding: '12px',
                  }}
                >
                  JOIN LEADERBOARD
                </button>
              </div>
            )
          ) : (
            // Case 3: Guest
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div
                style={{
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '16px',
                  color: '#8C887C',
                  letterSpacing: '0.05em',
                  marginBottom: '12px',
                }}
              >
                SIGN IN WITH GOOGLE TO JOIN
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  backgroundColor: '#E6E1D3',
                  color: '#101010',
                  border: 'none',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '18px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  padding: '12px',
                }}
              >
                SIGN IN WITH GOOGLE
              </button>
            </div>
          )}
        </section>

        {/* First-visit hint line */}
        {!hasVisited && (
          <div
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '12px',
              color: '#8C887C',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}
          >
            RANK IS YOUR LEVEL. THE BOARD COMPARES TOTAL XP.
          </div>
        )}

        {/* Departure Board Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 90px',
            padding: '8px 12px',
            borderBottom: '1px solid #34322C',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '13px',
            letterSpacing: '0.15em',
            color: '#8C887C',
            alignItems: 'center',
          }}
        >
          <div>POS</div>
          <div>TRAVELER</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
            <span>XP</span>
            <InfoTip
              text="XP COUNTS COMPLETED MISSIONS AND PHOTO PROOF. THE BOARD COUNTS UP TO 1 MISSION PER 3 MIN OF WAIT TIME IN EACH LAYOVER, SO IT CAN BE LOWER THAN YOUR PASSPORT TOTAL."
              label="XP Information"
              align="right"
            />
          </div>
        </div>

        {/* Board State: Loading, Unavailable, Empty, or Table Rows */}
        {loading ? (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '14px',
              color: '#8C887C',
              letterSpacing: '0.1em',
            }}
          >
            LOADING
          </div>
        ) : boardData.isUnavailable ? (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '14px',
              color: '#8C887C',
              letterSpacing: '0.1em',
            }}
          >
            LEADERBOARD NOT AVAILABLE
          </div>
        ) : scope === 'venue' && !venue ? (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '16px',
              color: '#8C887C',
              letterSpacing: '0.05em',
            }}
          >
            COMPLETE A LAYOVER TO SEE YOUR VENUE BOARD
          </div>
        ) : boardData.entries.length === 0 ? (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '16px',
              color: '#8C887C',
              letterSpacing: '0.05em',
            }}
          >
            NO ONE HAS JOINED YET. BE THE FIRST.
          </div>
        ) : (
          <div role="table" aria-label="Leaderboard" style={{ display: 'flex', flexDirection: 'column' }}>
            {boardData.entries.map((entry, idx) => {
              const tier = getRank(entry.total_xp);
              const isFirstThree = entry.position <= 3;
              const isOutsideTopCutoff =
                idx === boardData.entries.length - 1 &&
                entry.is_me &&
                idx > 0 &&
                entry.position > boardData.entries[idx - 1].position + 1;

              return (
                <div key={`${entry.handle}-${entry.position}`}>
                  {isOutsideTopCutoff && (
                    <div
                      style={{
                        padding: '12px 0',
                        textAlign: 'center',
                        fontFamily: 'var(--font-plex), monospace',
                        fontSize: '14px',
                        color: '#8C887C',
                        borderTop: '1px dashed #34322C',
                        borderBottom: '1px dashed #34322C',
                        margin: '8px 0',
                        letterSpacing: '0.2em',
                      }}
                    >
                      · · ·
                    </div>
                  )}

                  <div
                    role="row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 1fr 90px',
                      padding: '12px',
                      minHeight: '56px',
                      alignItems: 'center',
                      borderBottom: '1px solid #34322C',
                      backgroundColor: entry.is_me ? 'rgba(242, 169, 0, 0.05)' : '#181816',
                      borderLeft: entry.is_me ? '2px solid #F2A900' : 'none',
                    }}
                  >
                    {/* Position */}
                    <div
                      role="cell"
                      style={{
                        fontFamily: 'var(--font-plex), monospace',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: isFirstThree ? '#F2A900' : '#E6E1D3',
                      }}
                    >
                      {entry.position}
                    </div>

                    {/* Traveler Info */}
                    <div role="cell" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-barlow), sans-serif',
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#E6E1D3',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {entry.handle}
                        </span>
                        {entry.is_me && (
                          <span
                            style={{
                              fontFamily: 'var(--font-plex), monospace',
                              fontSize: '10px',
                              color: '#F2A900',
                              border: '1px solid #F2A900',
                              padding: '1px 4px',
                              borderRadius: '2px',
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontFamily: 'var(--font-plex), monospace',
                          fontSize: '12px',
                          color: '#8C887C',
                          marginTop: '2px',
                        }}
                      >
                        {tier.title} · LV {tier.level}
                      </div>
                    </div>

                    {/* XP Column */}
                    <div
                      role="cell"
                      style={{
                        textAlign: 'right',
                        fontFamily: 'var(--font-plex), monospace',
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#E6E1D3',
                      }}
                    >
                      {entry.total_xp}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Join / Change Handle Modal Sheet */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-sheet-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 16, 16, 0.95)',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#181816',
              border: '1px solid #34322C',
              borderRadius: '2px',
              width: '100%',
              maxWidth: '420px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              id="join-sheet-title"
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '22px',
                fontWeight: '700',
                color: '#F2A900',
                letterSpacing: '0.05em',
              }}
            >
              {membership.isMember ? 'CHANGE YOUR HANDLE' : 'JOIN THE LEADERBOARD'}
            </div>

            <div>
              <label
                htmlFor="handle-input"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '12px',
                  letterSpacing: '0.15em',
                  color: '#8C887C',
                  marginBottom: '8px',
                }}
              >
                TRAVELER HANDLE (3-16 CHARS)
              </label>
              <input
                id="handle-input"
                type="text"
                maxLength={16}
                value={handleInput}
                onChange={(e) => {
                  setHandleInput(e.target.value.toUpperCase());
                  setHandleError('');
                }}
                placeholder="YOUR_HANDLE"
                style={{
                  width: '100%',
                  minHeight: '48px',
                  backgroundColor: '#101010',
                  border: handleError ? '1px solid #C8201A' : '1px solid #34322C',
                  color: '#E6E1D3',
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '18px',
                  padding: '12px',
                  borderRadius: '2px',
                  boxSizing: 'border-box',
                  textTransform: 'uppercase',
                }}
                autoFocus
              />
              {handleError && (
                <div
                  style={{
                    color: '#C8201A',
                    fontFamily: 'var(--font-plex), monospace',
                    fontSize: '12px',
                    marginTop: '6px',
                  }}
                >
                  {handleError}
                </div>
              )}
            </div>

            {/* Consent Notice */}
            <div
              style={{
                backgroundColor: '#101010',
                padding: '12px',
                border: '1px solid #34322C',
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '11px',
                color: '#8C887C',
                lineHeight: 1.5,
              }}
            >
              YOUR HANDLE, RANK AND TOTAL XP WILL BE VISIBLE TO EVERYONE. NO NAME, EMAIL OR PHOTOS ARE SHARED. YOU CAN LEAVE ANYTIME.
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  minHeight: '48px',
                  backgroundColor: 'transparent',
                  color: '#8C887C',
                  border: '1px solid #34322C',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '16px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={submitHandle}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  minHeight: '48px',
                  backgroundColor: '#F2A900',
                  color: '#101010',
                  border: 'none',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '16px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  cursor: isSubmitting ? 'default' : 'pointer',
                }}
              >
                {isSubmitting ? 'SAVING...' : membership.isMember ? 'SAVE' : 'JOIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Sheet */}
      {isLeaveConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 16, 16, 0.95)',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#181816',
              border: '1px solid #C8201A',
              borderRadius: '2px',
              width: '100%',
              maxWidth: '400px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              id="leave-dialog-title"
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '20px',
                fontWeight: '700',
                color: '#C8201A',
                letterSpacing: '0.05em',
              }}
            >
              LEAVE LEADERBOARD?
            </div>

            <div
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '13px',
                color: '#E6E1D3',
                lineHeight: 1.5,
              }}
            >
              YOUR HANDLE WILL BE REMOVED FROM ALL BOARDS. YOUR SAVED LAYOVERS AND PASSPORT XP WILL REMAIN INTACT.
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIsLeaveConfirmOpen(false)}
                disabled={isLeaving}
                style={{
                  flex: 1,
                  minHeight: '48px',
                  backgroundColor: 'transparent',
                  color: '#8C887C',
                  border: '1px solid #34322C',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '16px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={confirmLeave}
                disabled={isLeaving}
                style={{
                  flex: 1,
                  minHeight: '48px',
                  backgroundColor: '#C8201A',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '16px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  cursor: isLeaving ? 'default' : 'pointer',
                }}
              >
                {isLeaving ? 'LEAVING...' : 'LEAVE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
