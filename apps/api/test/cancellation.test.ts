import { describe, expect, it } from "vitest";
import { canCancel } from "../src/domain/cancellation";

describe("canCancel", () => {
  const startsAt = new Date("2026-01-12T15:00:00Z");

  it("allows cancelling a day before", () => {
    expect(canCancel(startsAt, new Date("2026-01-11T15:00:00Z"))).toBe(true);
  });

  it("forbids cancelling after the booking started", () => {
    expect(canCancel(startsAt, new Date("2026-01-12T18:00:00Z"))).toBe(false);
  });
});
