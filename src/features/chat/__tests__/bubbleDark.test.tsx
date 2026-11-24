import { render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { StyleSheet } from 'react-native';
import { darkPalette } from '@/theme/colors';
import { MessageBubble } from '../components/MessageBubble';

afterEach(() => jest.restoreAllMocks());

const message = { body: 'Hola', createdAt: '2030-01-08T19:00:00.000Z' };
const bubbleStyle = () =>
  StyleSheet.flatten(screen.getByText('Hola').parent?.props.style) as Record<string, unknown>;

describe('message bubble border in dark mode', () => {
  it('separates the bubble of someone else from the screen with the card border', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    await render(<MessageBubble message={message} mine={false} />);
    expect(bubbleStyle()).toMatchObject({ borderWidth: 1, borderColor: darkPalette.border });
  });

  it('leaves my own bubble without a border, and light mode unchanged', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    await render(<MessageBubble message={message} mine />);
    expect(bubbleStyle().borderWidth).toBeUndefined();
    await screen.unmount();
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    await render(<MessageBubble message={message} mine={false} />);
    expect(bubbleStyle().borderWidth).toBeUndefined();
  });
});
