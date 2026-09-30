import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor, isAfterCursor, toPage } from "../src/domain/pagination";

const row = (startsAt: string, id: string) => ({ startsAt, id });

describe("cursor encoding", () => {
  it("round-trips a cursor", () => {
    const cursor = { startsAt: "2026-01-12T10:00:00.000Z", id: "f0000000-0000-0000-0000-000000000001" };
    expect(decodeCursor(encodeCursor(cursor))).toEqual({ ok: true, value: cursor });
  });

  it("rejects garbage", () => {
    expect(decodeCursor("not-a-cursor")).toEqual({ ok: false, error: "invalid_cursor" });
  });
});

describe("isAfterCursor", () => {
  const cursor = { startsAt: "2026-01-12T10:00:00.000Z", id: "b" };

  it("accepts rows that start later", () => {
    expect(isAfterCursor(row("2026-01-12T11:00:00.000Z", "a"), cursor)).toBe(true);
  });

  it("rejects rows that start earlier", () => {
    expect(isAfterCursor(row("2026-01-12T09:00:00.000Z", "z"), cursor)).toBe(false);
  });
});

describe("toPage", () => {
  const rows = [
    row("2026-01-12T10:00:00.000Z", "a"),
    row("2026-01-12T11:00:00.000Z", "b"),
    row("2026-01-12T12:00:00.000Z", "c"),
  ];

  it("returns no cursor when everything fits", () => {
    expect(toPage(rows, 5)).toEqual({ items: rows, nextCursor: null });
  });

  it("returns a cursor pointing at the last item when there are more rows", () => {
    const page = toPage(rows, 2);
    expect(page.items).toEqual(rows.slice(0, 2));
    expect(page.nextCursor).toBe(encodeCursor({ startsAt: "2026-01-12T11:00:00.000Z", id: "b" }));
  });
});
