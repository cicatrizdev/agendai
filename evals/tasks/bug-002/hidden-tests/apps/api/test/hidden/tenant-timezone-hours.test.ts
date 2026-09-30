import { describe, expect, it } from "vitest";
import { listAvailableSlots } from "../../src/domain/availability";
import { fitsBusinessHours } from "../../src/domain/business-hours";
import { STAFF_ID, lisbonSchedule, makeService, saoPauloSchedule } from "../fixtures";

const slot = (start: string, end: string) => ({ start: new Date(start), end: new Date(end) });

describe("business hours use the tenant's time zone, not the server's", () => {
  it("Lisbon in summer (UTC+1): 10:00 local is 09:00 UTC", () => {
    expect(fitsBusinessHours(slot("2026-07-13T09:00:00Z", "2026-07-13T10:00:00Z"), lisbonSchedule)).toBe(true);
  });

  it("Lisbon in summer: 19:00 local is already closed", () => {
    expect(fitsBusinessHours(slot("2026-07-13T18:00:00Z", "2026-07-13T19:00:00Z"), lisbonSchedule)).toBe(false);
  });

  it("São Paulo (UTC-3): 10:00 local is 13:00 UTC", () => {
    expect(fitsBusinessHours(slot("2026-03-02T13:00:00Z", "2026-03-02T14:00:00Z"), saoPauloSchedule)).toBe(true);
    expect(fitsBusinessHours(slot("2026-03-02T10:00:00Z", "2026-03-02T11:00:00Z"), saoPauloSchedule)).toBe(false);
  });

  it("Lisbon availability in summer starts at 10:00 local", () => {
    const slots = listAvailableSlots({
      date: "2026-07-13",
      service: makeService({ durationMinutes: 60 }),
      staffMemberId: STAFF_ID,
      schedule: lisbonSchedule,
      bookings: [],
    });
    expect(slots[0]).toBe("2026-07-13T09:00:00.000Z");
    expect(slots.at(-1)).toBe("2026-07-13T17:00:00.000Z");
  });
});
