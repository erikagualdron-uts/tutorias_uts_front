import { useEffect, useRef, useState } from 'react';
import { useMotion } from '@/components/useMotion';

const DURATION_MS = 600;

// A whole number counts up from 0 to its value once, the first time it shows (docs/Design.md, State
// changes); later changes show at once. With "reduce motion" and for anything that is not a whole
// number (a dash, "2 h", a percentage) the value shows as it is.
export function useCountUp(value: number | string): number | string {
  const { movement } = useMotion();
  const animatable = typeof value === 'number' && Number.isInteger(value) && value >= 0;
  const [shown, setShown] = useState<number>(animatable && movement ? 0 : animatable ? value : 0);
  const shownRef = useRef(shown);
  const played = useRef(false);

  useEffect(() => {
    if (!animatable) return;
    const show = (n: number) => {
      shownRef.current = n;
      setShown(n);
    };
    if (!movement || played.current) return show(value);
    const from = shownRef.current;
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const progress = Math.min(1, (Date.now() - start) / DURATION_MS);
      show(Math.round(from + (value - from) * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else played.current = true;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, animatable, movement]);

  return animatable ? shown : value;
}
