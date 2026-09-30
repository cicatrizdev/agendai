import type { FastifyInstance } from "fastify";
import { availabilityQuery } from "@agendai/shared";
import { listAvailableSlots } from "../domain/availability";
import { zonedTimeToUtc } from "../domain/time";
import { parseOrReply, sendError } from "../http";

const MINUTES_PER_DAY = 24 * 60;

export async function availabilityRoutes(app: FastifyInstance) {
  app.get("/availability", async (request, reply) => {
    const query = parseOrReply(availabilityQuery, request.query, reply);
    if (!query) return reply;

    const [service, staffMember] = await Promise.all([
      request.repo.getService(query.serviceId),
      request.repo.getStaffMember(query.staffId),
    ]);
    if (!service || !staffMember) {
      return sendError(reply, 404, "not_found", "Serviço ou profissional não encontrado.");
    }

    const schedule = await request.repo.getSchedule(request.me.tenant.id);
    const dayStart = zonedTimeToUtc(query.date, 0, schedule.timeZone);
    const dayEnd = zonedTimeToUtc(query.date, MINUTES_PER_DAY, schedule.timeZone);
    const bookings = await request.repo.listStaffBookingsBetween(staffMember.id, dayStart, dayEnd);

    return { slots: listAvailableSlots({ date: query.date, service, staffMemberId: staffMember.id, schedule, bookings }) };
  });
}
