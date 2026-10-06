# Product Backlog — GreenER (ABP 2026-2 · 3º DSM)

> Documento versionado do backlog. A fonte de trabalho diária é o **GitHub Project** do repositório; este arquivo é o retrato inicial (criado na Sprint 1) e a **matriz de rastreabilidade** requisito → item.

## 1. Convenções

- **Prioridade**: `P0` obrigatório para o MVP · `P1` importante · `P2` desejável (RF13 "poderá" e CI). Em caso de falta de capacidade, corta-se de baixo para cima.
- **Estimativa**: pontos de história (1, 2, 3, 5, 8). Os totais por sprint são **indicativos**; a capacidade real deve ser calculada no planejamento (pessoas × horas) e a velocidade medida após a Sprint 1.
- **Tipos**: `história` (valor para um usuário), `tarefa` (trabalho técnico ou de gestão), `spike` (investigação com tempo limitado).
- **Rubrica**: cada item indica os critérios (GA, DW, TP, IHC) que ele sustenta, para facilitar a evidência no GitHub.

## 2. Épicos

| Épico | Nome | Requisitos | Critérios da rubrica |
|---|---|---|---|
| E01 | Gestão ágil do projeto | RP08 | GA01–GA09 |
| E02 | Arquitetura, ambiente e infraestrutura | RP01, RP02, RP05 | DW01, DW07 |
| E03 | Integração com as APIs auxiliares | RF01, RF03, RF04 | DW02 |
| E04 | Persistência (PostgreSQL + ORM) | RP03, RF10 | DW04 |
| E05 | Cálculo de energia e CO₂e | RF07, RF08, RP04 | TP01, TP04 |
| E06 | Monitoramento dinâmico e estados | RF02, RF05, RF06 | TP01, TP02, TP04 |
| E07 | API REST do backend | RP02 | DW03, TP05 |
| E08 | Dashboard (frontend) | RF09, RF11, RF12, RF13, RF14, RF15 | DW05, IHC03, IHC04 |
| E09 | Autenticação e configuração | RF16, RP07, RNF06 | DW06 |
| E10 | Interação Humano-Computador | RP09, RNF01, RNF02 | IHC01–IHC06 |
| E11 | Qualidade e documentação final | RNF07, RNF08 | TP01–TP04, GA08 |

## 3. Visão por sprint (proposta a validar)

### Sprint 1 — até 20/10/2026

**Objetivo:** Fundação: ambiente containerizado, integração com as APIs auxiliares, persistência inicial, protótipo e organização ágil.

**Critérios da rubrica previstos (65 pts):** GA01, GA02, GA03, GA04, GA05, GA06, GA07, GA08, GA09, DW01, DW02, DW03, DW04, DW07, IHC01, IHC02  

**Itens:** 27 · **Pontos de história:** 76

| ID | Item | Tipo | Prio | Pts | Requisitos | Rubrica |
|---|---|---|---|---|---|---|
| GA-01 | Criar o repositório único e a estrutura inicial | tarefa | P0 | 2 | RP08 | GA08 |
| GA-02 | Configurar o GitHub Project, labels e milestones | tarefa | P0 | 2 | RP08 | GA01, GA04 |
| GA-03 | Registrar o Product Backlog priorizado | tarefa | P0 | 3 | RP06, RP08 (todos os RF/RNF/RP) | GA01, GA03 |
| GA-04 | Elaborar e validar o docs/plano-de-entregas.md | tarefa | P0 | 3 | RP08 | GA01, GA02 |
| GA-05 | Definir a Definition of Done e os templates de issue/PR | tarefa | P0 | 2 | RP08 | GA07 |
| GA-06 | Definir o fluxo de trabalho Git (branches, commits, PR com revisão) | tarefa | P0 | 1 | RP08 | GA04, GA05, GA09 |
| GA-07 | Planejamento da Sprint 1 | tarefa | P0 | 2 | RP08 | GA02 |
| GA-08 | Sprint Review e Retrospectiva da Sprint 1 | tarefa | P0 | 2 | RP08 | GA06 |
| GA-09 | Fechamento e entrega da Sprint 1 (tag sprint-1) | tarefa | P0 | 2 | RP08 | GA02, GA04, GA07, GA08, GA09 |
| IN-01 | Criar o scaffold do backend (NestJS + TypeScript) | tarefa | P0 | 3 | RP02, RP04 | DW01, DW03, TP03 |
| IN-02 | Criar o scaffold do frontend (React + TypeScript) | tarefa | P0 | 3 | RP01 | DW01, DW05 |
| IN-03 | Containerizar frontend, backend e PostgreSQL com Docker Compose | história | P0 | 5 | RP05, RNF08 | DW07 |
| DOC-01 | Documentar a arquitetura inicial (docs/arquitetura.md) | tarefa | P1 | 2 | RNF08 | DW07, TP01 |
| IT-01 | Spike: ler os Swagger das duas APIs e documentar os contratos | spike | P0 | 2 | RF01, RF03 | DW02 |
| IT-02 | Spike: conferir a fórmula de cálculo e o escopo (energia/água) | spike | P0 | 1 | RF07 | TP04 |
| IT-03 | Consumir /services do Agregador (descoberta de serviços) | história | P0 | 5 | RF01, RNF05 | DW02, TP02, TP05 |
| IT-04 | Coletar /metrics/{id_servico} para cada serviço | história | P0 | 5 | RF03, RF04 | DW02 |
| DB-01 | Escolher o ORM e configurar a conexão com o PostgreSQL | tarefa | P0 | 3 | RP03 | DW04 |
| DB-02 | Modelar as entidades e criar as migrações iniciais | história | P0 | 5 | RP03, RF10, RNF08 | DW04 |
| DB-03 | Criar os repositories de serviços e coletas | história | P0 | 3 | RP04, RF10 | DW03, DW04, TP02 |
| API-01 | Endpoint GET /services | história | P0 | 3 | RF09, RF12 | DW03 |
| API-04 | Documentar endpoints com OpenAPI/Swagger e docs/api.md | tarefa | P1 | 2 | RNF08 | DW03, DW07 |
| FE-01 | Camada de acesso à API e provider de dados | tarefa | P0 | 3 | RP01 | DW05 |
| FE-02 | Vertical slice: listar serviços do backend na tela inicial | história | P1 | 2 | RF09 | DW05, IHC02 |
| UX-01 | Identificar usuários e tarefas prioritárias | tarefa | P0 | 3 | RP09 | IHC01 |
| UX-02 | Protótipo das principais telas e fluxo de navegação | história | P0 | 5 | RP09, RP06, RNF01 | IHC02 |
| QA-01 | Configurar testes (Jest) e script de execução | tarefa | P0 | 2 | RNF07 | TP04, DW07 |

### Sprint 2 — até 10/11/2026

**Objetivo:** Núcleo do produto: cálculo de energia e CO₂e, monitoramento dinâmico, histórico e dashboard operacional.

**Critérios da rubrica previstos (83 pts):** GA01, GA02, GA03, GA04, GA05, GA06, GA07, GA08, GA09, DW01, DW02, DW03, DW04, DW05, DW07, TP01, TP02, TP04, TP05, IHC03, IHC04  

**Itens:** 26 · **Pontos de história:** 83

| ID | Item | Tipo | Prio | Pts | Requisitos | Rubrica |
|---|---|---|---|---|---|---|
| GA-10 | Planejamento da Sprint 2 | tarefa | P0 | 2 | RP08 | GA02 |
| GA-11 | Sprint Review e Retrospectiva da Sprint 2 | tarefa | P0 | 2 | RP08 | GA06 |
| GA-12 | Fechamento e entrega da Sprint 2 (tag sprint-2) | tarefa | P0 | 2 | RP08 | GA02, GA04, GA07, GA08, GA09 |
| IN-04 | Configurar pipeline de CI (lint + testes a cada PR) | tarefa | P2 | 3 | RNF07 | GA05, TP04 |
| IT-05 | Consumir a API de Intensidade de Carbono por região | história | P0 | 5 | RF07, RNF05 | DW02 |
| IT-06 | Agendar a coleta periódica com intervalo configurável | história | P0 | 3 | RF03, RNF03 | DW02 |
| DB-04 | Histórico de coletas com consulta por período | história | P0 | 5 | RF10 | DW04 |
| CA-01 | Calcular a potência (W) a partir de CPU, RAM, disco e rede | história | P0 | 5 | RF07, RP04, RNF07 | TP01, TP04 |
| CA-02 | Calcular energia (kWh) e emissão (gCO₂e) | história | P0 | 3 | RF07 | TP01, TP04 |
| CA-03 | Tratar dados ausentes ou inválidos no cálculo | tarefa | P0 | 2 | RF06, RNF05, RNF07 | TP04, TP05 |
| CA-04 | Calcular os indicadores agregados do ambiente | história | P0 | 3 | RF08 | DW03 |
| CA-05 | Documentar fórmulas, unidades e exemplos (docs/calculos.md) | tarefa | P1 | 2 | RNF08 | TP01 |
| MD-01 | Classificar o estado de cada serviço | história | P0 | 5 | RF05, RF06, RNF07 | TP01, TP04 |
| MD-02 | Reconciliar a lista de serviços a cada ciclo | história | P0 | 5 | RF02 | DW02 |
| MD-03 | Garantir tolerância a falhas das APIs auxiliares | tarefa | P0 | 3 | RNF05 | TP05 |
| MD-04 | Testes unitários de estados e reconciliação | tarefa | P0 | 3 | RNF07 | TP02, TP04 |
| API-02 | Validação de entrada e tratamento global de exceções | tarefa | P0 | 3 | RP02, RNF06 | TP05 |
| API-03 | Endpoints de histórico e indicadores (/services/:id/history e /summary) | história | P0 | 5 | RF08, RF10 | DW03 |
| FE-03 | Dashboard operacional por serviço | história | P0 | 5 | RF09, RF12, RP06 | DW05, IHC03 |
| FE-04 | Cards de indicadores consolidados | história | P0 | 3 | RF08 | IHC03 |
| FE-05 | Atualização automática e 'última atualização' | história | P0 | 3 | RF11, RNF03 | IHC03 |
| FE-06 | Estados e alertas por texto e ícone (não só cor) | tarefa | P0 | 2 | RNF02 | IHC03 |
| FE-07 | Estados de carregamento, vazio e erro | tarefa | P0 | 3 | RNF05, RNF01 | IHC04 |
| UX-03 | Definir diretrizes de apresentação dos indicadores | tarefa | P1 | 2 | RNF02, RNF03 | IHC03 |
| UX-04 | Planejar a avaliação de usabilidade | tarefa | P0 | 2 | RP09 | IHC05 |
| QA-02 | Justificar SOLID e injeção de dependências na arquitetura | tarefa | P1 | 2 | RP04 | TP01, TP02 |

### Sprint 3 — até 23/11/2026

**Objetivo:** Fechamento do MVP: ranking, comparação, mapa, autenticação, avaliação de usabilidade e documentação final.

**Critérios da rubrica previstos (69 pts):** GA01, GA02, GA03, GA04, GA05, GA06, GA07, GA08, GA09, DW01, DW02, DW05, DW06, DW07, TP03, TP04, IHC05, IHC06  

**Itens:** 19 · **Pontos de história:** 64

| ID | Item | Tipo | Prio | Pts | Requisitos | Rubrica |
|---|---|---|---|---|---|---|
| GA-13 | Planejamento da Sprint 3 | tarefa | P0 | 2 | RP08 | GA02 |
| GA-14 | Sprint Review e Retrospectiva da Sprint 3 | tarefa | P0 | 2 | RP08 | GA06 |
| GA-15 | Fechamento e entrega da Sprint 3 (tag sprint-3) | tarefa | P0 | 2 | RP08 | GA02, GA04, GA07, GA08, GA09 |
| API-05 | Endpoints de ranking e comparação | história | P0 | 5 | RF14, RF15 | DW03 |
| FE-08 | Gráfico de histórico por serviço | história | P1 | 5 | RF10 | IHC03 |
| FE-09 | Ranking de impacto | história | P0 | 3 | RF14 | IHC03 |
| FE-10 | Comparação entre serviços | história | P0 | 5 | RF15 | IHC03 |
| FE-11 | Mapa geográfico dos serviços | história | P2 | 5 | RF13 | IHC03 |
| FE-12 | Responsividade e desempenho | tarefa | P0 | 3 | RNF01, RNF04 | IHC04 |
| AU-01 | Login com senha em hash e emissão de JWT | história | P0 | 5 | RF16, RP07, RNF06 | DW06 |
| AU-02 | Proteger rotas de configuração (guard JWT + DTO) | história | P0 | 3 | RF16, RP07, RNF06 | DW06 |
| AU-03 | Área de configuração do monitoramento | história | P0 | 5 | RF16, RNF03 | DW06 |
| AU-04 | Tela de login e rota protegida no frontend | história | P0 | 3 | RF16 | DW06, IHC03 |
| AU-05 | Usuário inicial por seed e variáveis de ambiente | tarefa | P0 | 2 | RNF06 | DW06 |
| UX-05 | Executar a avaliação de usabilidade e registrar resultados | história | P0 | 3 | RP09 | IHC05 |
| UX-06 | Aplicar as melhorias decorrentes da avaliação | história | P0 | 3 | RP09 | IHC06 |
| QA-03 | Revisão de tipagem e código limpo | tarefa | P1 | 3 | RNF07 | TP03 |
| QA-04 | Testes unitários das regras da Sprint 3 (ranking, comparação, auth) | tarefa | P0 | 3 | RNF07, RNF06 | TP04, TP05 |
| QA-05 | Conferir README, comandos e links (uso como portfólio) | tarefa | P0 | 2 | RNF08 | GA08, DW07 |

> **Regra da rubrica:** GA01–GA09 e DW01 são avaliados em todas as sprints, e a rubrica é cumulativa (o que foi aceito antes não pode quebrar).

## 4. Backlog detalhado por épico

### E01 · Gestão ágil do projeto

_Backlog, planejamento, DoD, rituais, rastreabilidade e participação da equipe._

#### GA-01 — Criar o repositório único e a estrutura inicial
**Sprint 1** · tarefa · P0 · 2 pts · Requisitos: RP08 · Rubrica: GA08

Repositório único para as três sprints, com a estrutura sugerida pelo professor e README inicial.

Critérios de aceite:
- [ ] Estrutura de pastas conforme a sugestão da rubrica (pastas criadas só quando houver conteúdo)
- [ ] README com problema, solução, tecnologias, integrantes e links para a documentação
- [ ] Todos os integrantes com acesso e com perfil identificável no GitHub

#### GA-02 — Configurar o GitHub Project, labels e milestones
**Sprint 1** · tarefa · P0 · 2 pts · Requisitos: RP08 · Rubrica: GA01, GA04

Quadro, views, campos personalizados, labels e milestones das 3 sprints.

Critérios de aceite:
- [ ] Project vinculado ao repositório com views Backlog, Quadro da Sprint e Roadmap
- [ ] Labels e milestones (Sprint 1, 2 e 3) criados
- [ ] Link do Project no README

#### GA-03 — Registrar o Product Backlog priorizado
**Sprint 1** · tarefa · P0 · 3 pts · Requisitos: RP06, RP08 (todos os RF/RNF/RP) · Rubrica: GA01, GA03

Transformar requisitos do desafio em épicos, histórias e tarefas priorizados (MoSCoW → P0/P1/P2).

Critérios de aceite:
- [ ] Todo RF, RNF e RP tem ao menos um item (matriz de rastreabilidade em docs/backlog.md)
- [ ] Cada item tem prioridade, estimativa e critérios de aceite verificáveis
- [ ] Backlog acessível a partir do README

#### GA-04 — Elaborar e validar o docs/plano-de-entregas.md
**Sprint 1** · tarefa · P0 · 3 pts · Requisitos: RP08 · Rubrica: GA01, GA02

Planejamento das três sprints exigido antes da 1ª entrega, a ser validado pelo professor.

Critérios de aceite:
- [ ] Tabela por sprint com Código, Requisito, Entrega concreta, Como verificar, Responsáveis, Evidência e Situação
- [ ] Tabela de integrantes por sprint (tarefas, contribuições, evidências)
- [ ] Critérios e pontuações da rubrica não alterados
- [ ] Retorno do professor registrado (ajustes viram issues)

#### GA-05 — Definir a Definition of Done e os templates de issue/PR
**Sprint 1** · tarefa · P0 · 2 pts · Requisitos: RP08 · Rubrica: GA07

DoD objetiva aplicada a todo item marcado como concluído.

Critérios de aceite:
- [ ] docs/definition-of-done.md versionado
- [ ] .github/pull_request_template.md com checklist da DoD e 'Closes #'
- [ ] .github/ISSUE_TEMPLATE para história e para bug/impedimento

#### GA-06 — Definir o fluxo de trabalho Git (branches, commits, PR com revisão)
**Sprint 1** · tarefa · P0 · 1 pts · Requisitos: RP08 · Rubrica: GA04, GA05, GA09

Convenção que gera rastreabilidade entre issue, branch, commit e PR.

Critérios de aceite:
- [ ] Fluxo documentado (ex.: feature/<id>-descricao; PR obrigatório com 1 revisão)
- [ ] Branch main protegida
- [ ] Commits e PRs referenciam as issues

#### GA-07 — Planejamento da Sprint 1
**Sprint 1** · tarefa · P0 · 2 pts · Requisitos: RP08 · Rubrica: GA02

Cerimônia de planejamento registrada no início da sprint.

Critérios de aceite:
- [ ] Objetivo da sprint registrado
- [ ] Itens selecionados com responsável, estimativa e critérios de aceite
- [ ] Capacidade da equipe considerada e registrada (pessoas × horas disponíveis)
- [ ] Justificativa da seleção; mudanças posteriores registradas com motivo

#### GA-08 — Sprint Review e Retrospectiva da Sprint 1
**Sprint 1** · tarefa · P0 · 2 pts · Requisitos: RP08 · Rubrica: GA06

Demonstração das funcionalidades concluídas, retorno recebido e análise do trabalho da equipe.

Critérios de aceite:
- [ ] Entregas demonstradas e retorno recebido registrados (docs/sprints/sprint-1.md)
- [ ] Retrospectiva: o que foi bem, dificuldades e ações de melhoria
- [ ] Registro de ações de melhoria para a sprint seguinte (viram issues)

#### GA-09 — Fechamento e entrega da Sprint 1 (tag sprint-1)
**Sprint 1** · tarefa · P0 · 2 pts · Requisitos: RP08 · Rubrica: GA02, GA04, GA07, GA08, GA09

Checklist de entrega antes do prazo.

Critérios de aceite:
- [ ] Situação de todos os itens atualizada; pendências com nova previsão
- [ ] Tabela de contribuições por integrante com links (issues, commits, PRs)
- [ ] README e instruções de execução/verificação conferidos em clone limpo
- [ ] Funcionalidades das sprints anteriores verificadas (sem regressão)
- [ ] Tag sprint-1 criada e link enviado ao professor

#### GA-10 — Planejamento da Sprint 2
**Sprint 2** · tarefa · P0 · 2 pts · Requisitos: RP08 · Rubrica: GA02

Cerimônia de planejamento registrada no início da sprint.

Critérios de aceite:
- [ ] Objetivo da sprint registrado
- [ ] Itens selecionados com responsável, estimativa e critérios de aceite
- [ ] Capacidade da equipe considerada e registrada (pessoas × horas disponíveis)
- [ ] Justificativa da seleção; mudanças posteriores registradas com motivo

#### GA-11 — Sprint Review e Retrospectiva da Sprint 2
**Sprint 2** · tarefa · P0 · 2 pts · Requisitos: RP08 · Rubrica: GA06

Demonstração das funcionalidades concluídas, retorno recebido e análise do trabalho da equipe.

Critérios de aceite:
- [ ] Entregas demonstradas e retorno recebido registrados (docs/sprints/sprint-2.md)
- [ ] Retrospectiva: o que foi bem, dificuldades e ações de melhoria
- [ ] Registro de ações de melhoria para a sprint seguinte (viram issues)

#### GA-12 — Fechamento e entrega da Sprint 2 (tag sprint-2)
**Sprint 2** · tarefa · P0 · 2 pts · Requisitos: RP08 · Rubrica: GA02, GA04, GA07, GA08, GA09

Checklist de entrega antes do prazo.

Critérios de aceite:
- [ ] Situação de todos os itens atualizada; pendências com nova previsão
- [ ] Tabela de contribuições por integrante com links (issues, commits, PRs)
- [ ] README e instruções de execução/verificação conferidos em clone limpo
- [ ] Funcionalidades das sprints anteriores verificadas (sem regressão)
- [ ] Tag sprint-2 criada e link enviado ao professor

#### GA-13 — Planejamento da Sprint 3
**Sprint 3** · tarefa · P0 · 2 pts · Requisitos: RP08 · Rubrica: GA02

Cerimônia de planejamento registrada no início da sprint.

Critérios de aceite:
- [ ] Objetivo da sprint registrado
- [ ] Itens selecionados com responsável, estimativa e critérios de aceite
- [ ] Capacidade da equipe considerada e registrada (pessoas × horas disponíveis)
- [ ] Justificativa da seleção; mudanças posteriores registradas com motivo

#### GA-14 — Sprint Review e Retrospectiva da Sprint 3
**Sprint 3** · tarefa · P0 · 2 pts · Requisitos: RP08 · Rubrica: GA06

Demonstração das funcionalidades concluídas, retorno recebido e análise do trabalho da equipe.

Critérios de aceite:
- [ ] Entregas demonstradas e retorno recebido registrados (docs/sprints/sprint-3.md)
- [ ] Retrospectiva: o que foi bem, dificuldades e ações de melhoria
- [ ] Registro de avaliação final e pendências (viram issues)

#### GA-15 — Fechamento e entrega da Sprint 3 (tag sprint-3)
**Sprint 3** · tarefa · P0 · 2 pts · Requisitos: RP08 · Rubrica: GA02, GA04, GA07, GA08, GA09

Checklist de entrega antes do prazo.

Critérios de aceite:
- [ ] Situação de todos os itens atualizada; pendências com nova previsão
- [ ] Tabela de contribuições por integrante com links (issues, commits, PRs)
- [ ] README e instruções de execução/verificação conferidos em clone limpo
- [ ] Funcionalidades das sprints anteriores verificadas (sem regressão)
- [ ] Tag sprint-3 criada e link enviado ao professor

### E02 · Arquitetura, ambiente e infraestrutura

_Scaffold, Docker Compose, CI e documentação de arquitetura._

#### IN-01 — Criar o scaffold do backend (NestJS + TypeScript)
**Sprint 1** · tarefa · P0 · 3 pts · Requisitos: RP02, RP04 · Rubrica: DW01, DW03, TP03

Projeto NestJS com módulos, configuração por ambiente e padrões de código.

Critérios de aceite:
- [ ] Aplicação NestJS inicia e responde a um health check
- [ ] tsconfig em modo strict; ESLint e Prettier configurados
- [ ] ConfigModule lendo variáveis de ambiente
- [ ] Pastas src/modules, src/integrations e src/database

#### IN-02 — Criar o scaffold do frontend (React + TypeScript)
**Sprint 1** · tarefa · P0 · 3 pts · Requisitos: RP01 · Rubrica: DW01, DW05

Projeto React/TS com a organização exigida pela rubrica.

Critérios de aceite:
- [ ] Vite + React + TypeScript (strict) executando
- [ ] Pastas pages, components, services, hooks, contexts e providers
- [ ] URL da API configurável por variável de ambiente
- [ ] Build de produção executa sem erros

#### IN-03 — Containerizar frontend, backend e PostgreSQL com Docker Compose
**Sprint 1** · história · P0 · 5 pts · Requisitos: RP05, RNF08 · Rubrica: DW07

Como avaliador, quero subir a aplicação completa só com Docker para verificar a versão entregue.

Critérios de aceite:
- [ ] `docker compose up` sobe frontend, backend e PostgreSQL a partir de um clone limpo
- [ ] .env.example documentado; .env no .gitignore; nenhum segredo no repositório
- [ ] README com passo a passo e como verificar que está funcionando

#### IN-04 — Configurar pipeline de CI (lint + testes a cada PR)
**Sprint 2** · tarefa · P2 · 3 pts · Requisitos: RNF07 · Rubrica: GA05, TP04

GitHub Actions executando lint e testes automaticamente.

Critérios de aceite:
- [ ] Workflow roda lint e testes em cada PR
- [ ] Falha do workflow é visível no PR

#### DOC-01 — Documentar a arquitetura inicial (docs/arquitetura.md)
**Sprint 1** · tarefa · P1 · 2 pts · Requisitos: RNF08 · Rubrica: DW07, TP01

Componentes, fluxo de dados e decisões arquiteturais justificadas.

Critérios de aceite:
- [ ] Componentes: frontend, backend, banco e APIs auxiliares
- [ ] Fluxo: coleta → cálculo → persistência → dashboard
- [ ] Decisões (ORM, bibliotecas) justificadas

### E03 · Integração com as APIs auxiliares

_Descoberta de serviços, coleta de métricas, intensidade de carbono e agendamento._

#### IT-01 — Spike: ler os Swagger das duas APIs e documentar os contratos
**Sprint 1** · spike · P0 · 2 pts · Requisitos: RF01, RF03 · Rubrica: DW02

Entender endpoints, campos, variações e erros antes de implementar.

Critérios de aceite:
- [ ] docs/api-externas.md com endpoints, parâmetros e exemplos reais de resposta
- [ ] Campos de localização e coordenadas mapeados (RF12/RF13)
- [ ] Dúvidas para o cliente registradas em issue

#### IT-02 — Spike: conferir a fórmula de cálculo e o escopo (energia/água)
**Sprint 1** · spike · P0 · 1 pts · Requisitos: RF07 · Rubrica: TP04

A apresentação e o PDF do desafio precisam ser confirmados na documentação viva (docs.unilaunch.org).

Critérios de aceite:
- [ ] Fórmula e constantes confirmadas em docs.unilaunch.org
- [ ] Divergência do exemplo (50,87 W por 60 s = 0,000848 kWh, mas o slide mostra 0,0008495 kWh) esclarecida ou registrada
- [ ] Registrado se 'água' é ou não requisito (o slide cita; o PDF não lista RF)
- [ ] Decisão registrada em docs/calculos.md

#### IT-03 — Consumir /services do Agregador (descoberta de serviços)
**Sprint 1** · história · P0 · 5 pts · Requisitos: RF01, RNF05 · Rubrica: DW02, TP02, TP05

Como sistema, quero descobrir os serviços disponíveis para monitorá-los.

Critérios de aceite:
- [ ] Client injetável que lista os serviços e mapeia para DTO tipado
- [ ] URL configurável por variável de ambiente
- [ ] Timeout/falha tratados sem derrubar a aplicação
- [ ] Teste unitário com o client HTTP substituído por double

#### IT-04 — Coletar /metrics/{id_servico} para cada serviço
**Sprint 1** · história · P0 · 5 pts · Requisitos: RF03, RF04 · Rubrica: DW02

Como sistema, quero coletar as métricas atuais de cada serviço.

Critérios de aceite:
- [ ] Métricas coletadas para todos os serviços listados e normalizadas (CPU, RAM, disco, rede)
- [ ] Valores variáveis tratados como amostras (nada assumido como fixo)
- [ ] Erro em um serviço não impede a coleta dos demais

#### IT-05 — Consumir a API de Intensidade de Carbono por região
**Sprint 2** · história · P0 · 5 pts · Requisitos: RF07, RNF05 · Rubrica: DW02

Como sistema, quero o fator gCO₂e/kWh da região de cada serviço.

Critérios de aceite:
- [ ] Fator obtido a partir da região/país do serviço
- [ ] Região sem fator → estado explícito 'intensidade indisponível' (nunca assume zero)
- [ ] Falha da API tratada sem interromper a aplicação

#### IT-06 — Agendar a coleta periódica com intervalo configurável
**Sprint 2** · história · P0 · 3 pts · Requisitos: RF03, RNF03 · Rubrica: DW02

Como sistema, quero coletar automaticamente em intervalos definidos.

Critérios de aceite:
- [ ] Job periódico (descoberta + coleta) sem execução sobreposta
- [ ] Intervalo configurável e documentado
- [ ] Log de cada ciclo (início, fim, falhas)

### E04 · Persistência (PostgreSQL + ORM)

_Entidades, migrações, repositories e histórico de coletas._

#### DB-01 — Escolher o ORM e configurar a conexão com o PostgreSQL
**Sprint 1** · tarefa · P0 · 3 pts · Requisitos: RP03 · Rubrica: DW04

ORM integrado ao NestJS, com a escolha justificada.

Critérios de aceite:
- [ ] ORM integrado ao NestJS conectando ao PostgreSQL do Compose
- [ ] Decisão registrada em docs/arquitetura.md
- [ ] Credenciais por variável de ambiente

#### DB-02 — Modelar as entidades e criar as migrações iniciais
**Sprint 1** · história · P0 · 5 pts · Requisitos: RP03, RF10, RNF08 · Rubrica: DW04

Como equipe, quero o esquema versionado para reproduzir o banco do zero.

Critérios de aceite:
- [ ] Entidades para serviço, coleta (data/hora + métricas), localização e fator de carbono
- [ ] Migrações versionadas aplicáveis a um banco vazio, com comando documentado
- [ ] Modelo de dados documentado em docs/arquitetura.md

#### DB-03 — Criar os repositories de serviços e coletas
**Sprint 1** · história · P0 · 3 pts · Requisitos: RP04, RF10 · Rubrica: DW03, DW04, TP02

Persistência concentrada em repositories injetáveis.

Critérios de aceite:
- [ ] Gravação e leitura de serviços e coletas verificáveis na aplicação
- [ ] Services não acessam o ORM diretamente
- [ ] Repositories registrados como providers (substituíveis em testes)

#### DB-04 — Histórico de coletas com consulta por período
**Sprint 2** · história · P0 · 5 pts · Requisitos: RF10 · Rubrica: DW04

Como gestor, quero analisar a evolução ao longo do tempo.

Critérios de aceite:
- [ ] Cada coleta gravada com data/hora
- [ ] Consulta por serviço e intervalo de datas
- [ ] Novas migrações sem quebrar as anteriores

### E05 · Cálculo de energia e CO₂e

_Regras de cálculo fora dos controllers, com testes._

#### CA-01 — Calcular a potência (W) a partir de CPU, RAM, disco e rede
**Sprint 2** · história · P0 · 5 pts · Requisitos: RF07, RP04, RNF07 · Rubrica: TP01, TP04

Regra de domínio isolada dos controllers.

Critérios de aceite:
- [ ] Serviço de cálculo fora dos controllers
- [ ] Constantes (100 W de CPU, 0,375 W/GB RAM, 0,01 W/GB disco, 0,02 W/GB rede) configuráveis e documentadas
- [ ] Exemplo do desafio (50,87 W) reproduzido em teste unitário

#### CA-02 — Calcular energia (kWh) e emissão (gCO₂e)
**Sprint 2** · história · P0 · 3 pts · Requisitos: RF07 · Rubrica: TP01, TP04

Energia = potência × intervalo; CO₂e = kWh × intensidade.

Critérios de aceite:
- [ ] Exemplo do desafio (≈0,072 gCO₂e a 85 gCO₂e/kWh) reproduzido em teste
- [ ] Unidades explícitas nas respostas

#### CA-03 — Tratar dados ausentes ou inválidos no cálculo
**Sprint 2** · tarefa · P0 · 2 pts · Requisitos: RF06, RNF05, RNF07 · Rubrica: TP04, TP05

Ausência de dado nunca vira zero silenciosamente.

Critérios de aceite:
- [ ] Métrica ausente → resultado 'não calculável'
- [ ] Valores negativos/fora de faixa rejeitados
- [ ] Testes cobrem ausência e falha

#### CA-04 — Calcular os indicadores agregados do ambiente
**Sprint 2** · história · P0 · 3 pts · Requisitos: RF08 · Rubrica: DW03

Como gestor, quero totais consolidados do ambiente monitorado.

Critérios de aceite:
- [ ] Consumo total, emissão total, nº de ativos, indisponíveis e sem métricas
- [ ] Período considerado informado na resposta
- [ ] Regra para serviços sem cálculo documentada e testada

#### CA-05 — Documentar fórmulas, unidades e exemplos (docs/calculos.md)
**Sprint 2** · tarefa · P1 · 2 pts · Requisitos: RNF08 · Rubrica: TP01

Documentação das estimativas de energia e CO₂e.

Critérios de aceite:
- [ ] Fórmulas, unidades, fatores, períodos e exemplo numérico
- [ ] Premissas e limitações (estimativa, não medição direta)

### E06 · Monitoramento dinâmico e estados

_Classificação de estados, reconciliação de serviços e tolerância a falhas._

#### MD-01 — Classificar o estado de cada serviço
**Sprint 2** · história · P0 · 5 pts · Requisitos: RF05, RF06, RNF07 · Rubrica: TP01, TP04

Como gestor, quero saber se o serviço está ativo, indisponível ou sem métricas.

Critérios de aceite:
- [ ] Estados: ativo, indisponível, sem métricas (e removido)
- [ ] Regra em classe própria, fora dos controllers
- [ ] Critérios documentados (sem resposta → indisponível; listado em /services sem métricas → sem métricas)

#### MD-02 — Reconciliar a lista de serviços a cada ciclo
**Sprint 2** · história · P0 · 5 pts · Requisitos: RF02 · Rubrica: DW02

Como gestor, quero que novos, removidos e retornados apareçam sem reiniciar.

Critérios de aceite:
- [ ] Serviço novo aparece automaticamente
- [ ] Serviço removido é marcado e mantém o histórico
- [ ] Serviço que volta passa a ativo; transições registradas com data/hora

#### MD-03 — Garantir tolerância a falhas das APIs auxiliares
**Sprint 2** · tarefa · P0 · 3 pts · Requisitos: RNF05 · Rubrica: TP05

Indisponibilidade de uma API não derruba a aplicação.

Critérios de aceite:
- [ ] Agregador ou Carbon API fora do ar: aplicação continua respondendo
- [ ] Últimos dados mantidos com aviso de defasagem
- [ ] Erros HTTP coerentes com corpo estruturado

#### MD-04 — Testes unitários de estados e reconciliação
**Sprint 2** · tarefa · P0 · 3 pts · Requisitos: RNF07 · Rubrica: TP02, TP04

Casos esperados e de ausência/falha.

Critérios de aceite:
- [ ] Cenários: ativo, indisponível, sem métricas, novo, removido, retorno
- [ ] Client e repository substituídos por doubles
- [ ] `npm test` documentado e passando

### E07 · API REST do backend

_Endpoints, DTOs, validação, tratamento de erros e documentação._

#### API-01 — Endpoint GET /services
**Sprint 1** · história · P0 · 3 pts · Requisitos: RF09, RF12 · Rubrica: DW03

Como frontend, quero listar os serviços com estado e localização.

Critérios de aceite:
- [ ] Retorna serviços com estado básico e localização (país, região, cidade quando houver)
- [ ] DTO de resposta, JSON consistente, códigos HTTP coerentes
- [ ] Verificado com requisição real (Swagger ou curl documentado)

#### API-02 — Validação de entrada e tratamento global de exceções
**Sprint 2** · tarefa · P0 · 3 pts · Requisitos: RP02, RNF06 · Rubrica: TP05

Entradas validadas e erros com formato padronizado.

Critérios de aceite:
- [ ] ValidationPipe global com DTOs
- [ ] Filtro de exceções com formato de erro padrão
- [ ] Entrada inválida → 400; sem stack trace exposto

#### API-03 — Endpoints de histórico e indicadores (/services/:id/history e /summary)
**Sprint 2** · história · P0 · 5 pts · Requisitos: RF08, RF10 · Rubrica: DW03

Como frontend, quero série temporal e totais consolidados.

Critérios de aceite:
- [ ] Parâmetros from/to validados
- [ ] Respostas informam período e unidades
- [ ] 404 para serviço inexistente

#### API-04 — Documentar endpoints com OpenAPI/Swagger e docs/api.md
**Sprint 1** · tarefa · P1 · 2 pts · Requisitos: RNF08 · Rubrica: DW03, DW07

Documentação atualizada a cada sprint.

Critérios de aceite:
- [ ] Swagger do backend acessível
- [ ] docs/api.md com métodos, parâmetros, respostas e autenticação exigida

#### API-05 — Endpoints de ranking e comparação
**Sprint 3** · história · P0 · 5 pts · Requisitos: RF14, RF15 · Rubrica: DW03

Como gestor, quero ordenar e comparar serviços no mesmo período.

Critérios de aceite:
- [ ] GET /ranking?metric=energia|co2e&from&to ordena e informa o período
- [ ] GET /compare?ids=..&from&to retorna dados do mesmo período para 2+ serviços
- [ ] Menos de 2 ids → 400

### E08 · Dashboard (frontend)

_Dashboard operacional, indicadores, ranking, comparação e mapa._

#### FE-01 — Camada de acesso à API e provider de dados
**Sprint 1** · tarefa · P0 · 3 pts · Requisitos: RP01 · Rubrica: DW05

Chamadas HTTP concentradas em services; hooks para busca.

Critérios de aceite:
- [ ] Chamadas HTTP apenas em services/
- [ ] Hook de busca com estados loading/erro/dados
- [ ] URL da API por variável de ambiente

#### FE-02 — Vertical slice: listar serviços do backend na tela inicial
**Sprint 1** · história · P1 · 2 pts · Requisitos: RF09 · Rubrica: DW05, IHC02

Valida a integração ponta a ponta no ambiente Docker.

Critérios de aceite:
- [ ] Página lista os serviços de GET /services em ambiente Docker
- [ ] Erro da API exibe mensagem compreensível

#### FE-03 — Dashboard operacional por serviço
**Sprint 2** · história · P0 · 5 pts · Requisitos: RF09, RF12, RP06 · Rubrica: DW05, IHC03

Como gestor, quero ver o estado, a localização e o impacto de cada serviço.

Critérios de aceite:
- [ ] Por serviço: estado, país/região/cidade, métricas disponíveis, energia (kWh) e CO₂e (g)
- [ ] Unidades e período visíveis
- [ ] Consome a API do backend (sem dados fixos no código)

#### FE-04 — Cards de indicadores consolidados
**Sprint 2** · história · P0 · 3 pts · Requisitos: RF08 · Rubrica: IHC03

Como gestor, quero uma visão geral do ambiente.

Critérios de aceite:
- [ ] Consumo total, emissão total, ativos, indisponíveis e sem métricas
- [ ] Período e unidade visíveis

#### FE-05 — Atualização automática e 'última atualização'
**Sprint 2** · história · P0 · 3 pts · Requisitos: RF11, RNF03 · Rubrica: IHC03

Como gestor, quero dados atualizados sem recarregar a página.

Critérios de aceite:
- [ ] Atualização periódica sem reload
- [ ] Intervalo informado na tela e na documentação
- [ ] Data/hora da última atualização visível; falha de atualização sinalizada

#### FE-06 — Estados e alertas por texto e ícone (não só cor)
**Sprint 2** · tarefa · P0 · 2 pts · Requisitos: RNF02 · Rubrica: IHC03

Acessibilidade da informação.

Critérios de aceite:
- [ ] 'Ativo', 'indisponível' e 'sem métricas' com texto/ícone
- [ ] Erros e alertas identificáveis sem depender de cor
- [ ] Verificado com simulação de daltonismo/escala de cinza

#### FE-07 — Estados de carregamento, vazio e erro
**Sprint 2** · tarefa · P0 · 3 pts · Requisitos: RNF05, RNF01 · Rubrica: IHC04

Feedback ao usuário em todas as situações.

Critérios de aceite:
- [ ] Carregando, sem dados, serviço indisponível e API fora do ar tratados
- [ ] A aplicação nunca fica em tela branca

#### FE-08 — Gráfico de histórico por serviço
**Sprint 3** · história · P1 · 5 pts · Requisitos: RF10 · Rubrica: IHC03

Como gestor, quero ver a evolução temporal.

Critérios de aceite:
- [ ] Série de energia/CO₂e no período selecionado
- [ ] Eixos com unidade; sem dados → mensagem

#### FE-09 — Ranking de impacto
**Sprint 3** · história · P0 · 3 pts · Requisitos: RF14 · Rubrica: IHC03

Como gestor, quero saber quais serviços mais impactam.

Critérios de aceite:
- [ ] Ordenação por energia ou CO₂e
- [ ] Período considerado exibido

#### FE-10 — Comparação entre serviços
**Sprint 3** · história · P0 · 5 pts · Requisitos: RF15 · Rubrica: IHC03

Como gestor, quero comparar serviços no mesmo período.

Critérios de aceite:
- [ ] Seleção de 2 ou mais serviços
- [ ] Métricas e indicadores do mesmo período lado a lado

#### FE-11 — Mapa geográfico dos serviços
**Sprint 3** · história · P2 · 5 pts · Requisitos: RF13 · Rubrica: IHC03

Item opcional no desafio (RF13 diz 'poderá').

Critérios de aceite:
- [ ] Marcadores para serviços com latitude/longitude
- [ ] Serviços sem coordenadas continuam visíveis no restante da interface
- [ ] Falha do mapa não quebra o dashboard

#### FE-12 — Responsividade e desempenho
**Sprint 3** · tarefa · P0 · 3 pts · Requisitos: RNF01, RNF04 · Rubrica: IHC04

Uso em navegadores e dispositivos móveis.

Critérios de aceite:
- [ ] Telas utilizáveis em celular, tablet e desktop (verificação registrada)
- [ ] Lista grande sem travar (memoização/paginação)

### E09 · Autenticação e configuração

_Login, JWT, rotas protegidas e área de configuração._

#### AU-01 — Login com senha em hash e emissão de JWT
**Sprint 3** · história · P0 · 5 pts · Requisitos: RF16, RP07, RNF06 · Rubrica: DW06

Como responsável pela configuração, quero me autenticar.

Critérios de aceite:
- [ ] Senha armazenada com hash (bcrypt/argon2)
- [ ] Login válido retorna JWT com expiração; inválido → 401
- [ ] JWT_SECRET por variável de ambiente

#### AU-02 — Proteger rotas de configuração (guard JWT + DTO)
**Sprint 3** · história · P0 · 3 pts · Requisitos: RF16, RP07, RNF06 · Rubrica: DW06

Controle de acesso validado no backend.

Critérios de aceite:
- [ ] Sem token ou token inválido/expirado → 401
- [ ] Dados da alteração validados por DTO
- [ ] Consulta ao dashboard continua pública

#### AU-03 — Área de configuração do monitoramento
**Sprint 3** · história · P0 · 5 pts · Requisitos: RF16, RNF03 · Rubrica: DW06

Parâmetros a confirmar com o cliente (ex.: intervalo de coleta).

Critérios de aceite:
- [ ] Usuário autenticado altera parâmetros de monitoramento
- [ ] Valores validados e persistidos; efeito sem reiniciar
- [ ] Parâmetros editáveis definidos e documentados

#### AU-04 — Tela de login e rota protegida no frontend
**Sprint 3** · história · P0 · 3 pts · Requisitos: RF16 · Rubrica: DW06, IHC03

Experiência de login (a segurança real é do backend).

Critérios de aceite:
- [ ] Login e logout funcionando
- [ ] Rota de configuração redireciona não autenticados

#### AU-05 — Usuário inicial por seed e variáveis de ambiente
**Sprint 3** · tarefa · P0 · 2 pts · Requisitos: RNF06 · Rubrica: DW06

Sem credenciais no repositório.

Critérios de aceite:
- [ ] Usuário criado por seed lendo variáveis de ambiente
- [ ] Procedimento documentado no README

### E10 · Interação Humano-Computador

_Usuários, protótipos, diretrizes e avaliação de usabilidade._

#### UX-01 — Identificar usuários e tarefas prioritárias
**Sprint 1** · tarefa · P0 · 3 pts · Requisitos: RP09 · Rubrica: IHC01

Perfis a partir do desafio: equipes técnicas, gestores/ESG, visitante público e responsável pela configuração.

Critérios de aceite:
- [ ] docs/interface.md com perfis, objetivos e tarefas prioritárias no dashboard
- [ ] Relação entre tarefas e requisitos

#### UX-02 — Protótipo das principais telas e fluxo de navegação
**Sprint 1** · história · P0 · 5 pts · Requisitos: RP09, RP06, RNF01 · Rubrica: IHC02

Como equipe, quero validar as telas antes de implementá-las.

Critérios de aceite:
- [ ] Dashboard, detalhe do serviço, ranking/comparação, mapa e login/configuração prototipados
- [ ] Fluxo de navegação representado; estados dos serviços incluídos
- [ ] Link/versão do protótipo registrado em docs/interface.md

#### UX-03 — Definir diretrizes de apresentação dos indicadores
**Sprint 2** · tarefa · P1 · 2 pts · Requisitos: RNF02, RNF03 · Rubrica: IHC03

Padronizar unidades, períodos, estados e ícones.

Critérios de aceite:
- [ ] Unidades, período de referência, última atualização e estados documentados em docs/interface.md

#### UX-04 — Planejar a avaliação de usabilidade
**Sprint 2** · tarefa · P0 · 2 pts · Requisitos: RP09 · Rubrica: IHC05

Roteiro pronto antes da execução.

Critérios de aceite:
- [ ] Roteiro, tarefas, perfil e nº de participantes definidos (sugestão: 3 a 5)
- [ ] Plano preserva dados pessoais dos participantes

#### UX-05 — Executar a avaliação de usabilidade e registrar resultados
**Sprint 3** · história · P0 · 3 pts · Requisitos: RP09 · Rubrica: IHC05

Avaliação com usuários representativos.

Critérios de aceite:
- [ ] Sessões realizadas conforme o roteiro
- [ ] Resultados e problemas por gravidade em docs/interface.md, sem dados pessoais

#### UX-06 — Aplicar as melhorias decorrentes da avaliação
**Sprint 3** · história · P0 · 3 pts · Requisitos: RP09 · Rubrica: IHC06

Fechar o ciclo avaliação → mudança.

Critérios de aceite:
- [ ] Cada problema vira issue ou pendência justificada
- [ ] Alterações no código/protótipo ligadas ao achado
- [ ] Antes/depois registrado em docs/interface.md

### E11 · Qualidade e documentação final

_Testes, SOLID, tipagem, README e portfólio._

#### QA-01 — Configurar testes (Jest) e script de execução
**Sprint 1** · tarefa · P0 · 2 pts · Requisitos: RNF07 · Rubrica: TP04, DW07

Base para os testes unitários das sprints seguintes.

Critérios de aceite:
- [ ] `npm test` roda no backend e está documentado no backend/README
- [ ] Ao menos um teste de exemplo passando

#### QA-02 — Justificar SOLID e injeção de dependências na arquitetura
**Sprint 2** · tarefa · P1 · 2 pts · Requisitos: RP04 · Rubrica: TP01, TP02

Ligar decisões ao código real.

Critérios de aceite:
- [ ] Seção em docs/arquitetura.md com exemplos concretos (arquivos/classes)
- [ ] Clients e repositories injetados por providers

#### QA-03 — Revisão de tipagem e código limpo
**Sprint 3** · tarefa · P1 · 3 pts · Requisitos: RNF07 · Rubrica: TP03

Sem any injustificado, duplicação ou código morto.

Critérios de aceite:
- [ ] ESLint sem erros
- [ ] Sem any injustificado; DTOs e tipos coerentes
- [ ] Duplicações e código morto removidos

#### QA-04 — Testes unitários das regras da Sprint 3 (ranking, comparação, auth)
**Sprint 3** · tarefa · P0 · 3 pts · Requisitos: RNF07, RNF06 · Rubrica: TP04, TP05

Cobertura das regras novas.

Critérios de aceite:
- [ ] Casos esperados e de dados ausentes/falha
- [ ] Dependências substituídas por doubles

#### QA-05 — Conferir README, comandos e links (uso como portfólio)
**Sprint 3** · tarefa · P0 · 2 pts · Requisitos: RNF08 · Rubrica: GA08, DW07

Outra pessoa deve conseguir rodar tudo só pelo README.

Critérios de aceite:
- [ ] Clone limpo → containers → migrações → testes funcionando só pelo README
- [ ] Todos os links e descrições conferidos

## 5. Matriz de rastreabilidade (requisito → itens)

| Requisito | Itens |
|---|---|
| RF01 | IT-01, IT-03 |
| RF02 | MD-02 |
| RF03 | IT-01, IT-04, IT-06 |
| RF04 | IT-04 |
| RF05 | MD-01 |
| RF06 | CA-03, MD-01 |
| RF07 | IT-02, IT-05, CA-01, CA-02 |
| RF08 | CA-04, API-03, FE-04 |
| RF09 | API-01, FE-02, FE-03 |
| RF10 | DB-02, DB-03, DB-04, API-03, FE-08 |
| RF11 | FE-05 |
| RF12 | API-01, FE-03 |
| RF13 | FE-11 |
| RF14 | API-05, FE-09 |
| RF15 | API-05, FE-10 |
| RF16 | AU-01, AU-02, AU-03, AU-04 |
| RNF01 | FE-07, FE-12, UX-02 |
| RNF02 | FE-06, UX-03 |
| RNF03 | IT-06, FE-05, AU-03, UX-03 |
| RNF04 | FE-12 |
| RNF05 | IT-03, IT-05, CA-03, MD-03, FE-07 |
| RNF06 | API-02, AU-01, AU-02, AU-05, QA-04 |
| RNF07 | IN-04, CA-01, CA-03, MD-01, MD-04, QA-01, QA-03, QA-04 |
| RNF08 | IN-03, DOC-01, DB-02, CA-05, API-04, QA-05 |
| RP01 | IN-02, FE-01 |
| RP02 | IN-01, API-02 |
| RP03 | DB-01, DB-02 |
| RP04 | IN-01, DB-03, CA-01, QA-02 |
| RP05 | IN-03 |
| RP06 | GA-03, FE-03, UX-02 |
| RP07 | AU-01, AU-02 |
| RP08 | GA-01, GA-02, GA-03, GA-04, GA-05, GA-06, GA-07, GA-08, GA-09, GA-10, GA-11, GA-12, GA-13, GA-14, GA-15 |
| RP09 | UX-01, UX-02, UX-04, UX-05, UX-06 |
