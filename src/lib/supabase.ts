import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/**
 * Cliente Supabase (lazy). Lança um erro claro se as variáveis de ambiente
 * não estiverem configuradas, em vez de quebrar no import/build.
 */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local.",
    );
  }
  if (!client) {
    // Não usamos o Auth nativo do Supabase (auth é próprio via RPC), então
    // desligamos a persistência de sessão dele.
    client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const supabaseConfigurado = Boolean(url && anonKey);
