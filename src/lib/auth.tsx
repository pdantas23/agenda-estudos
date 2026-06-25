"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getSupabase } from "./supabase";

export interface Session {
  userId: string;
  nome: string;
  token: string;
}

interface AuthContextValue {
  session: Session | null;
  /** false até lermos o localStorage (evita flicker/redirect indevido). */
  ready: boolean;
  login: (nome: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = "agenda-session";

const AuthContext = createContext<AuthContextValue | null>(null);

// As RPCs retornam linhas { user_id, nome, token }.
interface AuthRow {
  user_id: string;
  nome: string;
  token: string;
}

function toSession(row: AuthRow): Session {
  return { userId: row.user_id, nome: row.nome, token: row.token };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  // Restaura a sessão do localStorage após o mount (client-only).
  useEffect(() => {
    let restored: Session | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) restored = JSON.parse(raw) as Session;
    } catch {
      // ignora JSON inválido
    }
    /* eslint-disable react-hooks/set-state-in-effect -- restaura sessão do localStorage (client-only) */
    setSession(restored);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const persist = useCallback((s: Session | null) => {
    setSession(s);
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(
    async (nome: string, senha: string) => {
      const { data, error } = await getSupabase().rpc("login_agenda", {
        p_nome: nome,
        p_senha: senha,
      });
      if (error) throw new Error(error.message);
      const row = (data as AuthRow[] | null)?.[0];
      if (!row) throw new Error("Resposta inesperada do servidor");
      persist(toSession(row));
    },
    [persist],
  );

  const logout = useCallback(async () => {
    const token = session?.token;
    persist(null);
    if (token) {
      try {
        await getSupabase().rpc("logout_agenda", { p_token: token });
      } catch {
        // sessão já será descartada localmente de qualquer forma
      }
    }
  }, [session, persist]);

  return (
    <AuthContext.Provider value={{ session, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
