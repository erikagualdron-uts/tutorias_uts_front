import { motion } from '@/theme';

// Plain numbers on purpose: the opacity runs as a Reanimated worklet and captures these by value.
const FADE_IN = motion.loader.fadeIn / motion.loader.iteration;
const HOLD = motion.loader.hold / motion.loader.iteration;
const FADE_OUT = motion.loader.fadeOut / motion.loader.iteration;

// `t` runs from 0 to 3, one unit per icon (book = 0, feather = 1, leaf = 2) and then wraps.
// An icon is visible only during its own unit, so two icons never show together.
export function iconOpacity(t: number, index: number, animated: boolean) {
  'worklet';
  const u = (((t - index) % 3) + 3) % 3;
  if (u >= 1) return 0;
  // Reduce motion: swap without any fade.
  if (!animated) return 1;
  if (u < FADE_IN) return u / FADE_IN;
  if (u < FADE_IN + HOLD) return 1;
  return Math.max(0, 1 - (u - FADE_IN - HOLD) / FADE_OUT);
}
