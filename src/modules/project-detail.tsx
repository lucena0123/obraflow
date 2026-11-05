"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CalendarDays,
  MapPin,
  Wallet,
  HardHat,
  Plus,
  Link2,
  Clock3,
} from "lucide-react";
import { useData } from "@/data/store";
import { type Stage } from "@/domain/types";
import {
  dateLabel,
  finances,
  isDelayed,
  money,
  physicalProgress,
  projectStatus,
  stageDelayed,
  visibleProjects,
} from "@/domain/calculations";
import { deleteProject, deleteStage } from "@/domain/commands";
import {
  Avatar,
  Confirm,
  Empty,
  Loading,
  Panel,
  Progress,
  StatusBadge,
  useToday,
} from "@/components/common";
import { ProjectForm, StageForm } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Diary, Finance, Issues } from "./records";
const tabs = [
  { id: "overview", label: "Visão da obra" },
  { id: "stages", label: "Etapas e avanço" },
  { id: "diary", label: "Diário de obras" },
  { id: "finance", label: "Financeiro" },
  { id: "issues", label: "Pendências" },
];
export function ProjectDetail({ id }: { id: string }) {
  const { data, store } = useData();
  const at = useToday();
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stage, setStage] = useState<Stage | "new" | null>(null);
  const [deleteItem, setDeleteItem] = useState<Stage | null>(null);
  if (!data || !at) return <Loading />;
  const project = visibleProjects(data).find((p) => p.id === id);
  if (!project)
    return (
      <Panel>
        <Empty
          title="Obra indisponível neste perfil"
          description="A obra foi removida ou não está no seu escopo de acesso demonstrativo."
          action={
            <Button asChild>
              <Link href="/obras">Voltar para obras</Link>
            </Button>
          }
        />
      </Panel>
    );
  const coordinator = data.profile === "coordinator";
  const f = finances(data, id);
  const progress = physicalProgress(project);
  return (
    <>
      <Link href="/obras" className="back-link">
        <ArrowLeft size={16} />
        Portfólio de obras
      </Link>
      <div className="detail-heading">
        <div>
          <div className="eyebrow">
            <span />
            {project.code} <span className="detail-area">/ {project.area}</span>
          </div>
          <h1>{project.name}</h1>
          <div className="detail-subtitle">
            <MapPin size={14} />
            {project.unit}
            <StatusBadge status={projectStatus(project, at)} />
          </div>
        </div>
        {coordinator && (
          <div className="heading-actions">
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil size={15} />
              Editar obra
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Excluir obra"
              onClick={() => setDeleting(true)}
            >
              <Trash2 size={17} />
            </Button>
          </div>
        )}
      </div>
      <div className="detail-tabs" role="tablist" aria-label="Seções da obra">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            tabIndex={tab === t.id ? 0 : -1}
            onKeyDown={(event) => {
              const index = tabs.findIndex((item) => item.id === t.id);
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % tabs.length
                  : event.key === "ArrowLeft"
                    ? (index - 1 + tabs.length) % tabs.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : -1;
              if (next >= 0) {
                event.preventDefault();
                setTab(tabs[next].id);
                document.getElementById(`tab-${tabs[next].id}`)?.focus();
              }
            }}
            id={`tab-${t.id}`}
            aria-controls={`panel-${t.id}`}
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "issues" && (
              <span>
                {
                  data.issues.filter(
                    (i) => i.projectId === id && i.status !== "resolved",
                  ).length
                }
              </span>
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "overview" && (
          <>
            <div className="detail-overview">
              <Panel title="Sobre a intervenção" subtitle={project.area}>
                <p className="detail-description">{project.description}</p>
                <div className="detail-facts">
                  <div>
                    <span>Responsável técnico fictício</span>
                    <Avatar id={project.ownerId} showName />
                  </div>
                  <div>
                    <span>Período previsto</span>
                    <strong>
                      <CalendarDays size={15} />
                      {dateLabel(project.start, true)} —{" "}
                      {dateLabel(project.end, true)}
                    </strong>
                  </div>
                  <div>
                    <span>Início realizado</span>
                    <strong>{dateLabel(project.actualStart, true)}</strong>
                  </div>
                  <div>
                    <span>Entrega realizada</span>
                    <strong>{dateLabel(project.actualEnd, true)}</strong>
                  </div>
                </div>
                {isDelayed(project, at) && (
                  <div className="inline-note warning">
                    <Clock3 size={17} />
                    Há etapas ou entrega com prazo vencido e avanço incompleto.
                    Revise o cronograma e as pendências.
                  </div>
                )}
              </Panel>
              <Panel title="Pulso da obra">
                <div className="detail-progress-number">
                  <span>Avanço físico</span>
                  <strong>{progress}%</strong>
                </div>
                <Progress value={progress} label={false} />
                <p className="muted progress-explanation">
                  Média ponderada de {project.stages.length} etapas.
                </p>
                <div className="budget-list">
                  <span>
                    <Wallet size={15} />
                    Orçamento<strong>{money(f.budget)}</strong>
                  </span>
                  <span>
                    <HardHat size={15} />
                    Realizado<strong>{money(f.actual)}</strong>
                  </span>
                  <span>
                    Saldo disponível
                    <strong
                      className={f.balance < 0 ? "text-amber" : "text-teal"}
                    >
                      {money(f.balance)}
                    </strong>
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="full-width"
                  onClick={() => setTab("stages")}
                >
                  Acompanhar etapas <Plus size={15} />
                </Button>
              </Panel>
            </div>
            <Panel
              title="Linha do tempo da obra"
              subtitle="Histórico de alterações registradas neste navegador"
            >
              <div className="timeline">
                {[...project.history]
                  .sort((a, b) => b.at.localeCompare(a.at))
                  .map((h) => (
                    <div key={h.id}>
                      <span className="timeline-dot" />
                      <div>
                        <strong>{h.text}</strong>
                        <small>
                          {dateLabel(h.at, true)} · {h.actor}
                        </small>
                      </div>
                    </div>
                  ))}
              </div>
            </Panel>
          </>
        )}
        {tab === "stages" && (
          <>
            <div className="section-toolbar">
              <div>
                <h2>Etapas da execução</h2>
                <p className="muted">
                  O peso de cada etapa determina sua participação no avanço
                  físico.
                </p>
              </div>
              {coordinator && project.status !== "completed" && (
                <Button onClick={() => setStage("new")}>
                  <Plus size={16} />
                  Adicionar etapa
                </Button>
              )}
            </div>
            <Panel>
              {project.stages.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Etapa / dependência</th>
                        <th>Responsável</th>
                        <th>Período previsto</th>
                        <th>Peso</th>
                        <th>Avanço</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.stages.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <strong>{s.name}</strong>
                            <small className="table-subtitle">
                              {s.dependencyId ? (
                                <>
                                  <Link2 size={11} /> Após{" "}
                                  {
                                    project.stages.find(
                                      (d) => d.id === s.dependencyId,
                                    )?.name
                                  }
                                </>
                              ) : (
                                "Sem dependência"
                              )}
                              {stageDelayed(s, at) && " · Atrasada"}
                            </small>
                          </td>
                          <td>
                            <Avatar id={s.ownerId} showName />
                          </td>
                          <td
                            className={stageDelayed(s, at) ? "text-amber" : ""}
                          >
                            {dateLabel(s.start)} — {dateLabel(s.end, true)}
                          </td>
                          <td>{s.weight}</td>
                          <td className="progress-cell">
                            <Progress
                              value={s.progress}
                              tone={stageDelayed(s, at) ? "amber" : "teal"}
                            />
                          </td>
                          <td>
                            <div className="row-actions">
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={project.status === "completed"}
                                aria-label={`Editar etapa ${s.name}`}
                                onClick={() => setStage(s)}
                              >
                                <Pencil size={15} />
                              </Button>
                              {coordinator && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={project.status === "completed"}
                                  aria-label={`Excluir etapa ${s.name}`}
                                  onClick={() => setDeleteItem(s)}
                                >
                                  <Trash2 size={15} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="Vamos organizar a execução"
                  description="Adicione a primeira etapa, defina um prazo e atribua um peso."
                  action={
                    coordinator && (
                      <Button onClick={() => setStage("new")}>
                        Adicionar primeira etapa
                      </Button>
                    )
                  }
                />
              )}
            </Panel>
            <div className="inline-note">
              Etapas concluídas podem ser ajustadas enquanto a obra estiver
              aberta. Reabra uma obra concluída pelo cadastro antes de corrigir
              sua execução.
            </div>
          </>
        )}
        {tab === "diary" && <Diary projectId={id} />}
        {tab === "finance" && <Finance projectId={id} />}
        {tab === "issues" && <Issues projectId={id} />}
      </div>
      {editing && (
        <ProjectForm project={project} onClose={() => setEditing(false)} />
      )}
      {deleting && (
        <Confirm
          title="Excluir obra e registros vinculados?"
          description={`A obra ${project.code}, suas etapas, diários, imagens, pendências e lançamentos serão removidos deste navegador. Esta ação não pode ser desfeita.`}
          danger
          onClose={() => setDeleting(false)}
          onConfirm={async (revision) => {
            const ok = await store.commit(
              (s) => deleteProject(s, id),
              "Obra e registros vinculados excluídos.",
              revision,
            );
            if (ok) router.push("/obras");
            return ok;
          }}
        />
      )}
      {stage && (
        <StageForm
          project={project}
          stage={stage === "new" ? undefined : stage}
          onClose={() => setStage(null)}
        />
      )}
      {deleteItem && (
        <Confirm
          title="Excluir etapa?"
          description={`A etapa «${deleteItem.name}» será removida e o avanço recalculado. Etapas com dependências ou diários são preservadas.`}
          danger
          onClose={() => setDeleteItem(null)}
          onConfirm={(revision) =>
            store.commit(
              (s) => deleteStage(s, id, deleteItem.id),
              "Etapa excluída.",
              revision,
            )
          }
        />
      )}
    </>
  );
}
