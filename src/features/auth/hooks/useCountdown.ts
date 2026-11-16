import { useEffect, useState } from 'react';

// Whole seconds left until `until` (ISO date), ticking every second; 0 when reached.
export function useCountdown(until: string | undefined): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return Math.max(0, Math.ceil((new Date(until ?? 0).getTime() - now) / 1000));
}
