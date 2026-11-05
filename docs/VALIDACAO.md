# Validação do MVP

Ambiente: Windows, Node.js 24.11.1, npm 11.6.2. Verificações realizadas em 5 de novembro de 2026.

## Verificações automatizadas

| Comando             | Resultado                                          |
| ------------------- | -------------------------------------------------- |
| `npm run lint`      | Aprovado, sem erros ou avisos                      |
| `npm run typecheck` | Aprovado                                           |
| `npm test`          | 50 testes aprovados                                |
| `npm run build`     | Build de produção aprovado; todas as rotas geradas |

Os testes de domínio verificam comportamentos com impacto nos dados: datas e atrasos, progresso ponderado, distinção entre físico/financeiro, restrições de perfil, CRUD, dependências, anexos inválidos, regressão e retrodatação de diário, conclusão, referências, cascatas, falha de persistência e restauração.

O servidor de produção (`npm start -- --port 3018`) também iniciou corretamente, com respostas HTTP 200 no painel e no detalhamento dinâmico de obra. A prévia da apresentação permanece em `http://127.0.0.1:3000`.

Ocorreram falhas intermediárias `EPERM` na limpeza de diretórios gerados em `.next`: entradas do OneDrive foram identificadas pelo Node como links na listagem de diretório. Os artefatos afetados foram movidos para cópias em `output/playwright/` e o build foi repetido com sucesso, sem alterar fontes para contornar o problema. É uma limitação observada do ambiente de compilação; convém iniciar e conferir a prévia antes da reunião.

## Verificação no navegador

Navegador Chromium controlado por Playwright, em um contexto de teste separado do navegador de apresentação. Foram usados registros fictícios com prefixo `QA`.

- Criar obra, editar cadastro, abrir detalhamento e pesquisar no portfólio.
- Criar e editar etapa e consultar cronograma.
- Impedir regressão de avanço no diário; registrar atividade com imagem e confirmar sua persistência após recarga.
- Confirmar o avanço físico de 40% após o diário.
- Criar e editar uma medição; confirmar avanço financeiro independente, de 25% para 30%, mantendo o físico em 40%.
- Criar pendência crítica, registrar resolução e consultar histórico.
- Conferir os mesmos dados no relatório filtrado e gerar impressão em PDF pelo navegador.
- Alternar perfis e bloquear o relatório global e o acesso direto a obra alheia ao supervisor; ocultar ações de cadastro e gestão financeira.
- Excluir pendência, lançamento e obra pela interface, confirmando os estados vazios e a remoção dos registros vinculados.
- Navegar pelas oito telas principais nas larguras 1440, 768, 390 e 320 px: 32 combinações, todas com HTTP 200, sem erro JavaScript e sem rolagem horizontal da página; tabelas e Gantt mantêm rolagem própria. Capturas desktop e móvel conferidas visualmente.
- Conferir menu móvel em 390 × 844 px: painel dentro da tela, link para Obras acionável por clique, foco contido durante 18 Tab, fechamento por Escape, retorno do foco ao botão, `aria-expanded` e fechamento ao voltar à largura desktop.
- Injetar `QuotaExceededError` na gravação pelo navegador: erro explícito, formulário mantido aberto e conteúdo persistido integralmente inalterado. Inserir JSON inválido na base de QA: gravações bloqueadas e conteúdo bruto preservado; em seguida restaurar a cópia anterior de QA e recarregar.
- Restaurar a base em Configurações e recarregar: oito obras, quatro diários e seis pendências preservados.

As evidências de QA ficam em `output/playwright/`, diretório ignorado pelo Git. O navegador de apresentação mantém seus próprios dados e não recebe os registros da sessão de testes.

## Correções dos achados altos e médios

As correções mantêm os mesmos módulos e o armazenamento local. Nenhuma integração foi adicionada.

| Achado                      | Correção e evidência                                                                                                                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1 · sobrescrita entre abas | Web Locks protegem leitura/revisão/escrita; revisões únicas invalidam formulários antigos, inclusive após restauração. Testes de duas abas e de cliques simultâneos confirmaram uma gravação aceita e conflito explícito na outra. Reabrir o formulário permite salvar preservando as alterações anteriores. |
| M1 · orçamento zero         | Percentual não calculável é `null` no domínio e **Sem orçamento** nas telas e no relatório. Custo e saldo continuam exibidos.                                                                                                                                                                                |
| M2 · datas realizadas       | Cadastro impede início posterior ou término anterior a diários existentes. Diário exige data igual ou posterior ao início realizado.                                                                                                                                                                         |
| M3 · planejada com execução | O estado planejado verifica cada etapa, sem depender do percentual arredondado, e rejeita diários de execução.                                                                                                                                                                                               |
| M4 · pesos pelo supervisor  | Somente a coordenação cria etapas e altera seus parâmetros. Supervisor mantém atualização do avanço; campos estruturais são de leitura e há validação nos comandos.                                                                                                                                          |
| M5 · unidade fixa           | Relatório identifica a unidade da seleção, múltiplas unidades ou ausência de unidades. Conferido com Unidade Aurora e seleção mista.                                                                                                                                                                         |
| M6 · validação da base      | Comandos e persistência compartilham invariantes de etapas, dependências, estados e datas. Ciclos e conclusões inválidas são rejeitados. Bases v1 válidas recebem revisão sem perda de registros.                                                                                                            |
| M7 · acessibilidade         | Contrastes corrigidos; textos menores ampliados; nome acessível da busca corresponde ao texto visível. Menu móvel usa diálogo com foco contido, Escape, retorno de foco e estado expandido; posicionamento e clique conferidos no build de produção.                                                                 |
| M8 · dependência vulnerável | Override restrito do minimatch 11.0.4 na cadeia typescript-eslint; lint e build compatíveis. `npm audit` completo retornou zero vulnerabilidades.                                                                                                                                                            |

Foram adicionados 20 testes de regressão em `tests/audit-regressions.test.ts`; a suíte totaliza 50 testes aprovados. Os testes de navegador foram feitos em um contexto separado, sem alterar os dados da apresentação.

Prontidão para demonstração: **8,9/10**, comparada a 7,3/10 na auditoria, com os mesmos pesos:

| Critério                                   | Peso | Nota |
| ------------------------------------------ | ---- | ---- |
| Cobertura funcional e fluxos               | 25%  | 8,5  |
| Consistência e regras de negócio           | 25%  | 9,0  |
| Persistência e recuperação                 | 20%  | 9,0  |
| Navegação, responsividade e acessibilidade | 15%  | 9,0  |
| Qualidade visual comercial                 | 10%  | 8,5  |
| Executabilidade e checagens técnicas       | 5%   | 9,5  |

A pontuação avalia a demonstração fictícia local. Permanecem os achados baixos fora do escopo desta etapa, além das limitações de produção já declaradas. O axe 4.14.0, com regras WCAG 2 A/AA e 2.1 A/AA, retornou zero violações nas oito telas e no menu móvel. Isso não significa certificação WCAG: gráficos e fundos têm verificações inconclusivas de contraste; no menu há revisão manual indicada para foco em conteúdo oculto, complementada pelo teste de contenção com 18 Tab. Não houve ensaio com leitor de tela.

Capturas finais: `output/playwright/obraflow-corrigido-desktop.png`, `obraflow-corrigido-mobile.png` e `menu-movel-corrigido.png`. A impressão do relatório foi verificada em `output/playwright/relatorio-corrigido.pdf`.

## Limites

Trata-se de um MVP local com perfis demonstrativos. Não foram verificados autenticação de produção, RLS, integrações corporativas, sincronização multiusuário nem automações externas, pois não estão implementados. A cota de armazenamento depende do navegador.

## Publicação da demonstração no GitHub Pages

Repositório: `lucena0123/obraflow`. Endereço: `https://lucena0123.github.io/obraflow/`.

A hospedagem usa exportação estática, prefixo `/obraflow` e barra final. O detalhamento recebe o identificador pela consulta `/obras/detalhe/?id=...`; isso preserva criação, edição e recarga de obras que só existem no navegador. Os oito caminhos antigos das obras iniciais também são gerados. Não há envio da base local ou de imagens ao repositório.

Antes do envio, foram aprovados lint, TypeScript, 50 testes e build estático de 20 páginas. Na prévia estática foram conferidas as oito telas por navegação e recarga, abertura de obra inicial, criação/abertura/recarga/edição/exclusão de obra nova, restrição de escopo do supervisor e menu móvel a 390 px, sem erros JavaScript ou recursos ausentes na execução final.

Foi identificada uma particularidade do Next 16.4.5 no Windows: o exportador gera alguns arquivos de pré-carregamento com separadores de diretório onde o cliente espera pontos. A prévia local de QA recebeu cópias normalizadas desses artefatos para esse ensaio, sem modificar o pacote Next. A publicação oficial usa um build limpo em Linux no GitHub Actions; não publica a pasta `out` gerada no Windows. A verificação do endereço público deve confirmar os recursos do build Linux antes da entrega.

O workflow executa verificações antes de publicar e usa permissões limitadas por etapa. Fontes e dados fictícios são públicos; alterações dos visitantes permanecem locais e não são compartilhadas entre navegadores. A publicação não altera a classificação do produto como MVP demonstrativo.
