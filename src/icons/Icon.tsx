import { Iconify } from 'react-native-iconify';
import { iconSize, usePalette } from '@/theme';
import { icons, type IconName } from './registry';

interface IconProps {
  name: IconName;
  // Bold marks the active or selected state.
  active?: boolean;
  size?: number;
  color?: string;
}

// Decorative by default: a control that only shows an icon labels its Pressable.
export function Icon({
  name,
  active = false,
  size = iconSize.button,
  color,
}: IconProps) {
  const palette = usePalette();
  return (
    <Iconify
      icon={icons[name][active ? 'bold' : 'linear']}
      size={size}
      color={color ?? palette.textPrimary}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    />
  );
}
