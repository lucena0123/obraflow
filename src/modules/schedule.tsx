"use client";
import { useState } from "react";
import { CalendarRange, Link2, Pencil, ChevronDown } from "lucide-react";
import { useData } from "@/data/store";
import { EMPTY_FILTERS, type Project, type Stage } from "@/domain/types";
import {
  dateLabel,
  daysBetween,
  filterProjects,
  person,
  physicalProgress,
  shiftDate,
  stageDelayed,
  visibleProjects,
} from "@/domain/calculations";
import {
  Empty,
  FilterBar,
  Loading,
  PageHeading,
  Panel,
  useToday,
} from "@/components/common";
import { StageForm } from "@/components/forms";
export function Schedule() {
  const { data } = useData();
  const at = useToday();
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [editing, setEditing] = useState<{
    project: Project;
    stage: Stage;
  } | null>(null);
  if (!data || !at) return <Loading />;
  const projects = filterProjects(visibleProjects(data), filters, at);
  const start = projects.reduce(
    (s, p) => (p.start < s ? p.start : s),
    shiftDate(at, -7),
  );
  const end = projects.reduce(
    (s, p) => (p.end > s ? p.end : s),
    shiftDate(at, 7),
  );
  const days = Math.max(1, daysBetween(start, end) + 1);
  const left = (d: string) =>
    `${Math.max(0, Math.min(100, (daysBetween(start, d) / days) * 100))}%`;
  return (
    <>
      <PageHeading
        eyebrow="PLANEJAMENTO"
        title="O próximo passo, à vista."
        description="Etapas, prazos e dependências em um cronograma integrado."
        actions={
          <span className="date-pill">
            <CalendarRange size={16} />
            {dateLabel(start)} — {dateLabel(end, true)}
          </span>
        }
      />
      <FilterBar filters={filters} onChange={setFilters} />
      <div className="gantt-legend">
        <span>
          <i className="tiny-dot" />
          No prazo
        </span>
        <span>
          <i className="tiny-dot amber" />
          Etapa atrasada
        </span>
        <span>
          <i className="tiny-dot blue" />
          Concluída
        </span>
        <span>
          <Link2 size={13} />
          Dependência indicada no detalhe da etapa
        </span>
      </div>
      <Panel className="gantt-panel">
        {!projects.length ? (
          <Empty />
        ) : (
          <div className="gantt-scroll">
            <div className="gantt">
              <div className="gantt-header">
                <div>
                  Obra / etapa <span>Clique em uma etapa para editar</span>
                </div>
                <div className="gantt-scale">
                  {Array.from({ length: 8 }, (_, i) => (
                    <span key={i}>
                      {dateLabel(shiftDate(start, Math.floor((days * i) / 8)))}
                    </span>
                  ))}
                </div>
              </div>
              {projects.map((p) => (
                <details key={p.id} open className="gantt-group">
                  <summary>
                    <div className="gantt-project-name">
                      <ChevronDown size={15} />
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          {p.code} · {physicalProgress(p)}% físico
                        </small>
                      </span>
                    </div>
                    <div className="gantt-lane">
                      <span
                        className="gantt-today"
                        style={{ left: left(at) }}
                      />
                      <div
                        className="gantt-project-bar"
                        style={{
                          left: left(p.start),
                          width: `${Math.max(0.5, ((daysBetween(p.start, p.end) + 1) / days) * 100)}%`,
                        }}
                      />
                    </div>
                  </summary>
                  {p.stages.length ? (
                    p.stages.map((s) => (
                      <div className="gantt-stage" key={s.id}>
                        <button
                          className="gantt-stage-name"
                          disabled={p.status === "completed"}
                          onClick={() => setEditing({ project: p, stage: s })}
                        >
                          <span>
                            {s.dependencyId ? (
                              <Link2 size={13} />
                            ) : (
                              <span className="tiny-dot" />
                            )}
                          </span>
                          <span>
                            {s.name}
                            <small>
                              {person(s.ownerId).name}
                              {s.dependencyId &&
                                ` · após ${p.stages.find((d) => d.id === s.dependencyId)?.name}`}
                            </small>
                          </span>
                          {p.status !== "completed" && <Pencil size={12} />}
                        </button>
                        <div className="gantt-lane">
                          <span
                            className="gantt-today"
                            style={{ left: left(at) }}
                          />
                          <button
                            className={`gantt-bar ${s.progress === 100 ? "done" : stageDelayed(s, at) ? "late" : ""}`}
                            disabled={p.status === "completed"}
                            style={{
                              left: left(s.start),
                              width: `${Math.max(0.5, ((daysBetween(s.start, s.end) + 1) / days) * 100)}%`,
                            }}
                            onClick={() => setEditing({ project: p, stage: s })}
                            aria-label={`${s.name}: ${s.progress}% · ${dateLabel(s.start)} a ${dateLabel(s.end)}`}
                            title={`${s.name} · ${s.progress}% · ${dateLabel(s.start)} → ${dateLabel(s.end)}`}
                          >
                            <span style={{ width: `${s.progress}%` }} />
                            <b>{s.progress}%</b>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="gantt-no-stages">
                      Esta obra ainda não possui etapas. Adicione no
                      detalhamento da obra.
                    </div>
                  )}
                </details>
              ))}
              <div className="gantt-foot">
                Linha vertical: hoje, {dateLabel(at, true)}. As barras mostram o
                período previsto; o preenchimento indica o avanço físico.
              </div>
            </div>
          </div>
        )}
      </Panel>
      {editing && (
        <StageForm
          project={editing.project}
          stage={editing.stage}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
