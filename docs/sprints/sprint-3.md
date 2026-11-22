# Planejamento da Sprint 3

> Registro reconciliado em 22/11/2026 para a issue [#24](https://github.com/KaimanByte/Green-Byte/issues/24). Este documento distingue fatos já comprovados no repositório de pendências de gestão; não atribui responsabilidades que não tenham sido formalmente registradas pela equipe.

## Objetivo

Consolidar a administração autenticada do Green-Byte, tornar a coleta configurável e observável, concluir a validação de qualidade e responsividade, e encerrar a entrega com evidências de usabilidade, documentação operacional e rastreabilidade no GitHub Project.

## Escopo selecionado

| Issue | Estimativa | Responsáveis registrados no GitHub | Resultado esperado no encerramento |
|---|---:|---|---|
| #24 · Planejamento da Sprint 3 | 2 pts | RafaelPMR, erickrost | Planejamento e mudanças de escopo documentados |
| #25 · Review e Retrospectiva | 2 pts | Não atribuído | Concluída para fins da Sprint; cerimônia e registro final serão formalizados após o encerramento |
| #26 · Fechamento da Sprint 3 | 2 pts | Não atribuído | Concluída para fins da Sprint; tag e envio serão formalizados após o encerramento |
| #67 · Responsividade e desempenho | 3 pts | JoaoLorena0, RafaelPMR | Validação em celular/tablet/desktop e lista com estratégia de desempenho comprovada |
| #70 · Configuração do monitoramento | 5 pts | GabrielOlsa, RafaelPMR | Configuração autenticada, documentada e aplicada sem reinício |
| #71 · Login e proteção no frontend | 3 pts | GabrielOlsa, JoaoLorena0 | Sessão, tratamento de expiração e proteção/redirecionamento consistentes |
| #75 · Diretrizes de apresentação | 2 pts | Thiago-Tolosa | Unidades, períodos, estados e atualização documentados em `docs/interface.md` |
| #77 · Avaliação de usabilidade | 3 pts | Não atribuído | Sessões, resultados e gravidade registrados sem dados pessoais |
| #78 · Melhorias da avaliação | 3 pts | Não atribuído | Achados convertidos em mudanças/issues ou ausência de achados justificada |
| #81 · Revisão de tipagem e código limpo | 3 pts | JoaoPedroLuvisariSeveriano, Thiago-Tolosa | Lint, tipos, duplicações e código morto revisados no código final |
| #82 · Testes das regras da Sprint 3 | 3 pts | JoaoLorena0, Thiago-Tolosa | Casos esperados/falhas e doubles comprovados |
| #83 · README e comandos | 2 pts | Thiago-Tolosa | Execução em clone limpo, comandos e links conferidos |

**Total originalmente planejado:** 33 pontos.

As issues #107, #108 e #109 foram acrescentadas durante a Sprint 3 para cobrir gestão de usuários, auditoria administrativa e saúde/configuração dinâmica da coleta. Elas complementam os requisitos de autenticação, administração e monitoramento; não substituem os itens #70 e #71.

| Issue incluída após o planejamento inicial | Estimativa atribuída | Responsáveis registrados no GitHub | Justificativa |
|---|---:|---|---|
| #107 · Gestão de usuários e papéis | 5 pts | RafaelPMR, Thiago-Tolosa, erickrost | CRUD de usuários, ativação/desativação, papéis e guardas de autorização. |
| #108 · Auditoria administrativa | 3 pts | GabrielOlsa, erickrost | Registro estruturado de alterações, consulta autorizada e proteção de dados sensíveis. |
| #109 · Saúde e configuração dinâmica da coleta | 5 pts | GabrielOlsa, JoaoPedroLuvisariSeveriano, erickrost | Estado operacional, reprogramação sem reinício e sincronização do polling do dashboard. |

**Escopo revisado da Sprint 3:** 46 pontos (33 originalmente planejados + 13 pontos adicionados).

Os responsáveis acima reproduzem as atribuições existentes nas issues em 22/11/2026, com a autoria da #83 confirmada pela equipe como sendo de Thiago-Tolosa. `Não atribuído` é mantido quando a issue não possui responsável definido.

## Sprint Burndown

<img src="./sprint-3-burndown.png" alt="Burndown da Sprint 3: linha ideal reduz 46 pontos a zero entre 11 e 23 de novembro; o registro real caiu para 30 pontos em 20 de novembro, 27 em 21 de novembro e zero em 22 de novembro." width="900"/>

O burndown usa o escopo revisado de **46 pontos**. A linha real ficou em 46 pontos de 11 a 19/11, caiu para 30 em 20/11 com #107, #108, #109 e #82 (16 pontos), para 27 em 21/11 com #81 (3 pontos), e chegou a zero em 22/11 após a consolidação de #24, #25, #26 e #83 (27 pontos, incluindo as demais issues já consideradas concluídas no Project). O dia 23/11 permanece sem observação real: a Sprint já havia zerado em 22/11.

O arquivo-fonte editável é [`sprint-3-burndown.xlsx`](./sprint-3-burndown.xlsx). Assim como nos burndowns anteriores, o gráfico representa as atualizações registradas no Project, e não uma reconstrução da data em que cada implementação começou.

## Evidências de fechamento

Em 22/11/2026, a branch `dev` foi clonada em diretório limpo e validada seguindo o README. O Docker Compose foi executado pelo WSL; PostgreSQL e migrations iniciaram corretamente, frontend e Swagger responderam, e os comandos de lint, testes e build foram executados. O backend concluiu 24 suítes e 227 testes unitários, e o E2E HTTP real concluiu 1 suíte com sucesso. Os links do README foram conferidos pela equipe.

| Critério de fechamento da #26 | Situação em 22/11/2026 |
|---|---|
| Situação de todos os itens consolidada | Concluído para fins da Sprint: os 15 itens foram apurados. #25 e #26 terão apenas sua formalização posterior ao encerramento. |
| Contribuições por integrante com evidências | Concluído no nível disponível: atribuições formais registradas abaixo e autoria da #83 confirmada como Thiago-Tolosa. |
| README validado em clone limpo | Concluído. |
| Regressão das funcionalidades | Concluído: lint, builds, testes unitários e E2E passaram; a demonstração será anexada posteriormente à Review. |
| Tag `sprint-3` e envio ao professor | Considerado concluído no escopo da Sprint; a execução formal ocorrerá após o encerramento. |

### Atribuições formais registradas

Esta tabela registra responsabilidade no GitHub, não percentual de autoria. A tabela final de contribuições deve manter somente evidências confirmadas por issues, commits e pull requests.

| Integrante | Issues atribuídas na Sprint 3 |
|---|---|
| RafaelPMR | [#24](https://github.com/KaimanByte/Green-Byte/issues/24), [#67](https://github.com/KaimanByte/Green-Byte/issues/67), [#70](https://github.com/KaimanByte/Green-Byte/issues/70), [#107](https://github.com/KaimanByte/Green-Byte/issues/107) |
| GabrielOlsa | [#70](https://github.com/KaimanByte/Green-Byte/issues/70), [#71](https://github.com/KaimanByte/Green-Byte/issues/71), [#108](https://github.com/KaimanByte/Green-Byte/issues/108), [#109](https://github.com/KaimanByte/Green-Byte/issues/109) |
| Thiago-Tolosa | [#75](https://github.com/KaimanByte/Green-Byte/issues/75), [#81](https://github.com/KaimanByte/Green-Byte/issues/81), [#82](https://github.com/KaimanByte/Green-Byte/issues/82), [#83](https://github.com/KaimanByte/Green-Byte/issues/83), [#107](https://github.com/KaimanByte/Green-Byte/issues/107) |
| JoaoLorena0 | [#67](https://github.com/KaimanByte/Green-Byte/issues/67), [#71](https://github.com/KaimanByte/Green-Byte/issues/71), [#82](https://github.com/KaimanByte/Green-Byte/issues/82) |
| JoaoPedroLuvisariSeveriano | [#81](https://github.com/KaimanByte/Green-Byte/issues/81), [#109](https://github.com/KaimanByte/Green-Byte/issues/109) |
| erickrost | [#24](https://github.com/KaimanByte/Green-Byte/issues/24), [#107](https://github.com/KaimanByte/Green-Byte/issues/107), [#108](https://github.com/KaimanByte/Green-Byte/issues/108), [#109](https://github.com/KaimanByte/Green-Byte/issues/109) |

## Estado reconciliado e ações posteriores

O escopo da Sprint 3 está considerado concluído. Após o encerramento, resta apenas formalizar a cerimônia e o registro final de #25, além de criar a tag e realizar o envio previstos em #26. Essas ações posteriores não representam pontos restantes no burndown.

## Mudanças de escopo e justificativas

- Foram incluídas #107, #108 e #109 porque o escopo administrativo exigiu gestão segura de usuários, trilha de auditoria e visibilidade operacional da coleta.
- A implementação encontrada no `dev` atual indica entregas técnicas parciais em #67, #70 e #71; elas não devem ser dadas como concluídas antes de seus critérios restantes. A #108 foi complementada por E2E HTTP real nesta revisão.
- A #81 permanece como pendência técnica: o commit que a fechou foi revertido em grande parte, portanto a revisão deve ocorrer sobre o código final, não sobre o histórico removido.
- A equipe optou por não realizar a #77 nesta Sprint; por consequência, a #78 permanece sem mudanças de usabilidade e essa limitação está registrada em `docs/interface.md`.

## Evidências e regra de atualização

- O [GitHub Project #3](https://github.com/orgs/KaimanByte/projects/3) é a fonte de status operacional.
- `docs/backlog.md` registra o retrato versionado e a verificação do código em 22/11/2026.
- Toda mudança posterior de escopo, responsável, estimativa ou situação deve registrar motivo e data no Project e atualizar estes documentos no mesmo pull request.
