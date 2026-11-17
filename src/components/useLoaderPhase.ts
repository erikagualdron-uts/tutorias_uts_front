import { useEffect, useState } from 'react';
import { motion } from '@/theme';

export type LoaderPhase = 'hidden' | 'loader' | 'slow';

// Phases of a wait, counted from mount: nothing for the first 300 ms (a fast load never flashes),
// the loader until 1000 ms, then the loader plus the "taking longer" message.
// Without `delayed` (buttons) the loader shows at once and never escalates.
export function useLoaderPhase(delayed = true): LoaderPhase {
  const [phase, setPhase] = useState<LoaderPhase>(
    delayed ? 'hidden' : 'loader',
  );

  useEffect(() => {
    if (!delayed) return;
    const show = setTimeout(() => setPhase('loader'), motion.loader.showAfter);
    const slow = setTimeout(() => setPhase('slow'), motion.loader.slowAfter);
    return () => {
      clearTimeout(show);
      clearTimeout(slow);
    };
  }, [delayed]);

  return phase;
}
