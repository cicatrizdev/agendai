import type { FastifyInstance } from "fastify";
import { createClientInput } from "@agendai/shared";
import { parseOrReply } from "../http";

export async function clientRoutes(app: FastifyInstance) {
  app.get("/clients", async (request) => request.repo.listClients(request.me.tenant.id));

  app.post("/clients", async (request, reply) => {
    const input = parseOrReply(createClientInput, request.body, reply);
    if (!input) return reply;
    const client = await request.repo.createClient(request.me.tenant.id, input);
    return reply.code(201).send(client);
  });
}
