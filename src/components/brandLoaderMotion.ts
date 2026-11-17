import { motion } from '@/theme';

const { ring } = motion.loader;

// Angle of the ring arc `ms` milliseconds after it starts: one turn per second.
export function ringAngle(ms: number) {
  return ((ms % ring.turn) / ring.turn) * 360;
}

// Opacity of the arc when the ring stays still (reduce motion): a triangle wave between
// `pulseMin` and 1 that repeats every `pulse` ms.
export function pulseOpacity(ms: number) {
  const phase = (ms % ring.pulse) / ring.pulse;
  const wave = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
  return ring.pulseMin + (1 - ring.pulseMin) * wave;
}
