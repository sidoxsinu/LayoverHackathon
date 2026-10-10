"use client";
import { useEffect } from 'react';
import { stopAlarm } from '../lib/alarm';

export default function GateAlarm({ 
  gate, 
  departureMs, 
  now, 
  onDismiss 
}: { 
  gate: string; 
  departureMs: number; 
  now: number; 
  onDismiss: () => void 
}) {
  useEffect(() => {
    return () => stopAlarm();
  }, []);

  const minutesToDep = Math.max(0, Math.floor((departureMs - now) / 60000));

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 animate-alarm text-white">
      <div className="text-center space-y-4">
        <h1 className="font-sans uppercase text-4xl font-bold tracking-tight">GATE</h1>
        <div className="font-mono text-[40vw] font-bold leading-none text-white">{gate || 'TBA'}</div>
        <h2 className="font-sans uppercase text-3xl font-bold tracking-tight">DEPARTS IN {minutesToDep} MIN</h2>
      </div>

      <div className="absolute bottom-12 w-full px-6">
        <button 
          onClick={onDismiss}
          className="w-full bg-white text-black font-sans uppercase text-2xl font-bold py-4 rounded-none active:bg-gray-200"
        >
          I AM AT THE GATE
        </button>
      </div>
    </div>
  );
}
