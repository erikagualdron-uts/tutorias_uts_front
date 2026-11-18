import { useEffect, useState } from 'react';

// The current instant, refreshed every minute so "today" and the line of the current hour stay right
// even when the screen stays open past midnight.
export function useNow(everyMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);
  return now;
}
