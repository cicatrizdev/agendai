import { describe, expect, it } from "vitest";
import { fitsBusinessHours } from "../src/domain/business-hours";
import { lisbonSchedule } from "./fixtures";

const slot = (start: string, end: string) => ({ start: new Date(start), end: new Date(end) });

describe("fitsBusinessHours (Lisbon, 10:00–19:00 on weekdays)", () => {
  it("accepts a slot inside opening hours", () => {
    expect(fitsBusinessHours(slot("2026-01-12T10:00:00Z", "2026-01-12T11:00:00Z"), lisbonSchedule)).toBe(true);
  });

  it("accepts a slot that ends exactly at closing time", () => {
    expect(fitsBusinessHours(slot("2026-01-12T18:00:00Z", "2026-01-12T19:00:00Z"), lisbonSchedule)).toBe(true);
  });

  it("rejects a slot that starts before opening", () => {
    expect(fitsBusinessHours(slot("2026-01-12T09:30:00Z", "2026-01-12T10:30:00Z"), lisbonSchedule)).toBe(false);
  });

  it("rejects a slot that goes past closing time", () => {
    expect(fitsBusinessHours(slot("2026-01-12T18:30:00Z", "2026-01-12T19:30:00Z"), lisbonSchedule)).toBe(false);
  });

  it("rejects any slot on a day the business is closed", () => {
    expect(fitsBusinessHours(slot("2026-01-11T12:00:00Z", "2026-01-11T13:00:00Z"), lisbonSchedule)).toBe(false);
  });
});

describe("fitsBusinessHours uses the tenant time zone (Lisbon summer, UTC+1)", () => {
  it("accepts a slot that starts at 10:00 local (09:00 UTC)", () => {
    expect(fitsBusinessHours(slot("2026-07-13T09:00:00Z", "2026-07-13T10:00:00Z"), lisbonSchedule)).toBe(true);
  });

  it("rejects a slot that starts at 19:00 local (18:00 UTC), already closed", () => {
    expect(fitsBusinessHours(slot("2026-07-13T18:00:00Z", "2026-07-13T19:00:00Z"), lisbonSchedule)).toBe(false);
  });
});
