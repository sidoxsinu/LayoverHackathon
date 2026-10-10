'use client';
import { useEffect, useState } from 'react';

export function useBattery(): number | null {
  const [pct, setPct] = useState<number | null>(null);
  useEffect(() => {
    let battery: { level: number; addEventListener: (e: string, fn: () => void) => void; removeEventListener: (e: string, fn: () => void) => void } | undefined;
    const upd = () => {
      if (battery) setPct(Math.round(battery.level * 100));
    };
    (navigator as unknown as { getBattery?: () => Promise<typeof battery> }).getBattery?.().then((b) => {
      battery = b;
      upd();
      battery?.addEventListener('levelchange', upd);
    });
    return () => battery?.removeEventListener('levelchange', upd);
  }, []);
  return pct; // null = not supported, fall back to manual stat
}
