import { loadConfig } from "./config";
import { SupabaseAgendaRepository, createUserClient } from "./repositories/supabase";
import { buildServer } from "./server";

const config = loadConfig();

const app = buildServer({
  logger: true,
  createRepository: (token) =>
    new SupabaseAgendaRepository(createUserClient(config.supabaseUrl, config.supabaseAnonKey, token), token),
});

await app.listen({ port: config.port, host: "0.0.0.0" });
