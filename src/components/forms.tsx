"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { Plus, ImagePlus, X, Info } from "lucide-react";
import { useData } from "@/data/store";
import {
  AREAS,
  PEOPLE,
  STATUS_LABELS,
  PRIORITY_LABELS,
  ISSUE_LABELS,
  type Project,
  type Stage,
  type Issue,
  type Measurement,
  type DemoState,
} from "@/domain/types";
import { dateLabel, today, visibleProjects } from "@/domain/calculations";
import {
  saveProject,
  saveStage,
  saveJournal,
  saveIssue,
  saveMeasurement,
  uid,
} from "@/domain/commands";
import { Modal, Select } from "./common";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

function Field({
  label,
  children,
  full = false,
  hint,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
  hint?: string;
}) {
  return (
    <label className={`form-field ${full ? "full" : ""}`}>
      <Label asChild>
        <span>{label}</span>
      </Label>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const num = (form: FormData, key: string) => Number(form.get(key));
function Actions({
  onClose,
  error,
  saving,
  label = "Salvar alterações",
}: {
  onClose: () => void;
  error: string;
  saving: boolean;
  label?: string;
}) {
  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <span>Dados fictícios · armazenamento local</span>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando…" : label}
        </Button>
      </div>
    </>
  );
}
function useSave(onClose: () => void) {
  const { store, data } = useData();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [revision] = useState(data?.revision);
  return {
    error,
    saving,
    run: async (command: (s: DemoState) => void, message?: string) => {
      if (saving) return;
      setSaving(true);
      if (await store.commit(command, message, revision)) onClose();
      else
        setError(
          store.getSnapshot().notice?.message ?? "Não foi possível salvar.",
        );
      setSaving(false);
    },
  };
}
function PeopleOptions() {
  return (
    <>
      {PEOPLE.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} · fictício
        </option>
      ))}
    </>
  );
}
export function ProjectForm({
  project,
  onClose,
}: {
  project?: Project;
  onClose: () => void;
}) {
  const { data } = useData();
  const { error, run, saving } = useSave(onClose);
  const [status, setStatus] = useState<Project["status"]>(
    project?.status ?? "planned",
  );
  if (!data) return null;
  const nextCode = `OB-${String(Math.max(0, ...data.projects.map((p) => Number(p.code.match(/\d+$/)?.[0]) || 0)) + 1).padStart(3, "0")}`;
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const input: Project = {
      id: project?.id ?? uid(),
      code: str(f, "code"),
      name: str(f, "name"),
      description: str(f, "description"),
      unit: str(f, "unit"),
      area: str(f, "area") as Project["area"],
      ownerId: str(f, "ownerId"),
      start: str(f, "start"),
      end: str(f, "end"),
      actualStart: str(f, "actualStart"),
      actualEnd: str(f, "actualEnd"),
      budget: num(f, "budget"),
      status,
      stages: project?.stages ?? [],
      history: project?.history ?? [],
    };
    run(
      (s) => saveProject(s, input),
      project
        ? "Cadastro atualizado."
        : "Obra criada. Adicione as etapas no detalhamento.",
    );
  }
  return (
    <Modal
      title={project ? "Editar obra" : "Nova obra"}
      description="Organize o escopo, os responsáveis e o planejamento da intervenção."
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Código">
            <Input
              name="code"
              defaultValue={project?.code ?? nextCode}
              required
              minLength={3}
              maxLength={25}
            />
          </Field>
          <Field label="Unidade simulada">
            <Input
              name="unit"
              defaultValue={project?.unit ?? "Unidade Horizonte"}
              required
              minLength={3}
              maxLength={80}
            />
          </Field>
          <Field label="Nome da obra" full>
            <Input
              name="name"
              defaultValue={project?.name}
              placeholder="Ex.: Ampliação do galpão de apoio"
              required
              minLength={3}
              maxLength={120}
            />
          </Field>
          <Field label="Descrição e escopo" full>
            <Textarea
              name="description"
              defaultValue={project?.description}
              placeholder="Descreva o escopo previsto…"
              required
              minLength={3}
              maxLength={2000}
            />
          </Field>
          <Field label="Área responsável">
            <Select
              name="area"
              label="Área responsável"
              defaultValue={project?.area ?? AREAS[0]}
            >
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Select>
          </Field>
          <Field label="Responsável técnico fictício">
            <Select
              name="ownerId"
              label="Responsável técnico fictício"
              defaultValue={project?.ownerId ?? "lia"}
            >
              <PeopleOptions />
            </Select>
          </Field>
          <Field label="Início previsto">
            <Input
              type="date"
              name="start"
              required
              defaultValue={project?.start ?? today()}
            />
          </Field>
          <Field label="Término previsto">
            <Input
              type="date"
              name="end"
              required
              defaultValue={project?.end ?? today()}
            />
          </Field>
          <Field label="Orçamento aprovado (R$)">
            <Input
              type="number"
              name="budget"
              min="0"
              max="1000000000000"
              step="0.01"
              required
              defaultValue={project?.budget ?? 0}
            />
          </Field>
          <Field label="Situação">
            <Select
              name="status"
              label="Situação da obra"
              value={status}
              onChange={(e) => setStatus(e.target.value as Project["status"])}
            >
              {Object.entries(STATUS_LABELS)
                .filter(([k]) => k !== "delayed")
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Início realizado">
            <Input
              type="date"
              name="actualStart"
              required={status === "active" || status === "paused"}
              max={today()}
              defaultValue={project?.actualStart}
            />
          </Field>
          <Field
            label="Término realizado"
            hint="Preencha ao concluir todas as etapas."
          >
            <Input
              type="date"
              name="actualEnd"
              max={today()}
              defaultValue={project?.actualEnd}
            />
          </Field>
        </div>
        <div className="inline-note">
          <Info size={16} />O atraso é calculado pelas datas e pelo avanço das
          etapas.{" "}
          {project
            ? "Alterar o período exige manter as etapas dentro dele."
            : "Após cadastrar, abra a obra para adicionar as etapas."}
        </div>
        <Actions
          saving={saving}
          onClose={onClose}
          error={error}
          label={project ? "Salvar obra" : "Criar obra"}
        />
      </form>
    </Modal>
  );
}
export function StageForm({
  project,
  stage,
  onClose,
}: {
  project: Project;
  stage?: Stage;
  onClose: () => void;
}) {
  const { error, run, saving } = useSave(onClose);
  const { data } = useData();
  const supervisor = data?.profile === "supervisor";
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const input: Stage = {
      id: stage?.id ?? uid(),
      name: str(f, "name"),
      ownerId: supervisor && stage ? stage.ownerId : str(f, "ownerId"),
      start: str(f, "start"),
      end: str(f, "end"),
      progress: num(f, "progress"),
      weight: num(f, "weight"),
      dependencyId:
        supervisor && stage
          ? stage.dependencyId
          : str(f, "dependencyId") || null,
    };
    run(
      (s) => saveStage(s, project.id, input),
      "Etapa salva e avanço recalculado.",
    );
  }
  return (
    <Modal
      title={stage ? "Editar etapa" : "Adicionar etapa"}
      description={`${project.code} · ${project.name}`}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Nome da etapa" full>
            <Input
              name="name"
              defaultValue={stage?.name}
              readOnly={supervisor}
              required
              minLength={3}
              maxLength={100}
            />
          </Field>
          <Field label="Início previsto">
            <Input
              type="date"
              name="start"
              min={project.start}
              max={project.end}
              readOnly={supervisor}
              defaultValue={stage?.start ?? project.start}
              required
            />
          </Field>
          <Field label="Término previsto">
            <Input
              type="date"
              name="end"
              min={project.start}
              max={project.end}
              readOnly={supervisor}
              defaultValue={stage?.end ?? project.end}
              required
            />
          </Field>
          <Field label="Responsável fictício" full>
            <Select
              name="ownerId"
              label="Responsável da etapa"
              disabled={supervisor}
              defaultValue={stage?.ownerId ?? project.ownerId}
            >
              <PeopleOptions />
            </Select>
          </Field>
          <Field label="Avanço físico (%)">
            <Input
              name="progress"
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={stage?.progress ?? 0}
              required
            />
          </Field>
          <Field
            label="Peso no avanço global"
            hint="O cálculo normaliza a soma dos pesos."
          >
            <Input
              name="weight"
              readOnly={supervisor}
              type="number"
              min="1"
              max="1000"
              defaultValue={stage?.weight ?? 25}
              required
            />
          </Field>
          <Field label="Depende da conclusão prevista de" full>
            <Select
              name="dependencyId"
              label="Dependência da etapa"
              disabled={supervisor}
              defaultValue={stage?.dependencyId ?? ""}
            >
              <option value="">Sem dependência</option>
              {project.stages
                .filter((s) => s.id !== stage?.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · até {dateLabel(s.end)}
                  </option>
                ))}
            </Select>
          </Field>
        </div>
        {supervisor && (
          <div className="inline-note">
            <Info size={16} />O Supervisor atualiza somente o avanço. Pesos,
            datas e demais dados do planejamento são definidos pelo Coordenador.
          </div>
        )}
        <Actions
          saving={saving}
          onClose={onClose}
          error={error}
          label="Salvar etapa"
        />
      </form>
    </Modal>
  );
}
export function JournalForm({
  projectId,
  onClose,
}: {
  projectId?: string;
  onClose: () => void;
}) {
  const { data, store } = useData();
  const { error, run, saving } = useSave(onClose);
  const [selectedId, setSelectedId] = useState(projectId ?? "");
  const [images, setImages] = useState<{ name: string; dataUrl: string }[]>([]);
  const [reading, setReading] = useState(false);
  if (!data) return null;
  const projects = visibleProjects(data).filter((p) =>
    ["active", "paused"].includes(p.status),
  );
  const selected = projects.find((p) => p.id === selectedId) ?? projects[0];
  async function attach(files: FileList | null) {
    if (!files) return;
    if (images.length + files.length > 3) {
      store.notify("Anexe até três imagens por registro.", true);
      return;
    }
    const all = Array.from(files);
    if (
      all.some(
        (file) =>
          !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
          file.size > 500000,
      )
    ) {
      store.notify("Use imagens PNG, JPEG ou WebP de até 500 KB.", true);
      return;
    }
    setReading(true);
    try {
      const loaded = await Promise.all(
        all.map(
          (file) =>
            new Promise<{ name: string; dataUrl: string }>(
              (resolve, reject) => {
                const r = new FileReader();
                r.onload = () =>
                  resolve({ name: file.name, dataUrl: String(r.result) });
                r.onerror = reject;
                r.readAsDataURL(file);
              },
            ),
        ),
      );
      setImages((prev) => [...prev, ...loaded]);
    } catch {
      store.notify("Não foi possível ler a imagem. Tente outro arquivo.", true);
    } finally {
      setReading(false);
    }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const f = new FormData(e.currentTarget);
    run(
      (s) =>
        saveJournal(s, {
          id: uid(),
          projectId: selected.id,
          date: str(f, "date"),
          activity: str(f, "activity"),
          workforce: num(f, "workforce"),
          stageId: str(f, "stageId"),
          progress: num(f, "progress"),
          impediment: str(f, "impediment"),
          occurrence: str(f, "occurrence"),
          images,
          authorId: "caio",
          createdAt: new Date().toISOString(),
        }),
      "Diário registrado. Avanço atualizado em todos os módulos.",
    );
  }
  return (
    <Modal
      title="Novo registro de campo"
      description="Documente a execução e atualize o avanço físico com uma única ação."
      onClose={onClose}
      wide
    >
      {!selected ? (
        <p className="inline-note">
          Inicie uma obra para registrar atividades de campo.
        </p>
      ) : (
        <form onSubmit={submit}>
          <div className="form-grid">
            <Field label="Obra vinculada" full>
              <Select
                label="Obra do diário"
                value={selected.id}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={!!projectId}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Data do registro">
              <Input
                name="date"
                type="date"
                min={selected.start}
                max={today()}
                defaultValue={today()}
                required
              />
            </Field>
            <Field label="Mão de obra (pessoas)">
              <Input
                name="workforce"
                type="number"
                min="1"
                max="10000"
                defaultValue={6}
                required
              />
            </Field>
            <Field label="Atividades executadas" full>
              <Textarea
                name="activity"
                minLength={8}
                maxLength={3000}
                placeholder="Descreva os serviços realizados no turno…"
                required
              />
            </Field>
            <Field label="Etapa atualizada">
              <Select
                key={selected.id}
                name="stageId"
                label="Etapa do diário"
                required
              >
                <option value="">Selecione uma etapa</option>
                {selected.stages.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.name} · atual {s.progress}%
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Novo avanço da etapa (%)">
              <Input
                type="number"
                name="progress"
                min="0"
                max="100"
                required
                placeholder="0 a 100"
              />
            </Field>
            <Field label="Impedimentos" full>
              <Textarea
                name="impediment"
                maxLength={2000}
                placeholder="Algo impediu a execução? (opcional)"
              />
            </Field>
            <Field label="Ocorrências e observações" full>
              <Textarea
                name="occurrence"
                maxLength={2000}
                placeholder="Registre informações adicionais (opcional)"
              />
            </Field>
            <div className="form-field full">
              <span className="field-label">
                Imagens demonstrativas (opcional)
              </span>
              <label className={`upload-zone ${reading ? "disabled" : ""}`}>
                <ImagePlus size={22} />
                <span>
                  {reading ? "Lendo imagens…" : "Selecionar imagens"}
                  <small>
                    Até 3 arquivos PNG, JPEG ou WebP · 500 KB por imagem
                  </small>
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  disabled={reading}
                  onChange={(e) => {
                    void attach(e.target.files);
                    e.target.value = "";
                  }}
                  aria-label="Anexar imagens demonstrativas"
                />
              </label>
              <div className="attachment-list">
                {images.map((img, i) => (
                  <span key={`${img.name}-${i}`}>
                    {img.name}
                    <button
                      type="button"
                      onClick={() =>
                        setImages((prev) => prev.filter((_, k) => k !== i))
                      }
                      aria-label={`Remover ${img.name}`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="inline-note">
            <Info size={16} />O avanço do diário não pode retroceder. Correções
            ficam disponíveis na edição da etapa.
          </div>
          {reading ? (
            <p role="status">Aguarde a leitura dos anexos.</p>
          ) : (
            <Actions
              saving={saving}
              onClose={onClose}
              error={error}
              label="Registrar diário"
            />
          )}
        </form>
      )}
    </Modal>
  );
}
export function IssueForm({
  issue,
  projectId,
  onClose,
}: {
  issue?: Issue;
  projectId?: string;
  onClose: () => void;
}) {
  const { data } = useData();
  const { error, run, saving } = useSave(onClose);
  const [status, setStatus] = useState<Issue["status"]>(
    issue?.status ?? "open",
  );
  if (!data) return null;
  const projects = visibleProjects(data);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const input: Issue = {
      id: issue?.id ?? uid(),
      projectId: issue?.projectId ?? projectId ?? str(f, "projectId"),
      description: str(f, "description"),
      ownerId: str(f, "ownerId"),
      priority: str(f, "priority") as Issue["priority"],
      due: str(f, "due"),
      status,
      resolution: str(f, "resolution"),
      history: issue?.history ?? [],
    };
    run(
      (s) => saveIssue(s, input),
      status === "resolved"
        ? "Pendência resolvida. Histórico atualizado."
        : "Pendência salva.",
    );
  }
  return (
    <Modal
      title={issue ? "Atualizar pendência" : "Nova pendência"}
      description="Registre o impedimento e mantenha um responsável claro pela resolução."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Obra vinculada" full>
            <Select
              name="projectId"
              label="Obra da pendência"
              defaultValue={issue?.projectId ?? projectId ?? projects[0]?.id}
              disabled={!!issue || !!projectId}
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Descrição" full>
            <Textarea
              name="description"
              defaultValue={issue?.description}
              required
              minLength={5}
              maxLength={2000}
            />
          </Field>
          <Field label="Responsável fictício" full>
            <Select
              name="ownerId"
              label="Responsável da pendência"
              defaultValue={issue?.ownerId ?? "lia"}
            >
              <PeopleOptions />
            </Select>
          </Field>
          <Field label="Prioridade">
            <Select
              name="priority"
              label="Prioridade"
              defaultValue={issue?.priority ?? "medium"}
            >
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prazo">
            <Input
              type="date"
              name="due"
              required
              defaultValue={issue?.due ?? today()}
            />
          </Field>
          <Field label="Status" full>
            <Select
              label="Status da pendência"
              value={status}
              onChange={(e) => setStatus(e.target.value as Issue["status"])}
            >
              {Object.entries(ISSUE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          {status === "resolved" && (
            <Field label="Como foi resolvida?" full>
              <Textarea
                name="resolution"
                defaultValue={issue?.resolution}
                minLength={5}
                maxLength={2000}
                required
              />
            </Field>
          )}
        </div>
        {issue && (
          <div className="compact-history">
            <h4>Histórico da pendência</h4>
            {[...issue.history].reverse().map((h) => (
              <div key={h.id}>
                <span>
                  {dateLabel(h.at)} · {h.actor}
                </span>
                <p>{h.text}</p>
              </div>
            ))}
          </div>
        )}
        <Actions
          saving={saving}
          onClose={onClose}
          error={error}
          label={
            status === "resolved" ? "Salvar resolução" : "Salvar pendência"
          }
        />
      </form>
    </Modal>
  );
}
export function MeasurementForm({
  entry,
  projectId,
  onClose,
}: {
  entry?: Measurement;
  projectId?: string;
  onClose: () => void;
}) {
  const { data } = useData();
  const { error, run, saving } = useSave(onClose);
  if (!data) return null;
  const projects = visibleProjects(data);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const input: Measurement = {
      id: entry?.id ?? uid(),
      projectId: entry?.projectId ?? projectId ?? str(f, "projectId"),
      date: str(f, "date"),
      description: str(f, "description"),
      amount: num(f, "amount"),
      kind: str(f, "kind") as Measurement["kind"],
      authorId: "caio",
    };
    run(
      (s) => saveMeasurement(s, input),
      "Lançamento salvo. Indicadores financeiros atualizados.",
    );
  }
  return (
    <Modal
      title={entry ? "Editar lançamento" : "Novo lançamento financeiro"}
      description="Medições e compromissos fictícios. Não há conexão com sistemas corporativos."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Obra vinculada" full>
            <Select
              name="projectId"
              label="Obra do lançamento"
              defaultValue={entry?.projectId ?? projectId ?? projects[0]?.id}
              disabled={!!entry || !!projectId}
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Descrição" full>
            <Input
              name="description"
              defaultValue={entry?.description}
              minLength={5}
              maxLength={150}
              required
            />
          </Field>
          <Field label="Data">
            <Input
              type="date"
              name="date"
              max={today()}
              defaultValue={entry?.date ?? today()}
              required
            />
          </Field>
          <Field label="Valor (R$)">
            <Input
              type="number"
              name="amount"
              min="0.01"
              max="1000000000000"
              step="0.01"
              defaultValue={entry?.amount}
              required
            />
          </Field>
          <Field label="Tipo de lançamento" full>
            <Select
              name="kind"
              label="Tipo de lançamento"
              defaultValue={entry?.kind ?? "actual"}
            >
              <option value="actual">
                Realizado · custo efetivamente registrado
              </option>
              <option value="committed">
                Comprometido · saldo ainda não realizado
              </option>
            </Select>
          </Field>
        </div>
        <div className="inline-note">
          <Info size={16} />
          Ao realizar um compromisso, reduza o saldo comprometido e registre o
          custo realizado. Os valores são somados separadamente.
        </div>
        <Actions
          saving={saving}
          onClose={onClose}
          error={error}
          label="Salvar lançamento"
        />
      </form>
    </Modal>
  );
}
export function AddButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button onClick={onClick}>
      <Plus size={17} />
      {children}
    </Button>
  );
}
