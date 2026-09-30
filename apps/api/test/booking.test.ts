import { describe, expect, it } from "vitest";
import { planBooking, planCancellation } from "../src/domain/booking";
import { lisbonSchedule, makeBooking, makeService, makeStaffMember } from "./fixtures";

const now = new Date("2026-01-10T12:00:00Z");

function plan(startsAt: string, overrides: Partial<Parameters<typeof planBooking>[0]> = {}) {
  return planBooking({
    startsAt: new Date(startsAt),
    now,
    service: makeService({ durationMinutes: 60 }),
    staffMember: makeStaffMember(),
    schedule: lisbonSchedule,
    existingBookings: [],
    ...overrides,
  });
}

describe("planBooking", () => {
  it("computes the end from the service duration", () => {
    const result = plan("2026-01-12T10:00:00Z");
    expect(result.ok && result.value.end.toISOString()).toBe("2026-01-12T11:00:00.000Z");
  });

  it("rejects inactive services and staff members", () => {
    expect(plan("2026-01-12T10:00:00Z", { service: makeService({ active: false }) })).toEqual({ ok: false, error: "service_inactive" });
    expect(plan("2026-01-12T10:00:00Z", { staffMember: makeStaffMember({ active: false }) })).toEqual({ ok: false, error: "staff_inactive" });
  });

  it("rejects bookings in the past", () => {
    expect(plan("2026-01-09T10:00:00Z")).toEqual({ ok: false, error: "in_the_past" });
  });

  it("rejects bookings outside business hours", () => {
    expect(plan("2026-01-12T18:30:00Z")).toEqual({ ok: false, error: "outside_business_hours" });
  });

  it("rejects bookings that overlap a confirmed booking", () => {
    const existing = makeBooking("2026-01-12T10:30:00Z", "2026-01-12T11:30:00Z");
    expect(plan("2026-01-12T10:00:00Z", { existingBookings: [existing] })).toEqual({ ok: false, error: "conflict" });
  });
});

describe("planCancellation", () => {
  it("allows cancelling a confirmed booking well in advance", () => {
    const booking = makeBooking("2026-01-12T10:00:00Z", "2026-01-12T11:00:00Z");
    expect(planCancellation(booking, now)).toEqual({ ok: true, value: undefined });
  });

  it("refuses to cancel a booking that is not confirmed", () => {
    const booking = makeBooking("2026-01-12T10:00:00Z", "2026-01-12T11:00:00Z", { status: "cancelled" });
    expect(planCancellation(booking, now)).toEqual({ ok: false, error: "not_confirmed" });
  });
});
