# Evolução para Supabase e n8n

Este documento descreve uma evolução futura. Nenhum cliente Supabase, webhook, credencial, conexão corporativa ou automação externa está ativo no MVP.

## Pontos de extensão existentes

`src/domain/types.ts` define entidades independentes da apresentação. `commands.ts` concentra validações e permissões demonstrativas; `calculations.ts` concentra seletores e indicadores. `data/repository.ts` é a fronteira do armazenamento e `store.tsx` injeta o repositório no estado compartilhado. Os componentes não acessam `localStorage` diretamente.

As operações `load` e `save` continuam locais e síncronas. Os commits são assíncronos e protegidos por Web Locks, com revisão única, invalidação de formulários antigos e sincronização de abas do mesmo endereço. Um adaptador Supabase ainda exigirá tornar a leitura/gravação assíncronas e substituir o snapshot por operações por entidade com concorrência no servidor. A organização atual permite fazer essa mudança na camada de dados, preservando os modelos, os cálculos e a maior parte dos componentes.

## Supabase

Modelo relacional sugerido:

| Tabela              | Relacionamentos e propósito                                                    |
| ------------------- | ------------------------------------------------------------------------------ |
| organizations       | Organização e separação entre clientes                                         |
| units               | `organization_id`; unidades industriais                                        |
| profiles            | Identidade real vinculada a `auth.users`; papel e organização                  |
| projects            | Unidade, responsável, código único por organização, datas, orçamento e revisão |
| project_members     | Vínculo explícito entre pessoas e obras acessíveis                             |
| stages              | `project_id`, progresso, peso, responsável e `dependency_id`                   |
| journal_entries     | `project_id`, `stage_id`, autoria, atividade, avanço registrado e ocorrências  |
| journal_attachments | Arquivos no Storage e referência ao diário                                     |
| measurements        | `project_id`, tipo, data, valor decimal e autoria                              |
| issues              | `project_id`, responsável, prioridade, prazo e status                          |
| audit_events        | Autor, ação, entidade, instante do servidor e alterações relevantes            |
| outbox_events       | Eventos externos pendentes, tentativas e chave de idempotência                 |

Recomendações de implementação:

1. Autenticação real com Supabase Auth. Derivar usuário e papel da sessão validada pelo servidor, nunca de um seletor no navegador.
2. RLS por organização e vínculo de obra; supervisor consulta/atualiza campo apenas nas obras permitidas. Edição de cadastro, orçamento e medições e emissão global de relatórios exigem coordenação. Aplicar as regras a todas as tabelas relacionadas e aos arquivos.
3. Revalidar os comandos no servidor. Manter chaves estrangeiras, unicidade de código, tipos decimais para dinheiro e restrições de datas/percentuais no banco. Dependências requerem validação de ciclos.
4. Atualizar diário, etapa, histórico e outbox na mesma transação/RPC. Exclusões em cascata devem respeitar a política de retenção aprovada para produção.
5. Usar `revision`/`updated_at` para controle de concorrência. Detectar conflito em vez de sobrescrever alterações de outro usuário.
6. Mover anexos para bucket privado do Storage com URLs temporárias, limites de upload e validação no servidor. Manter no banco apenas metadados e identificadores do arquivo.
7. Fazer migração explícita e validada da base local, se desejada. Nunca enviar automaticamente dados do navegador para um serviço recém-configurado.

## n8n

Emitir eventos apenas após transações confirmadas. Exemplos de contratos futuros:

```ts
type DomainEvent = {
  id: string; // idempotência e rastreabilidade
  schemaVersion: 1;
  organizationId: string;
  projectId: string;
  actorId: string;
  occurredAt: string; // instante emitido pelo servidor
  type:
    | "project.created"
    | "project.completed"
    | "journal.recorded"
    | "issue.created"
    | "issue.resolved"
    | "measurement.recorded";
  payload: Record<string, unknown>;
};
```

Fluxo proposto: transação de domínio → tabela outbox → processo servidor/Edge Function → webhook autenticado do n8n → confirmação e atualização da outbox. Guardar segredos no servidor; nunca em `NEXT_PUBLIC_*` ou no localStorage. Aplicar assinatura, validação de payload, idempotência pelo ID, tentativas com intervalo progressivo e fila de falhas.

Automações possíveis, mediante definição e autorização: alertas de pendência crítica, lembretes de prazo, consolidação periódica de relatório e solicitação de aceite de entrega. Alertas derivados, como atraso, precisam de rotina agendada que recalcule datas e evite notificações duplicadas.

O MVP não sugere que estas integrações já funcionem. A interface as identifica como planejadas.
