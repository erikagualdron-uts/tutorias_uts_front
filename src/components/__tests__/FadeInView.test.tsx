import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { FadeInView } from '../FadeInView';

describe('FadeInView', () => {
  it.each([true, false])(
    'renders its children (reduced motion: %s)',
    async (reduced) => {
      jest.mocked(useReducedMotion).mockReturnValue(reduced);
      await render(
        <FadeInView>
          <Text>content</Text>
        </FadeInView>,
      );
      expect(screen.getByText('content')).toBeTruthy();
    },
  );
});
