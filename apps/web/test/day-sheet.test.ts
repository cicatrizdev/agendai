import { describe, expect, it } from "vitest";
import { HOUR_PX, blockBox, dayWindow, minutesInZone, weekdayIn } from "../src/day-sheet";

describe("day sheet geometry", () => {
  it("reads the weekday in the tenant's time zone", () => {
    expect(weekdayIn("2026-10-06", "America/Sao_Paulo")).toBe(2);
    expect(weekdayIn("2026-10-10", "America/Sao_Paulo")).toBe(6);
    expect(weekdayIn("2026-10-11", "America/Sao_Paulo")).toBe(0);
  });

  it("reads local minutes from an instant", () => {
    expect(minutesInZone("2026-03-02T13:30:00Z", "America/Sao_Paulo")).toBe(10 * 60 + 30);
  });

  it("keeps opening hours when every entry fits inside them", () => {
    expect(dayWindow({ opensAt: "09:00", closesAt: "18:00" }, [{ start: 10 * 60, end: 11 * 60 }])).toEqual({
      open: 9 * 60,
      close: 18 * 60,
    });
  });

  it("uses the short Saturday window", () => {
    expect(dayWindow({ opensAt: "09:00:00", closesAt: "13:00:00" }, [])).toEqual({ open: 9 * 60, close: 13 * 60 });
  });

  it("extends the window when an entry falls outside opening hours", () => {
    expect(dayWindow({ opensAt: "09:00", closesAt: "18:00" }, [{ start: 8 * 60 + 30, end: 18 * 60 + 20 }])).toEqual({
      open: 8 * 60,
      close: 19 * 60,
    });
  });

  it("has no sheet on a closed day with no entries", () => {
    expect(dayWindow(undefined, [])).toBeNull();
  });

  it("sizes a block by its duration", () => {
    const window = { open: 9 * 60, close: 18 * 60 };
    expect(blockBox(10 * 60, 11 * 60, window)).toEqual({ top: HOUR_PX, height: HOUR_PX });
    expect(blockBox(11 * 60 + 30, 12 * 60, window).height).toBe(HOUR_PX / 2);
  });
});
