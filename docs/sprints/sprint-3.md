# Planejamento da Sprint 3

> Registro reconciliado em 22/11/2026 para a issue [#24](https://github.com/KaimanByte/Green-Byte/issues/24). Este documento distingue fatos já comprovados no repositório de pendências de gestão; não atribui responsabilidades que não tenham sido formalmente registradas pela equipe.

## Objetivo

Consolidar a administração autenticada do Green-Byte, tornar a coleta configurável e observável, concluir a validação de qualidade e responsividade, e encerrar a entrega com evidências de usabilidade, documentação operacional e rastreabilidade no GitHub Project.

## Escopo selecionado

| Issue | Estimativa | Resultado esperado no encerramento |
|---|---:|---|
| #24 · Planejamento da Sprint 3 | 2 pts | Planejamento e mudanças de escopo documentados |
| #25 · Review e Retrospectiva | 2 pts | Demonstração, retorno, retrospectiva e pendências registradas |
| #26 · Fechamento da Sprint 3 | 2 pts | Situação consolidada, contribuições, validação e tag `sprint-3` |
| #67 · Responsividade e desempenho | 3 pts | Validação em celular/tablet/desktop e lista com estratégia de desempenho comprovada |
| #70 · Configuração do monitoramento | 5 pts | Configuração autenticada, documentada e aplicada sem reinício |
| #71 · Login e proteção no frontend | 3 pts | Sessão, tratamento de expiração e proteção/redirecionamento consistentes |
| #75 · Diretrizes de apresentação | 2 pts | Unidades, períodos, estados e atualização documentados em `docs/interface.md` |
| #77 · Avaliação de usabilidade | 3 pts | Sessões, resultados e gravidade registrados sem dados pessoais |
| #78 · Melhorias da avaliação | 3 pts | Achados convertidos em mudanças/issues ou ausência de achados justificada |
| #81 · Revisão de tipagem e código limpo | 3 pts | Lint, tipos, duplicações e código morto revisados no código final |
| #82 · Testes das regras da Sprint 3 | 3 pts | Casos esperados/falhas e doubles comprovados |
| #83 · README e comandos | 2 pts | Execução em clone limpo e links conferidos |

**Total originalmente planejado:** 33 pontos.

As issues #107, #108 e #109 foram acrescentadas durante a Sprint 3 para cobrir gestão de usuários, auditoria administrativa e saúde/configuração dinâmica da coleta. Elas complementam os requisitos de autenticação, administração e monitoramento; não substituem os itens #70 e #71.

| Issue incluída após o planejamento inicial | Estimativa atribuída | Justificativa |
|---|---:|---|
| #107 · Gestão de usuários e papéis | 5 pts | CRUD de usuários, ativação/desativação, papéis e guardas de autorização. |
| #108 · Auditoria administrativa | 3 pts | Registro estruturado de alterações, consulta autorizada e proteção de dados sensíveis. |
| #109 · Saúde e configuração dinâmica da coleta | 5 pts | Estado operacional, reprogramação sem reinício e sincronização do polling do dashboard. |

**Escopo revisado da Sprint 3:** 46 pontos (33 originalmente planejados + 13 pontos adicionados).

## Sprint Burndown

<img src="./sprint-3-burndown.png" alt="Burndown da Sprint 3: linha ideal reduz 46 pontos a zero entre 11 e 23 de novembro; o registro real caiu para 30 pontos em 20 de novembro e 27 em 21 de novembro, permanecendo assim até 22 de novembro." width="900"/>

O burndown usa o escopo revisado de **46 pontos** e o estado registrado no Project. A linha real ficou em 46 pontos de 11 a 19/11, caiu para 30 em 20/11 com o fechamento de #107, #108, #109 e #82 (16 pontos), e para 27 em 21/11 com #81 (3 pontos), permanecendo em 27 em 22/11. O dia 23/11 permanece sem dado real até o encerramento da sprint.

O arquivo-fonte editável é [`sprint-3-burndown.xlsx`](./sprint-3-burndown.xlsx). Assim como nos burndowns anteriores, o gráfico representa as atualizações registradas no Project, e não uma reconstrução da data em que cada implementação começou.

## Estado reconciliado e prioridades de encerramento

1. Concluir as lacunas funcionais e de qualidade de #70, #71 e #81.
2. Registrar a validação de responsividade de #67.
3. Manter `docs/interface.md` como referência das diretrizes de apresentação; a equipe decidiu não executar a avaliação de usabilidade (#77) nesta Sprint, portanto #78 não terá melhorias baseadas em achados inexistentes.
4. Corrigir e validar o README em clone limpo (#83).
5. Executar regressão, Review/Retrospectiva (#25) e fechamento/tag (#26).

## Mudanças de escopo e justificativas

- Foram incluídas #107, #108 e #109 porque o escopo administrativo exigiu gestão segura de usuários, trilha de auditoria e visibilidade operacional da coleta.
- A implementação encontrada no `dev` atual indica entregas técnicas parciais em #67, #70 e #71; elas não devem ser dadas como concluídas antes de seus critérios restantes. A #108 foi complementada por E2E HTTP real nesta revisão.
- A #81 permanece como pendência técnica: o commit que a fechou foi revertido em grande parte, portanto a revisão deve ocorrer sobre o código final, não sobre o histórico removido.
- A equipe optou por não realizar a #77 nesta Sprint; por consequência, a #78 permanece sem mudanças de usabilidade e essa limitação está registrada em `docs/interface.md`.

## Evidências e regra de atualização

- O [GitHub Project #3](https://github.com/orgs/KaimanByte/projects/3) é a fonte de status operacional.
- `docs/backlog.md` registra o retrato versionado e a verificação do código em 22/11/2026.
- Toda mudança posterior de escopo, responsável, estimativa ou situação deve registrar motivo e data no Project e atualizar estes documentos no mesmo pull request.
