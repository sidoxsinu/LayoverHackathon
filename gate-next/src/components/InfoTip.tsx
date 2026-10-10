'use client';

import React, { useState, useEffect, useRef, useId } from 'react';

interface InfoTipProps {
  text: string;
  label?: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export default function InfoTip({
  text,
  label = 'Information',
  align = 'center',
  className = '',
}: InfoTipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: Event) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleOtherOpened = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail !== uniqueId) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('gate:infotip-opened', handleOtherOpened);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('gate:infotip-opened', handleOtherOpened);
    };
  }, [isOpen, uniqueId]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      window.dispatchEvent(
        new CustomEvent('gate:infotip-opened', { detail: uniqueId })
      );
    }
  };

  // Alignment classes for tooltip panel
  let alignClasses = 'left-1/2 -translate-x-1/2';
  if (align === 'left') {
    alignClasses = 'left-0';
  } else if (align === 'right') {
    alignClasses = 'right-0';
  }

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-expanded={isOpen}
        style={{
          minWidth: '48px',
          minHeight: '48px',
          backgroundColor: '#181816',
          borderColor: '#34322C',
        }}
        className="w-12 h-12 border border-line text-muted hover:text-paper active:text-amber font-mono text-sm font-bold flex items-center justify-center rounded-[2px] focus:outline-none focus:ring-1 focus:ring-paper transition-none select-none"
      >
        ?
      </button>

      {isOpen && (
        <div
          role="tooltip"
          style={{
            backgroundColor: '#181816',
            borderColor: '#34322C',
            zIndex: 60,
          }}
          className={`absolute top-full mt-1.5 ${alignClasses} w-64 max-w-[calc(100vw-32px)] border border-line p-3 rounded-[2px] bg-panel text-left select-none`}
        >
          <div className="font-mono text-[16px] leading-snug text-paper uppercase tracking-wider">
            {text}
          </div>
        </div>
      )}
    </div>
  );
}
