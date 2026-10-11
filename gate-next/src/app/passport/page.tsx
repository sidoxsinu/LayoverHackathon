"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { load } from '@/lib/storage';
import { createBrowserClient } from '@/lib/supabase';
import { getRank, rankProgress } from '@/lib/rank';
import { useUser } from '@/hooks/useUser';
import { getSignedProofUrl, deleteProof } from '@/lib/proof';
import { ProofStatus, getProofStatusLabel } from '@/lib/verify';
import RankInfoSheet from '@/components/RankInfoSheet';
import InfoTip from '@/components/InfoTip';
import Tour from '@/components/Tour';
import { PASSPORT_STEPS, isTourCompleted, resetTourState } from '@/lib/tour';

interface MissionLogRecord {
  id: string;
  mission_code: string;
  title: string;
  status: string;
  xp?: number;
  created_at?: string;
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

function formatPassportDuration(seconds: number, missionsDone: number): { text: string; isMuted: boolean } {
  if (!seconds || seconds <= 0) {
    return {
      text: missionsDone === 0 ? 'SKIPPED' : 'NO TIME LOGGED',
      isMuted: true,
    };
  }
  const totalMins = Math.floor(seconds / 60);
  if (totalMins < 1) {
    return { text: '< 1 MIN', isMuted: false };
  }
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) {
    return { text: `${mins} MIN`, isMuted: false };
  }
  if (mins === 0) {
    return { text: `${hours} H`, isMuted: false };
  }
  return { text: `${hours} H ${mins} MIN`, isMuted: false };
}

function formatPhotoCount(count: number): string {
  return `${count} ${count === 1 ? 'PHOTO' : 'PHOTOS'}`;
}

function getCategoryCode(code?: string, title?: string): string {
  const text = `${code || ''} ${title || ''}`.toLowerCase();
  if (text.includes('food') || text.includes('eat') || text.includes('drink') || text.includes('water') || text.includes('snack') || text.includes('coffee') || text.includes('m3') || text.includes('m9')) return 'FOOD';
  if (text.includes('plug') || text.includes('outlet') || text.includes('charge') || text.includes('battery') || text.includes('phone') || text.includes('m4')) return 'PLUG';
  if (text.includes('rest') || text.includes('nap') || text.includes('sit') || text.includes('sleep') || text.includes('quiet') || text.includes('m10')) return 'REST';
  if (text.includes('pack') || text.includes('bag') || text.includes('board') || text.includes('mirror') || text.includes('prep') || text.includes('m5') || text.includes('m6') || text.includes('m8')) return 'PREP';
  return 'MOVE';
}

function formatTimeString(isoString?: string): string {
  if (!isoString) return '00:00';
  try {
    const d = new Date(isoString);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '00:00';
  }
}

function formatDateHeader(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  } catch {
    return '';
  }
}

// 64px square thumbnail on past layover card (card only, never inside sheet)
function PassportPhotoThumb({
  path,
  alt,
}: {
  path: string;
  alt: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getSignedProofUrl(path)
      .then((url) => {
        if (isMounted) {
          if (url) setSrc(url);
          else setHasError(true);
        }
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      });
    return () => {
      isMounted = false;
    };
  }, [path]);

  if (hasError) {
    return (
      <div
        style={{ backgroundColor: '#181816', borderColor: '#34322C' }}
        className="w-16 h-16 bg-panel border border-line flex items-center justify-center font-mono text-[8px] text-muted text-center p-1 rounded-[2px]"
      >
        OFFLINE
      </div>
    );
  }

  if (!src) {
    return (
      <div
        style={{ backgroundColor: '#181816', borderColor: '#34322C' }}
        className="w-16 h-16 bg-panel border border-line flex items-center justify-center font-mono text-[8px] text-muted uppercase rounded-[2px]"
      >
        LOADING
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: '#181816', borderColor: '#34322C' }}
      className="w-16 h-16 border border-line rounded-[2px] bg-panel overflow-hidden block pointer-events-none"
    >
      <img src={src} alt={alt} loading="lazy" decoding="async" className="w-16 h-16 object-cover block" />
    </div>
  );
}

// Individual photo frame inside the 2-column memory view
function MemoryFrame({
  photo,
  index,
  onOpenLightbox,
}: {
  photo: MissionLogRecord;
  index: number;
  onOpenLightbox: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!photo.proof_path) {
      setHasError(true);
      return;
    }
    getSignedProofUrl(photo.proof_path)
      .then((url) => {
        if (isMounted) {
          if (url) setSrc(url);
          else setHasError(true);
        }
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      });
    return () => {
      isMounted = false;
    };
  }, [photo.proof_path]);

  const rotation = index % 2 === 0 ? '-1.5deg' : '1deg';
  const itemNo = (index + 1).toString().padStart(2, '0');
  const cat = getCategoryCode(photo.mission_code, photo.title);
  const timeStr = formatTimeString(photo.created_at);
  const statusLabel = getProofStatusLabel(photo.proof_status || 'unverified');

  return (
    <div
      onClick={onOpenLightbox}
      tabIndex={0}
      role="button"
      aria-label={`Open framed photo for ${photo.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenLightbox();
        }
      }}
      style={{
        transform: `rotate(${rotation})`,
        backgroundColor: '#E6E1D3', // solid paper mat
        borderColor: '#34322C',
      }}
      className="bg-paper p-2 border border-line rounded-[2px] cursor-pointer active:scale-[0.99] transition-none flex flex-col justify-between select-none focus:outline-none focus:ring-1 focus:ring-paper"
    >
      {/* Top mat header: Normal flex row above photo */}
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-sans font-bold text-xs text-ink uppercase tracking-wider">
          No. {itemNo}
        </span>
        <span
          style={{ backgroundColor: '#101010' }}
          className="bg-ink px-1.5 py-0.5 text-[9px] font-mono text-amber font-bold uppercase rounded-[1px]"
        >
          {cat}
        </span>
      </div>

      {/* Frame image container */}
      <div
        style={{ backgroundColor: '#181816', borderColor: '#34322C' }}
        className="aspect-[4/5] w-full bg-panel border border-line overflow-hidden flex items-center justify-center"
      >
        {hasError ? (
          <div className="p-2 text-center font-mono text-[9px] text-muted uppercase">
            PHOTO UNAVAILABLE OFFLINE
          </div>
        ) : !src ? (
          <div className="font-mono text-[9px] text-muted uppercase">
            LOADING...
          </div>
        ) : (
          <img
            src={src}
            alt={photo.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover block"
          />
        )}
      </div>

      {/* Caption strip under photo: Block inside normal flow */}
      <div className="mt-2 flex flex-col gap-0.5">
        <div className="font-mono text-[11px] text-ink font-bold truncate leading-tight uppercase">
          {photo.title}
        </div>
        <div className="flex justify-between items-center font-mono text-[9px] text-ink/80">
          <span>{timeStr}</span>
          <span className="text-[9px] font-bold tracking-tight uppercase">
            {photo.proof_xp ? `+${photo.proof_xp} XP` : '+20 XP'}
          </span>
        </div>
        {statusLabel && (
          <div className="mt-1 font-mono text-[8px] uppercase tracking-wider text-ink font-bold border-t border-ink/20 pt-1">
            {statusLabel}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PassportPage() {
  const router = useRouter();
  const { user, isConfigured, loading: authLoading } = useUser();
  const [layovers, setLayovers] = useState<LayoverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Memories Sheet state
  const [activeMemoryLayover, setActiveMemoryLayover] = useState<LayoverRecord | null>(null);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxSignedUrls, setLightboxSignedUrls] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRankSheet, setShowRankSheet] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // DOM Refs for scroll lock and focus management
  const passportPageRef = useRef<HTMLDivElement>(null);
  const sheetContainerRef = useRef<HTMLDivElement>(null);
  const sheetCloseBtnRef = useRef<HTMLButtonElement>(null);
  const lightboxContainerRef = useRef<HTMLDivElement>(null);
  const lightboxCloseBtnRef = useRef<HTMLButtonElement>(null);
  const prevScrollY = useRef(0);

  useEffect(() => {
    setMounted(true);
    if (!isTourCompleted('passport')) {
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // 1. Check if active layover is underway
    const state = load();
    if (state && (state.screen === 'quest' || state.screen === 'alarm')) {
      router.replace('/');
      return;
    }

    // 2. Wait for auth initialization
    if (authLoading) return;

    // 3. Offline tracking
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    // 4. Fetch layovers
    const fetchLayovers = async () => {
      if (user && isConfigured) {
        const cacheKey = `gate.passport.cache.${user.id}`;
        const supabase = createBrowserClient();
        if (supabase) {
          try {
            const { data, error } = await supabase
              .from('layovers')
              .select('*, mission_log ( id, mission_code, title, status, xp, created_at, proof_path, proof_status, proof_note, proof_xp )')
              .eq('is_demo', false)
              .order('created_at', { ascending: false });

            if (!error && data) {
              setLayovers(data as LayoverRecord[]);
              try {
                localStorage.setItem(cacheKey, JSON.stringify(data));
              } catch {}
              setLoading(false);
              return;
            }
          } catch {}
        }

        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            setLayovers(JSON.parse(cached));
            setIsOffline(true);
            setLoading(false);
            return;
          }
        } catch {}
      }

      try {
        const qRaw = localStorage.getItem('gate.sync_queue');
        if (qRaw) {
          const queue = JSON.parse(qRaw);
          const guestLayovers: LayoverRecord[] = queue.map((item: any) => ({
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
              proof_status: (l.proof_status || (l.proof_path ? 'unverified' : 'none')) as ProofStatus,
              proof_note: null,
              proof_xp: l.proofXp || 0,
            })),
          }));
          setLayovers(guestLayovers);
        }
      } catch {}

      setLoading(false);
    };

    fetchLayovers();
  }, [router, authLoading, isConfigured, user]);

  // Total metrics strictly guarded against NaN and negatives
  const totalXp = useMemo(() => {
    return layovers.reduce((acc, l) => {
      const val = Number(l.xp);
      return acc + (!isNaN(val) && isFinite(val) && val > 0 ? val : 0);
    }, 0);
  }, [layovers]);

  const totalMissions = useMemo(() => {
    return layovers.reduce((acc, l) => {
      const val = Number(l.missions_done);
      return acc + (!isNaN(val) && isFinite(val) && val > 0 ? val : 0);
    }, 0);
  }, [layovers]);

  const totalPhotos = useMemo(() => {
    return layovers.reduce((acc, l) => {
      const photos = l.mission_log?.filter((m) => Boolean(m.proof_path)) || [];
      return acc + photos.length;
    }, 0);
  }, [layovers]);

  const longestDurationStr = useMemo(() => {
    const maxSecs = layovers.reduce((max, l) => {
      const val = Number(l.survived_seconds);
      return !isNaN(val) && isFinite(val) && val > max ? val : max;
    }, 0);
    if (maxSecs <= 0) return '0 MIN';
    return formatPassportDuration(maxSecs, 1).text;
  }, [layovers]);

  const currentRank = getRank(totalXp);
  const progress = rankProgress(totalXp);

  // Photos of the currently open memory view
  const activePhotos = useMemo(() => {
    if (!activeMemoryLayover || !activeMemoryLayover.mission_log) return [];
    return activeMemoryLayover.mission_log.filter((m) => Boolean(m.proof_path));
  }, [activeMemoryLayover]);

  // Pre-fetch signed URLs for the lightbox when memory sheet opens
  useEffect(() => {
    if (activePhotos.length === 0) return;
    activePhotos.forEach((p) => {
      if (p.proof_path && !lightboxSignedUrls[p.proof_path]) {
        getSignedProofUrl(p.proof_path).then((url) => {
          if (url) {
            setLightboxSignedUrls((prev) => ({ ...prev, [p.proof_path!]: url }));
          }
        });
      }
    });
  }, [activePhotos, lightboxSignedUrls]);

  // Lock body scroll and set inert on passport root while sheet is open
  useEffect(() => {
    const isSheetOpen = Boolean(activeMemoryLayover);
    if (isSheetOpen) {
      prevScrollY.current = window.scrollY;
      document.body.style.overflow = 'hidden';
      if (passportPageRef.current) {
        passportPageRef.current.setAttribute('inert', '');
        passportPageRef.current.setAttribute('aria-hidden', 'true');
      }
    } else {
      document.body.style.overflow = '';
      if (passportPageRef.current) {
        passportPageRef.current.removeAttribute('inert');
        passportPageRef.current.removeAttribute('aria-hidden');
      }
      window.scrollTo(0, prevScrollY.current);
    }

    return () => {
      document.body.style.overflow = '';
      if (passportPageRef.current) {
        passportPageRef.current.removeAttribute('inert');
        passportPageRef.current.removeAttribute('aria-hidden');
      }
    };
  }, [activeMemoryLayover]);

  // Initial focus management
  useEffect(() => {
    if (activeMemoryLayover && lightboxIndex === null) {
      sheetCloseBtnRef.current?.focus();
    } else if (lightboxIndex !== null) {
      lightboxCloseBtnRef.current?.focus();
    }
  }, [activeMemoryLayover, lightboxIndex]);

  // Keyboard navigation & Esc key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (lightboxIndex !== null) {
          // Returning from lightbox to sheet
          setLightboxIndex(null);
        } else if (activeMemoryLayover) {
          // Returning from sheet to passport
          setActiveMemoryLayover(null);
        }
        return;
      }

      if (lightboxIndex !== null) {
        if (e.key === 'ArrowLeft') {
          setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : activePhotos.length - 1));
        } else if (e.key === 'ArrowRight') {
          setLightboxIndex((prev) => (prev !== null && prev < activePhotos.length - 1 ? prev + 1 : 0));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMemoryLayover, lightboxIndex, activePhotos.length, showDeleteConfirm]);

  // Focus trap inside modals
  const handleTrapFocus = (container: HTMLElement | null, e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !container) return;
    const focusables = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (lightboxIndex === null || !activeMemoryLayover) return;
    const photoToDelete = activePhotos[lightboxIndex];
    if (!photoToDelete || !photoToDelete.proof_path) return;

    setIsDeleting(true);
    await deleteProof({ logId: photoToDelete.id, path: photoToDelete.proof_path });

    setLayovers((prev) =>
      prev.map((l) => {
        if (l.id !== activeMemoryLayover.id || !l.mission_log) return l;
        return {
          ...l,
          mission_log: l.mission_log.map((m) =>
            m.id === photoToDelete.id ? { ...m, proof_path: null, proof_status: 'none' as ProofStatus } : m
          ),
        };
      })
    );

    setActiveMemoryLayover((prev) => {
      if (!prev || !prev.mission_log) return prev;
      return {
        ...prev,
        mission_log: prev.mission_log.map((m) =>
          m.id === photoToDelete.id ? { ...m, proof_path: null, proof_status: 'none' as ProofStatus } : m
        ),
      };
    });

    setIsDeleting(false);
    setShowDeleteConfirm(false);

    if (activePhotos.length <= 1) {
      setLightboxIndex(null);
    } else if (lightboxIndex >= activePhotos.length - 1) {
      setLightboxIndex(activePhotos.length - 2);
    }
  };

  const handleSaveFrame = async () => {
    if (lightboxIndex === null || !activePhotos[lightboxIndex]) return;
    const currentPhoto = activePhotos[lightboxIndex];
    const url = currentPhoto.proof_path ? lightboxSignedUrls[currentPhoto.proof_path] : null;
    if (!url) return;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Paper mat background
      ctx.fillStyle = '#E6E1D3';
      ctx.fillRect(0, 0, 800, 1000);

      // Frame line border
      ctx.strokeStyle = '#34322C';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, 784, 984);

      // Top label
      ctx.fillStyle = '#101010';
      ctx.font = 'bold 24px "Barlow Condensed", sans-serif';
      ctx.fillText(`GATE · No. ${(lightboxIndex + 1).toString().padStart(2, '0')}`, 40, 50);

      const cat = getCategoryCode(currentPhoto.mission_code, currentPhoto.title);
      ctx.fillStyle = '#F2A900';
      ctx.fillRect(700, 30, 60, 26);
      ctx.fillStyle = '#101010';
      ctx.font = 'bold 16px "IBM Plex Mono", monospace';
      ctx.fillText(cat, 710, 48);

      // Draw photo in center
      ctx.drawImage(img, 40, 70, 720, 800);

      // Photo border
      ctx.strokeStyle = '#34322C';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 70, 720, 800);

      // Bottom caption
      ctx.fillStyle = '#101010';
      ctx.font = 'bold 20px "IBM Plex Mono", monospace';
      ctx.fillText(currentPhoto.title.substring(0, 45).toUpperCase(), 40, 910);

      ctx.fillStyle = '#8C887C';
      ctx.font = '16px "IBM Plex Mono", monospace';
      ctx.fillText(`LOCATION: ${activeMemoryLayover?.location || 'TBA'} · ${currentRank.title.toUpperCase()}`, 40, 940);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `gate-memory-${activeMemoryLayover?.id.slice(0, 8)}-${lightboxIndex + 1}.png`;
      a.click();
    } catch (err) {
      console.warn('Save frame error:', err);
    }
  };

  const groupedLayovers = useMemo(() => {
    const dates = new Set(layovers.map((l) => formatDateHeader(l.created_at)));
    const hasMultipleDates = dates.size > 1;
    let lastDate = '';

    return layovers.map((l) => {
      const currentDate = formatDateHeader(l.created_at);
      const isNewDate = hasMultipleDates && currentDate !== lastDate;
      lastDate = currentDate;
      return {
        layover: l,
        showDateHeader: isNewDate,
        dateHeader: currentDate,
      };
    });
  }, [layovers]);

  if (authLoading || (loading && user)) {
    return (
      <div
        style={{ backgroundColor: '#101010' }}
        className="min-h-[100dvh] bg-ink flex items-center justify-center p-4"
      >
        <div className="font-mono text-muted text-sm tracking-widest uppercase">LOADING...</div>
      </div>
    );
  }

  return (
    <>
      {/* =========================================================================
          PASSPORT PAGE ROOT (wrapped with ref for inert/aria-hidden locking)
          ========================================================================= */}
      <div
        ref={passportPageRef}
        style={{ backgroundColor: '#101010' }}
        className="min-h-[100dvh] bg-ink flex flex-col max-w-sm mx-auto border-x border-line relative text-paper"
      >
        {/* Sticky Header with safe-area padding */}
        <header
          style={{ backgroundColor: '#101010', borderColor: '#34322C' }}
          className="sticky top-0 z-20 bg-ink border-b border-line px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex justify-between items-center"
        >
          <button
            onClick={() => router.push('/')}
            style={{ minHeight: '48px' }}
            className="min-h-[48px] px-3 -ml-2 text-muted hover:text-paper font-mono text-xs tracking-wider uppercase flex items-center focus:outline-none focus:ring-1 focus:ring-paper active:bg-panel rounded-[2px]"
          >
            ← RETURN
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetTourState();
                setShowTour(true);
              }}
              style={{ minHeight: '48px' }}
              className="min-h-[48px] px-2 text-muted hover:text-amber font-mono text-xs tracking-wider uppercase flex items-center focus:outline-none focus:ring-1 focus:ring-paper rounded-[2px]"
            >
              HOW IT WORKS
            </button>
            <span className="font-mono text-xs tracking-widest text-muted uppercase">PASSPORT</span>
          </div>
        </header>

        <main className="flex-1 p-4 flex flex-col">
          {/* Offline indicator */}
          {isOffline && (
            <div
              style={{ backgroundColor: '#181816', borderColor: '#34322C' }}
              className="border border-line bg-panel p-2 mb-4 text-center font-mono text-[10px] text-muted uppercase tracking-wider"
            >
              OFFLINE · SHOWING SAVED PASSPORT
            </div>
          )}

          {/* Traveler Summary Card */}
          <section
            data-tour="passport-summary"
            style={{ backgroundColor: '#181816', borderColor: '#34322C' }}
            className="border border-line p-5 mb-6 bg-panel rounded-[2px]"
          >
            <div className="font-sans text-[11px] tracking-[0.2em] text-muted font-bold uppercase mb-4">
              TRAVELER SUMMARY
            </div>

            <div
              style={{ borderColor: '#34322C' }}
              className="flex justify-between items-center pb-4 border-b border-line"
            >
              <div>
                <div className="font-sans text-[10px] tracking-widest text-muted uppercase">TOTAL XP</div>
                <div className="font-mono text-3xl font-bold text-amber leading-none mt-1">{totalXp}</div>
              </div>

              {/* Rotated Rank Stamp with WHAT IS THIS affordance */}
              <button
                data-tour="passport-rank"
                type="button"
                onClick={() => setShowRankSheet(true)}
                aria-label="WHAT IS THIS?"
                className="flex flex-col items-end group focus:outline-none cursor-pointer"
              >
                <div
                  style={{ borderColor: '#3F9B5B', color: '#3F9B5B' }}
                  className="border-2 border-signal text-signal px-3 py-1.5 -rotate-4 rounded-[2px] inline-block text-center select-none"
                >
                  <div className="font-sans text-[9px] tracking-[0.2em] text-muted uppercase font-bold">
                    RANK
                  </div>
                  <div className="font-sans text-base font-bold tracking-wider uppercase leading-tight">
                    {currentRank.title}
                  </div>
                  <div className="font-mono text-[10px] text-muted uppercase mt-0.5">
                    LEVEL {currentRank.level} OF 5
                  </div>
                </div>
                <span className="font-mono text-[11px] text-amber group-hover:underline uppercase mt-1 min-h-[48px] flex items-center">
                  WHAT IS THIS?
                </span>
              </button>
            </div>

            {/* Segmented Rank Progress Bar (10 blocks) */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5 font-mono text-[11px]">
                <span className="font-sans text-[10px] tracking-widest text-muted uppercase font-bold">
                  PROGRESS
                </span>
                <span className="text-muted uppercase tracking-wider">
                  {progress.next
                    ? `${progress.xpToNext} XP TO ${progress.next.title.toUpperCase()}`
                    : 'MAX RANK'}
                </span>
              </div>
              <div className="flex gap-1 w-full">
                {Array.from({ length: 10 }).map((_, i) => {
                  const isFilled = i < Math.round(progress.pct / 10);
                  return (
                    <div
                      key={i}
                      style={{ backgroundColor: isFilled ? '#3F9B5B' : '#34322C' }}
                      className={`h-2 flex-1 rounded-[1px] ${isFilled ? 'bg-signal' : 'bg-line'}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Small Stat Tiles */}
            <div
              style={{ borderColor: '#34322C' }}
              className="grid grid-cols-3 gap-2 pt-4 border-t border-line mt-4"
            >
              <div>
                <div className="font-sans text-[9px] tracking-widest text-muted uppercase">MISSIONS TOTAL</div>
                <div className="font-mono text-lg font-bold text-paper mt-0.5">{totalMissions}</div>
              </div>
              <div>
                <div className="font-sans text-[9px] tracking-widest text-muted uppercase">PHOTOS</div>
                <div className="font-mono text-lg font-bold text-paper mt-0.5">{totalPhotos}</div>
              </div>
              <div>
                <div className="font-sans text-[9px] tracking-widest text-muted uppercase">LONGEST LAYOVER</div>
                <div className="font-mono text-lg font-bold text-paper mt-0.5 truncate">{longestDurationStr}</div>
              </div>
            </div>

            {/* Print Full Passport Button */}
            <div className="mt-4 pt-4 border-t border-line">
              <button
                data-tour="passport-print"
                onClick={() => router.push('/passport/print')}
                style={{
                  minHeight: '48px',
                  backgroundColor: '#181816',
                  borderColor: '#34322C',
                }}
                className="w-full border border-line text-paper hover:text-amber font-mono text-xs tracking-wider uppercase flex items-center justify-center rounded-[2px] focus:outline-none focus:ring-1 focus:ring-paper active:bg-ink"
              >
                PRINT FULL PASSPORT
              </button>
            </div>
          </section>

          {/* Past Layovers Section */}
          <section data-tour="passport-history" className="flex-1 pb-8">
            <div className="font-sans text-[11px] tracking-[0.2em] text-muted font-bold uppercase mb-3">
              PAST LAYOVERS
            </div>

            {layovers.length === 0 ? (
              <div
                style={{ backgroundColor: '#181816', borderColor: '#34322C' }}
                className="border border-line p-8 text-center text-muted font-mono text-xs uppercase bg-panel rounded-[2px] flex flex-col items-center gap-3"
              >
                <span>NO LAYOVERS YET. COMPLETE ONE TO GET YOUR FIRST STAMP. RANKS START AT GATE ROOKIE.</span>
                <InfoTip
                  text="COMPLETE LAYOVERS TO FILL YOUR PASSPORT WITH STAMPS AND XP."
                  label="Passport empty information"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {groupedLayovers.map(({ layover: l, showDateHeader, dateHeader }) => {
                  const photoLogs = l.mission_log?.filter((m) => Boolean(m.proof_path)) || [];
                  const isSelected = activeMemoryLayover?.id === l.id;
                  const durationInfo = formatPassportDuration(l.survived_seconds, l.missions_done);
                  const hasZeroMissions = l.missions_done === 0;

                  return (
                    <div key={l.id}>
                      {/* Date rule separator if multiple dates exist */}
                      {showDateHeader && (
                        <div className="flex items-center gap-3 my-3">
                          <div style={{ backgroundColor: '#34322C' }} className="h-[1px] flex-1 bg-line" />
                          <span className="font-mono text-[10px] text-muted uppercase tracking-widest">
                            {dateHeader}
                          </span>
                          <div style={{ backgroundColor: '#34322C' }} className="h-[1px] flex-1 bg-line" />
                        </div>
                      )}

                      {/* Layover Card */}
                      <article
                        onClick={() => setActiveMemoryLayover(l)}
                        tabIndex={0}
                        aria-label={`Open memory for layover at ${l.location}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveMemoryLayover(l);
                          }
                        }}
                        style={{
                          backgroundColor: '#181816',
                          borderColor: isSelected ? '#E6E1D3' : '#34322C',
                        }}
                        className={`border p-4 flex flex-col gap-3 rounded-[2px] bg-panel cursor-pointer select-none transition-none focus:outline-none ${
                          isSelected ? 'border-paper' : 'border-line hover:border-line focus:border-paper active:border-paper'
                        }`}
                      >
                        {/* Header Lines: Date on Line 1, Trip name on Line 2 (wrapped, no horizontal touching) */}
                        <div className="flex flex-col gap-1 text-xs font-mono">
                          <span className="text-muted uppercase tracking-wider">
                            {formatDateHeader(l.created_at)}
                          </span>
                          <span
                            className={`uppercase tracking-wider break-words line-clamp-2 ${
                              l.trip_name ? 'text-amber font-bold' : 'text-muted'
                            }`}
                          >
                            {l.trip_name ? `TRIP: ${l.trip_name}` : 'NO TRIP'}
                          </span>
                        </div>

                        {/* Row 2: Location and Gate */}
                        <div className="flex justify-between items-end">
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="font-sans text-[10px] tracking-widest text-muted uppercase font-bold">
                              LOCATION
                            </div>
                            <div
                              className={`font-mono text-sm font-bold uppercase truncate ${
                                hasZeroMissions ? 'text-muted' : 'text-paper'
                              }`}
                            >
                              {l.location}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-sans text-[10px] tracking-widest text-muted uppercase font-bold">
                              GATE
                            </div>
                            <div
                              className={`font-mono text-sm font-bold uppercase ${
                                hasZeroMissions ? 'text-muted' : 'text-paper'
                              }`}
                            >
                              {l.gate || 'TBA'}
                            </div>
                          </div>
                        </div>

                        <div style={{ borderColor: '#34322C' }} className="border-t border-line" />

                        {/* Row 3: Stats row (TIME, MISSIONS, PHOTOS, XP) */}
                        <div className="flex justify-between items-end text-xs font-mono">
                          <div className="flex gap-4">
                            <div>
                              <div className="font-sans text-[9px] tracking-widest text-muted uppercase font-bold">
                                TIME
                              </div>
                              <div className={`font-mono text-xs ${durationInfo.isMuted ? 'text-muted' : 'text-paper'}`}>
                                {durationInfo.text}
                              </div>
                            </div>
                            <div>
                              <div className="font-sans text-[9px] tracking-widest text-muted uppercase font-bold">
                                MISSIONS
                              </div>
                              <div className={`font-mono text-xs ${hasZeroMissions ? 'text-muted' : 'text-paper'}`}>
                                {l.missions_done}
                              </div>
                            </div>
                            <div>
                              <div className="font-sans text-[9px] tracking-widest text-muted uppercase font-bold">
                                PHOTOS
                              </div>
                              <div className="font-mono text-xs text-paper font-bold">
                                {formatPhotoCount(photoLogs.length)}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-sans text-[9px] tracking-widest text-muted uppercase font-bold">
                              XP
                            </div>
                            <div
                              className={`font-mono text-sm font-bold ${
                                hasZeroMissions ? 'text-muted' : 'text-amber'
                              }`}
                            >
                              +{l.xp}
                            </div>
                          </div>
                        </div>

                        {/* 64px square photo thumbnails strip (card only) */}
                        {photoLogs.length > 0 && (
                          <div
                            style={{ borderColor: '#34322C' }}
                            className="pt-2 border-t border-line flex gap-2 flex-wrap"
                          >
                            {photoLogs.map((m) => (
                              <PassportPhotoThumb
                                key={m.id}
                                path={m.proof_path!}
                                alt={m.title}
                              />
                            ))}
                          </div>
                        )}
                      </article>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* =========================================================================
          TRIP MEMORIES SHEET (createPortal into document.body, solid opaque ink)
          ========================================================================= */}
      {mounted && activeMemoryLayover && createPortal(
        <div
          ref={sheetContainerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Trip Memories"
          onKeyDown={(e) => handleTrapFocus(sheetContainerRef.current, e)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            backgroundColor: '#101010', // solid opaque ink
            width: '100%',
            height: '100dvh',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}
          className="fixed inset-0 z-50 bg-ink overflow-y-auto overscroll-contain flex flex-col items-center"
        >
          {/* Centered mobile column (max-w-sm, matching app container) */}
          <div
            style={{
              width: '100%',
              maxWidth: '24rem', // max-w-sm
              minHeight: '100dvh',
              backgroundColor: '#101010',
              borderColor: '#34322C',
            }}
            className="w-full max-w-sm min-h-[100dvh] bg-ink border-x border-line flex flex-col relative"
          >
            {/* Exactly ONE sticky header row: TRIP MEMORIES (left), CLOSE (right) */}
            <header
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 30,
                backgroundColor: '#101010',
                borderColor: '#34322C',
              }}
              className="sticky top-0 z-30 bg-ink border-b border-line px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex justify-between items-center"
            >
              <span className="font-mono text-xs text-muted tracking-widest uppercase">
                TRIP MEMORIES
              </span>
              <button
                ref={sheetCloseBtnRef}
                onClick={() => {
                  setActiveMemoryLayover(null);
                  setLightboxIndex(null);
                }}
                style={{ minHeight: '48px', minWidth: '48px' }}
                className="min-h-[48px] px-3 -mr-2 text-paper hover:text-amber font-mono text-xs tracking-wider uppercase flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-paper active:bg-panel rounded-[2px]"
              >
                CLOSE
              </button>
            </header>

            {/* Sheet Content: Boarding-pass strip, then CAPTURED FRAMES only */}
            <div className="p-4 flex-1 flex flex-col pb-[max(1rem,env(safe-area-inset-bottom))]">
              {/* Boarding-pass strip */}
              <div
                style={{ backgroundColor: '#101010', borderColor: '#34322C' }}
                className="bg-ink border border-line p-4 rounded-[2px] mb-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-sans text-[10px] tracking-widest text-muted uppercase font-bold">
                      LOCATION
                    </div>
                    <div className="font-mono text-base font-bold text-paper uppercase truncate">
                      {activeMemoryLayover.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-sans text-[10px] tracking-widest text-muted uppercase font-bold">
                      GATE
                    </div>
                    <div className="font-mono text-base font-bold text-paper uppercase">
                      {activeMemoryLayover.gate || 'TBA'}
                    </div>
                  </div>
                </div>

                {/* Dashed tear-line */}
                <div style={{ borderColor: '#34322C' }} className="border-b border-dashed border-line my-3" />

                <div className="flex justify-between items-center font-mono text-xs">
                  <span className="text-muted uppercase">
                    {formatDateHeader(activeMemoryLayover.created_at)}
                  </span>
                  <span className="text-amber font-bold uppercase">
                    +{activeMemoryLayover.xp} XP
                  </span>
                </div>
              </div>

              {/* Photos Grid or Empty State */}
              {activePhotos.length === 0 ? (
                <div
                  style={{ backgroundColor: '#101010', borderColor: '#34322C' }}
                  className="p-8 border border-line bg-ink text-center my-6 rounded-[2px]"
                >
                  <div className="font-mono text-xs text-muted uppercase mb-1">
                    NO PHOTOS FROM THIS LAYOVER.
                  </div>
                  {!user && (
                    <div className="font-mono text-[11px] text-muted uppercase">
                      GUEST PHOTOS ARE NOT SAVED.
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="font-sans text-[10px] tracking-[0.2em] text-muted font-bold uppercase mb-3">
                    CAPTURED FRAMES ({formatPhotoCount(activePhotos.length)})
                  </div>
                  {/* 2-column grid with gap: 20px and 12px padding so rotated frames never clip */}
                  <div className="grid grid-cols-2 gap-5 px-3 pb-8">
                    {activePhotos.map((photo, idx) => (
                      <MemoryFrame
                        key={photo.id}
                        photo={photo}
                        index={idx}
                        onOpenLightbox={() => setLightboxIndex(idx)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          LIGHTBOX MODAL (createPortal into document.body, z-60, opaque solid ink)
          ========================================================================= */}
      {mounted && lightboxIndex !== null && activePhotos[lightboxIndex] && createPortal(
        <div
          ref={lightboxContainerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Photo Lightbox"
          onKeyDown={(e) => handleTrapFocus(lightboxContainerRef.current, e)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            backgroundColor: '#101010', // solid opaque ink
            width: '100%',
            height: '100dvh',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}
          className="fixed inset-0 z-60 bg-ink overflow-y-auto overscroll-contain flex flex-col items-center"
        >
          {/* Centered mobile container */}
          <div
            style={{
              width: '100%',
              maxWidth: '24rem',
              minHeight: '100dvh',
              backgroundColor: '#101010',
              borderColor: '#34322C',
            }}
            className="w-full max-w-sm min-h-[100dvh] bg-ink border-x border-line flex flex-col relative"
          >
            {/* Top Bar with counter, SAVE FRAME, and CLOSE */}
            <header
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 30,
                backgroundColor: '#101010',
                borderColor: '#34322C',
              }}
              className="sticky top-0 z-30 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-line flex justify-between items-center bg-ink"
            >
              <span className="font-mono text-xs text-muted">
                {lightboxIndex + 1} / {activePhotos.length}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveFrame}
                  style={{ minHeight: '48px' }}
                  className="min-h-[48px] px-3 text-xs font-mono text-amber hover:text-paper uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-amber rounded-[2px]"
                >
                  SAVE FRAME
                </button>
                <button
                  ref={lightboxCloseBtnRef}
                  onClick={() => setLightboxIndex(null)}
                  style={{ minHeight: '48px', minWidth: '48px' }}
                  className="min-h-[48px] px-3 text-xs font-mono text-paper hover:text-amber uppercase tracking-wider flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-paper rounded-[2px]"
                >
                  CLOSE
                </button>
              </div>
            </header>

            {/* Lightbox Main Frame: Centered, max-height 70dvh */}
            <div className="flex-1 p-4 flex flex-col items-center justify-center">
              <div
                style={{
                  backgroundColor: '#E6E1D3', // paper mat
                  maxWidth: '340px',
                  borderColor: '#34322C',
                }}
                className="bg-paper p-3 border border-line rounded-[2px] w-full"
              >
                {/* Mat Top Header */}
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-sans font-bold text-xs text-ink uppercase tracking-wider">
                    No. {(lightboxIndex + 1).toString().padStart(2, '0')}
                  </span>
                  <span
                    style={{ backgroundColor: '#101010' }}
                    className="bg-ink px-2 py-0.5 text-[10px] font-mono text-amber font-bold uppercase rounded-[1px]"
                  >
                    {getCategoryCode(
                      activePhotos[lightboxIndex].mission_code,
                      activePhotos[lightboxIndex].title
                    )}
                  </span>
                </div>

                {/* Photo container with max-height 70dvh */}
                <div
                  style={{
                    backgroundColor: '#181816',
                    borderColor: '#34322C',
                    maxHeight: '70dvh',
                  }}
                  className="w-full bg-panel border border-line overflow-hidden flex items-center justify-center max-h-[70dvh]"
                >
                  {activePhotos[lightboxIndex].proof_path &&
                  lightboxSignedUrls[activePhotos[lightboxIndex].proof_path!] ? (
                    <img
                      src={lightboxSignedUrls[activePhotos[lightboxIndex].proof_path!]}
                      alt={activePhotos[lightboxIndex].title}
                      className="w-full max-h-[70dvh] object-contain block"
                    />
                  ) : (
                    <div className="p-8 font-mono text-xs text-muted uppercase">
                      LOADING...
                    </div>
                  )}
                </div>

                {/* Caption strip below photo */}
                <div className="mt-2.5 flex flex-col gap-1">
                  <div className="font-mono text-xs text-ink font-bold uppercase leading-snug">
                    {activePhotos[lightboxIndex].title}
                  </div>
                  <div className="flex justify-between items-center font-mono text-[10px] text-ink/80">
                    <span>{formatTimeString(activePhotos[lightboxIndex].created_at)}</span>
                    <span className="font-bold uppercase">
                      XP +{activePhotos[lightboxIndex].proof_xp || 20}
                    </span>
                  </div>
                  {activePhotos[lightboxIndex].proof_status && (
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-ink font-bold border-t border-ink/20 pt-1">
                      {getProofStatusLabel(activePhotos[lightboxIndex].proof_status!)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Bar: PREV / NEXT and DELETE in normal document flow */}
            <footer
              style={{
                backgroundColor: '#181816',
                borderColor: '#34322C',
              }}
              className="p-4 border-t border-line bg-panel flex justify-between items-center gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <button
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : activePhotos.length - 1
                  )
                }
                style={{ minHeight: '48px', backgroundColor: '#101010', borderColor: '#34322C' }}
                className="min-h-[48px] px-4 border border-line bg-ink text-paper font-mono text-xs tracking-wider uppercase active:bg-panel rounded-[2px]"
              >
                PREV
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{ minHeight: '48px' }}
                className="min-h-[48px] px-3 text-alarm text-xs font-mono uppercase tracking-wider hover:underline"
              >
                DELETE PHOTO
              </button>

              <button
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null && prev < activePhotos.length - 1 ? prev + 1 : 0
                  )
                }
                style={{ minHeight: '48px', backgroundColor: '#101010', borderColor: '#34322C' }}
                className="min-h-[48px] px-4 border border-line bg-ink text-paper font-mono text-xs tracking-wider uppercase active:bg-panel rounded-[2px]"
              >
                NEXT
              </button>
            </footer>

            {/* Delete Photo Confirmation Popup */}
            {showDeleteConfirm && (
              <div
                style={{ backgroundColor: '#101010' }}
                className="fixed inset-0 z-70 bg-ink flex items-center justify-center p-4"
              >
                <div
                  style={{ backgroundColor: '#181816', borderColor: '#34322C' }}
                  className="bg-panel border border-line p-6 max-w-xs w-full rounded-[2px]"
                >
                  <div className="font-sans text-sm font-bold uppercase text-paper tracking-wider mb-2">
                    DELETE PHOTO
                  </div>
                  <div className="font-mono text-xs text-muted uppercase mb-6 leading-relaxed">
                    DELETE THIS PHOTO? THIS CANNOT BE UNDONE.
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      disabled={isDeleting}
                      onClick={handleDeletePhoto}
                      style={{ minHeight: '48px', backgroundColor: '#C8201A' }}
                      className="min-h-[48px] bg-alarm text-paper font-mono text-xs uppercase tracking-wider font-bold rounded-[2px] disabled:opacity-50"
                    >
                      {isDeleting ? 'DELETING...' : 'CONFIRM DELETE'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{ minHeight: '48px', backgroundColor: '#101010', borderColor: '#34322C' }}
                      className="min-h-[48px] border border-line bg-ink text-paper font-mono text-xs uppercase tracking-wider rounded-[2px]"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      <RankInfoSheet
        isOpen={showRankSheet}
        onClose={() => setShowRankSheet(false)}
        xp={totalXp}
      />

      <Tour
        screen="passport"
        steps={PASSPORT_STEPS}
        isActive={showTour}
        onComplete={() => setShowTour(false)}
        onDismiss={() => setShowTour(false)}
      />
    </>
  );
}
