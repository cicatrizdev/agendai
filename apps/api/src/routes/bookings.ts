import type { FastifyInstance } from "fastify";
import { bookingIdParams, createBookingInput, pageQuery } from "@agendai/shared";
import { z } from "zod";
import { planBooking, planCancellation, type BookingError, type CancellationError } from "../domain/booking";
import { decodeCursor } from "../domain/pagination";
import { zonedTimeToUtc } from "../domain/time";
import { parseOrReply, sendError } from "../http";
import { BookingConflictError } from "../repositories/agenda-repository";

const MINUTES_PER_DAY = 24 * 60;

const BOOKING_ERROR_MESSAGES: Record<BookingError, string> = {
  service_inactive: "Este serviço não está ativo.",
  staff_inactive: "Este profissional não está ativo.",
  in_the_past: "Não é possível marcar no passado.",
  outside_business_hours: "O horário está fora do funcionamento do estabelecimento.",
  conflict: "O profissional já tem uma reserva nesse horário.",
};

const CANCELLATION_ERROR_MESSAGES: Record<CancellationError, string> = {
  not_confirmed: "Só reservas confirmadas podem ser canceladas.",
  too_late: "O cancelamento só é permitido até 2 horas antes do horário.",
};

const agendaQuery = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export async function bookingRoutes(app: FastifyInstance, options: { now: () => Date }) {
  app.get("/bookings", async (request, reply) => {
    const query = parseOrReply(pageQuery, request.query, reply);
    if (!query) return reply;

    let cursor = null;
    if (query.cursor) {
      const decoded = decodeCursor(query.cursor);
      if (!decoded.ok) return sendError(reply, 400, "invalid_cursor", "Cursor de paginação inválido.");
      cursor = decoded.value;
    }
    return request.repo.listBookingsPage(request.me.tenant.id, cursor, query.limit);
  });

  app.get("/agenda", async (request, reply) => {
    const query = parseOrReply(agendaQuery, request.query, reply);
    if (!query) return reply;
    const { timeZone } = await request.repo.getSchedule(request.me.tenant.id);
    const from = zonedTimeToUtc(query.date, 0, timeZone);
    const to = zonedTimeToUtc(query.date, MINUTES_PER_DAY, timeZone);
    return request.repo.listAgenda(request.me.tenant.id, from, to);
  });

  app.post("/bookings", async (request, reply) => {
    const input = parseOrReply(createBookingInput, request.body, reply);
    if (!input) return reply;

    const [service, staffMember] = await Promise.all([
      request.repo.getService(input.serviceId),
      request.repo.getStaffMember(input.staffMemberId),
    ]);
    if (!service || !staffMember) {
      return sendError(reply, 404, "not_found", "Serviço ou profissional não encontrado.");
    }

    const startsAt = new Date(input.startsAt);
    const schedule = await request.repo.getSchedule(request.me.tenant.id);
    const dayAround = { from: new Date(startsAt.getTime() - 86_400_000), to: new Date(startsAt.getTime() + 86_400_000) };
    const existingBookings = await request.repo.listStaffBookingsBetween(staffMember.id, dayAround.from, dayAround.to);

    const plan = planBooking({ startsAt, now: options.now(), service, staffMember, schedule, existingBookings });
    if (!plan.ok) {
      const status = plan.error === "conflict" ? 409 : 422;
      return sendError(reply, status, plan.error, BOOKING_ERROR_MESSAGES[plan.error]);
    }

    try {
      const booking = await request.repo.createBooking({
        tenantId: request.me.tenant.id,
        serviceId: service.id,
        staffMemberId: staffMember.id,
        clientId: input.clientId,
        startsAt: plan.value.start,
        endsAt: plan.value.end,
      });
      return reply.code(201).send(booking);
    } catch (error) {
      if (error instanceof BookingConflictError) {
        return sendError(reply, 409, "conflict", BOOKING_ERROR_MESSAGES.conflict);
      }
      throw error;
    }
  });

  app.post("/bookings/:id/cancel", async (request, reply) => {
    const params = parseOrReply(bookingIdParams, request.params, reply);
    if (!params) return reply;

    const booking = await request.repo.getBooking(params.id);
    if (!booking) return sendError(reply, 404, "not_found", "Reserva não encontrada.");

    const plan = planCancellation(booking, options.now());
    if (!plan.ok) return sendError(reply, 422, plan.error, CANCELLATION_ERROR_MESSAGES[plan.error]);

    return request.repo.cancelBooking(booking.id);
  });
}
