import type { Booking, Service } from "@agendai/shared";
import { fitsBusinessHours, hoursForWeekday, type TenantSchedule } from "./business-hours";
import { computeEndsAt } from "./duration";
import { bookingInterval, overlaps } from "./overlap";
import { parseTimeOfDay, toZonedParts, zonedTimeToUtc } from "./time";

export const SLOT_STEP_MINUTES = 15;

export interface AvailabilityRequest {
  /** Local date in the tenant's time zone, "YYYY-MM-DD". */
  date: string;
  service: Pick<Service, "durationMinutes">;
  staffMemberId: string;
  schedule: TenantSchedule;
  bookings: Booking[];
}

/** Lists the free start times (ISO strings) for a service with a staff member on a local date. */
export function listAvailableSlots(request: AvailabilityRequest): string[] {
  const { date, service, staffMemberId, schedule } = request;
  const noon = zonedTimeToUtc(date, 12 * 60, schedule.timeZone);
  const hours = hoursForWeekday(schedule, toZonedParts(noon, schedule.timeZone).weekday);
  if (!hours) return [];

  const busy = request.bookings
    .filter((b) => b.staffMemberId === staffMemberId && b.status !== "cancelled")
    .map(bookingInterval);

  const slots: string[] = [];
  const closesAt = parseTimeOfDay(hours.closesAt);
  for (let minute = parseTimeOfDay(hours.opensAt); minute < closesAt; minute += SLOT_STEP_MINUTES) {
    const start = zonedTimeToUtc(date, minute, schedule.timeZone);
    const slot = { start, end: computeEndsAt(start, service) };
    if (!fitsBusinessHours(slot, schedule)) continue;
    if (busy.some((interval) => overlaps(slot, interval))) continue;
    slots.push(start.toISOString());
  }
  return slots;
}
