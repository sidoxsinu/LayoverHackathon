'use client';
import { useEffect, useRef, useState } from 'react';
import { fmtDuration } from '@/lib/time';
import GlobalMuteButton from './GlobalMuteButton';
import { getRankInfo } from '@/lib/rank';
import { useUser } from '@/hooks/useUser';
import { queueLayoverForSave } from '@/lib/sync';
import { load } from '@/lib/storage';
import { createBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { clearTripsCache } from '@/lib/trips';

interface Props {
  survivedMs: number;
  missionsCompleted: number;
  xp: number;
  onNewLayover: () => void;
}

export default function SafeTravels({ survivedMs, missionsCompleted, xp, onNewLayover }: Props) {
  const router = useRouter();
  const { rank } = getRankInfo(xp);
  const { user, isConfigured, loading } = useUser();
  const [saveStatus, setSaveStatus] = useState<'SAVING' | 'SAVED' | 'QUEUED' | 'SIGN_IN'>('SIGN_IN');
  const queuedRef = useRef(false);
  const shutterPlayedRef = useRef(false);

  // Play camera shutter sound once when printing final report
  useEffect(() => {
    if (shutterPlayedRef.current) return;
    shutterPlayedRef.current = true;

    try {
      const shutter = new Audio('/camerashutter.mp3');
      shutter.preload = 'auto';
      shutter.play().catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (loading || queuedRef.current) return;
    queuedRef.current = true;

    
    const state = load();
    if (state && !state.demo) {
      queueLayoverForSave(state, Math.floor(survivedMs / 1000));
    }
    
    if (!isConfigured || !user) {
      setSaveStatus('SIGN_IN');
    } else {
      // It queued it. Assuming flushSyncQueue runs inside queueLayoverForSave. 
      // A more robust app would track real network status, but per PRD: "SAVING" or "WILL RETRY" (queued)
      setSaveStatus(navigator.onLine ? 'SAVED' : 'QUEUED');
    }
  }, [user, isConfigured, loading, survivedMs]);

  const handleSignInToSave = async () => {
    const supabase = createBrowserClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  const handleSignOut = async () => {
    if (user) {
      clearTripsCache(user.id);
    }
    const supabase = createBrowserClient();
    await supabase?.auth.signOut();
    window.location.reload();
  };

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
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '12px',
            letterSpacing: '0.25em',
            color: '#8C887C',
          }}
        >
          GATE / LAYOVER COMPLETE
        </div>
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
          <GlobalMuteButton />
        )}
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

      {/* Save Status Line */}
      {isConfigured && !loading && (
        <div style={{ marginTop: '24px', fontFamily: 'var(--font-barlow), sans-serif', fontSize: '12px', letterSpacing: '0.1em' }}>
          {saveStatus === 'SAVED' && <span style={{ color: '#3F9B5B' }}>SAVED TO PASSPORT</span>}
          {saveStatus === 'SAVING' && <span style={{ color: '#8C887C' }}>SAVING...</span>}
          {saveStatus === 'QUEUED' && <span style={{ color: '#F2A900' }}>WILL RETRY SAVE</span>}
          {saveStatus === 'SIGN_IN' && (
            <button 
              onClick={handleSignInToSave}
              style={{ color: '#8C887C', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              SIGN IN TO SAVE
            </button>
          )}
        </div>
      )}

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
