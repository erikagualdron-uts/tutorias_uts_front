import { lightPalette } from '@/theme/colors';
import { badgeLabel, tabBadgeOptions } from '../badge';

describe('badgeLabel', () => {
  it('hides the badge at zero, shows the count and caps it at 99+', () => {
    expect(badgeLabel(0)).toBeUndefined();
    expect(badgeLabel(7)).toBe('7');
    expect(badgeLabel(99)).toBe('99');
    expect(badgeLabel(100)).toBe('99+');
  });
});

describe('tabBadgeOptions', () => {
  it('gives the tab a badge with the error fill and a white number when there is a count', () => {
    expect(tabBadgeOptions(3, lightPalette)).toEqual({
      tabBarBadge: '3',
      tabBarBadgeStyle: { backgroundColor: lightPalette.error, color: lightPalette.onError, minWidth: 16 },
    });
  });

  it('gives nothing without a count or with zero, so the tabs of the other roles stay clean', () => {
    expect(tabBadgeOptions(undefined, lightPalette)).toEqual({});
    expect(tabBadgeOptions(0, lightPalette)).toEqual({});
  });
});
