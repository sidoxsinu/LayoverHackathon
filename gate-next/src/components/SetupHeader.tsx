"use client";

import { useUser } from '@/hooks/useUser';
import { createBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function SetupHeader() {
  const { user, isConfigured, loading } = useUser();
  const router = useRouter();

  if (!isConfigured || loading) {
    return null; // Guest mode or loading
  }

  const handleSignIn = async () => {
    const supabase = createBrowserClient();
    if (!supabase) return;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
  };

  const handleSignOut = async () => {
    const { clearPendingProofs } = await import('@/lib/proof');
    await clearPendingProofs();
    const supabase = createBrowserClient();
    if (!supabase) return;

    await supabase.auth.signOut();
  };

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 font-mono text-[10px] sm:text-xs">
      <div className="flex flex-col gap-1">
        <div className="font-bold text-ink">GATE V1.0</div>
        {user && (
          <button
            onClick={() => router.push('/passport')}
            className="text-left text-ink hover:text-amber uppercase focus:outline-none focus:ring-1 focus:ring-ink"
          >
            PASSPORT ↗
          </button>
        )}
      </div>
      
      {user ? (
        <div className="flex flex-col items-end gap-1">
          <div className="text-ink uppercase">{user.user_metadata.full_name || 'TRAVELER'}</div>
          <button 
            onClick={handleSignOut}
            className="text-muted hover:text-alarm uppercase transition-colors focus:outline-none focus:ring-1 focus:ring-ink"
          >
            SIGN OUT
          </button>
        </div>
      ) : (
        <button 
          onClick={handleSignIn}
          className="border border-ink bg-paper text-ink hover:bg-ink hover:text-paper px-2 py-1 uppercase transition-colors focus:outline-none focus:ring-1 focus:ring-ink"
        >
          SIGN IN WITH GOOGLE
        </button>
      )}
    </div>
  );
}
