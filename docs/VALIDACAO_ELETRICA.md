# Verificação da demonstração elétrica

Validação da versão demonstrativa do ObraFlow Elétrica preparada em 17/11/2026. Esta verificação não equivale à homologação de um sistema corporativo ou à validação de engenharia elétrica.

## Verificações executadas

- `npm run lint`: sem erros.
- `npm test`: 56 testes aprovados, incluindo os 50 casos anteriores e 6 casos de cenários elétricos, filtros, diário, cadastro e isolamento do armazenamento.
- `npm run typecheck`: sem erros.
- Exportações estáticas industrial (`/obraflow`) e elétrica (`/obraflow/eletrica`) geradas a partir do mesmo código.
- Navegação real pelos módulos da exportação estática usando Chromium.

## Roteiro funcional no navegador

1. Abertura das duas versões na mesma origem e verificação das bases OB-001 e EL-001.
2. Filtro Painéis e automação com duas obras e consulta de cronograma, diário, financeiro, pendências e relatórios.
3. Registro de diário em EL-001 com avanço da etapa de 62% para 75%: avanço global de 68% para 74%, sem modificar os custos.
4. Cadastro e resolução de pendência com histórico.
5. Lançamento financeiro realizado de R$ 1.000, com incremento correspondente no total.
6. Recarga da página e confirmação dos registros persistidos.
7. Cadastro de EL-009 com unidade Aurora e áreas elétricas, abertura do detalhamento, criação de etapa e início da obra.
8. Perfil Supervisor sem edição do cadastro, lançamento financeiro ou relatório global, mantendo a consulta de sua obra.
9. Acionamento de Imprimir relatório e conferência da apresentação de impressão.
10. Restauração da base elétrica com oito obras, preservando a base industrial byte a byte.
11. Celular com largura de 390 px, sem transbordamento horizontal no painel; abertura e navegação pelo menu, Escape e devolução de foco ao botão.

Resultado do roteiro local: nenhuma exceção de JavaScript e nenhuma resposta HTTP de erro durante o teste concluído. Um problema de nomes de arquivos de prefetch na exportação Windows foi identificado antes do teste final e tratado no `postbuild`. Os arquivos de origem do Next não foram alterados.

## Divulgação e limites

A capa de 1200 × 630 usa a identidade RLM e uma captura real do painel fictício. As fontes são locais. Os metadados de compartilhamento apontam para o endereço e a imagem da versão elétrica.

O roteiro usa perfis simulados e armazenamento no navegador. Não verifica autenticação real, permissões em servidor, compartilhamento entre usuários, disponibilidade de produção, backup remoto ou integrações: essas capacidades não estão implementadas. O teste de impressão aciona o comando e verifica os estilos, sem afirmar compatibilidade com toda impressora ou navegador.

Os exemplos de campo não constituem projeto, laudo, certificado, procedimento de segurança ou autorização de serviço elétrico. Nenhum dado real de cliente foi adicionado para a divulgação.
