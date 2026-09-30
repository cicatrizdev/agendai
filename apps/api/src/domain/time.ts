const MINUTES_PER_DAY = 24 * 60;

/** A wall-clock view of an instant in a given time zone. */
export interface ZonedParts {
  /** Local date as "YYYY-MM-DD". */
  date: string;
  /** 0 = Sunday ... 6 = Saturday. */
  weekday: number;
  /** Minutes since local midnight. */
  minutes: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Converts an instant to the local date, weekday and time in `timeZone`. */
export function toZonedParts(instant: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(instant).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: WEEKDAYS.indexOf(parts.weekday ?? ""),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Returns the instant for a local date + minutes-since-midnight in `timeZone`. */
export function zonedTimeToUtc(date: string, minutes: number, timeZone: string): Date {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const asIfUtc = Date.UTC(year, month - 1, day, 0, minutes);
  const firstGuess = asIfUtc - offsetMs(new Date(asIfUtc), timeZone);
  // A second pass fixes the guess when a DST change happens between the two instants.
  return new Date(asIfUtc - offsetMs(new Date(firstGuess), timeZone));
}

/** Parses "HH:MM" (or "HH:MM:SS") into minutes since midnight. */
export function parseTimeOfDay(value: string): number {
  const [hours, minutes] = value.split(":").map(Number) as [number, number];
  return hours * 60 + minutes;
}

export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * 60_000);
}

function offsetMs(instant: Date, timeZone: string): number {
  const local = toZonedParts(instant, timeZone);
  const [year, month, day] = local.date.split("-").map(Number) as [number, number, number];
  const localAsUtc = Date.UTC(year, month - 1, day) + (local.minutes % MINUTES_PER_DAY) * 60_000;
  const instantWithoutSeconds = Math.floor(instant.getTime() / 60_000) * 60_000;
  return localAsUtc - instantWithoutSeconds;
}
