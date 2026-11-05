import {
  type DemoState,
  type Project,
  type Stage,
  type Area,
} from "@/domain/types";
import { shiftDate, today } from "@/domain/calculations";

export function createSeed(base = today()): DemoState {
  const at = (offset: number) => shiftDate(base, offset);
  const specs: [
    string,
    Area,
    string,
    number,
    number,
    number,
    number[],
    Project["status"],
  ][] = [
    [
      "Ampliação do galpão de manutenção",
      "Construção civil",
      "lia",
      1280000,
      -45,
      28,
      [100, 100, 62, 0],
      "active",
    ],
    [
      "Passarela de acesso à utilidade",
      "Serralheria",
      "noa",
      485000,
      -38,
      -3,
      [100, 100, 48, 0],
      "active",
    ],
    [
      "Pintura do parque de tanques",
      "Pintura industrial",
      "rui",
      320000,
      -25,
      22,
      [100, 75, 20, 0],
      "active",
    ],
    [
      "Modernização da drenagem pluvial",
      "Obras e melhorias",
      "lia",
      765000,
      -60,
      -7,
      [100, 100, 72, 15],
      "active",
    ],
    [
      "Base civil da nova linha de apoio",
      "Construção civil",
      "noa",
      610000,
      -75,
      -12,
      [100, 100, 100, 100],
      "completed",
    ],
    [
      "Adequação das estruturas de proteção",
      "Serralheria",
      "lia",
      245000,
      -15,
      35,
      [100, 40, 0, 0],
      "active",
    ],
    [
      "Revitalização do bloco operacional",
      "Obras e melhorias",
      "rui",
      430000,
      5,
      58,
      [0, 0, 0, 0],
      "planned",
    ],
    [
      "Pintura da estrutura do almoxarifado",
      "Pintura industrial",
      "rui",
      185000,
      -50,
      -15,
      [100, 100, 100, 100],
      "completed",
    ],
  ];
  const stageNames = [
    "Mobilização e preparação",
    "Infraestrutura e fabricação",
    "Execução e montagem",
    "Inspeção e entrega",
  ];
  const projects: Project[] = specs.map(
    ([name, area, ownerId, budget, start, end, progresses, status], i) => {
      const id = `obra-${i + 1}`;
      const duration = end - start;
      const stages: Stage[] = stageNames.map((name, j) => ({
        id: `${id}-etapa-${j + 1}`,
        name,
        ownerId,
        start: at(start + Math.floor((duration * j) / 4)),
        end: at(start + Math.floor((duration * (j + 1)) / 4)),
        progress: progresses[j],
        weight: [15, 25, 45, 15][j],
        dependencyId: j ? `${id}-etapa-${j}` : null,
      }));
      return {
        id,
        code: `OB-${String(i + 1).padStart(3, "0")}`,
        name,
        description: `Intervenção demonstrativa de ${area.toLocaleLowerCase("pt-BR")} na Unidade Horizonte. Escopo com planejamento, execução e entrega técnica para melhoria da operação industrial.`,
        area,
        unit: "Unidade Horizonte",
        ownerId,
        start: at(start),
        end: at(end),
        actualStart: status === "planned" ? "" : at(start + 1),
        actualEnd: status === "completed" ? at(end - 1) : "",
        budget,
        status,
        stages,
        history: [
          {
            id: `h-${i}-1`,
            at: `${at(Math.min(-3, start - 3))}T12:00:00`,
            actor: "Caio Campo Alto",
            text: "Obra cadastrada e orçamento aprovado para demonstração.",
          },
          {
            id: `h-${i}-2`,
            at: `${at(status === "planned" ? -1 : status === "completed" ? end - 1 : -1)}T14:30:00`,
            actor: "Equipe de campo",
            text:
              status === "completed"
                ? "Etapas finalizadas e entrega técnica registrada."
                : status === "planned"
                  ? "Planejamento inicial validado."
                  : "Avanço físico atualizado no diário de obras.",
          },
        ],
      };
    },
  );
  const measurements = projects.flatMap((p, i) =>
    p.status === "planned"
      ? []
      : [
          {
            id: `med-${i}-1`,
            projectId: p.id,
            date: at(specs[i][4] + 5),
            description: "Medição 01 · mobilização e infraestrutura",
            amount: Math.round(
              p.budget * (p.status === "completed" ? 0.45 : 0.22),
            ),
            kind: "actual" as const,
            authorId: "caio",
          },
          {
            id: `med-${i}-2`,
            projectId: p.id,
            date: at(p.status === "completed" ? specs[i][5] - 2 : -2),
            description: "Medição 02 · execução e serviços",
            amount: Math.round(
              p.budget * (p.status === "completed" ? 0.51 : 0.14 + i * 0.025),
            ),
            kind: "actual" as const,
            authorId: "caio",
          },
          ...(p.status === "completed"
            ? []
            : [
                {
                  id: `med-${i}-3`,
                  projectId: p.id,
                  date: at(-1),
                  description: "Saldo de contratação · materiais e serviços",
                  amount: Math.round(p.budget * 0.23),
                  kind: "committed" as const,
                  authorId: "caio",
                },
              ]),
        ],
  );
  const issueSpecs: [
    string,
    number,
    "critical" | "high" | "medium" | "low",
    number,
  ][] = [
    ["Liberar frente de serviço da drenagem", 3, "critical", -2],
    ["Confirmar entrega dos perfis metálicos", 1, "critical", -1],
    ["Validar plano de içamento da cobertura", 0, "high", 3],
    ["Aprovar amostra de acabamento anticorrosivo", 2, "medium", 5],
    ["Revisar pontos de fixação dos guarda-corpos", 5, "high", 2],
    ["Concluir inspeção final da base civil", 4, "low", -12],
  ];
  const issues = issueSpecs.map(
    ([description, projectIndex, priority, due], i) => ({
      id: `pend-${i}`,
      projectId: projects[projectIndex].id,
      description,
      ownerId: projects[projectIndex].ownerId,
      priority,
      due: at(due),
      status:
        i === 5
          ? ("resolved" as const)
          : i === 0
            ? ("in-progress" as const)
            : ("open" as const),
      resolution:
        i === 5 ? "Inspeção realizada e checklist de entrega aprovado." : "",
      history: [
        {
          id: `ip-${i}`,
          at: `${at(i === 5 ? -16 : -4)}T09:00:00`,
          actor: "Coordenação",
          text: "Pendência registrada.",
        },
        ...(i === 5
          ? [
              {
                id: `ip-${i}-r`,
                at: `${at(-12)}T16:00:00`,
                actor: "Noa Vale Claro",
                text: "Resolvida: inspeção e checklist aprovados.",
              },
            ]
          : []),
      ],
    }),
  );
  const journals = [0, 3, 2, 5].map((projectIndex, i) => {
    const p = projects[projectIndex];
    const stage =
      p.stages.find((s) => s.progress > 0 && s.progress < 100) ?? p.stages[0];
    return {
      id: `diario-${i}`,
      projectId: p.id,
      date: at(-i - 1),
      activity: [
        "Montagem das estruturas de apoio e concretagem dos pilares do módulo leste.",
        "Execução de canaletas e preparação dos trechos de drenagem. Frente sul aguarda liberação.",
        "Preparação de superfície e aplicação da primeira camada de proteção dos tanques.",
        "Fabricação e pré-montagem dos guarda-corpos do corredor de acesso.",
      ][i],
      workforce: [12, 8, 6, 5][i],
      stageId: stage.id,
      progress: stage.progress,
      impediment: i === 1 ? "Frente sul depende da liberação operacional." : "",
      occurrence:
        i === 0
          ? "Reunião de alinhamento concluída no início do turno."
          : "Sem ocorrências adicionais.",
      images: [],
      authorId: p.ownerId,
      createdAt: `${at(-i - 1)}T16:30:00`,
    };
  });
  return {
    version: 1,
    revision: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    profile: "coordinator",
    projects,
    measurements,
    issues,
    journals,
  };
}
