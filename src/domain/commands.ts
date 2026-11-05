import {
  type DemoState,
  type Project,
  type JournalEntry,
  type Issue,
  type Measurement,
  type Stage,
  PEOPLE,
  SUPERVISOR_ID,
  AREAS,
} from "./types";
import { today } from "./calculations";
import { validDate, validateProjectState, validateStage } from "./validation";

export const uid = () => crypto.randomUUID();
const fail = (message: string): never => {
  throw new Error(message);
};
export const assertCoordinator = (state: DemoState) => {
  if (state.profile !== "coordinator")
    fail("Este recurso está disponível para o perfil Coordenador.");
};
export function assertAccess(state: DemoState, id: string) {
  const p =
    state.projects.find((p) => p.id === id) ?? fail("Obra não encontrada.");
  if (state.profile === "supervisor" && p.ownerId !== SUPERVISOR_ID)
    fail("Esta obra não pertence ao supervisor demonstrativo.");
  return p;
}
const requireDate = (value: string) => {
  if (!validDate(value)) fail("Informe uma data válida.");
};
const requireText = (value: string, min = 3) => {
  if (value.trim().length < min)
    fail(`Preencha os textos com pelo menos ${min} caracteres.`);
};
const requireAmount = (n: number) => {
  if (!Number.isFinite(n) || n < 0 || n > 1e12)
    fail("Informe um valor válido, positivo e de até 1 trilhão.");
};
const requirePerson = (id: string) => {
  if (!PEOPLE.some((p) => p.id === id))
    fail("Selecione um responsável válido.");
};
function stamp(state: DemoState, text: string) {
  return {
    id: uid(),
    at: new Date().toISOString(),
    actor:
      state.profile === "coordinator" ? "Caio Campo Alto" : "Lia Monte Azul",
    text,
  };
}
function logProject(state: DemoState, id: string, text: string) {
  const p = assertAccess(state, id);
  p.history.push(stamp(state, text));
}
export function saveProject(state: DemoState, input: Project) {
  assertCoordinator(state);
  requireText(input.code);
  requireText(input.name);
  requireText(input.description);
  requireText(input.unit);
  requirePerson(input.ownerId);
  requireDate(input.start);
  requireDate(input.end);
  requireAmount(input.budget);
  if (
    !AREAS.includes(input.area) ||
    !["active", "planned", "paused", "completed"].includes(input.status)
  )
    fail("Área ou situação inválida.");
  if (input.end < input.start)
    fail("O término previsto deve ser igual ou posterior ao início.");
  if (
    state.projects.some(
      (p) =>
        p.id !== input.id &&
        p.code.toUpperCase() === input.code.trim().toUpperCase(),
    )
  )
    fail("Já existe uma obra com esse código.");
  validateProjectState(
    input,
    state.journals.filter((j) => j.projectId === input.id),
  );
  if (
    state.journals.some(
      (j) => j.projectId === input.id && j.date < input.start,
    ) ||
    state.measurements.some(
      (m) => m.projectId === input.id && m.date < input.start,
    )
  )
    fail(
      "O início previsto não pode ficar após registros de diário ou financeiros já existentes.",
    );
  const index = state.projects.findIndex((p) => p.id === input.id);
  const saved = {
    ...input,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    history: [
      ...(index < 0 ? [] : state.projects[index].history),
      stamp(
        state,
        index < 0 ? "Obra cadastrada." : "Cadastro da obra atualizado.",
      ),
    ],
  };
  if (index < 0) state.projects.push(saved);
  else state.projects[index] = saved;
}
export function deleteProject(state: DemoState, id: string) {
  assertCoordinator(state);
  assertAccess(state, id);
  state.projects = state.projects.filter((p) => p.id !== id);
  state.journals = state.journals.filter((j) => j.projectId !== id);
  state.issues = state.issues.filter((i) => i.projectId !== id);
  state.measurements = state.measurements.filter((m) => m.projectId !== id);
}
export function saveStage(state: DemoState, projectId: string, stage: Stage) {
  const p = assertAccess(state, projectId);
  if (state.profile === "supervisor") {
    const original = p.stages.find((s) => s.id === stage.id);
    if (
      !original ||
      (
        ["name", "start", "end", "ownerId", "weight", "dependencyId"] as const
      ).some((key) => original[key] !== stage[key])
    )
      fail(
        "Somente o Coordenador pode alterar o planejamento e os pesos das etapas. O Supervisor atualiza apenas o avanço.",
      );
  }
  if (p.status === "completed")
    fail("Reabra a obra antes de alterar as etapas.");
  validateStage(stage, p);
  const stages = p.stages.some((s) => s.id === stage.id)
    ? p.stages.map((s) => (s.id === stage.id ? stage : s))
    : [...p.stages, stage];
  const candidate = { ...p, stages };
  stages.forEach((s) => validateStage(s, candidate));
  if (p.status === "planned" && stage.progress > 0)
    fail("Inicie a obra antes de registrar avanço.");
  p.stages = stages;
  logProject(
    state,
    p.id,
    `Etapa «${stage.name}» atualizada para ${stage.progress}%.`,
  );
}
export function deleteStage(state: DemoState, projectId: string, id: string) {
  assertCoordinator(state);
  const p = assertAccess(state, projectId);
  if (p.status === "completed") fail("Reabra a obra antes de excluir etapas.");
  if (
    p.stages.some((s) => s.dependencyId === id) ||
    state.journals.some((j) => j.stageId === id)
  )
    fail(
      "Esta etapa possui dependências ou registros no diário e não pode ser excluída.",
    );
  p.stages = p.stages.filter((s) => s.id !== id);
  logProject(state, p.id, "Etapa excluída.");
}
export function saveJournal(state: DemoState, entry: JournalEntry) {
  const p = assertAccess(state, entry.projectId);
  requireText(entry.activity, 8);
  requireDate(entry.date);
  if (entry.date > today() || entry.date < p.start)
    fail("A data do diário deve estar entre o início previsto da obra e hoje.");
  if (!p.actualStart || entry.date < p.actualStart)
    fail(
      "A data do diário deve ser igual ou posterior ao início realizado da obra.",
    );
  if (!["active", "paused"].includes(p.status))
    fail("Registre atividades em obras em andamento ou pausadas.");
  if (
    !Number.isInteger(entry.workforce) ||
    entry.workforce < 1 ||
    entry.workforce > 10000
  )
    fail("Informe uma equipe entre 1 e 10.000 pessoas.");
  const stage =
    p.stages.find((s) => s.id === entry.stageId) ??
    fail("Selecione uma etapa da obra.");
  if (
    !Number.isFinite(entry.progress) ||
    entry.progress < stage.progress ||
    entry.progress > 100
  )
    fail(
      "O avanço registrado não pode retroceder e deve ser de até 100%. Para corrigir o avanço, edite a etapa.",
    );
  const latest = state.journals
    .filter((j) => j.stageId === stage.id)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (latest && entry.date < latest.date)
    fail("Use uma data igual ou posterior ao último registro desta etapa.");
  if (
    entry.images.length > 3 ||
    entry.images.some(
      (i) =>
        !/^data:image\/(png|jpeg|webp);base64,/.test(i.dataUrl) ||
        i.dataUrl.length > 750000,
    )
  )
    fail("Anexe até três imagens PNG, JPEG ou WebP de até 500 KB cada.");
  entry.authorId = state.profile === "supervisor" ? SUPERVISOR_ID : "caio";
  stage.progress = entry.progress;
  state.journals.push(entry);
  logProject(
    state,
    p.id,
    `Diário registrado: ${stage.name} em ${entry.progress}%.`,
  );
}
export function saveIssue(state: DemoState, issue: Issue) {
  assertAccess(state, issue.projectId);
  requireText(issue.description, 5);
  requireDate(issue.due);
  requirePerson(issue.ownerId);
  if (
    !["critical", "high", "medium", "low"].includes(issue.priority) ||
    !["open", "in-progress", "resolved"].includes(issue.status)
  )
    fail("Prioridade ou status inválido.");
  if (issue.status === "resolved") requireText(issue.resolution, 5);
  const existing = state.issues.find((i) => i.id === issue.id);
  if (existing) {
    assertAccess(state, existing.projectId);
    if (existing.projectId !== issue.projectId)
      fail("O vínculo de uma pendência existente não pode ser alterado.");
  }
  const saved = {
    ...issue,
    resolution: issue.status === "resolved" ? issue.resolution : "",
    history: [
      ...(existing?.history ?? []),
      stamp(
        state,
        `${existing ? "Pendência atualizada" : "Pendência registrada"}: ${issue.status === "resolved" ? `resolvida · ${issue.resolution}` : issue.status === "in-progress" ? "em tratamento" : "aberta"}.`,
      ),
    ],
  };
  state.issues = existing
    ? state.issues.map((i) => (i.id === saved.id ? saved : i))
    : [...state.issues, saved];
  logProject(state, issue.projectId, `Pendência: ${issue.description}.`);
}
export function deleteIssue(state: DemoState, id: string) {
  const issue =
    state.issues.find((i) => i.id === id) ?? fail("Pendência não encontrada.");
  assertAccess(state, issue.projectId);
  state.issues = state.issues.filter((i) => i.id !== id);
  logProject(state, issue.projectId, "Pendência excluída.");
}
export function saveMeasurement(state: DemoState, entry: Measurement) {
  assertCoordinator(state);
  const p = assertAccess(state, entry.projectId);
  requireText(entry.description, 5);
  requireDate(entry.date);
  requireAmount(entry.amount);
  if (entry.amount <= 0 || entry.date > today() || entry.date < p.start)
    fail(
      "Informe um valor maior que zero e uma data entre o início previsto da obra e hoje.",
    );
  if (!["actual", "committed"].includes(entry.kind))
    fail("Selecione o tipo de lançamento.");
  const existing = state.measurements.find((m) => m.id === entry.id);
  if (existing && existing.projectId !== entry.projectId)
    fail("O vínculo do lançamento não pode ser alterado.");
  state.measurements = existing
    ? state.measurements.map((m) => (m.id === entry.id ? entry : m))
    : [...state.measurements, entry];
  logProject(
    state,
    p.id,
    `Lançamento financeiro ${existing ? "atualizado" : "registrado"}: ${entry.description}.`,
  );
}
export function deleteMeasurement(state: DemoState, id: string) {
  assertCoordinator(state);
  const entry =
    state.measurements.find((m) => m.id === id) ??
    fail("Lançamento não encontrado.");
  assertAccess(state, entry.projectId);
  state.measurements = state.measurements.filter((m) => m.id !== id);
  logProject(state, entry.projectId, "Lançamento financeiro excluído.");
}
