import { motion } from '@/theme';
import {
  pulseOpacity,
  ringAngle,
  shakeAt,
  shakeFrames,
} from '../brandLoaderMotion';

const { shake, ring } = motion.loader;
const xs = (kind: 'enter' | 'exit') =>
  Object.values(shakeFrames(kind)).map((f) => f.translateX);

describe('shake keyframes', () => {
  it('uses the offsets and durations of docs/Design.md', () => {
    expect(xs('enter')).toEqual([0, -6, 6, -3, 3, 0]);
    expect(xs('exit')).toEqual([0, 6, -6, 3, 0]);
    expect(shake.enter.duration).toBe(350);
    expect(shake.exit.duration).toBe(250);
  });

  it('keys the frames by percent of the duration', () => {
    expect(Object.keys(shakeFrames('enter')).map(Number)).toEqual([
      0, 20, 40, 60, 80, 100,
    ]);
    expect(Object.keys(shakeFrames('exit')).map(Number)).toEqual([
      0, 25, 50, 75, 100,
    ]);
  });

  it('fades in from 0 to 1 and out from 1 to 0', () => {
    const enter = Object.values(shakeFrames('enter')).map((f) => f.opacity);
    const exit = Object.values(shakeFrames('exit')).map((f) => f.opacity);
    expect([enter[0], enter[enter.length - 1]]).toEqual([0, 1]);
    expect([exit[0], exit[exit.length - 1]]).toEqual([1, 0]);
  });

  it('is damped: each swing is smaller than the one before', () => {
    const swings = xs('enter').slice(1, -1).map(Math.abs);
    expect(swings).toEqual([6, 6, 3, 3]);
  });

  it('starts an exit where the loader is, with no jump', () => {
    const mid = shakeAt('enter', 100);
    const frames = shakeFrames('exit', mid);
    expect(frames[0]).toEqual(mid);
    expect(frames[100].opacity).toBe(0);
    const opacities = Object.values(frames).map((f) => f.opacity);
    expect([...opacities].sort((a, b) => b - a)).toEqual(opacities);
    expect(Math.max(...opacities)).toBeLessThanOrEqual(1);
  });

  it('interpolates between keyframes', () => {
    expect(shakeAt('enter', 0)).toEqual({ translateX: 0, opacity: 0 });
    expect(shakeAt('enter', shake.enter.duration)).toEqual({
      translateX: 0,
      opacity: 1,
    });
    expect(shakeAt('enter', 35).translateX).toBeCloseTo(-3);
    expect(shakeAt('exit', 0)).toEqual({ translateX: 0, opacity: 1 });
  });
});

describe('ring motion', () => {
  it('turns once per second, steadily', () => {
    expect(ring.turn).toBe(1000);
    expect(ringAngle(0)).toBe(0);
    expect(ringAngle(250)).toBeCloseTo(90);
    expect(ringAngle(500)).toBeCloseTo(180);
    expect(ringAngle(1000)).toBe(0);
  });

  it('pulses between 0.4 and 1 every 1200 ms when it stays still', () => {
    expect(ring.pulse).toBe(1200);
    expect(pulseOpacity(0)).toBeCloseTo(0.4);
    expect(pulseOpacity(600)).toBeCloseTo(1);
    expect(pulseOpacity(1200)).toBeCloseTo(0.4);
    for (let ms = 0; ms < 2400; ms += 30) {
      expect(pulseOpacity(ms)).toBeGreaterThanOrEqual(0.4 - 1e-9);
      expect(pulseOpacity(ms)).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('has the sizes of docs/Design.md: 64 px and 28 px across', () => {
    expect(ring.regular).toEqual({ size: 64, stroke: 3 });
    expect(ring.compact).toEqual({ size: 28, stroke: 2 });
    expect(ring.sweepDegrees).toBe(90);
  });
});
