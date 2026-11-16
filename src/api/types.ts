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
