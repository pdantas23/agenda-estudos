"use client";

import { useState } from "react";
import { CORES, COR_CLASSES, TIPOS } from "@/lib/mock";
import { CardTipo, CorMateria, StudyCard } from "@/lib/types";

interface Props {
  card: StudyCard;
  onSave: (card: StudyCard) => void;
  onClose: () => void;
}

export default function CardEditModal({ card, onSave, onClose }: Props) {
  const [materia, setMateria] = useState(card.materia);
  const [conteudo, setConteudo] = useState(card.conteudo);
  const [tipo, setTipo] = useState<CardTipo>(card.tipo);
  const [cor, setCor] = useState<CorMateria>(card.cor);

  const podeSalvar = materia.trim() !== "" && conteudo.trim() !== "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!podeSalvar) return;
    onSave({
      ...card,
      materia: materia.trim(),
      conteudo: conteudo.trim(),
      tipo,
      cor,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Editar card</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 transition hover:text-slate-500"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

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

        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Categoria
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as CardTipo)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

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

        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!podeSalvar}
            className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
