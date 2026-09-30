import type { FastifyReply } from "fastify";
import { describeZodError } from "@agendai/shared";
import type { z } from "zod";

/** Validates `data` with `schema`; on failure sends a 400 and returns null. */
export function parseOrReply<T extends z.ZodTypeAny>(schema: T, data: unknown, reply: FastifyReply): z.infer<T> | null {
  const parsed = schema.safeParse(data);
  if (parsed.success) return parsed.data;
  void reply.code(400).send({ error: "invalid_request", messages: describeZodError(parsed.error) });
  return null;
}

/** Sends a domain error with a message in Portuguese for the UI. */
export function sendError(reply: FastifyReply, status: number, error: string, message: string) {
  return reply.code(status).send({ error, message });
}
