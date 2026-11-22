jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
}));
jest.mock('react-native-iconify', () => ({
  Iconify: ({ icon }: { icon: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon:${icon}`} />;
  },
}));
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  // Entering and exiting animations only record what they were given, so the tests can read
  // them from the `entering` and `exiting` props of a view.
  class Animation {
    name: string;
    definitions?: unknown;
    durationMs?: number;
    constructor(label: string, defs?: unknown) {
      this.name = label;
      this.definitions = defs;
    }
    duration(ms: number) {
      this.durationMs = ms;
      return this;
    }
    delay() {
      return this;
    }
  }
  const preset = (label: string) => {
    const animation = {
      name: label,
      durationMs: undefined as number | undefined,
      duration(ms: number) {
        animation.durationMs = ms;
        return animation;
      },
      delay() {
        return animation;
      },
    };
    return animation;
  };
  class Keyframe extends Animation {
    constructor(definitions: unknown) {
      super('Keyframe', definitions);
    }
  }
  return {
    __esModule: true,
    default: { View },
    FadeIn: preset('FadeIn'),
    FadeInDown: preset('FadeInDown'),
    FadeOut: preset('FadeOut'),
    Keyframe,
    useSharedValue: (value: number) => ({ value, set: jest.fn() }),
    useAnimatedStyle: () => ({}),
    withTiming: (value: number) => value,
    withRepeat: (value: number) => value,
    withSequence: (...values: number[]) => values[values.length - 1],
    cancelAnimation: jest.fn(),
    Easing: { linear: 'linear', bezier: () => 'bezier' },
    useReducedMotion: jest.fn(() => false),
  };
});
// Svg shapes become plain views that keep their props, so the tests can read them.
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  const Shape = (props: Record<string, unknown>) => <View {...props} />;
  return { __esModule: true, default: Shape, Svg: Shape, Circle: Shape };
});
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  const open = jest.fn();
  // Tests read the last props to confirm or dismiss the picker.
  const Picker = (props: Record<string, unknown>) => {
    (Picker as unknown as { lastProps: unknown }).lastProps = props;
    return <View testID="date-picker" />;
  };
  return {
    __esModule: true,
    default: Picker,
    DateTimePickerAndroid: { open, dismiss: jest.fn() },
  };
});

// The chat socket never connects for real in tests; a test that needs events replaces this mock.
jest.mock('socket.io-client', () => {
  const socket = { connected: false, on: jest.fn(), off: jest.fn(), emit: jest.fn(), connect: jest.fn(), close: jest.fn() };
  return { io: jest.fn(() => socket) };
});
