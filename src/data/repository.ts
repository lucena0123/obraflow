import type { DemoState } from "@/domain/types";
import { AREAS, PEOPLE } from "@/domain/types";
import { validateProjectState } from "@/domain/validation";
import { today } from "@/domain/calculations";

export interface Repository {
  load(): DemoState | null;
  save(data: DemoState): void;
  withWriteLock?<T>(operation: () => T): Promise<T>;
}
export const STORAGE_KEY = "obraflow.demo.v1";
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const text = (v: unknown): v is string => typeof v === "string";
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const date = (v: unknown): v is string =>
  text(v) &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(v)) &&
  new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;
const timestamp = (v: unknown) => text(v) && !Number.isNaN(Date.parse(v));
const owner = (v: unknown) => PEOPLE.some((p) => p.id === v);
function history(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.every(
      (h) =>
        isObject(h) &&
        text(h.id) &&
        text(h.actor) &&
        text(h.text) &&
        timestamp(h.at),
    )
  );
}
const uniqueIds = (items: { id: string }[]) =>
  new Set(items.map((i) => i.id)).size === items.length;
export function isDemoState(value: unknown): value is DemoState {
  if (
    !isObject(value) ||
    value.version !== 1 ||
    !text(value.revision) ||
    !value.revision.length ||
    value.revision.length > 80 ||
    !timestamp(value.createdAt) ||
    !["coordinator", "supervisor"].includes(String(value.profile))
  )
    return false;
  if (
    ![value.projects, value.journals, value.issues, value.measurements].every(
      Array.isArray,
    )
  )
    return false;
  if (
    !(value.projects as unknown[]).every(
      (p) =>
        isObject(p) &&
        [p.id, p.code, p.name, p.description, p.unit].every(text) &&
        AREAS.includes(p.area as (typeof AREAS)[number]) &&
        owner(p.ownerId) &&
        date(p.start) &&
        date(p.end) &&
        p.start <= p.end &&
        (p.actualStart === "" || date(p.actualStart)) &&
        (p.actualEnd === "" || date(p.actualEnd)) &&
        finite(p.budget) &&
        p.budget >= 0 &&
        ["active", "paused", "planned", "completed"].includes(
          String(p.status),
        ) &&
        history(p.history) &&
        Array.isArray(p.stages) &&
        p.stages.every(
          (s) =>
            isObject(s) &&
            text(s.id) &&
            text(s.name) &&
            owner(s.ownerId) &&
            date(s.start) &&
            date(s.end) &&
            finite(s.progress) &&
            s.progress >= 0 &&
            s.progress <= 100 &&
            finite(s.weight) &&
            s.weight > 0 &&
            (s.dependencyId === null || text(s.dependencyId)),
        ),
    )
  )
    return false;
  const state = value as unknown as DemoState;
  if (
    !uniqueIds(state.projects) ||
    !uniqueIds(state.projects.flatMap((p) => p.stages))
  )
    return false;
  const hasProject = (id: unknown) => state.projects.some((p) => p.id === id);
  if (
    !state.projects.every((p) =>
      p.stages.every(
        (s) =>
          s.start >= p.start &&
          s.end <= p.end &&
          s.end >= s.start &&
          (!s.dependencyId ||
            p.stages.some((d) => d.id === s.dependencyId && d.id !== s.id)),
      ),
    )
  )
    return false;
  if (
    !(value.journals as unknown[]).every(
      (j) =>
        isObject(j) &&
        text(j.id) &&
        hasProject(j.projectId) &&
        date(j.date) &&
        text(j.activity) &&
        finite(j.workforce) &&
        owner(j.authorId) &&
        timestamp(j.createdAt) &&
        finite(j.progress) &&
        j.progress >= 0 &&
        j.progress <= 100 &&
        text(j.impediment) &&
        text(j.occurrence) &&
        state.projects
          .find((p) => p.id === j.projectId)
          ?.stages.some((s) => s.id === j.stageId) &&
        Array.isArray(j.images) &&
        j.images.every(
          (i) =>
            isObject(i) &&
            text(i.name) &&
            text(i.dataUrl) &&
            /^data:image\/(png|jpeg|webp);base64,/.test(i.dataUrl),
        ),
    )
  )
    return false;
  if (
    !(value.issues as unknown[]).every(
      (i) =>
        isObject(i) &&
        text(i.id) &&
        hasProject(i.projectId) &&
        text(i.description) &&
        owner(i.ownerId) &&
        ["critical", "high", "medium", "low"].includes(String(i.priority)) &&
        date(i.due) &&
        ["open", "in-progress", "resolved"].includes(String(i.status)) &&
        text(i.resolution) &&
        history(i.history),
    )
  )
    return false;
  if (
    !(value.measurements as unknown[]).every(
      (m) =>
        isObject(m) &&
        text(m.id) &&
        hasProject(m.projectId) &&
        date(m.date) &&
        text(m.description) &&
        finite(m.amount) &&
        m.amount > 0 &&
        owner(m.authorId) &&
        ["actual", "committed"].includes(String(m.kind)),
    )
  )
    return false;
  if (
    !uniqueIds(state.journals) ||
    !uniqueIds(state.issues) ||
    !uniqueIds(state.measurements)
  )
    return false;
  if (
    new Set(state.projects.map((p) => p.code.trim().toUpperCase())).size !==
    state.projects.length
  )
    return false;
  try {
    state.projects.forEach((p) =>
      validateProjectState(
        p,
        state.journals.filter((j) => j.projectId === p.id),
      ),
    );
    if (
      state.journals.some(
        (j) =>
          j.date > today() ||
          !Number.isInteger(j.workforce) ||
          j.workforce < 1 ||
          j.workforce > 10000 ||
          j.images.length > 3 ||
          j.images.some((i) => i.dataUrl.length > 750000),
      )
    )
      return false;
    if (
      state.measurements.some(
        (m) =>
          m.date > today() ||
          m.date < state.projects.find((p) => p.id === m.projectId)!.start,
      )
    )
      return false;
    if (
      state.issues.some(
        (i) => i.status === "resolved" && i.resolution.trim().length < 5,
      )
    )
      return false;
  } catch {
    return false;
  }
  return (
    uniqueIds(state.journals) &&
    uniqueIds(state.issues) &&
    uniqueIds(state.measurements)
  );
}
export class LocalRepository implements Repository {
  constructor(
    private storage: () => Pick<Storage, "getItem" | "setItem"> = () =>
      localStorage,
  ) {}
  load() {
    const raw = this.storage().getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    // A base v1 anterior não tinha revisão. Preservamos seus registros válidos.
    if (
      isObject(parsed) &&
      parsed.version === 1 &&
      parsed.revision === undefined
    )
      parsed.revision = "legacy";
    if (
      isObject(parsed) &&
      parsed.version === 1 &&
      Number.isSafeInteger(parsed.revision) &&
      Number(parsed.revision) >= 0
    )
      parsed.revision = `legacy-${parsed.revision}`;
    if (!isDemoState(parsed))
      throw new Error(
        "Os dados locais não puderam ser lidos. Restaure a demonstração para continuar com uma base válida.",
      );
    return parsed;
  }
  save(data: DemoState) {
    if (!isDemoState(data))
      throw new Error(
        "A alteração produziria dados inconsistentes e não foi salva.",
      );
    try {
      this.storage().setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      throw new Error(
        "Não foi possível salvar no navegador. Verifique o espaço disponível ou reduza os anexos. Nenhuma alteração foi aplicada.",
      );
    }
  }
  async withWriteLock<T>(operation: () => T): Promise<T> {
    if (typeof navigator === "undefined" || !navigator.locks)
      throw new Error(
        "Este navegador não oferece proteção de gravação entre abas. Abra a demonstração em um navegador atualizado pelo endereço local.",
      );
    return navigator.locks.request(
      `${STORAGE_KEY}.write`,
      { mode: "exclusive" },
      operation,
    );
  }
}
