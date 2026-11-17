import { motion } from '@/theme';
import { pulseOpacity, ringAngle } from '../brandLoaderMotion';

const { ring } = motion.loader;

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
