import type { JournalEntry, Project, Stage } from "./types";
import { PEOPLE } from "./types";
import { today } from "./calculations";

export const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;

export function validateStage(stage: Stage, project: Project) {
  if (
    stage.name.trim().length < 3 ||
    !PEOPLE.some((p) => p.id === stage.ownerId)
  )
    throw new Error("Informe nome e responsável válidos para a etapa.");
  if (!validDate(stage.start) || !validDate(stage.end))
    throw new Error("Informe uma data válida.");
  if (
    stage.end < stage.start ||
    stage.start < project.start ||
    stage.end > project.end
  )
    throw new Error(
      "As datas da etapa devem estar dentro do período previsto da obra.",
    );
  if (
    !Number.isFinite(stage.progress) ||
    stage.progress < 0 ||
    stage.progress > 100
  )
    throw new Error("O avanço deve estar entre 0 e 100%.");
  if (!Number.isFinite(stage.weight) || stage.weight <= 0)
    throw new Error("O peso da etapa deve ser maior que zero.");
  if (stage.dependencyId) {
    const dependency = project.stages.find((s) => s.id === stage.dependencyId);
    if (!dependency) throw new Error("Etapa de dependência não encontrada.");
    const visited = new Set([stage.id]);
    let current: Stage | undefined = dependency;
    while (current) {
      if (visited.has(current.id))
        throw new Error("As dependências não podem formar um ciclo.");
      visited.add(current.id);
      current = project.stages.find((s) => s.id === current?.dependencyId);
    }
    if (stage.start < dependency.end)
      throw new Error(
        "A etapa deve começar após o fim previsto da dependência.",
      );
  }
}

// Mesmas invariantes no cadastro e na leitura da persistência local.
export function validateProjectState(
  project: Project,
  journals: JournalEntry[] = [],
  at = today(),
) {
  if (
    !validDate(project.start) ||
    !validDate(project.end) ||
    project.end < project.start
  )
    throw new Error("Confira o período previsto da obra.");
  if (
    project.actualStart &&
    (!validDate(project.actualStart) || project.actualStart > at)
  )
    throw new Error(
      "O início realizado deve ser uma data válida e não pode estar no futuro.",
    );
  if (["active", "paused"].includes(project.status) && !project.actualStart)
    throw new Error(
      "Informe o início realizado para uma obra em andamento ou pausada.",
    );
  if (
    project.actualEnd &&
    (!validDate(project.actualEnd) ||
      !project.actualStart ||
      project.actualEnd < project.actualStart ||
      project.actualEnd > at)
  )
    throw new Error(
      "Confira as datas realizadas; o término precisa ser posterior ao início e não pode estar no futuro.",
    );
  if (
    project.status === "completed" &&
    (!project.stages.length ||
      project.stages.some((s) => s.progress !== 100) ||
      !project.actualStart ||
      !project.actualEnd)
  )
    throw new Error(
      "Para concluir, finalize todas as etapas e informe as datas realizadas.",
    );
  if (project.status !== "completed" && project.actualEnd)
    throw new Error(
      "A data de término realizado deve ser preenchida apenas para obras concluídas.",
    );
  if (
    project.status === "planned" &&
    (project.stages.some((s) => s.progress > 0) ||
      project.actualStart ||
      journals.length)
  )
    throw new Error(
      "Obras planejadas devem ter todas as etapas em zero, início realizado vazio e nenhum diário de execução.",
    );
  project.stages.forEach((s) => validateStage(s, project));
  for (const journal of journals) {
    if (
      journal.date < project.start ||
      (project.actualStart && journal.date < project.actualStart)
    )
      throw new Error(
        "O início da obra não pode ficar após um diário já registrado.",
      );
    if (project.actualEnd && journal.date > project.actualEnd)
      throw new Error(
        "O término realizado não pode ficar antes de um diário já registrado.",
      );
  }
}
