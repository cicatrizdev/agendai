import { describe, expect, it } from "vitest";
import { parseTimeOfDay, toZonedParts, zonedTimeToUtc } from "../src/domain/time";

describe("toZonedParts", () => {
  it("converts an instant to São Paulo local time (UTC-3)", () => {
    expect(toZonedParts(new Date("2026-03-02T13:30:00Z"), "America/Sao_Paulo")).toEqual({
      date: "2026-03-02",
      weekday: 1,
      minutes: 10 * 60 + 30,
    });
  });

  it("moves to the previous local day when needed", () => {
    expect(toZonedParts(new Date("2026-03-03T01:00:00Z"), "America/Sao_Paulo").date).toBe("2026-03-02");
  });
});

describe("zonedTimeToUtc", () => {
  it("converts São Paulo local time to UTC", () => {
    expect(zonedTimeToUtc("2026-03-02", 9 * 60, "America/Sao_Paulo").toISOString()).toBe("2026-03-02T12:00:00.000Z");
  });

  it("handles Lisbon in winter (UTC+0) and summer (UTC+1)", () => {
    expect(zonedTimeToUtc("2026-01-12", 10 * 60, "Europe/Lisbon").toISOString()).toBe("2026-01-12T10:00:00.000Z");
    expect(zonedTimeToUtc("2026-07-13", 10 * 60, "Europe/Lisbon").toISOString()).toBe("2026-07-13T09:00:00.000Z");
  });
});

describe("parseTimeOfDay", () => {
  it("accepts HH:MM and HH:MM:SS", () => {
    expect(parseTimeOfDay("09:30")).toBe(570);
    expect(parseTimeOfDay("18:00:00")).toBe(1080);
  });
});
