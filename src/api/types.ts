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

export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface Teacher extends PersonRef {
  email: string;
  status: AccountStatus;
  modulesCount: number; // live modules of the active period
}

export interface AccountActionResult {
  id: string;
  status: AccountStatus;
  deleted?: boolean;
  unavailableModules?: number; // teachers: modules of the active period left without a teacher
  cancelledEnrollments?: number; // students: enrollments cancelled by the closure
}

export interface TeacherDetail extends Teacher {
  phone: string | null;
}

export interface StudentAccount extends PersonRef {
  email: string;
  program: string | null;
  status: AccountStatus;
  enrolledCount: number; // ACTIVE enrollments of the active period
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

// The weekly calendar of the student (spec 021): the sessions of the modules where they attend, any state.
export interface StudentSession {
  id: string;
  moduleId: string;
  moduleName: string;
  teacherName: string;
  room: StudentRoomRef;
  startsAt: string;
  endsAt: string;
  originalStartsAt: string;
  status: SessionStatus;
  cancelReason: 'HOLIDAY' | 'TEACHER' | null;
  // The student cancelled this session only for themselves; it stays in the list.
  absent: boolean;
}

export interface StudentCalendar {
  data: StudentSession[];
  meta: {
    from: string;
    to: string;
    period: CalendarPeriod | null;
    hours: { earliest: string; latest: string };
    hasEnrollments: boolean;
  };
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

// ---- Teacher weekly calendar (spec 013, contracts/teacher-calendar-api.yaml) ----

export interface CalendarPeriod {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  status: 'ACTIVE' | 'CLOSED';
}

export interface TeacherCalendar {
  data: TeacherSession[];
  meta: {
    from: string;
    to: string;
    period: CalendarPeriod | null;
    hours: { earliest: string; latest: string };
    changeLeadMinutes: number;
  };
}

// Notifications (spec 014). Title and body arrive already written in the user's language.
export type NotificationType =
  | 'MODULE_TEACHER_CHANGED'
  | 'MODULE_ROOM_CHANGED'
  | 'SESSIONS_CANCELLED_HOLIDAY'
  | 'SESSIONS_RESTORED_HOLIDAY'
  | 'SESSION_RESCHEDULED'
  | 'SESSION_CANCELLED_TEACHER'
  | 'SESSION_RESTORED_TEACHER'
  | 'PQRS_IN_REVIEW'
  | 'PQRS_RESPONDED'
  | 'PQRS_RESOLVED';

// A notice is about a module or about a PQRS (spec 017): exactly one of the two ids is set.
export interface AppNotification {
  id: string;
  type: NotificationType;
  moduleId: string | null;
  pqrsId: string | null;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  data: AppNotification[];
  meta: { page: number; limit: number; total: number };
}

// PQRS (spec 017). The type comes with both labels; the app picks by the device language.
export type PqrsStatus = 'FILED' | 'IN_REVIEW' | 'RESOLVED';

export interface PqrsType {
  id: string;
  labelEs: string;
  labelEn: string;
}

export interface PqrsMessage {
  id: string;
  body: string;
  createdAt: string;
}

export interface PqrsSummary {
  id: string;
  type: PqrsType;
  subject: string;
  status: PqrsStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PqrsDetail extends PqrsSummary {
  description: string;
  // The dates of the steps after filing, null until each happens (the timeline of spec 020).
  reviewedAt: string | null;
  resolvedAt: string | null;
  messages: PqrsMessage[];
}

export interface PqrsAuthor {
  id: string;
  role: 'TEACHER' | 'STUDENT';
  firstName: string;
  lastName: string;
  email: string;
}

export interface PqrsAdminSummary extends PqrsSummary {
  author: PqrsAuthor;
}

export type PqrsAdminDetail = PqrsAdminSummary & PqrsDetail;

export interface PqrsLimits {
  subjectMaxLength: number;
  descriptionMaxLength: number;
  responseMaxLength: number;
}

export type SmtpStatus = 'NOT_CONFIGURED' | 'CONFIGURED' | 'NEEDS_RECONFIGURATION';

export interface SmtpSettings {
  status: SmtpStatus;
  usingEnvironment: boolean;
  host: string | null;
  port: number | null;
  user: string | null;
  from: string | null;
  // The password is never returned, only whether one is stored.
  hasPassword: boolean;
}

export type SmtpTestCause =
  | 'AUTH_FAILED'
  | 'CONNECTION_FAILED'
  | 'TIMEOUT'
  | 'SENDER_REJECTED'
  | 'UNKNOWN';

export interface SmtpTestResult {
  ok: boolean;
  cause: SmtpTestCause | null;
}
