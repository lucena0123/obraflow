# ObraFlow

MVP funcional de gestão de obras e melhorias industriais, preparado para apresentação comercial local. Identidade visual própria; todos os nomes, unidades, obras, valores e registros são fictícios. Nenhum sistema corporativo ou serviço externo está conectado.

## Demonstração online

Abra **https://lucena0123.github.io/obraflow/** para observar e experimentar o MVP sem instalação. O código está em **https://github.com/lucena0123/obraflow**.

O site é público e usa somente dados fictícios. Cada navegador recebe sua própria base demonstrativa; alterações, anexos e perfis ficam naquele navegador, sem sincronização com o apresentador ou outros visitantes. A base local do computador não é enviada para o GitHub. Os perfis continuam sendo demonstrativos, sem login real.

A publicação é automática pelo workflow `.github/workflows/pages.yml` após alterações na branch `master`. O workflow executa lint, testes, build estático e verificação de tipos antes de publicar o diretório `out/` no GitHub Pages.

O modo estático usa `GITHUB_PAGES=true`, `PAGES_BASE_PATH=/obraflow` e URLs com barra final. Os links de detalhamento usam `/obras/detalhe/?id=...`, permitindo abrir e recarregar obras criadas no navegador sem depender de um servidor Next.js. Os links antigos das oito obras iniciais também são exportados. A execução local abaixo continua disponível.

## Executar localmente

Requisitos: Node.js **20.9 ou superior** e npm. Ambiente validado com Node.js 24.11.1.

```powershell
npm ci
npm run dev
```

Abra **http://127.0.0.1:3000**. Não são necessárias chaves, variáveis de ambiente, contas ou banco de dados.

Para executar a versão de produção:

```powershell
npm run build
npm start
```

Se a porta estiver ocupada, use `npm run dev -- --port 3001`. O endereço e a porta identificam o armazenamento do navegador: `localhost:3000` e `127.0.0.1:3000` têm bases locais separadas.

## Funcionalidades

- **Visão geral:** portfólio, obras em andamento, atrasos calculados, entregas, orçamento, custos registrados, avanço físico, indicadores por área e pendências críticas. Filtros combinados por área, equipe, responsável e situação.
- **Obras e projetos:** criação, edição, consulta em tabela ou cartões, pesquisa, detalhamento e exclusão com confirmação e remoção dos registros vinculados. Cadastro com unidade simulada, descrição, responsável fictício, orçamento, datas previstas e realizadas e histórico.
- **Etapas:** cadastro, edição e exclusão, pesos, avanço físico, responsáveis, períodos e dependências. Etapas com diários ou dependências são preservadas contra exclusão.
- **Cronograma:** Gantt simplificado com agrupamento por obra, períodos, dependências identificadas, linha do dia atual, avanço e atrasos. Edição da etapa pelo cronograma.
- **Diário de obras:** registro de atividades, mão de obra, impedimentos, ocorrências e avanço da etapa. Até três imagens PNG, JPEG ou WebP de até 500 KB por registro. Filtros por obra, período e conteúdo; imagens ampliáveis. Registros são históricos e não têm edição ou exclusão individual.
- **Financeiro:** orçamento, compromissos em aberto, custo realizado, saldo disponível, evolução acumulada do custo e comparação independente dos avanços físico e financeiro. Cadastro, edição e exclusão de medições fictícias pela coordenação.
- **Pendências:** cadastro, edição, exclusão, responsável, prioridade, prazo, status e histórico. A resolução exige uma descrição e pode ser reaberta mantendo o histórico.
- **Relatórios:** resumo executivo, avanço, custos, saldos e desvios, atrasos, pendências, indicadores por área e atualizações. Filtros e impressão pelo navegador com estilo A4 paisagem; o navegador permite salvar em PDF.
- **Perfis demonstrativos:** Coordenador e Supervisor, com escopo e ações restritas na interface e nos comandos de domínio. O supervisor fictício Lia Monte Azul acompanha suas três obras iniciais.
- **Configurações:** alternância de perfil, informações do armazenamento e restauração explícita da base fictícia.
- Layout responsivo, menu móvel, diálogos acessíveis, validação, busca global (atalho `/`), estados vazios e mensagens de confirmação/erro.

## Roteiro para apresentação

1. Explore os indicadores e filtre por **Equipe Horizonte**.
2. Abra **OB-001 · Ampliação do galpão de manutenção**.
3. Em **Diário de obras**, registre uma atividade na etapa **Execução e montagem**, elevando o avanço de 62% para 75%.
4. Volte ao resumo e ao dashboard: o avanço físico foi recalculado pelos pesos das etapas.
5. Em **Financeiro**, registre uma medição e observe que o indicador financeiro muda independentemente do físico.
6. Cadastre e resolva uma pendência, incluindo o relato da resolução.
7. Abra **Relatórios** e use **Imprimir relatório**.
8. Alterne para **Supervisor** e observe o escopo das próprias obras, sem gestão financeira nem relatório global.
9. Como Coordenador, acesse **Configurações → Restaurar dados demonstrativos** para reiniciar a apresentação.

## Regras e cálculos

- **Físico:** `arredondar(soma(avanço da etapa × peso) / soma dos pesos))`. Uma obra sem etapas tem avanço zero. A média do portfólio é a média simples dos avanços das obras do recorte.
- **Financeiro:** `custo realizado / orçamento × 100`. Com orçamento zero, o percentual é exibido como **Sem orçamento**, sem atribuir 0% a um denominador inexistente; o saldo negativo continua revelando custos sem cobertura. O percentual financeiro pode ultrapassar 100%, com barra visual limitada ao limite e percentual numérico integral.
- **Saldo:** `orçamento − realizado − saldo comprometido`. Comprometido significa o valor contratado **ainda não realizado**, não o total contratado. Para realizar um compromisso, reduza/remova seu saldo em aberto e registre o custo realizado, evitando dupla contagem.
- **Desvio:** excesso de realizado mais comprometido sobre o orçamento, com mínimo zero. O relatório mostra valores por obra e o excesso agregado no recorte; saldos de outras obras podem compensar o excesso no agregado.
- **Atraso:** obra não concluída com entrega prevista vencida e avanço incompleto, ou alguma etapa vencida com avanço menor que 100%. Uma etapa com término hoje ainda não está vencida. A data é atualizada enquanto a aplicação permanece aberta.
- **Conclusão:** exige pelo menos uma etapa, todas com exatamente 100% e datas realizadas válidas. Alcançar 100% físico não encerra automaticamente a obra; a entrega técnica precisa ser registrada no cadastro.
- O diário não aceita datas futuras, retrocesso de avanço nem um registro anterior ao diário mais recente da mesma etapa. Correções do avanço podem ser feitas na edição de etapas de obras abertas.
- Dependências não podem formar ciclos; o início previsto da etapa dependente deve respeitar o fim previsto de sua predecessora.
- Cadastros rejeitam códigos repetidos, períodos invertidos, etapas fora do período da obra, valores inválidos e referências indisponíveis ao perfil.
- O custo não é inferido do avanço físico. Todos os módulos usam as mesmas entidades e funções de cálculo.

## Estrutura

```text
src/
  app/                 Rotas do Next.js App Router e estilos globais
    obras/[id]/        Detalhamento da obra
  components/          Shell, componentes comuns, gráficos e formulários
    ui/                Componentes shadcn/ui com primitivas Radix
  domain/
    types.ts           Modelos e vocabulário do domínio
    calculations.ts    Seletores, cálculos, escopo e filtros
    commands.ts        Permissões e alterações das entidades
    validation.ts      Invariantes compartilhadas por comandos e persistência
  data/
    seed.ts            Base fictícia com oito obras, gerada em relação ao dia inicial
    repository.ts      Contrato de persistência, validação e adaptador localStorage
    store.tsx          Estado compartilhado e commits com persistência antes da confirmação
  modules/             Telas funcionais por módulo
tests/                 Testes de domínio, integridade e persistência
docs/                  Validação e plano para Supabase/n8n
```

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Radix, Recharts e Lucide. As fontes são do sistema, sem downloads externos em tempo de execução.

## Verificações

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Os 50 testes cobrem cálculos, filtros, datas, perfis, dependências, diário, finanças, pendências, exclusão em cascata, validação dos dados persistidos, falha de gravação e restauração. A verificação no navegador inclui navegação, CRUD, upload, recarga, escopo do supervisor, impressão e layout móvel. Evidências e limitações estão em [docs/VALIDACAO.md](docs/VALIDACAO.md).

## Persistência e limitações

As alterações ficam no `localStorage`, na chave `obraflow.demo.v1`. A gravação precisa ter sucesso antes da atualização do estado e da confirmação. Dados locais ilegíveis ou semanticamente inconsistentes não são silenciosamente sobrescritos: a aplicação exibe uma prévia e bloqueia alterações até a restauração explícita.

O armazenamento é limitado pela cota do navegador. Gravações na mesma origem usam Web Locks e uma revisão única por alteração. Abas recebem as atualizações locais; um formulário aberto com uma revisão anterior é recusado sem sobrescrever os dados e deve ser fechado e reaberto. A restauração também invalida formulários antigos. Use um navegador atualizado em `http://127.0.0.1` ou na demonstração HTTPS publicada; se o bloqueio de gravação não estiver disponível, a aplicação não grava sem proteção. A aplicação não sincroniza dispositivos ou usuários e não oferece backup remoto. Imagens também ficam locais. Os perfis **não são autenticação nem uma barreira de segurança de produção**; a base está disponível ao proprietário do navegador.

Pendências para uma versão de produção: autenticação real, permissões no servidor, RLS, banco multiusuário, concorrência/versionamento, arquivos em Storage, auditoria durável, backups, observabilidade, homologação com usuários e automações. Não há integração ativa com Supabase, n8n, SAP ou SoftExpert.

## Próximas integrações

O domínio é separado da interface e do adaptador de armazenamento. O plano para trocar a persistência local por Supabase e emitir eventos para n8n está em [docs/INTEGRACOES.md](docs/INTEGRACOES.md). Inclui entidades, acesso por projeto, transações, eventos e idempotência. Essas integrações exigem implementação e autorização próprias antes de qualquer conexão.
