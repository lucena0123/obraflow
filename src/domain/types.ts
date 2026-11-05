export const AREAS = [
  "Construção civil",
  "Serralheria",
  "Pintura industrial",
  "Obras e melhorias",
] as const;
export type Area = (typeof AREAS)[number];
export type Profile = "coordinator" | "supervisor";
export type ProjectStatus = "planned" | "active" | "paused" | "completed";
export type IssueStatus = "open" | "in-progress" | "resolved";
export type Priority = "critical" | "high" | "medium" | "low";
export interface Person {
  id: string;
  name: string;
  initials: string;
  team: string;
  color: string;
}
export interface HistoryEntry {
  id: string;
  at: string;
  actor: string;
  text: string;
}
export interface Stage {
  id: string;
  name: string;
  start: string;
  end: string;
  ownerId: string;
  progress: number;
  weight: number;
  dependencyId: string | null;
}
export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  area: Area;
  ownerId: string;
  start: string;
  end: string;
  actualStart: string;
  actualEnd: string;
  budget: number;
  status: ProjectStatus;
  stages: Stage[];
  history: HistoryEntry[];
}
export interface JournalEntry {
  id: string;
  projectId: string;
  date: string;
  activity: string;
  workforce: number;
  stageId: string;
  progress: number;
  impediment: string;
  occurrence: string;
  images: { name: string; dataUrl: string }[];
  authorId: string;
  createdAt: string;
}
export interface Issue {
  id: string;
  projectId: string;
  description: string;
  ownerId: string;
  priority: Priority;
  due: string;
  status: IssueStatus;
  resolution: string;
  history: HistoryEntry[];
}
export interface Measurement {
  id: string;
  projectId: string;
  date: string;
  description: string;
  amount: number;
  kind: "committed" | "actual";
  authorId: string;
}
export interface DemoState {
  version: 1;
  revision: string;
  createdAt: string;
  profile: Profile;
  projects: Project[];
  journals: JournalEntry[];
  issues: Issue[];
  measurements: Measurement[];
}
export interface Filters {
  search: string;
  area: string;
  owner: string;
  team: string;
  status: string;
}
export const EMPTY_FILTERS: Filters = {
  search: "",
  area: "",
  owner: "",
  team: "",
  status: "",
};
export const PEOPLE: Person[] = [
  {
    id: "lia",
    name: "Lia Monte Azul",
    initials: "LM",
    team: "Equipe Horizonte",
    color: "teal",
  },
  {
    id: "noa",
    name: "Noa Vale Claro",
    initials: "NV",
    team: "Equipe Estrutural",
    color: "blue",
  },
  {
    id: "rui",
    name: "Rui Serra Nova",
    initials: "RS",
    team: "Equipe Acabamento",
    color: "purple",
  },
  {
    id: "caio",
    name: "Caio Campo Alto",
    initials: "CC",
    team: "Coordenação",
    color: "amber",
  },
];
export const SUPERVISOR_ID = "lia";
export const STATUS_LABELS: Record<ProjectStatus | "delayed", string> = {
  planned: "Planejada",
  active: "Em andamento",
  paused: "Pausada",
  completed: "Concluída",
  delayed: "Atrasada",
};
export const ISSUE_LABELS: Record<IssueStatus, string> = {
  open: "Aberta",
  "in-progress": "Em tratamento",
  resolved: "Resolvida",
};
export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};
