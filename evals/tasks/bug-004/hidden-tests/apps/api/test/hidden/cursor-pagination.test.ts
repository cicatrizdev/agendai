import { describe, expect, it } from "vitest";
import { compareByStartThenId, cursorFilter, decodeCursor, isAfterCursor, toPage, type Cursor } from "../../src/domain/pagination";

const rows = [
  { startsAt: "2026-01-12T10:00:00.000Z", id: "a" },
  { startsAt: "2026-01-12T10:00:00.000Z", id: "b" },
  { startsAt: "2026-01-12T10:00:00.000Z", id: "c" },
  { startsAt: "2026-01-12T11:00:00.000Z", id: "d" },
  { startsAt: "2026-01-12T12:00:00.000Z", id: "e" },
];

function walkAllPages(limit: number): string[] {
  const seen: string[] = [];
  let cursor: Cursor | null = null;
  for (let guard = 0; guard < 20; guard += 1) {
    const current: Cursor | null = cursor;
    const candidates = rows
      .filter((row) => !current || isAfterCursor(row, current))
      .sort(compareByStartThenId)
      .slice(0, limit + 1);
    const page = toPage(candidates, limit);
    seen.push(...page.items.map((item) => item.id));
    if (!page.nextCursor) break;
    const decoded = decodeCursor(page.nextCursor);
    if (!decoded.ok) throw new Error("invalid cursor");
    cursor = decoded.value;
  }
  return seen;
}

describe("cursor pagination", () => {
  it("returns every booking exactly once across pages", () => {
    expect(walkAllPages(2)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("does not repeat the row the cursor points at", () => {
    expect(isAfterCursor({ startsAt: "2026-01-12T10:00:00.000Z", id: "b" }, { startsAt: "2026-01-12T10:00:00.000Z", id: "b" })).toBe(false);
  });

  it("uses a strict comparison on id in the database filter too", () => {
    const filter = cursorFilter({ startsAt: "2026-01-12T10:00:00.000Z", id: "b" });
    expect(filter).toContain("id.gt.b");
    expect(filter).not.toContain("gte");
  });
});
