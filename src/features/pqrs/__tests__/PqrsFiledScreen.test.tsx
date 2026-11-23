import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { useSession } from '@/store/session';
import { PqrsFiledScreen } from '../screens/PqrsFiledScreen';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: (...a: unknown[]) => mockReplace(...a) },
  useLocalSearchParams: () => mockParams,
}));

const ID = 'a1b2c3d4-0000-4000-8000-000000000001';
const signIn = (role: 'STUDENT' | 'TEACHER') =>
  useSession.setState({
    status: 'signedIn',
    user: { id: 'u1', email: 'x@uts.edu.co', role, mustChangePassword: false, locale: 'es' },
    accessToken: 'token',
    signOutReason: null,
  });

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = { id: ID, createdAt: '2030-01-08T19:00:00.000Z', status: 'FILED' };
  signIn('STUDENT');
  await i18n.changeLanguage('es');
});

describe('PqrsFiledScreen', () => {
  it('confirms with the filing number, the date in Bogota and the state in text', async () => {
    await render(<PqrsFiledScreen />);
    expect(screen.getByText('Tu PQRS quedó radicada')).toBeTruthy();
    expect(screen.getByText('A1B2C3D4')).toBeTruthy();
    expect(screen.getByText('08/01/2030 · 14:00')).toBeTruthy();
    expect(screen.getByText('Radicada')).toBeTruthy();
  });

  it('opens the PQRS or goes back to the list, in the route of the student', async () => {
    await render(<PqrsFiledScreen />);
    await fireEvent.press(screen.getByLabelText('Ver mi PQRS'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/(student)/pqrs/[id]', params: { id: ID } });
    await fireEvent.press(screen.getByLabelText('Volver a mis PQRS'));
    expect(mockReplace).toHaveBeenLastCalledWith('/(student)/pqrs');
  });

  it('uses the routes of the teacher', async () => {
    signIn('TEACHER');
    await render(<PqrsFiledScreen />);
    await fireEvent.press(screen.getByLabelText('Ver mi PQRS'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/(teacher)/pqrs/[id]', params: { id: ID } });
    await fireEvent.press(screen.getByLabelText('Volver a mis PQRS'));
    expect(mockReplace).toHaveBeenLastCalledWith('/(teacher)/pqrs');
  });

  it('writes the same in English', async () => {
    await i18n.changeLanguage('en');
    await render(<PqrsFiledScreen />);
    expect(screen.getByText('Your PQRS was filed')).toBeTruthy();
    expect(screen.getByLabelText('View my PQRS')).toBeTruthy();
    expect(screen.getByLabelText('Back to my PQRS')).toBeTruthy();
  });
});
