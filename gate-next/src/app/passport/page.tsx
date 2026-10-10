"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { load } from '@/lib/storage';
import { createBrowserClient } from '@/lib/supabase';
import { getRankInfo } from '@/lib/rank';
import { fmtDuration } from '@/lib/time';
import { useUser } from '@/hooks/useUser';
import { getSignedProofUrl, deleteProof } from '@/lib/proof';
import { ProofStatus } from '@/lib/verify';
import PhotoViewerModal from '@/components/ui/PhotoViewerModal';

interface MissionLogRecord {
  id: string;
  mission_code: string;
  title: string;
  status: string;
  proof_path?: string | null;
  proof_status?: ProofStatus;
  proof_note?: string | null;
  proof_xp?: number;
}

interface LayoverRecord {
  id: string;
  location: string;
  gate: string;
  survived_seconds: number;
  xp: number;
  missions_done: number;
  created_at: string;
  trip_name?: string | null;
  mission_log?: MissionLogRecord[];
}

function PassportPhotoThumb({
  path,
  alt,
  onSelect,
}: {
  path: string;
  alt: string;
  onSelect: (url: string) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getSignedProofUrl(path).then((url) => {
      if (isMounted && url) setSrc(url);
    });
    return () => {
      isMounted = false;
    };
  }, [path]);

  if (!src) {
    return (
      <div className="w-16 h-16 bg-panel border border-line flex items-center justify-center font-mono text-[9px] text-muted">
        LOADING
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(src)}
      className="w-16 h-16 p-0 border border-line rounded-[2px] bg-panel cursor-pointer overflow-hidden block"
    >
      <img src={src} alt={alt} className="w-16 h-16 object-cover block" />
    </button>
  );
}

export default function PassportPage() {
  const router = useRouter();
  const { user, isConfigured, loading: authLoading } = useUser();
  const [layovers, setLayovers] = useState<LayoverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    log: MissionLogRecord;
    layoverId: string;
    url: string;
  } | null>(null);

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

    // 4. Fetch layovers with mission_log
    const fetchLayovers = async () => {
      const supabase = createBrowserClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('layovers')
        .select('*, mission_log ( id, mission_code, title, status, proof_path, proof_status, proof_note, proof_xp )')
        .eq('is_demo', false)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback without mission_log relation if not supported
        const fallback = await supabase
          .from('layovers')
          .select('*')
          .eq('is_demo', false)
          .order('created_at', { ascending: false });
        if (!fallback.error && fallback.data) {
          setLayovers(fallback.data as LayoverRecord[]);
        }
      } else if (data) {
        setLayovers(data as LayoverRecord[]);
      }
      setLoading(false);
    };

    fetchLayovers();
  }, [router, authLoading, isConfigured, user]);

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;
    const { log, layoverId } = selectedPhoto;
    if (!log.proof_path) return;

    await deleteProof({ logId: log.id, path: log.proof_path });

    // Update local state to remove photo from row
    setLayovers((prev) =>
      prev.map((l) =>
        l.id === layoverId && l.mission_log
          ? {
              ...l,
              mission_log: l.mission_log.map((m) =>
                m.id === log.id ? { ...m, proof_path: null, proof_status: 'none' as ProofStatus } : m
              ),
            }
          : l
      )
    );
  };

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
          {layovers.map((l) => {
            const photoLogs = l.mission_log?.filter((m) => Boolean(m.proof_path)) || [];

            return (
              <div key={l.id} className="border border-line p-4 flex flex-col gap-3 relative">
                {l.trip_name && (
                  <div className="font-mono text-xs text-amber font-bold uppercase tracking-wider">
                    TRIP: {l.trip_name}
                  </div>
                )}
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
                    <div>
                      <div className="font-sans text-[10px] tracking-widest text-muted uppercase">PHOTOS</div>
                      <div className="font-mono text-sm text-paper">{photoLogs.length}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-sans text-[10px] tracking-widest text-muted uppercase">XP</div>
                    <div className="font-mono text-sm font-bold text-amber">+{l.xp}</div>
                  </div>
                </div>

                {/* 64px square photo thumbnails */}
                {photoLogs.length > 0 && (
                  <div className="pt-2 border-t border-line flex gap-2 flex-wrap">
                    {photoLogs.map((m) => (
                      <PassportPhotoThumb
                        key={m.id}
                        path={m.proof_path!}
                        alt={m.title}
                        onSelect={(url) => setSelectedPhoto({ log: m, layoverId: l.id, url })}
                      />
                    ))}
                  </div>
                )}

                <div className="absolute top-2 right-2 font-mono text-[8px] text-line opacity-50">
                  {new Date(l.created_at).toISOString().split('T')[0]}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full screen photo viewer */}
      {selectedPhoto && (
        <PhotoViewerModal
          photoUrl={selectedPhoto.url}
          missionTitle={selectedPhoto.log.title}
          missionCode={selectedPhoto.log.mission_code?.toUpperCase()}
          proofStatus={selectedPhoto.log.proof_status}
          proofNote={selectedPhoto.log.proof_note}
          onClose={() => setSelectedPhoto(null)}
          onDelete={handleDeletePhoto}
          canDelete={true}
        />
      )}
    </div>
  );
}
