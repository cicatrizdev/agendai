export interface ApiConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  port: number;
}

/** Reads the API configuration from the environment. The service key is never needed here. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set (see .env.example)");
  }
  return { supabaseUrl, supabaseAnonKey, port: Number(env.API_PORT ?? 3333) };
}
