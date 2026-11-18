export type DemoSector = "industrial" | "electrical";

export const INDUSTRIAL_AREAS = [
  "Construção civil",
  "Serralheria",
  "Pintura industrial",
  "Obras e melhorias",
] as const;
export const ELECTRICAL_AREAS = [
  "Instalações elétricas",
  "Painéis e automação",
  "Infraestrutura e cabos",
  "Inspeção e comissionamento",
] as const;
export const ALL_AREAS = [...INDUSTRIAL_AREAS, ...ELECTRICAL_AREAS] as const;

// Cada exportação tem vocabulário, endereço e armazenamento próprios.
export const DEMO_SECTOR: DemoSector =
  process.env.NEXT_PUBLIC_DEMO_SECTOR === "electrical"
    ? "electrical"
    : "industrial";
export const IS_ELECTRICAL = DEMO_SECTOR === "electrical";
export const AREAS: readonly (typeof ALL_AREAS)[number][] = IS_ELECTRICAL
  ? ELECTRICAL_AREAS
  : INDUSTRIAL_AREAS;
export function storageKeyForSector(sector: DemoSector) {
  return sector === "electrical"
    ? "obraflow.electrical.demo.v1"
    : "obraflow.demo.v1";
}
export function demoConfig(sector: DemoSector) {
  return sector === "electrical"
    ? {
        name: "ObraFlow Elétrica",
        tagline: "GESTÃO DE OBRAS ELÉTRICAS",
        unit: "Unidade Aurora",
        operation: "Obras e instalações elétricas",
        codePrefix: "EL",
        chartLabels: ["Instalações", "Painéis", "Cabos", "Inspeção"],
      }
    : {
        name: "ObraFlow",
        tagline: "GESTÃO DE OBRAS INDUSTRIAIS",
        unit: "Unidade Horizonte",
        operation: "Operações industriais",
        codePrefix: "OB",
        chartLabels: ["Civil", "Serralheria", "Pintura", "Melhorias"],
      };
}
export const DEMO = demoConfig(DEMO_SECTOR);
