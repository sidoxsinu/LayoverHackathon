'use client';

import { useState, useRef, useEffect } from 'react';
import { processProofImage, ProcessedPhoto } from '@/lib/proof';
import InfoTip from '../InfoTip';

interface Props {
  missionTitle: string;
  proofHint: string;
  isGuest: boolean;
  onUsePhoto: (photo: ProcessedPhoto) => void;
  onSkipProof: () => void;
  onCancel: () => void;
}

export default function ProofModal({
  missionTitle,
  proofHint,
  isGuest,
  onUsePhoto,
  onSkipProof,
  onCancel,
}: Props) {
  const [photo, setPhoto] = useState<ProcessedPhoto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL if modal unmounts or photo discarded
  useEffect(() => {
    return () => {
      if (photo?.previewUrl) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    };
  }, [photo]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const processed = await processProofImage(file);
      // Revoke previous photo if exists
      if (photo?.previewUrl) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      setPhoto(processed);
    } catch (err: any) {
      console.warn('Image processing failed:', err);
      setErrorMsg(err?.message || 'PHOTO FORMAT NOT SUPPORTED, TRY AGAIN');
    } finally {
      setIsProcessing(false);
      // Reset input value so same file can be re-selected if retrying
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleRetake = () => {
    if (photo?.previewUrl) {
      URL.revokeObjectURL(photo.previewUrl);
    }
    setPhoto(null);
    setErrorMsg(null);
  };

  const handleUsePhoto = () => {
    if (!photo) return;
    onUsePhoto(photo);
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
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px',
        maxWidth: '480px',
        margin: '0 auto',
        overflowY: 'auto',
      }}
    >
      {/* Hidden file inputs: one with environment capture, one generic upload */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '14px',
                fontWeight: '700',
                letterSpacing: '0.15em',
                color: '#F2A900',
              }}
            >
              MISSION PROOF
            </span>
            <InfoTip
              text="OPTIONAL PHOTO EVIDENCE EARNS +20 BONUS XP."
              label="Proof information"
              align="left"
            />
          </div>
          <button
            onClick={onCancel}
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
            CANCEL
          </button>
        </div>

        {/* Mission Title */}
        <div
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '22px',
            fontWeight: '700',
            color: '#E6E1D3',
            lineHeight: '1.2',
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}
        >
          {missionTitle}
        </div>

        {/* Proof Hint Banner */}
        <div
          style={{
            border: '1px solid #34322C',
            backgroundColor: '#181816',
            padding: '12px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: '#F2A900',
              marginBottom: '4px',
            }}
          >
            REQUIRED PROOF:
          </div>
          <div
            style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '16px',
              fontWeight: '600',
              color: '#E6E1D3',
              letterSpacing: '0.05em',
            }}
          >
            {proofHint || 'PHOTO OF WHERE YOU ARE'}
          </div>
        </div>

        {/* Privacy Note */}
        <div
          style={{
            fontFamily: 'var(--font-plex), monospace',
            fontSize: '11px',
            color: '#8C887C',
            marginBottom: isGuest ? '6px' : '16px',
            letterSpacing: '0.05em',
          }}
        >
          NO FACES, ID OR BOARDING PASS.
        </div>

        {/* Guest Warning */}
        {isGuest && (
          <div
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '11px',
              color: '#F2A900',
              marginBottom: '16px',
              letterSpacing: '0.05em',
            }}
          >
            GUEST PHOTOS ARE NOT SAVED.
          </div>
        )}

        {/* Error message (single muted line) */}
        {errorMsg && (
          <div
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '12px',
              color: '#C8201A',
              border: '1px solid #C8201A',
              padding: '8px 12px',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Photo Preview Stage */}
        {isProcessing ? (
          <div
            style={{
              border: '1px solid #34322C',
              backgroundColor: '#181816',
              height: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '12px',
              color: '#F2A900',
              letterSpacing: '0.1em',
            }}
          >
            COMPRESSING PHOTO...
          </div>
        ) : photo ? (
          <div
            style={{
              border: '1px solid #34322C',
              backgroundColor: '#181816',
              padding: '8px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '100%',
                maxHeight: '260px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#101010',
                border: '1px solid #34322C',
              }}
            >
              <img
                src={photo.previewUrl}
                alt="Mission Proof Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '260px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '6px',
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '10px',
                color: '#8C887C',
              }}
            >
              <span>{photo.width}x{photo.height} PX</span>
              <span>{Math.round(photo.sizeBytes / 1024)} KB (JPEG 70%)</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        {photo ? (
          <>
            <button
              onClick={handleUsePhoto}
              style={{
                width: '100%',
                minHeight: '48px',
                backgroundColor: '#3F9B5B',
                color: '#101010',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '16px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                border: '1px solid #3F9B5B',
                borderRadius: '2px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              USE PHOTO (+20 XP)
            </button>
            <button
              onClick={handleRetake}
              style={{
                width: '100%',
                minHeight: '48px',
                backgroundColor: 'transparent',
                color: '#E6E1D3',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '16px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                border: '1px solid #34322C',
                borderRadius: '2px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              RETAKE
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
              style={{
                width: '100%',
                minHeight: '48px',
                backgroundColor: '#F2A900',
                color: '#101010',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '16px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                border: '1px solid #F2A900',
                borderRadius: '2px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              TAKE PHOTO
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              style={{
                width: '100%',
                minHeight: '48px',
                backgroundColor: 'transparent',
                color: '#E6E1D3',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '16px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                border: '1px solid #34322C',
                borderRadius: '2px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              UPLOAD PHOTO
            </button>
            <button
              onClick={onSkipProof}
              disabled={isProcessing}
              style={{
                width: '100%',
                minHeight: '48px',
                backgroundColor: 'transparent',
                color: '#8C887C',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontSize: '16px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                border: '1px solid #34322C',
                borderRadius: '2px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              SKIP PROOF
            </button>
          </>
        )}
      </div>
    </div>
  );
}
