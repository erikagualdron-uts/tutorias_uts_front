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
  const entering = () => {
    const chain: Record<string, unknown> = {};
    chain.duration = () => chain;
    chain.delay = () => chain;
    return chain;
  };
  return {
    __esModule: true,
    default: { View },
    FadeIn: entering(),
    FadeInDown: entering(),
    useSharedValue: (value: number) => ({ value, set: jest.fn() }),
    useAnimatedStyle: () => ({}),
    withTiming: (value: number) => value,
    withRepeat: (value: number) => value,
    cancelAnimation: jest.fn(),
    Easing: { linear: 'linear' },
    useReducedMotion: jest.fn(() => false),
  };
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
