"use client";
import { useReducer, useEffect } from 'react';
import { useNow } from '../hooks/useNow';
import { demoSchedule, phaseFor } from '../lib/time';
import { startAlarm, arm } from '../lib/alarm';
import GateAlarm from '../components/GateAlarm';

interface State {
  screen: 'setup' | 'quest' | 'alarm';
  departureMs: number;
  returnByMs: number;
  gate: string;
  demo: boolean;
}

const initialState: State = {
  screen: 'setup',
  departureMs: 0,
  returnByMs: 0,
  gate: 'B14',
  demo: false,
};

function reducer(state: State, action: any): State {
  switch (action.type) {
    case 'START_DEMO':
      return { 
        ...state, 
        ...action.payload,
        demo: true,
        screen: 'quest'
      };
    case 'ALARM':
      return { ...state, screen: 'alarm' };
    case 'DISMISS_ALARM':
      return { ...state, screen: 'setup', demo: false };
    default:
      return state;
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const now = useNow(500);

  useEffect(() => {
    if (state.screen === 'quest') {
      const phase = phaseFor(state.returnByMs - now, state.demo);
      if (phase === 'alarm') {
        startAlarm();
        dispatch({ type: 'ALARM' });
      }
    }
  }, [now, state.returnByMs, state.screen, state.demo]);

  const handleStartDemo = async () => {
    await arm(); 
    const sched = demoSchedule(2, Date.now()); 
    dispatch({ type: 'START_DEMO', payload: sched });
  };

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

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-8 min-h-screen">
      <h1 
        className="font-sans text-6xl uppercase tracking-tighter text-gate-amber select-none cursor-pointer" 
        onClick={(e) => {
          if (e.detail === 3) handleStartDemo();
        }}
      >
        GATE
      </h1>
      
      {state.screen === 'quest' ? (
        <div className="text-center font-mono space-y-2">
          <p className="text-gate-muted uppercase text-sm">Demo running...</p>
          <p className="text-gate-amber text-lg">Return by: {new Date(state.returnByMs).toLocaleTimeString()}</p>
        </div>
      ) : (
        <div className="text-center space-y-6 w-full max-w-sm">
          <p className="font-sans uppercase text-gate-muted text-xl">Triple-tap logo to start demo</p>
          <button 
            onClick={handleStartDemo} 
            className="w-full bg-gate-amber text-gate-ink font-sans uppercase font-bold text-2xl py-4 rounded-none active:bg-gate-amber/80"
          >
            START DEMO
          </button>
        </div>
      )}
    </div>
  );
}
