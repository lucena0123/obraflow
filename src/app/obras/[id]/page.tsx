import { ProjectDetail } from "@/modules/project-detail";
// Mantém os links antigos das oito obras fictícias na exportação estática.
export const dynamicParams = false;
export function generateStaticParams() {
  return Array.from({ length: 8 }, (_, index) => ({ id: `obra-${index + 1}` }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
