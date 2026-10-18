import { describe, expect, it } from "vitest";
import type { Page, Booking } from "@agendai/shared";
import { InMemoryAgendaRepository, type InMemoryData } from "../src/repositories/in-memory";
import { buildServer } from "../src/server";
import { STAFF_ID, TENANT_ID, makeBooking, makeService, makeStaffMember, weekdayHours } from "./fixtures";

const SERVICE_ID = "d0000000-0000-0000-0000-000000000004";
const CLIENT_ID = "e0000000-0000-0000-0000-000000000004";

function setup(role: "owner" | "staff" = "owner", bookings: Booking[] = []) {
  const data: InMemoryData = {
    me: { userId: "a0000000-0000-0000-0000-000000000003", email: "carla@estudio-lisboa.test", role, tenant: { id: TENANT_ID, name: "Estúdio Lisboa", timezone: "Europe/Lisbon" } },
    tenants: [{ id: TENANT_ID, name: "Estúdio Lisboa", timezone: "Europe/Lisbon" }],
    businessHours: weekdayHours(),
    services: [makeService({ id: SERVICE_ID })],
    staffMembers: [makeStaffMember()],
    clients: [{ id: CLIENT_ID, tenantId: TENANT_ID, name: "Rita", phone: null, email: null }],
    bookings,
  };
  const app = buildServer({
    createRepository: (token) => new InMemoryAgendaRepository(token === "valid" ? data : { ...data, me: null }),
    now: () => new Date("2026-01-10T12:00:00Z"),
  });
  const auth = { authorization: "Bearer valid" };
  return { app, data, auth };
}

describe("authentication", () => {
  it("rejects requests without a token", async () => {
    const { app } = setup();
    const response = await app.inject({ method: "GET", url: "/services" });
    expect(response.statusCode).toBe(401);
  });

  it("rejects tokens that don't resolve to a member", async () => {
    const { app } = setup();
    const response = await app.inject({ method: "GET", url: "/services", headers: { authorization: "Bearer nope" } });
    expect(response.statusCode).toBe(401);
  });
});

describe("services", () => {
  it("lets owners create services", async () => {
    const { app, auth } = setup("owner");
    const response = await app.inject({
      method: "POST",
      url: "/services",
      headers: auth,
      payload: { name: "Barba", durationMinutes: 30, priceCents: 3000 },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: "Barba", tenantId: TENANT_ID, active: true });
  });

  it("forbids staff from creating services", async () => {
    const { app, auth } = setup("staff");
    const response = await app.inject({
      method: "POST",
      url: "/services",
      headers: auth,
      payload: { name: "Barba", durationMinutes: 30, priceCents: 3000 },
    });
    expect(response.statusCode).toBe(403);
  });
});

describe("POST /bookings", () => {
  const payload = { serviceId: SERVICE_ID, staffMemberId: STAFF_ID, clientId: CLIENT_ID, startsAt: "2026-01-12T10:00:00.000Z" };

  it("creates a booking that lasts the service duration", async () => {
    const { app, auth } = setup();
    const response = await app.inject({ method: "POST", url: "/bookings", headers: auth, payload });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ startsAt: "2026-01-12T10:00:00.000Z", endsAt: "2026-01-12T11:00:00.000Z", status: "confirmed" });
  });

  it("answers 409 when the slot is taken", async () => {
    const { app, auth } = setup("owner", [makeBooking("2026-01-12T10:30:00Z", "2026-01-12T11:30:00Z")]);
    const response = await app.inject({ method: "POST", url: "/bookings", headers: auth, payload });
    expect(response.statusCode).toBe(409);
    expect(response.json().error).toBe("conflict");
  });

  it("answers 400 with readable messages for an invalid body", async () => {
    const { app, auth } = setup();
    const response = await app.inject({ method: "POST", url: "/bookings", headers: auth, payload: { ...payload, startsAt: "amanhã" } });
    expect(response.statusCode).toBe(400);
    expect(response.json().messages).toEqual([expect.stringContaining("startsAt")]);
  });
});

describe("POST /bookings/:id/cancel", () => {
  it("cancels a booking well in advance", async () => {
    const booking = makeBooking("2026-01-12T10:00:00Z", "2026-01-12T11:00:00Z");
    const { app, auth } = setup("owner", [booking]);
    const response = await app.inject({ method: "POST", url: `/bookings/${booking.id}/cancel`, headers: auth });
    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("cancelled");
  });
});

describe("GET /bookings", () => {
  it("returns the first page and a cursor", async () => {
    const bookings = [
      makeBooking("2026-01-12T10:00:00Z", "2026-01-12T11:00:00Z"),
      makeBooking("2026-01-12T11:00:00Z", "2026-01-12T12:00:00Z"),
      makeBooking("2026-01-12T12:00:00Z", "2026-01-12T13:00:00Z"),
    ];
    const { app, auth } = setup("owner", bookings);
    const response = await app.inject({ method: "GET", url: "/bookings?limit=2", headers: auth });
    const page = response.json<Page<Booking>>();
    expect(page.items.map((b) => b.id)).toEqual([bookings[0]!.id, bookings[1]!.id]);
    expect(page.nextCursor).not.toBeNull();
  });

  it("rejects an invalid cursor", async () => {
    const { app, auth } = setup();
    const response = await app.inject({ method: "GET", url: "/bookings?cursor=garbage", headers: auth });
    expect(response.statusCode).toBe(400);
  });
});

describe("GET /business-hours", () => {
  it("returns the tenant's weekday hours", async () => {
    const { app, auth } = setup();
    const response = await app.inject({ method: "GET", url: "/business-hours", headers: auth });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(weekdayHours());
  });

  it("rejects requests without a token", async () => {
    const { app } = setup();
    const response = await app.inject({ method: "GET", url: "/business-hours" });
    expect(response.statusCode).toBe(401);
  });
});

describe("GET /availability", () => {
  it("lists free slots for the tenant's local date", async () => {
    const { app, auth } = setup();
    const response = await app.inject({
      method: "GET",
      url: `/availability?serviceId=${SERVICE_ID}&staffId=${STAFF_ID}&date=2026-01-12`,
      headers: auth,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().slots[0]).toBe("2026-01-12T10:00:00.000Z");
  });
});
