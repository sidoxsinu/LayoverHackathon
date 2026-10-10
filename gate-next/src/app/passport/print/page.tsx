'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { createBrowserClient } from '@/lib/supabase';
import { getRank, rankProgress } from '@/lib/rank';
import { formatPassportDuration } from '@/lib/passport';
import { getSignedProofUrl } from '@/lib/proof';

interface MissionLogItem {
  id: string;
  mission_code: string;
  title: string;
  status: string;
  xp: number;
  created_at: string;
  proof_path?: string | null;
  proof_status?: string;
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
  mission_log?: MissionLogItem[];
}

function PrintPassportInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const layoverId = searchParams.get('layover');

  const { user, isConfigured, loading: authLoading } = useUser();
  const [layovers, setLayovers] = useState<LayoverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedPhotoUrls, setSignedPhotoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading) return;

    const loadData = async () => {
      let fetchedLayovers: LayoverRecord[] = [];

      // Try Supabase if user is signed in
      if (user && isConfigured) {
        const supabase = createBrowserClient();
        if (supabase) {
          try {
            const { data } = await supabase
              .from('layovers')
              .select('*, mission_log ( id, mission_code, title, status, xp, created_at, proof_path, proof_status, proof_note, proof_xp )')
              .eq('is_demo', false)
              .order('created_at', { ascending: false });

            if (data && data.length > 0) {
              fetchedLayovers = data as LayoverRecord[];
            }
          } catch {}
        }

        // Cache fallback
        if (fetchedLayovers.length === 0) {
          try {
            const cached = localStorage.getItem(`gate.passport.cache.${user.id}`);
            if (cached) {
              fetchedLayovers = JSON.parse(cached);
            }
          } catch {}
        }
      }

      // Guest / sync_queue fallback
      if (fetchedLayovers.length === 0) {
        try {
          const qRaw = localStorage.getItem('gate.sync_queue');
          if (qRaw) {
            const queue = JSON.parse(qRaw);
            fetchedLayovers = queue.map((item: any) => ({
              id: item.id || crypto.randomUUID(),
              location: item.state?.airportName || 'TBA',
              gate: item.state?.gate || 'TBA',
              survived_seconds: item.survivedSeconds || 0,
              xp: item.state?.xp || 0,
              missions_done: item.state?.log?.filter((l: any) => l.status === 'completed').length || 0,
              created_at: new Date(item.state?.startedMs || Date.now()).toISOString(),
              trip_name: item.state?.tripName || null,
              mission_log: (item.state?.log || []).map((l: any) => ({
                id: l.logId || crypto.randomUUID(),
                mission_code: l.id,
                title: l.text,
                status: l.status,
                xp: l.xp,
                created_at: new Date(l.ts || Date.now()).toISOString(),
                proof_path: l.proof_path || null,
                proof_status: l.proof_status || (l.proof_path ? 'unverified' : 'none'),
                proof_xp: l.proofXp || 0,
              })),
            }));
          }
        } catch {}
      }

      // Check localStorage current/last layover if still empty
      if (fetchedLayovers.length === 0) {
        try {
          const savedRaw = localStorage.getItem('gate.v3');
          if (savedRaw) {
            const s = JSON.parse(savedRaw);
            if (s.log && s.log.length > 0) {
              fetchedLayovers = [
                {
                  id: s.layoverId || crypto.randomUUID(),
                  location: s.airportName || 'TBA',
                  gate: s.gate || 'TBA',
                  survived_seconds: s.startedMs ? Math.floor((Date.now() - s.startedMs) / 1000) : 0,
                  xp: s.xp || 0,
                  missions_done: s.log.filter((l: any) => l.status === 'completed').length,
                  created_at: new Date(s.startedMs || Date.now()).toISOString(),
                  trip_name: s.tripName || null,
                  mission_log: s.log.map((l: any) => ({
                    id: l.logId || crypto.randomUUID(),
                    mission_code: l.id,
                    title: l.text,
                    status: l.status,
                    xp: l.xp,
                    created_at: new Date(l.ts || Date.now()).toISOString(),
                    proof_path: l.proofPath || null,
                    proof_status: l.proofStatus || (l.proofPath ? 'unverified' : 'none'),
                    proof_xp: l.proofXp || 0,
                  })),
                },
              ];
            }
          }
        } catch {}
      }

      setLayovers(fetchedLayovers);
      setLoading(false);

      // Pre-fetch signed image URLs for proof photos
      const pathsToFetch: string[] = [];
      fetchedLayovers.forEach((lay) => {
        lay.mission_log?.forEach((m) => {
          if (m.proof_path && !m.proof_path.startsWith('data:')) {
            pathsToFetch.push(m.proof_path);
          }
        });
      });

      if (pathsToFetch.length > 0) {
        const urlMap: Record<string, string> = {};
        await Promise.all(
          pathsToFetch.map(async (path) => {
            const url = await getSignedProofUrl(path);
            if (url) urlMap[path] = url;
          })
        );
        setSignedPhotoUrls(urlMap);
      }
    };

    loadData();
  }, [user, isConfigured, authLoading]);

  // Filter if layoverId is provided
  const targetLayovers = useMemo(() => {
    if (!layoverId || layoverId === 'all') return layovers;
    const single = layovers.filter((l) => l.id === layoverId);
    return single.length > 0 ? single : layovers;
  }, [layovers, layoverId]);

  // Aggregate stats
  const totalXp = useMemo(() => {
    return targetLayovers.reduce((acc, l) => acc + (Number(l.xp) || 0), 0);
  }, [targetLayovers]);

  const totalMissions = useMemo(() => {
    return targetLayovers.reduce((acc, l) => acc + (Number(l.missions_done) || 0), 0);
  }, [targetLayovers]);

  const allPhotos = useMemo(() => {
    const list: { photoPath: string; title: string; location: string; date: string }[] = [];
    targetLayovers.forEach((l) => {
      l.mission_log?.forEach((m) => {
        if (m.proof_path) {
          list.push({
            photoPath: m.proof_path,
            title: m.title,
            location: l.location,
            date: new Date(m.created_at).toLocaleDateString(),
          });
        }
      });
    });
    return list;
  }, [targetLayovers]);

  const currentRank = getRank(totalXp);
  const progress = rankProgress(totalXp);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#101010',
        minHeight: '100dvh',
      }}
      className="text-paper flex flex-col items-center p-0 md:p-6"
    >
      {/* Top Action Bar (hidden when printing) */}
      <header
        style={{
          width: '100%',
          maxWidth: '800px',
          backgroundColor: '#181816',
          borderColor: '#34322C',
        }}
        className="print:hidden border-b border-line p-4 flex justify-between items-center mb-4 sticky top-0 z-30"
      >
        <button
          onClick={() => router.back()}
          style={{ minHeight: '48px', minWidth: '48px' }}
          className="px-4 border border-line bg-ink text-muted hover:text-paper font-mono text-xs uppercase tracking-wider flex items-center justify-center rounded-[2px]"
        >
          ← RETURN
        </button>

        <span className="font-mono text-xs text-muted tracking-widest uppercase">
          PRINTABLE PASSPORT
        </span>

        <button
          onClick={handlePrint}
          disabled={loading || targetLayovers.length === 0}
          style={{ minHeight: '48px', minWidth: '48px' }}
          className="px-5 bg-amber text-ink font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center rounded-[2px] disabled:opacity-40"
        >
          PRINT / SAVE PDF
        </button>
      </header>

      {/* Printable Sheet (Paper styled, standard letter / A4 layout) */}
      <main
        style={{
          width: '100%',
          maxWidth: '800px',
          backgroundColor: '#E6E1D3', // Paper background
          color: '#101010', // Dark ink text
          borderColor: '#34322C',
        }}
        className="p-6 md:p-10 border border-line print:m-0 print:p-8 print:w-full print:max-w-none print:border-none"
      >
        {/* Certificate / Boarding Pass Header */}
        <div className="border-b-2 border-ink pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-sans text-xs font-bold tracking-[0.25em] text-muted uppercase">
                OFFICIAL TRANSIT DOCUMENT
              </div>
              <h1 className="font-sans text-4xl font-extrabold tracking-tight uppercase leading-none mt-1">
                GATE PASSPORT
              </h1>
              <div className="font-mono text-xs text-muted uppercase mt-1">
                COMPLETION CERTIFICATE & TRAVELER RECORD
              </div>
            </div>

            {/* Verification Stamp Box */}
            <div
              style={{
                borderColor: '#101010',
              }}
              className="border-2 border-ink p-2.5 text-center -rotate-2 select-none"
            >
              <div className="font-sans text-[9px] font-bold tracking-widest uppercase text-muted">
                VERIFIED STATUS
              </div>
              <div className="font-sans text-sm font-bold uppercase tracking-wider text-signal mt-0.5">
                CONCOURSE CLEARED
              </div>
              <div className="font-mono text-[9px] text-muted uppercase mt-0.5">
                SECURITY LOGGED
              </div>
            </div>
          </div>
        </div>

        {/* Traveler Rank & XP Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-ink mb-6 bg-paper">
          <div>
            <div className="font-sans text-[10px] font-bold tracking-widest text-muted uppercase">
              RANK TIER
            </div>
            <div className="font-sans text-xl font-bold uppercase mt-0.5">
              {currentRank.title}
            </div>
            <div className="font-mono text-xs text-muted uppercase mt-0.5">
              LEVEL {currentRank.level} OF 5
            </div>
          </div>

          <div>
            <div className="font-sans text-[10px] font-bold tracking-widest text-muted uppercase">
              TOTAL XP
            </div>
            <div className="font-mono text-2xl font-bold mt-0.5">
              {totalXp} XP
            </div>
          </div>

          <div>
            <div className="font-sans text-[10px] font-bold tracking-widest text-muted uppercase">
              MISSIONS COMPLETED
            </div>
            <div className="font-mono text-2xl font-bold mt-0.5">
              {totalMissions}
            </div>
          </div>

          <div>
            <div className="font-sans text-[10px] font-bold tracking-widest text-muted uppercase">
              PHOTO PROOFS
            </div>
            <div className="font-mono text-2xl font-bold mt-0.5">
              {allPhotos.length}
            </div>
          </div>
        </div>

        {/* Rank Meaning Quotation */}
        <div className="p-3 border-l-2 border-amber bg-[#DDD7C6] font-mono text-xs uppercase mb-6 text-ink">
          &quot;{currentRank.meaning}&quot;
        </div>

        {/* Layover Logs Breakdown */}
        <section className="mb-8">
          <div className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-muted mb-3">
            LOGGED LAYOVERS ({targetLayovers.length})
          </div>

          {targetLayovers.length === 0 ? (
            <div className="border border-dashed border-ink p-6 text-center font-mono text-xs uppercase text-muted">
              NO COMPLETED LAYOVER SESSIONS FOUND.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {targetLayovers.map((lay) => {
                const duration = formatPassportDuration(lay.survived_seconds, lay.missions_done);
                return (
                  <div
                    key={lay.id}
                    className="border border-ink p-4 flex flex-col gap-3 bg-paper"
                  >
                    <div className="flex justify-between items-center text-xs font-mono border-b border-ink/20 pb-2">
                      <span className="font-bold">
                        {new Date(lay.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-bold">
                        {lay.trip_name ? `TRIP: ${lay.trip_name.toUpperCase()}` : 'STANDALONE LAYOVER'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                      <div>
                        <div className="font-sans text-[9px] font-bold text-muted uppercase">LOCATION</div>
                        <div className="font-bold uppercase">{lay.location}</div>
                      </div>
                      <div>
                        <div className="font-sans text-[9px] font-bold text-muted uppercase">GATE</div>
                        <div className="font-bold uppercase">{lay.gate || 'TBA'}</div>
                      </div>
                      <div>
                        <div className="font-sans text-[9px] font-bold text-muted uppercase">DURATION</div>
                        <div>{duration.text}</div>
                      </div>
                      <div>
                        <div className="font-sans text-[9px] font-bold text-muted uppercase">XP EARNED</div>
                        <div className="font-bold">+{lay.xp} XP</div>
                      </div>
                    </div>

                    {/* Missions list */}
                    {lay.mission_log && lay.mission_log.length > 0 && (
                      <div className="pt-2 border-t border-ink/20">
                        <div className="font-sans text-[9px] font-bold text-muted uppercase mb-1">
                          MISSIONS COMPLETED:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 font-mono text-[11px]">
                          {lay.mission_log.map((m) => (
                            <div key={m.id} className="flex justify-between items-center pr-2">
                              <span className="truncate mr-2 uppercase">· {m.title}</span>
                              <span className="font-bold text-ink">+{m.xp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Captured Photo Evidence Gallery */}
        {allPhotos.length > 0 && (
          <section className="mb-6">
            <div className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-muted mb-3">
              MISSION PROOF GALLERY ({allPhotos.length})
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {allPhotos.map((item, idx) => {
                const src = signedPhotoUrls[item.photoPath] || item.photoPath;
                return (
                  <div
                    key={idx}
                    className="border border-ink p-1.5 bg-paper flex flex-col gap-1"
                  >
                    <div className="aspect-square bg-ink/10 overflow-hidden flex items-center justify-center">
                      <img
                        src={src}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div className="font-mono text-[9px] truncate uppercase leading-tight mt-0.5">
                      {item.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer Signature Box */}
        <div className="border-t-2 border-ink pt-4 mt-8 flex justify-between items-end font-mono text-[10px] text-muted uppercase">
          <div>
            <div>GATE TRANSIT COMPANION APP</div>
            <div>VERIFIED ON-DEVICE TIMESTAMP: {new Date().toISOString()}</div>
          </div>
          <div className="text-right">
            <div className="border-b border-ink w-32 mb-1" />
            <div>PASSENGER SIGNATURE</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PrintPassportPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{ backgroundColor: '#101010' }}
          className="min-h-[100dvh] bg-ink flex items-center justify-center text-paper font-mono text-xs uppercase"
        >
          LOADING PRINT PREVIEW...
        </div>
      }
    >
      <PrintPassportInner />
    </Suspense>
  );
}
