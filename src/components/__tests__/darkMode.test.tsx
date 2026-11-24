import { render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { Text } from 'react-native';
import { cloneElement, type ReactElement } from 'react';
import { AnnouncementCard } from '@/features/chat/components/AnnouncementCard';
import { MetricCard } from '@/features/dashboard/components/MetricCard';
import { contrast } from '@/testing/contrast';
import { lightOnly, paintedColors } from '@/testing/darkColors';
import { gradients, onGradient } from '@/theme';
import { darkPalette, lightPalette } from '@/theme/colors';
import { Banner } from '../Banner';
import { Button } from '../Button';
import { Card } from '../Card';
import { ConfirmDialog } from '../ConfirmDialog';
import { EmptyState } from '../EmptyState';
import { FilterChips } from '../FilterChips';
import { HeroCard } from '../HeroCard';
import { SegmentedControl } from '../SegmentedControl';
import { TextField } from '../TextField';

const noop = () => {};
const samples: [string, ReactElement][] = [
  [
    'Card',
    <Card key="c">
      <Text>Texto</Text>
    </Card>,
  ],
  ['Banner info', <Banner key="bi" message="Aviso" />],
  ['Banner success', <Banner key="bs" message="Aviso" severity="success" />],
  ['Banner warning', <Banner key="bw" message="Aviso" severity="warning" />],
  ['Banner error', <Banner key="be" message="Aviso" severity="error" />],
  ['Button', <Button key="b" label="Acción" icon="user" onPress={noop} />],
  [
    'Button outlined',
    <Button key="bo" label="Acción" icon="user" variant="outlined" onPress={noop} />,
  ],
  [
    'Button tonal',
    <Button key="bt" label="Acción" icon="user" variant="tonal" onPress={noop} />,
  ],
  [
    'Button destructive',
    <Button
      key="bd"
      label="Acción"
      icon="trash"
      variant="destructive"
      onPress={noop}
    />,
  ],
  [
    'TextField',
    <TextField
      key="t"
      label="Nombre"
      leadingIcon="user"
      value=""
      onChangeText={noop}
    />,
  ],
  [
    'FilterChips',
    <FilterChips
      key="f"
      options={[
        { value: 'a', label: 'A' },
        { value: undefined, label: 'Todos' },
      ]}
      value="a"
      onChange={noop}
    />,
  ],
  [
    'SegmentedControl',
    <SegmentedControl
      key="s"
      label="Vista"
      options={[
        { value: 'a', label: 'A', icon: 'user' },
        { value: 'b', label: 'B', icon: 'user' },
      ]}
      value="a"
      onChange={noop}
    />,
  ],
  [
    'ConfirmDialog',
    <ConfirmDialog
      key="cd"
      title="Título"
      message="Mensaje"
      confirmLabel="Confirmar"
      confirmIcon="trash"
      onConfirm={noop}
      onCancel={noop}
    />,
  ],
  [
    'HeroCard',
    <HeroCard key="h">
      <Text>Ocupación</Text>
    </HeroCard>,
  ],
  ['MetricCard', <MetricCard key="m" value={3} label="Métrica" />],
  [
    'EmptyState',
    <EmptyState key="e" title="Vacío" description="Nada por aquí" />,
  ],
  [
    'AnnouncementCard',
    <AnnouncementCard
      key="a"
      message={{
        body: 'Aviso',
        createdAt: '2026-11-23T15:00:00.000Z',
        sender: { id: '1', firstName: 'Ana', lastName: 'Pérez' } as never,
      }}
    />,
  ],
];

afterEach(() => jest.restoreAllMocks());

describe('dark roles that cannot be the light value', () => {
  it('has its own cream for notices', () => {
    expect(darkPalette.surfaceWarm).not.toBe(lightPalette.surfaceWarm);
  });
  it('tells a surface from a card', () => {
    expect(darkPalette.surface).not.toBe(darkPalette.card);
  });
  it('has a shadow of its own', () => {
    expect(darkPalette.shadow).not.toBe(lightPalette.shadow);
  });
});

describe('shared components in dark mode', () => {
  it.each(samples)(
    '%s paints no leftover of the light mode',
    async (_name, element) => {
      jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
      await render(element);
      const leftovers = paintedColors(screen.toJSON() as never).filter(
        (color) => lightOnly.includes(color),
      );
      expect(leftovers).toEqual([]);
    },
  );
});

describe('a screen with every shared component', () => {
  it('leaves nothing of the light mode when the system changes to dark', async () => {
    const mode = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');
    // New element objects each time, so React renders again instead of reusing the previous result.
    const screenOf = () => (
      <>{samples.map(([, element]) => cloneElement(element))}</>
    );
    const view = await render(screenOf());
    const lightColors = paintedColors(screen.toJSON() as never);
    expect(lightColors.some((color) => lightOnly.includes(color))).toBe(true);

    mode.mockReturnValue('dark');
    await view.rerender(screenOf());
    expect(
      paintedColors(screen.toJSON() as never).filter((color) =>
        lightOnly.includes(color),
      ),
    ).toEqual([]);
  });
});

describe('text on the brand gradient', () => {
  it.each(gradients.brand.colors)('has 4.5:1 on %s', (end) => {
    expect(contrast(onGradient.text, end)).toBeGreaterThanOrEqual(4.5);
  });
});
