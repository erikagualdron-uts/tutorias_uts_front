import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '../../..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

// Register "sober with header" (docs/Design.md): exactly one ScreenHeader, no pattern. Each phase adds its screens.
const WITH_HEADER = [
  'src/features/modules/screens/ModulesScreen.tsx',
  'src/features/rooms/screens/LocationsScreen.tsx',
  'src/features/rooms/screens/RoomsScreen.tsx',
  'src/features/accounts/screens/AccountsListScreen.tsx',
  'src/features/periods/screens/PeriodsScreen.tsx',
  'src/features/holidays/screens/HolidaysScreen.tsx',
  'src/features/dropdown-lists/screens/DropdownListsScreen.tsx',
  'src/features/dropdown-lists/screens/DropdownItemsScreen.tsx',
  'src/features/dashboard/screens/ChangesScreen.tsx',
  'src/features/shell/screens/MoreScreen.tsx',
  'src/features/chat/screens/MessagesScreen.tsx',
  'src/features/pqrs/screens/MyPqrsScreen.tsx',
  'src/features/pqrs/screens/AdminPqrsScreen.tsx',
  'src/features/enrollments/screens/StudentModulesScreen.tsx',
  'src/features/student-schedule/screens/StudentScheduleScreen.tsx',
  'src/features/teacher-sessions/screens/TeacherScheduleScreen.tsx',
  'src/features/account/screens/AccountScreen.tsx',
];
const FORMS = [
  'src/features/modules/screens/ModuleFormScreen.tsx',
  'src/features/modules/screens/ModuleDetailScreen.tsx',
  'src/features/rooms/screens/LocationFormScreen.tsx',
  'src/features/rooms/screens/RoomFormScreen.tsx',
  'src/features/teachers/screens/CreateTeacherScreen.tsx',
  'src/features/accounts/screens/TeacherEditScreen.tsx',
  'src/features/periods/screens/PeriodFormScreen.tsx',
  'src/features/holidays/screens/HolidayFormScreen.tsx',
  'src/features/holidays/screens/HolidaysImportScreen.tsx',
  'src/features/dropdown-lists/screens/DropdownItemFormScreen.tsx',
  'src/features/smtp/screens/SmtpSettingsScreen.tsx',
  'src/features/chat/screens/ChatScreen.tsx',
  'src/features/chat/screens/NewChatScreen.tsx',
  'src/features/pqrs/screens/PqrsDetailScreen.tsx',
  'src/features/pqrs/screens/AdminPqrsDetailScreen.tsx',
  'src/features/pqrs/screens/NewPqrsScreen.tsx',
  'src/features/pqrs/screens/PqrsFiledScreen.tsx',
  'src/features/enrollments/screens/StudentModuleDetailScreen.tsx',
  'src/features/account/screens/AccountPasswordScreen.tsx',
  'src/features/account/screens/AccountNameScreen.tsx',
];
const count = (text: string, token: string) => text.split(token).length - 1;

describe('header budget', () => {
  it.each(WITH_HEADER)('%s has one ScreenHeader and no pattern', (path) => {
    const text = read(path);
    expect(count(text, '<ScreenHeader')).toBe(1);
    expect(text).not.toMatch(/BrandPattern|HeroCard/);
  });

  it.each(FORMS)('%s stays sober: no header, no pattern', (path) => {
    const text = read(path);
    expect(text).not.toMatch(/ScreenHeader|BrandPattern|HeroCard/);
  });
});
