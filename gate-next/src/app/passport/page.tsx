"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { load } from '@/lib/storage';
import { createBrowserClient } from '@/lib/supabase';
import { getRankInfo } from '@/lib/rank';
import { fmtDuration } from '@/lib/time';
import { useUser } from '@/hooks/useUser';

interface LayoverRecord {
  id: string;
  location: string;
  gate: string;
  survived_seconds: number;
  xp: number;
  missions_done: number;
  created_at: string;
}

export default function PassportPage() {
  const router = useRouter();
  const { user, isConfigured, loading: authLoading } = useUser();
  const [layovers, setLayovers] = useState<LayoverRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check if active layover
    const state = load();
    if (state && (state.screen === 'quest' || state.screen === 'alarm')) {
      router.replace('/');
      return;
    }

    // 2. Wait for auth to settle
    if (authLoading) return;

    // 3. If signed out, stop loading so guest line displays
    if (!isConfigured || !user) {
      setLoading(false);
      return;
    }

    // 4. Fetch layovers
    const fetchLayovers = async () => {
      const supabase = createBrowserClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('layovers')
        .select('*')
        .eq('is_demo', false)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLayovers(data as LayoverRecord[]);
      }
      setLoading(false);
    };

    fetchLayovers();
  }, [router, authLoading, isConfigured, user]);

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-[100dvh] bg-ink flex items-center justify-center p-4">
        <div className="font-mono text-muted text-sm tracking-widest uppercase">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-ink flex flex-col p-4 sm:p-8 max-w-lg mx-auto">
        <div className="flex justify-between items-center pb-4 border-b border-line mb-8">
          <button 
            onClick={() => router.push('/')}
            className="text-muted hover:text-paper font-mono text-xs uppercase"
          >
            ← BACK
          </button>
          <div className="text-right text-muted tracking-widest uppercase font-mono text-xs">PASSPORT</div>
        </div>
        <div className="flex-1 flex items-center justify-center text-center">
          <div className="font-mono text-muted text-sm tracking-widest uppercase">
            SIGN IN TO USE PASSPORT
          </div>
        </div>
      </div>
    );
  }

  const totalXp = layovers.reduce((acc, l) => acc + l.xp, 0);
  const totalCount = layovers.length;
  const { rank } = getRankInfo(totalXp);

  return (
    <div className="min-h-[100dvh] bg-ink flex flex-col p-4 sm:p-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 font-mono text-xs">
        <button
          onClick={() => router.push('/')}
          className="text-muted hover:text-ink hover:bg-paper transition-colors px-2 py-1 -ml-2 uppercase focus:outline-none focus:ring-1 focus:ring-ink"
        >
          ← RETURN
        </button>
        <div className="text-right text-muted tracking-widest uppercase">PASSPORT</div>
      </div>

      {/* Summary */}
      <div className="border border-line p-6 mb-8 bg-panel">
        <div className="font-sans text-[10px] tracking-widest text-muted mb-6 uppercase">TRAVELER SUMMARY</div>
        
        <div className="flex justify-between border-b border-line pb-4 mb-4">
          <div>
            <div className="font-sans text-[10px] tracking-widest text-muted uppercase">TOTAL XP</div>
            <div className="font-mono text-2xl font-bold text-amber">{totalXp}</div>
          </div>
          <div className="text-right">
            <div className="font-sans text-[10px] tracking-widest text-muted uppercase">CURRENT RANK</div>
            <div className="font-sans text-lg font-bold text-signal uppercase tracking-widest">{rank}</div>
          </div>
        </div>

        <div>
          <div className="font-sans text-[10px] tracking-widest text-muted uppercase">LAYOVERS SURVIVED</div>
          <div className="font-mono text-xl font-bold text-paper">{totalCount}</div>
        </div>
      </div>

      {/* Stamp List */}
      <div className="font-sans text-[10px] tracking-widest text-muted mb-4 uppercase">PAST LAYOVERS</div>
      
      {layovers.length === 0 ? (
        <div className="border border-line p-8 text-center text-muted font-mono text-sm uppercase">
          NO LAYOVERS SAVED YET.
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-12">
          {layovers.map((l) => (
            <div key={l.id} className="border border-line p-4 flex flex-col gap-3 relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-sans text-[10px] tracking-widest text-muted uppercase">LOCATION</div>
                  <div className="font-mono text-sm text-paper font-bold uppercase">{l.location}</div>
                </div>
                <div className="text-right">
                  <div className="font-sans text-[10px] tracking-widest text-muted uppercase">GATE</div>
                  <div className="font-mono text-sm text-paper font-bold uppercase">{l.gate}</div>
                </div>
              </div>
              
              <div className="border-t border-line" />

              <div className="flex justify-between items-end">
                <div className="flex gap-4">
                  <div>
                    <div className="font-sans text-[10px] tracking-widest text-muted uppercase">TIME</div>
                    <div className="font-mono text-sm text-paper">{fmtDuration(l.survived_seconds * 1000)}</div>
                  </div>
                  <div>
                    <div className="font-sans text-[10px] tracking-widest text-muted uppercase">MISSIONS</div>
                    <div className="font-mono text-sm text-paper">{l.missions_done}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-sans text-[10px] tracking-widest text-muted uppercase">XP</div>
                  <div className="font-mono text-sm font-bold text-amber">+{l.xp}</div>
                </div>
              </div>

              <div className="absolute top-2 right-2 font-mono text-[8px] text-line opacity-50">
                {new Date(l.created_at).toISOString().split('T')[0]}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
