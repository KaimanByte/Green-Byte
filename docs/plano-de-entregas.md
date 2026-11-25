# Plano de entregas — Green-Byte

Este documento relaciona os critérios da rubrica de avaliação às entregas de cada sprint: o que foi planejado, como verificar, quem foi responsável, onde está a evidência no GitHub e a situação de cada item. Ele também registra a participação de cada integrante por sprint.

> **Sobre esta versão:** este arquivo foi consolidado em 25/11/2026, após o fechamento da Sprint 3, a partir dos registros que já existiam no repositório e no GitHub Project: [`backlog.md`](./backlog.md), os documentos de cada sprint em [`sprints/`](./sprints/), as issues e o histórico de commits. Ele não substitui esses registros. O planejamento feito durante cada sprint está nas issues de planejamento (#18, #21 e #24) e em [`sprint-1-deliveries.md`](./sprints/sprint-1-deliveries.md).

## Como ler

- **Código** é o critério da rubrica (GA01, DW02…). Os identificadores do backlog (GA-01, IT-03…) são tarefas da equipe e **não** correspondem automaticamente aos critérios de mesmo número. Por exemplo, a tarefa GA-04 trata deste plano, enquanto o critério GA04 avalia acompanhamento e rastreabilidade.
- **Requisito** usa os códigos do enunciado do GreenER (RF, RP e RNF), conforme o backlog de cada sprint.
- **Situação:** `Concluído`, `Parcial` (entregue com lacuna descrita), `Pendente` (não entregue) ou `Não previsto` (critério de outra sprint).
- GA01 a GA09 e DW01 são avaliados em todas as sprints. Quando um critério aparece em mais de uma sprint, a tabela da sprint descreve a evolução prevista naquela entrega.

## Distribuição dos critérios

| Critério | Pts | Sprint 1 | Sprint 2 | Sprint 3 |
|---|:---:|:---:|:---:|:---:|
| GA01 a GA09 — Gestão ágil | 40 | ✔ | ✔ | ✔ |
| DW01 — Tecnologias obrigatórias | 3 | ✔ | ✔ | ✔ |
| DW02 — Integração com as APIs auxiliares | 5 | ✔ | ✔ | — |
| DW03 — Backend e API REST | 4 | ✔ | ✔ | ✔ |
| DW04 — PostgreSQL e ORM | 4 | ✔ | ✔ | ✔ |
| DW05 — Organização e integração do frontend | 3 | ✔ | ✔ | ✔ |
| DW06 — Autenticação e proteção | 3 | — | ✔ | ✔ |
| DW07 — Execução e documentação da API | 3 | ✔ | — | ✔ |
| TP01 — Responsabilidades e SOLID | 4 | ✔ | — | — |
| TP02 — Injeção de dependências | 4 | ✔ | ✔ | — |
| TP03 — Tipagem e legibilidade | 4 | — | — | ✔ |
| TP04 — Testes unitários | 4 | ✔ | ✔ | ✔ |
| TP05 — Validação e exceções | 4 | — | ✔ | ✔ |
| IHC01 — Usuários e tarefas | 3 | ✔ | — | — |
| IHC02 — Fluxos e protótipos | 3 | ✔ | — | — |
| IHC03 — Clareza dos indicadores e estados | 3 | — | ✔ | ✔ |
| IHC04 — Responsividade e feedback | 2 | — | ✔ | ✔ |
| IHC05 — Avaliação de usabilidade | 2 | — | — | ✔ |
| IHC06 — Melhorias da avaliação | 2 | — | — | ✔ |

---

## Sprint 1 — Fundação

**Período:** até 20/10/2026 · **Documentos:** [Entregas e evidências](./sprints/sprint-1-deliveries.md) · [Review e retrospectiva](./sprints/sprint-1-review.md) · [Apresentação](https://youtu.be/GThHoh05cKw)

**Objetivo:** estruturar o repositório e o ambiente containerizado, criar os scaffolds de backend e frontend, integrar as APIs auxiliares, configurar a persistência com ORM e produzir o protótipo da interface.

| Código | Requisito | Entrega concreta | Como verificar | Responsáveis | Evidência no GitHub | Situação |
|---|---|---|---|---|---|---|
| GA01 | RP08 | Product Backlog priorizado no GitHub Project e versionado. | Conferir épicos, itens, prioridade e sprint de cada issue. | Erick, Rafael | [#14](https://github.com/KaimanByte/Green-Byte/issues/14), [backlog.md](./backlog.md) | Concluído |
| GA02 | RP08 | Planejamento da Sprint 1 com itens, pontos e responsáveis. | Conferir o Sprint Backlog e os responsáveis das issues. | Gabriel, Rafael | [#18](https://github.com/KaimanByte/Green-Byte/issues/18), [sprint-1-review.md](./sprints/sprint-1-review.md) | Concluído |
| GA03 | RP08 | Critérios de aceite nas issues do Sprint Backlog. | Abrir as issues e conferir as condições de aceite. | Erick, Rafael | Issues da Sprint 1 no [Project](https://github.com/orgs/KaimanByte/projects/3) | Parcial — parte dos critérios ficou desmarcada em issues fechadas |
| GA04 | RP08 | Acompanhamento pelo Project e vínculo de commits com issues (`Closes #n`). | Conferir estados das issues e commits que as referenciam. | Equipe | [Project](https://github.com/orgs/KaimanByte/projects/3), [`8ab9e72`](https://github.com/KaimanByte/Green-Byte/commit/8ab9e72) | Concluído |
| GA05 | RP08 | Desenvolvimento distribuído entre 29/09 e 20/10. | Conferir datas e autores no histórico de commits. | Equipe | [Histórico de commits](https://github.com/KaimanByte/Green-Byte/commits/main) | Concluído |
| GA06 | RP08 | Sprint Review e retrospectiva da Sprint 1. | Ler a retrospectiva e as ações definidas para a Sprint 2. | Rafael | [#19](https://github.com/KaimanByte/Green-Byte/issues/19), [sprint-1-review.md](./sprints/sprint-1-review.md) | Concluído |
| GA07 | RP08 | Definition of Done. | Conferir a DoD versionada e sua aplicação. | Rafael | [#16](https://github.com/KaimanByte/Green-Byte/issues/16) | Pendente — DoD não versionada no repositório |
| GA08 | RNF08 | README com execução via Docker Compose; arquitetura, APIs externas e cálculos. | Seguir o README em ambiente limpo. | Thiago, Erick, Rafael | [README](../README.md), [arquitetura.md](./arquitetura.md), [api-externas.md](./api-externas.md), [calculos.md](./calculos.md) | Concluído |
| GA09 | RP08 | Participação de todos os integrantes. | Ver a tabela de integrantes abaixo. | Equipe | Tabela de integrantes | Concluído |
| DW01 | RP01, RP02 | Scaffolds React + TypeScript e NestJS + TypeScript. | `npm run build` em `frontend/` e `backend/`. | Thiago | [#27](https://github.com/KaimanByte/Green-Byte/issues/27), [#28](https://github.com/KaimanByte/Green-Byte/issues/28) | Concluído |
| DW02 | RF01, RF03, RF07 | Descoberta de serviços, coleta de métricas e consulta de intensidade de carbono. | Chamar `POST /services/sync` e `POST /regions/sync` e conferir os dados gravados. | Erick, Thiago | [#34](https://github.com/KaimanByte/Green-Byte/issues/34), [#35](https://github.com/KaimanByte/Green-Byte/issues/35), [#36](https://github.com/KaimanByte/Green-Byte/issues/36) | Concluído |
| DW03 | RF09, RF12 | Módulos NestJS com controller, service e repository; `GET /services` documentado no Swagger. | Acessar `/api/docs` e chamar `GET /services`. | Erick, João Pedro, Thiago | [#51](https://github.com/KaimanByte/Green-Byte/issues/51), [#54](https://github.com/KaimanByte/Green-Byte/issues/54) | Concluído |
| DW04 | RP03, RF10 | Drizzle ORM, esquema, migrações iniciais e repositories. | Subir o Compose em banco vazio e conferir as tabelas. | João Pedro, Thiago | [#38](https://github.com/KaimanByte/Green-Byte/issues/38)–[#40](https://github.com/KaimanByte/Green-Byte/issues/40), [migrations](../backend/drizzle/migrations/) | Concluído |
| DW05 | RP01, RF09 | Camada de serviços HTTP, hooks e provider; listagem de serviços na tela inicial. | Abrir o frontend e conferir os serviços vindos do backend. | João Pedro, João Lorena | [#56](https://github.com/KaimanByte/Green-Byte/issues/56), [#57](https://github.com/KaimanByte/Green-Byte/issues/57) | Concluído |
| DW07 | RP05, RNF08 | Dockerfiles, Compose e `.env.example`. | `docker compose up --build -d` e `docker compose ps`. | Thiago | [#29](https://github.com/KaimanByte/Green-Byte/issues/29), [docker-compose.yml](../docker-compose.yml) | Concluído |
| TP01 | RP04 | Separação entre clients, repositories, services e controllers. | Conferir a estrutura em `backend/src/modules/`. | Equipe | [arquitetura.md](./arquitetura.md) | Concluído |
| TP02 | RP04 | Repositories e clients registrados como providers e injetados. | Conferir os `*.module.ts` e os testes com doubles. | João Pedro, Thiago | [#40](https://github.com/KaimanByte/Green-Byte/issues/40) | Concluído |
| TP04 | RNF07 | Jest configurado com script de execução. | `npm test` em `backend/`. | João Pedro, Thiago | [#79](https://github.com/KaimanByte/Green-Byte/issues/79) | Concluído |
| IHC01 | RP09 | Identificação dos usuários e tarefas prioritárias. | Conferir o artefato com perfis e tarefas. | João Lorena, Gabriel | [#73](https://github.com/KaimanByte/Green-Byte/issues/73) | Parcial — usuários e tarefas não registrados em arquivo do repositório |
| IHC02 | RP09, RP06 | Protótipo das telas e fluxo de navegação no Figma. | Abrir o protótipo e comparar com a navegação entregue. | João Lorena, Gabriel | [#74](https://github.com/KaimanByte/Green-Byte/issues/74), [Figma](https://www.figma.com/design/UGCKmaZiect64Zh70T6pDQ/Greenbyte?node-id=0-1&p=f&t=au1eMTGdW9o8Wnld-0) | Concluído |

### Integrantes — Sprint 1

| Integrante | Tarefas assumidas | Contribuições realizadas | Evidências no GitHub |
|---|---|---|---|
| Thiago Guedes | #12, #27, #28, #29, #32, #36, #39, #40, #54 | Repositório, scaffolds, Docker Compose, contratos das APIs, repositories e migrações, Swagger e configuração do Jest. | [`b2d301e`](https://github.com/KaimanByte/Green-Byte/commit/b2d301e), [`ee33744`](https://github.com/KaimanByte/Green-Byte/commit/ee33744), [`de37c59`](https://github.com/KaimanByte/Green-Byte/commit/de37c59), [`05ce28f`](https://github.com/KaimanByte/Green-Byte/commit/05ce28f) |
| Erick Rost | #13, #14, #17, #31, #33, #34, #35, #46, #51, #54 | Backlog, arquitetura, fórmulas de cálculo, integração com serviços e métricas, módulo de regiões. | [`98ea661`](https://github.com/KaimanByte/Green-Byte/commit/98ea661), [`e4659b3`](https://github.com/KaimanByte/Green-Byte/commit/e4659b3), [`b3dbbd5`](https://github.com/KaimanByte/Green-Byte/commit/b3dbbd5), [`86e7316`](https://github.com/KaimanByte/Green-Byte/commit/86e7316) |
| Rafael Melo | #13, #14, #15, #16, #17, #18, #19, #20 | Gestão do Project e do backlog, planejamento e review, README, repositories de coletas e configurações, rota de sincronização. | [`176238a`](https://github.com/KaimanByte/Green-Byte/commit/176238a), [`a821d82`](https://github.com/KaimanByte/Green-Byte/commit/a821d82), [`ae4179f`](https://github.com/KaimanByte/Green-Byte/commit/ae4179f), [`5700a41`](https://github.com/KaimanByte/Green-Byte/commit/5700a41) |
| João Pedro | #38, #39, #40, #51, #56, #57, #79 | Drizzle ORM, modelo de dados, migração inicial, `GET /services`, camada de API do frontend e documentação de testes. | [`a2bbb15`](https://github.com/KaimanByte/Green-Byte/commit/a2bbb15), [`0bfc923`](https://github.com/KaimanByte/Green-Byte/commit/0bfc923), [`8ab9e72`](https://github.com/KaimanByte/Green-Byte/commit/8ab9e72), [`d5ba4e8`](https://github.com/KaimanByte/Green-Byte/commit/d5ba4e8) |
| João Lorena | #57, #58, #66, #73, #74 | Globo 3D com skybox, dashboard, busca de datacenters, usuários e tarefas, protótipo. | [`d742916`](https://github.com/KaimanByte/Green-Byte/commit/d742916), [`707db96`](https://github.com/KaimanByte/Green-Byte/commit/707db96) |
| Gabriel Oliveira | #18, #59, #66, #73, #74 | Planejamento da sprint, menu lateral, marcadores de região com painel e conector, protótipo. | [`2d32723`](https://github.com/KaimanByte/Green-Byte/commit/2d32723), [`d91c277`](https://github.com/KaimanByte/Green-Byte/commit/d91c277), [`f72bcf9`](https://github.com/KaimanByte/Green-Byte/commit/f72bcf9) |

---

## Sprint 2 — Núcleo do produto

**Período:** 21/10/2026 a 10/11/2026 · **Documentos:** [Review e retrospectiva](./sprints/sprint-2-review.md) · [Apresentação](https://youtu.be/kV9ovx7NV9Q)

**Objetivo:** completar o fluxo entre coleta, persistência, cálculo, API e interface, com cálculo de energia e CO₂e, histórico, estados dos serviços, tolerância a falhas, endpoints analíticos e autenticação.

| Código | Requisito | Entrega concreta | Como verificar | Responsáveis | Evidência no GitHub | Situação |
|---|---|---|---|---|---|---|
| GA01 | RP08 | Backlog atualizado com os itens da Sprint 2 e antecipações da Sprint 3. | Conferir o milestone da Sprint 2 no Project. | Rafael, Gabriel | [backlog.md](./backlog.md) | Concluído |
| GA02 | RP08 | Planejamento da Sprint 2 (83 pontos). | Conferir itens, pontos e responsáveis. | Gabriel, Rafael | [#21](https://github.com/KaimanByte/Green-Byte/issues/21) | Concluído |
| GA03 | RP08 | Critérios de aceite nas issues da sprint. | Abrir as issues e conferir as condições. | Equipe | Issues do milestone Sprint 2 | Concluído |
| GA04 | RP08 | Burndown e vínculo de commits com issues. | Conferir o burndown e os commits `Closes #n`. | Equipe | [Burndown](./sprints/sprint-2-burndown.png), [`14309a5`](https://github.com/KaimanByte/Green-Byte/commit/14309a5) | Parcial — issues fechadas de forma concentrada no fim da sprint |
| GA05 | RP08 | Entregas entre 05/11 e 10/11 relacionadas às issues. | Conferir o histórico de commits do período. | Equipe | [Histórico de commits](https://github.com/KaimanByte/Green-Byte/commits/main) | Parcial — atividade concentrada na última semana |
| GA06 | RP08 | Review, retrospectiva e ações para a Sprint 3. | Ler a retrospectiva e as ações definidas. | Equipe | [sprint-2-review.md](./sprints/sprint-2-review.md) | Concluído — issues #22 e #23 ainda abertas |
| GA07 | RP08 | Aplicação da DoD aos itens fechados. | Conferir a DoD e os itens concluídos. | Rafael | [#16](https://github.com/KaimanByte/Green-Byte/issues/16) | Pendente — DoD não versionada |
| GA08 | RNF08 | README com variáveis obrigatórias e migrações pelo Drizzle no Docker. | Seguir o README em ambiente limpo. | Thiago | [`9e2ceb6`](https://github.com/KaimanByte/Green-Byte/commit/9e2ceb6), [README](../README.md) | Concluído |
| GA09 | RP08 | Participação de todos os integrantes. | Ver a tabela de integrantes abaixo. | Equipe | Tabela de integrantes | Concluído |
| DW01 | RP01, RP02 | Evolução do frontend e do backend com React/TS e NestJS/TS. | `npm run build` nos dois projetos. | Equipe | [frontend](../frontend/), [backend](../backend/) | Concluído |
| DW02 | RF02, RF03, RNF05 | Coleta periódica, reconciliação de serviços, clients com URLs do `.env` e validação das respostas. | Subir o backend e acompanhar os ciclos nos logs. | Erick, Rafael, Thiago | [#37](https://github.com/KaimanByte/Green-Byte/issues/37), [#48](https://github.com/KaimanByte/Green-Byte/issues/48), [#49](https://github.com/KaimanByte/Green-Byte/issues/49), [`7efb1b8`](https://github.com/KaimanByte/Green-Byte/commit/7efb1b8) | Concluído |
| DW03 | RF08, RF10, RF14, RF15 | Endpoints de histórico, resumo, ranking e comparação. | Chamar `/summary`, `/ranking` e `/compare` (ver [api.md](./api.md)). | João Pedro | [#53](https://github.com/KaimanByte/Green-Byte/issues/53), [#55](https://github.com/KaimanByte/Green-Byte/issues/55) | Concluído |
| DW04 | RF10 | Histórico de coletas consultável por período. | Chamar `GET /services/:id/history` com `from` e `to`. | João Pedro | [#41](https://github.com/KaimanByte/Green-Byte/issues/41) | Concluído |
| DW05 | RF10, RF15 | Gráficos de evolução e comparação entre serviços no dashboard. | Abrir o dashboard e alternar métricas e períodos. | Rafael, João Lorena | [#63](https://github.com/KaimanByte/Green-Byte/issues/63), [#65](https://github.com/KaimanByte/Green-Byte/issues/65), [`0bcf492`](https://github.com/KaimanByte/Green-Byte/commit/0bcf492) | Concluído |
| DW06 | RF16, RP07, RNF06 | Login com hash e JWT, rotas protegidas e administrador inicial por variáveis. | `POST /auth/login` e chamada a rota protegida com e sem token. | Thiago, Gabriel | [#68](https://github.com/KaimanByte/Green-Byte/issues/68), [#69](https://github.com/KaimanByte/Green-Byte/issues/69), [#72](https://github.com/KaimanByte/Green-Byte/issues/72) | Concluído |
| TP02 | RP04 | Calculadora e clients externos injetados nos services. | Conferir os providers e os testes com doubles. | Rafael | [`c75d012`](https://github.com/KaimanByte/Green-Byte/commit/c75d012) | Concluído |
| TP04 | RNF07 | Testes do cálculo, dos estados e da reconciliação. | `npm test` em `backend/`. | Erick, Rafael | [#50](https://github.com/KaimanByte/Green-Byte/issues/50), [`b46d4df`](https://github.com/KaimanByte/Green-Byte/commit/b46d4df) | Concluído |
| TP05 | RP02, RNF06, RF06 | ValidationPipe global, tratamento de exceções e de dados ausentes no cálculo. | Enviar parâmetros inválidos e conferir o `400`. | Thiago, Rafael | [#44](https://github.com/KaimanByte/Green-Byte/issues/44), [#52](https://github.com/KaimanByte/Green-Byte/issues/52), [`22c9095`](https://github.com/KaimanByte/Green-Byte/commit/22c9095) | Concluído |
| IHC03 | RNF02 | Estados dos serviços com texto e ícone, não apenas cor. | Conferir os estados no dashboard. | Rafael | [#61](https://github.com/KaimanByte/Green-Byte/issues/61) | Concluído |
| IHC04 | RNF01, RNF05 | Estados de carregamento, vazio e erro por painel. | Desligar o backend e conferir as mensagens. | João Lorena, Rafael | [#62](https://github.com/KaimanByte/Green-Byte/issues/62) | Concluído |

### Integrantes — Sprint 2

| Integrante | Tarefas assumidas | Contribuições realizadas | Evidências no GitHub |
|---|---|---|---|
| Thiago Guedes | #43, #47, #48, #52, #68, #69, #72 | Módulo de usuários, autenticação JWT e guards, migrações no Docker e documentação do ambiente. | [`1fd39bb`](https://github.com/KaimanByte/Green-Byte/commit/1fd39bb), [`cc805a3`](https://github.com/KaimanByte/Green-Byte/commit/cc805a3), [`9e2ceb6`](https://github.com/KaimanByte/Green-Byte/commit/9e2ceb6) |
| Erick Rost | #37, #42, #43, #47, #50 | Coleta periódica, cálculo de potência e energia, estados dos serviços e testes. | [`a56a736`](https://github.com/KaimanByte/Green-Byte/commit/a56a736), [`0c8bd9c`](https://github.com/KaimanByte/Green-Byte/commit/0c8bd9c) |
| Rafael Melo | #21, #44, #48, #49, #61, #62, #63, #65 | Planejamento, clients externos, validação das métricas, EnergyCalculator com testes, ValidationPipe, gráficos e comparação. | [`7efb1b8`](https://github.com/KaimanByte/Green-Byte/commit/7efb1b8), [`b46d4df`](https://github.com/KaimanByte/Green-Byte/commit/b46d4df), [`22c9095`](https://github.com/KaimanByte/Green-Byte/commit/22c9095), [`0bcf492`](https://github.com/KaimanByte/Green-Byte/commit/0bcf492) |
| João Pedro | #41, #45, #53, #55 | Histórico por período, indicadores agregados, endpoints de resumo, ranking e comparação. | [`14309a5`](https://github.com/KaimanByte/Green-Byte/commit/14309a5), [`e463093`](https://github.com/KaimanByte/Green-Byte/commit/e463093), [`707cb9b`](https://github.com/KaimanByte/Green-Byte/commit/707cb9b), [`df258d4`](https://github.com/KaimanByte/Green-Byte/commit/df258d4) |
| João Lorena | #62, #76 | Animação de abertura, dashboard com carga parcial e efeito de vidro. | [`a541951`](https://github.com/KaimanByte/Green-Byte/commit/a541951), [`3223073`](https://github.com/KaimanByte/Green-Byte/commit/3223073), [`f22cb59`](https://github.com/KaimanByte/Green-Byte/commit/f22cb59) |
| Gabriel Oliveira | #21 | Planejamento, painel de login integrado ao backend, cliente HTTP com token e variáveis obrigatórias. | [`0198eb0`](https://github.com/KaimanByte/Green-Byte/commit/0198eb0), [`68a6ec3`](https://github.com/KaimanByte/Green-Byte/commit/68a6ec3), [`d580df5`](https://github.com/KaimanByte/Green-Byte/commit/d580df5) |

---

## Sprint 3 — Fechamento do MVP

**Período:** 11/11/2026 a 23/11/2026 · **Documentos:** [Planejamento e retrospectiva](./sprints/sprint-3.md) · [Review](./sprints/sprint-3-review.md) · [Apresentação](https://youtu.be/N0xXI7HD1uw)

**Objetivo:** concluir a área administrativa e a configuração do monitoramento, a proteção no frontend, a responsividade, a avaliação de usabilidade e a revisão final de qualidade e documentação. Durante a sprint foram incluídas a gestão de usuários, a auditoria e a saúde da coleta (#107, #108 e #109).

| Código | Requisito | Entrega concreta | Como verificar | Responsáveis | Evidência no GitHub | Situação |
|---|---|---|---|---|---|---|
| GA01 | RP08 | Backlog reconciliado com o Project. | Conferir o milestone da Sprint 3 e o backlog versionado. | Rafael, Thiago | [backlog.md](./backlog.md) | Concluído |
| GA02 | RP08 | Planejamento de 33 pontos, revisado para 46 com justificativa. | Conferir a seção de backlog em `sprint-3.md`. | Rafael, Erick | [#24](https://github.com/KaimanByte/Green-Byte/issues/24), [sprint-3.md](./sprints/sprint-3.md) | Concluído |
| GA03 | RP08 | Critérios de aceite nas issues da sprint. | Abrir as issues e conferir as condições. | Equipe | Issues do milestone Sprint 3 | Concluído |
| GA04 | RP08 | Burndown e commits vinculados às issues. | Conferir o burndown e os commits `Closes #n`. | Equipe | [Burndown](./sprints/sprint-3-burndown.png), [`b6767bc`](https://github.com/KaimanByte/Green-Byte/commit/b6767bc) | Parcial — status das issues atualizado no fim da sprint |
| GA05 | RP08 | Entregas relacionadas às issues da sprint. | Conferir o histórico de commits do período. | Equipe | [Histórico de commits](https://github.com/KaimanByte/Green-Byte/commits/main) | Parcial — atividade concentrada entre 20/11 e 23/11 |
| GA06 | RP08 | Review, retrospectiva, avaliação final do projeto e pendências. | Ler `sprint-3-review.md`. | Equipe | [#25](https://github.com/KaimanByte/Green-Byte/issues/25), [sprint-3-review.md](./sprints/sprint-3-review.md) | Parcial — falta a avaliação final do projeto e o registro das pendências |
| GA07 | RP08 | Definition of Done aplicada às entregas. | Conferir a DoD versionada. | Rafael | [#16](https://github.com/KaimanByte/Green-Byte/issues/16) | Pendente — DoD não versionada |
| GA08 | RNF08 | README, índice da documentação, API, deploy e instruções de E2E. | Seguir o README em ambiente limpo. | Thiago | [#83](https://github.com/KaimanByte/Green-Byte/issues/83), [README](../README.md), [docs/README.md](./README.md) | Concluído |
| GA09 | RP08 | Participação de todos os integrantes. | Ver a tabela de integrantes abaixo. | Equipe | Tabela de integrantes | Concluído |
| DW01 | RP01, RP02 | Versão final com React/TS e NestJS/TS. | `npm run build` nos dois projetos. | Equipe | [frontend](../frontend/), [backend](../backend/) | Concluído |
| DW03 | RF16, RF17 | Módulos de usuários, configurações, auditoria e monitoramento. | Conferir as rotas em `/api/docs` e em [api.md](./api.md). | João Pedro, Gabriel, Erick | [#107](https://github.com/KaimanByte/Green-Byte/issues/107), [#108](https://github.com/KaimanByte/Green-Byte/issues/108), [#109](https://github.com/KaimanByte/Green-Byte/issues/109) | Concluído |
| DW04 | RP03 | Migrações de papéis, auditoria, configurações e índice por horário. | Aplicar as migrações em banco vazio. | Erick | [`b0def88`](https://github.com/KaimanByte/Green-Byte/commit/b0def88), [migrations](../backend/drizzle/migrations/) | Concluído |
| DW05 | RF17 | Painel de administração, painéis sob demanda e exportação CSV. | Entrar como admin e usar a área de administração. | Rafael, Thiago, João Lorena | [#70](https://github.com/KaimanByte/Green-Byte/issues/70), [`0e48477`](https://github.com/KaimanByte/Green-Byte/commit/0e48477), [`4481cf6`](https://github.com/KaimanByte/Green-Byte/commit/4481cf6) | Concluído |
| DW06 | RF16, RF17, RNF06 | Login no frontend, papéis `admin`/`operator` e bloqueio de contas desativadas. | Acessar a administração com e sem login e com cada papel. | Gabriel, João Lorena, Thiago | [#71](https://github.com/KaimanByte/Green-Byte/issues/71), [`ddacced`](https://github.com/KaimanByte/Green-Byte/commit/ddacced) | Concluído |
| DW07 | RNF08 | Documentação dos endpoints e rota pública de health check. | Ler [api.md](./api.md) e chamar `GET /health`. | Thiago | [api.md](./api.md), [`78b2353`](https://github.com/KaimanByte/Green-Byte/commit/78b2353) | Concluído |
| TP03 | RNF07 | Revisão de tipagem estrita e código limpo. | Conferir a ausência de `any` e `npm run lint`. | João Pedro, Thiago | [#81](https://github.com/KaimanByte/Green-Byte/issues/81), [`af65de7`](https://github.com/KaimanByte/Green-Byte/commit/af65de7) | Concluído |
| TP04 | RNF07 | Testes das regras da Sprint 3 e E2E administrativo. | `npm test` em `backend/` e `frontend/`. | João Pedro, João Lorena, Thiago | [#82](https://github.com/KaimanByte/Green-Byte/issues/82), [`c9aab94`](https://github.com/KaimanByte/Green-Byte/commit/c9aab94), [`4e34e48`](https://github.com/KaimanByte/Green-Byte/commit/4e34e48) | Concluído |
| TP05 | RNF06 | Validação das faixas de configuração e dos dados de usuários. | `PATCH /settings` com valor fora da faixa retorna `400`. | Gabriel, João Pedro | [#109](https://github.com/KaimanByte/Green-Byte/issues/109) | Concluído |
| IHC03 | RNF02 | Diretrizes de unidades, período, última atualização e estados. | Ler [interface.md](./interface.md) e conferir no dashboard. | Thiago | [#75](https://github.com/KaimanByte/Green-Byte/issues/75), [interface.md](./interface.md) | Concluído |
| IHC04 | RNF01 | Layout mobile, painéis sob demanda e teclado no celular. | Abrir o deploy em tela de celular. | João Lorena, Rafael, Thiago | [#67](https://github.com/KaimanByte/Green-Byte/issues/67), [`05bc7b1`](https://github.com/KaimanByte/Green-Byte/commit/05bc7b1), [`cb6a71d`](https://github.com/KaimanByte/Green-Byte/commit/cb6a71d) | Concluído |
| IHC05 | RP09 | Avaliação de usabilidade com usuários representativos. | Conferir roteiro, tarefas e resultados registrados. | — | [#77](https://github.com/KaimanByte/Green-Byte/issues/77), [interface.md](./interface.md) | Pendente — avaliação não realizada |
| IHC06 | RP09 | Melhorias decorrentes da avaliação. | Relacionar achados a issues e alterações. | — | [#78](https://github.com/KaimanByte/Green-Byte/issues/78) | Pendente — depende de IHC05 |

### Integrantes — Sprint 3

| Integrante | Tarefas assumidas | Contribuições realizadas | Evidências no GitHub |
|---|---|---|---|
| Thiago Guedes | #75, #81, #82, #83, #107 | Exportação CSV, bloqueio de contas desativadas, health check, E2E administrativo, ajuste de teclado no celular e documentação da sprint. | [`4481cf6`](https://github.com/KaimanByte/Green-Byte/commit/4481cf6), [`ddacced`](https://github.com/KaimanByte/Green-Byte/commit/ddacced), [`78b2353`](https://github.com/KaimanByte/Green-Byte/commit/78b2353), [`4e34e48`](https://github.com/KaimanByte/Green-Byte/commit/4e34e48) |
| Erick Rost | #24, #107, #108, #109 | Planejamento da sprint, migração de papéis, auditoria e configurações, módulo de auditoria. | [`b0def88`](https://github.com/KaimanByte/Green-Byte/commit/b0def88), [`fd634ad`](https://github.com/KaimanByte/Green-Byte/commit/fd634ad) |
| Rafael Melo | #24, #67, #70, #107 | Planejamento da sprint, painel de administração, papel na conta e layout mobile. | [`0e48477`](https://github.com/KaimanByte/Green-Byte/commit/0e48477), [`05bc7b1`](https://github.com/KaimanByte/Green-Byte/commit/05bc7b1) |
| João Pedro | #81, #107, #108, #109 | Gestão de usuários, auditoria, saúde da coleta, testes e revisão de tipagem. | [`b6767bc`](https://github.com/KaimanByte/Green-Byte/commit/b6767bc), [`2e73262`](https://github.com/KaimanByte/Green-Byte/commit/2e73262), [`24571cd`](https://github.com/KaimanByte/Green-Byte/commit/24571cd), [`af65de7`](https://github.com/KaimanByte/Green-Byte/commit/af65de7) |
| João Lorena | #67, #71, #82 | Dashboard acompanhando o intervalo efetivo da coleta e testes de ranking e comparação. | [`65f6508`](https://github.com/KaimanByte/Green-Byte/commit/65f6508), [`f70d7db`](https://github.com/KaimanByte/Green-Byte/commit/f70d7db) |
| Gabriel Oliveira | #70, #71, #108, #109 | Saúde e configuração dinâmica da coleta, gestão de usuários com papéis e auditoria. | [`2a77c82`](https://github.com/KaimanByte/Green-Byte/commit/2a77c82), [`d36d5c0`](https://github.com/KaimanByte/Green-Byte/commit/d36d5c0) |

---

## Pendências

| Item | Critério | Situação | Próximo passo |
|---|---|---|---|
| Definition of Done versionada | GA07 | Pendente desde a Sprint 1 (#16). | Registrar a DoD no repositório e referenciá-la nas issues concluídas. |
| Usuários e tarefas em arquivo | IHC01 | Registrado apenas no Project (#73). | Incluir perfis e tarefas prioritárias em [interface.md](./interface.md). |
| Avaliação de usabilidade e melhorias | IHC05, IHC06 | Não realizadas; as issues #77 e #78 estão fechadas sem evidência. | Reabrir as issues ou registrar o encerramento como pendência justificada. |
| Avaliação final do projeto | GA06 | `sprint-3-review.md` sem balanço final. | Registrar o planejado × entregue nas três sprints, os retornos recebidos e as pendências. |
| Issues administrativas abertas | GA04 | #22, #23, #24, #25, #26 e #83 abertas. | Fechar após registrar as evidências. |
| Tags das versões entregues | GA08 | Nenhuma tag `sprint-1`, `sprint-2` ou `sprint-3` publicada. | Criar as tags e informar os links ao professor. |
