# Identidade RLM no ObraFlow

Aplicação do design system fornecido pelo responsável pelo projeto em 17/11/2026. A mudança altera a apresentação do MVP; mantém os registros, a chave de armazenamento `obraflow.demo.v1`, os cálculos e os perfis demonstrativos existentes.

## Diretrizes aplicadas

- Paleta central: azul RLM `#1F3F7A`, grafite `#171717` e os tons de azul e cinza previstos no guia.
- Fundo `#F3F5F9`, cartões brancos com faixa superior azul, bordas `#C9D3E3`, raio de 12 px e sombra discreta.
- Títulos e numerais em Oswald 500/600; textos, controles e tabelas em Public Sans 400/600/700. Títulos em Oswald aparecem em caixa alta. Valores monetários usam tamanho adequado ao espaço disponível, preservando o valor completo.
- Tabelas com cabeçalho azul, linhas alternadas e números financeiros alinhados à direita.
- Campos com altura mínima de 48 px e texto de 16 px; botões com área mínima de 44 px. Formulários em uma coluna no celular.
- Navegação azul, identificação do produto ObraFlow junto à marca RLM e nome jurídico no rodapé.
- Atrasos e pendências continuam identificados por texto e ícones. Erro `#B42318`, alerta `#8A6500` e sucesso `#1E6B45` são restritos a estados funcionais, em texto e borda sobre superfícies claras.
- Relatório com marca branca na capa azul em tela e marca colorida na impressão. Cores de impressão também seguem a RLM.
- Os minigráficos decorativos fixos dos indicadores foram retirados. Gráficos de orçamento, custos, progresso e cronograma continuam baseados nos registros do domínio.

## Arquivos e origem

- Tokens compartilhados e estrutura de componentes: `src/app/globals.css`.
- Aplicação da identidade e ajustes responsivos: `src/app/rlm-brand.css`.
- Fontes locais configuradas em `src/app/layout.tsx`, com arquivos WOFF2 e licenças SIL Open Font License em `src/app/fonts/`.
- Logos originais: `public/brand/logo-cor.svg` e `public/brand/logo-branco.svg`, reproduzidas sem recolorir, redesenhar ou distorcer o arquivo usado nos materiais RLM. Fonte dos vetores: página institucional `https://empresarlm.com.br/treinamento`. O recorte do arquivo omite a antiga linha de assinatura, conforme a orientação do design system.
- As cores internas da arte original foram preservadas, inclusive o cinza presente no vetor. Os componentes de interface usam os tokens do guia.
- `src/components/rlm-logo.tsx` centraliza as variantes e respeita o prefixo `/obraflow` da publicação no Pages. O ícone do aplicativo usa a arte colorida original.

## Validação executada

- ESLint, verificação TypeScript e build de produção.
- Os 50 testes existentes de domínio e persistência.
- Nove telas em cinco larguras: 320, 360, 768, 1024 e 1440 px, sem rolagem horizontal da página. Tabelas e cronograma preservam sua rolagem interna.
- Axe-core 4.14.1: regras WCAG A/AA em nove telas de desktop, quatro formulários em desktop e celular e no menu móvel. Nenhuma violação automática detectada nessas verificações; isso não equivale a certificação de acessibilidade.
- Oito aberturas de formulário conferidas quanto a largura, altura dos campos, tamanho do texto e fechamento por Escape.
- Menu móvel: posição, contenção de foco, retorno de foco, navegação e fechamento ao voltar para desktop.
- Inspeção visual de telas, formulários, menu e relatório em modo de impressão; fontes locais e logos carregadas corretamente.
- Exportação estática com prefixo `/obraflow`: oito rotas com recarga, abertura de obra existente, criação/edição/exclusão de obra nova, persistência após recarga, escopo do supervisor e navegação móvel. Nenhum erro de página ou recurso com resposta 4xx/5xx no roteiro. A base original do navegador de teste foi restaurada ao final.

As evidências locais de navegador ficam em `output/playwright/rlm-*`, diretório ignorado no Git. A identidade visual não transforma o protótipo em sistema de produção: o armazenamento continua local ao navegador e os perfis não são autenticação corporativa.
