import { screen } from '@testing-library/react-native';
import { StyleSheet, type ViewStyle } from 'react-native';
import { MIN_TOUCH_TARGET } from '@/theme';

interface Node {
  type: string;
  props: Record<string, unknown>;
  children: (Node | string)[];
  parent?: Node | null;
}

export interface ControlIssue {
  control: string;
  problem: 'NO_NAME' | 'NO_ROLE' | 'TOO_SMALL';
}

const ROLES = ['button', 'link', 'switch', 'tab', 'radio', 'checkbox'];

const walk = (node: Node, out: Node[] = []): Node[] => {
  out.push(node);
  for (const child of node.children) if (typeof child !== 'string') walk(child, out);
  return out;
};

const text = (node: Node): string =>
  node.children.map((c) => (typeof c === 'string' ? c : text(c))).join('');

// Jest has no layout engine: the size is what the styles declare, not what is measured. An undeclared
// size passes; a declared one (own, or the direct parent's) under 48 without a hitSlop that fills it fails.
function declaredHeight(node: Node) {
  for (const n of [node, node.parent]) {
    if (!n) continue;
    const { minHeight, height } = (StyleSheet.flatten(n.props.style as ViewStyle) ?? {}) as ViewStyle;
    const value = (minHeight ?? height) as number | undefined;
    if (typeof value === 'number') {
      const slop = (n.props.hitSlop ?? {}) as { top?: number; bottom?: number };
      return value + (slop.top ?? 0) + (slop.bottom ?? 0);
    }
  }
  return undefined;
}

// Touch controls (Pressable, which renders `onClick`) of the rendered screen that a screen reader
// could not name, could not tell what they are, or that are declared smaller than 48 px.
export function controlIssues(root: Node = screen.container as unknown as Node): ControlIssue[] {
  const issues: ControlIssue[] = [];
  for (const node of walk(root)) {
    if (node.props.accessible === false) continue; // hidden on purpose, like a tap-outside backdrop
    const role = node.props.accessibilityRole as string | undefined;
    if (!node.props.onClick && !(role && ROLES.includes(role))) continue;
    const name = (node.props.accessibilityLabel as string) || text(node).trim();
    const control = name || `<${role ?? node.type}>`;
    if (!name) issues.push({ control, problem: 'NO_NAME' });
    if (!role) issues.push({ control, problem: 'NO_ROLE' });
    const height = declaredHeight(node);
    if (height !== undefined && height < MIN_TOUCH_TARGET) issues.push({ control, problem: 'TOO_SMALL' });
  }
  return issues;
}

// Set by a test that renders a bad control on purpose; cleared before every test.
let allowed = false;
export const allowControlIssues = () => {
  allowed = true;
};

// Run after every test (jest `setupFilesAfterEnv`): whatever a test left rendered must pass.
export function checkRenderedControls() {
  const skip = allowed;
  allowed = false;
  let root: Node;
  try {
    root = screen.container as unknown as Node;
  } catch {
    return; // nothing was rendered
  }
  if (!root || skip) return;
  const issues = controlIssues(root);
  if (issues.length)
    throw new Error(`Inaccessible controls: ${issues.map((i) => `${i.control} (${i.problem})`).join(', ')}`);
}
