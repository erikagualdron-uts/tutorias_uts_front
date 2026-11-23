import { render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { allowControlIssues, controlIssues } from '../a11y';

// These tests render bad controls on purpose; the global check after each test must let them be.
beforeEach(allowControlIssues);
afterEach(allowControlIssues);

const press = (props: object, label = 'Guardar') => (
  <Pressable onPress={() => {}} {...props}>
    <Text>{label}</Text>
  </Pressable>
);

describe('controlIssues', () => {
  it('accepts a named control with a role and a 48 px height', async () => {
    await render(press({ accessibilityRole: 'button', style: { minHeight: 48 } }));
    expect(controlIssues()).toEqual([]);
  });

  it('accepts a control whose size is not declared', async () => {
    await render(press({ accessibilityRole: 'button' }));
    expect(controlIssues()).toEqual([]);
  });

  it('names a control without a role', async () => {
    await render(press({}));
    expect(controlIssues()).toEqual([{ control: 'Guardar', problem: 'NO_ROLE' }]);
  });

  it('flags an icon-only control without a label', async () => {
    await render(<Pressable accessibilityRole="button" onPress={() => {}} />);
    expect(controlIssues()).toEqual([{ control: '<button>', problem: 'NO_NAME' }]);
  });

  it('accepts an icon-only control with a label', async () => {
    await render(<Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => {}} />);
    expect(controlIssues()).toEqual([]);
  });

  it('ignores a control hidden from the screen reader on purpose', async () => {
    await render(<Pressable accessible={false} onPress={() => {}} />);
    expect(controlIssues()).toEqual([]);
  });

  it('flags a declared height under 48 unless a hitSlop completes it', async () => {
    await render(press({ accessibilityRole: 'button', style: { height: 40 } }));
    expect(controlIssues()).toEqual([{ control: 'Guardar', problem: 'TOO_SMALL' }]);
  });

  it('counts the hitSlop and a style function', async () => {
    await render(
      press({ accessibilityRole: 'button', hitSlop: { top: 4, bottom: 4 }, style: () => ({ height: 40 }) }),
    );
    expect(controlIssues()).toEqual([]);
  });
});
