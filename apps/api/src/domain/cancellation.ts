export const CANCELLATION_WINDOW_MINUTES = 120;

/** A booking can be cancelled up to 2 hours before it starts. */
export function canCancel(startsAt: Date, now: Date): boolean {
  const minutesUntilStart = (startsAt.getTime() - now.getTime()) / 60_000;
  return minutesUntilStart >= CANCELLATION_WINDOW_MINUTES;
}
