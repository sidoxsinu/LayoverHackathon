'use client';
import { useEffect, useState } from 'react';

export function useNow(ms = 500): number {
  const [now, setNow] = useState(0); // 0 on server; real value set on mount
  useEffect(() => {
    setNow(Date.now()); // immediate real value on mount
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [ms]);
  return now;
}
