export type Role = 'SUPERADMIN' | 'TEACHER' | 'STUDENT';
export type ApiLocale = 'es' | 'en';

export interface UserSummary {
  id: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  locale: ApiLocale;
  firstName?: string;
  lastName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserSummary;
}

export interface Page<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export type PeriodStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED';

export interface Period {
  id: string;
  name: string;
  startsOn: string; // YYYY-MM-DD, America/Bogota calendar day
  endsOn: string;
  status: PeriodStatus;
  closedAt: string | null;
  closedBy: 'MANUAL' | 'AUTOMATIC' | null;
  hasModules: boolean;
}

export interface PeriodInput {
  name: string;
  startsOn: string;
  endsOn: string;
}

export interface Location {
  id: string;
  name: string;
  roomCounts?: { active: number; inactive: number };
}

export type RoomStatus = 'ACTIVE' | 'INACTIVE';

export interface Room {
  id: string;
  locationId: string;
  locationName: string;
  name: string;
  capacity: number;
  status: RoomStatus;
}

export interface RoomImpact {
  modulesInActivePeriod: number;
  modulesInUpcomingPeriods: number;
  maxEnrolled: number;
}

export interface DropdownList {
  key: string;
  nameEs: string;
  nameEn: string;
  itemCount: number;
}

export interface DropdownItem {
  id: string;
  labelEs: string;
  labelEn: string;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  inUse?: boolean;
}

export interface DropdownListDetail {
  key: string;
  nameEs: string;
  nameEn: string;
  items: DropdownItem[];
}

// ---- Modules, sessions and holidays (spec 010, contracts/modules-api.yaml) ----

export interface PersonRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Teacher extends PersonRef {
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RoomRef {
  id: string;
  name: string;
  locationName: string;
  capacity: number;
}

// Weekly slot in local America/Bogota time. dayOfWeek: 1 = Monday ... 7 = Sunday.
export interface ScheduleInput {
  dayOfWeek: number;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface Schedule extends ScheduleInput {
  id: string;
  sessionsGenerated?: number;
}

export interface ModuleInput {
  periodId: string;
  name: string;
  description?: string | null;
  teacherId: string;
  roomId: string;
  schedules: ScheduleInput[];
}

export interface Module {
  id: string;
  periodId: string;
  periodStatus: PeriodStatus;
  name: string;
  teacher: PersonRef;
  room: RoomRef;
  capacity: number; // capacity of the current room (the cupo)
  enrolled: number;
  schedules: ScheduleInput[];
  roomUnavailable: boolean;
  teacherUnavailable: boolean;
}

export interface ModuleDetail extends Omit<Module, 'schedules'> {
  description: string | null;
  schedules: Schedule[];
  holidayDates: string[]; // YYYY-MM-DD
  canChangeSchedules: boolean;
  canDelete: boolean;
  readOnlyReason: 'PERIOD_CLOSED' | null;
}

export type SessionStatus = 'SCHEDULED' | 'RESCHEDULED' | 'CANCELLED';

export interface Session {
  id: string;
  startsAt: string; // ISO 8601 UTC
  endsAt: string;
  originalStartsAt: string;
  status: SessionStatus;
  cancelReason: 'HOLIDAY' | 'TEACHER' | null;
  teacher: PersonRef;
  room: RoomRef;
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  source: 'MANUAL' | 'IMPORTED';
  isPast: boolean;
}

export interface HolidayInput {
  date: string;
  name: string;
}

export interface HolidayPreview {
  date: string;
  name: string;
  alreadyExists: boolean;
  isPast: boolean;
}

export interface HolidayResult {
  holiday: Holiday;
  cancelledSessions: number;
}

export interface HolidayRemoval {
  restored: number;
  generated: number;
  notRestored: {
    sessionId: string;
    moduleId: string;
    reason: 'TEACHER_BUSY' | 'ROOM_BUSY';
  }[];
}

export type ModulePage = Page<Module> & { meta: { periodId: string | null } };

// ---- Student enrollment (spec 011, contracts/enrollments-api.yaml) ----

export interface Conflict {
  moduleName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface StudentRoomRef {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

export interface EnrollmentRef {
  id: string;
  enrolledAt: string;
}

export type OfferState = 'AVAILABLE' | 'LAST_SPOTS' | 'FULL' | 'ENROLLED' | 'BLOCKED';
export type OfferBlockReason = 'SCHEDULE_CONFLICT' | 'UNAVAILABLE';

export interface StudentModule {
  id: string;
  name: string;
  description: string | null;
  teacher: PersonRef;
  room: StudentRoomRef;
  schedules: ScheduleInput[];
  capacity: number;
  availableSeats: number;
  state: OfferState;
  blockReason: OfferBlockReason | null;
  conflict: Conflict | null;
  enrollment: EnrollmentRef | null;
}

export type SessionBlockReason = 'WINDOW_PASSED' | 'PERIOD_CLOSED' | 'SESSION_CANCELLED' | 'NO_SEAT';

export interface StudentSession {
  id: string;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  cancelReason: 'HOLIDAY' | 'TEACHER' | null;
  cancelledByStudent: boolean;
  freeSeats: number;
  canCancel: boolean;
  canRestore: boolean;
  blockReason: SessionBlockReason | null;
}

export interface StudentModuleDetail extends StudentModule {
  readOnly: boolean;
  cancelLeadMinutes: number;
  sessions: StudentSession[];
}

export interface Enrollment {
  id: string;
  moduleId: string;
  status: 'ACTIVE' | 'CANCELLED';
  enrolledAt: string;
  cancelledAt: string | null;
  effectiveUntil: string | null;
}

export interface EnrollmentItem extends Enrollment {
  module: StudentModule;
  readOnly: boolean;
  nextSession: StudentSession | null;
  upcomingSessions: number;
}

export type StudentModulePage = Page<StudentModule> & { meta: { periodId: string | null } };
export type EnrollmentPage = Page<EnrollmentItem>;

// ---- Teacher sessions (spec 012, contracts/teacher-sessions-api.yaml) ----

export type SessionScope = 'SESSION' | 'SERIES';
export type ChangeBlockReason = 'WINDOW_PASSED' | 'PERIOD_CLOSED' | 'PAST' | 'CANCELLED_BY_OTHER';

export interface TeacherSession {
  id: string;
  moduleId: string;
  moduleName: string;
  startsAt: string;
  endsAt: string;
  originalStartsAt: string;
  status: SessionStatus;
  cancelReason: 'HOLIDAY' | 'TEACHER' | null;
  room: StudentRoomRef;
  attendees: number;
  canReschedule: boolean;
  canCancel: boolean;
  canRestore: boolean;
  blockReason: ChangeBlockReason | null;
}

export interface TeacherModule {
  id: string;
  name: string;
  description: string | null;
  room: StudentRoomRef;
  schedules: ScheduleInput[];
  enrolled: number;
  capacity: number;
  readOnly: boolean;
  nextSession: TeacherSession | null;
}

export type TeacherModulePage = Page<TeacherModule> & { meta: { periodId: string | null } };
export type TeacherSessionPage = Page<TeacherSession> & { meta: { changeLeadMinutes: number } };

export interface SessionChange {
  scope: SessionScope;
  dryRun?: boolean;
  sessions: TeacherSession[];
}
