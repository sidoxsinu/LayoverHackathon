'use client';

import { useState, useEffect } from 'react';
import { ProofStatus, getProofStatusLabel } from '@/lib/verify';
import { getSignedProofUrl, deleteProof } from '@/lib/proof';
import PhotoViewerModal from './ui/PhotoViewerModal';

export interface LogEntry {
  logId?: string;
  id: string;
  text: string;
  status: 'completed' | 'skipped';
  xp: number;
  ts: number;
  proofPath?: string | null;
  proofStatus?: ProofStatus;
  proofCheckedAt?: string | null;
  proofNote?: string | null;
  proofXp?: number;
  localPhotoUrl?: string;
}

interface Props {
  log: LogEntry[];
  xp: number;
  onUpdateLog?: (updated: LogEntry[]) => void;
}

function ThumbnailImage({
  proofPath,
  localPhotoUrl,
  alt,
  onClick,
}: {
  proofPath?: string | null;
  localPhotoUrl?: string;
  alt: string;
  onClick: () => void;
}) {
  const [src, setSrc] = useState<string | null>(localPhotoUrl || null);

  useEffect(() => {
    if (localPhotoUrl) {
      setSrc(localPhotoUrl);
      return;
    }
    if (proofPath) {
      let isMounted = true;
      getSignedProofUrl(proofPath).then((url) => {
        if (isMounted && url) {
          setSrc(url);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [proofPath, localPhotoUrl]);

  if (!src) {
    return (
      <div
        style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#181816',
          border: '1px solid #34322C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-plex), monospace',
          fontSize: '9px',
          color: '#8C887C',
          flexShrink: 0,
        }}
      >
        LOADING
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{
        width: '64px',
        height: '64px',
        padding: 0,
        border: '1px solid #34322C',
        borderRadius: '2px',
        backgroundColor: '#181816',
        cursor: 'pointer',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'block',
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '64px',
          height: '64px',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </button>
  );
}

export default function MissionLog({ log, xp, onUpdateLog }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    entry: LogEntry;
    url: string;
  } | null>(null);

  if (log.length === 0) return null;

  const handleOpenViewer = async (entry: LogEntry) => {
    const url = entry.localPhotoUrl || (entry.proofPath ? await getSignedProofUrl(entry.proofPath) : null);
    if (url) {
      setSelectedPhoto({ entry, url });
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;
    const entry = selectedPhoto.entry;

    if (entry.proofPath && entry.logId) {
      await deleteProof({ logId: entry.logId, path: entry.proofPath });
    }

    if (onUpdateLog) {
      const updated = log.map((item) =>
        item.logId === entry.logId || item.ts === entry.ts
          ? {
              ...item,
              proofPath: null,
              localPhotoUrl: undefined,
              proofStatus: 'none' as ProofStatus,
              proofXp: 0,
              xp: Math.max(0, item.xp - (item.proofXp || 20)),
            }
          : item
      );
      onUpdateLog(updated);
    }
  };

  return (
    <div
      style={{
        margin: '0 16px 12px',
        border: '1px solid #34322C',
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          backgroundColor: '#181816',
          border: 'none',
          cursor: 'pointer',
          textTransform: 'uppercase',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '12px',
            letterSpacing: '0.15em',
            color: '#8C887C',
          }}
        >
          MISSION LOG ({log.length})
        </span>
        <span
          style={{
            fontFamily: 'var(--font-plex), monospace',
            fontSize: '12px',
            color: '#F2A900',
          }}
        >
          {xp} XP {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div style={{ backgroundColor: '#101010' }}>
          {log.map((entry, i) => {
            const hasPhoto = Boolean(entry.localPhotoUrl || entry.proofPath);
            const statusLabel = entry.proofStatus ? getProofStatusLabel(entry.proofStatus) : '';

            return (
              <div
                key={entry.logId || i}
                style={{
                  padding: '10px 12px',
                  borderTop: '1px solid #34322C',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                {/* 64px square photo thumbnail */}
                {hasPhoto && (
                  <ThumbnailImage
                    proofPath={entry.proofPath}
                    localPhotoUrl={entry.localPhotoUrl}
                    alt={entry.text}
                    onClick={() => handleOpenViewer(entry)}
                  />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-plex), monospace',
                        fontSize: '10px',
                        letterSpacing: '0.1em',
                        color: '#8C887C',
                        border: '1px solid #34322C',
                        padding: '1px 4px',
                      }}
                    >
                      {entry.id.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-barlow), sans-serif',
                        fontSize: '11px',
                        letterSpacing: '0.1em',
                        fontWeight: '700',
                        color: entry.status === 'completed' ? '#3F9B5B' : '#8C887C',
                      }}
                    >
                      {entry.status === 'completed' ? 'DONE' : 'SKIP'}
                    </span>
                    {entry.xp > 0 && (
                      <span
                        style={{
                          fontFamily: 'var(--font-plex), monospace',
                          fontSize: '11px',
                          color: '#F2A900',
                          marginLeft: 'auto',
                        }}
                      >
                        +{entry.xp} XP
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontFamily: 'var(--font-barlow), sans-serif',
                      fontSize: '14px',
                      color: '#E6E1D3',
                      lineHeight: '1.3',
                      marginBottom: statusLabel ? '6px' : '0',
                    }}
                  >
                    {entry.text}
                  </div>

                  {/* Proof Status Badge */}
                  {hasPhoto && statusLabel && (
                    <div
                      style={{
                        display: 'inline-block',
                        fontFamily: 'var(--font-plex), monospace',
                        fontSize: '10px',
                        letterSpacing: '0.08em',
                        color:
                          entry.proofStatus === 'verified'
                            ? '#3F9B5B'
                            : entry.proofStatus === 'rejected'
                            ? '#C8201A'
                            : '#F2A900',
                      }}
                    >
                      {statusLabel}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full screen photo viewer */}
      {selectedPhoto && (
        <PhotoViewerModal
          photoUrl={selectedPhoto.url}
          missionTitle={selectedPhoto.entry.text}
          missionCode={selectedPhoto.entry.id.toUpperCase()}
          proofStatus={selectedPhoto.entry.proofStatus}
          proofNote={selectedPhoto.entry.proofNote}
          onClose={() => setSelectedPhoto(null)}
          onDelete={handleDeletePhoto}
          canDelete={Boolean(selectedPhoto.entry.proofPath || selectedPhoto.entry.localPhotoUrl)}
        />
      )}
    </div>
  );
}
