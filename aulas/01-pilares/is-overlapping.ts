/** A time range. Callers pass instants; the comparison decides whether they clash. */
export interface Interval {
  start: Date;
  end: Date;
}

/** True when the two ranges share at least one instant. */
export function isOverlapping(a: Interval, b: Interval): boolean {
  return a.start <= b.end && b.start <= a.end;
}
