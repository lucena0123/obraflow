"use client";
import { useState } from "react";
import Link from "next/link";
import { projectHref } from "@/lib/routes";
import { HardHat, ArrowUpRight, List, LayoutGrid } from "lucide-react";
import { useData } from "@/data/store";
import { EMPTY_FILTERS } from "@/domain/types";
import {
  compactMoney,
  dateLabel,
  filterProjects,
  physicalProgress,
  projectStatus,
  visibleProjects,
} from "@/domain/calculations";
import {
  Avatar,
  Empty,
  FilterBar,
  Loading,
  PageHeading,
  Panel,
  Progress,
  ProjectTable,
  StatusBadge,
  useToday,
} from "@/components/common";
import { AddButton, ProjectForm } from "@/components/forms";
import { Button } from "@/components/ui/button";
export function Projects() {
  const { data } = useData();
  const at = useToday();
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [create, setCreate] = useState(false);
  const [grid, setGrid] = useState(false);
  if (!data || !at) return <Loading />;
  const projects = filterProjects(visibleProjects(data), filters, at);
  return (
    <>
      <PageHeading
        eyebrow="PORTFÓLIO DE OBRAS"
        title="Do plano à entrega."
        description="Organize as intervenções e acompanhe cada frente de trabalho."
        actions={
          data.profile === "coordinator" && (
            <AddButton onClick={() => setCreate(true)}>Nova obra</AddButton>
          )
        }
      />
      <FilterBar filters={filters} onChange={setFilters} />
      <div className="section-toolbar">
        <span>
          {projects.length}{" "}
          {projects.length === 1 ? "obra encontrada" : "obras encontradas"}
        </span>
        <div className="view-toggle">
          <Button
            size="icon"
            variant={grid ? "ghost" : "secondary"}
            onClick={() => setGrid(false)}
            aria-label="Visualizar em tabela"
            aria-pressed={!grid}
          >
            <List size={17} />
          </Button>
          <Button
            size="icon"
            variant={grid ? "secondary" : "ghost"}
            onClick={() => setGrid(true)}
            aria-label="Visualizar em cartões"
            aria-pressed={grid}
          >
            <LayoutGrid size={16} />
          </Button>
        </div>
      </div>
      {grid ? (
        <div className="project-grid">
          {projects.length ? (
            projects.map((p) => (
              <Link
                className="project-card panel"
                key={p.id}
                href={projectHref(p.id)}
              >
                <div className="project-card-top">
                  <span className="project-card-icon">
                    <HardHat size={22} />
                  </span>
                  <StatusBadge status={projectStatus(p, at)} />
                </div>
                <small>
                  {p.code} · {p.area}
                </small>
                <h2>{p.name}</h2>
                <p>{p.description}</p>
                <Progress value={physicalProgress(p)} />
                <div className="project-card-meta">
                  <span>
                    Orçamento<strong>{compactMoney(p.budget)}</strong>
                  </span>
                  <span>
                    Entrega prevista<strong>{dateLabel(p.end, true)}</strong>
                  </span>
                </div>
                <div className="project-card-footer">
                  <Avatar id={p.ownerId} showName />
                  <ArrowUpRight size={18} />
                </div>
              </Link>
            ))
          ) : (
            <Empty />
          )}
        </div>
      ) : (
        <Panel>
          <ProjectTable projects={projects} at={at} />
        </Panel>
      )}
      {create && <ProjectForm onClose={() => setCreate(false)} />}
    </>
  );
}
