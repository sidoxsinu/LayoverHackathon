"use client";

import { useUser } from '@/hooks/useUser';
import { createBrowserClient } from '@/lib/supabase';
import GlobalMuteButton from './GlobalMuteButton';
import { useEffect, useState } from 'react';
import { useNow } from '@/hooks/useNow';

interface Props {
  onSkip: () => void;
}

export default function AuthScreen({ onSkip }: Props) {
  const { user, isConfigured, loading } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);
  const now = useNow(1000); // Need 1s for the blinking row if we wanted to use JS, but we can use CSS animation.

  const dateObj = new Date(now);
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const mins = String(dateObj.getMinutes()).padStart(2, '0');
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  // If already signed in, auto-skip
  useEffect(() => {
    if (!loading && user) {
      onSkip();
    }
  }, [user, loading, onSkip]);

  const handleSignIn = async () => {
    setIsConnecting(true);
    const supabase = createBrowserClient();
    if (!supabase) {
      setIsConnecting(false);
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  const btnStyle = {
    fontFamily: 'var(--font-barlow), sans-serif',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    border: 'none',
  };

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#101010',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '390px',
      margin: '0 auto',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '24px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'var(--font-plex), monospace', fontSize: '24px', color: '#E6E1D3', lineHeight: '1' }}>
            {hours}:{mins}
          </div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontSize: '11px', color: '#8C887C', letterSpacing: '0.15em', marginTop: '4px' }}>
            {dateStr}
          </div>
        </div>
        <GlobalMuteButton />
      </div>

      {/* Vertically centered wordmark and tagline in free space */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '88px',
            fontWeight: '900',
            color: '#E6E1D3',
            letterSpacing: '0.05em',
            lineHeight: '1',
            marginBottom: '10px',
          }}
        >
          GATE
        </div>
        <div
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '13px',
            color: '#8C887C',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          LAYOVER SURVIVAL COMPANION
        </div>
      </div>

      {/* Buttons pinned to bottom with safe-area padding */}
      <div
        style={{
          padding: '0 16px max(24px, env(safe-area-inset-bottom, 24px)) 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {loading || isConnecting ? (
          <button disabled style={{ ...btnStyle, backgroundColor: '#34322C', color: '#8C887C' }}>
            CONNECTING...
          </button>
        ) : !isConfigured ? (
          <button onClick={onSkip} style={{ ...btnStyle, backgroundColor: '#F2A900', color: '#101010' }}>
            START
          </button>
        ) : (
          <>
            <button onClick={handleSignIn} style={{ ...btnStyle, backgroundColor: '#F2A900', color: '#101010' }}>
              SIGN IN WITH GOOGLE
            </button>
            <button
              onClick={onSkip}
              style={{ ...btnStyle, backgroundColor: 'transparent', color: '#E6E1D3', border: '1px solid #E6E1D3' }}
            >
              CONTINUE AS GUEST
            </button>
          </>
        )}

        <div
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '16px',
            color: '#8C887C',
            textAlign: 'center',
            lineHeight: '1.4',
            padding: '0 4px',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          Guests can run layovers. Sign in to save trips and your Passport.
        </div>
      </div>
    </div>
  );
}
