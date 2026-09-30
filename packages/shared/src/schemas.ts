import { z } from "zod";

const id = z.string().uuid();

export const createServiceInput = z.object({
  name: z.string({ required_error: "Informe o nome do serviço" }).min(1),
  durationMinutes: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(0),
});
export type CreateServiceInput = z.infer<typeof createServiceInput>;

export const createClientInput = z.object({
  name: z.string({ required_error: "Informe o nome do cliente" }).min(1),
  phone: z.string().min(8).nullable().default(null),
  email: z.string().email().nullable().default(null),
});
export type CreateClientInput = z.infer<typeof createClientInput>;

export const createBookingInput = z.object({
  serviceId: id,
  staffMemberId: id,
  clientId: id,
  startsAt: z.string().datetime({ offset: true }),
});
export type CreateBookingInput = z.infer<typeof createBookingInput>;

export const availabilityQuery = z.object({
  serviceId: id,
  staffId: id,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD"),
});
export type AvailabilityQuery = z.infer<typeof availabilityQuery>;

export const pageQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PageQuery = z.infer<typeof pageQuery>;

export const bookingIdParams = z.object({ id });

/** Turns a ZodError into a flat list of human-readable messages. */
export function describeZodError(error: z.ZodError): string[] {
  return error.errors.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}
