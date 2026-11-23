import type { PqrsStatus } from '@/api/types';

export interface TimelineStep {
  step: PqrsStatus;
  // When the step happened; null while it is pending or when an older PQRS never stored it.
  at: string | null;
  done: boolean;
  current: boolean;
}

const ORDER: PqrsStatus[] = ['FILED', 'IN_REVIEW', 'RESOLVED'];

interface Dated {
  status: PqrsStatus;
  createdAt: string;
  reviewedAt?: string | null;
  resolvedAt?: string | null;
}

// The three steps of a PQRS (D-111: never skipped, never backwards) with the date of each one that happened.
export function timelineSteps({ status, createdAt, reviewedAt, resolvedAt }: Dated): TimelineStep[] {
  const reached = ORDER.indexOf(status);
  const dates = [createdAt, reviewedAt ?? null, resolvedAt ?? null];
  return ORDER.map((step, i) => ({ step, at: i <= reached ? dates[i] : null, done: i <= reached, current: i === reached }));
}
