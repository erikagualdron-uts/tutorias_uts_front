import { render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { StyleSheet, Text } from 'react-native';
import { cloneElement, type ReactElement } from 'react';
import { AnnouncementCard } from '@/features/chat/components/AnnouncementCard';
import { darkPalette, lightPalette } from '@/theme/colors';
import { Banner } from '../Banner';
import { Button } from '../Button';
import { Card } from '../Card';
import { ConfirmDialog } from '../ConfirmDialog';
import { EmptyState } from '../EmptyState';
import { FilterChips } from '../FilterChips';
import { SegmentedControl } from '../SegmentedControl';
import { TextField } from '../TextField';

type Node = { props?: { style?: unknown }; children?: unknown[] | null };
const COLOR_KEYS = ['backgroundColor', 'color', 'borderColor', 'tintColor'];

// Colors a component paints: every color of every resolved style in the rendered tree.
function paintedColors(node: Node | Node[] | null): string[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(paintedColors);
  const style = StyleSheet.flatten(node.props?.style as never) as
    Record<string, unknown> | undefined;
  const own = COLOR_KEYS.map((key) => style?.[key]).filter(
    (value): value is string => typeof value === 'string',
  );
  return [
    ...own,
    ...(node.children ?? []).flatMap((child) =>
      typeof child === 'object' ? paintedColors(child as Node) : [],
    ),
  ];
}

const darkValues = new Set(Object.values(darkPalette));
// Roles whose light value is not used by any dark role: it would be a leftover of the light mode.
const lightOnly = Object.entries(lightPalette)
  .filter(([, value]) => !darkValues.has(value))
  .map(([, value]) => value);

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
