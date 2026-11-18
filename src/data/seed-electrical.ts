import type { Area, DemoState } from "@/domain/types";

// Cenários sintéticos de acompanhamento. Nenhum registro autoriza serviço elétrico.
const PROJECTS: { name: string; area: Area; stages: string[] }[] = [
  {
    name: "Modernização do QGBT de utilidades",
    area: "Painéis e automação",
    stages: [
      "Planejamento e documentação",
      "Montagem dos painéis",
      "Instalação e identificação",
      "Inspeção e entrega técnica",
    ],
  },
  {
    name: "Infraestrutura de cabos da linha de envase",
    area: "Infraestrutura e cabos",
    stages: [
      "Planejamento da infraestrutura",
      "Montagem de suportes e eletrocalhas",
      "Lançamento e identificação dos cabos",
      "Inspeção e entrega técnica",
    ],
  },
  {
    name: "Iluminação do galpão de manutenção",
    area: "Instalações elétricas",
    stages: [
      "Planejamento dos circuitos",
      "Infraestrutura e suportação",
      "Montagem das luminárias",
      "Inspeção e entrega técnica",
    ],
  },
  {
    name: "Adequação do aterramento da oficina",
    area: "Inspeção e comissionamento",
    stages: [
      "Planejamento e documentação",
      "Preparação da infraestrutura",
      "Montagem e identificação do aterramento",
      "Inspeção e registro de ensaios",
    ],
  },
  {
    name: "Montagem dos quadros de distribuição",
    area: "Painéis e automação",
    stages: [
      "Planejamento e documentação",
      "Montagem dos quadros",
      "Instalação e identificação",
      "Inspeção e entrega técnica",
    ],
  },
  {
    name: "Eletrocalhas do bloco operacional",
    area: "Infraestrutura e cabos",
    stages: [
      "Planejamento do percurso",
      "Preparação dos suportes",
      "Montagem das eletrocalhas",
      "Inspeção e entrega técnica",
    ],
  },
  {
    name: "Adequação dos circuitos da nova linha",
    area: "Instalações elétricas",
    stages: [
      "Planejamento dos circuitos",
      "Preparação da infraestrutura",
      "Montagem e identificação",
      "Inspeção e entrega técnica",
    ],
  },
  {
    name: "Inspeção e ensaios do painel de utilidades",
    area: "Inspeção e comissionamento",
    stages: [
      "Planejamento e documentação",
      "Levantamento dos pontos de inspeção",
      "Inspeção e registro de ensaios",
      "Consolidação e entrega documental",
    ],
  },
];

export function adaptElectricalSeed(data: DemoState): DemoState {
  data.projects.forEach((project, index) => {
    const spec = PROJECTS[index];
    project.name = spec.name;
    project.area = spec.area;
    project.code = `EL-${String(index + 1).padStart(3, "0")}`;
    project.unit = "Unidade Aurora";
    project.description = `Cenário fictício de ${spec.area.toLocaleLowerCase("pt-BR")} na Unidade Aurora. Acompanhamento gerencial de planejamento, montagem e entrega documental. Não constitui projeto elétrico, laudo ou autorização de serviço.`;
    project.stages.forEach((stage, stageIndex) => {
      stage.name = spec.stages[stageIndex];
    });
    project.history[0].text =
      "Intervenção elétrica fictícia cadastrada para demonstração gerencial.";
    if (project.status === "completed") {
      project.history[1].text =
        "Etapas do cenário fictício concluídas e entrega documental registrada.";
    }
  });
  const issueDescriptions = [
    "Conferir documentação dos pontos de aterramento",
    "Confirmar entrega dos cabos de alimentação",
    "Revisar identificação dos circuitos do QGBT",
    "Validar especificação das luminárias",
    "Confirmar medidas dos suportes de eletrocalhas",
    "Consolidar registros de inspeção dos quadros",
  ];
  data.issues.forEach((issue, index) => {
    issue.description = issueDescriptions[index];
    if (issue.status === "resolved") {
      issue.resolution =
        "Registros fictícios de inspeção conferidos no cenário demonstrativo.";
      issue.history[1].text = "Resolvida: documentação fictícia consolidada.";
    }
  });
  const activities = [
    "Montagem demonstrativa dos painéis e identificação dos circuitos de utilidades. Registro gerencial fictício.",
    "Conferência demonstrativa dos pontos de aterramento e atualização da documentação. Aguardando análise documental.",
    "Montagem demonstrativa de luminárias e identificação dos circuitos do galpão. Registro gerencial fictício.",
    "Conferência demonstrativa de suportes e montagem de eletrocalhas do bloco operacional.",
  ];
  data.journals.forEach((journal, index) => {
    journal.activity = activities[index];
    journal.impediment =
      index === 1
        ? "Documentação dos pontos de aterramento em revisão no exemplo fictício."
        : "";
    journal.occurrence =
      "Cenário fictício. Sem validade como registro de inspeção ou liberação de serviço.";
  });
  return data;
}
