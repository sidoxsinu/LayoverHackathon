'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { createBrowserClient } from '@/lib/supabase';
import { RANKS, getRank, rankProgress } from '@/lib/rank';
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
  const [imagesLoaded, setImagesLoaded] = useState(false);

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
                proof_path: l.proofPath || null,
                proof_status: l.proofStatus || null,
                proof_xp: l.proofXp || 0,
              })),
            }));
          }
        } catch {}
      }

      // Fallback: active session state in gate.v3
      if (fetchedLayovers.length === 0) {
        try {
          const raw = localStorage.getItem('gate.v3');
          if (raw) {
            const s = JSON.parse(raw);
            if (s && s.log && s.log.length > 0) {
              fetchedLayovers = [
                {
                  id: 'current-session',
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
      setImagesLoaded(true);
    };

    loadData();
  }, [user, isConfigured, authLoading]);

  // Filter if layoverId is provided
  const targetLayovers = useMemo(() => {
    if (!layoverId || layoverId === 'all') return layovers;
    const single = layovers.filter((l) => l.id === layoverId);
    return single.length > 0 ? single : layovers;
  }, [layovers, layoverId]);

  // Traveler info
  const travelerName = useMemo(() => {
    if (user?.user_metadata?.full_name) {
      return String(user.user_metadata.full_name).toUpperCase();
    }
    if (user?.email) {
      return String(user.email.split('@')[0]).toUpperCase();
    }
    return 'GUEST';
  }, [user]);

  const issuedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).toUpperCase();
  }, []);

  // Aggregate stats
  const totalXp = useMemo(() => {
    return targetLayovers.reduce((acc, l) => acc + (Number(l.xp) || 0), 0);
  }, [targetLayovers]);

  const proofXp = useMemo(() => {
    let sum = 0;
    targetLayovers.forEach((l) => {
      l.mission_log?.forEach((m) => {
        sum += (Number(m.proof_xp) || 0);
      });
    });
    return sum;
  }, [targetLayovers]);

  const missionXp = Math.max(0, totalXp - proofXp);

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

  const longestDurationStr = useMemo(() => {
    if (targetLayovers.length === 0) return '0 MIN';
    const maxSec = Math.max(...targetLayovers.map((l) => l.survived_seconds || 0));
    return formatPassportDuration(maxSec, 1).text;
  }, [targetLayovers]);

  const currentRank = getRank(totalXp);
  const progress = rankProgress(totalXp);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const isPrintDisabled = loading || targetLayovers.length === 0 || !imagesLoaded;

  return (
    <div
      style={{
        backgroundColor: '#101010',
        minHeight: '100dvh',
      }}
      className="text-paper flex flex-col items-center p-0 md:p-6"
    >
      {/* Print Styles Injection */}
      <style jsx global>{`
        @page {
          size: auto;
          margin: 12mm;
        }
        @media print {
          html, body {
            background-color: #E6E1D3 !important;
            color: #101010 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Top Action Bar (hidden when printing) */}
      <header
        style={{
          width: '100%',
          maxWidth: '800px',
          backgroundColor: '#181816',
          borderColor: '#34322C',
        }}
        className="print:hidden border-b border-line p-4 flex flex-col gap-2 mb-4 sticky top-0 z-30"
      >
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.back()}
            style={{ minHeight: '48px', minWidth: '48px' }}
            className="px-4 border border-line bg-ink text-muted hover:text-paper font-mono text-xs uppercase tracking-wider flex items-center justify-center rounded-[2px]"
          >
            ← BACK
          </button>

          <span className="font-mono text-xs text-muted tracking-widest uppercase">
            PRINTABLE PASSPORT
          </span>

          <button
            onClick={handlePrint}
            disabled={isPrintDisabled}
            style={{ minHeight: '48px', minWidth: '48px' }}
            className="px-5 bg-amber text-ink font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center rounded-[2px] disabled:opacity-40"
          >
            PRINT / SAVE PDF
          </button>
        </div>

        <div className="text-center font-mono text-[11px] text-muted uppercase">
          THE BROWSER PRINT DIALOG DOUBLES AS &quot;SAVE AS PDF&quot;.
        </div>
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
        className="p-6 md:p-10 border border-line print:m-0 print:p-0 print:w-full print:max-w-none print:border-none"
      >
        {targetLayovers.length === 0 ? (
          <div className="p-12 text-center font-mono text-sm uppercase text-ink">
            NO LAYOVERS TO PRINT.
          </div>
        ) : (
          <>
            {/* Certificate / Boarding Pass Header */}
            <div className="border-b-2 border-ink pb-4 mb-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight uppercase leading-none">
                    GATE LAYOVER PASSPORT
                  </h1>
                  <div className="font-mono text-xs uppercase mt-2 space-y-0.5">
                    <div>TRAVELER: <span className="font-bold">{travelerName}</span></div>
                    <div>ISSUED: <span className="font-bold">{issuedDate}</span></div>
                  </div>
                </div>

                {/* Square Outlined Rank Stamp */}
                <div
                  style={{
                    borderColor: '#101010',
                  }}
                  className="border-2 border-ink p-3 text-center -rotate-2 select-none min-w-[140px]"
                >
                  <div className="font-sans text-[9px] font-bold tracking-widest uppercase text-muted">
                    VERIFIED RANK
                  </div>
                  <div className="font-sans text-base font-bold uppercase tracking-wider text-ink mt-0.5">
                    {currentRank.title}
                  </div>
                  <div className="font-mono text-[10px] text-ink font-bold uppercase mt-0.5">
                    LEVEL {currentRank.level} OF {RANKS.length}
                  </div>
                  <div className="font-mono text-[8px] text-signal font-bold uppercase tracking-widest mt-1 border-t border-ink/30 pt-0.5">
                    CONCOURSE CLEARED
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Table */}
            <section className="mb-6">
              <div className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-ink mb-2">
                PASSPORT SUMMARY
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 p-3 border border-ink bg-paper text-ink">
                <div className="border-b sm:border-b-0 pb-1 sm:pb-0">
                  <div className="font-sans text-[9px] font-bold tracking-wider uppercase text-muted">TOTAL XP</div>
                  <div className="font-mono text-lg font-bold">{totalXp}</div>
                </div>
                <div className="border-b sm:border-b-0 pb-1 sm:pb-0">
                  <div className="font-sans text-[9px] font-bold tracking-wider uppercase text-muted">MISSION XP</div>
                  <div className="font-mono text-lg font-bold">{missionXp}</div>
                </div>
                <div className="border-b sm:border-b-0 pb-1 sm:pb-0">
                  <div className="font-sans text-[9px] font-bold tracking-wider uppercase text-muted">PROOF XP</div>
                  <div className="font-mono text-lg font-bold">{proofXp}</div>
                </div>
                <div className="border-b sm:border-b-0 pb-1 sm:pb-0">
                  <div className="font-sans text-[9px] font-bold tracking-wider uppercase text-muted">SURVIVED</div>
                  <div className="font-mono text-lg font-bold">{targetLayovers.length}</div>
                </div>
                <div className="border-b sm:border-b-0 pb-1 sm:pb-0">
                  <div className="font-sans text-[9px] font-bold tracking-wider uppercase text-muted">MISSIONS</div>
                  <div className="font-mono text-lg font-bold">{totalMissions}</div>
                </div>
                <div className="border-b sm:border-b-0 pb-1 sm:pb-0">
                  <div className="font-sans text-[9px] font-bold tracking-wider uppercase text-muted">PHOTOS</div>
                  <div className="font-mono text-lg font-bold">{allPhotos.length}</div>
                </div>
                <div>
                  <div className="font-sans text-[9px] font-bold tracking-wider uppercase text-muted">LONGEST</div>
                  <div className="font-mono text-sm font-bold truncate mt-1">{longestDurationStr}</div>
                </div>
              </div>
            </section>

            {/* Rank Ladder Strip */}
            <section className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-ink">
                  RANK LADDER
                </div>
                <div className="font-mono text-[11px] uppercase font-bold text-ink">
                  {progress.next
                    ? `${progress.xpToNext} XP TO ${progress.next.title.toUpperCase()}`
                    : 'MAX RANK'}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1 border border-ink p-1 bg-paper">
                {RANKS.map((r) => {
                  const isCurrent = r.level === currentRank.level;
                  const isReached = totalXp >= r.minXp;
                  return (
                    <div
                      key={r.level}
                      style={{
                        backgroundColor: isCurrent ? '#DDD7C6' : isReached ? '#E6E1D3' : 'transparent',
                        borderColor: '#101010',
                      }}
                      className={`p-2 border text-center flex flex-col justify-between ${
                        isCurrent ? 'font-bold' : isReached ? '' : 'opacity-50'
                      }`}
                    >
                      <div className="font-mono text-[10px] uppercase">LV {r.level}</div>
                      <div className="font-sans text-xs font-bold uppercase truncate my-0.5">{r.title}</div>
                      <div className="font-mono text-[9px]">{r.minXp} XP</div>
                      <div className="font-mono text-[8px] font-bold uppercase tracking-wider mt-1 border-t border-ink/20 pt-0.5">
                        {isCurrent ? 'CURRENT' : isReached ? 'REACHED' : 'LOCKED'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Layover Logs Breakdown */}
            <section className="mb-6">
              <div className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-ink mb-3">
                RECORDED LAYOVERS ({targetLayovers.length})
              </div>

              <div className="flex flex-col gap-4">
                {targetLayovers.map((lay) => {
                  const duration = formatPassportDuration(lay.survived_seconds, lay.missions_done);
                  const layPhotos = lay.mission_log?.filter((m) => Boolean(m.proof_path)) || [];
                  const layProofXp = lay.mission_log?.reduce((acc, m) => acc + (m.proof_xp || 0), 0) || 0;
                  const layMissionXp = Math.max(0, lay.xp - layProofXp);

                  return (
                    <div
                      key={lay.id}
                      className="border border-ink p-4 flex flex-col gap-3 bg-paper print-avoid-break"
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
                          <div className="font-sans text-[9px] font-bold text-muted uppercase">XP SPLIT</div>
                          <div className="font-bold">
                            +{lay.xp} XP (M: {layMissionXp} / P: {layProofXp})
                          </div>
                        </div>
                      </div>

                      {/* Missions completed */}
                      {lay.mission_log && lay.mission_log.length > 0 && (
                        <div className="pt-2 border-t border-ink/20">
                          <div className="font-sans text-[9px] font-bold text-muted uppercase mb-1">
                            MISSIONS COMPLETED ({lay.missions_done}):
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 font-mono text-[11px]">
                            {lay.mission_log.map((m) => (
                              <div key={m.id} className="flex justify-between items-center pr-2">
                                <span className="truncate mr-2 uppercase">· {m.title}</span>
                                <span className="font-bold text-ink">+{m.xp}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Thumbnails inside entry (up to 3) */}
                      {layPhotos.length > 0 ? (
                        <div className="pt-2 border-t border-ink/20">
                          <div className="font-sans text-[9px] font-bold text-muted uppercase mb-1">
                            ATTACHED PROOFS:
                          </div>
                          <div className="flex gap-2">
                            {layPhotos.slice(0, 3).map((item, idx) => {
                              const src = item.proof_path ? (signedPhotoUrls[item.proof_path] || item.proof_path) : '';
                              return (
                                <div key={idx} className="border border-ink p-1 bg-paper w-24">
                                  <div className="w-full aspect-square bg-ink/10 overflow-hidden flex items-center justify-center">
                                    {src ? (
                                      <img
                                        src={src}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                      />
                                    ) : (
                                      <div className="text-[8px] font-mono text-center p-1 uppercase text-muted">
                                        PHOTO UNAVAILABLE
                                      </div>
                                    )}
                                  </div>
                                  <div className="font-mono text-[8px] truncate uppercase leading-tight mt-0.5">
                                    {item.title}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : travelerName === 'GUEST' ? (
                        <div className="pt-1 text-[9px] font-mono text-muted uppercase">
                          GUEST PHOTOS ARE NOT SAVED.
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Footer */}
            <div className="border-t-2 border-ink pt-4 mt-8 flex justify-between items-center font-mono text-[10px] text-muted uppercase">
              <div>GATE / LAYOVER HACKATHON</div>
              <div>VERIFIED PASSENGER RECORD</div>
            </div>
          </>
        )}
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
