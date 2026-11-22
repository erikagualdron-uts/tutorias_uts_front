import type { Palette } from '@/theme';

// The count of a tab badge: hidden at zero and `99+` above 99 (docs/Design.md, Unread tab badge).
export const badgeLabel = (count: number): string | undefined => (count > 0 ? (count > 99 ? '99+' : String(count)) : undefined);

// Options of a tab for its badge; a tab without a count gets none.
export function tabBadgeOptions(count: number | undefined, palette: Palette) {
  const label = badgeLabel(count ?? 0);
  return label
    ? { tabBarBadge: label, tabBarBadgeStyle: { backgroundColor: palette.error, color: palette.onError, minWidth: 16 } }
    : {};
}
