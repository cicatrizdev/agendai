import { describe, expect, it } from "vitest";
import { findConflict, overlaps } from "../src/domain/overlap";
import { OTHER_STAFF_ID, STAFF_ID, makeBooking } from "./fixtures";

const at = (iso: string) => new Date(iso);

describe("overlaps", () => {
  it("detects partially overlapping intervals", () => {
    const a = { start: at("2026-01-12T10:00:00Z"), end: at("2026-01-12T11:00:00Z") };
    const b = { start: at("2026-01-12T10:30:00Z"), end: at("2026-01-12T11:30:00Z") };
    expect(overlaps(a, b)).toBe(true);
    expect(overlaps(b, a)).toBe(true);
  });

  it("detects an interval contained in another", () => {
    const outer = { start: at("2026-01-12T10:00:00Z"), end: at("2026-01-12T12:00:00Z") };
    const inner = { start: at("2026-01-12T10:30:00Z"), end: at("2026-01-12T11:00:00Z") };
    expect(overlaps(outer, inner)).toBe(true);
  });

  it("ignores intervals far apart", () => {
    const a = { start: at("2026-01-12T10:00:00Z"), end: at("2026-01-12T11:00:00Z") };
    const b = { start: at("2026-01-12T14:00:00Z"), end: at("2026-01-12T15:00:00Z") };
    expect(overlaps(a, b)).toBe(false);
  });
});

describe("findConflict", () => {
  const candidate = { start: at("2026-01-12T10:30:00Z"), end: at("2026-01-12T11:30:00Z") };

  it("returns the confirmed booking that overlaps", () => {
    const booking = makeBooking("2026-01-12T10:00:00Z", "2026-01-12T11:00:00Z");
    expect(findConflict(candidate, STAFF_ID, [booking])).toBe(booking);
  });

  it("ignores cancelled bookings", () => {
    const booking = makeBooking("2026-01-12T10:00:00Z", "2026-01-12T11:00:00Z", { status: "cancelled" });
    expect(findConflict(candidate, STAFF_ID, [booking])).toBeUndefined();
  });

  it("ignores bookings of other staff members", () => {
    const booking = makeBooking("2026-01-12T10:00:00Z", "2026-01-12T11:00:00Z", { staffMemberId: OTHER_STAFF_ID });
    expect(findConflict(candidate, STAFF_ID, [booking])).toBeUndefined();
  });
});
