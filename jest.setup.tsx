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
    useReducedMotion: jest.fn(() => false),
  };
});
