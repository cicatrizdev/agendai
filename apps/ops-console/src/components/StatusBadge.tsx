import type { RunStatus } from "@agendai/shared";
import { Badge } from "./ui/badge";

// Success and failure are told apart by icon + text, never by color alone (blue × orange palette).
const STATUS: Record<RunStatus, { icon: string; label: string; tone: "success" | "failure" | "neutral" }> = {
  succeeded: { icon: "✓", label: "Sucesso", tone: "success" },
  failed: { icon: "✕", label: "Falha", tone: "failure" },
  escalated: { icon: "↑", label: "Escalada", tone: "neutral" },
  running: { icon: "●", label: "Em execução", tone: "neutral" },
  awaiting_approval: { icon: "⏸", label: "Aguardando aprovação", tone: "neutral" },
  cancelled: { icon: "–", label: "Cancelada", tone: "neutral" },
};

export function StatusBadge({ status }: { status: RunStatus }) {
  const { icon, label, tone } = STATUS[status];
  return (
    <Badge tone={tone}>
      <span aria-hidden="true">{icon}</span> {label}
    </Badge>
  );
}

/** Pass/fail marker used by sensors and grades. */
export function PassFail({ passed }: { passed: boolean }) {
  return (
    <Badge tone={passed ? "success" : "failure"}>
      <span aria-hidden="true">{passed ? "✓" : "✕"}</span> {passed ? "Passou" : "Falhou"}
    </Badge>
  );
}
