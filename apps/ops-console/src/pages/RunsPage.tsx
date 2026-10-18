import { useState } from "react";
import { Link } from "react-router-dom";
import type { Run } from "@agendai/shared";
import { StatusBadge } from "../components/StatusBadge";
import { Select } from "../components/ui/input";
import { FAMILY_LABELS, formatDateTime, formatUsd } from "../lib/format";

const ALL = "";

export function RunsPage({ runs }: { runs: Run[] }) {
  const [family, setFamily] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [mode, setMode] = useState(ALL);

  const visible = runs.filter(
    (run) => (!family || run.family === family) && (!status || run.status === status) && (!mode || run.mode === mode),
  );

  return (
    <section>
      <h1>Execuções</h1>
      <div className="filters">
        <label>
          Família
          <Select className="w-auto min-w-44" value={family} onChange={(e) => setFamily(e.target.value)}>
            <option value={ALL}>Todas</option>
            {Object.entries(FAMILY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Status
          <Select className="w-auto min-w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value={ALL}>Todos</option>
            <option value="succeeded">Sucesso</option>
            <option value="failed">Falha</option>
            <option value="escalated">Escalada</option>
            <option value="running">Em execução</option>
            <option value="awaiting_approval">Aguardando aprovação</option>
          </Select>
        </label>
        <label>
          Modo
          <Select className="w-auto min-w-44" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value={ALL}>Todos</option>
            <option value="local">Local</option>
            <option value="github">GitHub</option>
            <option value="replay">Replay</option>
          </Select>
        </label>
      </div>
      <div className="hscroll">
      <table className="card">
        <thead>
          <tr>
            <th>Tarefa</th>
            <th>Família</th>
            <th>Modo</th>
            <th>Status</th>
            <th>Início</th>
            <th className="num">Iterações</th>
            <th className="num">Custo</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((run) => (
            <tr key={run.id}>
              <td>
                <Link to={`/runs/${run.id}`}>{run.taskId}</Link>
              </td>
              <td>{FAMILY_LABELS[run.family]}</td>
              <td>{run.mode}</td>
              <td>
                <StatusBadge status={run.status} />
              </td>
              <td>{formatDateTime(run.startedAt)}</td>
              <td className="num">{run.outcome?.iterations ?? "—"}</td>
              <td className="num">{run.outcome ? formatUsd(run.outcome.costUsd) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {visible.length === 0 && <p className="muted">Nenhuma execução com esses filtros.</p>}
    </section>
  );
}
