import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isOverlapping } from "./is-overlapping";

const at = (hour: number, minute = 0) => new Date(Date.UTC(2026, 0, 12, hour, minute));

describe("isOverlapping", () => {
  it("detects a partial overlap", () => {
    const a = { start: at(10), end: at(11) };
    const b = { start: at(10, 30), end: at(11, 30) };
    assert.equal(isOverlapping(a, b), true);
    assert.equal(isOverlapping(b, a), true);
  });

  it("ignores ranges far apart", () => {
    const a = { start: at(10), end: at(11) };
    const b = { start: at(14), end: at(15) };
    assert.equal(isOverlapping(a, b), false);
  });

  it("uma reserva que termina às 10:00 não conflita com outra que começa às 10:00", () => {
    const morning = { start: at(9), end: at(10) };
    const next = { start: at(10), end: at(11) };
    assert.equal(isOverlapping(morning, next), false);
    assert.equal(isOverlapping(next, morning), false);
  });
});
