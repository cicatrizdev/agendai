export type Role = "owner" | "staff";

export type BookingStatus = "confirmed" | "cancelled" | "no_show";

export interface Tenant {
  id: string;
  name: string;
  timezone: string;
}

export interface Membership {
  userId: string;
  tenantId: string;
  role: Role;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  active: boolean;
}

export interface StaffMember {
  id: string;
  tenantId: string;
  displayName: string;
  active: boolean;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
}

/** Opening hours for one weekday, in the tenant's local time ("HH:MM"). */
export interface BusinessHours {
  tenantId: string;
  weekday: number;
  opensAt: string;
  closesAt: string;
}

export interface Booking {
  id: string;
  tenantId: string;
  serviceId: string;
  staffMemberId: string;
  clientId: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface Me {
  userId: string;
  email: string | null;
  tenant: Tenant;
  role: Role;
}

/** A booking enriched with names, as shown in the daily agenda. */
export interface AgendaEntry extends Booking {
  clientName: string;
  serviceName: string;
}
