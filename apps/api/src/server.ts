import Fastify, { type FastifyInstance } from "fastify";
import type { Me } from "@agendai/shared";
import type { AgendaRepository } from "./repositories/agenda-repository";
import { availabilityRoutes } from "./routes/availability";
import { bookingRoutes } from "./routes/bookings";
import { clientRoutes } from "./routes/clients";
import { serviceRoutes } from "./routes/services";

declare module "fastify" {
  interface FastifyRequest {
    repo: AgendaRepository;
    me: Me;
  }
}

export interface ServerOptions {
  /** Builds a repository that acts as the user who owns the access token. */
  createRepository: (accessToken: string) => AgendaRepository;
  now?: () => Date;
  logger?: boolean;
}

/** Builds the Agendaí HTTP API. Every route requires a Supabase access token. */
export function buildServer(options: ServerOptions): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });
  const now = options.now ?? (() => new Date());

  app.get("/health", async () => ({ ok: true }));

  app.register(async (authenticated) => {
    authenticated.addHook("preHandler", async (request, reply) => {
      const token = request.headers.authorization?.replace(/^Bearer /, "");
      if (!token) return reply.code(401).send({ error: "unauthorized", message: "Faça login para continuar." });

      const repo = options.createRepository(token);
      const me = await repo.getMe();
      if (!me) return reply.code(401).send({ error: "unauthorized", message: "Sessão inválida ou sem estabelecimento." });

      request.repo = repo;
      request.me = me;
    });

    authenticated.get("/me", async (request) => request.me);
    await authenticated.register(serviceRoutes);
    await authenticated.register(clientRoutes);
    await authenticated.register(availabilityRoutes);
    await authenticated.register(bookingRoutes, { now });
  });

  return app;
}
