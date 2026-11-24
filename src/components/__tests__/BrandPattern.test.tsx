import { render, screen } from '@testing-library/react-native';
import { BrandPattern } from '../BrandPattern';
import { brandPatternLayouts, CLEAR_ZONE } from '../brandPatternLayouts';

describe('BrandPattern', () => {
  it('renders 14 icons in the header and 3 in the hero card', async () => {
    await render(<BrandPattern variant="header" />);
    expect(
      screen.getAllByTestId(/^icon:mdi:/, { includeHiddenElements: true }),
    ).toHaveLength(14);
    await screen.unmount();
    await render(<BrandPattern variant="hero" />);
    expect(
      screen.getAllByTestId(/^icon:mdi:/, { includeHiddenElements: true }),
    ).toHaveLength(3);
  });

  it('is deterministic: two renders produce the same tree', async () => {
    const first = await render(<BrandPattern variant="header" />);
    const a = JSON.stringify(first.toJSON());
    await first.unmount();
    const second = await render(<BrandPattern variant="header" />);
    expect(JSON.stringify(second.toJSON())).toBe(a);
  });

  it('ignores touches and is hidden from screen readers', async () => {
    const { toJSON } = await render(<BrandPattern variant="header" />);
    const root = toJSON() as { props: Record<string, unknown> };
    expect(root.props.pointerEvents).toBe('none');
    expect(root.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(root.props.accessibilityElementsHidden).toBe(true);
  });
});

describe('brandPatternLayouts', () => {
  const header = brandPatternLayouts.header;

  it('keeps the central logo and title zone free', () => {
    const inside = header.filter(
      (p) =>
        p.x > CLEAR_ZONE.x[0] &&
        p.x < CLEAR_ZONE.x[1] &&
        p.y > CLEAR_ZONE.y[0] &&
        p.y < CLEAR_ZONE.y[1],
    );
    expect(inside).toEqual([]);
  });

  it('follows the sizes, rotations and opacities of Design.md', () => {
    for (const p of header) {
      expect(p.size).toBeGreaterThanOrEqual(30);
      expect(p.size).toBeLessThanOrEqual(64);
      expect(Math.abs(p.rotation)).toBeLessThanOrEqual(30);
      if (p.tone === 'white') {
        expect(p.opacity).toBeGreaterThanOrEqual(0.08);
        expect(p.opacity).toBeLessThanOrEqual(0.12);
      } else {
        expect(p.opacity).toBeGreaterThanOrEqual(0.14);
        expect(p.opacity).toBeLessThanOrEqual(0.18);
      }
    }
    expect(header.filter((p) => p.tone === 'lime').length).toBeLessThanOrEqual(
      3,
    );
    expect(new Set(header.map((p) => p.icon))).toEqual(
      new Set(['leaf', 'feather', 'openBook']),
    );
  });

  it('puts 3 icons at 10% in the hero card', () => {
    const hero = brandPatternLayouts.hero;
    expect(hero).toHaveLength(3);
    expect(hero.every((p) => p.opacity === 0.1 && p.x > 70 && p.y > 50)).toBe(
      true,
    );
  });
});

describe('empty variant', () => {
  it('has 4 fixed icons around the centre', () => {
    const { empty } = brandPatternLayouts;
    expect(empty).toHaveLength(4);
    expect(
      empty.filter(
        (p) =>
          p.x > CLEAR_ZONE.x[0] &&
          p.x < CLEAR_ZONE.x[1] &&
          p.y > CLEAR_ZONE.y[0] &&
          p.y < CLEAR_ZONE.y[1],
      ),
    ).toEqual([]);
  });
});
