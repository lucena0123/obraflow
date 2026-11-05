"use client";
import { useState } from "react";
import Link from "next/link";
import { Printer, FileText, ShieldCheck, Layers3 } from "lucide-react";
import { useData } from "@/data/store";
import {
  AREAS,
  EMPTY_FILTERS,
  ISSUE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "@/domain/types";
import {
  dateLabel,
  filterProjects,
  finances,
  isDelayed,
  metrics,
  money,
  physicalProgress,
  projectStatus,
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
import { Button } from "@/components/ui/button";
export function Reports() {
  const { data } = useData();
  const at = useToday();
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  if (!data || !at) return <Loading />;
  if (data.profile !== "coordinator")
    return (
      <Panel>
        <Empty
          title="Visão exclusiva da coordenação"
          description="O relatório consolidado está disponível no perfil demonstrativo Coordenador."
          action={<ShieldCheck size={28} />}
        />
      </Panel>
    );
  const projects = filterProjects(visibleProjects(data), filters, at);
  const units = [...new Set(projects.map((p) => p.unit))];
  const reportUnit =
    units.length === 1
      ? units[0]
      : units.length
        ? "Múltiplas unidades"
        : "Nenhuma unidade no recorte";
  const m = metrics(data, projects, at);
  const ids = new Set(projects.map((p) => p.id));
  const issues = data.issues.filter((i) => ids.has(i.projectId));
  const open = issues.filter((i) => i.status !== "resolved");
  const history = projects
    .flatMap((p) => p.history.map((h) => ({ ...h, code: p.code })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);
  return (
    <>
      <div className="no-print">
        <PageHeading
          eyebrow="INTELIGÊNCIA GERENCIAL"
          title="Decisões com perspectiva."
          description="Um retrato consolidado da execução, pronto para a próxima reunião."
          actions={
            <Button onClick={() => window.print()}>
              <Printer size={16} />
              Imprimir relatório
            </Button>
          }
        />
        <FilterBar filters={filters} onChange={setFilters} />
      </div>
      <article className="report-sheet">
        <div className="report-cover">
          <div>
            <span className="report-brand">
              <Layers3 size={24} />
              obra<span>flow</span>
            </span>
            <p>RELATÓRIO GERENCIAL</p>
            <h1>
              Panorama de obras
              <br />e melhorias industriais.
            </h1>
          </div>
          <div className="report-meta">
            <span className="soft-badge">DADOS FICTÍCIOS</span>
            <strong>{reportUnit}</strong>
            {units.length > 1 && <span>{units.join(" · ")}</span>}
            <span>Emitido em {dateLabel(at, true)}</span>
            <span>
              {projects.length} {projects.length === 1 ? "obra" : "obras"} no
              recorte
            </span>
          </div>
        </div>
        <div className="report-body">
          <section className="report-section">
            <div className="report-section-label">
              01 <span>Resumo executivo</span>
            </div>
            <p>
              O portfólio selecionado reúne{" "}
              <strong>
                {m.total} {m.total === 1 ? "obra" : "obras"}
              </strong>
              , sendo {m.active} em andamento, {m.completed} concluídas e{" "}
              {m.delayed} com atraso calculado. O avanço físico médio é de{" "}
              <strong>{m.progress}%</strong>. O orçamento aprovado de{" "}
              <strong>{money(m.budget)}</strong> apresenta {money(m.actual)} em
              custos realizados e {money(m.committed)} em saldo comprometido. Há{" "}
              <strong>{open.length} pendências abertas</strong>, das quais{" "}
              {m.critical} são críticas. O excesso agregado sobre o orçamento é
              de {money(m.overrun)}.
            </p>
            {Object.values(filters).some(Boolean) && (
              <p className="report-filter-note">
                Recorte aplicado:{" "}
                {Object.values(filters).filter(Boolean).join(" · ")}. Situações
                e responsáveis seguem os filtros selecionados na tela.
              </p>
            )}
            <div className="report-kpis">
              <div>
                <span>Avanço físico médio</span>
                <strong>{m.progress}%</strong>
              </div>
              <div>
                <span>Custo realizado</span>
                <strong>{money(m.actual)}</strong>
              </div>
              <div>
                <span>Saldo disponível</span>
                <strong>{money(m.balance)}</strong>
              </div>
              <div>
                <span>Obras com atraso</span>
                <strong>{m.delayed}</strong>
              </div>
            </div>
          </section>
          <section className="report-section">
            <div className="report-section-label">
              02 <span>Execução e custos por obra</span>
            </div>
            <div className="table-scroll">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Obra / área</th>
                    <th>Físico</th>
                    <th>Financeiro¹</th>
                    <th>Orçamento</th>
                    <th>Realizado</th>
                    <th>Comprometido</th>
                    <th>Saldo²</th>
                    <th>Desvio³</th>
                    <th>Situação / prazo</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const f = finances(data, p.id);
                    return (
                      <tr key={p.id}>
                        <td>
                          <strong>
                            {p.code} · {p.name}
                          </strong>
                          <small className="table-subtitle">{p.area}</small>
                        </td>
                        <td>{physicalProgress(p)}%</td>
                        <td>
                          {f.financialProgress === null
                            ? "Sem orçamento"
                            : `${Math.round(f.financialProgress)}%`}
                        </td>
                        <td>{money(p.budget)}</td>
                        <td>{money(f.actual)}</td>
                        <td>{money(f.committed)}</td>
                        <td>{money(f.balance)}</td>
                        <td>{money(f.overrun)}</td>
                        <td>
                          {STATUS_LABELS[projectStatus(p, at)]}
                          <small className="table-subtitle">
                            {dateLabel(p.end, true)}
                          </small>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!projects.length && (
                <p className="simple-empty">Nenhuma obra no recorte.</p>
              )}
            </div>
            <p className="report-footnote">
              ¹ Financeiro = custo realizado / orçamento. Sem orçamento, o
              percentual não é calculável. O avanço físico deriva dos pesos das
              etapas. ² Saldo = orçamento − realizado − saldo comprometido. ³
              Desvio = excesso de realizado + comprometido sobre o orçamento,
              com mínimo zero. O indicador agregado considera o orçamento total
              do recorte; a tabela também revela desvios individuais.
            </p>
          </section>
          <section className="report-section">
            <div className="report-section-label">
              03 <span>Atrasos e pontos de atenção</span>
            </div>
            {projects.some((p) => isDelayed(p, at)) ? (
              <div className="report-delay-list">
                {projects
                  .filter((p) => isDelayed(p, at))
                  .map((p) => (
                    <div key={p.id}>
                      <strong>
                        {p.code} · {p.name}
                      </strong>
                      <p>
                        Entrega prevista: {dateLabel(p.end, true)} · avanço{" "}
                        {physicalProgress(p)}%.{" "}
                        {p.stages
                          .filter((s) => s.end < at && s.progress < 100)
                          .map(
                            (s) =>
                              `${s.name} (${s.progress}%, prazo ${dateLabel(s.end)})`,
                          )
                          .join("; ")}
                        .
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p>Nenhuma obra com atraso no recorte selecionado.</p>
            )}
          </section>
          <section className="report-section">
            <div className="report-section-label">
              04 <span>Pendências e resoluções</span>
            </div>
            <div className="table-scroll">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Pendência</th>
                    <th>Obra</th>
                    <th>Prioridade</th>
                    <th>Prazo</th>
                    <th>Status / resolução</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((i) => (
                    <tr key={i.id}>
                      <td>{i.description}</td>
                      <td>
                        {projects.find((p) => p.id === i.projectId)?.code}
                      </td>
                      <td>{PRIORITY_LABELS[i.priority]}</td>
                      <td>{dateLabel(i.due, true)}</td>
                      <td>
                        {ISSUE_LABELS[i.status]}
                        {i.resolution && (
                          <small className="table-subtitle">
                            {i.resolution}
                          </small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!issues.length && <p>Nenhuma pendência neste recorte.</p>}
            </div>
          </section>
          <section className="report-section">
            <div className="report-section-label">
              05 <span>Indicadores por área</span>
            </div>
            <div className="report-areas">
              {AREAS.map((a) => {
                const group = projects.filter((p) => p.area === a);
                return (
                  <div key={a}>
                    <strong>{a}</strong>
                    <span>
                      {group.length} {group.length === 1 ? "obra" : "obras"} ·{" "}
                      {group.length
                        ? Math.round(
                            group.reduce(
                              (sum, p) => sum + physicalProgress(p),
                              0,
                            ) / group.length,
                          )
                        : 0}
                      % físico
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="report-section">
            <div className="report-section-label">
              06 <span>Atualizações recentes</span>
            </div>
            {history.map((h) => (
              <div className="report-update" key={h.id}>
                <span>
                  {dateLabel(h.at, true)} · {h.code}
                </span>
                <p>
                  {h.text}
                  <small>Por {h.actor}</small>
                </p>
              </div>
            ))}
            {!history.length && <p>Sem atualizações neste recorte.</p>}
          </section>
          <div className="report-end">
            <FileText size={15} />
            <span>
              ObraFlow · relatório demonstrativo · dados locais e fictícios ·
              sem integrações externas
            </span>
            <Link href="/obras" className="no-print">
              Consultar obras
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
