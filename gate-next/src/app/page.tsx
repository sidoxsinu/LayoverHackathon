'use client';
import { useReducer, useEffect, useRef, useCallback } from 'react';
import { useNow } from '@/hooks/useNow';
import { useBattery } from '@/hooks/useBattery';
import { phaseFor, demoSchedule } from '@/lib/time';
import { pickMission, startStats, DRAIN_30S, Mission, Stats } from '@/lib/missions';
import { startAlarm, arm } from '@/lib/alarm';
import { load, save, clear, SavedState } from '@/lib/storage';
import SetupScreen from '@/components/SetupScreen';
import QuestScreen from '@/components/QuestScreen';
import GateAlarm from '@/components/GateAlarm';
import SafeTravels from '@/components/SafeTravels';

type Screen = 'setup' | 'quest' | 'alarm' | 'safe';

interface LogEntry {
  id: string;
  text: string;
  status: 'completed' | 'skipped';
  xp: number;
  ts: number;
}

interface AppState {
  screen: Screen;
  departureMs: number;
  returnByMs: number;
  gate: string;
  vibe: string;
  walkMin: number;
  stats: Stats;
  mission: Mission | null;
  recent: string[];
  log: LogEntry[];
  xp: number;
  demo: boolean;
  startedMs: number;
  wordmarkTaps: number;
}

type Action =
  | { type: 'START'; payload: Omit<AppState, 'screen' | 'mission' | 'recent' | 'log' | 'xp' | 'demo' | 'wordmarkTaps'> }
  | { type: 'START_DEMO'; payload: { departureMs: number; returnByMs: number; walkMin: number; startedMs: number } }
  | { type: 'ALARM' }
  | { type: 'DISMISS_ALARM' }
  | { type: 'SAFE_RETURN' }
  | { type: 'NEW_LAYOVER' }
  | { type: 'MISSION_COMPLETE' }
  | { type: 'MISSION_SKIP' }
  | { type: 'DRAIN_STATS' }
  | { type: 'SET_BATTERY'; value: number }
  | { type: 'WORDMARK_TAP' }
  | { type: 'RESTORE'; payload: AppState }
  | { type: 'SET_MISSION'; payload: any };

const DEFAULT_STATE: AppState = {
  screen: 'setup',
  departureMs: 0,
  returnByMs: 0,
  gate: 'TBA',
  vibe: 'tired',
  walkMin: 10,
  stats: { hunger: 70, sanity: 70, battery: 70 },
  mission: null,
  recent: [],
  log: [],
  xp: 0,
  demo: false,
  startedMs: 0,
  wordmarkTaps: 0,
};

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function nextMission(state: Pick<AppState, 'returnByMs' | 'stats' | 'recent'>, now: number): Mission {
  const minsLeft = Math.max(0, Math.floor((state.returnByMs - now) / 60000));
  return pickMission({ minsLeft, stats: state.stats, recent: state.recent });
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'RESTORE':
      return action.payload;

    case 'START': {
      const now = Date.now();
      return {
        ...DEFAULT_STATE,
        ...action.payload,
        screen: 'quest',
        mission: null,
        recent: [],
        demo: false,
        startedMs: now,
      };
    }

    case 'START_DEMO': {
      const demoStats = startStats('tired');
      const now = Date.now();
      const m = nextMission({ returnByMs: action.payload.returnByMs, stats: demoStats, recent: [] }, now);
      return {
        ...DEFAULT_STATE,
        ...action.payload,
        gate: 'B14',
        vibe: 'tired',
        stats: demoStats,
        screen: 'quest',
        mission: m,
        recent: [m.id],
        demo: true,
      };
    }

    case 'ALARM':
      return { ...state, screen: 'alarm' };

    case 'DISMISS_ALARM':
      return { ...state, screen: 'safe' };

    case 'SAFE_RETURN':
      return { ...state, screen: 'safe' };

    case 'NEW_LAYOVER':
      clear();
      return { ...DEFAULT_STATE };

    case 'DRAIN_STATS': {
      const newStats = {
        hunger: clamp(state.stats.hunger - DRAIN_30S.hunger),
        sanity: clamp(state.stats.sanity - DRAIN_30S.sanity),
        battery: clamp(state.stats.battery - DRAIN_30S.battery),
      };
      return { ...state, stats: newStats };
    }

    case 'SET_MISSION':
      return {
        ...state,
        mission: action.payload,
        recent: action.payload ? [action.payload.id, ...state.recent].slice(0, 3) : state.recent,
      };

    case 'SET_BATTERY':
      return { ...state, stats: { ...state.stats, battery: action.value } };

    case 'MISSION_COMPLETE': {
      if (!state.mission) return state;
      const m = state.mission;
      const boostedStats = {
        ...state.stats,
        [m.need]: clamp(state.stats[m.need] + m.boost),
      };
      const newXp = state.xp + 40;
      const newLog: LogEntry[] = [
        { id: m.id, text: m.text, status: 'completed', xp: 40, ts: Date.now() },
        ...state.log,
      ];
      const newRecent = [m.id, ...state.recent].slice(0, 3);
      const now = Date.now();
      return {
        ...state,
        stats: boostedStats,
        xp: newXp,
        log: newLog,
        mission: null,
        recent: newRecent,
      };
    }

    case 'MISSION_SKIP': {
      if (!state.mission) return state;
      const m = state.mission;
      const newLog: LogEntry[] = [
        { id: m.id, text: m.text, status: 'skipped', xp: 0, ts: Date.now() },
        ...state.log,
      ];
      const newRecent = [m.id, ...state.recent].slice(0, 3);
      const now = Date.now();
      return {
        ...state,
        log: newLog,
        mission: null,
        recent: newRecent,
      };
    }

    case 'WORDMARK_TAP': {
      const taps = state.wordmarkTaps + 1;
      if (taps >= 3) {
        // Demo mode will be triggered by the component
        return { ...state, wordmarkTaps: 0 };
      }
      return { ...state, wordmarkTaps: taps };
    }

    default:
      return state;
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const now = useNow(500);
  const realBattery = useBattery();
  const alarmFiredRef = useRef(false);
  const drainRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = load();
    if (!saved) return;
    const restored: AppState = {
      screen: saved.screen as Screen,
      departureMs: saved.departureMs,
      returnByMs: saved.returnByMs,
      gate: saved.gate,
      vibe: saved.vibe,
      walkMin: saved.walkMin,
      stats: saved.stats,
      mission: saved.missionId
        ? (pickMission({ minsLeft: Math.max(0, Math.floor((saved.returnByMs - Date.now()) / 60000)), stats: saved.stats, recent: saved.recent }) )
        : null,
      recent: saved.recent,
      log: saved.log,
      xp: saved.xp,
      demo: saved.demo,
      startedMs: saved.startedMs,
      wordmarkTaps: 0,
    };
    // If time already passed and was in quest, go straight to alarm
    if (restored.screen === 'quest' && restored.returnByMs <= Date.now()) {
      restored.screen = 'alarm';
      startAlarm();
      alarmFiredRef.current = true;
    }
    dispatch({ type: 'RESTORE', payload: restored });
  }, []);

  // Sync real battery to stats
  useEffect(() => {
    if (realBattery !== null && state.screen === 'quest') {
      dispatch({ type: 'SET_BATTERY', value: realBattery });
    }
  }, [realBattery, state.screen]);

  
  // AI Mission Fetch
  useEffect(() => {
    if (state.screen === 'quest' && state.mission === null) {
      let active = true;
      const minsLeft = Math.max(0, Math.floor((state.returnByMs - Date.now()) / 60000));
      
      fetch('/api/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats: state.stats, minsLeft })
      })
        .then((res) => {
          if (!res.ok) throw new Error('API failed');
          return res.json();
        })
        .then((data) => {
          if (!active) return;
          if (data && data.id && data.text) {
            dispatch({ type: 'SET_MISSION', payload: data });
          } else {
            throw new Error('Invalid response');
          }
        })
        .catch((err) => {
          if (!active) return;
          console.warn('AI mission failed, using local fallback:', err);
          const fallback = nextMission({ returnByMs: state.returnByMs, stats: state.stats, recent: state.recent }, Date.now());
          dispatch({ type: 'SET_MISSION', payload: fallback });
        });

      return () => { active = false; };
    }
  }, [state.screen, state.mission, state.stats, state.returnByMs, state.recent]);

  // Alarm latch

  useEffect(() => {
    if (state.screen === 'quest' && !alarmFiredRef.current) {
      const phase = phaseFor(state.returnByMs - now, state.demo);
      if (phase === 'alarm') {
        alarmFiredRef.current = true;
        startAlarm();
        dispatch({ type: 'ALARM' });
      }
    }
  }, [now, state.returnByMs, state.screen, state.demo]);

  // Stat drain - every 30s
  useEffect(() => {
    if (state.screen !== 'quest') {
      clearInterval(drainRef.current);
      return;
    }
    drainRef.current = setInterval(() => {
      dispatch({ type: 'DRAIN_STATS' });
    }, 30_000);
    return () => clearInterval(drainRef.current);
  }, [state.screen]);

  // Persist on state change
  useEffect(() => {
    if (state.screen === 'setup' && state.startedMs === 0) return; // don't save blank setup
    const toSave: Partial<SavedState> = {
      departureMs: state.departureMs,
      returnByMs: state.returnByMs,
      gate: state.gate,
      vibe: state.vibe,
      walkMin: state.walkMin,
      stats: state.stats,
      log: state.log,
      xp: state.xp,
      screen: state.screen,
      missionId: state.mission?.id ?? null,
      recent: state.recent,
      demo: state.demo,
      startedMs: state.startedMs,
    };
    save(toSave);
  }, [state]);

  // Reset alarm ref when back on setup
  useEffect(() => {
    if (state.screen === 'setup') alarmFiredRef.current = false;
  }, [state.screen]);

  const handleDemo = useCallback(async () => {
    await arm();
    const sched = demoSchedule(state.walkMin || 10, Date.now());
    dispatch({ type: 'START_DEMO', payload: { ...sched, walkMin: 10, startedMs: Date.now() } });
  }, [state.walkMin]);

  const handleWordmarkTap = useCallback(() => {
    const newCount = state.wordmarkTaps + 1;
    if (newCount >= 3) {
      dispatch({ type: 'WORDMARK_TAP' });
      handleDemo();
    } else {
      dispatch({ type: 'WORDMARK_TAP' });
    }
  }, [state.wordmarkTaps, handleDemo]);

  const survivedMs = state.screen === 'safe' || state.screen === 'alarm'
    ? Date.now() - state.startedMs
    : 0;

  const missionsCompleted = state.log.filter((e) => e.status === 'completed').length;

  if (state.screen === 'alarm') {
    return (
      <GateAlarm
        gate={state.gate}
        departureMs={state.departureMs}
        now={now}
        onDismiss={() => dispatch({ type: 'DISMISS_ALARM' })}
      />
    );
  }


  let currentStats = { ...state.stats };
  if (state.screen === 'quest' && state.startedMs) {
    const elapsedMins = (now - state.startedMs) / 60000;
    currentStats.hunger = Math.max(0, Math.floor(state.stats.hunger - (elapsedMins * 0.3)));
    currentStats.sanity = Math.max(0, Math.floor(state.stats.sanity - (elapsedMins * 0.5)));
    currentStats.battery = state.stats.battery;
  }

  if (state.screen === 'safe') {

    return (
      <SafeTravels
        survivedMs={survivedMs}
        missionsCompleted={missionsCompleted}
        xp={state.xp}
        onNewLayover={() => dispatch({ type: 'NEW_LAYOVER' })}
      />
    );
  }

  if (state.screen === 'quest') {
    return (
      <QuestScreen
        returnByMs={state.returnByMs}
        departureMs={state.departureMs}
        gate={state.gate}
        stats={currentStats}
        mission={state.mission}
        log={state.log}
        xp={state.xp}
        demo={state.demo}
        now={now}
        realBattery={realBattery}
        onComplete={() => dispatch({ type: 'MISSION_COMPLETE' })}
        onSkip={() => dispatch({ type: 'MISSION_SKIP' })}
        onSafeReturn={() => dispatch({ type: 'SAFE_RETURN' })}
      />
    );
  }

  // Setup screen
  return (
    <SetupScreen
      onStart={(data) => {
        dispatch({
          type: 'START',
          payload: {
            departureMs: data.departureMs,
            returnByMs: data.returnByMs,
            gate: data.gate,
            walkMin: data.walkMin,
            vibe: data.vibe,
            stats: data.stats,
            startedMs: data.startedMs,
          },
        });
      }}
      onDemo={handleDemo}
      tapCount={state.wordmarkTaps}
      onWordmarkTap={handleWordmarkTap}
    />
  );
}
