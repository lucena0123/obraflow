"use client";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  HardHat,
  CircleCheck,
  Clock3,
  Wallet,
  CalendarDays,
  CircleAlert,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useData } from "@/data/store";
import { AREAS, EMPTY_FILTERS, PRIORITY_LABELS } from "@/domain/types";
import {
  compactMoney,
  dateLabel,
  filterProjects,
  metrics,
  physicalProgress,
  visibleProjects,
} from "@/domain/calculations";
import {
  PageHeading,
  Metric,
  Panel,
  FilterBar,
  ProjectTable,
  TextLink,
  Progress,
  Loading,
  useToday,
} from "@/components/common";
import { ProjectForm } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { BudgetChart } from "@/components/charts";

export function Dashboard() {
  const { data } = useData();
  const at = useToday();
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [create, setCreate] = useState(false);
  if (!data || !at) return <Loading />;
  const projects = filterProjects(visibleProjects(data), filters, at);
  const m = metrics(data, projects, at);
  const ids = new Set(projects.map((p) => p.id));
  const critical = data.issues
    .filter((i) => ids.has(i.projectId) && i.status !== "resolved")
    .sort(
      (a, b) =>
        ["critical", "high", "medium", "low"].indexOf(a.priority) -
        ["critical", "high", "medium", "low"].indexOf(b.priority),
    )
    .slice(0, 3);
  return (
    <>
      <PageHeading
        eyebrow="VISÃO EXECUTIVA"
        title="Cada etapa sob controle."
        description="Uma visão clara do que acontece nas suas obras, do campo ao resultado."
        actions={
          <>
            <span className="date-pill">
              <CalendarDays size={15} />
              {dateLabel(at, true)}
            </span>
            {data.profile === "coordinator" && (
              <Button onClick={() => setCreate(true)}>
                <span className="plus-sign">+</span> Nova obra
              </Button>
            )}
          </>
        }
      />
      <div className="overview-tabs">
        <span className="selected">Panorama da operação</span>
        <Link href="/cronograma">
          Planejamento <ArrowUpRight size={13} />
        </Link>
        <div className="live-label">
          <span className="tiny-dot" />
          Visão atual · dados demonstrativos
        </div>
      </div>
      <FilterBar filters={filters} onChange={setFilters} search={false} />
      <div className="metrics-grid">
        <Metric
          label="Obras no portfólio"
          value={String(m.total).padStart(2, "0")}
          icon={HardHat}
          hint={`${m.active} em andamento`}
        />
        <Metric
          label="Obras atrasadas"
          value={String(m.delayed).padStart(2, "0")}
          icon={Clock3}
          hint={
            m.delayed
              ? "Frentes que precisam de atenção"
              : "Prazos sob controle"
          }
          accent="amber"
        />
        <Metric
          label="Obras concluídas"
          value={String(m.completed).padStart(2, "0")}
          icon={CircleCheck}
          hint="Entregas finalizadas"
          accent="blue"
        />
        <Metric
          label="Orçamento aprovado"
          value={compactMoney(m.budget)}
          icon={Wallet}
          hint={`${compactMoney(m.actual)} em custos registrados`}
          accent="purple"
        />
      </div>
      <div className="dashboard-charts">
        <Panel
          title="Orçamento × execução"
          subtitle="Distribuição por área · valores em R$ mil"
          action={
            <div className="chart-legend">
              <span>
                <i />
                Orçado
              </span>
              <span>
                <i />
                Realizado
              </span>
            </div>
          }
        >
          <BudgetChart data={data} projects={projects} />
          <div className="chart-bottom">
            <span>
              <span className="tiny-dot" />
              Acompanhe cada real investido.
            </span>
            <TextLink href="/financeiro">Ver financeiro</TextLink>
          </div>
        </Panel>
        <Panel
          className="progress-panel"
          title="Ritmo da operação"
          subtitle="Avanço físico médio do portfólio"
          action={<Activity size={18} className="muted" />}
        >
          <div className="operation-progress">
            <div
              className="progress-ring"
              style={
                {
                  "--progress": `${m.progress * 3.6}deg`,
                } as React.CSSProperties
              }
            >
              <div>
                <strong>
                  {m.progress}
                  <span>%</span>
                </strong>
                <small>AVANÇO FÍSICO</small>
              </div>
            </div>
            <div className="progress-summary">
              <span>
                <i className="tiny-dot" />
                Em andamento<strong>{m.active}</strong>
              </span>
              <span>
                <i className="tiny-dot blue" />
                Concluídas<strong>{m.completed}</strong>
              </span>
              <span>
                <i className="tiny-dot amber" />
                Atrasadas<strong>{m.delayed}</strong>
              </span>
            </div>
          </div>
          <div className="insight-note">
            <CircleAlert size={17} />
            <p>
              {m.critical ? (
                <>
                  <strong>{m.critical} pendências críticas</strong> precisam de
                  atenção da sua equipe.
                </>
              ) : (
                <>
                  <strong>Nenhuma pendência crítica</strong> no portfólio
                  selecionado.
                </>
              )}
            </p>
            <Link href="/pendencias" aria-label="Consultar pendências">
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </Panel>
      </div>
      <Panel
        title="Suas obras, em movimento"
        subtitle={`${projects.length} obras no recorte selecionado`}
        action={<TextLink href="/obras">Ver todas as obras</TextLink>}
        className="portfolio-panel"
      >
        <ProjectTable projects={projects.slice(0, 5)} at={at} />
        {projects.length > 5 && (
          <div className="table-footer">
            <span>Exibindo 5 de {projects.length} obras</span>
            <Link href="/obras">
              Explorar portfólio completo <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </Panel>
      <div className="dashboard-bottom">
        <Panel
          title="Atenção aos próximos passos"
          subtitle="Pendências abertas por prioridade"
          action={<TextLink href="/pendencias">Gerenciar</TextLink>}
        >
          <div className="attention-list">
            {critical.length ? (
              critical.map((i) => (
                <Link key={i.id} href="/pendencias">
                  <span className={`priority-mark ${i.priority}`}>
                    <CircleAlert size={17} />
                  </span>
                  <span>
                    <strong>{i.description}</strong>
                    <small>
                      {projects.find((p) => p.id === i.projectId)?.code} · prazo{" "}
                      {dateLabel(i.due)}
                    </small>
                  </span>
                  <span className={`priority-label ${i.priority}`}>
                    {PRIORITY_LABELS[i.priority]}
                  </span>
                  <ArrowUpRight size={15} />
                </Link>
              ))
            ) : (
              <p className="simple-empty">
                Nenhuma pendência aberta neste recorte.
              </p>
            )}
          </div>
        </Panel>
        <Panel
          title="Avanço por área"
          subtitle="Média física das obras selecionadas"
        >
          <div className="area-list">
            {AREAS.map((area, index) => {
              const group = projects.filter((p) => p.area === area);
              return (
                <div key={area}>
                  <span className={`area-icon area-${index}`}>
                    <HardHat size={15} />
                  </span>
                  <span>
                    {area}
                    <small>
                      {group.length} {group.length === 1 ? "obra" : "obras"}
                    </small>
                  </span>
                  <Progress
                    value={
                      group.length
                        ? Math.round(
                            group.reduce((s, p) => s + physicalProgress(p), 0) /
                              group.length,
                          )
                        : 0
                    }
                    tone={index === 1 ? "blue" : "teal"}
                  />
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
      {create && <ProjectForm onClose={() => setCreate(false)} />}
    </>
  );
}
