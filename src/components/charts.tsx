"use client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type DemoState, type Project, AREAS } from "@/domain/types";
import { DEMO } from "@/domain/demo";
import {
  dateLabel,
  daysBetween,
  finances,
  shiftDate,
  today,
} from "@/domain/calculations";
const tooltip = {
  background: "var(--branco)",
  border: "1px solid var(--azul-nevoa)",
  borderRadius: 12,
  color: "var(--grafite)",
  fontSize: 14,
};
const axis = { fontSize: 13, fill: "var(--cinza-texto)" };
export function BudgetChart({
  data,
  projects,
}: {
  data: DemoState;
  projects: Project[];
}) {
  const names = DEMO.chartLabels;
  const chart = AREAS.map((area, i) => {
    const scoped = {
      ...data,
      projects: projects.filter((p) => p.area === area),
    };
    const f = finances(scoped);
    return {
      name: names[i],
      Orçado: f.budget / 1000,
      Realizado: f.actual / 1000,
    };
  });
  return (
    <div
      className="chart-container"
      role="img"
      aria-label="Gráfico comparativo de orçamento e custos realizados por área, em milhares de reais"
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 600, height: 250 }}
      >
        <BarChart
          data={chart}
          barGap={5}
          margin={{ left: -12, top: 20, right: 6, bottom: 0 }}
        >
          <CartesianGrid
            stroke="var(--azul-nevoa)"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={axis}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={axis}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}k`}
          />
          <Tooltip
            cursor={{ fill: "var(--fundo-claro)" }}
            contentStyle={tooltip}
            formatter={(v) => [
              `R$ ${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`,
            ]}
          />
          <Bar
            dataKey="Orçado"
            isAnimationActive={false}
            fill="var(--azul-nevoa)"
            stroke="var(--azul-medio)"
            radius={[4, 4, 0, 0]}
            maxBarSize={35}
          />
          <Bar
            dataKey="Realizado"
            isAnimationActive={false}
            fill="var(--azul-rlm)"
            radius={[4, 4, 0, 0]}
            maxBarSize={35}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function CostChart({
  data,
  projects,
}: {
  data: DemoState;
  projects: Project[];
}) {
  const ids = new Set(projects.map((p) => p.id));
  const entries = data.measurements.filter(
    (m) => ids.has(m.projectId) && m.kind === "actual",
  );
  const end = today();
  const start = entries.reduce(
    (s, m) => (m.date < s ? m.date : s),
    shiftDate(end, -28),
  );
  const duration = daysBetween(start, end);
  const chart = Array.from({ length: 9 }, (_, i) => {
    const d = shiftDate(start, Math.ceil((duration * i) / 8));
    return {
      name: dateLabel(d),
      Realizado: entries
        .filter((m) => m.date <= d)
        .reduce((n, m) => n + m.amount, 0),
    };
  });
  return (
    <div className="chart-container">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 700, height: 250 }}
      >
        <AreaChart
          data={chart}
          margin={{ left: 5, top: 15, right: 12, bottom: 4 }}
        >
          <defs>
            <linearGradient id="cost-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--azul-rlm)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--azul-rlm)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--azul-nevoa)"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis
            tick={axis}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            contentStyle={tooltip}
            formatter={(v) => [
              `R$ ${Number(v).toLocaleString("pt-BR")}`,
              "Custo acumulado",
            ]}
          />
          <Area
            type="monotone"
            isAnimationActive={false}
            dataKey="Realizado"
            stroke="var(--azul-rlm)"
            strokeWidth={2.5}
            fill="url(#cost-fill)"
          />
          <Legend />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
