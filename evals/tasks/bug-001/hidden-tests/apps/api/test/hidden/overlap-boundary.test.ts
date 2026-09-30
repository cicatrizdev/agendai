import { describe, expect, it } from "vitest";
import { listAvailableSlots } from "../../src/domain/availability";
import { planBooking } from "../../src/domain/booking";
import { findConflict, overlaps } from "../../src/domain/overlap";
import { STAFF_ID, lisbonSchedule, makeBooking, makeService, makeStaffMember } from "../fixtures";

const at = (iso: string) => new Date(iso);

describe("half-open intervals [start, end)", () => {
  it("intervals that only touch do not overlap", () => {
    const morning = { start: at("2026-01-12T09:00:00Z"), end: at("2026-01-12T10:00:00Z") };
    const next = { start: at("2026-01-12T10:00:00Z"), end: at("2026-01-12T11:00:00Z") };
    expect(overlaps(morning, next)).toBe(false);
    expect(overlaps(next, morning)).toBe(false);
  });

  it("a booking ending at 10:00 does not conflict with one starting at 10:00", () => {
    const existing = makeBooking("2026-01-12T09:00:00Z", "2026-01-12T10:00:00Z");
    const candidate = { start: at("2026-01-12T10:00:00Z"), end: at("2026-01-12T11:00:00Z") };
    expect(findConflict(candidate, STAFF_ID, [existing])).toBeUndefined();
  });

  it("allows booking right after another booking ends", () => {
    const result = planBooking({
      startsAt: at("2026-01-12T11:00:00Z"),
      now: at("2026-01-10T12:00:00Z"),
      service: makeService({ durationMinutes: 60 }),
      staffMember: makeStaffMember(),
      schedule: lisbonSchedule,
      existingBookings: [makeBooking("2026-01-12T10:00:00Z", "2026-01-12T11:00:00Z")],
    });
    expect(result.ok).toBe(true);
  });

  it("offers the slots that touch an existing booking", () => {
    const slots = listAvailableSlots({
      date: "2026-01-12",
      service: makeService({ durationMinutes: 60 }),
      staffMemberId: STAFF_ID,
      schedule: lisbonSchedule,
      bookings: [makeBooking("2026-01-12T12:00:00Z", "2026-01-12T13:00:00Z")],
    });
    expect(slots).toContain("2026-01-12T11:00:00.000Z");
    expect(slots).toContain("2026-01-12T13:00:00.000Z");
  });
});
