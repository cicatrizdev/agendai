import type {
  AgendaEntry,
  Booking,
  BusinessHours,
  Client,
  CreateBookingInput,
  CreateClientInput,
  CreateServiceInput,
  Me,
  Page,
  Service,
  StaffMember,
} from "@agendai/shared";
import { getAccessToken } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

/** Error returned by the Agendaí API, with a message ready to show to the user. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = (await response.json().catch(() => null)) as
    | { error?: string; message?: string; messages?: string[] }
    | null;
  if (!response.ok) {
    const message = body?.message ?? body?.messages?.join(" ") ?? "Algo deu errado. Tente novamente.";
    throw new ApiError(response.status, body?.error ?? "unknown", message);
  }
  return body as T;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  me: () => request<Me>("/me"),
  services: () => request<Service[]>("/services"),
  createService: (input: CreateServiceInput) => post<Service>("/services", input),
  staff: () => request<StaffMember[]>("/staff"),
  businessHours: () => request<BusinessHours[]>("/business-hours"),
  clients: () => request<Client[]>("/clients"),
  createClient: (input: CreateClientInput) => post<Client>("/clients", input),
  availability: (serviceId: string, staffId: string, date: string) =>
    request<{ slots: string[] }>(`/availability?${new URLSearchParams({ serviceId, staffId, date })}`),
  agenda: (date: string) => request<AgendaEntry[]>(`/agenda?date=${date}`),
  bookings: (cursor: string | null, limit = 10) =>
    request<Page<Booking>>(`/bookings?${new URLSearchParams({ limit: String(limit), ...(cursor ? { cursor } : {}) })}`),
  createBooking: (input: CreateBookingInput) => post<Booking>("/bookings", input),
  cancelBooking: (id: string) => post<Booking>(`/bookings/${id}/cancel`),
};
