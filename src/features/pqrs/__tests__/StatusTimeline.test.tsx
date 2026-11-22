import { render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { StatusTimeline } from '../components/StatusTimeline';

const CREATED = '2030-01-08T19:00:00.000Z'; // 14:00 Bogota
const REVIEWED = '2030-01-09T15:00:00.000Z'; // 10:00 Bogota
const RESOLVED = '2030-01-10T21:00:00.000Z'; // 16:00 Bogota

beforeEach(() => i18n.changeLanguage('es'));

describe('StatusTimeline', () => {
  it('FILED: the first step has its date and is current, the others are pending without a date', async () => {
    await render(<StatusTimeline status="FILED" createdAt={CREATED} reviewedAt={null} resolvedAt={null} />);
    expect(screen.getByLabelText('Radicada, actual, 08/01/2030 · 14:00')).toBeTruthy();
    expect(screen.getByLabelText('En revisión, pendiente')).toBeTruthy();
    expect(screen.getByLabelText('Resuelta, pendiente')).toBeTruthy();
    expect(screen.getByText('Actual')).toBeTruthy();
    expect(screen.getAllByText('Pendiente')).toHaveLength(2);
  });

  it('IN_REVIEW: two steps with date and time of Bogota, the second one current', async () => {
    await render(<StatusTimeline status="IN_REVIEW" createdAt={CREATED} reviewedAt={REVIEWED} resolvedAt={null} />);
    expect(screen.getByText('08/01/2030 · 14:00')).toBeTruthy();
    expect(screen.getByText('09/01/2030 · 10:00')).toBeTruthy();
    expect(screen.getByLabelText('En revisión, actual, 09/01/2030 · 10:00')).toBeTruthy();
    expect(screen.getByLabelText('Resuelta, pendiente')).toBeTruthy();
  });

  it('RESOLVED: the three steps with their dates and the last one current', async () => {
    await render(<StatusTimeline status="RESOLVED" createdAt={CREATED} reviewedAt={REVIEWED} resolvedAt={RESOLVED} />);
    expect(screen.getByText('10/01/2030 · 16:00')).toBeTruthy();
    expect(screen.getByLabelText('Resuelta, actual, 10/01/2030 · 16:00')).toBeTruthy();
    expect(screen.getByLabelText('Radicada, 08/01/2030 · 14:00')).toBeTruthy();
    expect(screen.queryByText('Pendiente')).toBeNull();
  });

  it('shows a done step without a date as done and with no time', async () => {
    await render(<StatusTimeline status="RESOLVED" createdAt={CREATED} reviewedAt={null} resolvedAt={RESOLVED} />);
    expect(screen.getByLabelText('En revisión')).toBeTruthy();
    expect(screen.queryByLabelText('En revisión, pendiente')).toBeNull();
  });

  it('writes the same in English', async () => {
    await i18n.changeLanguage('en');
    await render(<StatusTimeline status="IN_REVIEW" createdAt={CREATED} reviewedAt={REVIEWED} resolvedAt={null} />);
    expect(screen.getByText('Progress')).toBeTruthy();
    expect(screen.getByLabelText('In review, current, 09/01/2030 · 10:00')).toBeTruthy();
    expect(screen.getByLabelText('Resolved, pending')).toBeTruthy();
  });
});
