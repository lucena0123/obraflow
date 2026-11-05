"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { projectHref } from "@/lib/routes";
import {
  NotebookPen,
  Users,
  CalendarDays,
  AlertTriangle,
  Pencil,
  Trash2,
  MessageSquareText,
  CircleCheck,
  CircleAlert,
  Search,
  Wallet,
  TrendingUp,
  Landmark,
  Coins,
} from "lucide-react";
import { useData } from "@/data/store";
import {
  ISSUE_LABELS,
  PRIORITY_LABELS,
  type Issue,
  type Measurement,
} from "@/domain/types";
import {
  dateLabel,
  finances,
  money,
  physicalProgress,
  person,
  visibleProjects,
} from "@/domain/calculations";
import { deleteIssue, deleteMeasurement } from "@/domain/commands";
import {
  Avatar,
  Confirm,
  Empty,
  Loading,
  Metric,
  Modal,
  PageHeading,
  Panel,
  Progress,
  Select,
  useToday,
} from "@/components/common";
import {
  AddButton,
  IssueForm,
  JournalForm,
  MeasurementForm,
} from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CostChart } from "@/components/charts";

export function Diary({ projectId }: { projectId?: string }) {
  const { data } = useData();
  const [project, setProject] = useState(projectId ?? "");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [create, setCreate] = useState(false);
  const [preview, setPreview] = useState<{
    name: string;
    dataUrl: string;
  } | null>(null);
  if (!data) return <Loading />;
  const projects = visibleProjects(data).filter(
    (p) => !projectId || p.id === projectId,
  );
  const ids = new Set(projects.map((p) => p.id));
  const entries = data.journals
    .filter(
      (j) =>
        ids.has(j.projectId) &&
        (!project || j.projectId === project) &&
        (!query ||
          `${j.activity} ${j.impediment} ${j.occurrence}`
            .toLocaleLowerCase("pt-BR")
            .includes(query.toLocaleLowerCase("pt-BR"))) &&
        (!from || j.date >= from) &&
        (!to || j.date <= to),
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    );
  const canCreate = projects.some((p) =>
    ["active", "paused"].includes(p.status),
  );
  return (
    <>
      {!projectId ? (
        <PageHeading
          eyebrow="ROTINA DE CAMPO"
          title="A história de cada dia."
          description="Atividades, pessoas e evidências que dão vida ao planejamento."
          actions={
            canCreate && (
              <AddButton onClick={() => setCreate(true)}>
                Novo registro
              </AddButton>
            )
          }
        />
      ) : (
        <div className="section-toolbar">
          <h2>Registros de campo</h2>
          {canCreate && (
            <AddButton onClick={() => setCreate(true)}>Novo registro</AddButton>
          )}
        </div>
      )}
      <div className="filter-bar">
        <div className="search-input">
          <Search size={16} />
          <Input
            aria-label="Buscar no diário"
            placeholder="Buscar atividades…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {!projectId && (
          <Select
            label="Filtrar diário por obra"
            value={project}
            onChange={(e) => setProject(e.target.value)}
          >
            <option value="">Todas as obras</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </Select>
        )}
        <label className="date-filter">
          De{" "}
          <Input
            type="date"
            aria-label="Diário a partir de"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="date-filter">
          Até{" "}
          <Input
            type="date"
            aria-label="Diário até"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        {(query || (project && !projectId) || from || to) && (
          <Button
            variant="ghost"
            onClick={() => {
              setQuery("");
              setProject(projectId ?? "");
              setFrom("");
              setTo("");
            }}
          >
            Limpar
          </Button>
        )}
      </div>
      <div className="journal-summary">
        <NotebookPen size={17} />
        <span>{entries.length} registros encontrados</span>
        <span>Os avanços registrados atualizam as etapas da obra.</span>
      </div>
      <div className="journal-list">
        {entries.length ? (
          entries.map((entry) => {
            const p = projects.find((p) => p.id === entry.projectId)!;
            return (
              <article className="panel journal-card" key={entry.id}>
                <div className="journal-date">
                  <strong>{entry.date.slice(8)}</strong>
                  <span>
                    {dateLabel(entry.date).split(" ").slice(1).join(" ")}
                  </span>
                  <CalendarDays size={18} />
                </div>
                <div className="journal-content">
                  <div className="journal-heading">
                    <div>
                      <Link href={projectHref(p.id)}>
                        {p.code} · {p.name}
                      </Link>
                      <h2>
                        {p.stages.find((s) => s.id === entry.stageId)?.name}
                      </h2>
                    </div>
                    <span className="soft-badge">
                      Avanço registrado · {entry.progress}%
                    </span>
                  </div>
                  <p className="journal-activity">{entry.activity}</p>
                  <div className="journal-info">
                    <span>
                      <Users size={15} />
                      {entry.workforce} pessoas no turno
                    </span>
                    <span>
                      <Avatar id={entry.authorId} />
                      {person(entry.authorId).name}
                    </span>
                  </div>
                  {entry.impediment && (
                    <div className="journal-warning">
                      <AlertTriangle size={16} />
                      <span>
                        <strong>Impedimento</strong>
                        {entry.impediment}
                      </span>
                    </div>
                  )}
                  {entry.occurrence && (
                    <div className="journal-observation">
                      <MessageSquareText size={15} />
                      {entry.occurrence}
                    </div>
                  )}
                  {entry.images.length > 0 && (
                    <div className="journal-images">
                      {entry.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setPreview(img)}
                          aria-label={`Ampliar imagem ${img.name}`}
                        >
                          <Image
                            src={img.dataUrl}
                            alt={img.name}
                            width={160}
                            height={110}
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <Panel>
            <Empty
              title="O próximo registro começa aqui"
              description="Registre atividades de uma obra em andamento ou ajuste os filtros."
              action={
                canCreate && (
                  <Button onClick={() => setCreate(true)}>
                    Registrar atividade
                  </Button>
                )
              }
            />
          </Panel>
        )}
      </div>
      {create && (
        <JournalForm projectId={projectId} onClose={() => setCreate(false)} />
      )}
      {preview && (
        <Modal
          title="Evidência de campo"
          description={preview.name}
          onClose={() => setPreview(null)}
          wide
        >
          <Image
            className="image-preview"
            src={preview.dataUrl}
            alt={preview.name}
            width={900}
            height={650}
            unoptimized
          />
        </Modal>
      )}
    </>
  );
}
export function Issues({ projectId }: { projectId?: string }) {
  const { data, store } = useData();
  const at = useToday();
  const [project, setProject] = useState(projectId ?? "");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Issue | "new" | null>(null);
  const [deleting, setDeleting] = useState<Issue | null>(null);
  if (!data || !at) return <Loading />;
  const projects = visibleProjects(data).filter(
    (p) => !projectId || p.id === projectId,
  );
  const ids = new Set(projects.map((p) => p.id));
  const scoped = data.issues.filter((i) => ids.has(i.projectId));
  const issues = scoped
    .filter(
      (i) =>
        (!project || i.projectId === project) &&
        (!status || i.status === status) &&
        (!priority || i.priority === priority) &&
        i.description
          .toLocaleLowerCase("pt-BR")
          .includes(query.toLocaleLowerCase("pt-BR")),
    )
    .sort(
      (a, b) =>
        Number(a.status === "resolved") - Number(b.status === "resolved") ||
        ["critical", "high", "medium", "low"].indexOf(a.priority) -
          ["critical", "high", "medium", "low"].indexOf(b.priority) ||
        a.due.localeCompare(b.due),
    );
  return (
    <>
      {!projectId ? (
        <PageHeading
          eyebrow="PLANO DE AÇÃO"
          title="Destrave a próxima entrega."
          description="Dê visibilidade aos impedimentos e acompanhe cada resolução."
          actions={
            projects.length > 0 && (
              <AddButton onClick={() => setEditing("new")}>
                Nova pendência
              </AddButton>
            )
          }
        />
      ) : (
        <div className="section-toolbar">
          <h2>Pendências da obra</h2>
          <AddButton onClick={() => setEditing("new")}>
            Nova pendência
          </AddButton>
        </div>
      )}
      {!projectId && (
        <div className="issue-overview">
          <div>
            <CircleAlert size={19} />
            <strong>
              {scoped.filter((i) => i.status !== "resolved").length}
            </strong>
            <span>pendências abertas</span>
          </div>
          <div className="text-amber">
            <AlertTriangle size={19} />
            <strong>
              {
                scoped.filter((i) => i.status !== "resolved" && i.due < at)
                  .length
              }
            </strong>
            <span>com prazo vencido</span>
          </div>
          <div className="text-teal">
            <CircleCheck size={19} />
            <strong>
              {scoped.filter((i) => i.status === "resolved").length}
            </strong>
            <span>resolvidas</span>
          </div>
        </div>
      )}
      <div className="filter-bar">
        <div className="search-input">
          <Search size={16} />
          <Input
            aria-label="Buscar pendências"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pendência…"
          />
        </div>
        {!projectId && (
          <Select
            label="Filtrar pendências por obra"
            value={project}
            onChange={(e) => setProject(e.target.value)}
          >
            <option value="">Todas as obras</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </Select>
        )}
        <Select
          label="Filtrar por prioridade"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="">Todas as prioridades</option>
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select
          label="Filtrar status da pendência"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {Object.entries(ISSUE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        {(query || (project && !projectId) || priority || status) && (
          <Button
            variant="ghost"
            onClick={() => {
              setQuery("");
              setProject(projectId ?? "");
              setStatus("");
              setPriority("");
            }}
          >
            Limpar
          </Button>
        )}
      </div>
      <Panel>
        {issues.length ? (
          <div className="table-scroll">
            <table className="issues-table">
              <thead>
                <tr>
                  <th>Pendência / obra</th>
                  <th>Responsável</th>
                  <th>Prioridade</th>
                  <th>Prazo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <button
                        className="row-title"
                        onClick={() => setEditing(i)}
                      >
                        {i.description}
                      </button>
                      <small className="table-subtitle">
                        {projects.find((p) => p.id === i.projectId)?.code} ·{" "}
                        {projects.find((p) => p.id === i.projectId)?.name}
                      </small>
                    </td>
                    <td>
                      <Avatar id={i.ownerId} showName />
                    </td>
                    <td>
                      <span className={`priority-label ${i.priority}`}>
                        {PRIORITY_LABELS[i.priority]}
                      </span>
                    </td>
                    <td
                      className={
                        i.status !== "resolved" && i.due < at
                          ? "text-amber"
                          : ""
                      }
                    >
                      {dateLabel(i.due, true)}
                      {i.status !== "resolved" && i.due < at && (
                        <small className="table-subtitle">Prazo vencido</small>
                      )}
                    </td>
                    <td>
                      <span className={`issue-status ${i.status}`}>
                        {ISSUE_LABELS[i.status]}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Editar pendência ${i.description}`}
                          onClick={() => setEditing(i)}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Excluir pendência ${i.description}`}
                          onClick={() => setDeleting(i)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Tudo em ordem por aqui"
            description="Nenhuma pendência corresponde aos filtros selecionados."
          />
        )}
      </Panel>
      {editing && (
        <IssueForm
          issue={editing === "new" ? undefined : editing}
          projectId={projectId}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <Confirm
          title="Excluir pendência?"
          description={`«${deleting.description}» e seu histórico serão removidos deste navegador.`}
          onClose={() => setDeleting(null)}
          danger
          onConfirm={(revision) =>
            store.commit(
              (s) => deleteIssue(s, deleting.id),
              "Pendência excluída.",
              revision,
            )
          }
        />
      )}
    </>
  );
}
export function Finance({ projectId }: { projectId?: string }) {
  const { data, store } = useData();
  const [selectedId, setSelectedId] = useState(projectId ?? "");
  const [kind, setKind] = useState("");
  const [editing, setEditing] = useState<Measurement | "new" | null>(null);
  const [deleting, setDeleting] = useState<Measurement | null>(null);
  if (!data) return <Loading />;
  const available = visibleProjects(data).filter(
    (p) => !projectId || p.id === projectId,
  );
  const projects = available.filter((p) => !selectedId || p.id === selectedId);
  const ids = new Set(projects.map((p) => p.id));
  const f = finances({ ...data, projects });
  const entries = data.measurements
    .filter((m) => ids.has(m.projectId) && (!kind || m.kind === kind))
    .sort((a, b) => b.date.localeCompare(a.date));
  const coordinator = data.profile === "coordinator";
  return (
    <>
      {!projectId ? (
        <PageHeading
          eyebrow="CONTROLE FINANCEIRO"
          title="Clareza em cada investimento."
          description="Compare o planejamento e os custos, com visão sobre o saldo disponível."
          actions={
            coordinator &&
            available.length > 0 && (
              <AddButton onClick={() => setEditing("new")}>
                Novo lançamento
              </AddButton>
            )
          }
        />
      ) : (
        <div className="section-toolbar">
          <h2>Financeiro da obra</h2>
          {coordinator && (
            <AddButton onClick={() => setEditing("new")}>
              Novo lançamento
            </AddButton>
          )}
        </div>
      )}
      {!projectId && (
        <div className="filter-bar">
          <Select
            label="Filtrar financeiro por obra"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Todas as obras</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </Select>
          <span className="muted">
            Valores fictícios em reais · lançamentos locais
          </span>
        </div>
      )}
      <div className="metrics-grid finance-metrics">
        <Metric
          label="Orçamento aprovado"
          value={money(f.budget)}
          icon={Wallet}
          hint="Limite aprovado para execução"
        />
        <Metric
          label="Saldo comprometido"
          value={money(f.committed)}
          icon={Landmark}
          hint="Contratado e ainda não realizado"
          accent="purple"
        />
        <Metric
          label="Custo realizado"
          value={money(f.actual)}
          icon={Coins}
          hint="Medições efetivamente registradas"
          accent="blue"
        />
        <Metric
          label="Saldo disponível"
          value={money(f.balance)}
          icon={TrendingUp}
          hint="Orçado − realizado − comprometido"
          accent={f.balance < 0 ? "amber" : "teal"}
        />
      </div>
      {!projectId && (
        <Panel
          title="Evolução do custo realizado"
          subtitle="Valores acumulados a partir das medições registradas"
        >
          <CostChart data={data} projects={projects} />
        </Panel>
      )}
      <Panel
        title="Avanço físico e financeiro"
        subtitle="Indicadores independentes: execução das etapas × consumo do orçamento"
        className="financial-progress-panel"
      >
        {projects.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Físico · etapas ponderadas</th>
                  <th>Financeiro · realizado / orçado</th>
                  <th>Saldo disponível</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const row = finances(data, p.id);
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link className="row-title" href={projectHref(p.id)}>
                          {p.name}
                        </Link>
                        <small className="table-subtitle">{p.code}</small>
                      </td>
                      <td>
                        <Progress value={physicalProgress(p)} />
                      </td>
                      <td>
                        {row.financialProgress === null ? (
                          <span
                            className="soft-badge"
                            title="Percentual não calculável: a obra não tem orçamento aprovado."
                          >
                            Sem orçamento
                          </span>
                        ) : (
                          <Progress
                            value={Math.round(row.financialProgress)}
                            tone="blue"
                            description="Avanço financeiro · custo realizado sobre orçamento"
                          />
                        )}
                      </td>
                      <td className={row.balance < 0 ? "text-amber" : ""}>
                        {money(row.balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
      </Panel>
      <div className="section-toolbar">
        <h2>Histórico de medições e compromissos</h2>
        <Select
          label="Filtrar lançamentos por tipo"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="">Todos os lançamentos</option>
          <option value="actual">Realizado</option>
          <option value="committed">Comprometido</option>
        </Select>
      </div>
      <Panel>
        {entries.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Descrição / obra</th>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  {coordinator && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {entries.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.description}</strong>
                      <small className="table-subtitle">
                        {projects.find((p) => p.id === m.projectId)?.code} ·{" "}
                        {projects.find((p) => p.id === m.projectId)?.name}
                      </small>
                    </td>
                    <td>{dateLabel(m.date, true)}</td>
                    <td>
                      <span
                        className={`soft-badge ${m.kind === "actual" ? "blue" : "purple"}`}
                      >
                        {m.kind === "actual" ? "Realizado" : "Comprometido"}
                      </span>
                    </td>
                    <td className="amount-cell">{money(m.amount)}</td>
                    {coordinator && (
                      <td>
                        <div className="row-actions">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditing(m)}
                            aria-label={`Editar ${m.description}`}
                          >
                            <Pencil size={15} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleting(m)}
                            aria-label={`Excluir ${m.description}`}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Nenhum lançamento encontrado"
            description="Registre uma medição ou ajuste o filtro de tipo de lançamento."
          />
        )}
      </Panel>
      {editing && (
        <MeasurementForm
          entry={editing === "new" ? undefined : editing}
          projectId={projectId ?? (selectedId || undefined)}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <Confirm
          title="Excluir lançamento?"
          description={`O lançamento «${deleting.description}» será removido e os indicadores serão recalculados.`}
          danger
          onClose={() => setDeleting(null)}
          onConfirm={(revision) =>
            store.commit(
              (s) => deleteMeasurement(s, deleting.id),
              "Lançamento excluído.",
              revision,
            )
          }
        />
      )}
    </>
  );
}
