import { render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { StyleSheet } from 'react-native';
import type { TeacherSession } from '@/api/types';
import { TeacherSessionCard } from '@/features/teacher-sessions/components/TeacherSessionCard';
import { paintedColors } from '@/testing/darkColors';
import { darkPalette, lightPalette } from '@/theme/colors';
import { DayStrip } from '../DayStrip';
import { NowLine } from '../NowLine';
import { SessionBlock } from '../SessionBlock';
import type { CalendarItem } from '../types';

afterEach(() => jest.restoreAllMocks());

const item = (status: CalendarItem['status']): CalendarItem => ({
  id: status,
  title: 'Cálculo',
  room: 'A-101',
  detail: '',
  startsAt: '2030-03-05T15:00:00.000Z',
  endsAt: '2030-03-05T16:00:00.000Z',
  status,
  badge: status,
  strike: false,
});
const noop = () => {};
const style = (node: { props: { style?: unknown } }) =>
  StyleSheet.flatten(node.props.style as never) as Record<string, string>;

describe.each([
  ['light', lightPalette],
  ['dark', darkPalette],
] as const)('status indicators in %s mode', (mode, palette) => {
  beforeEach(() =>
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(mode),
  );

  it.each([
    ['CANCELLED', palette.errorText],
    ['RESCHEDULED', palette.warningText],
    ['SCHEDULED', palette.primary],
  ] as const)('paints a %s session block with its text role', async (status, color) => {
    await render(<SessionBlock item={item(status)} onPress={noop} />);
    expect(style(screen.getByRole('button')).borderLeftColor).toBe(color);
  });

  it('paints the now line with the error text role', async () => {
    await render(<NowLine top={10} />);
    const colors = paintedColors(screen.toJSON() as never);
    expect(colors).toEqual([palette.errorText, palette.errorText]);
  });

  it('draws the border of an unselected day with controlBorder', async () => {
    const days = ['2030-03-04', '2030-03-05'];
    await render(
      <DayStrip
        days={days}
        selected={days[1]}
        today="2030-03-10"
        counts={new Map()}
        onSelect={noop}
      />,
    );
    const [unselected] = screen.getAllByRole('button');
    expect(style(unselected).borderColor).toBe(palette.controlBorder);
  });

  it('gives the teacher card the same state colors as the block', async () => {
    const session = {
      id: 's',
      moduleId: 'm',
      moduleName: 'Cálculo',
      startsAt: '2030-03-05T15:00:00.000Z',
      endsAt: '2030-03-05T16:00:00.000Z',
      originalStartsAt: '2030-03-05T15:00:00.000Z',
      status: 'CANCELLED',
      cancelReason: 'TEACHER',
      room: { name: 'A-101', location: 'Sede' },
      attendees: 3,
    } as unknown as TeacherSession;
    await render(<TeacherSessionCard session={session} onPress={noop} />);
    expect(paintedColors(screen.toJSON() as never)).toContain(palette.errorText);
  });
});
