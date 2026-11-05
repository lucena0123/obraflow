"use client";
import { useState } from "react";
import {
  Database,
  RotateCcw,
  ShieldCheck,
  Workflow,
  HardDrive,
  Check,
  UserRound,
} from "lucide-react";
import { useData } from "@/data/store";
import {
  Confirm,
  Loading,
  PageHeading,
  Panel,
  Select,
} from "@/components/common";
import { Button } from "@/components/ui/button";
export function Settings() {
  const { data, store, blocked } = useData();
  const [reset, setReset] = useState(false);
  if (!data) return <Loading />;
  const bytes = new Blob([JSON.stringify(data)]).size;
  return (
    <>
      <PageHeading
        eyebrow="SEU AMBIENTE"
        title="Pronto para demonstrar."
        description="Configure a experiência e gerencie os dados deste navegador."
      />
      <div className="settings-grid">
        <Panel
          title="Perfis demonstrativos"
          subtitle="Explore a experiência de cada papel"
          action={<UserRound size={21} className="text-teal" />}
        >
          <p className="settings-description">
            A alternância modifica o escopo visível e as ações disponíveis.
            Estes perfis são uma demonstração de interface, sem autenticação de
            produção.
          </p>
          <Select
            label="Perfil nas configurações"
            value={data.profile}
            disabled={blocked}
            onChange={(e) =>
              store.setProfile(e.target.value as "coordinator" | "supervisor")
            }
          >
            <option value="coordinator">Coordenador · Caio Campo Alto</option>
            <option value="supervisor">Supervisor · Lia Monte Azul</option>
          </Select>
          <div className="permission-list">
            <div>
              <ShieldCheck size={18} />
              <span>
                <strong>Coordenador</strong>Cadastro e edição de obras, gestão
                financeira, visão global e relatórios.
              </span>
            </div>
            <div>
              <HardDrive size={18} />
              <span>
                <strong>Supervisor</strong>Consulta de suas obras, atualização
                de etapas, diários e pendências. Sem gestão financeira ou
                relatório global.
              </span>
            </div>
          </div>
        </Panel>
        <Panel
          title="Persistência local"
          subtitle="Sua demonstração continua de onde parou"
          action={<Database size={21} className="text-teal" />}
        >
          <div className="storage-indicator">
            <span>
              <Check size={18} />
              {blocked
                ? "Recuperação necessária"
                : "Armazenamento no navegador"}
            </span>
            <strong>
              {(bytes / 1024).toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })}{" "}
              KB
            </strong>
          </div>
          <p className="settings-description">
            São {data.projects.length} obras, {data.journals.length} diários,{" "}
            {data.issues.length} pendências e {data.measurements.length}{" "}
            lançamentos. Os dados pertencem a este navegador e endereço local.
            Limpar os dados do site remove os registros.
          </p>
          <p className="settings-description">
            Anexos ficam no armazenamento local. Para demonstrações, use imagens
            de até 500 KB.
          </p>
          {(data.profile === "coordinator" || blocked) && (
            <Button variant="outline" onClick={() => setReset(true)}>
              <RotateCcw size={16} />
              Restaurar dados demonstrativos
            </Button>
          )}
        </Panel>
        <Panel
          title="Integrações futuras"
          subtitle="Arquitetura modular, sem conexão ativa"
          action={<Workflow size={21} className="text-teal" />}
        >
          <div className="integration-row">
            <span className="integration-icon">S</span>
            <div>
              <strong>Supabase</strong>
              <p>
                Próxima etapa: banco de dados, autenticação, políticas de acesso
                e armazenamento de arquivos.
              </p>
            </div>
            <span className="soft-badge">Planejado</span>
          </div>
          <div className="integration-row">
            <span className="integration-icon">n8n</span>
            <div>
              <strong>Automações</strong>
              <p>
                Próxima etapa: eventos de domínio, notificações e fluxos de
                aprovação no servidor.
              </p>
            </div>
            <span className="soft-badge">Planejado</span>
          </div>
          <p className="inline-note">
            Não há conexão com SAP, SoftExpert ou qualquer sistema corporativo.
          </p>
        </Panel>
        <Panel
          title="Sobre o ObraFlow"
          subtitle="MVP de gestão de obras industriais"
        >
          <div className="about-mark">
            <span>
              obra<strong>flow</strong>
            </span>
            <small>v1.0 · demonstração local</small>
          </div>
          <p className="settings-description">
            Uma experiência integrada de planejamento, rotina de campo e
            controle financeiro para intervenções industriais.
          </p>
          <p className="settings-description">
            Todos os nomes, unidades, valores, cronogramas e registros são
            fictícios. Identidade visual própria, criada para esta demonstração.
          </p>
        </Panel>
      </div>
      {reset && (
        <Confirm
          title="Restaurar a demonstração?"
          description="Todas as alterações e imagens deste navegador serão removidas e substituídas por oito obras fictícias. O perfil voltará para Coordenador. Esta ação não pode ser desfeita."
          danger
          onClose={() => setReset(false)}
          onConfirm={(revision) => store.reset(revision)}
        />
      )}
    </>
  );
}
