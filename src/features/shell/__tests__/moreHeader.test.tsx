import { render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { MoreScreen } from '../screens/MoreScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

describe('MoreScreen', () => {
  it('opens with the brand header and no count', async () => {
    await render(<MoreScreen />);
    expect(screen.getByRole('header', { name: i18n.t('tabs.more') })).toBeOnTheScreen();
    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });
});
