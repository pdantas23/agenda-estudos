"use client";

import { useState } from "react";
import { CORES, COR_CLASSES } from "@/lib/mock";
import { CardTipo, CorMateria, StudyCard } from "@/lib/types";

interface Props {
  onAdd: (card: StudyCard) => void;
}

export default function AddCardForm({ onAdd }: Props) {
  const [materia, setMateria] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [tipo, setTipo] = useState<CardTipo>("assunto");
  const [cor, setCor] = useState<CorMateria>("sky");

  const podeEnviar = materia.trim() !== "" && conteudo.trim() !== "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEnviar) return;

    onAdd({
      id: `card-${Date.now()}`,
      materia: materia.trim(),
      conteudo: conteudo.trim(),
      tipo,
      cor,
      concluido: false,
    });

    setMateria("");
    setConteudo("");
    setTipo("assunto");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <input
        value={materia}
        onChange={(e) => setMateria(e.target.value)}
        placeholder="Matéria (ex: Matemática)"
        className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      <textarea
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        placeholder="Assunto ou questões da semana"
        rows={2}
        className="resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTipo("assunto")}
          className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
            tipo === "assunto"
              ? "border-indigo-400 bg-indigo-50 text-indigo-700"
              : "border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
        >
          Assunto
        </button>
        <button
          type="button"
          onClick={() => setTipo("questoes")}
          className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
            tipo === "questoes"
              ? "border-indigo-400 bg-indigo-50 text-indigo-700"
              : "border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
        >
          Questões
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Cor:</span>
        <div className="flex flex-wrap gap-1.5">
          {CORES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCor(c)}
              aria-label={`Cor ${c}`}
              className={`h-5 w-5 rounded-full ${COR_CLASSES[c].faixa} transition ${
                cor === c
                  ? "ring-2 ring-slate-800 ring-offset-1"
                  : "opacity-70 hover:opacity-100"
              }`}
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!podeEnviar}
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        + Adicionar card
      </button>
    </form>
  );
}
