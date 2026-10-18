import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, chartTheme } from "../components/ChartFrame";
import { Select } from "../components/ui/input";
import { evalRuns, trials } from "../data/static";
import { summarizeEvalRun, type EvalRunSummary } from "../lib/metrics";
import { formatPercent, formatUsd } from "../lib/format";

export function ScoreboardPage() {
  const summaries = evalRuns.map((run) => summarizeEvalRun(run, trials));
  const [left, setLeft] = useState(summaries[0]?.evalRunId ?? "");
  const [right, setRight] = useState(summaries.at(-1)?.evalRunId ?? "");
  const a = summaries.find((s) => s.evalRunId === left);
  const b = summaries.find((s) => s.evalRunId === right);

  return (
    <section>
      <h1>Placar</h1>
      <div className="grid-2">
        <ChartFrame
          title="Taxa de sucesso e pass^k"
          description="Suíte capability, 3 trials por tarefa"
          chart={
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={summaries} margin={{ top: 16, right: 56, bottom: 8, left: 0 }}>
                <CartesianGrid {...chartTheme.grid} />
                <XAxis dataKey="label" {...chartTheme.axis} />
                <YAxis domain={[0, 1]} tickFormatter={formatPercent} {...chartTheme.axis} width={48} />
                <Tooltip {...chartTheme.tooltip} formatter={(value) => formatPercent(Number(value))} />
                <Line name="Taxa de sucesso" dataKey="successRate" stroke="var(--series-1)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} label={<EndLabel text="sucesso" count={summaries.length} />} />
                <Line name="pass^k" dataKey="passHatK" stroke="var(--series-2)" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 4 }} activeDot={{ r: 6 }} label={<EndLabel text="pass^k" count={summaries.length} />} />
              </LineChart>
            </ResponsiveContainer>
          }
          table={<SummaryTable summaries={summaries} />}
        />
        <ChartFrame
          title="Custo por tarefa resolvida"
          chart={
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={summaries} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid {...chartTheme.grid} />
                <XAxis dataKey="label" {...chartTheme.axis} />
                <YAxis tickFormatter={(v) => formatUsd(Number(v))} {...chartTheme.axis} width={72} />
                <Tooltip {...chartTheme.tooltip} formatter={(value) => formatUsd(Number(value))} />
                <Line name="Custo por resolvida" dataKey="costPerSolvedTask" stroke="var(--series-1)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          }
          table={<SummaryTable summaries={summaries} />}
        />
      </div>
      <div className="legend" aria-label="Legenda">
        <span><i className="swatch series-1" /> Taxa de sucesso</span>
        <span><i className="swatch series-2 dashed" /> pass^k</span>
      </div>

      <section className="card">
        <h2>Comparar execuções da suíte</h2>
        <div className="filters">
          <RunSelect label="Antes" value={left} onChange={setLeft} summaries={summaries} />
          <RunSelect label="Depois" value={right} onChange={setRight} summaries={summaries} />
        </div>
        {a && b && (
          <table>
            <thead>
              <tr>
                <th>Métrica</th>
                <th className="num">{a.label}</th>
                <th className="num">{b.label}</th>
                <th className="num">Diferença</th>
              </tr>
            </thead>
            <tbody>
              <CompareRow name="Taxa de sucesso" a={a.successRate} b={b.successRate} format={formatPercent} higherIsBetter />
              <CompareRow name="pass^k" a={a.passHatK} b={b.passHatK} format={formatPercent} higherIsBetter />
              <CompareRow name="Custo por resolvida" a={a.costPerSolvedTask ?? 0} b={b.costPerSolvedTask ?? 0} format={formatUsd} higherIsBetter={false} />
              <CompareRow name="Iterações médias" a={a.averageIterations} b={b.averageIterations} format={(v) => v.toFixed(1)} higherIsBetter={false} />
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}

function EndLabel(props: { x?: number; y?: number; index?: number; text: string; count: number }) {
  if (props.index !== props.count - 1) return null;
  return (
    <text x={(props.x ?? 0) + 8} y={(props.y ?? 0) + 4} fill="var(--text-secondary)" fontSize={12}>
      {props.text}
    </text>
  );
}

function SummaryTable({ summaries }: { summaries: EvalRunSummary[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Tag</th>
          <th className="num">Sucesso</th>
          <th className="num">pass^k</th>
          <th className="num">Custo/resolvida</th>
          <th className="num">Iterações</th>
        </tr>
      </thead>
      <tbody>
        {summaries.map((s) => (
          <tr key={s.evalRunId}>
            <td>{s.label}</td>
            <td className="num">{formatPercent(s.successRate)}</td>
            <td className="num">{formatPercent(s.passHatK)}</td>
            <td className="num">{s.costPerSolvedTask === null ? "—" : formatUsd(s.costPerSolvedTask)}</td>
            <td className="num">{s.averageIterations.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RunSelect(props: { label: string; value: string; onChange: (v: string) => void; summaries: EvalRunSummary[] }) {
  return (
    <label>
      {props.label}
      <Select className="w-auto min-w-44" value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.summaries.map((s) => (
          <option key={s.evalRunId} value={s.evalRunId}>
            {s.label}
          </option>
        ))}
      </Select>
    </label>
  );
}

function CompareRow(props: { name: string; a: number; b: number; format: (v: number) => string; higherIsBetter: boolean }) {
  const delta = props.b - props.a;
  const better = delta === 0 ? null : delta > 0 === props.higherIsBetter;
  return (
    <tr>
      <td>{props.name}</td>
      <td className="num">{props.format(props.a)}</td>
      <td className="num">{props.format(props.b)}</td>
      <td className="num">
        {better === null ? "=" : `${better ? "✓ melhor" : "✕ pior"} (${delta > 0 ? "+" : "−"}${props.format(Math.abs(delta))})`}
      </td>
    </tr>
  );
}
