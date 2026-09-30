import { useState, type ReactNode } from "react";

interface ChartFrameProps {
  title: string;
  description?: string;
  chart: ReactNode;
  table: ReactNode;
}

/** A chart card with a "Tabela" toggle, so no information depends on reading the chart. */
export function ChartFrame({ title, description, chart, table }: ChartFrameProps) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className="card chart">
      <header className="chart-header">
        <div>
          <h2>{title}</h2>
          {description && <p className="muted">{description}</p>}
        </div>
        <button type="button" className="ghost" aria-pressed={showTable} onClick={() => setShowTable(!showTable)}>
          {showTable ? "Ver gráfico" : "Ver tabela"}
        </button>
      </header>
      {showTable ? table : chart}
    </section>
  );
}

/** Shared chrome so every Recharts chart uses the same recessive axes and tooltip. */
export const chartTheme = {
  axis: { stroke: "var(--baseline)", tick: { fill: "var(--text-muted)", fontSize: 12 }, tickLine: false },
  grid: { stroke: "var(--grid)", vertical: false },
  tooltip: {
    contentStyle: {
      background: "var(--surface-1)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      color: "var(--text-primary)",
    },
    cursor: { stroke: "var(--baseline)", fill: "var(--hover-wash)" },
  },
};
