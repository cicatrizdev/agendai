import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AgendaEntry,
  Booking,
  BookingStatus,
  Client,
  CreateClientInput,
  CreateServiceInput,
  Me,
  Page,
  Role,
  Service,
  StaffMember,
} from "@agendai/shared";
import type { TenantSchedule } from "../domain/business-hours";
import { cursorFilter, toPage, type Cursor } from "../domain/pagination";
import { BookingConflictError, type AgendaRepository, type NewBooking } from "./agenda-repository";

const EXCLUSION_VIOLATION = "23P01";

/** Creates a Supabase client that acts as the user who owns `accessToken` (RLS applies). */
export function createUserClient(url: string, anonKey: string, accessToken: string): SupabaseClient {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type Row = Record<string, unknown>;

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
}

function unwrap(result: QueryResult): unknown {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

const unwrapRow = (result: QueryResult) => unwrap(result) as Row;
const unwrapRows = (result: QueryResult) => unwrap(result) as Row[];
const unwrapMaybeRow = (result: QueryResult) => unwrap(result) as Row | null;

const toIso = (value: unknown) => new Date(String(value)).toISOString();

function toService(row: Row): Service {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    name: String(row.name),
    durationMinutes: Number(row.duration_minutes),
    priceCents: Number(row.price_cents),
    active: Boolean(row.active),
  };
}

function toStaffMember(row: Row): StaffMember {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    displayName: String(row.display_name),
    active: Boolean(row.active),
  };
}

function toClient(row: Row): Client {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    name: String(row.name),
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
  };
}

function toBooking(row: Row): Booking {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceId: String(row.service_id),
    staffMemberId: String(row.staff_member_id),
    clientId: String(row.client_id),
    startsAt: toIso(row.starts_at),
    endsAt: toIso(row.ends_at),
    status: row.status as BookingStatus,
    createdAt: toIso(row.created_at),
  };
}

/** AgendaRepository that talks to Supabase with the user's token. */
export class SupabaseAgendaRepository implements AgendaRepository {
  constructor(
    private readonly db: SupabaseClient,
    private readonly accessToken: string,
  ) {}

  async getMe(): Promise<Me | null> {
    const { data, error } = await this.db.auth.getUser(this.accessToken);
    if (error || !data.user) return null;

    const membership = unwrap(
      await this.db
        .from("memberships")
        .select("role, tenants(id, name, timezone)")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle(),
    ) as { role: Role; tenants: { id: string; name: string; timezone: string } } | null;
    if (!membership) return null;

    return {
      userId: data.user.id,
      email: data.user.email ?? null,
      role: membership.role,
      tenant: membership.tenants,
    };
  }

  async getSchedule(tenantId: string): Promise<TenantSchedule> {
    const tenant = unwrapRow(await this.db.from("tenants").select("timezone").eq("id", tenantId).single());
    const hours = unwrapRows(await this.db.from("business_hours").select("*").eq("tenant_id", tenantId));
    return {
      timeZone: String(tenant.timezone),
      hours: hours.map((h) => ({
        tenantId,
        weekday: Number(h.weekday),
        opensAt: String(h.opens_at),
        closesAt: String(h.closes_at),
      })),
    };
  }

  async listServices(tenantId: string): Promise<Service[]> {
    const rows = unwrapRows(await this.db.from("services").select("*").eq("tenant_id", tenantId).order("name"));
    return rows.map(toService);
  }

  async getService(id: string): Promise<Service | null> {
    const row = unwrapMaybeRow(await this.db.from("services").select("*").eq("id", id).maybeSingle());
    return row ? toService(row) : null;
  }

  async createService(tenantId: string, input: CreateServiceInput): Promise<Service> {
    const row = unwrapRow(
      await this.db
        .from("services")
        .insert({
          tenant_id: tenantId,
          name: input.name,
          duration_minutes: input.durationMinutes,
          price_cents: input.priceCents,
        })
        .select()
        .single(),
    );
    return toService(row);
  }

  async listStaffMembers(tenantId: string): Promise<StaffMember[]> {
    const rows = unwrapRows(await this.db.from("staff_members").select("*").eq("tenant_id", tenantId).order("display_name"));
    return rows.map(toStaffMember);
  }

  async getStaffMember(id: string): Promise<StaffMember | null> {
    const row = unwrapMaybeRow(await this.db.from("staff_members").select("*").eq("id", id).maybeSingle());
    return row ? toStaffMember(row) : null;
  }

  async listClients(tenantId: string): Promise<Client[]> {
    const rows = unwrapRows(await this.db.from("clients").select("*").eq("tenant_id", tenantId).order("name"));
    return rows.map(toClient);
  }

  async createClient(tenantId: string, input: CreateClientInput): Promise<Client> {
    const row = unwrapRow(await this.db.from("clients").insert({ tenant_id: tenantId, ...input }).select().single());
    return toClient(row);
  }

  async getBooking(id: string): Promise<Booking | null> {
    const row = unwrapMaybeRow(await this.db.from("bookings").select("*").eq("id", id).maybeSingle());
    return row ? toBooking(row) : null;
  }

  async listBookingsPage(tenantId: string, cursor: Cursor | null, limit: number): Promise<Page<Booking>> {
    let query = this.db.from("bookings").select("*").eq("tenant_id", tenantId);
    if (cursor) query = query.or(cursorFilter(cursor));
    const rows = unwrapRows(await query.order("starts_at").order("id").limit(limit + 1));
    return toPage(rows.map(toBooking), limit);
  }

  async listStaffBookingsBetween(staffMemberId: string, from: Date, to: Date): Promise<Booking[]> {
    const rows = unwrapRows(
      await this.db
        .from("bookings")
        .select("*")
        .eq("staff_member_id", staffMemberId)
        .lt("starts_at", to.toISOString())
        .gt("ends_at", from.toISOString()),
    );
    return rows.map(toBooking);
  }

  async listAgenda(tenantId: string, from: Date, to: Date): Promise<AgendaEntry[]> {
    const rows = unwrapRows(
      await this.db
        .from("bookings")
        .select("*, clients(name), services(name)")
        .eq("tenant_id", tenantId)
        .gte("starts_at", from.toISOString())
        .lt("starts_at", to.toISOString())
        .order("starts_at")
        .order("id"),
    );
    return rows.map((row) => ({
      ...toBooking(row),
      clientName: (row.clients as { name: string } | null)?.name ?? "",
      serviceName: (row.services as { name: string } | null)?.name ?? "",
    }));
  }

  async createBooking(booking: NewBooking): Promise<Booking> {
    const { data, error } = await this.db
      .from("bookings")
      .insert({
        tenant_id: booking.tenantId,
        service_id: booking.serviceId,
        staff_member_id: booking.staffMemberId,
        client_id: booking.clientId,
        starts_at: booking.startsAt.toISOString(),
        ends_at: booking.endsAt.toISOString(),
      })
      .select()
      .single();
    if (error?.code === EXCLUSION_VIOLATION) throw new BookingConflictError();
    return toBooking(unwrapRow({ data, error }));
  }

  async cancelBooking(id: string): Promise<Booking> {
    const row = unwrapRow(await this.db.from("bookings").update({ status: "cancelled" }).eq("id", id).select().single());
    return toBooking(row);
  }
}
