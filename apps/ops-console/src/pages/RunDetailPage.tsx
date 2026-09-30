import { Link, useParams } from "react-router-dom";
import type { AgentEvent } from "@agendai/shared";
import { PassFail, StatusBadge } from "../components/StatusBadge";
import { diffs, events, runs } from "../data/static";
import { cumulativeCost } from "../lib/metrics";
import { formatUsd } from "../lib/format";

export function RunDetailPage() {
  const { runId } = useParams();
  const run = runs.find((r) => r.id === runId);
  if (!run) return <p>Execução não encontrada.</p>;

  const runEvents = events.filter((e) => e.runId === run.id).sort((a, b) => a.seq - b.seq);
  const costs = cumulativeCost(runEvents);

  return (
    <section>
      <p>
        <Link to="/">← Execuções</Link>
      </p>
      <h1>
        {run.taskId} <StatusBadge status={run.status} />
      </h1>
      {run.outcome && <p>{run.outcome.summary}</p>}
      <div className="split">
        <div className="card">
          <h2>Timeline</h2>
          <ol className="timeline">
            {runEvents.map((event, index) => (
              <li key={event.seq} className={`event ${event.type}`}>
                <span className="seq">#{event.seq}</span>
                <EventLine event={event} />
                <span className="muted cost">{formatUsd(costs[index] ?? 0)}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="card">
          <h2>Diff atual</h2>
          <pre className="diff">{diffs[run.id] ?? "Sem alterações."}</pre>
        </div>
      </div>
    </section>
  );
}

function EventLine({ event }: { event: AgentEvent }) {
  switch (event.type) {
    case "run_started":
      return <span>Início ({event.mode})</span>;
    case "model_called":
      return (
        <span>
          Modelo <code>{event.model}</code>: {event.usage.inputTokens} in / {event.usage.outputTokens} out
          {event.usage.cacheReadInputTokens > 0 && ` (${event.usage.cacheReadInputTokens} do cache)`}
        </span>
      );
    case "tool_called":
      return (
        <span>
          Ferramenta <code>{event.tool}</code>
        </span>
      );
    case "tool_result":
      return (
        <span>
          Resultado de <code>{event.tool}</code>: {event.output}
        </span>
      );
    case "sensor_result":
      return (
        <span>
          Sensor <code>{event.sensor}</code> <PassFail passed={event.passed} /> {event.feedback}
        </span>
      );
    case "breaker_tripped":
      return (
        <span>
          Disjuntor <code>{event.breaker}</code> disparou ({event.value}/{event.limit})
        </span>
      );
    case "approval_requested":
      return <span>Pediu aprovação: {event.action}</span>;
    case "approval_decided":
      return <span>Aprovação: {event.decision === "approved" ? "aprovada" : "recusada"} por {event.decidedBy}</span>;
    case "escalated":
      return <span>Escalou: {event.reason}</span>;
    case "state_saved":
      return <span>Estado salvo: {event.summary}</span>;
    case "run_finished":
      return <span>Fim: {event.summary}</span>;
  }
}
