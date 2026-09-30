import type { Booking, Me } from "@agendai/shared";

export const ownerMe: Me = {
  userId: "a0000000-0000-0000-0000-000000000001",
  email: "ana@belavista.test",
  role: "owner",
  tenant: { id: "b0000000-0000-0000-0000-000000000001", name: "Salão Bela Vista", timezone: "America/Sao_Paulo" },
};

export function booking(n: number, startsAt: string): Booking {
  return {
    id: `f0000000-0000-0000-0000-${String(n).padStart(12, "0")}`,
    tenantId: ownerMe.tenant.id,
    serviceId: "d0000000-0000-0000-0000-000000000001",
    staffMemberId: "c0000000-0000-0000-0000-000000000001",
    clientId: "e0000000-0000-0000-0000-000000000001",
    startsAt,
    endsAt: startsAt,
    status: "confirmed",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}
