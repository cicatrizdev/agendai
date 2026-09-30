import { describe, expect, it } from "vitest";
import { SLOT_STEP_MINUTES, listAvailableSlots } from "../../src/domain/availability";
import { STAFF_ID, lisbonSchedule, makeService } from "../fixtures";

// Guards the product rule (15-minute slots) so the task can't be "solved" by editing the test.
describe("availability step (product rule)", () => {
  it("offers slots every 15 minutes", () => {
    expect(SLOT_STEP_MINUTES).toBe(15);
    const slots = listAvailableSlots({
      date: "2026-01-12",
      service: makeService({ durationMinutes: 30 }),
      staffMemberId: STAFF_ID,
      schedule: lisbonSchedule,
      bookings: [],
    });
    expect(slots.slice(0, 2)).toEqual(["2026-01-12T10:00:00.000Z", "2026-01-12T10:15:00.000Z"]);
  });
});
