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

      {/* Hero */}
      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-barlow), sans-serif',
          fontSize: '80px',
          fontWeight: '900',
          color: '#E6E1D3',
          letterSpacing: '0.05em',
          lineHeight: '1',
          marginBottom: '8px'
        }}>
          GATE
        </div>
        <div style={{
          fontFamily: 'var(--font-barlow), sans-serif',
          fontSize: '12px',
          color: '#8C887C',
          letterSpacing: '0.2em',
        }}>
          LAYOVER SURVIVAL COMPANION
        </div>
      </div>

      {/* Departure Board Sample */}
      <div style={{ padding: '0 16px', marginBottom: '40px' }}>
        <div style={{
          fontFamily: 'var(--font-barlow), sans-serif',
          fontSize: '10px',
          color: '#8C887C',
          letterSpacing: '0.15em',
          marginBottom: '8px'
        }}>
          SAMPLE
        </div>
        <div style={{ border: '1px solid #34322C', backgroundColor: '#181816', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-barlow), sans-serif', fontSize: '10px', color: '#8C887C', letterSpacing: '0.1em', marginBottom: '8px' }}>
            <span style={{ width: '40px' }}>GATE</span>
            <span style={{ width: '60px' }}>RETURN BY</span>
            <span style={{ width: '60px', textAlign: 'right' }}>SAFE TIME</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-plex), monospace', fontSize: '14px', color: '#F2A900', marginBottom: '8px' }}>
            <span style={{ width: '40px' }}>B14</span>
            <span style={{ width: '60px' }}>18:05</span>
            <span style={{ width: '60px', textAlign: 'right' }}>3H 12M</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-plex), monospace', fontSize: '14px', color: '#F2A900', marginBottom: '8px' }}>
            <span style={{ width: '40px' }}>C07</span>
            <span style={{ width: '60px' }}>21:40</span>
            <span style={{ width: '60px', textAlign: 'right' }}>0H 48M</span>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes steps-blink {
              0%, 49% { opacity: 1; }
              50%, 100% { opacity: 0; }
            }
          `}} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-plex), monospace', fontSize: '14px', color: '#C8201A', animation: 'steps-blink 1s steps(2, start) infinite' }}>
            <span style={{ width: '40px' }}>A02</span>
            <span style={{ width: '60px' }}>00:15</span>
            <span style={{ width: '60px', textAlign: 'right' }}>0H 03M</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ padding: '0 16px', marginTop: 'auto', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {(loading || isConnecting) ? (
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
            <button onClick={onSkip} style={{ ...btnStyle, backgroundColor: 'transparent', color: '#E6E1D3', border: '1px solid #E6E1D3' }}>
              CONTINUE AS GUEST
            </button>
          </>
        )}
        
        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontSize: '12px', color: '#8C887C', textAlign: 'center', lineHeight: '1.4', padding: '0 16px' }}>
          GUESTS GET EVERY FEATURE. SIGN IN TO SAVE LAYOVERS TO YOUR PASSPORT.
        </div>
      </div>
    </div>
  );
}
