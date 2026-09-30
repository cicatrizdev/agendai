import { randomUUID } from "node:crypto";
import type {
  AgendaEntry,
  Booking,
  BusinessHours,
  Client,
  CreateClientInput,
  CreateServiceInput,
  Me,
  Page,
  Service,
  StaffMember,
  Tenant,
} from "@agendai/shared";
import type { TenantSchedule } from "../domain/business-hours";
import { bookingInterval, findConflict } from "../domain/overlap";
import { compareByStartThenId, isAfterCursor, toPage, type Cursor } from "../domain/pagination";
import { BookingConflictError, type AgendaRepository, type NewBooking } from "./agenda-repository";

export interface InMemoryData {
  me: Me | null;
  tenants: Tenant[];
  businessHours: BusinessHours[];
  services: Service[];
  staffMembers: StaffMember[];
  clients: Client[];
  bookings: Booking[];
}

/** Repository backed by plain arrays. Used by tests; it does not emulate RLS. */
export class InMemoryAgendaRepository implements AgendaRepository {
  constructor(readonly data: InMemoryData) {}

  async getMe(): Promise<Me | null> {
    return this.data.me;
  }

  async getSchedule(tenantId: string): Promise<TenantSchedule> {
    const tenant = this.data.tenants.find((t) => t.id === tenantId);
    if (!tenant) throw new Error(`Unknown tenant ${tenantId}`);
    return { timeZone: tenant.timezone, hours: this.data.businessHours.filter((h) => h.tenantId === tenantId) };
  }

  async listServices(tenantId: string): Promise<Service[]> {
    return this.data.services.filter((s) => s.tenantId === tenantId);
  }

  async getService(id: string): Promise<Service | null> {
    return this.data.services.find((s) => s.id === id) ?? null;
  }

  async createService(tenantId: string, input: CreateServiceInput): Promise<Service> {
    const service: Service = { id: randomUUID(), tenantId, active: true, ...input };
    this.data.services.push(service);
    return service;
  }

  async listStaffMembers(tenantId: string): Promise<StaffMember[]> {
    return this.data.staffMembers.filter((s) => s.tenantId === tenantId);
  }

  async getStaffMember(id: string): Promise<StaffMember | null> {
    return this.data.staffMembers.find((s) => s.id === id) ?? null;
  }

  async listClients(tenantId: string): Promise<Client[]> {
    return this.data.clients.filter((c) => c.tenantId === tenantId);
  }

  async createClient(tenantId: string, input: CreateClientInput): Promise<Client> {
    const client: Client = { id: randomUUID(), tenantId, ...input };
    this.data.clients.push(client);
    return client;
  }

  async getBooking(id: string): Promise<Booking | null> {
    return this.data.bookings.find((b) => b.id === id) ?? null;
  }

  async listBookingsPage(tenantId: string, cursor: Cursor | null, limit: number): Promise<Page<Booking>> {
    const rows = this.data.bookings
      .filter((b) => b.tenantId === tenantId && (!cursor || isAfterCursor(b, cursor)))
      .sort(compareByStartThenId)
      .slice(0, limit + 1);
    return toPage(rows, limit);
  }

  async listStaffBookingsBetween(staffMemberId: string, from: Date, to: Date): Promise<Booking[]> {
    return this.data.bookings.filter((b) => {
      const interval = bookingInterval(b);
      return b.staffMemberId === staffMemberId && interval.start < to && interval.end > from;
    });
  }

  async listAgenda(tenantId: string, from: Date, to: Date): Promise<AgendaEntry[]> {
    return this.data.bookings
      .filter((b) => b.tenantId === tenantId && new Date(b.startsAt) >= from && new Date(b.startsAt) < to)
      .sort(compareByStartThenId)
      .map((b) => ({
        ...b,
        clientName: this.data.clients.find((c) => c.id === b.clientId)?.name ?? "",
        serviceName: this.data.services.find((s) => s.id === b.serviceId)?.name ?? "",
      }));
  }

  async createBooking(input: NewBooking): Promise<Booking> {
    // Mirrors the database exclusion constraint.
    if (findConflict({ start: input.startsAt, end: input.endsAt }, input.staffMemberId, this.data.bookings)) {
      throw new BookingConflictError();
    }
    const booking: Booking = {
      id: randomUUID(),
      tenantId: input.tenantId,
      serviceId: input.serviceId,
      staffMemberId: input.staffMemberId,
      clientId: input.clientId,
      startsAt: input.startsAt.toISOString(),
      endsAt: input.endsAt.toISOString(),
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    this.data.bookings.push(booking);
    return booking;
  }

  async cancelBooking(id: string): Promise<Booking> {
    const booking = this.data.bookings.find((b) => b.id === id);
    if (!booking) throw new Error(`Unknown booking ${id}`);
    booking.status = "cancelled";
    return booking;
  }
}
