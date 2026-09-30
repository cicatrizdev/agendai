import type {
  AgendaEntry,
  Booking,
  Client,
  CreateClientInput,
  CreateServiceInput,
  Me,
  Page,
  Service,
  StaffMember,
} from "@agendai/shared";
import type { TenantSchedule } from "../domain/business-hours";
import type { Cursor } from "../domain/pagination";

export interface NewBooking {
  tenantId: string;
  serviceId: string;
  staffMemberId: string;
  clientId: string;
  startsAt: Date;
  endsAt: Date;
}

/**
 * Data access for one authenticated user. Implementations must run every query
 * with the user's own credentials so Row Level Security always applies.
 */
export interface AgendaRepository {
  getMe(): Promise<Me | null>;
  getSchedule(tenantId: string): Promise<TenantSchedule>;

  listServices(tenantId: string): Promise<Service[]>;
  getService(id: string): Promise<Service | null>;
  createService(tenantId: string, input: CreateServiceInput): Promise<Service>;

  listStaffMembers(tenantId: string): Promise<StaffMember[]>;
  getStaffMember(id: string): Promise<StaffMember | null>;

  listClients(tenantId: string): Promise<Client[]>;
  createClient(tenantId: string, input: CreateClientInput): Promise<Client>;

  getBooking(id: string): Promise<Booking | null>;
  listBookingsPage(tenantId: string, cursor: Cursor | null, limit: number): Promise<Page<Booking>>;
  listStaffBookingsBetween(staffMemberId: string, from: Date, to: Date): Promise<Booking[]>;
  listAgenda(tenantId: string, from: Date, to: Date): Promise<AgendaEntry[]>;
  createBooking(booking: NewBooking): Promise<Booking>;
  cancelBooking(id: string): Promise<Booking>;
}

/** Thrown when the database refuses a booking because of the overlap constraint. */
export class BookingConflictError extends Error {
  constructor() {
    super("Booking overlaps another confirmed booking");
  }
}
