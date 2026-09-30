export const formatUsd = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

export const FAMILY_LABELS: Record<string, string> = {
  build: "Build",
  bug: "Bug",
  upgrade: "Upgrade",
  db: "Banco",
  escalate: "Escalonamento",
  security: "Segurança",
};
