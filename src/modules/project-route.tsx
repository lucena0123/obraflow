"use client";
import { useSearchParams } from "next/navigation";
import { ProjectDetail } from "./project-detail";

export function ProjectRoute() {
  const id = useSearchParams().get("id") ?? "";
  return <ProjectDetail key={id} id={id} />;
}
