import {
  type DemoState,
  type Filters,
  type Project,
  type Stage,
  PEOPLE,
  SUPERVISOR_ID,
} from "./types";

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string) {
  return Math.round(
    (Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000,
  );
}
export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
export const compactMoney = (value: number) =>
  value >= 1e6
    ? `R$ ${(value / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi`
    : money(value);
export const dateLabel = (date: string, year = false) =>
  date
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        ...(year ? { year: "numeric" } : {}),
      })
        .format(new Date(date.includes("T") ? date : `${date}T12:00:00`))
        .replaceAll(".", "")
    : "—";
export const person = (id: string) =>
  PEOPLE.find((p) => p.id === id) ?? PEOPLE[0];
export function physicalProgress(project: Project) {
  const total = project.stages.reduce((n, s) => n + s.weight, 0);
  return total
    ? Math.round(
        project.stages.reduce((n, s) => n + s.progress * s.weight, 0) / total,
      )
    : 0;
}
export function stageDelayed(stage: Stage, at = today()) {
  return stage.end < at && stage.progress < 100;
}
export function isDelayed(project: Project, at = today()) {
  return (
    project.status !== "completed" &&
    ((project.end < at && physicalProgress(project) < 100) ||
      project.stages.some((s) => stageDelayed(s, at)))
  );
}
export const projectStatus = (project: Project, at = today()) =>
  isDelayed(project, at) ? "delayed" : project.status;
export function visibleProjects(state: DemoState) {
  return state.profile === "coordinator"
    ? state.projects
    : state.projects.filter((p) => p.ownerId === SUPERVISOR_ID);
}
export function filterProjects(
  projects: Project[],
  filters: Filters,
  at = today(),
) {
  const query = filters.search.trim().toLocaleLowerCase("pt-BR");
  return projects.filter(
    (p) =>
      (!query ||
        `${p.code} ${p.name} ${p.description}`
          .toLocaleLowerCase("pt-BR")
          .includes(query)) &&
      (!filters.area || p.area === filters.area) &&
      (!filters.owner || p.ownerId === filters.owner) &&
      (!filters.team || person(p.ownerId).team === filters.team) &&
      (!filters.status ||
        (filters.status === "delayed"
          ? isDelayed(p, at)
          : p.status === filters.status)),
  );
}
export function finances(state: DemoState, projectId?: string) {
  const projects = visibleProjects(state).filter(
    (p) => !projectId || p.id === projectId,
  );
  const ids = new Set(projects.map((p) => p.id));
  const entries = state.measurements.filter((m) => ids.has(m.projectId));
  const budget = projects.reduce((n, p) => n + p.budget, 0);
  const actual = entries
    .filter((m) => m.kind === "actual")
    .reduce((n, m) => n + m.amount, 0);
  const committed = entries
    .filter((m) => m.kind === "committed")
    .reduce((n, m) => n + m.amount, 0);
  return {
    budget,
    actual,
    committed,
    balance: budget - actual - committed,
    overrun: Math.max(0, actual + committed - budget),
    financialProgress: budget > 0 ? (actual / budget) * 100 : null,
  };
}
export function metrics(
  state: DemoState,
  projects = visibleProjects(state),
  at = today(),
) {
  const ids = new Set(projects.map((p) => p.id));
  const scoped = { ...state, projects };
  return {
    total: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    delayed: projects.filter((p) => isDelayed(p, at)).length,
    completed: projects.filter((p) => p.status === "completed").length,
    progress: projects.length
      ? Math.round(
          projects.reduce((n, p) => n + physicalProgress(p), 0) /
            projects.length,
        )
      : 0,
    critical: state.issues.filter(
      (i) =>
        ids.has(i.projectId) &&
        i.priority === "critical" &&
        i.status !== "resolved",
    ).length,
    ...finances(scoped),
  };
}
