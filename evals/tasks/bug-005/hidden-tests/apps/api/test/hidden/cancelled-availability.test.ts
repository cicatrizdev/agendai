import { describe, expect, it } from "vitest";
import { listAvailableSlots } from "../../src/domain/availability";
import { STAFF_ID, lisbonSchedule, makeBooking, makeService } from "../fixtures";

describe("availability ignores cancelled bookings", () => {
  it("offers a slot whose only booking was cancelled", () => {
    const slots = listAvailableSlots({
      date: "2026-01-12",
      service: makeService({ durationMinutes: 60 }),
      staffMemberId: STAFF_ID,
      schedule: lisbonSchedule,
      bookings: [makeBooking("2026-01-12T12:00:00Z", "2026-01-12T13:00:00Z", { status: "cancelled" })],
    });
    expect(slots).toContain("2026-01-12T12:00:00.000Z");
    expect(slots).toHaveLength(33);
  });

  it("still blocks slots of confirmed bookings", () => {
    const slots = listAvailableSlots({
      date: "2026-01-12",
      service: makeService({ durationMinutes: 60 }),
      staffMemberId: STAFF_ID,
      schedule: lisbonSchedule,
      bookings: [makeBooking("2026-01-12T12:00:00Z", "2026-01-12T13:00:00Z")],
    });
    expect(slots).not.toContain("2026-01-12T12:00:00.000Z");
  });
});
