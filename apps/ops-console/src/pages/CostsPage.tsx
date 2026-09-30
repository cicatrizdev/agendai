import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, chartTheme } from "../components/ChartFrame";
import { dailyCosts } from "../data/static";
import { FAMILY_LABELS, formatUsd } from "../lib/format";
import { sumBy } from "../lib/metrics";

export function CostsPage() {
  const byDay = sumBy(dailyCosts, (c) => c.day, (c) => c.costUsd).sort((a, b) => a.key.localeCompare(b.key));
  const byFamily = sumBy(dailyCosts, (c) => FAMILY_LABELS[c.family] ?? c.family, (c) => c.costUsd);
  const byModel = sumBy(dailyCosts, (c) => c.model, (c) => c.costUsd);
  const total = byDay.reduce((sum, d) => sum + d.total, 0);

  return (
    <section>
      <h1>Custos</h1>
      <div className="stat card">
        <span className="muted">Total nos últimos 7 dias</span>
        <strong className="hero">{formatUsd(total)}</strong>
      </div>
      <ChartFrame
        title="Custo por dia"
        chart={
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byDay} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid {...chartTheme.grid} />
              <XAxis dataKey="key" tickFormatter={(d: string) => d.slice(5)} {...chartTheme.axis} />
              <YAxis tickFormatter={(v) => formatUsd(Number(v))} {...chartTheme.axis} width={72} />
              <Tooltip {...chartTheme.tooltip} formatter={(v) => formatUsd(Number(v))} labelFormatter={(d) => String(d)} />
              <Bar name="Custo" dataKey="total" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        }
        table={<TotalsTable rows={byDay} header="Dia" />}
      />
      <div className="grid-2">
        <ChartFrame
          title="Por família"
          chart={<HorizontalBars rows={byFamily} />}
          table={<TotalsTable rows={byFamily} header="Família" />}
        />
        <ChartFrame
          title="Por modelo"
          chart={<HorizontalBars rows={byModel} />}
          table={<TotalsTable rows={byModel} header="Modelo" />}
        />
      </div>
    </section>
  );
}

function HorizontalBars({ rows }: { rows: { key: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={40 + rows.length * 36}>
      <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 64, bottom: 8, left: 8 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="key" {...chartTheme.axis} width={110} />
        <Tooltip {...chartTheme.tooltip} formatter={(v) => formatUsd(Number(v))} />
        <Bar
          name="Custo"
          dataKey="total"
          fill="var(--series-1)"
          radius={[0, 4, 4, 0]}
          barSize={20}
          label={{ position: "right", fill: "var(--text-secondary)", fontSize: 12, formatter: (v: unknown) => formatUsd(Number(v)) }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TotalsTable({ rows, header }: { rows: { key: string; total: number }[]; header: string }) {
  return (
    <table>
      <thead>
        <tr>
          <th>{header}</th>
          <th className="num">Custo</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <td>{r.key}</td>
            <td className="num">{formatUsd(r.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
