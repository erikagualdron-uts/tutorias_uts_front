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
