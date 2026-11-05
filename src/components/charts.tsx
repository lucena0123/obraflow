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
import {
  dateLabel,
  daysBetween,
  finances,
  shiftDate,
  today,
} from "@/domain/calculations";
const tooltip = {
  background: "#1b2634",
  border: "1px solid #364355",
  borderRadius: 10,
  color: "#e8eef4",
  fontSize: 12,
};
const axis = { fontSize: 11, fill: "#8491a5" };
export function BudgetChart({
  data,
  projects,
}: {
  data: DemoState;
  projects: Project[];
}) {
  const names = ["Civil", "Serralheria", "Pintura", "Melhorias"];
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
            stroke="#293444"
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
            cursor={{ fill: "#ffffff04" }}
            contentStyle={tooltip}
            formatter={(v) => [
              `R$ ${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`,
            ]}
          />
          <Bar
            dataKey="Orçado"
            isAnimationActive={false}
            fill="#b4ddc6"
            radius={[4, 4, 0, 0]}
            maxBarSize={35}
          />
          <Bar
            dataKey="Realizado"
            isAnimationActive={false}
            fill="#658bda"
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
              <stop offset="0%" stopColor="#8ed7bc" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#8ed7bc" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#293444"
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
            stroke="#b4ddc6"
            strokeWidth={2.5}
            fill="url(#cost-fill)"
          />
          <Legend />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
