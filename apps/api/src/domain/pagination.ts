import { err, ok, type Page, type Result } from "@agendai/shared";

/** Position after which the next page starts. Lists are ordered by (startsAt, id). */
export interface Cursor {
  startsAt: string;
  id: string;
}

interface Sortable {
  startsAt: string;
  id: string;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(value: string): Result<Cursor, "invalid_cursor"> {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (isCursor(parsed)) return ok(parsed);
  } catch {
    // Falls through to the error below.
  }
  return err("invalid_cursor");
}

/** True when the row comes strictly after the cursor in (startsAt, id) order. */
export function isAfterCursor(row: Sortable, cursor: Cursor): boolean {
  const rowTime = new Date(row.startsAt).getTime();
  const cursorTime = new Date(cursor.startsAt).getTime();
  return rowTime > cursorTime || (rowTime === cursorTime && row.id > cursor.id);
}

/** PostgREST `or` filter equivalent to `isAfterCursor`. */
export function cursorFilter(cursor: Cursor): string {
  return `starts_at.gt.${cursor.startsAt},and(starts_at.eq.${cursor.startsAt},id.gt.${cursor.id})`;
}

/**
 * Builds a page from rows already filtered by the cursor and sorted by (startsAt, id).
 * Callers fetch `limit + 1` rows so we know whether another page exists.
 */
export function toPage<T extends Sortable>(rows: T[], limit: number): Page<T> {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  const hasMore = rows.length > limit;
  return {
    items,
    nextCursor: hasMore && last ? encodeCursor({ startsAt: last.startsAt, id: last.id }) : null,
  };
}

/** Sorts rows by (startsAt, id), the order used by every paginated list. */
export function compareByStartThenId(a: Sortable, b: Sortable): number {
  const byTime = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
}

function isCursor(value: unknown): value is Cursor {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Cursor).startsAt === "string" &&
    typeof (value as Cursor).id === "string"
  );
}
