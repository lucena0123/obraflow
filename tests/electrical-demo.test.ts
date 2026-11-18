import test from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/data/seed";
import { ELECTRICAL_AREAS, storageKeyForSector } from "../src/domain/demo";
import { isDemoState, LocalRepository } from "../src/data/repository";
import {
  finances,
  filterProjects,
  physicalProgress,
  today,
  shiftDate,
} from "../src/domain/calculations";
import { saveJournal, saveProject } from "../src/domain/commands";
import { EMPTY_FILTERS } from "../src/domain/types";

test("a versão industrial preserva os exemplos e a chave já publicados", () => {
  const data = createSeed(today(), "industrial");
  assert.equal(data.projects[0].name, "Ampliação do galpão de manutenção");
  assert.equal(data.projects[0].code, "OB-001");
  assert.equal(data.projects[0].area, "Construção civil");
  assert.equal(storageKeyForSector("industrial"), "obraflow.demo.v1");
  assert.equal(isDemoState(data), true);
});

test("a base elétrica tem oito projetos e referências de campo consistentes", () => {
  const data = createSeed(today(), "electrical");
  assert.equal(isDemoState(data), true);
  assert.equal(data.projects.length, 8);
  assert.equal(data.projects[0].name, "Modernização do QGBT de utilidades");
  assert.ok(
    data.projects.every(
      (p) => p.code.startsWith("EL-") && p.unit === "Unidade Aurora",
    ),
  );
  for (const area of ELECTRICAL_AREAS) {
    assert.equal(data.projects.filter((p) => p.area === area).length, 2);
  }
  assert.ok(data.journals.every((j) => j.occurrence.includes("Sem validade")));
  assert.ok(!JSON.stringify(data).includes("drenagem"));
  assert.ok(!JSON.stringify(data).includes("perfis metálicos"));
});

test("o diário elétrico atualiza o físico sem alterar os custos", () => {
  const data = createSeed(today(), "electrical");
  const project = data.projects[0];
  const costs = finances(data, project.id);
  assert.equal(physicalProgress(project), 68);
  saveJournal(data, {
    id: "diario-eletrico-teste",
    projectId: project.id,
    date: today(),
    activity: "Registro fictício de montagem e identificação dos circuitos.",
    workforce: 6,
    stageId: project.stages[2].id,
    progress: 75,
    impediment: "",
    occurrence: "Exemplo demonstrativo.",
    images: [],
    authorId: "caio",
    createdAt: new Date().toISOString(),
  });
  assert.equal(physicalProgress(project), 74);
  assert.deepEqual(finances(data, project.id), costs);
  assert.equal(isDemoState(data), true);
});

test("busca e filtros encontram os cenários do setor elétrico", () => {
  const data = createSeed(today(), "electrical");
  assert.equal(
    filterProjects(data.projects, { ...EMPTY_FILTERS, search: "EL-001" })
      .length,
    1,
  );
  assert.equal(
    filterProjects(data.projects, {
      ...EMPTY_FILTERS,
      area: "Infraestrutura e cabos",
    }).length,
    2,
  );
});

test("salvar e restaurar a base elétrica não sobrescreve a base industrial", () => {
  const values = new Map<string, string>();
  const storage = () => ({
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  });
  const industrial = new LocalRepository(
    storage,
    storageKeyForSector("industrial"),
  );
  const electrical = new LocalRepository(
    storage,
    storageKeyForSector("electrical"),
  );
  industrial.save(createSeed(today(), "industrial"));
  const previousIndustrial = values.get(storageKeyForSector("industrial"));
  const data = createSeed(today(), "electrical");
  data.projects[0].name = "Alteração elétrica fictícia";
  electrical.save(data);
  assert.equal(
    electrical.load()?.projects[0].name,
    "Alteração elétrica fictícia",
  );
  electrical.save(createSeed(today(), "electrical"));
  assert.equal(electrical.load()?.projects[0].code, "EL-001");
  assert.equal(
    values.get(storageKeyForSector("industrial")),
    previousIndustrial,
  );
});

test("uma nova obra elétrica aceita as áreas específicas e mantém a integridade", () => {
  const data = createSeed(today(), "electrical");
  saveProject(data, {
    ...data.projects[0],
    id: "eletrica-nova-teste",
    code: "EL-009",
    name: "Circuitos fictícios do laboratório",
    area: "Instalações elétricas",
    start: today(),
    end: shiftDate(today(), 10),
    actualStart: "",
    actualEnd: "",
    status: "planned",
    stages: [],
    history: [],
  });
  assert.equal(isDemoState(data), true);
  assert.equal(data.projects.at(-1)?.area, "Instalações elétricas");
});
