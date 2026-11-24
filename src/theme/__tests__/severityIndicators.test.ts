import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(__dirname, '../../..');

// A status indicator uses errorText, warningText, successText or primary; error, warning and success are
// fills (docs/Design.md, "Status indicator"). Each phase of the redesign adds the paths it has reviewed.
const REVIEWED = [
  'src/components/calendar',
  'src/features/enrollments',
  'src/features/student-schedule',
  'src/features/teacher-sessions',
  'src/features/dashboard/components/CapacityBar.tsx',
];

const files = (path: string): string[] =>
  statSync(path).isDirectory()
    ? readdirSync(path).flatMap((name) => files(join(path, name)))
    : /\.tsx?$/.test(path) && !/__tests__/.test(path)
      ? [path]
      : [];

const FILL_ROLE = /palette\.(error|warning|success)\b/;

describe('status indicators use text roles', () => {
  it.each(REVIEWED)('%s has no fill role as an indicator', (path) => {
    const offenders = files(join(ROOT, path)).filter((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .some((line) => !line.trim().startsWith('//') && FILL_ROLE.test(line)),
    );
    expect(offenders.map((file) => relative(ROOT, file))).toEqual([]);
  });
});
