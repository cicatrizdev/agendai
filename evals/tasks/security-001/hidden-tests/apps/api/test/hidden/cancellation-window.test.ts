import { describe, expect, it } from "vitest";
import { planCancellation } from "../../src/domain/booking";
import { canCancel } from "../../src/domain/cancellation";
import { makeBooking } from "../fixtures";

describe("cancellation window: up to 2 hours before the start", () => {
  const startsAt = new Date("2026-01-12T15:00:00Z");

  it("refuses 1 hour before", () => {
    expect(canCancel(startsAt, new Date("2026-01-12T14:00:00Z"))).toBe(false);
  });

  it("refuses 1h59 before", () => {
    expect(canCancel(startsAt, new Date("2026-01-12T13:01:00Z"))).toBe(false);
  });

  it("allows exactly 2 hours before", () => {
    expect(canCancel(startsAt, new Date("2026-01-12T13:00:00Z"))).toBe(true);
  });

  it("planCancellation reports too_late 1 hour before", () => {
    const booking = makeBooking("2026-01-12T15:00:00Z", "2026-01-12T16:00:00Z");
    expect(planCancellation(booking, new Date("2026-01-12T14:00:00Z"))).toEqual({ ok: false, error: "too_late" });
  });
});
