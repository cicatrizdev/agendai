import type { Booking, BusinessHours, Service, StaffMember } from "@agendai/shared";
import type { TenantSchedule } from "../src/domain/business-hours";

export const TENANT_ID = "b0000000-0000-0000-0000-000000000002";
export const STAFF_ID = "c0000000-0000-0000-0000-000000000003";
export const OTHER_STAFF_ID = "c0000000-0000-0000-0000-000000000004";

/** Monday to Friday, 10:00–19:00 local time. */
export function weekdayHours(tenantId = TENANT_ID): BusinessHours[] {
  return [1, 2, 3, 4, 5].map((weekday) => ({ tenantId, weekday, opensAt: "10:00", closesAt: "19:00" }));
}

export const lisbonSchedule: TenantSchedule = { timeZone: "Europe/Lisbon", hours: weekdayHours() };
export const saoPauloSchedule: TenantSchedule = { timeZone: "America/Sao_Paulo", hours: weekdayHours() };

export function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: "d0000000-0000-0000-0000-000000000004",
    tenantId: TENANT_ID,
    name: "Corte",
    durationMinutes: 60,
    priceCents: 5000,
    active: true,
    ...overrides,
  };
}

export function makeStaffMember(overrides: Partial<StaffMember> = {}): StaffMember {
  return { id: STAFF_ID, tenantId: TENANT_ID, displayName: "Carla", active: true, ...overrides };
}

let bookingCounter = 0;

export function makeBooking(startsAt: string, endsAt: string, overrides: Partial<Booking> = {}): Booking {
  bookingCounter += 1;
  return {
    id: `f0000000-0000-0000-0000-${String(bookingCounter).padStart(12, "0")}`,
    tenantId: TENANT_ID,
    serviceId: "d0000000-0000-0000-0000-000000000004",
    staffMemberId: STAFF_ID,
    clientId: "e0000000-0000-0000-0000-000000000004",
    startsAt,
    endsAt,
    status: "confirmed",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
