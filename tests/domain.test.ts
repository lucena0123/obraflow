import test from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/data/seed";
import { isDemoState, type Repository } from "../src/data/repository";
import { ObraStore } from "../src/data/store";
import {
  EMPTY_FILTERS,
  SUPERVISOR_ID,
  type DemoState,
  type Project,
  type JournalEntry,
} from "../src/domain/types";
import {
  filterProjects,
  finances,
  isDelayed,
  metrics,
  physicalProgress,
  shiftDate,
  today,
  visibleProjects,
} from "../src/domain/calculations";
import {
  assertAccess,
  deleteIssue,
  deleteMeasurement,
  deleteProject,
  deleteStage,
  saveIssue,
  saveJournal,
  saveMeasurement,
  saveProject,
  saveStage,
} from "../src/domain/commands";
const seed = () => createSeed();
function journal(state: DemoState): JournalEntry {
  const p = state.projects[0];
  return {
    id: "qa-journal",
    projectId: p.id,
    stageId: p.stages[2].id,
    date: today(),
    activity: "Atividades demonstrativas de verificação.",
    workforce: 6,
    progress: 80,
    images: [],
    impediment: "",
    occurrence: "",
    authorId: "caio",
    createdAt: new Date().toISOString(),
  };
}
test("base fictícia contém oito obras coerentes nas quatro áreas", () => {
  const s = seed();
  assert.equal(s.projects.length, 8);
  assert.equal(new Set(s.projects.map((p) => p.area)).size, 4);
  assert.equal(isDemoState(s), true);
  assert.ok(
    s.projects.every((p) =>
      p.history.every((h) => h.at.slice(0, 10) <= today()),
    ),
  );
});
test("avanço físico considera pesos e não considera orçamento", () => {
  const s = seed();
  const p = s.projects[0];
  assert.equal(physicalProgress(p), 68);
  p.budget = 1;
  assert.equal(physicalProgress(p), 68);
});
test("atraso considera etapas vencidas mesmo com término global futuro", () => {
  const s = seed();
  assert.equal(isDelayed(s.projects[2]), true);
  assert.equal(isDelayed(s.projects[0]), false);
  assert.equal(isDelayed(s.projects[4]), false);
});
test("data de hoje não é vencida; dias corridos incluem mudança de mês", () => {
  const p = seed().projects[0];
  p.end = today();
  p.stages = p.stages.map((s) => ({ ...s, end: today() }));
  assert.equal(isDelayed(p), false);
  assert.equal(shiftDate("2026-10-31", 1), "2026-11-01");
});
test("métricas e finanças compartilham orçamento e custo", () => {
  const s = seed();
  const f = finances(s);
  const m = metrics(s);
  assert.equal(m.budget, 4320000);
  assert.equal(f.budget, m.budget);
  assert.equal(f.balance, f.budget - f.actual - f.committed);
  assert.notEqual(m.progress, Math.round(f.financialProgress!));
});
test("filtros compostos restringem métricas e portfólio", () => {
  const s = seed();
  const projects = filterProjects(s.projects, {
    ...EMPTY_FILTERS,
    owner: "lia",
    area: "Construção civil",
    team: "Equipe Horizonte",
  });
  assert.equal(projects.length, 1);
  assert.equal(metrics(s, projects).budget, 1280000);
});
test("busca ignora maiúsculas e espaços laterais", () => {
  assert.equal(
    filterProjects(seed().projects, { ...EMPTY_FILTERS, search: "  GALPÃO  " })
      .length,
    1,
  );
});
test("supervisor vê apenas suas obras e respectivos custos", () => {
  const s = seed();
  s.profile = "supervisor";
  const p = visibleProjects(s);
  assert.equal(p.length, 3);
  assert.ok(p.every((p) => p.ownerId === SUPERVISOR_ID));
  assert.equal(
    finances(s).budget,
    p.reduce((n, p) => n + p.budget, 0),
  );
  assert.throws(() => assertAccess(s, "obra-2"), /supervisor/);
});
test("supervisor não pode editar cadastro, excluir obra ou gerir finanças", () => {
  const s = seed();
  s.profile = "supervisor";
  assert.throws(() => saveProject(s, s.projects[0]), /Coordenador/);
  assert.throws(() => deleteProject(s, "obra-1"), /Coordenador/);
  assert.throws(
    () => deleteMeasurement(s, s.measurements[0].id),
    /Coordenador/,
  );
});
test("cadastro impede duplicidade de código", () => {
  const s = seed();
  const p = { ...structuredClone(s.projects[0]), id: "new", code: "ob-002" };
  assert.throws(() => saveProject(s, p), /código/);
});
test("cadastro rejeita datas inválidas, orçamento negativo e etapas fora do período", () => {
  const s = seed();
  const p = structuredClone(s.projects[0]);
  assert.throws(
    () => saveProject(s, { ...p, start: "2026-02-30" }),
    /data válida/,
  );
  assert.throws(() => saveProject(s, { ...p, budget: -1 }), /valor válido/);
  assert.throws(
    () => saveProject(s, { ...p, end: shiftDate(p.end, -10) }),
    /período/,
  );
});
test("conclusão exige todas as etapas, início e término realizados", () => {
  const s = seed();
  const p = structuredClone(s.projects[0]);
  assert.throws(
    () => saveProject(s, { ...p, status: "completed", actualEnd: today() }),
    /finalize/,
  );
  p.stages.forEach((s) => {
    s.progress = 100;
  });
  saveProject(s, { ...p, status: "completed", actualEnd: today() });
  assert.equal(isDelayed(s.projects[0]), false);
});
test("conclusão não aceita avanço apenas arredondado para 100%", () => {
  const s = seed();
  const p = structuredClone(s.projects[0]);
  p.stages.forEach((s) => {
    s.progress = 99.9;
  });
  assert.equal(physicalProgress(p), 100);
  assert.throws(
    () => saveProject(s, { ...p, status: "completed", actualEnd: today() }),
    /finalize/,
  );
});
test("diário atualiza etapa, histórico e indicadores", () => {
  const s = seed();
  const before = metrics(s).progress;
  saveJournal(s, journal(s));
  assert.equal(s.projects[0].stages[2].progress, 80);
  assert.equal(s.journals.length, 5);
  assert.ok(metrics(s).progress > before);
  assert.match(s.projects[0].history.at(-1)!.text, /Diário registrado/);
});
test("diário rejeita regressão, datas futuras e etapa inexistente", () => {
  const s = seed();
  const j = journal(s);
  assert.throws(() => saveJournal(s, { ...j, progress: 10 }), /retroceder/);
  assert.throws(
    () => saveJournal(s, { ...j, date: shiftDate(today(), 1) }),
    /hoje/,
  );
  assert.throws(
    () => saveJournal(s, { ...j, stageId: "missing" }),
    /Selecione uma etapa/,
  );
});
test("diário rejeita retrodatação após registro mais recente", () => {
  const s = seed();
  const j = journal(s);
  saveJournal(s, j);
  assert.throws(
    () => saveJournal(s, { ...j, id: "another", date: shiftDate(today(), -1) }),
    /último registro/,
  );
});
test("diário bloqueia obra de outro supervisor e anexos inválidos", () => {
  const s = seed();
  const j = journal(s);
  assert.throws(
    () =>
      saveJournal(s, {
        ...j,
        images: [
          { name: "script.svg", dataUrl: "data:image/svg+xml;base64,anything" },
        ],
      }),
    /imagens/,
  );
  s.profile = "supervisor";
  assert.throws(
    () => saveJournal(s, { ...j, projectId: "obra-2" }),
    /supervisor/,
  );
});
test("etapas rejeitam dependências cíclicas e datas anteriores à dependência", () => {
  const s = seed();
  const p = s.projects[0];
  assert.throws(
    () => saveStage(s, p.id, { ...p.stages[0], dependencyId: p.stages[3].id }),
    /ciclo/,
  );
  assert.throws(
    () => saveStage(s, p.id, { ...p.stages[1], start: p.start }),
    /dependência/,
  );
});
test("etapas com diário ou dependências não podem ser removidas", () => {
  const s = seed();
  const p = s.projects[0];
  assert.throws(() => deleteStage(s, p.id, p.stages[0].id), /dependências/);
  assert.throws(() => deleteStage(s, p.id, p.stages[2].id), /dependências/);
});
test("etapa independente pode ser criada, editada e excluída", () => {
  const s = seed();
  const p = s.projects[0];
  saveStage(s, p.id, {
    id: "qa-stage",
    name: "Etapa demonstrativa",
    ownerId: "lia",
    start: p.start,
    end: p.end,
    progress: 0,
    weight: 10,
    dependencyId: null,
  });
  assert.equal(p.stages.length, 5);
  saveStage(s, p.id, { ...p.stages[4], progress: 30 });
  assert.equal(p.stages[4].progress, 30);
  deleteStage(s, p.id, "qa-stage");
  assert.equal(p.stages.length, 4);
});
test("resolução de pendência exige relato e mantém histórico", () => {
  const s = seed();
  const issue = structuredClone(s.issues[0]);
  assert.throws(
    () => saveIssue(s, { ...issue, status: "resolved", resolution: "" }),
    /caracteres/,
  );
  saveIssue(s, {
    ...issue,
    status: "resolved",
    resolution: "Frente liberada e equipe orientada.",
  });
  assert.equal(s.issues[0].status, "resolved");
  assert.equal(s.issues[0].history.length, issue.history.length + 1);
  assert.equal(metrics(s).critical, 1);
});
test("pendência pode ser excluída e não pode mudar de vínculo", () => {
  const s = seed();
  assert.throws(
    () => saveIssue(s, { ...s.issues[0], projectId: "obra-1" }),
    /vínculo/,
  );
  const count = s.issues.length;
  deleteIssue(s, s.issues[0].id);
  assert.equal(s.issues.length, count - 1);
});
test("lançamento atualiza custo, preserva físico e permite edição/exclusão", () => {
  const s = seed();
  const p = s.projects[0];
  const physical = physicalProgress(p);
  const actual = finances(s).actual;
  const entry = {
    id: "qa-cost",
    projectId: p.id,
    date: today(),
    amount: 1000,
    description: "Medição de verificação",
    kind: "actual" as const,
    authorId: "caio",
  };
  saveMeasurement(s, entry);
  assert.equal(finances(s).actual, actual + 1000);
  assert.equal(physicalProgress(p), physical);
  saveMeasurement(s, { ...entry, amount: 2000 });
  assert.equal(finances(s).actual, actual + 2000);
  deleteMeasurement(s, entry.id);
  assert.equal(finances(s).actual, actual);
});
test("saldo negativo é visível quando custos excedem o orçamento", () => {
  const s = seed();
  s.projects[0].budget = 100;
  assert.ok(finances(s, s.projects[0].id).balance < 0);
  assert.equal(
    finances(s, s.projects[0].id).overrun,
    -finances(s, s.projects[0].id).balance,
  );
});
test("exclusão de obra remove todos os registros vinculados", () => {
  const s = seed();
  deleteProject(s, "obra-1");
  assert.equal(s.projects.length, 7);
  for (const list of [s.journals, s.issues, s.measurements])
    assert.ok(list.every((i) => i.projectId !== "obra-1"));
  assert.equal(isDemoState(s), true);
});
test("persistência rejeita snapshots corrompidos e referências quebradas", () => {
  assert.equal(isDemoState({ version: 1, projects: [] }), false);
  const s = seed();
  s.issues[0].projectId = "missing";
  assert.equal(isDemoState(s), false);
  const t = seed();
  (t.projects[0] as unknown as { budget: string }).budget = "NaN";
  assert.equal(isDemoState(t), false);
});
class MemoryRepository implements Repository {
  data: DemoState | null = null;
  fail = false;
  load() {
    return this.data;
  }
  save(state: DemoState) {
    if (this.fail) throw new Error("Sem espaço para salvar.");
    this.data = structuredClone(state);
  }
}
test("store confirma apenas alterações persistidas e preserva estado em falha", async () => {
  const repo = new MemoryRepository();
  const store = new ObraStore(repo);
  await store.hydrate();
  const before = structuredClone(store.getSnapshot().data);
  repo.fail = true;
  assert.equal(
    await store.commit((s) => {
      s.projects[0].budget = 1;
    }),
    false,
  );
  assert.deepEqual(store.getSnapshot().data, before);
  assert.equal(store.getSnapshot().notice?.error, true);
});
test("store persiste perfil, recarrega e restaura a demonstração", async () => {
  const repo = new MemoryRepository();
  const store = new ObraStore(repo);
  await store.hydrate();
  await store.setProfile("supervisor");
  const reloaded = new ObraStore(repo);
  await reloaded.hydrate();
  assert.equal(reloaded.getSnapshot().data?.profile, "supervisor");
  await reloaded.reset();
  assert.equal(reloaded.getSnapshot().data?.profile, "coordinator");
  assert.equal(reloaded.getSnapshot().data?.projects.length, 8);
});
test("store bloqueia gravação após erro de leitura até recuperação explícita", async () => {
  const repo = new MemoryRepository();
  repo.load = () => {
    throw new Error("Corrompido");
  };
  const store = new ObraStore(repo);
  await store.hydrate();
  assert.equal(store.getSnapshot().blocked, true);
  assert.equal(
    await store.commit((s) => {
      s.projects = [];
    }),
    false,
  );
  assert.equal(await store.reset(), true);
  assert.equal(store.getSnapshot().blocked, false);
});
test("CRUD de obra nova preserva integridade da base", () => {
  const s = seed();
  const input: Project = {
    ...structuredClone(s.projects[6]),
    id: "qa-new",
    code: "OB-099",
    name: "Obra de verificação",
    stages: [],
    history: [],
  };
  saveProject(s, input);
  assert.equal(s.projects.length, 9);
  saveProject(s, { ...input, name: "Obra de verificação editada" });
  assert.equal(s.projects.at(-1)?.history.length, 2);
  assert.equal(isDemoState(s), true);
  deleteProject(s, input.id);
  assert.equal(s.projects.length, 8);
});
