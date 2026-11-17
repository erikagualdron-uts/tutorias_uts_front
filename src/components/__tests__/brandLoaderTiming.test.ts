import { motion } from '@/theme';
import { iconOpacity } from '../brandLoaderTiming';

const { iteration, fadeIn, hold, fadeOut } = motion.loader;
const at = (ms: number, animated = true) =>
  [0, 1, 2].map((i) => iconOpacity(ms / iteration, i, animated));

describe('iconOpacity', () => {
  it('lasts 900 ms per icon: 250 in, 400 hold, 250 out', () => {
    expect(fadeIn + hold + fadeOut).toBe(iteration);
    expect(iconOpacity(0, 0, true)).toBe(0);
    expect(iconOpacity(fadeIn / iteration, 0, true)).toBeCloseTo(1);
    expect(iconOpacity((fadeIn + hold) / iteration, 0, true)).toBeCloseTo(1);
    expect(iconOpacity(1, 0, true)).toBeCloseTo(0);
  });

  it('shows the book first, then the feather, then the leaf, then the book again', () => {
    const visible = (ms: number) => at(ms).findIndex((o) => o > 0.99);
    expect(visible(400)).toBe(0); // book
    expect(visible(900 + 400)).toBe(1); // feather
    expect(visible(1800 + 400)).toBe(2); // leaf
    expect(visible(2700 + 400)).toBe(0); // book again
  });

  it('never shows two icons at once', () => {
    for (let ms = 0; ms < 5400; ms += 10) {
      const lit = at(ms).filter((o) => o > 0.001);
      expect(lit.length).toBeLessThanOrEqual(1);
    }
  });

  it('with reduced motion only swaps, with no values between 0 and 1', () => {
    for (let ms = 0; ms < 5400; ms += 10) {
      const values = at(ms, false);
      values.forEach((o) => expect([0, 1]).toContain(o));
      expect(values.reduce((a, b) => a + b, 0)).toBe(1);
    }
    expect(at(0, false)).toEqual([1, 0, 0]);
    expect(at(900, false)).toEqual([0, 1, 0]);
    expect(at(1800, false)).toEqual([0, 0, 1]);
    expect(at(2700, false)).toEqual([1, 0, 0]);
  });
});
