import { describe, expect, it } from "vitest";
import { listAvailableSlots } from "../src/domain/availability";
import { OTHER_STAFF_ID, STAFF_ID, lisbonSchedule, makeBooking, makeService } from "./fixtures";

const MONDAY = "2026-01-12";

function slotsFor(bookings = [makeBooking("2026-01-12T00:00:00Z", "2026-01-12T00:15:00Z", { staffMemberId: OTHER_STAFF_ID })]) {
  return listAvailableSlots({
    date: MONDAY,
    service: makeService({ durationMinutes: 60 }),
    staffMemberId: STAFF_ID,
    schedule: lisbonSchedule,
    bookings,
  });
}

describe("listAvailableSlots", () => {
  it("offers a slot every 15 minutes from opening time", () => {
    expect(slotsFor([]).slice(0, 4)).toEqual([
      "2026-01-12T10:00:00.000Z",
      "2026-01-12T10:15:00.000Z",
      "2026-01-12T10:30:00.000Z",
      "2026-01-12T10:45:00.000Z",
    ]);
  });

  it("stops at the last slot that still ends before closing time", () => {
    const slots = slotsFor([]);
    expect(slots.at(-1)).toBe("2026-01-12T18:00:00.000Z");
    expect(slots).toHaveLength(33);
  });

  it("hides slots that overlap a confirmed booking", () => {
    const slots = slotsFor([makeBooking("2026-01-12T12:00:00Z", "2026-01-12T13:00:00Z")]);
    expect(slots).not.toContain("2026-01-12T11:30:00.000Z");
    expect(slots).not.toContain("2026-01-12T12:00:00.000Z");
    expect(slots).not.toContain("2026-01-12T12:30:00.000Z");
    expect(slots).toContain("2026-01-12T10:00:00.000Z");
    expect(slots).toContain("2026-01-12T14:00:00.000Z");
  });

  it("ignores bookings of other staff members", () => {
    expect(slotsFor()).toHaveLength(33);
  });

  it("returns no slots on a closed day", () => {
    const sunday = listAvailableSlots({
      date: "2026-01-11",
      service: makeService(),
      staffMemberId: STAFF_ID,
      schedule: lisbonSchedule,
      bookings: [],
    });
    expect(sunday).toEqual([]);
  });
});
