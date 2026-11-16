import { useReducedMotion } from 'react-native-reanimated';

// With "reduce motion" on, only fades remain (docs/Design.md).
export function useMotion() {
  return { movement: !useReducedMotion() };
}
