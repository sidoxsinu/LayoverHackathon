'use client';

import { useState } from 'react';
import { ProofStatus, getProofStatusLabel } from '@/lib/verify';

interface Props {
  photoUrl: string;
  missionTitle: string;
  missionCode?: string;
  proofStatus?: ProofStatus;
  proofNote?: string | null;
  onClose: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
}

export default function PhotoViewerModal({
  photoUrl,
  missionTitle,
  missionCode,
  proofStatus = 'unverified',
  proofNote,
  onClose,
  onDelete,
  canDelete = false,
}: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusLabel = getProofStatusLabel(proofStatus);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      setShowDeleteConfirm(false);
      onClose();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#101010',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      {/* Top Header */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #34322C',
            paddingBottom: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '14px',
                fontWeight: '700',
                letterSpacing: '0.15em',
                color: '#F2A900',
              }}
            >
              PROOF VIEWER
            </span>
            {missionCode && (
              <span
                style={{
                  fontFamily: 'var(--font-plex), monospace',
                  fontSize: '11px',
                  color: '#8C887C',
                  border: '1px solid #34322C',
                  padding: '1px 6px',
                }}
              >
                {missionCode}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '12px',
              color: '#8C887C',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            CLOSE
          </button>
        </div>

        {/* Mission title */}
        <div
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '18px',
            fontWeight: '700',
            color: '#E6E1D3',
            marginBottom: '8px',
            textTransform: 'uppercase',
          }}
        >
          {missionTitle}
        </div>

        {/* Status indicator */}
        {statusLabel && (
          <div
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: proofStatus === 'verified' ? '#3F9B5B' : proofStatus === 'rejected' ? '#C8201A' : '#F2A900',
              border: `1px solid ${proofStatus === 'verified' ? '#3F9B5B' : proofStatus === 'rejected' ? '#C8201A' : '#34322C'}`,
              backgroundColor: '#181816',
              padding: '4px 8px',
              marginBottom: '12px',
            }}
          >
            {statusLabel}
          </div>
        )}

        {proofNote && (
          <div
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '11px',
              color: '#8C887C',
              marginBottom: '12px',
            }}
          >
            NOTE: {proofNote}
          </div>
        )}
      </div>

      {/* Photo display area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#181816',
          border: '1px solid #34322C',
          margin: '12px 0',
          overflow: 'hidden',
          maxHeight: '60dvh',
        }}
      >
        <img
          src={photoUrl}
          alt={missionTitle}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      {/* Bottom actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {canDelete && onDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              flex: 1,
              minHeight: '48px',
              backgroundColor: 'transparent',
              color: '#C8201A',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              border: '1px solid #C8201A',
              borderRadius: '2px',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            DELETE PHOTO
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            flex: 1,
            minHeight: '48px',
            backgroundColor: '#181816',
            color: '#E6E1D3',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            letterSpacing: '0.1em',
            border: '1px solid #34322C',
            borderRadius: '2px',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          DISMISS
        </button>
      </div>

      {/* Delete confirmation popup */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#101010',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 70,
            padding: '16px',
          }}
        >
          <div
            style={{
              border: '1px solid #34322C',
              backgroundColor: '#181816',
              padding: '24px',
              maxWidth: '320px',
              width: '100%',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '18px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                color: '#C8201A',
                marginBottom: '16px',
              }}
            >
              DELETE PHOTO?
            </div>
            <div
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '14px',
                color: '#E6E1D3',
                marginBottom: '24px',
                lineHeight: '1.4',
              }}
            >
              THIS REMOVES THE ATTACHED PHOTO FROM THIS MISSION. THIS CANNOT BE UNDONE.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  backgroundColor: '#C8201A',
                  color: 'white',
                  border: '1px solid #C8201A',
                  height: '48px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                }}
              >
                {isDeleting ? 'DELETING...' : 'DELETE'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: '#8C887C',
                  border: '1px solid #34322C',
                  height: '48px',
                  fontFamily: 'var(--font-barlow), sans-serif',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
