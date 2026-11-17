import { motion } from '@/theme';

export interface ShakeFrame {
  translateX: number;
  opacity: number;
}

const { ring, shake } = motion.loader;
const last = (kind: 'enter' | 'exit') => shake[kind].offsets.length - 1;

// Keyframes of the sideways shake, keyed by percent of its duration (0, 20, 40... for the
// entrance; 0, 25, 50... for the exit). The entrance fades 0 → 1 and the exit 1 → 0.
// `from` makes an exit start where the loader is right now (for example in the middle of
// its entrance), so nothing jumps.
export function shakeFrames(
  kind: 'enter' | 'exit',
  from?: ShakeFrame,
): Record<number, ShakeFrame> {
  const { offsets } = shake[kind];
  const frames: Record<number, ShakeFrame> = {};
  offsets.forEach((offset, i) => {
    const progress = i / last(kind);
    const fade = kind === 'enter' ? progress : 1 - progress;
    frames[Math.round(progress * 100)] =
      i === 0 && from
        ? from
        : {
            translateX: offset,
            opacity: kind === 'exit' && from ? from.opacity * fade : fade,
          };
  });
  return frames;
}

// Where the shake is `ms` milliseconds after it starts (linear between keyframes).
export function shakeAt(kind: 'enter' | 'exit', ms: number): ShakeFrame {
  const frames = shakeFrames(kind);
  const progress = Math.min(Math.max(ms / shake[kind].duration, 0), 1) * 100;
  const keys = Object.keys(frames).map(Number);
  const upper = keys.find((k) => k >= progress) ?? 100;
  const lower = [...keys].reverse().find((k) => k <= progress) ?? 0;
  if (upper === lower) return frames[lower];
  const t = (progress - lower) / (upper - lower);
  const a = frames[lower];
  const b = frames[upper];
  return {
    translateX: a.translateX + (b.translateX - a.translateX) * t,
    opacity: a.opacity + (b.opacity - a.opacity) * t,
  };
}

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
