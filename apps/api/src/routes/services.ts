import type { FastifyInstance } from "fastify";
import { createServiceInput } from "@agendai/shared";
import { parseOrReply, sendError } from "../http";

export async function serviceRoutes(app: FastifyInstance) {
  app.get("/services", async (request) => request.repo.listServices(request.me.tenant.id));

  app.post("/services", async (request, reply) => {
    if (request.me.role !== "owner") {
      return sendError(reply, 403, "forbidden", "Apenas o dono do negócio pode cadastrar serviços.");
    }
    const input = parseOrReply(createServiceInput, request.body, reply);
    if (!input) return reply;
    const service = await request.repo.createService(request.me.tenant.id, input);
    return reply.code(201).send(service);
  });

  app.get("/staff", async (request) => request.repo.listStaffMembers(request.me.tenant.id));

  app.get("/business-hours", async (request) => {
    const schedule = await request.repo.getSchedule(request.me.tenant.id);
    return schedule.hours;
  });
}
