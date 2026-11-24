import { StyleSheet } from 'react-native';
import { darkPalette, lightPalette } from '@/theme/colors';

type Node = { props?: { style?: unknown }; children?: unknown[] | null };
const COLOR_KEYS = ['backgroundColor', 'color', 'borderColor', 'tintColor'];

// Colors a component paints: every color of every resolved style in the rendered tree.
export function paintedColors(node: Node | Node[] | null): string[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(paintedColors);
  const style = StyleSheet.flatten(node.props?.style as never) as
    Record<string, unknown> | undefined;
  const own = COLOR_KEYS.map((key) => style?.[key]).filter(
    (value): value is string => typeof value === 'string',
  );
  return [
    ...own,
    ...(node.children ?? []).flatMap((child) =>
      typeof child === 'object' ? paintedColors(child as Node) : [],
    ),
  ];
}

const darkValues = new Set(Object.values(darkPalette));
// Roles whose light value is not used by any dark role: it would be a leftover of the light mode.
export const lightOnly = Object.entries(lightPalette)
  .filter(([, value]) => !darkValues.has(value))
  .map(([, value]) => value);

