'use client';
import { useEffect, useRef, useState } from 'react';
import Countdown from './Countdown';
import StatBar from './StatBar';
import MissionCard from './MissionCard';
import MissionLog, { LogEntry } from './MissionLog';
import ProofModal from './ui/ProofModal';
import { Mission } from '@/lib/missions';
import { phaseFor } from '@/lib/time';
import { ProcessedPhoto } from '@/lib/proof';
import GlobalMuteButton from './GlobalMuteButton';
import InfoTip from './InfoTip';
import Tour from './Tour';
import { QUEST_STEPS, isTourCompleted } from '@/lib/tour';
import { WaitType, getWaitLabels } from '@/lib/labels';

interface Stats {
  hunger: number;
  energy: number;
  battery: number;
}

interface Props {
  returnByMs: number;
  departureMs: number;
  airportName: string;
  gate: string;
  stats: Stats;
  mission: Mission | null;
  log: LogEntry[];
  xp: number;
  demo: boolean;
  now: number;
  realBattery: number | null;
  onComplete: (photo?: ProcessedPhoto) => void;
  onSkip: () => void;
  onSafeReturn: () => void;
  onStatChange?: (key: keyof Stats, value: number) => void;
  isGuest?: boolean;
  onUpdateLog?: (updated: LogEntry[]) => void;
  waitType?: WaitType;
  venue?: string;
}

export default function QuestScreen({
  returnByMs,
  departureMs,
  airportName,
  gate,
  stats,
  mission,
  log,
  xp,
  demo,
  now,
  realBattery,
  onComplete,
  onSkip,
  onSafeReturn,
  onStatChange,
  isGuest = false,
  onUpdateLog,
  waitType = 'flight',
  venue,
}: Props) {
  const waitLabels = getWaitLabels(waitType);
  const msLeft = returnByMs - now;
  const phase = phaseFor(msLeft, demo);
  const minsLeft = Math.max(0, Math.floor(msLeft / 60000));
  const isProofDisabled = phase === 'urgent' || phase === 'alarm' || minsLeft <= 5;
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showTourSkippedNotice, setShowTourSkippedNotice] = useState(false);
  const prevPhase = useRef(phase);

  // Auto-start tour once for first time users if safe time > 15m and not demo
  useEffect(() => {
    if (demo) return;
    if (phase === 'urgent' || phase === 'alarm') return;

    if (!isTourCompleted('quest')) {
      if (minsLeft <= 15) {
        setShowTourSkippedNotice(true);
        return;
      }
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  // Alarm safety: unmount tour immediately if phase becomes urgent or alarm
  useEffect(() => {
    if (phase === 'urgent' || phase === 'alarm') {
      setShowTour(false);
    }
  }, [phase]);

  // Instant alarm guard: Close proof modal immediately if alarm triggers
  useEffect(() => {
    if (phase === 'alarm' && isProofModalOpen) {
      setIsProofModalOpen(false);
    }
  }, [phase, isProofModalOpen]);

  // Chime on phase transitions
  useEffect(() => {
    if (prevPhase.current !== phase) {
      if (phase === 'headsup') {
        import('@/lib/alarm').then(({ chime }) => chime());
      }
      prevPhase.current = phase;
    }
  }, [phase]);

  const headsUpBanner = phase === 'headsup';
  const urgentBanner = phase === 'urgent';
  const isGateComplete = log.some((l) => l.id === 'go' && l.status === 'completed');

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: urgentBanner ? '#101010' : '#101010',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '480px',
        margin: '0 auto',
        animation: urgentBanner && !isGateComplete ? 'urgent-bg 0.5s steps(1) infinite' : 'none',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #34322C',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '20px',
            fontWeight: '700',
            color: '#F2A900',
            letterSpacing: '-0.01em',
          }}
        >
          GATE
        </span>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {demo && (
            <span
              style={{
                fontFamily: 'var(--font-plex), monospace',
                fontSize: '10px',
                color: '#F2A900',
                border: '1px solid #F2A900',
                padding: '2px 6px',
              }}
            >
              DEMO
            </span>
          )}
          <span
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '12px',
              color: '#8C887C',
              textTransform: 'uppercase',
            }}
          >
            {airportName}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '14px',
              color: '#8C887C',
            }}
          >
            {gate}
          </span>
          <div data-tour="quest-mute">
            <GlobalMuteButton />
          </div>
        </div>
      </div>

      {showTourSkippedNotice && (
        <div
          style={{
            backgroundColor: '#181816',
            borderBottom: '1px solid #34322C',
            padding: '8px 16px',
            textAlign: 'center',
            fontFamily: 'var(--font-plex), monospace',
            fontSize: '11px',
            color: '#8C887C',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          TOUR SKIPPED, LESS THAN 15 MIN LEFT
        </div>
      )}

      {/* Heads-up banner */}
      <div data-tour="quest-alerts">
      {headsUpBanner && (
        <div
          style={{
            backgroundColor: '#181816',
            borderBottom: '1px solid #F2A900',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '14px',
              letterSpacing: '0.15em',
              color: '#F2A900',
            }}
          >
            START WRAPPING UP
          </span>
          <span
            style={{
              fontFamily: 'var(--font-plex), monospace',
              fontSize: '12px',
              color: '#F2A900',
            }}
          >
            15 MIN
          </span>
        </div>
      )}

      {/* Urgent banner */}
      {urgentBanner && (
        <div
          style={{
            backgroundColor: isGateComplete ? '#3F9B5B' : '#C8201A',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-barlow), sans-serif',
              fontSize: '18px',
              fontWeight: '700',
              letterSpacing: '0.15em',
              color: 'white',
            }}
          >
            {isGateComplete ? `AT ${waitLabels.placeLabel} · STANDING BY` : `WALK TO ${waitLabels.placeLabel} NOW`}
          </span>
        </div>
      )}
      </div>

      {/* Countdown */}
      <div data-tour="quest-countdown">
        <Countdown targetDate={returnByMs} phase={phase} />
      </div>

      {/* Stats with InfoTip */}
      <div data-tour="quest-stats">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid #34322C' }}>
          <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontSize: '11px', letterSpacing: '0.2em', color: '#8C887C', textTransform: 'uppercase' }}>
            VITALS & STATS
          </span>
          <InfoTip
            text="STATS DRAIN OVER TIME. COMPLETE MISSIONS TO BOOST THEM."
            label="Stats information"
            align="right"
          />
        </div>
        <StatBar stats={stats} realBattery={realBattery} onChange={onStatChange} />
      </div>

      {/* Missions */}
      <div data-tour="quest-mission" style={{ flex: 1, overflowY: 'auto', paddingTop: '4px' }}>
        <MissionCard
          mission={mission}
          xp={xp}
          log={log}
          onComplete={() => onComplete()}
          onSkip={onSkip}
          gate={gate}
          onSafeReturn={onSafeReturn}
          isProofDisabled={isProofDisabled}
          onRequestProof={() => setIsProofModalOpen(true)}
          placeLabel={waitLabels.placeLabel}
          arrivalCard={waitLabels.arrivalCard}
        />
        <MissionLog log={log} xp={xp} onUpdateLog={onUpdateLog} />
      </div>

      {/* Proof Modal */}
      {isProofModalOpen && mission && (
        <ProofModal
          missionTitle={mission.text}
          proofHint={mission.proofHint || 'PHOTO OF WHERE YOU ARE'}
          isGuest={Boolean(isGuest)}
          onUsePhoto={(photo) => {
            setIsProofModalOpen(false);
            onComplete(photo);
          }}
          onSkipProof={() => {
            setIsProofModalOpen(false);
            onComplete();
          }}
          onCancel={() => setIsProofModalOpen(false)}
        />
      )}

      {/* Safe return button */}
      <div data-tour="quest-gate-arrival" style={{ padding: '12px 16px', borderTop: '1px solid #34322C' }}>
        <button
          onClick={onSafeReturn}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            color: isGateComplete ? '#3F9B5B' : '#8C887C',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '14px',
            letterSpacing: '0.15em',
            padding: '12px',
            border: isGateComplete ? '1px solid #3F9B5B' : '1px solid #34322C',
            borderRadius: '2px',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          {isGateComplete ? `I AM AT THE ${waitLabels.placeLabel} (SAFE RETURN)` : `I AM AT THE ${waitLabels.placeLabel} (EARLY)`}
        </button>
      </div>

      <Tour
        screen="quest"
        steps={QUEST_STEPS}
        isActive={showTour && phase !== 'urgent' && phase !== 'alarm'}
        onComplete={() => setShowTour(false)}
        onDismiss={() => setShowTour(false)}
        isAlarmActive={phase === 'urgent' || phase === 'alarm'}
      />
    </div>
  );
}
