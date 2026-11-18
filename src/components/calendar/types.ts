export type CalendarItemStatus = 'SCHEDULED' | 'RESCHEDULED' | 'CANCELLED';

// What the calendar draws. It knows nothing about who owns the session: the caller prepares the texts.
export interface CalendarItem {
  id: string;
  title: string;
  room: string;
  // Second line of the block, e.g. the attendees of a teacher or the teacher of a student.
  detail: string;
  // ISO instants (UTC); the calendar places them by their Bogota day and hour.
  startsAt: string;
  endsAt: string;
  status: CalendarItemStatus;
  // The state as text, always shown next to its icon.
  badge: string;
  // Extra line for a moved session, e.g. its original hour.
  note?: string;
  strike: boolean;
}

export interface CalendarPeriodRange {
  startsOn: string;
  endsOn: string;
}

export interface CalendarHours {
  earliest: string;
  latest: string;
}

export type CalendarView = 'day' | 'week';
