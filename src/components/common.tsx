"use client";
import Link from "next/link";
import { projectHref } from "@/lib/routes";
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpRight,
  CircleDashed,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState, useSyncExternalStore } from "react";
import { useData } from "@/data/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AREAS,
  EMPTY_FILTERS,
  PEOPLE,
  STATUS_LABELS,
  type Filters,
  type Project,
  type ProjectStatus,
} from "@/domain/types";
import {
  dateLabel,
  isDelayed,
  person,
  physicalProgress,
  projectStatus,
  today,
} from "@/domain/calculations";

const clockSubscribe = (callback: () => void) => {
  const id = setInterval(callback, 60000);
  window.addEventListener("obraflow:clock", callback);
  return () => {
    clearInterval(id);
    window.removeEventListener("obraflow:clock", callback);
  };
};
export function useToday() {
  return useSyncExternalStore(clockSubscribe, today, () => "");
}
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">
          <span />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  );
}
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Metric({
  label,
  value,
  icon: Icon,
  hint,
  accent = "teal",
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint: string;
  accent?: string;
}) {
  return (
    <div className={`metric metric-${accent}`}>
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">
          <Icon size={18} />
        </span>
      </div>
      <strong>{value}</strong>
      <div className="metric-hint">
        <span className="tiny-dot" />
        {hint}
      </div>
      <svg viewBox="0 0 120 38" className="spark" aria-hidden="true">
        <path
          d="M0 34L14 29L26 31L40 17L54 22L69 13L82 19L99 4L120 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
export function Progress({
  value,
  label = true,
  tone = "teal",
  description = "Avanço físico",
}: {
  value: number;
  label?: boolean;
  tone?: string;
  description?: string;
}) {
  return (
    <div className={`progress-wrap ${tone}`}>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={description}
        aria-valuenow={Math.min(100, Math.max(0, value))}
        aria-valuetext={`${value}%`}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      {label && <span>{value}%</span>}
    </div>
  );
}
export function StatusBadge({ status }: { status: ProjectStatus | "delayed" }) {
  return (
    <span className={`status-badge ${status}`}>
      <i />
      {STATUS_LABELS[status]}
    </span>
  );
}
export function Avatar({
  id,
  showName = false,
}: {
  id: string;
  showName?: boolean;
}) {
  const p = person(id);
  return (
    <span className="person">
      <span className={`avatar ${p.color}`}>{p.initials}</span>
      {showName && (
        <span>
          {p.name}
          <small>{p.team}</small>
        </span>
      )}
    </span>
  );
}
export function Empty({
  title = "Nenhum resultado por aqui",
  description = "Ajuste os filtros ou crie um novo registro para começar.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <CircleDashed size={34} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading-state" role="status">
      <div className="loading-mark" />
      <p>Preparando seu espaço de trabalho…</p>
    </div>
  );
}
export function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <select aria-label={label} {...props}>
      {children}
    </select>
  );
}
export function FilterBar({
  filters,
  onChange,
  search = true,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  search?: boolean;
}) {
  const set = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value });
  return (
    <div className="filter-bar">
      <span className="filter-label">
        <SlidersHorizontal size={15} />
        Filtros
      </span>
      {search && (
        <div className="search-input">
          <Search size={16} />
          <Input
            aria-label="Buscar obras"
            placeholder="Buscar obra ou código…"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
          />
        </div>
      )}
      <Select
        label="Filtrar por área"
        value={filters.area}
        onChange={(e) => set("area", e.target.value)}
      >
        <option value="">Todas as áreas</option>
        {AREAS.map((a) => (
          <option key={a}>{a}</option>
        ))}
      </Select>
      <Select
        label="Filtrar por equipe"
        value={filters.team}
        onChange={(e) => set("team", e.target.value)}
      >
        <option value="">Todas as equipes</option>
        {[
          ...new Set(PEOPLE.filter((p) => p.id !== "caio").map((p) => p.team)),
        ].map((t) => (
          <option key={t}>{t}</option>
        ))}
      </Select>
      <Select
        label="Filtrar por responsável"
        value={filters.owner}
        onChange={(e) => set("owner", e.target.value)}
      >
        <option value="">Responsáveis</option>
        {PEOPLE.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
      <Select
        label="Filtrar por situação"
        value={filters.status}
        onChange={(e) => set("status", e.target.value)}
      >
        <option value="">Todas as situações</option>
        {Object.entries(STATUS_LABELS).map(([key, value]) => (
          <option key={key} value={key}>
            {value}
          </option>
        ))}
      </Select>
      {Object.values(filters).some(Boolean) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange({ ...EMPTY_FILTERS })}
          aria-label="Limpar filtros"
        >
          <X size={16} />
        </Button>
      )}
    </div>
  );
}
export function ProjectTable({
  projects,
  at,
}: {
  projects: Project[];
  at: string;
}) {
  if (!projects.length) return <Empty />;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Obra / projeto</th>
            <th>Responsável</th>
            <th>Avanço físico</th>
            <th>Prazo previsto</th>
            <th>Situação</th>
            <th>
              <span className="sr-only">Abrir</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p, i) => (
            <tr key={p.id}>
              <td>
                <Link href={projectHref(p.id)} className="project-link">
                  <span className={`project-symbol symbol-${i % 4}`}>
                    <span>0{i + 1}</span>
                  </span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.code} <span className="separator-dot">·</span> {p.area}
                    </small>
                  </span>
                </Link>
              </td>
              <td>
                <Avatar id={p.ownerId} showName />
              </td>
              <td className="progress-cell">
                <Progress
                  value={physicalProgress(p)}
                  tone={isDelayed(p, at) ? "amber" : "teal"}
                />
              </td>
              <td>
                <span className={isDelayed(p, at) ? "text-amber" : ""}>
                  {dateLabel(p.end, true)}
                </span>
              </td>
              <td>
                <StatusBadge status={projectStatus(p, at)} />
              </td>
              <td>
                <Link
                  className="icon-link"
                  aria-label={`Abrir ${p.name}`}
                  href={projectHref(p.id)}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Modal({
  title,
  description,
  open = true,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  description: string;
  open?: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className={wide ? "dialog-wide" : ""}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function Confirm({
  title,
  description,
  onClose,
  onConfirm,
  danger = false,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: (revision: string) => boolean | void | Promise<boolean | void>;
  danger?: boolean;
}) {
  const { data } = useData();
  const [revision] = useState(data?.revision ?? "unavailable");
  const [saving, setSaving] = useState(false);
  return (
    <Modal title={title} description={description} onClose={onClose}>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant={danger ? "destructive" : "default"}
          disabled={saving}
          onClick={async () => {
            if (saving) return;
            setSaving(true);
            if ((await onConfirm(revision)) !== false) onClose();
            setSaving(false);
          }}
        >
          Confirmar
        </Button>
      </DialogFooter>
    </Modal>
  );
}
export function TextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link className="text-link" href={href}>
      {children}
      <ChevronRight size={15} />
    </Link>
  );
}
