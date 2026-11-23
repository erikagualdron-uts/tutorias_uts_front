// Shapes of specs/019-dashboards/contracts/dashboard-api.yaml.
export interface AdminOverview {
  occupancy: { enrolled: number; capacity: number; percent: number };
  modules: { active: number; full: number; lowEnrollment: number };
  lowEnrollmentPercent: number;
  accounts: { students: number; teachers: number };
  pqrs: { filed: number; inReview: number; resolved: number; avgResponseSeconds: number | null };
}

export interface RecentChange {
  sessionId: string;
  moduleId: string;
  moduleName: string;
  kind: 'RESCHEDULED' | 'CANCELLED';
  originalStartsAt: string;
  startsAt: string;
  changedAt: string;
}

export interface RoomUsage {
  roomId: string;
  name: string;
  location: string;
  percent: number;
  modules: number;
}

export interface AdminRooms {
  most: RoomUsage[];
  least: RoomUsage[];
}

export interface NextSession {
  sessionId: string;
  moduleId: string;
  moduleName: string;
  startsAt: string;
  endsAt: string;
  room: string;
  attendees?: number;
}

export interface TeacherDashboard {
  nextSession: NextSession | null;
  weekSessions: number;
  modules: { id: string; name: string; enrolled: number; capacity: number }[];
}

export interface StudentDashboard {
  nextSession: NextSession | null;
  weekSessions: number;
  changes: RecentChange[];
}
