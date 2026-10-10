"use client";

import { useUser } from '@/hooks/useUser';
import { createBrowserClient } from '@/lib/supabase';
import GlobalMuteButton from './GlobalMuteButton';
import { useEffect } from 'react';

interface Props {
  onSkip: () => void;
}

export default function AuthScreen({ onSkip }: Props) {
  const { user, isConfigured, loading } = useUser();

  // If already signed in, auto-skip
  useEffect(() => {
    if (!loading && user) {
      onSkip();
    }
  }, [user, loading, onSkip]);

  const handleSignIn = async () => {
    const supabase = createBrowserClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-ink flex flex-col p-4 sm:p-8 max-w-lg mx-auto relative">
      <div className="flex justify-between items-start mb-12 font-mono text-xs text-muted">
        <div>GATE / SYSTEM</div>
        <GlobalMuteButton />
      </div>

      <div className="flex flex-col items-center justify-center flex-grow mb-20">
        <h1 className="font-mono text-5xl text-paper font-bold tracking-widest uppercase mb-4">GATE</h1>
        <p className="font-sans text-muted tracking-widest uppercase text-sm mb-16 text-center">
          LAYOVER SURVIVAL COMPANION
        </p>

        <div className="h-32 flex items-center justify-center w-full">
          {loading ? (
            <div className="text-muted font-mono text-sm tracking-widest uppercase animate-pulse">CONNECTING...</div>
          ) : (
            <div className="flex flex-col gap-4 w-full max-w-xs">
              {isConfigured ? (
                <button
                  onClick={handleSignIn}
                  className="w-full bg-paper text-ink font-sans text-lg font-bold tracking-[0.15em] p-4 uppercase cursor-pointer hover:opacity-90 transition-opacity focus:outline-none"
                >
                  SIGN IN WITH GOOGLE
                </button>
              ) : (
                <div className="text-red-500 font-mono text-sm tracking-widest text-center">
                  SYSTEM UNCONFIGURED.<br />PLEASE SET SUPABASE ENV VARS.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
