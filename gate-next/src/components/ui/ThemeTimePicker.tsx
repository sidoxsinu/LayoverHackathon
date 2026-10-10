'use client';
import { useState, useEffect } from 'react';

interface Props {
  value: string; // Format "HH:MM"
  onChange: (timeStr: string) => void;
  label?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_5 = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export default function ThemeTimePicker({ value, onChange, label }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'hour' | 'minute'>('hour');

  // Parse initial or fallback to "12:00"
  const [hh, mm] = (value && value.includes(':') ? value : '12:00').split(':');
  const [tempHour, setTempHour] = useState(hh || '12');
  const [tempMin, setTempMin] = useState(mm || '00');

  // Sync internal state when external value changes
  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setTempHour(h || '12');
      setTempMin(m || '00');
    }
  }, [value]);

  const handleOpen = () => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setTempHour(h || '12');
      setTempMin(m || '00');
    }
    setActiveTab('hour');
    setIsOpen(true);
  };

  const handleApply = () => {
    const formatted = `${tempHour.padStart(2, '0')}:${tempMin.padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleQuickAdd = (minutesToAdd: number) => {
    const now = new Date();
    const target = new Date(now.getTime() + minutesToAdd * 60000);
    const h = String(target.getHours()).padStart(2, '0');
    const m = String(target.getMinutes()).padStart(2, '0');
    setTempHour(h);
    setTempMin(m);
  };

  const handleStepMinute = (delta: number) => {
    let m = (parseInt(tempMin, 10) || 0) + delta;
    let h = parseInt(tempHour, 10) || 0;
    if (m >= 60) {
      m -= 60;
      h = (h + 1) % 24;
    } else if (m < 0) {
      m += 60;
      h = (h - 1 + 24) % 24;
    }
    setTempHour(String(h).padStart(2, '0'));
    setTempMin(String(m).padStart(2, '0'));
  };

  return (
    <>
      <input
        type="time"
        tabIndex={-1}
        aria-hidden="true"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
      />
      {/* Trigger Field */}
      <div
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpen(); }}
        style={{
          width: '100%',
          height: '48px',
          backgroundColor: '#101010',
          border: '1px solid #34322C',
          borderRadius: '2px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Clock Icon SVG in Theme */}
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ color: '#F2A900' }}>
            <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 5V10L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '20px',
              fontWeight: '700',
              color: '#F2A900',
              letterSpacing: '0.05em',
            }}
          >
            {value || '12:00'}
          </span>
          {label && (
            <span
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '12px',
                color: '#8C887C',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </span>
          )}
        </div>

        <div
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '13px',
            fontWeight: '700',
            color: '#8C887C',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>SET TIME</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="#8C887C" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </div>
      </div>

      {/* Airport Departure Clock Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 16, 16, 0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#181816',
              border: '1px solid #34322C',
              borderRadius: '2px',
              padding: '20px 16px',
              maxWidth: '380px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #34322C', paddingBottom: '10px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '13px',
                  fontWeight: '700',
                  letterSpacing: '0.2em',
                  color: '#8C887C',
                  textTransform: 'uppercase',
                }}
              >
                CLOCK TIME SELECTION
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8C887C',
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                X
              </button>
            </div>

            {/* Big Digital Clock Display */}
            <div
              style={{
                backgroundColor: '#101010',
                border: '1px solid #34322C',
                borderRadius: '2px',
                padding: '16px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {/* Hour Digit Box */}
              <button
                type="button"
                onClick={() => setActiveTab('hour')}
                style={{
                  backgroundColor: activeTab === 'hour' ? '#252218' : 'transparent',
                  border: `1px solid ${activeTab === 'hour' ? '#F2A900' : '#34322C'}`,
                  borderRadius: '2px',
                  padding: '8px 16px',
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '36px',
                  fontWeight: '700',
                  color: activeTab === 'hour' ? '#F2A900' : '#E6E1D3',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {tempHour.padStart(2, '0')}
              </button>

              <span
                style={{
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#F2A900',
                }}
              >
                :
              </span>

              {/* Minute Digit Box */}
              <button
                type="button"
                onClick={() => setActiveTab('minute')}
                style={{
                  backgroundColor: activeTab === 'minute' ? '#252218' : 'transparent',
                  border: `1px solid ${activeTab === 'minute' ? '#F2A900' : '#34322C'}`,
                  borderRadius: '2px',
                  padding: '8px 16px',
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '36px',
                  fontWeight: '700',
                  color: activeTab === 'minute' ? '#F2A900' : '#E6E1D3',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {tempMin.padStart(2, '0')}
              </button>
            </div>

            {/* Quick Flight Add Presets */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => handleQuickAdd(0)}
                style={quickChipStyle}
              >
                NOW
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(30)}
                style={quickChipStyle}
              >
                +30M
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(60)}
                style={quickChipStyle}
              >
                +1H
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(120)}
                style={quickChipStyle}
              >
                +2H
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(240)}
                style={quickChipStyle}
              >
                +4H
              </button>
            </div>

            {/* Selector Tabs (Hour vs Minute) */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #34322C', paddingBottom: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('hour')}
                style={{
                  flex: 1,
                  height: '40px',
                  backgroundColor: activeTab === 'hour' ? '#F2A900' : 'transparent',
                  color: activeTab === 'hour' ? '#101010' : '#8C887C',
                  border: 'none',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '14px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                SELECT HOUR (00-23)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('minute')}
                style={{
                  flex: 1,
                  height: '40px',
                  backgroundColor: activeTab === 'minute' ? '#F2A900' : 'transparent',
                  color: activeTab === 'minute' ? '#101010' : '#8C887C',
                  border: 'none',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '14px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                SELECT MINUTE (00-59)
              </button>
            </div>

            {/* HOURS GRID */}
            {activeTab === 'hour' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '4px',
                  maxHeight: '190px',
                  overflowY: 'auto',
                }}
              >
                {HOURS.map((h) => {
                  const isSel = tempHour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setTempHour(h);
                        setActiveTab('minute'); // Auto-advance to minute
                      }}
                      style={{
                        height: '40px',
                        backgroundColor: isSel ? '#F2A900' : '#101010',
                        color: isSel ? '#101010' : '#E6E1D3',
                        border: `1px solid ${isSel ? '#F2A900' : '#34322C'}`,
                        borderRadius: '2px',
                        fontFamily: 'var(--font-plex), monospace',
                        fontSize: '14px',
                        fontWeight: isSel ? '700' : '400',
                        cursor: 'pointer',
                      }}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            )}

            {/* MINUTES GRID + STEPPERS */}
            {activeTab === 'minute' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* 5-minute intervals grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '4px',
                  }}
                >
                  {MINUTES_5.map((m) => {
                    const isSel = tempMin === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTempMin(m)}
                        style={{
                          height: '40px',
                          backgroundColor: isSel ? '#F2A900' : '#101010',
                          color: isSel ? '#101010' : '#E6E1D3',
                          border: `1px solid ${isSel ? '#F2A900' : '#34322C'}`,
                          borderRadius: '2px',
                          fontFamily: 'var(--font-plex), monospace',
                          fontSize: '14px',
                          fontWeight: isSel ? '700' : '400',
                          cursor: 'pointer',
                        }}
                      >
                        :{m}
                      </button>
                    );
                  })}
                </div>

                {/* Fine-tuning +/- 1 min buttons */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleStepMinute(-1)}
                    style={{
                      flex: 1,
                      height: '40px',
                      backgroundColor: '#101010',
                      color: '#E6E1D3',
                      border: '1px solid #34322C',
                      borderRadius: '2px',
                      fontFamily: 'var(--font-plex), monospace',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    -1 MIN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepMinute(1)}
                    style={{
                      flex: 1,
                      height: '40px',
                      backgroundColor: '#101010',
                      color: '#E6E1D3',
                      border: '1px solid #34322C',
                      borderRadius: '2px',
                      fontFamily: 'var(--font-plex), monospace',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    +1 MIN
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleApply}
                style={{
                  flex: 2,
                  height: '48px',
                  backgroundColor: '#F2A900',
                  color: '#101010',
                  border: 'none',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '16px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                APPLY {tempHour}:{tempMin}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  flex: 1,
                  height: '48px',
                  backgroundColor: 'transparent',
                  color: '#8C887C',
                  border: '1px solid #34322C',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontSize: '14px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const quickChipStyle = {
  flex: 1,
  height: '32px',
  backgroundColor: '#181816',
  color: '#8C887C',
  border: '1px solid #34322C',
  borderRadius: '2px',
  fontFamily: 'var(--font-plex), monospace',
  fontSize: '11px',
  fontWeight: '700' as const,
  cursor: 'pointer',
  textTransform: 'uppercase' as const,
};
