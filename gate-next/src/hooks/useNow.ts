"use client";
import { useEffect, useState } from 'react';

export function useNow(ms = 500) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
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
