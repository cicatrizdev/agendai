import { err, ok, type Booking, type Result, type Service, type StaffMember } from "@agendai/shared";
import { fitsBusinessHours, type TenantSchedule } from "./business-hours";
import { canCancel } from "./cancellation";
import { computeEndsAt } from "./duration";
import { findConflict, type Interval } from "./overlap";

export type BookingError =
  | "service_inactive"
  | "staff_inactive"
  | "in_the_past"
  | "outside_business_hours"
  | "conflict";

export interface BookingPlanInput {
  startsAt: Date;
  now: Date;
  service: Service;
  staffMember: StaffMember;
  schedule: TenantSchedule;
  existingBookings: Booking[];
}

/** Applies every booking rule and returns the interval to store, or the first rule broken. */
export function planBooking(input: BookingPlanInput): Result<Interval, BookingError> {
  if (!input.service.active) return err("service_inactive");
  if (!input.staffMember.active) return err("staff_inactive");
  if (input.startsAt < input.now) return err("in_the_past");

  const interval = { start: input.startsAt, end: computeEndsAt(input.startsAt, input.service) };
  if (!fitsBusinessHours(interval, input.schedule)) return err("outside_business_hours");
  if (findConflict(interval, input.staffMember.id, input.existingBookings)) return err("conflict");

  return ok(interval);
}

export type CancellationError = "not_confirmed" | "too_late";

/** Checks whether a booking may be cancelled now. */
export function planCancellation(booking: Booking, now: Date): Result<void, CancellationError> {
  if (booking.status !== "confirmed") return err("not_confirmed");
  if (!canCancel(new Date(booking.startsAt), now)) return err("too_late");
  return ok(undefined);
}
