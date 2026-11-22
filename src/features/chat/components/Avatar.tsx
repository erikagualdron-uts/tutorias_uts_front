import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/icons/Icon';
import { radius, typography, usePalette } from '@/theme';
import { initialsOf } from '../initials';

interface AvatarProps {
  // A module chat shows the group icon; a person shows initials, or the person icon when there is no name.
  group?: boolean;
  firstName?: string;
  lastName?: string;
  size?: number;
}

// The round frame of a conversation. Decoration only: the name is always written next to it, so screen readers skip it.
export function Avatar({ group = false, firstName = '', lastName = '', size = 48 }: AvatarProps) {
  const palette = usePalette();
  const initials = group ? '' : initialsOf(firstName, lastName);
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.frame, { width: size, height: size, backgroundColor: palette.surface }]}
    >
      {initials ? (
        <Text style={[typography.cardTitle, { color: palette.primary }]}>{initials}</Text>
      ) : (
        <Icon name={group ? 'group' : 'user'} size={24} color={palette.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ frame: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' } });
