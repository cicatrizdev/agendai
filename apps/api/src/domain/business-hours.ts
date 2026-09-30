import type { BusinessHours } from "@agendai/shared";
import type { Interval } from "./overlap";
import { parseTimeOfDay, toZonedParts } from "./time";

/** The tenant data needed to decide whether an interval is inside opening hours. */
export interface TenantSchedule {
  timeZone: string;
  hours: BusinessHours[];
}

/** Finds the opening hours for a weekday, if the business opens that day. */
export function hoursForWeekday(schedule: TenantSchedule, weekday: number): BusinessHours | undefined {
  return schedule.hours.find((h) => h.weekday === weekday);
}

/** True when the whole interval fits inside the opening hours of a single local day. */
export function fitsBusinessHours(slot: Interval, schedule: TenantSchedule): boolean {
  const start = toZonedParts(slot.start, schedule.timeZone);
  const end = toZonedParts(slot.end, schedule.timeZone);
  if (start.date !== end.date) return false;

  const hours = hoursForWeekday(schedule, start.weekday);
  if (!hours) return false;

  return start.minutes >= parseTimeOfDay(hours.opensAt) && end.minutes <= parseTimeOfDay(hours.closesAt);
}
