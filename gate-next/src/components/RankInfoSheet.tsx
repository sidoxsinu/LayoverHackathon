'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RANKS, getRank, rankProgress, MISSION_XP, PROOF_BONUS_XP } from '@/lib/rank';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  xp: number;
}

export default function RankInfoSheet({ isOpen, onClose, xp }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const currentTier = getRank(xp);
  const progress = rankProgress(xp);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab' && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Ranks and XP"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        backgroundColor: '#101010',
        width: '100%',
        height: '100dvh',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
      }}
      className="fixed inset-0 z-[80] bg-ink overflow-y-auto overscroll-contain flex flex-col items-center"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '24rem', // max-w-sm
          minHeight: '100dvh',
          backgroundColor: '#101010',
          borderColor: '#34322C',
        }}
        className="w-full max-w-sm min-h-[100dvh] bg-ink border-x border-line flex flex-col relative text-paper"
      >
        {/* Sticky Header */}
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
            RANKS AND XP
          </span>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            style={{ minHeight: '48px', minWidth: '48px' }}
            className="min-h-[48px] px-3 -mr-2 text-paper hover:text-amber font-mono text-xs tracking-wider uppercase flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-paper active:bg-panel rounded-[2px]"
          >
            CLOSE
          </button>
        </header>

        {/* Sheet Content */}
        <div className="p-4 flex-1 flex flex-col gap-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {/* Current Rank Status Box */}
          <section
            style={{ backgroundColor: '#181816', borderColor: '#34322C' }}
            className="border border-line p-4 rounded-[2px] bg-panel"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-sans text-[10px] tracking-widest text-muted uppercase font-bold">
                  CURRENT RANK
                </div>
                <div className="font-sans text-2xl font-bold tracking-wider text-signal uppercase">
                  {currentTier.title}
                </div>
                <div className="font-mono text-xs text-muted uppercase mt-0.5">
                  LEVEL {currentTier.level} OF {progress.totalLevels}
                </div>
              </div>
              <div className="text-right">
                <div className="font-sans text-[10px] tracking-widest text-muted uppercase font-bold">
                  TOTAL XP
                </div>
                <div className="font-mono text-2xl font-bold text-amber">
                  {xp}
                </div>
              </div>
            </div>

            {/* 10-Block Segmented Bar */}
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

            {progress.next ? (
              <div className="mt-3 pt-3 border-t border-line font-mono text-xs text-muted uppercase tracking-wider">
                ABOUT {progress.missionsToNext} MISSIONS, OR {progress.missionsToNextWithProof} WITH PHOTO PROOF
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-line font-mono text-xs text-signal uppercase tracking-wider">
                HIGHEST RANK ACHIEVED
              </div>
            )}
          </section>

          {/* Section: How to Earn XP */}
          <section
            style={{ backgroundColor: '#181816', borderColor: '#34322C' }}
            className="border border-line p-4 rounded-[2px] bg-panel"
          >
            <div className="font-sans text-[11px] tracking-[0.2em] text-muted font-bold uppercase mb-3">
              HOW TO EARN XP
            </div>
            <div className="flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-line">
                <span className="text-paper">COMPLETE A MISSION</span>
                <span className="text-amber font-bold">+{MISSION_XP}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-line">
                <span className="text-paper">ADD A PHOTO PROOF</span>
                <span className="text-amber font-bold">+{PROOF_BONUS_XP}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-line">
                <span className="text-paper">SKIP A MISSION</span>
                <span className="text-muted">0</span>
              </div>
              <div className="pt-2 text-[11px] text-muted uppercase tracking-wider">
                XP IS NEVER LOST
              </div>
            </div>
          </section>

          {/* Section: Ladder Table */}
          <section
            style={{ backgroundColor: '#181816', borderColor: '#34322C' }}
            className="border border-line p-4 rounded-[2px] bg-panel"
          >
            <div className="font-sans text-[11px] tracking-[0.2em] text-muted font-bold uppercase mb-3">
              RANK LADDER
            </div>

            <div className="flex flex-col gap-3">
              {RANKS.map((tier) => {
                const isCurrent = tier.level === currentTier.level;
                const isReached = tier.level < currentTier.level;
                const isLocked = tier.level > currentTier.level;

                return (
                  <div
                    key={tier.level}
                    style={{
                      borderColor: isCurrent ? '#F2A900' : '#34322C',
                      backgroundColor: isCurrent ? '#201f1a' : '#141412',
                    }}
                    className={`border p-3 rounded-[2px] flex flex-col gap-1.5 ${
                      isCurrent ? 'border-amber bg-ink' : 'border-line'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted font-bold">
                          LV {String(tier.level).padStart(2, '0')}
                        </span>
                        <span
                          className={`font-sans text-sm font-bold uppercase tracking-wider ${
                            isCurrent
                              ? 'text-amber'
                              : isReached
                              ? 'text-paper'
                              : 'text-muted'
                          }`}
                        >
                          {tier.title}
                        </span>
                      </div>
                      <div>
                        {isCurrent && (
                          <span
                            style={{ borderColor: '#F2A900', color: '#F2A900' }}
                            className="border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-[1px]"
                          >
                            YOU ARE HERE
                          </span>
                        )}
                        {isReached && (
                          <span
                            style={{ borderColor: '#3F9B5B', color: '#3F9B5B' }}
                            className="border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-[1px]"
                          >
                            REACHED
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-[10px] font-mono text-muted uppercase">
                            {tier.minXp} XP
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-muted uppercase">
                      {tier.meaning}
                    </div>

                    <div className="text-[10px] font-mono text-muted uppercase">
                      XP NEEDED: {tier.minXp}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bottom Close Button */}
          <div className="mt-2">
            <button
              onClick={onClose}
              style={{
                minHeight: '48px',
                borderColor: '#34322C',
                backgroundColor: '#181816',
              }}
              className="w-full border border-line bg-panel text-paper hover:text-amber font-mono text-xs tracking-wider uppercase flex items-center justify-center rounded-[2px] focus:outline-none focus:ring-1 focus:ring-paper active:bg-ink"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}
