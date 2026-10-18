import { useState, type FormEvent } from "react";
import type { Annotation } from "@agendai/shared";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/button";
import { Input, Select, Textarea } from "../components/ui/input";
import { currentOperator, events, runs } from "../data/static";
import { sumBy } from "../lib/metrics";

export function ErrorAnalysisPage({ initialAnnotations }: { initialAnnotations: Annotation[] }) {
  const reviewable = runs.filter((r) => r.status === "failed" || r.status === "succeeded");
  const [selectedRunId, setSelectedRunId] = useState(reviewable[0]?.id ?? "");
  const [annotations, setAnnotations] = useState(initialAnnotations);
  const run = runs.find((r) => r.id === selectedRunId);
  const categories = sumBy(annotations.filter((a) => a.category), (a) => a.category ?? "", () => 1);

  function annotate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const note = String(form.get("note") ?? "").trim();
    if (!note) return;
    const category = String(form.get("category") ?? "").trim() || null;
    setAnnotations((current) => [
      ...current,
      { id: crypto.randomUUID(), runId: selectedRunId, note, category, author: currentOperator.email, createdAt: new Date().toISOString() },
    ]);
    event.currentTarget.reset();
  }

  return (
    <section>
      <h1>Análise de erros</h1>
      <div className="split">
        <div className="card">
          <h2>Leitor de traces</h2>
          <label>
            Execução
            <Select className="w-auto min-w-44" value={selectedRunId} onChange={(e) => setSelectedRunId(e.target.value)}>
              {reviewable.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.taskId} ({r.status === "failed" ? "falha" : "sucesso"})
                </option>
              ))}
            </Select>
          </label>
          {run && (
            <>
              <p>
                <StatusBadge status={run.status} /> {run.outcome?.summary}
              </p>
              <ol className="timeline compact">
                {events
                  .filter((e) => e.runId === run.id)
                  .map((e) => (
                    <li key={e.seq}>
                      <code>{e.type}</code>
                    </li>
                  ))}
              </ol>
            </>
          )}
          <form onSubmit={annotate} className="annotate">
            <label>
              Anotação (open coding)
              <Textarea name="note" rows={3} placeholder="O que deu errado, com suas palavras" />
            </label>
            <label>
              Categoria
              <Input name="category" list="categories" placeholder="ex.: pulou reprodução" />
              <datalist id="categories">
                {categories.map((c) => (
                  <option key={c.key} value={c.key} />
                ))}
              </datalist>
            </label>
            <Button type="submit">Anotar</Button>
          </form>
        </div>
        <div className="card">
          <h2>Categorias</h2>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th className="num">Ocorrências</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.key}>
                  <td>{c.key}</td>
                  <td className="num">{c.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2>Anotações</h2>
          <ul className="notes">
            {annotations.map((a) => (
              <li key={a.id}>
                <strong>{runs.find((r) => r.id === a.runId)?.taskId}</strong>: {a.note}
                {a.category && <span className="muted"> [{a.category}]</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
