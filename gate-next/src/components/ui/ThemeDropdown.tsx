'use client';
import { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
}

export default function ThemeDropdown({
  value,
  onChange,
  options,
  placeholder = 'SELECT OPTION',
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: '48px',
          backgroundColor: '#101010',
          color: '#E6E1D3',
          border: `1px solid ${isOpen ? '#F2A900' : '#34322C'}`,
          borderRadius: '2px',
          padding: '0 12px',
          fontFamily: 'var(--font-plex), monospace',
          fontSize: '13px',
          outline: 'none',
          textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          textAlign: 'left',
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selected.badge && (
                <span style={{ color: '#F2A900', fontWeight: '700' }}>
                  {selected.badge}
                </span>
              )}
              <span style={{ color: '#E6E1D3' }}>{selected.label}</span>
            </div>
          ) : (
            <span style={{ color: '#8C887C' }}>{placeholder}</span>
          )}
        </div>

        {/* Airport Signage Chevron */}
        <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F2A900', flexShrink: 0 }}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            {isOpen ? (
              <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
            ) : (
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
            )}
          </svg>
        </div>
      </button>

      {/* Dropdown Menu List */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#181816',
            border: '1px solid #34322C',
            borderRadius: '2px',
            maxHeight: '260px',
            overflowY: 'auto',
            zIndex: 60,
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  padding: '12px',
                  backgroundColor: isSelected ? '#252218' : 'transparent',
                  color: isSelected ? '#F2A900' : '#E6E1D3',
                  border: 'none',
                  borderBottom: '1px solid #282622',
                  borderLeft: isSelected ? '3px solid #F2A900' : '3px solid transparent',
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  textTransform: 'uppercase',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {option.badge && (
                      <span style={{ color: '#F2A900', fontWeight: '700' }}>
                        {option.badge}
                      </span>
                    )}
                    <span style={{ color: isSelected ? '#F2A900' : '#E6E1D3', fontWeight: isSelected ? '700' : '400' }}>
                      {option.label}
                    </span>
                  </div>
                  {isSelected && (
                    <span style={{ color: '#F2A900', fontSize: '11px', fontWeight: '700' }}>
                      ACTIVE
                    </span>
                  )}
                </div>

                {option.sublabel && (
                  <div style={{ fontSize: '11px', color: '#8C887C', letterSpacing: '0.05em' }}>
                    {option.sublabel}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
