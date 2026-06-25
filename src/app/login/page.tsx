"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { session, ready, login } = useAuth();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  // Se já estiver logado, vai direto para a agenda.
  useEffect(() => {
    if (ready && session) router.replace("/");
  }, [ready, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !senha) return;
    setErro(null);
    setCarregando(true);
    try {
      await login(nome, senha);
      router.replace("/");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 p-4">
      <div className="relative w-full max-w-sm">
        {/* Imagem flutuando acima do card (posição absoluta p/ não deslocá-lo) */}
        <Image
          src="/login-logo.png"
          alt="Logo"
          width={93}
          height={200}
          priority
          className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2"
        />
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-800">Agenda de Estudos</h1>
          <p className="mt-1 text-sm text-slate-400">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Nome
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="username"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          {erro && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando || !nome.trim() || !senha}
            className="mt-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {carregando ? "Aguarde..." : "Entrar"}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
