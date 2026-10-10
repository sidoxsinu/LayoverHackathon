'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TourScreenId, TourStep, markTourCompleted } from '@/lib/tour';

interface TourProps {
  screen: TourScreenId;
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onDismiss: () => void;
  isAlarmActive?: boolean;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export default function Tour({
  screen,
  steps,
  isActive,
  onComplete,
  onDismiss,
  isAlarmActive = false,
}: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<TargetRect | null>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const step = steps[currentStep];

  const updateRect = useCallback(() => {
    if (!step) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.targetId}"]`);
    if (!el) {
      setRect(null);
      return;
    }

    // Scroll into view if needed
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    const domRect = el.getBoundingClientRect();
    setRect({
      top: domRect.top,
      left: domRect.left,
      width: domRect.width,
      height: domRect.height,
      bottom: domRect.bottom,
      right: domRect.right,
    });
  }, [step]);

  useEffect(() => {
    if (!isActive) return;

    // Small delay to allow element rendering/scrolling
    const t = setTimeout(updateRect, 50);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isActive, currentStep, updateRect]);

  useEffect(() => {
    if (isActive) {
      nextBtnRef.current?.focus();
    }
  }, [isActive, currentStep]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        markTourCompleted(screen);
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, screen, onDismiss]);

  if (isAlarmActive || !isActive || !step) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      markTourCompleted(screen);
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    markTourCompleted(screen);
    onDismiss();
  };

  // Compute tooltip card position
  let cardTop = 100;
  let cardLeft = 16;
  const padding = 4;

  if (typeof window !== 'undefined') {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const cardWidth = Math.min(320, screenWidth - 32);

    if (rect) {
      // Position above or below
      const spaceBelow = screenHeight - (rect.bottom + padding);
      if (spaceBelow > 220 || rect.top < 220) {
        // Below target
        cardTop = Math.min(screenHeight - 220, rect.bottom + padding + 12);
      } else {
        // Above target
        cardTop = Math.max(16, rect.top - padding - 210);
      }
      // Center horizontally relative to target, clamped inside viewport
      const targetCenter = rect.left + rect.width / 2;
      cardLeft = Math.max(16, Math.min(screenWidth - cardWidth - 16, targetCenter - cardWidth / 2));
    } else {
      // Centered if no rect found
      cardTop = Math.max(32, (screenHeight - 220) / 2);
      cardLeft = Math.max(16, (screenWidth - cardWidth) / 2);
    }
  }

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Walkthrough Tour"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70, // lower than alarm (100)
        pointerEvents: 'auto',
      }}
      className="fixed inset-0 select-none"
    >
      {/* Flat ambient dimming: 4 flat rectangles */}
      {rect ? (
        <>
          {/* Top rect */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: `${Math.max(0, rect.top - padding)}px`,
              backgroundColor: 'rgba(16, 16, 16, 0.8)',
            }}
          />
          {/* Bottom rect */}
          <div
            style={{
              position: 'fixed',
              top: `${rect.bottom + padding}px`,
              left: 0,
              width: '100vw',
              height: `calc(100vh - ${rect.bottom + padding}px)`,
              backgroundColor: 'rgba(16, 16, 16, 0.8)',
            }}
          />
          {/* Left rect */}
          <div
            style={{
              position: 'fixed',
              top: `${rect.top - padding}px`,
              left: 0,
              width: `${Math.max(0, rect.left - padding)}px`,
              height: `${rect.height + padding * 2}px`,
              backgroundColor: 'rgba(16, 16, 16, 0.8)',
            }}
          />
          {/* Right rect */}
          <div
            style={{
              position: 'fixed',
              top: `${rect.top - padding}px`,
              left: `${rect.right + padding}px`,
              width: `calc(100vw - ${rect.right + padding}px)`,
              height: `${rect.height + padding * 2}px`,
              backgroundColor: 'rgba(16, 16, 16, 0.8)',
            }}
          />
          {/* Amber outline frame around target */}
          <div
            style={{
              position: 'fixed',
              top: `${rect.top - padding}px`,
              left: `${rect.left - padding}px`,
              width: `${rect.width + padding * 2}px`,
              height: `${rect.height + padding * 2}px`,
              border: '2px solid #F2A900',
              borderRadius: '2px',
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 16, 16, 0.8)',
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        style={{
          position: 'fixed',
          top: `${cardTop}px`,
          left: `${cardLeft}px`,
          width: '320px',
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: '#181816',
          borderColor: '#34322C',
          zIndex: 75,
        }}
        className="border border-line p-4 rounded-[2px] bg-panel flex flex-col gap-3 text-paper"
      >
        <div className="flex justify-between items-center font-mono text-[11px] text-muted uppercase">
          <span className="text-amber font-bold">
            STEP {currentStep + 1} OF {steps.length}
          </span>
          <button
            onClick={handleSkip}
            style={{ minHeight: '48px' }}
            className="text-muted hover:text-paper uppercase tracking-wider font-mono text-[11px] px-2 flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-paper rounded-[2px]"
          >
            SKIP TOUR
          </button>
        </div>

        <div>
          <div className="font-sans text-base font-bold uppercase tracking-wider text-paper">
            {step.title}
          </div>
          <div className="font-mono text-xs text-muted uppercase mt-1 leading-relaxed">
            {step.description}
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex gap-2 pt-2 border-t border-line mt-1">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              style={{ minHeight: '48px', minWidth: '48px' }}
              className="flex-1 border border-line bg-ink text-paper hover:text-amber font-mono text-xs uppercase tracking-wider flex items-center justify-center rounded-[2px] focus:outline-none focus:ring-1 focus:ring-paper active:bg-panel"
            >
              BACK
            </button>
          )}
          <button
            ref={nextBtnRef}
            onClick={handleNext}
            style={{ minHeight: '48px', minWidth: '48px' }}
            className="flex-1 bg-amber text-ink font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center rounded-[2px] focus:outline-none focus:ring-1 focus:ring-paper active:opacity-90"
          >
            {currentStep === steps.length - 1 ? 'GOT IT' : 'NEXT'}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}
