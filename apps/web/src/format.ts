/** "14:30" in the tenant's time zone. */
export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

/** "12/01/2026 14:30" in the tenant's time zone. */
export function formatDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone, dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

/** Today's date ("YYYY-MM-DD") in the tenant's time zone. */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

/** Formats cents in the currency used by the tenant's country. */
export function formatPrice(cents: number, timeZone: string): string {
  const currency = timeZone.startsWith("Europe/") ? "EUR" : "BRL";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

export const STATUS_LABELS = {
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  no_show: "Não compareceu",
} as const;
