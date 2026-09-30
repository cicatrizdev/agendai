import { describe, expect, it } from "vitest";
import { formatPrice, formatTime, todayIn } from "../src/format";

describe("format helpers", () => {
  it("shows times in the tenant's time zone", () => {
    expect(formatTime("2026-03-02T13:30:00Z", "America/Sao_Paulo")).toBe("10:30");
    expect(formatTime("2026-07-13T09:00:00Z", "Europe/Lisbon")).toBe("10:00");
  });

  it("computes today's date in the tenant's time zone", () => {
    expect(todayIn("America/Sao_Paulo", new Date("2026-03-03T01:00:00Z"))).toBe("2026-03-02");
  });

  it("uses euros for Lisbon and reais for São Paulo", () => {
    expect(formatPrice(3500, "Europe/Lisbon")).toContain("€");
    expect(formatPrice(12000, "America/Sao_Paulo")).toContain("R$");
  });
});
