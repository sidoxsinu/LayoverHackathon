'use client';
import { useState, useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

export default function DebugOverlay({ onAction }: { onAction: (action: string) => void }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{ pointerX: number; pointerY: number; posX: number; posY: number } | null>(null);
  const hasMovedRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || window.location.search.includes('dev=1')) {
      setVisible(true);
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;

    const btn = buttonRef.current;
    if (!btn) return;

    try {
      btn.setPointerCapture(e.pointerId);
    } catch {}

    const rect = btn.getBoundingClientRect();
    const currentX = pos ? pos.x : rect.left;
    const currentY = pos ? pos.y : rect.top;

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      posX: currentX,
      posY: currentY,
    };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;

    if (Math.hypot(dx, dy) > 4) {
      hasMovedRef.current = true;
    }

    if (hasMovedRef.current) {
      const newX = dragStartRef.current.posX + dx;
      const newY = dragStartRef.current.posY + dy;

      const maxX = Math.max(8, window.innerWidth - 56);
      const maxY = Math.max(8, window.innerHeight - 56);

      const clampedX = Math.max(8, Math.min(newX, maxX));
      const clampedY = Math.max(8, Math.min(newY, maxY));

      setPos({ x: clampedX, y: clampedY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const moved = hasMovedRef.current;
    dragStartRef.current = null;
    setIsDragging(false);

    if (!moved) {
      setOpen(prev => !prev);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    dragStartRef.current = null;
    setIsDragging(false);
  };

  if (!visible) return null;

  const isBottomHalf = pos ? pos.y > (typeof window !== 'undefined' ? window.innerHeight / 2 : 400) : true;
  const isRightHalf = pos ? pos.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 200) : true;

  return (
    <>
      <button
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        aria-label="Toggle developer tools"
        style={{
          position: 'fixed',
          ...(pos
            ? { left: `${pos.x}px`, top: `${pos.y}px` }
            : { bottom: '16px', right: '16px' }),
          width: '48px',
          height: '48px',
          backgroundColor: isDragging ? '#E6E1D3' : '#F2A900',
          color: '#101010',
          border: '1px solid #101010',
          borderRadius: '2px',
          fontFamily: 'var(--font-plex), monospace',
          fontWeight: '700',
          fontSize: '14px',
          zIndex: 9999,
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {open ? 'X' : 'DEV'}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            ...(pos
              ? {
                  ...(isBottomHalf
                    ? { bottom: `${window.innerHeight - pos.y + 8}px` }
                    : { top: `${pos.y + 56}px` }),
                  ...(isRightHalf
                    ? { right: `${Math.max(8, window.innerWidth - pos.x - 48)}px` }
                    : { left: `${Math.max(8, pos.x)}px` }),
                }
              : { bottom: '72px', right: '16px' }),
            backgroundColor: '#181816',
            border: '1px solid #34322C',
            borderRadius: '2px',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 9999,
            minWidth: '160px',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              color: '#8C887C',
              fontSize: '12px',
              letterSpacing: '0.1em',
              textAlign: 'center',
              paddingBottom: '4px',
              borderBottom: '1px solid #34322C',
            }}
          >
            DEMO / DEV
          </span>
          <button onClick={() => onAction('trigger_alarm')} style={btnStyle}>TRIGGER ALARM</button>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => onAction('sub_minute')} style={{ ...btnStyle, flex: 1 }}>-1 MIN</button>
            <button onClick={() => onAction('add_minute')} style={{ ...btnStyle, flex: 1 }}>+1 MIN</button>
          </div>
          <button onClick={() => onAction('fast_forward')} style={btnStyle}>-1 HOUR</button>
          <button onClick={() => onAction('fill_stats')} style={btnStyle}>FILL STATS</button>
          <button onClick={() => onAction('drain_stats')} style={btnStyle}>DRAIN STATS</button>
          <button onClick={() => onAction('reset')} style={btnStyle}>HARD RESET</button>
        </div>
      )}
    </>
  );
}

const btnStyle = {
  backgroundColor: '#E6E1D3',
  color: '#101010',
  border: 'none',
  borderRadius: '2px',
  padding: '10px',
  fontFamily: 'var(--font-barlow), sans-serif',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer',
  textAlign: 'center' as const,
};
