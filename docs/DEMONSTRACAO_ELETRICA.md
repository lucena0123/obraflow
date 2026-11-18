# ObraFlow Elétrica

Demonstração de acompanhamento gerencial de obras elétricas com a identidade RLM. Reaproveita os módulos funcionais do MVP: obras, etapas, cronograma, diário, avanço físico, financeiro, pendências e relatório.

## Acesso

- Industrial: https://lucena0123.github.io/obraflow/
- Elétrica: https://lucena0123.github.io/obraflow/eletrica/

O processo de publicação gera duas exportações independentes a partir do mesmo código. A versão elétrica usa `NEXT_PUBLIC_DEMO_SECTOR=electrical` e o endereço base `/obraflow/eletrica`. A versão industrial mantém seu endereço e os exemplos existentes.

As chaves locais são diferentes: `obraflow.demo.v1` para a industrial e `obraflow.electrical.demo.v1` para a elétrica. As gravações e os locks de cada versão usam sua respectiva chave. Restaurar uma demonstração não apaga a outra.

## Exemplos fictícios

Oito intervenções: QGBT de utilidades, infraestrutura de cabos, iluminação, aterramento, quadros de distribuição, eletrocalhas, circuitos de uma nova linha e inspeção de painel. As quatro áreas são Instalações elétricas, Painéis e automação, Infraestrutura e cabos, Inspeção e comissionamento.

Os cenários são gerenciais. Não fornecem dimensionamento de instalações, laudo, certificado de conformidade, prontuário, procedimento técnico, permissão de trabalho ou autorização de energização. Datas, pessoas, valores e atividades são sintéticos. Não inserir informações de clientes na demonstração pública.

## Roteiro de apresentação

1. Explore o painel e filtre uma das áreas elétricas.
2. Abra **EL-001 · Modernização do QGBT de utilidades**.
3. Consulte as quatro etapas. O avanço físico inicial é 68%, calculado pelos pesos das etapas.
4. Registre um diário fictício na etapa **Instalação e identificação**, com avanço acumulado de 75%. O avanço global passa a 74%; os custos não mudam por essa ação.
5. Cadastre uma pendência fictícia com responsável e prazo, depois registre a resolução.
6. Consulte financeiro e relatório. Os valores são exemplos independentes do avanço físico.
7. Alterne para Supervisor. Lia Monte Azul visualiza somente as obras em que é a responsável, com consulta financeira e sem lançamentos financeiros ou relatório global.
8. Recarregue para conferir a persistência local. Use a restauração apenas quando puder descartar suas alterações nessa versão.

## Execução local

Para iniciar somente a versão elétrica em desenvolvimento, encerre a execução anterior e use PowerShell:

```powershell
$env:NEXT_PUBLIC_DEMO_SECTOR = "electrical"
npm run dev
```

Para voltar à industrial:

```powershell
$env:NEXT_PUBLIC_DEMO_SECTOR = "industrial"
npm run dev
```

O GitHub Actions compila ambas, reúne os arquivos em `site/` e publica um único artefato. As rotas continuam estáticas; obras criadas no navegador abrem por `obras/detalhe/?id=...`, respeitando o endereço base de cada versão.

O `postbuild` normaliza cópias dos arquivos de prefetch produzidos pelo Next 16 no Windows, onde separadores de diretório podem gerar nomes diferentes dos pedidos pelo navegador. No Linux, a exportação já tem os nomes esperados. O script não modifica as dependências nem remove arquivos da exportação.

## Divulgação

O texto de publicação e o roteiro de uso estão em `docs/divulgacao/`. A imagem social da versão elétrica é um material de divulgação gerado com a identidade RLM. A publicação no LinkedIn é feita pelo usuário; nenhum post é enviado automaticamente pelo projeto.
