import { describe, expect, it } from "vitest";
import { createBookingInput, createClientInput, describeZodError, pageQuery } from "../src";

describe("createBookingInput", () => {
  it("accepts ids from the seed and an ISO datetime with offset", () => {
    const parsed = createBookingInput.safeParse({
      serviceId: "10000000-0000-0000-0000-000000000001",
      staffMemberId: "20000000-0000-0000-0000-000000000001",
      clientId: "30000000-0000-0000-0000-000000000001",
      startsAt: "2026-03-02T13:00:00.000Z",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a malformed id", () => {
    const parsed = createBookingInput.safeParse({
      serviceId: "not-a-uuid",
      staffMemberId: "20000000-0000-0000-0000-000000000001",
      clientId: "30000000-0000-0000-0000-000000000001",
      startsAt: "2026-03-02T13:00:00.000Z",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("createClientInput", () => {
  it("fills optional contact fields with null", () => {
    expect(createClientInput.parse({ name: "Ana" })).toEqual({ name: "Ana", phone: null, email: null });
  });

  it("uses the custom message when the name is missing", () => {
    const parsed = createClientInput.safeParse({});
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(describeZodError(parsed.error)).toEqual(["name: Informe o nome do cliente"]);
    }
  });
});

describe("pageQuery", () => {
  it("coerces the limit from a query string and applies the default", () => {
    expect(pageQuery.parse({ limit: "5" }).limit).toBe(5);
    expect(pageQuery.parse({}).limit).toBe(20);
  });
});
