/** Pixels per hour on the day sheet. A 30-minute service stays tall enough to read. */
export const HOUR_PX = 144;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Weekday of a civil date in a time zone. 0 = Sunday, matching business_hours.weekday. */
export function weekdayIn(date: string, timeZone: string): number {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const probe = new Date(Date.UTC(year, month - 1, day, 15));
  const name = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(probe);
  return WEEKDAYS.indexOf(name);
}

/** Minutes since local midnight for an instant in a time zone. */
export function minutesInZone(iso: string, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  return hour * 60 + minute;
}

/** "09:00" or "09:00:00" to minutes since midnight. */
export function parseClock(value: string): number {
  const [hours, minutes] = value.split(":").map(Number) as [number, number];
  return hours * 60 + (minutes ?? 0);
}

export function formatMinuteLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export interface DayWindow {
  open: number;
  close: number;
}

/**
 * The sheet runs across opening hours. An entry outside that range extends the
 * window to the surrounding hour, so nothing is clipped. A closed day with no
 * entries has no window.
 */
export function dayWindow(
  hours: { opensAt: string; closesAt: string } | undefined,
  spans: { start: number; end: number }[],
): DayWindow | null {
  let open = hours ? parseClock(hours.opensAt) : Number.POSITIVE_INFINITY;
  let close = hours ? parseClock(hours.closesAt) : Number.NEGATIVE_INFINITY;
  for (const span of spans) {
    open = Math.min(open, Math.floor(span.start / 60) * 60);
    const endOnHour = span.end % 60 === 0 ? span.end : Math.ceil(span.end / 60) * 60;
    close = Math.max(close, endOnHour);
  }
  if (!Number.isFinite(open) || !Number.isFinite(close) || close <= open) return null;
  return { open, close };
}

/** Top and height of a booking block, in pixels, inside the day window. */
export function blockBox(start: number, end: number, window: DayWindow): { top: number; height: number } {
  return {
    top: ((start - window.open) / 60) * HOUR_PX,
    height: ((end - start) / 60) * HOUR_PX,
  };
}
