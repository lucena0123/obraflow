import test from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/data/seed";
import {
  isDemoState,
  LocalRepository,
  type Repository,
} from "../src/data/repository";
import { ObraStore } from "../src/data/store";
import {
  finances,
  physicalProgress,
  shiftDate,
  today,
} from "../src/domain/calculations";
import { saveJournal, saveProject, saveStage } from "../src/domain/commands";
import type { DemoState } from "../src/domain/types";

class MemoryRepository implements Repository {
  data = createSeed();
  fail = false;
  private pending: Promise<unknown> = Promise.resolve();
  load() {
    return structuredClone(this.data);
  }
  save(data: DemoState) {
    if (this.fail) throw new Error("Sem espaço.");
    this.data = structuredClone(data);
  }
  withWriteLock<T>(operation: () => T): Promise<T> {
    const result = this.pending.then(operation);
    this.pending = result.catch(() => undefined);
    return result;
  }
}

test("M1: custo sem orçamento não é exibido como percentual zero", () => {
  const state = createSeed();
  state.projects[0].budget = 0;
  const f = finances(state, state.projects[0].id);
  assert.equal(f.financialProgress, null);
  assert.equal(f.actual, 460800);
  assert.equal(f.balance, -755200);
});
test("M2: conclusão anterior ao último diário é rejeitada", () => {
  const state = createSeed();
  const p = structuredClone(state.projects[0]);
  p.stages.forEach((s) => {
    s.progress = 100;
  });
  p.status = "completed";
  p.actualEnd = shiftDate(today(), -3);
  assert.throws(() => saveProject(state, p), /antes de um diário/);
});
test("M2: início realizado posterior a um diário é rejeitado", () => {
  const state = createSeed();
  const p = { ...structuredClone(state.projects[0]), actualStart: today() };
  assert.throws(() => saveProject(state, p), /após um diário/);
});
test("M2: diário anterior ao início realizado é rejeitado", () => {
  const state = createSeed();
  const p = state.projects[0];
  p.actualStart = shiftDate(today(), -1);
  assert.throws(
    () =>
      saveJournal(state, {
        id: "early",
        projectId: p.id,
        stageId: p.stages[2].id,
        date: shiftDate(today(), -2),
        progress: 80,
        activity: "Atividade fictícia de auditoria",
        workforce: 5,
        impediment: "",
        occurrence: "",
        images: [],
        authorId: "caio",
        createdAt: new Date().toISOString(),
      }),
    /início realizado/,
  );
});
test("M2: obra iniciada exige data de início realizado", () => {
  const state = createSeed();
  const p = structuredClone(state.projects[0]);
  p.actualStart = "";
  assert.throws(() => saveProject(state, p), /Informe o início realizado/);
});
test("M3: arredondamento zero não permite planejar obra com etapa executada", () => {
  const state = createSeed();
  const p = structuredClone(state.projects[0]);
  state.journals = state.journals.filter((j) => j.projectId !== p.id);
  p.stages.forEach((s, i) => {
    s.progress = i ? 0 : 100;
    s.weight = i ? 1000 : 1;
  });
  p.actualStart = "";
  p.status = "planned";
  assert.equal(physicalProgress(p), 0);
  assert.throws(() => saveProject(state, p), /todas as etapas em zero/);
});
test("M4: supervisor não pode criar etapas nem alterar pesos e planejamento", () => {
  const state = createSeed();
  state.profile = "supervisor";
  const p = state.projects[0];
  const s = p.stages[2];
  for (const patch of [
    { weight: 1 },
    { name: "Outro escopo" },
    { ownerId: "rui" },
    { start: p.start },
    { dependencyId: null },
    { id: "new-stage" },
  ])
    assert.throws(
      () => saveStage(state, p.id, { ...s, ...patch }),
      /Somente o Coordenador/,
    );
});
test("M4: supervisor continua atualizando o avanço sem recalibrar os pesos", () => {
  const state = createSeed();
  state.profile = "supervisor";
  const p = state.projects[0];
  saveStage(state, p.id, { ...p.stages[2], progress: 80 });
  assert.equal(p.stages[2].weight, 45);
  assert.equal(physicalProgress(p), 76);
});
test("M6: persistência rejeita conclusão com etapas incompletas", () => {
  const state = createSeed();
  state.projects[0].status = "completed";
  state.projects[0].actualEnd = today();
  assert.equal(isDemoState(state), false);
});
test("M6: persistência rejeita ciclo de dependências", () => {
  const state = createSeed();
  state.projects[0].stages[0].dependencyId = state.projects[0].stages[1].id;
  assert.equal(isDemoState(state), false);
});
test("M6: persistência rejeita conclusão anterior ao diário", () => {
  const state = createSeed();
  const p = state.projects[0];
  p.stages.forEach((s) => {
    s.progress = 100;
  });
  p.status = "completed";
  p.actualEnd = shiftDate(today(), -3);
  assert.equal(isDemoState(state), false);
});
test("M6: base v1 sem revisão é preservada e recebe revisão inicial", () => {
  const old = createSeed() as Omit<DemoState, "revision"> & {
    revision?: string;
  };
  delete old.revision;
  old.projects[0].name = "Cadastro personalizado preservado";
  const repository = new LocalRepository(() => ({
    getItem: () => JSON.stringify(old),
    setItem: () => {
      throw new Error("Leitura não deve regravar a base.");
    },
  }));
  const data = repository.load();
  assert.equal(data?.revision, "legacy");
  assert.equal(data?.projects[0].name, old.projects[0].name);
});
test("M6: gravação de base semanticamente inválida é recusada", () => {
  let writes = 0;
  const repository = new LocalRepository(() => ({
    getItem: () => null,
    setItem: () => {
      writes++;
    },
  }));
  const state = createSeed();
  state.projects[0].status = "completed";
  assert.throws(() => repository.save(state), /inconsistentes/);
  assert.equal(writes, 0);
});
test("A1: aba desatualizada não apaga alteração de outra obra", async () => {
  const repo = new MemoryRepository();
  const a = new ObraStore(repo);
  const b = new ObraStore(repo);
  await Promise.all([a.hydrate(), b.hydrate()]);
  assert.equal(
    await a.commit((s) => {
      s.projects[0].name = "Alteração A preservada";
    }),
    true,
  );
  assert.equal(
    await b.commit((s) => {
      s.projects[1].name = "Alteração B";
    }),
    false,
  );
  assert.match(b.getSnapshot().notice!.message, /outra aba/);
  assert.equal(repo.data.projects[0].name, "Alteração A preservada");
  assert.equal(
    await b.commit((s) => {
      s.projects[1].name = "Alteração B";
    }),
    true,
  );
  a.sync();
  assert.equal(a.getSnapshot().data?.projects[1].name, "Alteração B");
  assert.equal(repo.data.projects[0].name, "Alteração A preservada");
});
test("A1: gravações concorrentes são serializadas e conflito é explícito", async () => {
  const repo = new MemoryRepository();
  const a = new ObraStore(repo);
  const b = new ObraStore(repo);
  await Promise.all([a.hydrate(), b.hydrate()]);
  const results = await Promise.all([
    a.commit((s) => {
      s.projects[0].name = "Escrita A";
    }),
    b.commit((s) => {
      s.projects[0].name = "Escrita B";
    }),
  ]);
  assert.deepEqual(results, [true, false]);
  assert.equal(typeof repo.data.revision, "string");
  assert.equal(repo.data.projects[0].name, "Escrita A");
});
test("A1: formulário aberto antes da sincronização mantém a revisão original", async () => {
  const repo = new MemoryRepository();
  const a = new ObraStore(repo);
  const b = new ObraStore(repo);
  await Promise.all([a.hydrate(), b.hydrate()]);
  const formRevision = b.getSnapshot().data!.revision;
  await a.commit((s) => {
    s.projects[0].name = "Valor atual";
  });
  b.sync();
  assert.equal(
    await b.commit(
      (s) => {
        s.projects[0].name = "Formulário antigo";
      },
      "Salvar",
      formRevision,
    ),
    false,
  );
  assert.equal(repo.data.projects[0].name, "Valor atual");
});
test("A1: restauração com confirmação desatualizada não apaga dados novos", async () => {
  const repo = new MemoryRepository();
  const a = new ObraStore(repo);
  const b = new ObraStore(repo);
  await Promise.all([a.hydrate(), b.hydrate()]);
  const revision = b.getSnapshot().data!.revision;
  await a.commit((s) => {
    s.projects[0].name = "Novo registro";
  });
  assert.equal(await b.reset(revision), false);
  assert.equal(repo.data.projects[0].name, "Novo registro");
});
test("A1: falha de armazenamento não avança a revisão nem confirma alteração", async () => {
  const repo = new MemoryRepository();
  const store = new ObraStore(repo);
  await store.hydrate();
  const initialRevision = repo.data.revision;
  repo.fail = true;
  assert.equal(
    await store.commit((s) => {
      s.projects[0].name = "Falha";
    }),
    false,
  );
  assert.equal(repo.data.revision, initialRevision);
  assert.equal(store.getSnapshot().data?.revision, initialRevision);
});
test("A1: navegador sem Web Locks não grava sem proteção", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    value: {},
    configurable: true,
  });
  try {
    const repository = new LocalRepository();
    await assert.rejects(
      repository.withWriteLock(() => true),
      /proteção de gravação/,
    );
  } finally {
    if (previous) Object.defineProperty(globalThis, "navigator", previous);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
});

test("A1: restauração troca a revisão e invalida formulários da base anterior", async () => {
  const repo = new MemoryRepository();
  const a = new ObraStore(repo);
  const b = new ObraStore(repo);
  await Promise.all([a.hydrate(), b.hydrate()]);
  const oldRevision = b.getSnapshot().data!.revision;
  assert.equal(await a.reset(), true);
  assert.notEqual(repo.data.revision, oldRevision);
  b.sync();
  assert.equal(
    await b.commit(
      (s) => {
        s.projects[0].name = "Formulário anterior à restauração";
      },
      "Salvar",
      oldRevision,
    ),
    false,
  );
  assert.equal(repo.data.projects[0].name, "Ampliação do galpão de manutenção");
});
