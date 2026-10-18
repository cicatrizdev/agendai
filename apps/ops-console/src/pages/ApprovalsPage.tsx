import { useState } from "react";
import type { Approval, OperatorRole } from "@agendai/shared";
import { Button } from "../components/ui/button";
import { formatDateTime } from "../lib/format";
import { canDecide } from "../lib/metrics";

const RISK_LABELS = { low: "Baixo", medium: "Médio", high: "Alto (exige tech lead)" } as const;

interface ApprovalsPageProps {
  initialApprovals: Approval[];
  operator: { email: string; role: OperatorRole };
}

export function ApprovalsPage({ initialApprovals, operator }: ApprovalsPageProps) {
  const [approvals, setApprovals] = useState(initialApprovals);
  const pending = approvals.filter((a) => a.decision === null);
  const decided = approvals.filter((a) => a.decision !== null);

  function decide(id: string, decision: "approved" | "rejected") {
    setApprovals((current) =>
      current.map((a) =>
        a.id === id ? { ...a, decision, decidedBy: operator.email, decidedAt: new Date().toISOString() } : a,
      ),
    );
  }

  return (
    <section>
      <h1>Aprovações</h1>
      <h2>Pendentes</h2>
      {pending.length === 0 && <p className="muted">Nenhum pedido pendente.</p>}
      <ul className="approvals">
        {pending.map((approval) => {
          const allowed = canDecide(operator.role, approval.riskLevel);
          return (
            <li key={approval.id} className="card">
              <strong>{approval.action}</strong>
              <span>
                Risco: {RISK_LABELS[approval.riskLevel]} · pedido em {formatDateTime(approval.requestedAt)}
              </span>
              <div className="actions">
                <Button type="button" disabled={!allowed} onClick={() => decide(approval.id, "approved")}>
                  ✓ Aprovar
                </Button>
                <Button type="button" variant="outline" disabled={!allowed} onClick={() => decide(approval.id, "rejected")}>
                  ✕ Recusar
                </Button>
              </div>
              {!allowed && <p className="muted">Seu papel não pode decidir ações de risco alto.</p>}
            </li>
          );
        })}
      </ul>
      <h2>Decididas</h2>
      <ul className="approvals">
        {decided.map((approval) => (
          <li key={approval.id} className="card">
            <strong>{approval.action}</strong>
            <span>
              {approval.decision === "approved" ? "✓ Aprovada" : "✕ Recusada"} por {approval.decidedBy}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
