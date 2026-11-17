import type { IconName } from '@/icons/registry';

export type PatternVariant = 'header' | 'hero';

export interface PatternPlacement {
  // Center of the icon, in % of the container.
  x: number;
  y: number;
  size: number;
  rotation: number;
  icon: Extract<IconName, 'leaf' | 'feather' | 'openBook'>;
  tone: 'white' | 'lime';
  // Opacity in light mode; dark mode uses a flat 0.06 (docs/Design.md).
  opacity: number;
}

// Fixed lists (never random per render, so the layout never jumps).
// The central area (x 22-78, y 18-82) stays free for the logo and the title.
export const CLEAR_ZONE = { x: [22, 78], y: [18, 82] } as const;

export const brandPatternLayouts: Record<PatternVariant, PatternPlacement[]> = {
  header: [
    {
      x: 8,
      y: 14,
      size: 56,
      rotation: -20,
      icon: 'leaf',
      tone: 'white',
      opacity: 0.1,
    },
    {
      x: 24,
      y: 8,
      size: 40,
      rotation: 15,
      icon: 'feather',
      tone: 'white',
      opacity: 0.09,
    },
    {
      x: 46,
      y: 6,
      size: 34,
      rotation: -8,
      icon: 'openBook',
      tone: 'white',
      opacity: 0.08,
    },
    {
      x: 66,
      y: 10,
      size: 44,
      rotation: 25,
      icon: 'leaf',
      tone: 'lime',
      opacity: 0.16,
    },
    {
      x: 90,
      y: 16,
      size: 60,
      rotation: -25,
      icon: 'feather',
      tone: 'white',
      opacity: 0.11,
    },
    {
      x: 16,
      y: 28,
      size: 32,
      rotation: 18,
      icon: 'openBook',
      tone: 'white',
      opacity: 0.08,
    },
    {
      x: 10,
      y: 48,
      size: 44,
      rotation: 12,
      icon: 'feather',
      tone: 'white',
      opacity: 0.09,
    },
    {
      x: 92,
      y: 46,
      size: 38,
      rotation: 20,
      icon: 'leaf',
      tone: 'white',
      opacity: 0.08,
    },
    {
      x: 6,
      y: 74,
      size: 62,
      rotation: 28,
      icon: 'leaf',
      tone: 'white',
      opacity: 0.12,
    },
    {
      x: 88,
      y: 76,
      size: 58,
      rotation: -15,
      icon: 'openBook',
      tone: 'white',
      opacity: 0.1,
    },
    {
      x: 20,
      y: 92,
      size: 46,
      rotation: -30,
      icon: 'feather',
      tone: 'lime',
      opacity: 0.15,
    },
    {
      x: 40,
      y: 94,
      size: 36,
      rotation: 10,
      icon: 'leaf',
      tone: 'white',
      opacity: 0.09,
    },
    {
      x: 62,
      y: 92,
      size: 50,
      rotation: 22,
      icon: 'openBook',
      tone: 'white',
      opacity: 0.1,
    },
    {
      x: 80,
      y: 94,
      size: 30,
      rotation: -10,
      icon: 'leaf',
      tone: 'lime',
      opacity: 0.14,
    },
  ],
  hero: [
    {
      x: 92,
      y: 84,
      size: 52,
      rotation: -15,
      icon: 'openBook',
      tone: 'white',
      opacity: 0.1,
    },
    {
      x: 76,
      y: 94,
      size: 36,
      rotation: 20,
      icon: 'leaf',
      tone: 'white',
      opacity: 0.1,
    },
    {
      x: 94,
      y: 56,
      size: 32,
      rotation: 12,
      icon: 'feather',
      tone: 'white',
      opacity: 0.1,
    },
  ],
};
